const fs = require('fs');
const path = require('path');
// SQLite embutido no próprio Node.js (22.13 ou mais novo): não precisa compilar nada nem instalar o Visual Studio
const { DatabaseSync } = require('node:sqlite');
const { semearBase, preencherFotos } = require('./seed');

const ARQUIVO_PADRAO = path.join(__dirname, '..', 'data', 'doceencanto.db');

/**
 * Abre (ou cria) o banco SQLite e garante que as tabelas existem.
 * Use ':memory:' nos testes para ter um banco limpo a cada execução.
 */
function abrirBanco(arquivo = process.env.DB_FILE || ARQUIVO_PADRAO) {
  if (arquivo !== ':memory:') {
    fs.mkdirSync(path.dirname(arquivo), { recursive: true });
  }
  const db = new DatabaseSync(arquivo);
  db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  db.exec(fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8'));
  db.arquivo = arquivo;

  /** Executa várias operações como uma só: ou grava tudo, ou nada. */
  db.transaction = (fn) => (...args) => {
    db.exec('BEGIN');
    try {
      const resultado = fn(...args);
      db.exec('COMMIT');
      return resultado;
    } catch (erro) {
      db.exec('ROLLBACK');
      throw erro;
    }
  };

  // Banco vazio? Cadastra o admin, uma cliente de exemplo e o cardápio inicial.
  const { total } = db.prepare('SELECT COUNT(*) AS total FROM usuarios').get();
  if (total === 0) semearBase(db);
  preencherFotos(db);

  return db;
}

module.exports = { abrirBanco };
