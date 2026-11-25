/** Formatos dos dados que vêm da API (espelham as tabelas do banco). */
import type { StatusPedido } from '@/utils/formatacao';

export type Categoria = 'Bolo' | 'Doce' | 'Salgado';
export const CATEGORIAS: Categoria[] = ['Bolo', 'Doce', 'Salgado'];

export type Endereco = {
  cep: string;
  logradouro: string;
  numero: string;
  complemento?: string | null;
  bairro?: string | null;
  cidade: string;
  uf: string;
};

export type Usuario = Partial<Endereco> & {
  id: number;
  nome: string;
  email: string;
  telefone: string | null;
  perfil: 'cliente' | 'admin';
  criado_em: string;
};

export type Produto = {
  id: number;
  nome: string;
  descricao: string;
  preco: number;
  categoria: Categoria;
  imagem: string | null;
  ativo: boolean;
};

export type ItemPedido = {
  id: number;
  produto_id: number;
  nome: string;
  categoria: Categoria;
  preco_unitario: number;
  quantidade: number;
};

export type Pedido = Endereco & {
  id: number;
  usuario_id: number;
  status: StatusPedido;
  subtotal: number;
  frete: number;
  total: number;
  metodo_pagamento: string | null;
  mp_preference_id: string | null;
  mp_payment_id: string | null;
  criado_em: string;
  atualizado_em: string;
  cliente_nome?: string;
  quantidade_itens?: number;
  itens?: ItemPedido[];
};

export type Pagamento = { modo: 'mercado_pago' | 'simulado'; url: string | null };

export type Mensagem = {
  id: number;
  usuario_id: number | null;
  nome: string;
  email: string;
  telefone: string | null;
  assunto: string;
  mensagem: string;
  respondida: boolean;
  criado_em: string;
};
