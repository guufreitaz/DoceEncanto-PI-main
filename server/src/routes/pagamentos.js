const { Router } = require('express');
const { traduzirPagamento } = require('../mercadopago');
const { AGUARDANDO } = require('./pedidos');

/**
 * Rotas chamadas pelo Mercado Pago (não pelo app):
 *  - webhook: avisa quando um pagamento muda (precisa de PUBLIC_URL https, ex.: ngrok)
 *  - retorno: página que aparece depois do checkout, pedindo para voltar ao app
 */
module.exports = function rotasPagamentos(db, mp) {
  const r = Router();

  r.post('/webhook', async (req, res) => {
    // Responde rápido; o Mercado Pago reenvia se não receber 200
    res.status(200).json({ recebido: true });
    try {
      const tipo = req.body?.type || req.query.type || req.query.topic;
      const id = req.body?.data?.id || req.query['data.id'] || req.query.id;
      if (!mp.configurado || tipo !== 'payment' || !id) return;

      const pagamento = await mp.buscarPagamento(id);
      const pedido = db.prepare('SELECT * FROM pedidos WHERE id = ?').get(pagamento.external_reference);
      if (!pedido || !AGUARDANDO.includes(pedido.status)) return;

      const dados = traduzirPagamento(pagamento);
      db.prepare(`
        UPDATE pedidos SET status = ?, metodo_pagamento = ?, mp_payment_id = ?, atualizado_em = datetime('now')
        WHERE id = ?
      `).run(dados.status, dados.metodo_pagamento, dados.mp_payment_id, pedido.id);
    } catch (e) {
      console.error('Erro ao processar webhook do Mercado Pago:', e.message);
    }
  });

  r.get('/retorno', (req, res) => {
    const pedido = Number(req.query.pedido) || '';
    const situacao = req.query.status || req.query.collection_status || '';
    const mensagem =
      situacao === 'approved' ? 'Pagamento aprovado!'
        : situacao === 'rejected' || situacao === 'failure' ? 'O pagamento não foi aprovado.'
          : 'Recebemos o seu pedido.';
    res.type('html').send(`<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Doce Encanto</title>
<style>body{font-family:system-ui,sans-serif;background:#FFF8FA;color:#2B2226;display:grid;place-items:center;min-height:100vh;margin:0;text-align:center;padding:24px}
h1{color:#D91B72}a{display:inline-block;margin-top:16px;background:#D91B72;color:#fff;padding:14px 22px;border-radius:24px;text-decoration:none;font-weight:600}</style>
</head><body><main><h1>${mensagem}</h1><p>Pode fechar esta página e voltar para o app Doce Encanto.</p>
<a href="doceencantoapp://pedido/${pedido}">Voltar para o app</a></main></body></html>`);
  });

  return r;
};
