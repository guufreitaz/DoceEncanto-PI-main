import { ActivityIndicator, Pressable, StyleProp, StyleSheet, Text, ViewStyle } from 'react-native';

import { Cores, Espaco, Fonte, Raio } from '@/constants/theme';

type Props = {
  titulo: string;
  onPress: () => void;
  variante?: 'primario' | 'secundario' | 'perigo' | 'texto';
  carregando?: boolean;
  desabilitado?: boolean;
  estilo?: StyleProp<ViewStyle>;
  testID?: string;
};

export function Botao({ titulo, onPress, variante = 'primario', carregando, desabilitado, estilo, testID }: Props) {
  const inativo = desabilitado || carregando;
  const corTexto =
    variante === 'primario' ? Cores.branco : variante === 'perigo' ? Cores.erro : Cores.primaria;

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!inativo, busy: !!carregando }}
      onPress={onPress}
      disabled={inativo}
      style={({ pressed }) => [
        styles.base,
        styles[variante],
        pressed && styles.pressionado,
        inativo && styles.inativo,
        estilo,
      ]}>
      {carregando ? (
        <ActivityIndicator color={corTexto} />
      ) : (
        <Text style={[styles.rotulo, { color: corTexto }]}>{titulo}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 50,
    borderRadius: Raio.pilula,
    paddingHorizontal: Espaco.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primario: { backgroundColor: Cores.primaria },
  secundario: { backgroundColor: Cores.superficie, borderWidth: 1.5, borderColor: Cores.primaria },
  perigo: { backgroundColor: Cores.superficie, borderWidth: 1.5, borderColor: Cores.erro },
  texto: { backgroundColor: 'transparent' },
  rotulo: { fontSize: Fonte.normal, fontWeight: '700' },
  pressionado: { opacity: 0.85 },
  inativo: { opacity: 0.5 },
});
