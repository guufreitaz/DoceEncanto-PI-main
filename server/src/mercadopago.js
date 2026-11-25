/**
 * Integração com a API REST do Mercado Pago (Checkout Pro).
 *
 * Documentação: https://www.mercadopago.com.br/developers/pt/docs/checkout-pro
 *
 * O token (MP_ACCESS_TOKEN) fica SÓ no servidor, nunca no app.
 * Sem token configurado, o app funciona em "modo demonstração" (pagamento simulado).
 */

const API = 'https://api.mercadopago.com';

const STATUS_MP = {
  approved: 'pago',
  authorized: 'pago',
  pending: 'aguardando_pagamento',
  in_process: 'aguardando_pagamento',
  in_mediation: 'aguardando_pagamento',
  rejected: 'recusado',
  cancelled: 'cancelado',
  refunded: 'cancelado',
  charged_back: 'cancelado',
};

const METODO_MP = {
  credit_card: 'cartao_credito',
  debit_card: 'cartao_debito',
  bank_transfer: 'pix',
  ticket: 'boleto',
  account_money: 'saldo_mercado_pago',
};

function criarClienteMP({ accessToken = process.env.MP_ACCESS_TOKEN, publicUrl = process.env.PUBLIC_URL, fetchFn = fetch } = {}) {
  const configurado = Boolean(accessToken);

  async function chamar(metodo, caminho, corpo) {
    const resp = await fetchFn(`${API}${caminho}`, {
      method: metodo,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: corpo ? JSON.stringify(corpo) : undefined,
    });
    const dados = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      const msg = dados.message || `Mercado Pago respondeu ${resp.status}`;
      throw new Error(msg);
    }
    return dados;
  }

  /** Cria a "preferência" de pagamento e devolve o link do checkout. */
  async function criarPreferencia(pedido, itens, comprador) {
    const corpo = {
      items: itens.map((it) => ({
        id: String(it.produto_id),
        title: it.nome,
        quantity: it.quantidade,
        unit_price: it.preco_unitario,
        currency_id: 'BRL',
        category_id: 'food',
      })),
      payer: { name: comprador.nome, email: comprador.email },
      external_reference: String(pedido.id),
      statement_descriptor: 'DOCE ENCANTO',
    };
    if (pedido.frete > 0) {
      corpo.items.push({ id: 'frete', title: 'Frete', quantity: 1, unit_price: pedido.frete, currency_id: 'BRL' });
    }
    if (publicUrl) {
      const retorno = `${publicUrl}/pagamentos/retorno?pedido=${pedido.id}`;
      corpo.back_urls = { success: retorno, pending: retorno, failure: retorno };
      // O Mercado Pago só aceita retorno automático e webhook com endereço público https
      if (publicUrl.startsWith('https://')) {
        corpo.auto_return = 'approved';
        corpo.notification_url = `${publicUrl}/pagamentos/webhook`;
      }
    }
    const pref = await chamar('POST', '/checkout/preferences', corpo);
    return { id: pref.id, url: pref.init_point, urlSandbox: pref.sandbox_init_point };
  }

  /** Busca o pagamento mais recente de um pedido (pelo external_reference). */
  async function buscarPagamentoDoPedido(pedidoId) {
    const dados = await chamar(
      'GET',
      `/v1/payments/search?external_reference=${encodeURIComponent(pedidoId)}&sort=date_created&criteria=desc`
    );
    return dados.results?.[0] || null;
  }

  async function buscarPagamento(id) {
    return chamar('GET', `/v1/payments/${encodeURIComponent(id)}`);
  }

  return { configurado, criarPreferencia, buscarPagamentoDoPedido, buscarPagamento };
}

/** Converte um pagamento do Mercado Pago nos campos do nosso pedido. */
function traduzirPagamento(pagamento) {
  return {
    status: STATUS_MP[pagamento.status] || 'aguardando_pagamento',
    metodo_pagamento: METODO_MP[pagamento.payment_type_id] || pagamento.payment_type_id || null,
    mp_payment_id: String(pagamento.id),
  };
}

module.exports = { criarClienteMP, traduzirPagamento };
