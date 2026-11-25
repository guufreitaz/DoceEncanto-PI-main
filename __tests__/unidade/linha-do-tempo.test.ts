/** TESTE UNITÁRIO: em que etapa da entrega o pedido está. */
import { etapaAtual } from '@/components/LinhaDoTempo';

test.each([
  ['aguardando_pagamento', 0],
  ['pago', 1],
  ['em_preparo', 2],
  ['enviado', 3],
  ['entregue', 4],
  ['cancelado', -1],
  ['recusado', -1],
] as const)('%s fica na etapa %i', (status, etapa) => {
  expect(etapaAtual(status)).toBe(etapa);
});
