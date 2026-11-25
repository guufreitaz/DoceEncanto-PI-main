/**
 * Regras do carrinho como funções puras (sem React), para poder testar isoladamente.
 * O CartContext só guarda o estado e chama estas funções.
 */
import type { Produto } from '@/services/tipos';

export const QUANTIDADE_MAXIMA = 99;

export type ItemCarrinho = {
  produtoId: number;
  nome: string;
  preco: number;
  categoria: Produto['categoria'];
  imagem: string | null;
  quantidade: number;
};

export function adicionarItem(itens: ItemCarrinho[], produto: Produto, quantidade = 1): ItemCarrinho[] {
  const existente = itens.find((i) => i.produtoId === produto.id);
  if (existente) {
    return alterarQuantidade(itens, produto.id, existente.quantidade + quantidade);
  }
  return [
    ...itens,
    {
      produtoId: produto.id,
      nome: produto.nome,
      preco: produto.preco,
      categoria: produto.categoria,
      imagem: produto.imagem,
      quantidade: Math.min(Math.max(1, quantidade), QUANTIDADE_MAXIMA),
    },
  ];
}

/** Quantidade 0 (ou menos) tira o item do carrinho. */
export function alterarQuantidade(itens: ItemCarrinho[], produtoId: number, quantidade: number): ItemCarrinho[] {
  if (quantidade <= 0) return removerItem(itens, produtoId);
  return itens.map((i) =>
    i.produtoId === produtoId ? { ...i, quantidade: Math.min(quantidade, QUANTIDADE_MAXIMA) } : i
  );
}

export function removerItem(itens: ItemCarrinho[], produtoId: number): ItemCarrinho[] {
  return itens.filter((i) => i.produtoId !== produtoId);
}

export function calcularSubtotal(itens: ItemCarrinho[]): number {
  return Math.round(itens.reduce((soma, i) => soma + i.preco * i.quantidade, 0) * 100) / 100;
}

export function contarItens(itens: ItemCarrinho[]): number {
  return itens.reduce((soma, i) => soma + i.quantidade, 0);
}
