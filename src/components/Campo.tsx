import { forwardRef } from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';

import { Cores, Espaco, Fonte, Raio } from '@/constants/theme';

type Props = TextInputProps & {
  rotulo: string;
  erro?: string | null;
  dica?: string;
};

/** Campo de formulário com rótulo, mensagem de erro e dica. */
export const Campo = forwardRef<TextInput, Props>(function Campo({ rotulo, erro, dica, style, multiline, ...props }, ref) {
  return (
    <View style={styles.container}>
      <Text style={styles.rotulo}>{rotulo}</Text>
      <TextInput
        ref={ref}
        accessibilityLabel={rotulo}
        placeholderTextColor={Cores.textoClaro}
        multiline={multiline}
        style={[styles.input, multiline && styles.multilinha, !!erro && styles.inputErro, style]}
        {...props}
      />
      {erro ? <Text style={styles.erro}>{erro}</Text> : dica ? <Text style={styles.dica}>{dica}</Text> : null}
    </View>
  );
});

const styles = StyleSheet.create({
  container: { marginBottom: Espaco.lg },
  rotulo: { fontSize: Fonte.pequena, fontWeight: '600', color: Cores.texto, marginBottom: Espaco.xs + 2 },
  input: {
    minHeight: 50,
    backgroundColor: Cores.superficie,
    borderWidth: 1,
    borderColor: Cores.borda,
    borderRadius: Raio.md,
    paddingHorizontal: Espaco.md + 2,
    fontSize: Fonte.campo,
    color: Cores.texto,
  },
  multilinha: { minHeight: 110, paddingTop: Espaco.md, textAlignVertical: 'top' },
  inputErro: { borderColor: Cores.erro },
  erro: { color: Cores.erro, fontSize: Fonte.pequena, marginTop: Espaco.xs },
  dica: { color: Cores.textoSecundario, fontSize: Fonte.pequena, marginTop: Espaco.xs },
});
