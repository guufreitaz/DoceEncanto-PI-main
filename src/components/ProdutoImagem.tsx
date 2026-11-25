import { Image } from 'expo-image';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { Cores } from '@/constants/theme';
import { API_URL } from '@/services/config';
import type { Categoria } from '@/services/tipos';

import { Icone, NomeIcone } from './Icone';

const ICONE: Record<Categoria, NomeIcone> = { Bolo: 'cake-variant-outline', Doce: 'cupcake', Salgado: 'food-croissant' };

/**
 * Endereço da foto: as fotos do cardápio ficam no servidor ("/imagens/produtos/...");
 * fotos enviadas pela administradora vêm em base64 ("data:image/...").
 */
export function enderecoImagem(imagem: string): string {
  return imagem.startsWith('/') ? `${API_URL}${imagem}` : imagem;
}

/** Foto do produto ou, se ainda não tiver foto, o ícone da categoria. */
export function ProdutoImagem({
  imagem,
  categoria,
  tamanho = 'normal',
  estilo,
}: {
  imagem: string | null;
  categoria: Categoria;
  tamanho?: 'pequeno' | 'normal' | 'grande';
  estilo?: StyleProp<ViewStyle>;
}) {
  if (imagem) {
    return (
      <Image
        source={{ uri: enderecoImagem(imagem) }}
        style={[styles.base, estilo as any]}
        contentFit="cover"
        transition={150}
        accessibilityIgnoresInvertColors
      />
    );
  }
  const tamanhoIcone = tamanho === 'pequeno' ? 24 : tamanho === 'grande' ? 72 : 40;
  return (
    <View style={[styles.base, styles.placeholder, estilo]}>
      <Icone name={ICONE[categoria] ?? 'image-outline'} size={tamanhoIcone} color={Cores.primaria} />
    </View>
  );
}

const styles = StyleSheet.create({
  base: { width: '100%', height: '100%' },
  placeholder: { alignItems: 'center', justifyContent: 'center', backgroundColor: Cores.rosaClaro },
});
