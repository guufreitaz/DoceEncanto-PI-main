/**
 * TESTES DE INTEGRAÇÃO da API: rotas + regras + banco SQLite (em memória) juntos.
 * O Mercado Pago é substituído por um "dublê" para não depender da internet.
 */
const request = require('supertest');
const { abrirBanco } = require('../src/db');
const { criarApp } = require('../src/app');

const ENDERECO = { cep: '01310-100', logradouro: 'Av. Paulista', numero: '1000', bairro: 'Bela Vista', cidade: 'São Paulo', uf: 'SP' };

function montar({ mp } = {}) {
  const db = abrirBanco(':memory:');
  const mpFalso = mp || { configurado: false };
  return { db, api: request(criarApp({ db, mp: mpFalso })) };
}

async function entrar(api, email, senha) {
  const res = await api.post('/auth/login').send({ email, senha });
  return res.body.token;
}

describe('autenticação', () => {
  test('cadastro cria a conta e já devolve um token', async () => {
    const { api } = montar();
    const res = await api.post('/auth/cadastro').send({
      nome: 'Joana Teste', email: 'Joana@Teste.com', telefone: '11999990000', senha: '123456', ...ENDERECO,
    });
    expect(res.status).toBe(201);
    expect(res.body.token).toBeTruthy();
    expect(res.body.usuario).toMatchObject({ email: 'joana@teste.com', perfil: 'cliente' });
    expect(res.body.usuario.senha_hash).toBeUndefined();
  });

  test('não deixa cadastrar e-mail repetido', async () => {
    const { api } = montar();
    const res = await api.post('/auth/cadastro').send({ nome: 'Outra Maria', email: 'maria@exemplo.com', senha: '123456', ...ENDERECO });
    expect(res.status).toBe(409);
  });

  test('cadastro inválido devolve a lista de erros', async () => {
    const { api } = montar();
    const res = await api.post('/auth/cadastro').send({ nome: 'A', email: 'x', senha: '1' });
    expect(res.status).toBe(400);
    expect(res.body.erros.length).toBeGreaterThan(2);
  });

  test('login com senha errada é recusado', async () => {
    const { api } = montar();
    const res = await api.post('/auth/login').send({ email: 'maria@exemplo.com', senha: 'errada' });
    expect(res.status).toBe(401);
  });

  test('/auth/me exige token e devolve o perfil', async () => {
    const { api } = montar();
    expect((await api.get('/auth/me')).status).toBe(401);
    const token = await entrar(api, 'maria@exemplo.com', '123456');
    const res = await api.get('/auth/me').set('Authorization', `Bearer ${token}`);
    expect(res.body.nome).toBe('Maria Oliveira');
  });

  test('logout invalida o token', async () => {
    const { api } = montar();
    const token = await entrar(api, 'maria@exemplo.com', '123456');
    await api.post('/auth/logout').set('Authorization', `Bearer ${token}`).expect(204);
    expect((await api.get('/auth/me').set('Authorization', `Bearer ${token}`)).status).toBe(401);
  });

  test('atualiza o perfil', async () => {
    const { api } = montar();
    const token = await entrar(api, 'maria@exemplo.com', '123456');
    const res = await api.put('/auth/me').set('Authorization', `Bearer ${token}`)
      .send({ nome: 'Maria O. Santos', telefone: '(11) 91111-2222', ...ENDERECO, numero: '50' });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ nome: 'Maria O. Santos', numero: '50' });
  });
});

describe('CRUD de produtos', () => {
  test('qualquer pessoa consulta o catálogo e filtra por categoria', async () => {
    const { api } = montar();
    const todos = await api.get('/produtos');
    expect(todos.body.length).toBeGreaterThan(5);
    const bolos = await api.get('/produtos?categoria=Bolo');
    expect(bolos.body.every((p) => p.categoria === 'Bolo')).toBe(true);
    const busca = await api.get('/produtos?busca=brownie');
    expect(busca.body).toHaveLength(1);
  });

  test('produtos do cardápio já vêm com foto, servida pela própria API', async () => {
    const { api } = montar();
    const { body } = await api.get('/produtos');
    expect(body.every((p) => p.imagem && p.imagem.startsWith('/imagens/produtos/'))).toBe(true);
    const foto = await api.get(body[0].imagem);
    expect(foto.status).toBe(200);
    expect(foto.headers['content-type']).toBe('image/jpeg');
  });

  test('cliente não pode criar produto', async () => {
    const { api } = montar();
    const token = await entrar(api, 'maria@exemplo.com', '123456');
    const res = await api.post('/produtos').set('Authorization', `Bearer ${token}`)
      .send({ nome: 'Bolo X', preco: 10, categoria: 'Bolo' });
    expect(res.status).toBe(403);
  });

  test('admin cria, consulta, altera e exclui um produto', async () => {
    const { api } = montar();
    const token = await entrar(api, 'admin@doceencanto.com', 'admin123');
    const auth = { Authorization: `Bearer ${token}` };

    const criado = await api.post('/produtos').set(auth)
      .send({ nome: 'Torta de Limão', descricao: 'Merengue maçaricado', preco: '45.5', categoria: 'Doce' });
    expect(criado.status).toBe(201);
    expect(criado.body.preco).toBe(45.5);

    const lido = await api.get(`/produtos/${criado.body.id}`);
    expect(lido.body.nome).toBe('Torta de Limão');

    const alterado = await api.put(`/produtos/${criado.body.id}`).set(auth)
      .send({ ...lido.body, preco: 49.9 });
    expect(alterado.body.preco).toBe(49.9);

    const excluido = await api.delete(`/produtos/${criado.body.id}`).set(auth);
    expect(excluido.body).toEqual({ removido: true, modo: 'excluido' });
    expect((await api.get(`/produtos/${criado.body.id}`)).status).toBe(404);
  });

  test('produto já vendido é desativado em vez de apagado', async () => {
    const { api } = montar();
    const cliente = await entrar(api, 'maria@exemplo.com', '123456');
    await api.post('/pedidos').set('Authorization', `Bearer ${cliente}`)
      .send({ itens: [{ produto_id: 1, quantidade: 1 }], endereco: ENDERECO }).expect(201);

    const admin = await entrar(api, 'admin@doceencanto.com', 'admin123');
    const res = await api.delete('/produtos/1').set('Authorization', `Bearer ${admin}`);
    expect(res.body.modo).toBe('desativado');
    const catalogo = await api.get('/produtos');
    expect(catalogo.body.find((p) => p.id === 1)).toBeUndefined();
    const todos = await api.get('/produtos?todos=1');
    expect(todos.body.find((p) => p.id === 1).ativo).toBe(false);
  });
});

describe('pedidos e pagamento', () => {
  test('calcula subtotal e frete com os preços do banco (ignora preço enviado pelo app)', async () => {
    const { api, db } = montar();
    const token = await entrar(api, 'maria@exemplo.com', '123456');
    const precoReal = db.prepare('SELECT preco FROM produtos WHERE id = 5').get().preco;

    const res = await api.post('/pedidos').set('Authorization', `Bearer ${token}`)
      .send({ itens: [{ produto_id: 5, quantidade: 2, preco: 0.01 }], endereco: { ...ENDERECO, uf: 'RJ' } });

    expect(res.status).toBe(201);
    expect(res.body.pedido.subtotal).toBeCloseTo(precoReal * 2);
    expect(res.body.pedido.frete).toBe(18);
    expect(res.body.pedido.status).toBe('aguardando_pagamento');
    expect(res.body.pagamento.modo).toBe('simulado');
  });

  test('carrinho vazio é recusado', async () => {
    const { api } = montar();
    const token = await entrar(api, 'maria@exemplo.com', '123456');
    const res = await api.post('/pedidos').set('Authorization', `Bearer ${token}`).send({ itens: [], endereco: ENDERECO });
    expect(res.status).toBe(400);
  });

  test('modo demonstração: simula pagamento aprovado e a admin avança o status', async () => {
    const { api } = montar();
    const cliente = await entrar(api, 'maria@exemplo.com', '123456');
    const { body } = await api.post('/pedidos').set('Authorization', `Bearer ${cliente}`)
      .send({ itens: [{ produto_id: 2, quantidade: 1 }], endereco: ENDERECO });

    const pago = await api.post(`/pedidos/${body.pedido.id}/simular-pagamento`)
      .set('Authorization', `Bearer ${cliente}`).send({ aprovado: true, metodo: 'pix' });
    expect(pago.body).toMatchObject({ status: 'pago', metodo_pagamento: 'pix' });

    const admin = await entrar(api, 'admin@doceencanto.com', 'admin123');
    const preparo = await api.patch(`/pedidos/${body.pedido.id}/status`)
      .set('Authorization', `Bearer ${admin}`).send({ status: 'em_preparo' });
    expect(preparo.body.status).toBe('em_preparo');

    // Pedido já pago não pode ser cancelado pela cliente
    const cancelar = await api.post(`/pedidos/${body.pedido.id}/cancelar`).set('Authorization', `Bearer ${cliente}`);
    expect(cancelar.status).toBe(409);
  });

  test('uma cliente não vê o pedido de outra', async () => {
    const { api } = montar();
    const maria = await entrar(api, 'maria@exemplo.com', '123456');
    const { body } = await api.post('/pedidos').set('Authorization', `Bearer ${maria}`)
      .send({ itens: [{ produto_id: 2, quantidade: 1 }], endereco: ENDERECO });

    const outra = (await api.post('/auth/cadastro').send({ nome: 'Outra Pessoa', email: 'outra@x.com', senha: '123456', ...ENDERECO })).body.token;
    expect((await api.get(`/pedidos/${body.pedido.id}`).set('Authorization', `Bearer ${outra}`)).status).toBe(403);
    expect((await api.get('/pedidos').set('Authorization', `Bearer ${outra}`)).body).toEqual([]);
  });

  test('com Mercado Pago: devolve o link do checkout e sincroniza o pagamento aprovado', async () => {
    const mp = {
      configurado: true,
      criarPreferencia: jest.fn().mockResolvedValue({ id: 'pref-9', url: 'https://mp/checkout/pref-9' }),
      buscarPagamentoDoPedido: jest.fn().mockResolvedValue({ id: 555, status: 'approved', payment_type_id: 'credit_card' }),
    };
    const { api } = montar({ mp });
    const token = await entrar(api, 'maria@exemplo.com', '123456');

    const criado = await api.post('/pedidos').set('Authorization', `Bearer ${token}`)
      .send({ itens: [{ produto_id: 3, quantidade: 3 }], endereco: ENDERECO });
    expect(criado.body.pagamento).toEqual({ modo: 'mercado_pago', url: 'https://mp/checkout/pref-9' });
    expect(criado.body.pedido.mp_preference_id).toBe('pref-9');

    const sinc = await api.post(`/pedidos/${criado.body.pedido.id}/sincronizar`).set('Authorization', `Bearer ${token}`);
    expect(mp.buscarPagamentoDoPedido).toHaveBeenCalledWith(criado.body.pedido.id);
    expect(sinc.body).toMatchObject({ status: 'pago', metodo_pagamento: 'cartao_credito', mp_payment_id: '555' });
  });

  test('se o Mercado Pago falhar, o pedido não fica salvo', async () => {
    const mp = { configurado: true, criarPreferencia: jest.fn().mockRejectedValue(new Error('fora do ar')) };
    const { api, db } = montar({ mp });
    const token = await entrar(api, 'maria@exemplo.com', '123456');
    const res = await api.post('/pedidos').set('Authorization', `Bearer ${token}`)
      .send({ itens: [{ produto_id: 3, quantidade: 1 }], endereco: ENDERECO });
    expect(res.status).toBe(502);
    expect(db.prepare('SELECT COUNT(*) AS n FROM pedidos').get().n).toBe(0);
  });
});

describe('contato e exportação JSON', () => {
  test('cliente envia mensagem e a admin lê, marca como respondida e exclui', async () => {
    const { api } = montar();
    const cliente = await entrar(api, 'maria@exemplo.com', '123456');
    const enviada = await api.post('/contato').set('Authorization', `Bearer ${cliente}`)
      .send({ assunto: 'Encomenda', mensagem: 'Vocês fazem bolo para 50 pessoas?' });
    expect(enviada.status).toBe(201);
    expect(enviada.body.email).toBe('maria@exemplo.com');

    const admin = await entrar(api, 'admin@doceencanto.com', 'admin123');
    const auth = { Authorization: `Bearer ${admin}` };
    expect((await api.get('/contato').set(auth)).body).toHaveLength(1);
    expect((await api.patch(`/contato/${enviada.body.id}`).set(auth).send({ respondida: true })).body.respondida).toBe(true);
    await api.delete(`/contato/${enviada.body.id}`).set(auth).expect(204);
  });

  test('exportação JSON traz pedidos com itens e não expõe dados pessoais', async () => {
    const { api } = montar();
    const cliente = await entrar(api, 'maria@exemplo.com', '123456');
    await api.post('/pedidos').set('Authorization', `Bearer ${cliente}`)
      .send({ itens: [{ produto_id: 1, quantidade: 1 }, { produto_id: 6, quantidade: 2 }], endereco: ENDERECO });

    expect((await api.get('/relatorios/export').set('Authorization', `Bearer ${cliente}`)).status).toBe(403);

    const admin = await entrar(api, 'admin@doceencanto.com', 'admin123');
    const res = await api.get('/relatorios/export').set('Authorization', `Bearer ${admin}`);
    expect(res.status).toBe(200);
    expect(res.body.totais.pedidos).toBe(1);
    expect(res.body.pedidos[0].itens).toHaveLength(2);
    const texto = JSON.stringify(res.body);
    expect(texto).not.toContain('maria@exemplo.com');
    expect(texto).not.toContain('senha');
  });
});
