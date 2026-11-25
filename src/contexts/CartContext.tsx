import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useContext, useEffect, useMemo, useRef, useState } from 'react';

import type { Produto } from '@/services/tipos';
import * as regras from '@/utils/carrinho';
import type { ItemCarrinho } from '@/utils/carrinho';

const CHAVE_CARRINHO = '@doceencanto/carrinho';

type ContextoCarrinho = {
  itens: ItemCarrinho[];
  quantidadeTotal: number;
  subtotal: number;
  adicionar: (produto: Produto, quantidade?: number) => void;
  alterarQuantidade: (produtoId: number, quantidade: number) => void;
  remover: (produtoId: number) => void;
  limpar: () => void;
};

const CartContext = createContext<ContextoCarrinho | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [itens, setItens] = useState<ItemCarrinho[]>([]);
  const carregou = useRef(false);

  // O carrinho continua lá mesmo se o app for fechado
  useEffect(() => {
    AsyncStorage.getItem(CHAVE_CARRINHO)
      .then((salvo) => {
        // Se a pessoa já adicionou algo antes de o carrinho salvo carregar, não sobrescreve
        if (salvo) setItens((atual) => (atual.length ? atual : JSON.parse(salvo)));
      })
      .catch(() => {})
      .finally(() => {
        carregou.current = true;
      });
  }, []);

  useEffect(() => {
    if (carregou.current) AsyncStorage.setItem(CHAVE_CARRINHO, JSON.stringify(itens)).catch(() => {});
  }, [itens]);

  const valor = useMemo<ContextoCarrinho>(
    () => ({
      itens,
      quantidadeTotal: regras.contarItens(itens),
      subtotal: regras.calcularSubtotal(itens),
      adicionar: (produto, quantidade = 1) => setItens((atual) => regras.adicionarItem(atual, produto, quantidade)),
      alterarQuantidade: (id, qtd) => setItens((atual) => regras.alterarQuantidade(atual, id, qtd)),
      remover: (id) => setItens((atual) => regras.removerItem(atual, id)),
      limpar: () => setItens([]),
    }),
    [itens]
  );

  return <CartContext.Provider value={valor}>{children}</CartContext.Provider>;
}

export function useCarrinho() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCarrinho precisa estar dentro do CartProvider');
  return ctx;
}
