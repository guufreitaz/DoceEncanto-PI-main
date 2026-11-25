const { Router } = require('express');
const { exigirLogin, exigirAdmin } = require('../auth');

/**
 * Exportação em JSON para o dashboard de Análise de Dados e Estatística.
 * Não exporta nome, e-mail, telefone nem endereço completo dos clientes (só cidade/UF).
 */
module.exports = function rotasRelatorios(db) {
  const r = Router();

  r.get('/export', exigirLogin(db), exigirAdmin, (req, res) => {
    const produtos = db.prepare('SELECT id, nome, categoria, preco, ativo, criado_em FROM produtos ORDER BY id').all()
      .map((p) => ({ ...p, ativo: Boolean(p.ativo) }));

    const clientes = db.prepare(`
      SELECT id, cidade, uf, criado_em FROM usuarios WHERE perfil = 'cliente' ORDER BY id
    `).all();

    const itens = db.prepare('SELECT * FROM itens_pedido ORDER BY pedido_id, id').all();
    const itensPorPedido = new Map();
    for (const it of itens) {
      if (!itensPorPedido.has(it.pedido_id)) itensPorPedido.set(it.pedido_id, []);
      itensPorPedido.get(it.pedido_id).push({
        produto_id: it.produto_id,
        nome: it.nome,
        categoria: it.categoria,
        quantidade: it.quantidade,
        preco_unitario: it.preco_unitario,
        subtotal: Math.round(it.quantidade * it.preco_unitario * 100) / 100,
      });
    }

    const pedidos = db.prepare(`
      SELECT id, usuario_id AS cliente_id, status, metodo_pagamento, subtotal, frete, total, cidade, uf, criado_em
      FROM pedidos ORDER BY criado_em, id
    `).all().map((p) => ({ ...p, itens: itensPorPedido.get(p.id) || [] }));

    const contatos = db.prepare('SELECT id, assunto, respondida, criado_em FROM mensagens_contato ORDER BY id').all()
      .map((m) => ({ ...m, respondida: Boolean(m.respondida) }));

    res.json({
      empresa: 'Doce Encanto',
      gerado_em: new Date().toISOString(),
      totais: {
        produtos: produtos.length,
        clientes: clientes.length,
        pedidos: pedidos.length,
        mensagens: contatos.length,
      },
      produtos,
      clientes,
      pedidos,
      contatos,
    });
  });

  return r;
};
