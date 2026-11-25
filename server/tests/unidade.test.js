/**
 * TESTES UNITÁRIOS do backend: funções isoladas, sem banco e sem rede.
 */
const { calcularFrete } = require('../src/frete');
const { gerarHash, conferirSenha, usuarioPublico } = require('../src/auth');
const { validarEndereco, normalizarEndereco, validarProduto } = require('../src/validacao');
const { criarClienteMP, traduzirPagamento } = require('../src/mercadopago');

describe('calcularFrete', () => {
  test('São Paulo paga R$ 12', () => expect(calcularFrete('SP', 50)).toBe(12));
  test('aceita UF minúscula', () => expect(calcularFrete('sp', 50)).toBe(12));
  test('Sudeste paga R$ 18', () => expect(calcularFrete('RJ', 50)).toBe(18));
  test('Sul paga R$ 22', () => expect(calcularFrete('RS', 50)).toBe(22));
  test('demais estados pagam R$ 30', () => expect(calcularFrete('BA', 50)).toBe(30));
  test('frete grátis a partir de R$ 150', () => {
    expect(calcularFrete('BA', 150)).toBe(0);
    expect(calcularFrete('SP', 149.99)).toBe(12);
  });
});

describe('senhas', () => {
  test('o hash confere com a senha certa e não com a errada', () => {
    const hash = gerarHash('segredo123');
    expect(hash).not.toContain('segredo123');
    expect(conferirSenha('segredo123', hash)).toBe(true);
    expect(conferirSenha('outra', hash)).toBe(false);
  });
  test('dois hashes da mesma senha são diferentes (sal aleatório)', () => {
    expect(gerarHash('abc123')).not.toBe(gerarHash('abc123'));
  });
  test('usuarioPublico remove a senha', () => {
    expect(usuarioPublico({ id: 1, nome: 'A', senha_hash: 'x' })).toEqual({ id: 1, nome: 'A' });
  });
});

describe('validação', () => {
  const enderecoOk = { cep: '01310-100', logradouro: 'Av. Paulista', numero: '1000', cidade: 'São Paulo', uf: 'SP' };

  test('endereço completo passa', () => expect(validarEndereco(enderecoOk)).toEqual([]));
  test('CEP com 7 dígitos é recusado', () => {
    expect(validarEndereco({ ...enderecoOk, cep: '0131010' })).toContain('CEP inválido.');
  });
  test('UF inexistente é recusada', () => {
    expect(validarEndereco({ ...enderecoOk, uf: 'XX' })).toContain('UF inválida.');
  });
  test('normaliza CEP e UF', () => {
    const e = normalizarEndereco({ ...enderecoOk, cep: '01310100', uf: 'sp', complemento: '  ' });
    expect(e.cep).toBe('01310-100');
    expect(e.uf).toBe('SP');
    expect(e.complemento).toBeNull();
  });
  test('produto precisa de nome, preço positivo e categoria válida', () => {
    expect(validarProduto({ nome: 'Bolo', preco: 10, categoria: 'Bolo' })).toEqual([]);
    expect(validarProduto({ nome: 'Bo', preco: 10, categoria: 'Bolo' })).toHaveLength(1);
    expect(validarProduto({ nome: 'Bolo', preco: 0, categoria: 'Bolo' })).toHaveLength(1);
    expect(validarProduto({ nome: 'Bolo', preco: 10, categoria: 'Pizza' })).toHaveLength(1);
  });
});

describe('Mercado Pago', () => {
  test('traduz um pagamento aprovado via Pix', () => {
    expect(traduzirPagamento({ id: 99, status: 'approved', payment_type_id: 'bank_transfer' })).toEqual({
      status: 'pago', metodo_pagamento: 'pix', mp_payment_id: '99',
    });
  });
  test('traduz um pagamento recusado no cartão', () => {
    expect(traduzirPagamento({ id: 1, status: 'rejected', payment_type_id: 'credit_card' }).status).toBe('recusado');
  });

  test('sem token fica em modo demonstração', () => {
    expect(criarClienteMP({ accessToken: '' }).configurado).toBe(false);
  });

  test('cria a preferência com os itens, o frete e a referência do pedido', async () => {
    const fetchFn = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'pref-1', init_point: 'https://mp/checkout', sandbox_init_point: 'https://sandbox' }),
    });
    const mp = criarClienteMP({ accessToken: 'TEST-123', publicUrl: 'https://api.exemplo.com', fetchFn });
    const pref = await mp.criarPreferencia(
      { id: 7, frete: 12 },
      [{ produto_id: 1, nome: 'Cupcake', quantidade: 2, preco_unitario: 14.9 }],
      { nome: 'Maria', email: 'maria@exemplo.com' }
    );

    expect(pref).toEqual({ id: 'pref-1', url: 'https://mp/checkout', urlSandbox: 'https://sandbox' });
    const [url, opcoes] = fetchFn.mock.calls[0];
    expect(url).toBe('https://api.mercadopago.com/checkout/preferences');
    expect(opcoes.headers.Authorization).toBe('Bearer TEST-123');
    const corpo = JSON.parse(opcoes.body);
    expect(corpo.external_reference).toBe('7');
    expect(corpo.items).toHaveLength(2); // produto + frete
    expect(corpo.items[1]).toMatchObject({ title: 'Frete', unit_price: 12 });
    expect(corpo.notification_url).toBe('https://api.exemplo.com/pagamentos/webhook');
  });

  test('erro da API vira exceção com a mensagem do Mercado Pago', async () => {
    const fetchFn = jest.fn().mockResolvedValue({ ok: false, status: 401, json: async () => ({ message: 'invalid token' }) });
    const mp = criarClienteMP({ accessToken: 'TEST-x', fetchFn });
    await expect(mp.buscarPagamento(1)).rejects.toThrow('invalid token');
  });
});
