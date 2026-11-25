/** TESTES UNITÁRIOS: consulta de CEP (ViaCEP) e cliente da API com fetch simulado. */
import { api, definirToken, ErroApi } from '@/services/api';
import { nomeArquivoExportacao } from '@/services/exportar';
import { buscarCep } from '@/services/viacep';

const resposta = (corpo: unknown, status = 200) =>
  ({ ok: status < 400, status, json: async () => corpo }) as unknown as Response;

describe('buscarCep (ViaCEP)', () => {
  test('converte a resposta da ViaCEP para o nosso formato', async () => {
    const fetchFn = jest.fn().mockResolvedValue(
      resposta({ cep: '01310-100', logradouro: 'Avenida Paulista', bairro: 'Bela Vista', localidade: 'São Paulo', uf: 'SP' })
    );
    const e = await buscarCep('01310-100', fetchFn);
    expect(fetchFn).toHaveBeenCalledWith('https://viacep.com.br/ws/01310100/json/');
    expect(e).toEqual({ cep: '01310-100', logradouro: 'Avenida Paulista', bairro: 'Bela Vista', cidade: 'São Paulo', uf: 'SP' });
  });
  test('CEP inexistente', async () => {
    await expect(buscarCep('99999999', jest.fn().mockResolvedValue(resposta({ erro: true })))).rejects.toThrow('CEP não encontrado.');
  });
  test('CEP incompleto nem chega a consultar', async () => {
    const fetchFn = jest.fn();
    await expect(buscarCep('123', fetchFn)).rejects.toThrow('8 números');
    expect(fetchFn).not.toHaveBeenCalled();
  });
});

describe('cliente da API', () => {
  const fetchOriginal = globalThis.fetch;
  afterEach(() => {
    globalThis.fetch = fetchOriginal;
    definirToken(null);
  });

  test('envia o token no cabeçalho Authorization', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue(resposta([]));
    definirToken('abc123');
    await api.listarPedidos();
    const [, opcoes] = (globalThis.fetch as jest.Mock).mock.calls[0];
    expect(opcoes.headers.Authorization).toBe('Bearer abc123');
  });

  test('monta os filtros do catálogo na URL', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue(resposta([]));
    await api.listarProdutos({ categoria: 'Bolo', busca: 'ninho' });
    expect((globalThis.fetch as jest.Mock).mock.calls[0][0]).toMatch(/\/produtos\?categoria=Bolo&busca=ninho$/);
  });

  test('erro da API vira ErroApi com a mensagem do servidor', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue(resposta({ erro: 'E-mail ou senha incorretos.' }, 401));
    await expect(api.login('a@b.com', 'x')).rejects.toMatchObject({ message: 'E-mail ou senha incorretos.', status: 401 });
  });

  test('servidor fora do ar gera mensagem amigável', async () => {
    globalThis.fetch = jest.fn().mockRejectedValue(new TypeError('Network request failed'));
    const erro = await api.eu().catch((e) => e);
    expect(erro).toBeInstanceOf(ErroApi);
    expect(erro.message).toMatch(/Não foi possível conectar ao servidor/);
  });
});

test('nome do arquivo exportado tem a data', () => {
  expect(nomeArquivoExportacao(new Date(2026, 10, 5))).toBe('doceencanto-dados-2026-11-05.json');
});
