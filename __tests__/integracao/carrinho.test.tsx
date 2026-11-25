/**
 * TESTE DE INTEGRAÇÃO: tela do carrinho + CartContext + regras do carrinho.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { useEffect } from 'react';

import CarrinhoScreen from '@/app/(loja)/carrinho';
import { CartProvider, useCarrinho } from '@/contexts/CartContext';
import type { Produto } from '@/services/tipos';

const mockRouter = { push: jest.fn(), navigate: jest.fn() };
jest.mock('expo-router', () => ({ useRouter: () => mockRouter }));

const cupcake: Produto = { id: 1, nome: 'Cupcake de Framboesa', descricao: '', preco: 14.9, categoria: 'Doce', imagem: null, ativo: true };
const bolo: Produto = { id: 2, nome: 'Fatia de Morango', descricao: '', preco: 18.9, categoria: 'Bolo', imagem: null, ativo: true };

/** Coloca produtos no carrinho antes de mostrar a tela. */
function ComItens({ produtos }: { produtos: [Produto, number][] }) {
  const { adicionar, itens } = useCarrinho();
  useEffect(() => {
    produtos.forEach(([p, q]) => adicionar(p, q));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return itens.length || produtos.length === 0 ? <CarrinhoScreen /> : null;
}

beforeEach(async () => {
  jest.clearAllMocks();
  await AsyncStorage.clear();
});

async function abrir(produtos: [Produto, number][]) {
  await render(<CartProvider><ComItens produtos={produtos} /></CartProvider>);
}

test('mostra os itens e o subtotal', async () => {
  await abrir([[cupcake, 2], [bolo, 1]]);
  expect(await screen.findByText('Cupcake de Framboesa')).toBeOnTheScreen();
  expect(screen.getByText('Subtotal (3 itens)')).toBeOnTheScreen();
  expect(screen.getByText('R$ 48,70')).toBeOnTheScreen();
});

test('botões + e − mudam a quantidade e o total', async () => {
  await abrir([[cupcake, 1]]);
  await fireEvent.press(await screen.findByTestId('mais-1'));
  expect(screen.getByTestId('quantidade-1')).toHaveTextContent('2');
  expect(screen.getAllByText('R$ 29,80').length).toBeGreaterThan(0);

  await fireEvent.press(screen.getByTestId('menos-1'));
  expect(screen.getByTestId('quantidade-1')).toHaveTextContent('1');
});

test('diminuir a partir de 1 remove o item (não fica com quantidade 0 ou negativa)', async () => {
  await abrir([[cupcake, 1], [bolo, 1]]);
  await fireEvent.press(await screen.findByTestId('menos-1'));
  expect(screen.queryByTestId('item-carrinho-1')).not.toBeOnTheScreen();
  expect(screen.getByTestId('item-carrinho-2')).toBeOnTheScreen();
});

test('carrinho vazio mostra o aviso e leva ao cardápio', async () => {
  await abrir([]);
  expect(await screen.findByText('Seu carrinho está vazio')).toBeOnTheScreen();
  await fireEvent.press(screen.getByText('Ver cardápio'));
  expect(mockRouter.navigate).toHaveBeenCalledWith('/catalogo');
});

test('finalizar compra vai para o pagamento', async () => {
  await abrir([[bolo, 1]]);
  await fireEvent.press(await screen.findByTestId('finalizar-compra'));
  expect(mockRouter.push).toHaveBeenCalledWith('/pagamento');
});
