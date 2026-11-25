-- Modelo do banco de dados da Doce Encanto (SQLite)

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS usuarios (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  nome        TEXT    NOT NULL,
  email       TEXT    NOT NULL UNIQUE,
  telefone    TEXT,
  senha_hash  TEXT    NOT NULL,
  perfil      TEXT    NOT NULL DEFAULT 'cliente' CHECK (perfil IN ('cliente', 'admin')),
  cep         TEXT,
  logradouro  TEXT,
  numero      TEXT,
  complemento TEXT,
  bairro      TEXT,
  cidade      TEXT,
  uf          TEXT,
  criado_em   TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sessoes (
  token      TEXT    PRIMARY KEY,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  criado_em  TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS produtos (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  nome          TEXT    NOT NULL,
  descricao     TEXT    NOT NULL DEFAULT '',
  preco         REAL    NOT NULL CHECK (preco > 0),
  categoria     TEXT    NOT NULL CHECK (categoria IN ('Bolo', 'Doce', 'Salgado')),
  imagem        TEXT,
  ativo         INTEGER NOT NULL DEFAULT 1,
  criado_em     TEXT    NOT NULL DEFAULT (datetime('now')),
  atualizado_em TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS pedidos (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario_id         INTEGER NOT NULL REFERENCES usuarios(id),
  status             TEXT    NOT NULL DEFAULT 'aguardando_pagamento'
                     CHECK (status IN ('aguardando_pagamento', 'pago', 'recusado', 'em_preparo',
                                       'enviado', 'entregue', 'cancelado')),
  subtotal           REAL    NOT NULL,
  frete              REAL    NOT NULL,
  total              REAL    NOT NULL,
  metodo_pagamento   TEXT,
  mp_preference_id   TEXT,
  mp_payment_id      TEXT,
  cep                TEXT    NOT NULL,
  logradouro         TEXT    NOT NULL,
  numero             TEXT    NOT NULL,
  complemento        TEXT,
  bairro             TEXT,
  cidade             TEXT    NOT NULL,
  uf                 TEXT    NOT NULL,
  criado_em          TEXT    NOT NULL DEFAULT (datetime('now')),
  atualizado_em      TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS itens_pedido (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  pedido_id      INTEGER NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  produto_id     INTEGER NOT NULL REFERENCES produtos(id),
  nome           TEXT    NOT NULL,
  categoria      TEXT    NOT NULL,
  preco_unitario REAL    NOT NULL,
  quantidade     INTEGER NOT NULL CHECK (quantidade > 0)
);

CREATE TABLE IF NOT EXISTS mensagens_contato (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  nome       TEXT    NOT NULL,
  email      TEXT    NOT NULL,
  telefone   TEXT,
  assunto    TEXT    NOT NULL,
  mensagem   TEXT    NOT NULL,
  respondida INTEGER NOT NULL DEFAULT 0,
  criado_em  TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_pedidos_usuario ON pedidos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_itens_pedido    ON itens_pedido(pedido_id);
