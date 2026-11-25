const { Router } = require('express');
const { exigirLogin, exigirAdmin } = require('../auth');
const { calcularFrete } = require('../frete');
const { traduzirPagamento } = require('../mercadopago');
const { validarEndereco, normalizarEndereco } = require('../validacao');

const STATUS = ['aguardando_pagamento', 'pago', 'recusado', 'em_preparo', 'enviado', 'entregue', 'cancelado'];
// Status que ainda podem mudar por causa de um pagamento
const AGUARDANDO = ['aguardando_pagamento', 'recusado'];
const arred = (v) => Math.round(v * 100) / 100;

module.exports = function rotasPedidos(db, mp) {
  const r = Router();
  r.use(exigirLogin(db));

  function carregar(id) {
    const pedido = db.prepare(`
      SELECT p.*, u.nome AS cliente_nome, u.email AS cliente_email
      FROM pedidos p JOIN usuarios u ON u.id = p.usuario_id WHERE p.id = ?
    `).get(id);
    if (!pedido) return null;
    pedido.itens = db.prepare('SELECT * FROM itens_pedido WHERE pedido_id = ? ORDER BY id').all(id);
    return pedido;
  }

  /** Busca o pedido e confere se pertence a quem pediu (ou se é a admin). */
  function pedidoPermitido(req, res) {
    const pedido = carregar(req.params.id);
    if (!pedido) {
      res.status(404).json({ erro: 'Pedido não encontrado.' });
      return null;
    }
    if (pedido.usuario_id !== req.usuario.id && req.usuario.perfil !== 'admin') {
      res.status(403).json({ erro: 'Esse pedido não é seu.' });
      return null;
    }
    return pedido;
  }

  async function gerarCheckout(pedido) {
    if (!mp.configurado) return { modo: 'simulado', url: null };
    const comprador = { nome: pedido.cliente_nome, email: pedido.cliente_email };
    const pref = await mp.criarPreferencia(pedido, pedido.itens, comprador);
    db.prepare('UPDATE pedidos SET mp_preference_id = ? WHERE id = ?').run(pref.id, pedido.id);
    return { modo: 'mercado_pago', url: pref.url, urlSandbox: pref.urlSandbox };
  }

  function atualizarPagamento(pedidoId, dados) {
    db.prepare(`
      UPDATE pedidos SET status = @status, metodo_pagamento = COALESCE(@metodo_pagamento, metodo_pagamento),
             mp_payment_id = COALESCE(@mp_payment_id, mp_payment_id), atualizado_em = datetime('now')
      WHERE id = @id
    `).run({ id: pedidoId, metodo_pagamento: null, mp_payment_id: null, ...dados });
  }

  // CREATE - finalizar compra. O preço vem SEMPRE do banco, nunca do app.
  r.post('/', async (req, res, next) => {
    try {
      const itensPedidos = Array.isArray(req.body?.itens) ? req.body.itens : [];
      const endereco = req.body?.endereco || {};
      const erros = validarEndereco(endereco);
      if (itensPedidos.length === 0) erros.unshift('O carrinho está vazio.');
      if (erros.length) return res.status(400).json({ erro: erros[0], erros });

      const itens = [];
      for (const it of itensPedidos) {
        const quantidade = Number(it.quantidade);
        if (!Number.isInteger(quantidade) || quantidade < 1 || quantidade > 99) {
          return res.status(400).json({ erro: 'Quantidade inválida.' });
        }
        const produto = db.prepare('SELECT * FROM produtos WHERE id = ? AND ativo = 1').get(it.produto_id);
        if (!produto) return res.status(400).json({ erro: 'Um dos produtos não está mais disponível.' });
        itens.push({ produto, quantidade });
      }

      const end = normalizarEndereco(endereco);
      const subtotal = arred(itens.reduce((s, it) => s + it.produto.preco * it.quantidade, 0));
      const frete = calcularFrete(end.uf, subtotal);
      const total = arred(subtotal + frete);

      const pedidoId = db.transaction(() => {
        const info = db.prepare(`
          INSERT INTO pedidos (usuario_id, subtotal, frete, total, cep, logradouro, numero, complemento, bairro, cidade, uf)
          VALUES (@usuario_id, @subtotal, @frete, @total, @cep, @logradouro, @numero, @complemento, @bairro, @cidade, @uf)
        `).run({ usuario_id: req.usuario.id, subtotal, frete, total, ...end });
        const inserirItem = db.prepare(`
          INSERT INTO itens_pedido (pedido_id, produto_id, nome, categoria, preco_unitario, quantidade)
          VALUES (?, ?, ?, ?, ?, ?)
        `);
        for (const it of itens) {
          inserirItem.run(info.lastInsertRowid, it.produto.id, it.produto.nome, it.produto.categoria,
            it.produto.preco, it.quantidade);
        }
        return info.lastInsertRowid;
      })();

      let pedido = carregar(pedidoId);
      let pagamento;
      try {
        pagamento = await gerarCheckout(pedido);
      } catch (e) {
        // Se o Mercado Pago falhar, o pedido não fica pendurado no banco
        db.prepare('DELETE FROM pedidos WHERE id = ?').run(pedidoId);
        return res.status(502).json({ erro: `Não foi possível iniciar o pagamento: ${e.message}` });
      }
      pedido = carregar(pedidoId);
      res.status(201).json({ pedido, pagamento });
    } catch (e) {
      next(e);
    }
  });

  // READ - lista: a cliente vê os dela, a admin vê todos (pode filtrar por status)
  r.get('/', (req, res) => {
    const admin = req.usuario.perfil === 'admin';
    const filtros = [];
    const params = {};
    if (!admin) {
      filtros.push('p.usuario_id = @usuario');
      params.usuario = req.usuario.id;
    }
    if (req.query.status) {
      filtros.push('p.status = @status');
      params.status = String(req.query.status);
    }
    const pedidos = db.prepare(`
      SELECT p.*, u.nome AS cliente_nome,
             (SELECT SUM(quantidade) FROM itens_pedido i WHERE i.pedido_id = p.id) AS quantidade_itens
      FROM pedidos p JOIN usuarios u ON u.id = p.usuario_id
      ${filtros.length ? 'WHERE ' + filtros.join(' AND ') : ''}
      ORDER BY p.criado_em DESC, p.id DESC
      LIMIT 200
    `).all(params);
    res.json(pedidos);
  });

  // READ - detalhe
  r.get('/:id', (req, res) => {
    const pedido = pedidoPermitido(req, res);
    if (pedido) res.json(pedido);
  });

  // Gera um novo link de pagamento para um pedido que ainda não foi pago
  r.post('/:id/pagar', async (req, res, next) => {
    try {
      const pedido = pedidoPermitido(req, res);
      if (!pedido) return;
      if (!AGUARDANDO.includes(pedido.status)) {
        return res.status(409).json({ erro: 'Esse pedido não está aguardando pagamento.' });
      }
      res.json({ pedido, pagamento: await gerarCheckout(pedido) });
    } catch (e) {
      res.status(502).json({ erro: `Não foi possível iniciar o pagamento: ${e.message}` });
    }
  });

  // SINCRONIZAÇÃO - pergunta ao Mercado Pago qual é a situação do pagamento
  r.post('/:id/sincronizar', async (req, res) => {
    const pedido = pedidoPermitido(req, res);
    if (!pedido) return;
    if (!mp.configurado || !AGUARDANDO.includes(pedido.status)) return res.json(pedido);
    try {
      const pagamento = await mp.buscarPagamentoDoPedido(pedido.id);
      if (pagamento) atualizarPagamento(pedido.id, traduzirPagamento(pagamento));
      res.json(carregar(pedido.id));
    } catch (e) {
      res.status(502).json({ erro: `Não foi possível consultar o Mercado Pago: ${e.message}` });
    }
  });

  // Modo demonstração (sem MP_ACCESS_TOKEN): simula a resposta do pagamento
  r.post('/:id/simular-pagamento', (req, res) => {
    if (mp.configurado) {
      return res.status(409).json({ erro: 'O Mercado Pago está configurado; pague pelo checkout.' });
    }
    const pedido = pedidoPermitido(req, res);
    if (!pedido) return;
    if (!AGUARDANDO.includes(pedido.status)) {
      return res.status(409).json({ erro: 'Esse pedido não está aguardando pagamento.' });
    }
    const aprovado = req.body?.aprovado !== false;
    atualizarPagamento(pedido.id, {
      status: aprovado ? 'pago' : 'recusado',
      metodo_pagamento: req.body?.metodo || 'pix',
    });
    res.json(carregar(pedido.id));
  });

  // A cliente pode cancelar enquanto não pagou
  r.post('/:id/cancelar', (req, res) => {
    const pedido = pedidoPermitido(req, res);
    if (!pedido) return;
    if (!AGUARDANDO.includes(pedido.status)) {
      return res.status(409).json({ erro: 'Só dá para cancelar pedidos que ainda não foram pagos.' });
    }
    atualizarPagamento(pedido.id, { status: 'cancelado' });
    res.json(carregar(pedido.id));
  });

  // UPDATE - a administradora muda o andamento (em preparo, enviado, entregue...)
  r.patch('/:id/status', exigirAdmin, (req, res) => {
    const status = req.body?.status;
    if (!STATUS.includes(status)) return res.status(400).json({ erro: 'Status inválido.' });
    if (!carregar(req.params.id)) return res.status(404).json({ erro: 'Pedido não encontrado.' });
    atualizarPagamento(req.params.id, { status });
    res.json(carregar(req.params.id));
  });

  return r;
};

module.exports.STATUS = STATUS;
module.exports.AGUARDANDO = AGUARDANDO;
