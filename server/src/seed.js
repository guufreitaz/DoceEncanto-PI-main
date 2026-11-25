/**
 * Dados iniciais do banco.
 *
 * semearBase  -> roda sozinho quando o banco está vazio (admin, cliente de exemplo, cardápio).
 * semearDemo  -> `npm run seed:demo`: cria clientes e pedidos FICTÍCIOS dos últimos meses
 *                para alimentar o dashboard de Análise de Dados.
 */

// [nome, descrição, preço, categoria, foto] - as fotos ficam em server/public/produtos
const PRODUTOS = [
  ['Bolo Red Velvet', 'Massa aveludada com recheio e cobertura de cream cheese. Serve 15 pessoas.', 129.9, 'Bolo', '01-bolo-red-velvet.jpg'],
  ['Bolo de Cenoura com Chocolate', 'Clássico caseiro com calda de chocolate meio amargo. Serve 10 pessoas.', 59.9, 'Bolo', '02-bolo-de-cenoura-com-chocolate.jpg'],
  ['Bolo de Pote Ninho com Morango', 'Pão de ló, creme de leite Ninho e morangos frescos. 250 ml.', 16.9, 'Bolo', '03-bolo-de-pote-ninho-com-morango.jpg'],
  ['Fatia de Morango', 'Fatia generosa de bolo de baunilha com chantilly e morangos.', 18.9, 'Bolo', '04-fatia-de-morango.jpg'],
  ['Cupcake de Framboesa', 'Massa de baunilha com recheio e buttercream de framboesa.', 14.9, 'Doce', '07-cupcake-de-framboesa.jpg'],
  ['Brigadeiro Gourmet (caixa com 12)', 'Brigadeiros de chocolate belga, pistache e ninho.', 42.0, 'Doce', '05-brigadeiro-gourmet.jpg'],
  ['Macarons Especiais (6 unidades)', 'Sabores do dia: limão siciliano, chocolate, frutas vermelhas.', 24.0, 'Doce', '08-macarons-especiais.jpg'],
  ['Verrine de Chocolate', 'Camadas de mousse de chocolate, ganache e crocante de cacau.', 16.5, 'Doce', '09-verrine-de-chocolate.jpg'],
  ['Brownie com Nozes', 'Brownie úmido de chocolate 70% com nozes.', 12.0, 'Doce', '06-brownie-com-nozes.jpg'],
  ['Empada de Palmito', 'Massa amanteigada que desmancha, recheio cremoso de palmito.', 9.5, 'Salgado', '11-empada-de-palmito.jpg'],
  ['Mini Quiche (6 unidades)', 'Sabores alho-poró, queijo e calabresa.', 28.0, 'Salgado', '12-mini-quiche.jpg'],
  ['Coxinha de Frango (cento)', 'Coxinhas de festa com frango desfiado e catupiry.', 89.0, 'Salgado', '10-coxinha-de-frango.jpg'],
];

const caminhoFoto = (arquivo) => `/imagens/produtos/${arquivo}`;

/**
 * Bancos criados antes das fotos: coloca a foto nos produtos do cardápio inicial
 * que ainda estão sem imagem (não mexe em foto enviada pela administradora).
 */
function preencherFotos(db) {
  const atualizar = db.prepare('UPDATE produtos SET imagem = ? WHERE nome = ? AND imagem IS NULL');
  for (const [nome, , , , foto] of PRODUTOS) atualizar.run(caminhoFoto(foto), nome);
}

function semearBase(db) {
  // Importado aqui para evitar dependência circular com auth.js
  const { gerarHash } = require('./auth');

  const inserirUsuario = db.prepare(`
    INSERT INTO usuarios (nome, email, telefone, senha_hash, perfil, cep, logradouro, numero, bairro, cidade, uf)
    VALUES (@nome, @email, @telefone, @senha_hash, @perfil, @cep, @logradouro, @numero, @bairro, @cidade, @uf)
  `);
  const inserirProduto = db.prepare(
    'INSERT INTO produtos (nome, descricao, preco, categoria, imagem) VALUES (?, ?, ?, ?, ?)'
  );

  db.transaction(() => {
    inserirUsuario.run({
      nome: 'Administradora Doce Encanto',
      email: 'admin@doceencanto.com',
      telefone: '(11) 98888-0000',
      senha_hash: gerarHash('admin123'),
      perfil: 'admin',
      cep: '01310-100',
      logradouro: 'Avenida Paulista',
      numero: '1000',
      bairro: 'Bela Vista',
      cidade: 'São Paulo',
      uf: 'SP',
    });
    inserirUsuario.run({
      nome: 'Maria Oliveira',
      email: 'maria@exemplo.com',
      telefone: '(11) 99999-9999',
      senha_hash: gerarHash('123456'),
      perfil: 'cliente',
      cep: '04538-133',
      logradouro: 'Avenida Brigadeiro Faria Lima',
      numero: '3477',
      bairro: 'Itaim Bibi',
      cidade: 'São Paulo',
      uf: 'SP',
    });
    for (const [nome, descricao, preco, categoria, foto] of PRODUTOS) {
      inserirProduto.run(nome, descricao, preco, categoria, caminhoFoto(foto));
    }
  })();
}

/* ---------------- dados fictícios para o dashboard ---------------- */

// Gerador pseudoaleatório com semente fixa: o resultado é sempre o mesmo.
function criarAleatorio(semente = 42) {
  let s = semente;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

const NOMES = ['Ana', 'Bruno', 'Carla', 'Diego', 'Eduarda', 'Felipe', 'Gabriela', 'Henrique', 'Isabela', 'João',
  'Larissa', 'Marcos', 'Natália', 'Otávio', 'Paula', 'Rafael', 'Sabrina', 'Thiago', 'Vanessa', 'Wesley'];
const SOBRENOMES = ['Silva', 'Souza', 'Costa', 'Pereira', 'Almeida', 'Lima', 'Gomes', 'Ribeiro', 'Martins', 'Rocha'];
const CIDADES = [
  ['São Paulo', 'SP', '01001-000', 0.45],
  ['Guarulhos', 'SP', '07010-000', 0.1],
  ['Santo André', 'SP', '09010-000', 0.08],
  ['Osasco', 'SP', '06010-000', 0.07],
  ['Campinas', 'SP', '13010-000', 0.08],
  ['Rio de Janeiro', 'RJ', '20010-000', 0.08],
  ['Belo Horizonte', 'MG', '30110-000', 0.06],
  ['Curitiba', 'PR', '80010-000', 0.05],
  ['Salvador', 'BA', '40010-000', 0.03],
];
const METODOS = [['pix', 0.5], ['cartao_credito', 0.38], ['boleto', 0.07], ['cartao_debito', 0.05]];

function escolherPeso(lista, r) {
  let acumulado = 0;
  const x = r();
  for (const item of lista) {
    acumulado += item[item.length - 1];
    if (x <= acumulado) return item;
  }
  return lista[lista.length - 1];
}

function semearDemo(db, { clientes = 40, pedidos = 180, dias = 120 } = {}) {
  const { gerarHash } = require('./auth');
  const { calcularFrete } = require('./frete');
  const r = criarAleatorio(2026);
  const senha = gerarHash('demo1234');
  const produtos = db.prepare('SELECT * FROM produtos WHERE ativo = 1').all();
  if (produtos.length === 0) throw new Error('Cadastre produtos antes de gerar a demonstração.');

  const inserirCliente = db.prepare(`
    INSERT INTO usuarios (nome, email, telefone, senha_hash, perfil, cep, logradouro, numero, bairro, cidade, uf, criado_em)
    VALUES (?, ?, ?, ?, 'cliente', ?, 'Rua Exemplo', ?, 'Centro', ?, ?, ?)
  `);
  const inserirPedido = db.prepare(`
    INSERT INTO pedidos (usuario_id, status, subtotal, frete, total, metodo_pagamento, cep, logradouro, numero,
                         bairro, cidade, uf, criado_em, atualizado_em)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'Rua Exemplo', ?, 'Centro', ?, ?, ?, ?)
  `);
  const inserirItem = db.prepare(`
    INSERT INTO itens_pedido (pedido_id, produto_id, nome, categoria, preco_unitario, quantidade)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const agora = Date.now();
  const dataISO = (diasAtras, hora) => {
    const d = new Date(agora - diasAtras * 86400000);
    d.setHours(hora, Math.floor(r() * 60), 0, 0);
    // Nenhum pedido fictício pode ficar "no futuro"
    if (d.getTime() > agora - 3600000) d.setTime(agora - 3600000 - Math.floor(r() * 7200000));
    return d.toISOString().replace('T', ' ').slice(0, 19);
  };

  db.transaction(() => {
    const ids = [];
    for (let i = 0; i < clientes; i++) {
      const nome = `${NOMES[i % NOMES.length]} ${SOBRENOMES[Math.floor(r() * SOBRENOMES.length)]}`;
      const [cidade, uf, cep] = escolherPeso(CIDADES, r);
      const info = inserirCliente.run(nome, `cliente${i + 1}@demo.doceencanto.com`, '(11) 90000-0000', senha,
        cep, String(10 + i), cidade, uf, dataISO(dias + 10 - Math.floor(r() * 30), 10));
      ids.push({ id: info.lastInsertRowid, cep, cidade, uf });
    }

    for (let i = 0; i < pedidos; i++) {
      const c = ids[Math.floor(r() * ids.length)];
      // Mais pedidos nas semanas recentes e nos fins de semana
      const diasAtras = Math.floor(Math.pow(r(), 1.3) * dias);
      const hora = 9 + Math.floor(r() * 12);
      const quando = dataISO(diasAtras, hora);

      const qtdItens = 1 + Math.floor(r() * 3);
      const itens = [];
      for (let k = 0; k < qtdItens; k++) {
        const p = produtos[Math.floor(r() * produtos.length)];
        if (itens.some((it) => it.p.id === p.id)) continue;
        itens.push({ p, quantidade: 1 + Math.floor(r() * 3) });
      }
      const subtotal = Math.round(itens.reduce((s, it) => s + it.p.preco * it.quantidade, 0) * 100) / 100;
      const frete = calcularFrete(c.uf, subtotal);
      const total = Math.round((subtotal + frete) * 100) / 100;

      const x = r();
      let status = 'entregue';
      if (diasAtras <= 1) status = x < 0.5 ? 'pago' : 'em_preparo';
      else if (diasAtras <= 3) status = x < 0.6 ? 'enviado' : 'entregue';
      if (x > 0.93) status = 'cancelado';
      else if (x > 0.89) status = 'recusado';
      const [metodo] = escolherPeso(METODOS, r);

      const info = inserirPedido.run(c.id, status, subtotal, frete, total, metodo, c.cep, '100', c.cidade, c.uf,
        quando, quando);
      for (const it of itens) {
        inserirItem.run(info.lastInsertRowid, it.p.id, it.p.nome, it.p.categoria, it.p.preco, it.quantidade);
      }
    }
  })();
}

module.exports = { semearBase, semearDemo, preencherFotos, PRODUTOS };

// Execução pela linha de comando: `node src/seed.js --demo`
if (require.main === module) {
  require('dotenv').config({ quiet: true });
  const { abrirBanco } = require('./db');
  const db = abrirBanco();
  if (process.argv.includes('--demo')) {
    const { n } = db.prepare("SELECT COUNT(*) AS n FROM usuarios WHERE email LIKE '%@demo.doceencanto.com'").get();
    if (n > 0) {
      console.log('Os dados de demonstração já foram gerados antes. Apague server/data/ para recomeçar.');
    } else {
      semearDemo(db);
      console.log('Dados fictícios de demonstração criados (clientes e pedidos).');
    }
  } else {
    console.log('Banco pronto em', db.arquivo);
  }
}
