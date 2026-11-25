import { Alert, Platform } from 'react-native';

/**
 * Avisos e confirmações do app.
 *
 * Quando o <ModalProvider> está montado (sempre, no app), aparecem no modal próprio da
 * Doce Encanto (components/Modal.tsx). Sem ele (ex.: testes isolados de uma tela),
 * caem no alerta do sistema.
 */
export type TipoModal = 'sucesso' | 'erro' | 'aviso' | 'info';

export type OpcoesModal = {
  tipo?: TipoModal;
  titulo: string;
  mensagem?: string;
  textoOk?: string;
  /** Com texto de cancelar, o modal vira uma pergunta e devolve true/false. */
  textoCancelar?: string;
  /** Botão de confirmar em vermelho (excluir, sair...). */
  perigo?: boolean;
};

type Exibidor = (opcoes: OpcoesModal) => Promise<boolean>;
let exibidor: Exibidor | null = null;

/** Chamado pelo ModalProvider ao montar. */
export function registrarExibidor(fn: Exibidor | null) {
  exibidor = fn;
}

export function mostrarModal(opcoes: OpcoesModal): Promise<boolean> {
  if (exibidor) return exibidor(opcoes);
  return alertaDoSistema(opcoes);
}

export function avisar(titulo: string, mensagem?: string, tipo: TipoModal = 'info'): Promise<boolean> {
  return mostrarModal({ tipo, titulo, mensagem });
}

export function confirmar(titulo: string, mensagem: string, textoConfirmar = 'Confirmar'): Promise<boolean> {
  return mostrarModal({ tipo: 'aviso', titulo, mensagem, textoOk: textoConfirmar, textoCancelar: 'Cancelar', perigo: true });
}

function alertaDoSistema({ titulo, mensagem, textoOk = 'OK', textoCancelar }: OpcoesModal): Promise<boolean> {
  if (Platform.OS === 'web') {
    const texto = mensagem ? `${titulo}\n\n${mensagem}` : titulo;
    if (textoCancelar) return Promise.resolve(window.confirm(texto));
    window.alert(texto);
    return Promise.resolve(true);
  }
  return new Promise((resolve) => {
    const botoes = textoCancelar
      ? [
          { text: textoCancelar, style: 'cancel' as const, onPress: () => resolve(false) },
          { text: textoOk, style: 'destructive' as const, onPress: () => resolve(true) },
        ]
      : [{ text: textoOk, onPress: () => resolve(true) }];
    Alert.alert(titulo, mensagem, botoes, { cancelable: true, onDismiss: () => resolve(false) });
  });
}
