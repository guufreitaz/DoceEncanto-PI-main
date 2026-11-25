const { Router } = require('express');
const { exigirLogin, exigirAdmin } = require('../auth');
const { EMAIL, texto } = require('../validacao');

/** Fale conosco: a cliente envia mensagens, a administradora lê, marca como respondida e exclui. */
module.exports = function rotasContato(db) {
  const r = Router();
  const login = exigirLogin(db);

  // CREATE - mensagem (exige login para ligar a mensagem à cliente)
  r.post('/', login, (req, res) => {
    const b = req.body || {};
    const erros = [];
    if (texto(b.assunto).length < 3) erros.push('Informe o assunto.');
    if (texto(b.mensagem).length < 10) erros.push('Escreva uma mensagem com pelo menos 10 caracteres.');
    const email = texto(b.email) || req.usuario.email;
    if (!EMAIL.test(email)) erros.push('E-mail inválido.');
    if (erros.length) return res.status(400).json({ erro: erros[0], erros });

    const info = db.prepare(`
      INSERT INTO mensagens_contato (usuario_id, nome, email, telefone, assunto, mensagem)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(req.usuario.id, texto(b.nome) || req.usuario.nome, email, texto(b.telefone) || req.usuario.telefone,
      texto(b.assunto), texto(b.mensagem));
    res.status(201).json(db.prepare('SELECT * FROM mensagens_contato WHERE id = ?').get(info.lastInsertRowid));
  });

  // READ - admin vê todas; cliente vê as próprias
  r.get('/', login, (req, res) => {
    const admin = req.usuario.perfil === 'admin';
    const lista = admin
      ? db.prepare('SELECT * FROM mensagens_contato ORDER BY respondida, criado_em DESC').all()
      : db.prepare('SELECT * FROM mensagens_contato WHERE usuario_id = ? ORDER BY criado_em DESC').all(req.usuario.id);
    res.json(lista.map((m) => ({ ...m, respondida: Boolean(m.respondida) })));
  });

  // UPDATE - marcar como respondida
  r.patch('/:id', login, exigirAdmin, (req, res) => {
    const info = db.prepare('UPDATE mensagens_contato SET respondida = ? WHERE id = ?')
      .run(req.body?.respondida === false ? 0 : 1, req.params.id);
    if (info.changes === 0) return res.status(404).json({ erro: 'Mensagem não encontrada.' });
    const m = db.prepare('SELECT * FROM mensagens_contato WHERE id = ?').get(req.params.id);
    res.json({ ...m, respondida: Boolean(m.respondida) });
  });

  // DELETE
  r.delete('/:id', login, exigirAdmin, (req, res) => {
    const info = db.prepare('DELETE FROM mensagens_contato WHERE id = ?').run(req.params.id);
    if (info.changes === 0) return res.status(404).json({ erro: 'Mensagem não encontrada.' });
    res.status(204).end();
  });

  return r;
};
