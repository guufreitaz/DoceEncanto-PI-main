/** Funções pequenas de validação, compartilhadas pelas rotas. */

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const UFS = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE',
  'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];
const CATEGORIAS = ['Bolo', 'Doce', 'Salgado'];

const texto = (v) => (typeof v === 'string' ? v.trim() : '');
const soDigitos = (v) => String(v ?? '').replace(/\D/g, '');

function validarEndereco(e = {}, erros = []) {
  if (soDigitos(e.cep).length !== 8) erros.push('CEP inválido.');
  if (!texto(e.logradouro)) erros.push('Informe a rua.');
  if (!texto(e.numero)) erros.push('Informe o número.');
  if (!texto(e.cidade)) erros.push('Informe a cidade.');
  if (!UFS.includes(texto(e.uf).toUpperCase())) erros.push('UF inválida.');
  return erros;
}

function normalizarEndereco(e = {}) {
  const cep = soDigitos(e.cep);
  return {
    cep: cep.length === 8 ? `${cep.slice(0, 5)}-${cep.slice(5)}` : cep,
    logradouro: texto(e.logradouro),
    numero: texto(e.numero),
    complemento: texto(e.complemento) || null,
    bairro: texto(e.bairro) || null,
    cidade: texto(e.cidade),
    uf: texto(e.uf).toUpperCase(),
  };
}

function validarProduto(p = {}) {
  const erros = [];
  if (texto(p.nome).length < 3) erros.push('O nome precisa ter pelo menos 3 letras.');
  const preco = Number(p.preco);
  if (!Number.isFinite(preco) || preco <= 0) erros.push('Informe um preço maior que zero.');
  if (!CATEGORIAS.includes(p.categoria)) erros.push(`Categoria deve ser: ${CATEGORIAS.join(', ')}.`);
  return erros;
}

module.exports = { EMAIL, UFS, CATEGORIAS, texto, soDigitos, validarEndereco, normalizarEndereco, validarProduto };
