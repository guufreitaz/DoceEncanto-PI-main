/**
 * Cliente REST da API da Doce Encanto.
 * Todas as telas falam com o servidor por aqui.
 */
import { API_URL } from './config';
import type { Endereco, Mensagem, Pagamento, Pedido, Produto, Usuario } from './tipos';

export class ErroApi extends Error {
  constructor(mensagem: string, public status: number) {
    super(mensagem);
    this.name = 'ErroApi';
  }
}

let tokenAtual: string | null = null;
export const definirToken = (token: string | null) => {
  tokenAtual = token;
};

type Opcoes = { metodo?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'; corpo?: unknown };

export async function requisitar<T>(caminho: string, { metodo = 'GET', corpo }: Opcoes = {}): Promise<T> {
  let resposta: Response;
  try {
    resposta = await fetch(`${API_URL}${caminho}`, {
      method: metodo,
      headers: {
        'Content-Type': 'application/json',
        ...(tokenAtual ? { Authorization: `Bearer ${tokenAtual}` } : {}),
      },
      body: corpo === undefined ? undefined : JSON.stringify(corpo),
    });
  } catch {
    throw new ErroApi(
      `Não foi possível conectar ao servidor (${API_URL}). Verifique se a API está rodando e se o celular está na mesma rede.`,
      0
    );
  }

  if (resposta.status === 204) return undefined as T;
  const dados = await resposta.json().catch(() => ({}));
  if (!resposta.ok) {
    throw new ErroApi(dados?.erro || `Erro ${resposta.status} no servidor.`, resposta.status);
  }
  return dados as T;
}

type Sessao = { token: string; usuario: Usuario };
export type DadosCadastro = Endereco & { nome: string; email: string; telefone: string; senha: string };
export type DadosProduto = Omit<Produto, 'id'>;

export const api = {
  // Autenticação e perfil
  login: (email: string, senha: string) => requisitar<Sessao>('/auth/login', { metodo: 'POST', corpo: { email, senha } }),
  cadastrar: (dados: DadosCadastro) => requisitar<Sessao>('/auth/cadastro', { metodo: 'POST', corpo: dados }),
  sair: () => requisitar<void>('/auth/logout', { metodo: 'POST' }),
  eu: () => requisitar<Usuario>('/auth/me'),
  atualizarPerfil: (dados: Partial<DadosCadastro>) => requisitar<Usuario>('/auth/me', { metodo: 'PUT', corpo: dados }),

  // Produtos (CRUD)
  listarProdutos: (filtro: { categoria?: string; busca?: string; todos?: boolean } = {}) => {
    const q = new URLSearchParams();
    if (filtro.categoria) q.set('categoria', filtro.categoria);
    if (filtro.busca) q.set('busca', filtro.busca);
    if (filtro.todos) q.set('todos', '1');
    const s = q.toString();
    return requisitar<Produto[]>(`/produtos${s ? `?${s}` : ''}`);
  },
  buscarProduto: (id: number) => requisitar<Produto>(`/produtos/${id}`),
  criarProduto: (dados: DadosProduto) => requisitar<Produto>('/produtos', { metodo: 'POST', corpo: dados }),
  alterarProduto: (id: number, dados: DadosProduto) =>
    requisitar<Produto>(`/produtos/${id}`, { metodo: 'PUT', corpo: dados }),
  excluirProduto: (id: number) =>
    requisitar<{ removido: boolean; modo: 'excluido' | 'desativado' }>(`/produtos/${id}`, { metodo: 'DELETE' }),

  // Frete e pedidos
  frete: (uf: string, subtotal: number) =>
    requisitar<{ frete: number; freteGratisAPartirDe: number }>(`/frete?uf=${uf}&subtotal=${subtotal}`),
  criarPedido: (itens: { produto_id: number; quantidade: number }[], endereco: Endereco) =>
    requisitar<{ pedido: Pedido; pagamento: Pagamento }>('/pedidos', { metodo: 'POST', corpo: { itens, endereco } }),
  listarPedidos: (status?: string) => requisitar<Pedido[]>(`/pedidos${status ? `?status=${status}` : ''}`),
  buscarPedido: (id: number) => requisitar<Pedido>(`/pedidos/${id}`),
  pagarPedido: (id: number) =>
    requisitar<{ pedido: Pedido; pagamento: Pagamento }>(`/pedidos/${id}/pagar`, { metodo: 'POST' }),
  sincronizarPedido: (id: number) => requisitar<Pedido>(`/pedidos/${id}/sincronizar`, { metodo: 'POST' }),
  simularPagamento: (id: number, aprovado: boolean, metodo: string) =>
    requisitar<Pedido>(`/pedidos/${id}/simular-pagamento`, { metodo: 'POST', corpo: { aprovado, metodo } }),
  cancelarPedido: (id: number) => requisitar<Pedido>(`/pedidos/${id}/cancelar`, { metodo: 'POST' }),
  alterarStatusPedido: (id: number, status: string) =>
    requisitar<Pedido>(`/pedidos/${id}/status`, { metodo: 'PATCH', corpo: { status } }),

  // Contato
  enviarMensagem: (dados: { assunto: string; mensagem: string; telefone?: string }) =>
    requisitar<Mensagem>('/contato', { metodo: 'POST', corpo: dados }),
  listarMensagens: () => requisitar<Mensagem[]>('/contato'),
  marcarRespondida: (id: number, respondida: boolean) =>
    requisitar<Mensagem>(`/contato/${id}`, { metodo: 'PATCH', corpo: { respondida } }),
  excluirMensagem: (id: number) => requisitar<void>(`/contato/${id}`, { metodo: 'DELETE' }),

  // Relatórios
  exportarDados: () => requisitar<Record<string, unknown>>('/relatorios/export'),
};
