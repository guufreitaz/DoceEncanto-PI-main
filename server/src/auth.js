const crypto = require('crypto');

function gerarHash(senha) {
  const sal = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(senha, sal, 64).toString('hex');
  return `${sal}:${hash}`;
}

function conferirSenha(senha, salvo) {
  const [sal, hash] = String(salvo).split(':');
  if (!sal || !hash) return false;
  const calculado = crypto.scryptSync(senha, sal, 64);
  const esperado = Buffer.from(hash, 'hex');
  return esperado.length === calculado.length && crypto.timingSafeEqual(calculado, esperado);
}

function criarSessao(db, usuarioId) {
  const token = crypto.randomBytes(32).toString('hex');
  db.prepare('INSERT INTO sessoes (token, usuario_id) VALUES (?, ?)').run(token, usuarioId);
  return token;
}

/** Remove a senha antes de devolver o usuário para o app. */
function usuarioPublico(u) {
  if (!u) return null;
  const { senha_hash, ...resto } = u;
  return resto;
}

/** Middleware: exige "Authorization: Bearer <token>" válido. */
function exigirLogin(db) {
  return (req, res, next) => {
    const cabecalho = req.headers.authorization || '';
    const token = cabecalho.startsWith('Bearer ') ? cabecalho.slice(7) : null;
    if (!token) return res.status(401).json({ erro: 'Faça login para continuar.' });

    const usuario = db
      .prepare('SELECT u.* FROM sessoes s JOIN usuarios u ON u.id = s.usuario_id WHERE s.token = ?')
      .get(token);
    if (!usuario) return res.status(401).json({ erro: 'Sessão expirada. Entre novamente.' });

    req.usuario = usuario;
    req.token = token;
    next();
  };
}

function exigirAdmin(req, res, next) {
  if (req.usuario?.perfil !== 'admin') {
    return res.status(403).json({ erro: 'Apenas a administradora pode fazer isso.' });
  }
  next();
}

module.exports = { gerarHash, conferirSenha, criarSessao, usuarioPublico, exigirLogin, exigirAdmin };
