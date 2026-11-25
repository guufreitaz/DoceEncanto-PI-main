/** Formatação e validação usadas em várias telas (testadas em __tests__/unidade). */

/** 1234.5 -> "R$ 1.234,50" */
export function formatarPreco(valor: number): string {
  const negativo = valor < 0;
  const [inteiro, centavos] = Math.abs(valor).toFixed(2).split('.');
  const comPontos = inteiro.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${negativo ? '-' : ''}R$ ${comPontos},${centavos}`;
}

/** "R$ 89,90" / "89.9" / "1.234,50" -> número (ou NaN se não for válido) */
export function lerPreco(texto: string): number {
  let limpo = String(texto).replace(/[^\d,.-]/g, '');
  if (limpo.includes(',')) limpo = limpo.replace(/\./g, '').replace(',', '.');
  if (limpo === '' || limpo === '.' || limpo === '-') return NaN;
  return Number(limpo);
}

export const soDigitos = (texto: string) => String(texto ?? '').replace(/\D/g, '');

/** "01310100" -> "01310-100" (vai formatando enquanto a pessoa digita) */
export function mascaraCep(texto: string): string {
  const d = soDigitos(texto).slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
}

/** "11999998888" -> "(11) 99999-8888" */
export function mascaraTelefone(texto: string): string {
  const d = soDigitos(texto).slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : '';
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export function emailValido(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(email).trim());
}

/** "2026-11-23 20:49:10" (UTC, vindo do SQLite) -> "23/11/2026 17:49" no horário do aparelho */
export function formatarData(data: string): string {
  const d = new Date(data.includes('T') ? data : `${data.replace(' ', 'T')}Z`);
  if (Number.isNaN(d.getTime())) return data;
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

export type StatusPedido =
  | 'aguardando_pagamento'
  | 'pago'
  | 'recusado'
  | 'em_preparo'
  | 'enviado'
  | 'entregue'
  | 'cancelado';

export const STATUS_PEDIDO: Record<StatusPedido, { rotulo: string; tom: 'aviso' | 'sucesso' | 'erro' | 'info' }> = {
  aguardando_pagamento: { rotulo: 'Aguardando pagamento', tom: 'aviso' },
  pago: { rotulo: 'Pago', tom: 'sucesso' },
  recusado: { rotulo: 'Pagamento recusado', tom: 'erro' },
  em_preparo: { rotulo: 'Em preparo', tom: 'info' },
  enviado: { rotulo: 'Saiu para entrega', tom: 'info' },
  entregue: { rotulo: 'Entregue', tom: 'sucesso' },
  cancelado: { rotulo: 'Cancelado', tom: 'erro' },
};

export const METODO_PAGAMENTO: Record<string, string> = {
  pix: 'Pix',
  cartao_credito: 'Cartão de crédito',
  cartao_debito: 'Cartão de débito',
  boleto: 'Boleto',
  saldo_mercado_pago: 'Saldo Mercado Pago',
};
