const { Router } = require('express');
const { gerarHash, conferirSenha, criarSessao, usuarioPublico, exigirLogin } = require('../auth');
const { EMAIL, texto, validarEndereco, normalizarEndereco } = require('../validacao');

module.exports = function rotasAuth(db) {
  const r = Router();

  // CREATE - cadastro de cliente
  r.post('/cadastro', (req, res) => {
    const b = req.body || {};
    const erros = [];
    if (texto(b.nome).length < 3) erros.push('Informe seu nome completo.');
    if (!EMAIL.test(texto(b.email))) erros.push('E-mail inválido.');
    if (String(b.senha || '').length < 6) erros.push('A senha precisa ter pelo menos 6 caracteres.');
    validarEndereco(b, erros);
    if (erros.length) return res.status(400).json({ erro: erros[0], erros });

    const email = texto(b.email).toLowerCase();
    if (db.prepare('SELECT 1 FROM usuarios WHERE email = ?').get(email)) {
      return res.status(409).json({ erro: 'Já existe uma conta com esse e-mail.' });
    }

    const info = db.prepare(`
      INSERT INTO usuarios (nome, email, telefone, senha_hash, cep, logradouro, numero, complemento, bairro, cidade, uf)
      VALUES (@nome, @email, @telefone, @senha_hash, @cep, @logradouro, @numero, @complemento, @bairro, @cidade, @uf)
    `).run({
      nome: texto(b.nome),
      email,
      telefone: texto(b.telefone) || null,
      senha_hash: gerarHash(String(b.senha)),
      ...normalizarEndereco(b),
    });

    const usuario = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json({ token: criarSessao(db, usuario.id), usuario: usuarioPublico(usuario) });
  });

  r.post('/login', (req, res) => {
    const email = texto(req.body?.email).toLowerCase();
    const senha = String(req.body?.senha || '');
    const usuario = db.prepare('SELECT * FROM usuarios WHERE email = ?').get(email);
    if (!usuario || !conferirSenha(senha, usuario.senha_hash)) {
      return res.status(401).json({ erro: 'E-mail ou senha incorretos.' });
    }
    res.json({ token: criarSessao(db, usuario.id), usuario: usuarioPublico(usuario) });
  });

  r.post('/logout', exigirLogin(db), (req, res) => {
    db.prepare('DELETE FROM sessoes WHERE token = ?').run(req.token);
    res.status(204).end();
  });

  // READ - dados do usuário logado
  r.get('/me', exigirLogin(db), (req, res) => res.json(usuarioPublico(req.usuario)));

  // UPDATE - perfil (nome, telefone, endereço e, opcionalmente, senha)
  r.put('/me', exigirLogin(db), (req, res) => {
    const b = req.body || {};
    const erros = [];
    if (texto(b.nome).length < 3) erros.push('Informe seu nome completo.');
    validarEndereco(b, erros);
    if (b.senha && String(b.senha).length < 6) erros.push('A nova senha precisa ter pelo menos 6 caracteres.');
    if (erros.length) return res.status(400).json({ erro: erros[0], erros });

    db.prepare(`
      UPDATE usuarios SET nome = @nome, telefone = @telefone, cep = @cep, logradouro = @logradouro, numero = @numero,
             complemento = @complemento, bairro = @bairro, cidade = @cidade, uf = @uf
      WHERE id = @id
    `).run({ id: req.usuario.id, nome: texto(b.nome), telefone: texto(b.telefone) || null, ...normalizarEndereco(b) });
    if (b.senha) {
      db.prepare('UPDATE usuarios SET senha_hash = ? WHERE id = ?').run(gerarHash(String(b.senha)), req.usuario.id);
    }
    res.json(usuarioPublico(db.prepare('SELECT * FROM usuarios WHERE id = ?').get(req.usuario.id)));
  });

  return r;
};
