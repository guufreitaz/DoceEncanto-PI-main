/** TESTES UNITÁRIOS: regras do carrinho de compras. */
import type { Produto } from '@/services/tipos';
import {
  adicionarItem,
  alterarQuantidade,
  calcularSubtotal,
  contarItens,
  QUANTIDADE_MAXIMA,
  removerItem,
} from '@/utils/carrinho';

const cupcake: Produto = { id: 1, nome: 'Cupcake', descricao: '', preco: 14.9, categoria: 'Doce', imagem: null, ativo: true };
const bolo: Produto = { id: 2, nome: 'Bolo', descricao: '', preco: 59.9, categoria: 'Bolo', imagem: null, ativo: true };

test('adicionar um produto novo cria o item com quantidade 1', () => {
  const itens = adicionarItem([], cupcake);
  expect(itens).toEqual([{ produtoId: 1, nome: 'Cupcake', preco: 14.9, categoria: 'Doce', imagem: null, quantidade: 1 }]);
});

test('adicionar o mesmo produto soma a quantidade em vez de duplicar', () => {
  const itens = adicionarItem(adicionarItem([], cupcake, 2), cupcake, 3);
  expect(itens).toHaveLength(1);
  expect(itens[0].quantidade).toBe(5);
});

test('quantidade zero ou negativa remove o item (corrige o bug do carrinho antigo)', () => {
  const itens = adicionarItem(adicionarItem([], cupcake), bolo);
  expect(alterarQuantidade(itens, 1, 0)).toHaveLength(1);
  expect(alterarQuantidade(itens, 1, -3).map((i) => i.produtoId)).toEqual([2]);
});

test('quantidade tem um limite máximo', () => {
  const itens = adicionarItem([], cupcake);
  expect(alterarQuantidade(itens, 1, 500)[0].quantidade).toBe(QUANTIDADE_MAXIMA);
});

test('remover item', () => {
  const itens = adicionarItem(adicionarItem([], cupcake), bolo);
  expect(removerItem(itens, 2).map((i) => i.produtoId)).toEqual([1]);
});

test('subtotal e contagem de itens', () => {
  const itens = adicionarItem(adicionarItem([], cupcake, 2), bolo);
  expect(calcularSubtotal(itens)).toBe(89.7);
  expect(contarItens(itens)).toBe(3);
  expect(calcularSubtotal([])).toBe(0);
});

test('as funções não alteram a lista original (imutabilidade)', () => {
  const original = adicionarItem([], cupcake);
  const copia = JSON.parse(JSON.stringify(original));
  alterarQuantidade(original, 1, 10);
  removerItem(original, 1);
  expect(original).toEqual(copia);
});
