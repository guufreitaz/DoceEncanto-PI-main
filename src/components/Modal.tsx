import { ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { Cores, Espaco, Fonte, Raio } from '@/constants/theme';
import { OpcoesModal, registrarExibidor, TipoModal } from '@/utils/dialogos';

import { Botao } from './Botao';
import { Icone, NomeIcone } from './Icone';

const VISUAL: Record<TipoModal, { icone: NomeIcone; cor: string; fundo: string }> = {
  sucesso: { icone: 'check-circle-outline', cor: Cores.sucesso, fundo: Cores.sucessoClaro },
  erro: { icone: 'close-circle-outline', cor: Cores.erro, fundo: Cores.erroClaro },
  aviso: { icone: 'alert-circle-outline', cor: Cores.aviso, fundo: Cores.avisoClaro },
  info: { icone: 'information-outline', cor: Cores.primaria, fundo: Cores.rosaClaro },
};

type Pedido = OpcoesModal & { resolver: (ok: boolean) => void };

/**
 * Modal próprio do app (sucesso, erro, aviso, informação e confirmação).
 * Fica na raiz do app; as telas chamam avisar()/confirmar()/mostrarModal() de utils/dialogos.
 * Se um modal for pedido enquanto outro está aberto, ele entra na fila.
 */
export function ModalProvider({ children }: { children: ReactNode }) {
  const [fila, setFila] = useState<Pedido[]>([]);
  const atual = fila[0];
  const escala = useRef(new Animated.Value(0.92)).current;

  const exibir = useCallback(
    (opcoes: OpcoesModal) => new Promise<boolean>((resolver) => setFila((f) => [...f, { ...opcoes, resolver }])),
    []
  );

  useEffect(() => {
    registrarExibidor(exibir);
    return () => registrarExibidor(null);
  }, [exibir]);

  useEffect(() => {
    if (!atual) return;
    escala.setValue(0.92);
    Animated.spring(escala, { toValue: 1, useNativeDriver: true, friction: 7, tension: 80 }).start();
  }, [atual, escala]);

  const fechar = (ok: boolean) => {
    atual?.resolver(ok);
    setFila((f) => f.slice(1));
  };

  const visual = VISUAL[atual?.tipo ?? 'info'];
  const pergunta = Boolean(atual?.textoCancelar);

  return (
    <>
      {children}
      <Modal transparent visible={Boolean(atual)} animationType="fade" onRequestClose={() => fechar(false)}
        statusBarTranslucent>
        <Pressable style={styles.fundo} onPress={() => fechar(false)} accessibilityLabel="Fechar aviso">
          {atual ? (
            <Animated.View style={[styles.cartao, { transform: [{ scale: escala }] }]}>
              {/* Pressable vazio impede que o toque dentro do cartão feche o modal */}
              <Pressable accessibilityRole="alert" testID="modal">
                <View style={[styles.icone, { backgroundColor: visual.fundo }]}>
                  <Icone name={visual.icone} size={36} color={visual.cor} />
                </View>
                <Text style={styles.titulo}>{atual.titulo}</Text>
                {atual.mensagem ? <Text style={styles.mensagem}>{atual.mensagem}</Text> : null}
                {/* Com duas opções, os botões ficam um embaixo do outro (o principal em cima) */}
                <View style={pergunta ? styles.botoesPergunta : styles.botoes}>
                  {pergunta ? (
                    <Botao titulo={atual.textoCancelar!} variante="secundario" onPress={() => fechar(false)}
                      estilo={styles.botaoLargo} testID="modal-cancelar" />
                  ) : null}
                  <Botao
                    titulo={atual.textoOk ?? (pergunta ? 'Confirmar' : 'OK')}
                    onPress={() => fechar(true)}
                    estilo={[pergunta ? styles.botaoLargo : styles.botao, atual.perigo && { backgroundColor: Cores.erro }]}
                    testID="modal-ok"
                  />
                </View>
              </Pressable>
            </Animated.View>
          ) : null}
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fundo: {
    flex: 1,
    backgroundColor: 'rgba(43, 34, 38, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Espaco.xl,
  },
  cartao: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: Cores.superficie,
    borderRadius: Raio.lg + 4,
    padding: Espaco.xl,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  icone: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: Espaco.lg,
  },
  titulo: { fontSize: Fonte.subtitulo + 1, fontWeight: '800', color: Cores.texto, textAlign: 'center' },
  mensagem: {
    fontSize: Fonte.normal,
    color: Cores.textoSecundario,
    textAlign: 'center',
    marginTop: Espaco.sm,
    lineHeight: 21,
  },
  botoes: { flexDirection: 'row', gap: Espaco.md, marginTop: Espaco.xl },
  botoesPergunta: { flexDirection: 'column-reverse', gap: Espaco.sm, marginTop: Espaco.xl },
  botao: { flex: 1, paddingHorizontal: Espaco.md },
  botaoLargo: { alignSelf: 'stretch' },
});
