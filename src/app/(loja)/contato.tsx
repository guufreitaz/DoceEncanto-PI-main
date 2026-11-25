import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { KeyboardAvoidingView, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Botao } from '@/components/Botao';
import { Campo } from '@/components/Campo';
import { Cartao, MensagemErro, TituloSecao } from '@/components/Interface';
import { Cores, Espaco, Fonte, Raio } from '@/constants/theme';
import { api } from '@/services/api';
import type { Mensagem } from '@/services/tipos';
import { avisar } from '@/utils/dialogos';
import { formatarData } from '@/utils/formatacao';
import { Icone, NomeIcone } from '@/components/Icone';

const LOJA = {
  whatsapp: '5511988880000',
  telefone: '(11) 98888-0000',
  email: 'contato@doceencanto.com',
  endereco: 'Av. Paulista, 1000 - Bela Vista, São Paulo/SP',
  horario: 'Terça a sábado, 9h às 19h',
};


function Canal({ icone, titulo, valor, onPress }: { icone: NomeIcone; titulo: string; valor: string; onPress?: () => void }) {
  return (
    <Pressable style={styles.canal} onPress={onPress} disabled={!onPress} accessibilityRole={onPress ? 'link' : 'text'}>
      <View style={styles.canalIcone}>
        <Icone name={icone} size={20} color={Cores.primaria} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.canalTitulo}>{titulo}</Text>
        <Text style={styles.canalValor}>{valor}</Text>
      </View>
      {onPress ? <Icone name="chevron-right" size={18} color={Cores.textoClaro} /> : null}
    </Pressable>
  );
}

export default function ContatoScreen() {
  const [assunto, setAssunto] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [minhas, setMinhas] = useState<Mensagem[]>([]);

  const carregar = useCallback(() => {
    api.listarMensagens().then(setMinhas).catch(() => {});
  }, []);
  useFocusEffect(carregar);

  async function enviar() {
    if (assunto.trim().length < 3) return setErro('Informe o assunto.');
    if (mensagem.trim().length < 10) return setErro('Escreva uma mensagem com pelo menos 10 caracteres.');
    setErro(null);
    setEnviando(true);
    try {
      await api.enviarMensagem({ assunto, mensagem });
      setAssunto('');
      setMensagem('');
      carregar();
      avisar('Mensagem enviada!', 'Respondemos em até 1 dia útil pelo seu e-mail ou telefone.', 'sucesso');
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Cartao estilo={{ padding: 0 }}>
          <Canal icone="whatsapp" titulo="WhatsApp" valor={LOJA.telefone}
            onPress={() => Linking.openURL(`https://wa.me/${LOJA.whatsapp}`)} />
          <Canal icone="phone-outline" titulo="Telefone" valor={LOJA.telefone}
            onPress={() => Linking.openURL(`tel:+${LOJA.whatsapp}`)} />
          <Canal icone="email-outline" titulo="E-mail" valor={LOJA.email}
            onPress={() => Linking.openURL(`mailto:${LOJA.email}`)} />
          <Canal icone="map-marker-outline" titulo="Loja" valor={LOJA.endereco} />
          <Canal icone="clock-outline" titulo="Horário" valor={LOJA.horario} />
        </Cartao>

        <TituloSecao>Envie uma mensagem</TituloSecao>
        <Campo rotulo="Assunto" placeholder="Ex: Encomenda para festa" value={assunto} onChangeText={setAssunto}
          testID="contato-assunto" />
        <Campo rotulo="Mensagem" placeholder="Conte o que você precisa..." multiline value={mensagem}
          onChangeText={setMensagem} testID="contato-mensagem" />
        {erro ? <MensagemErro texto={erro} /> : null}
        <Botao titulo="Enviar mensagem" onPress={enviar} carregando={enviando} testID="contato-enviar" />

        {minhas.length > 0 ? (
          <>
            <TituloSecao>Suas mensagens</TituloSecao>
            {minhas.map((m) => (
              <Cartao key={m.id} estilo={{ marginBottom: Espaco.md }}>
                <View style={styles.msgTopo}>
                  <Text style={styles.msgAssunto}>{m.assunto}</Text>
                  <Text style={[styles.msgStatus, m.respondida && { color: Cores.sucesso }]}>
                    {m.respondida ? 'Respondida' : 'Aguardando'}
                  </Text>
                </View>
                <Text style={styles.msgTexto}>{m.mensagem}</Text>
                <Text style={styles.msgData}>{formatarData(m.criado_em)}</Text>
              </Cartao>
            ))}
          </>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: Espaco.lg, paddingBottom: Espaco.xxl * 2 },
  canal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espaco.md,
    padding: Espaco.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Cores.borda,
  },
  canalIcone: {
    width: 38,
    height: 38,
    borderRadius: Raio.pilula,
    backgroundColor: Cores.rosaClaro,
    alignItems: 'center',
    justifyContent: 'center',
  },
  canalTitulo: { fontSize: Fonte.pequena, color: Cores.textoSecundario },
  canalValor: { fontSize: Fonte.normal, color: Cores.texto, fontWeight: '600' },
  msgTopo: { flexDirection: 'row', justifyContent: 'space-between' },
  msgAssunto: { fontWeight: '700', color: Cores.texto, fontSize: Fonte.normal, flex: 1 },
  msgStatus: { fontSize: Fonte.pequena, color: Cores.aviso, fontWeight: '600' },
  msgTexto: { color: Cores.textoSecundario, marginTop: Espaco.xs, fontSize: Fonte.normal },
  msgData: { color: Cores.textoClaro, fontSize: 12, marginTop: Espaco.sm },
});
