/**
 * Identidade visual da Doce Encanto.
 * Todas as telas usam estas cores e medidas — mude aqui para mudar o app inteiro.
 */
export const Cores = {
  primaria: '#D91B72',
  primariaEscura: '#B0125B',
  rosaClaro: '#FFE5F0',
  fundo: '#FFF8FA',
  superficie: '#FFFFFF',
  texto: '#2B2226',
  textoSecundario: '#6F666B',
  textoClaro: '#9A8F95',
  borda: '#EBDDE3',
  sucesso: '#1E8E5A',
  sucessoClaro: '#E3F5EC',
  aviso: '#B26A00',
  avisoClaro: '#FFF1DC',
  erro: '#C62828',
  erroClaro: '#FDE8E8',
  branco: '#FFFFFF',
} as const;

export const Espaco = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

export const Raio = { sm: 8, md: 12, lg: 16, pilula: 999 } as const;

export const Fonte = {
  pequena: 13,
  normal: 15,
  campo: 16,
  subtitulo: 18,
  titulo: 22,
  destaque: 28,
} as const;

export const Sombra = {
  shadowColor: '#6B2142',
  shadowOpacity: 0.08,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 3 },
  elevation: 2,
} as const;
