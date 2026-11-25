/**
 * Consulta de CEP na API pública ViaCEP (base dos Correios).
 * https://viacep.com.br
 */
import { soDigitos } from '@/utils/formatacao';

export type EnderecoCep = { cep: string; logradouro: string; bairro: string; cidade: string; uf: string };

export async function buscarCep(cep: string, fetchFn: typeof fetch = fetch): Promise<EnderecoCep> {
  const digitos = soDigitos(cep);
  if (digitos.length !== 8) throw new Error('O CEP precisa ter 8 números.');

  let dados: any;
  try {
    const resposta = await fetchFn(`https://viacep.com.br/ws/${digitos}/json/`);
    dados = await resposta.json();
  } catch {
    throw new Error('Não foi possível consultar o CEP agora. Preencha o endereço manualmente.');
  }
  if (!dados || dados.erro) throw new Error('CEP não encontrado.');

  return {
    cep: dados.cep,
    logradouro: dados.logradouro ?? '',
    bairro: dados.bairro ?? '',
    cidade: dados.localidade ?? '',
    uf: dados.uf ?? '',
  };
}
