/**
 * Tabela de frete simples por região (a confeitaria fica em São Paulo - SP).
 * Pedidos a partir de R$ 150,00 têm frete grátis.
 */
const FRETE_GRATIS_A_PARTIR_DE = 150;

const REGIOES = {
  SP: 12,
  sudeste: 18, // RJ, MG, ES
  sul: 22, // PR, SC, RS
  outros: 30,
};

function calcularFrete(uf, subtotal) {
  if (subtotal >= FRETE_GRATIS_A_PARTIR_DE) return 0;
  const sigla = String(uf || '').toUpperCase();
  if (sigla === 'SP') return REGIOES.SP;
  if (['RJ', 'MG', 'ES'].includes(sigla)) return REGIOES.sudeste;
  if (['PR', 'SC', 'RS'].includes(sigla)) return REGIOES.sul;
  return REGIOES.outros;
}

module.exports = { calcularFrete, FRETE_GRATIS_A_PARTIR_DE };
