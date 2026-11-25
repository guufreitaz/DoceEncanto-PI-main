const { Router } = require('express');
const { exigirLogin, exigirAdmin } = require('../auth');
const { texto, validarProduto } = require('../validacao');

/** CRUD de produtos. Leitura é pública; criar, alterar e excluir só para a administradora. */
module.exports = function rotasProdutos(db) {
  const r = Router();
  const buscar = (id) => db.prepare('SELECT * FROM produtos WHERE id = ?').get(id);
  const formatar = (p) => p && { ...p, ativo: Boolean(p.ativo) };

  // READ - lista (com filtro por categoria e busca por nome)
  r.get('/', (req, res) => {
    const filtros = ['ativo = 1'];
    const params = {};
    if (req.query.categoria) {
      filtros.push('categoria = @categoria');
      params.categoria = String(req.query.categoria);
    }
    if (req.query.busca) {
      filtros.push('nome LIKE @busca');
      params.busca = `%${String(req.query.busca)}%`;
    }
    // A tela de administração também vê produtos desativados
    if (req.query.todos === '1') filtros.shift();
    const sql = `SELECT * FROM produtos ${filtros.length ? 'WHERE ' + filtros.join(' AND ') : ''} ORDER BY categoria, nome`;
    res.json(db.prepare(sql).all(params).map(formatar));
  });

  // READ - um produto
  r.get('/:id', (req, res) => {
    const p = buscar(req.params.id);
    if (!p) return res.status(404).json({ erro: 'Produto não encontrado.' });
    res.json(formatar(p));
  });

  // CREATE
  r.post('/', exigirLogin(db), exigirAdmin, (req, res) => {
    const b = req.body || {};
    const erros = validarProduto(b);
    if (erros.length) return res.status(400).json({ erro: erros[0], erros });

    const info = db.prepare(`
      INSERT INTO produtos (nome, descricao, preco, categoria, imagem, ativo)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(texto(b.nome), texto(b.descricao), Math.round(Number(b.preco) * 100) / 100, b.categoria,
      b.imagem || null, b.ativo === false ? 0 : 1);
    res.status(201).json(formatar(buscar(info.lastInsertRowid)));
  });

  // UPDATE
  r.put('/:id', exigirLogin(db), exigirAdmin, (req, res) => {
    if (!buscar(req.params.id)) return res.status(404).json({ erro: 'Produto não encontrado.' });
    const b = req.body || {};
    const erros = validarProduto(b);
    if (erros.length) return res.status(400).json({ erro: erros[0], erros });

    db.prepare(`
      UPDATE produtos SET nome = ?, descricao = ?, preco = ?, categoria = ?, imagem = ?, ativo = ?,
             atualizado_em = datetime('now')
      WHERE id = ?
    `).run(texto(b.nome), texto(b.descricao), Math.round(Number(b.preco) * 100) / 100, b.categoria,
      b.imagem || null, b.ativo === false ? 0 : 1, req.params.id);
    res.json(formatar(buscar(req.params.id)));
  });

  // DELETE - se o produto já foi vendido, só desativa (para não perder o histórico de pedidos)
  r.delete('/:id', exigirLogin(db), exigirAdmin, (req, res) => {
    if (!buscar(req.params.id)) return res.status(404).json({ erro: 'Produto não encontrado.' });
    const vendido = db.prepare('SELECT 1 FROM itens_pedido WHERE produto_id = ? LIMIT 1').get(req.params.id);
    if (vendido) {
      db.prepare("UPDATE produtos SET ativo = 0, atualizado_em = datetime('now') WHERE id = ?").run(req.params.id);
      return res.json({ removido: true, modo: 'desativado' });
    }
    db.prepare('DELETE FROM produtos WHERE id = ?').run(req.params.id);
    res.json({ removido: true, modo: 'excluido' });
  });

  return r;
};
