/** Pequenos componentes visuais reaproveitados pelas telas. */
import { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { Icone, NomeIcone } from '@/components/Icone';
import { Cores, Espaco, Fonte, Raio, Sombra } from '@/constants/theme';
import { STATUS_PEDIDO, StatusPedido } from '@/utils/formatacao';

export function Cartao({ children, estilo }: { children: ReactNode; estilo?: StyleProp<ViewStyle> }) {
  return <View style={[styles.cartao, estilo]}>{children}</View>;
}

export function Carregando({ texto }: { texto?: string }) {
  return (
    <View style={styles.centro}>
      <ActivityIndicator size="large" color={Cores.primaria} />
      {texto ? <Text style={styles.textoCentro}>{texto}</Text> : null}
    </View>
  );
}

export function Vazio({ icone, titulo, texto, acao }: { icone: NomeIcone; titulo: string; texto?: string; acao?: ReactNode }) {
  return (
    <View style={styles.centro}>
      <View style={styles.iconeVazio}>
        <Icone name={icone} size={40} color={Cores.primaria} />
      </View>
      <Text style={styles.tituloVazio}>{titulo}</Text>
      {texto ? <Text style={styles.textoCentro}>{texto}</Text> : null}
      {acao ? <View style={{ marginTop: Espaco.lg, alignSelf: 'stretch' }}>{acao}</View> : null}
    </View>
  );
}

export function MensagemErro({ texto, onTentar }: { texto: string; onTentar?: () => void }) {
  return (
    <View style={styles.caixaErro}>
      <Text style={styles.textoErro}>{texto}</Text>
      {onTentar ? (
        <Pressable onPress={onTentar} accessibilityRole="button">
          <Text style={styles.tentar}>Tentar de novo</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const TONS = {
  aviso: [Cores.avisoClaro, Cores.aviso],
  sucesso: [Cores.sucessoClaro, Cores.sucesso],
  erro: [Cores.erroClaro, Cores.erro],
  info: [Cores.rosaClaro, Cores.primariaEscura],
} as const;

export function EtiquetaStatus({ status }: { status: StatusPedido }) {
  const info = STATUS_PEDIDO[status] ?? { rotulo: status, tom: 'info' as const };
  const [fundo, cor] = TONS[info.tom];
  return (
    <View style={[styles.etiqueta, { backgroundColor: fundo }]}>
      <Text style={[styles.textoEtiqueta, { color: cor }]}>{info.rotulo}</Text>
    </View>
  );
}

export function Chip({ rotulo, ativo, onPress }: { rotulo: string; ativo: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: ativo }}
      style={[styles.chip, ativo && styles.chipAtivo]}>
      <Text style={[styles.chipTexto, ativo && styles.chipTextoAtivo]}>{rotulo}</Text>
    </Pressable>
  );
}

export function LinhaValor({ rotulo, valor, destaque }: { rotulo: string; valor: string; destaque?: boolean }) {
  return (
    <View style={styles.linhaValor}>
      <Text style={[styles.rotuloValor, destaque && styles.destaque]}>{rotulo}</Text>
      <Text style={[styles.valor, destaque && styles.destaqueValor]}>{valor}</Text>
    </View>
  );
}

export function TituloSecao({ children }: { children: ReactNode }) {
  return <Text style={styles.tituloSecao}>{children}</Text>;
}

const styles = StyleSheet.create({
  cartao: { backgroundColor: Cores.superficie, borderRadius: Raio.lg, padding: Espaco.lg, ...Sombra },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Espaco.xxl },
  iconeVazio: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Cores.rosaClaro,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Espaco.lg,
  },
  tituloVazio: { fontSize: Fonte.subtitulo, fontWeight: '700', color: Cores.texto, textAlign: 'center' },
  textoCentro: { fontSize: Fonte.normal, color: Cores.textoSecundario, textAlign: 'center', marginTop: Espaco.sm },
  caixaErro: { backgroundColor: Cores.erroClaro, borderRadius: Raio.md, padding: Espaco.md, margin: Espaco.lg },
  textoErro: { color: Cores.erro, fontSize: Fonte.pequena },
  tentar: { color: Cores.erro, fontWeight: '700', marginTop: Espaco.sm },
  etiqueta: { alignSelf: 'flex-start', borderRadius: Raio.pilula, paddingHorizontal: 10, paddingVertical: 4 },
  textoEtiqueta: { fontSize: 12, fontWeight: '700' },
  chip: {
    borderWidth: 1.5,
    borderColor: Cores.primaria,
    borderRadius: Raio.pilula,
    paddingVertical: 7,
    paddingHorizontal: 16,
    marginRight: Espaco.sm,
    backgroundColor: Cores.superficie,
  },
  chipAtivo: { backgroundColor: Cores.primaria },
  chipTexto: { color: Cores.primaria, fontWeight: '600', fontSize: Fonte.pequena },
  chipTextoAtivo: { color: Cores.branco },
  linhaValor: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, gap: Espaco.md },
  rotuloValor: { flex: 1, color: Cores.textoSecundario, fontSize: Fonte.normal },
  valor: { flexShrink: 0, color: Cores.texto, fontSize: Fonte.normal },
  destaque: { color: Cores.texto, fontWeight: '700', fontSize: Fonte.subtitulo - 1 },
  destaqueValor: { color: Cores.primaria, fontWeight: '800', fontSize: Fonte.subtitulo },
  tituloSecao: {
    fontSize: Fonte.pequena,
    fontWeight: '700',
    color: Cores.textoSecundario,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: Espaco.xl,
    marginBottom: Espaco.sm,
  },
});
