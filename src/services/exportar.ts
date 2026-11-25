/**
 * Gera o arquivo JSON para o dashboard de Análise de Dados.
 * No celular abre a janela de compartilhar (salvar no Drive, enviar por e-mail/WhatsApp...).
 * Na web baixa o arquivo direto.
 */
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

import { api } from './api';

export function nomeArquivoExportacao(data = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `doceencanto-dados-${data.getFullYear()}-${p(data.getMonth() + 1)}-${p(data.getDate())}.json`;
}

export async function exportarJson(): Promise<{ arquivo: string; pedidos: number }> {
  const dados = await api.exportarDados();
  const texto = JSON.stringify(dados, null, 2);
  const nome = nomeArquivoExportacao();
  const pedidos = Array.isArray((dados as any).pedidos) ? (dados as any).pedidos.length : 0;

  if (Platform.OS === 'web') {
    const blob = new Blob([texto], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = nome;
    link.click();
    URL.revokeObjectURL(link.href);
    return { arquivo: nome, pedidos };
  }

  const arquivo = new File(Paths.cache, nome);
  if (arquivo.exists) arquivo.delete();
  arquivo.create();
  arquivo.write(texto);

  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(arquivo.uri, {
      mimeType: 'application/json',
      dialogTitle: 'Salvar dados da Doce Encanto',
      UTI: 'public.json',
    });
  }
  return { arquivo: nome, pedidos };
}
