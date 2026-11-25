import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Linking, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { Cartao, Carregando, MensagemErro, Vazio } from '@/components/Interface';
import { Cores, Espaco, Fonte } from '@/constants/theme';
import { api } from '@/services/api';
import type { Mensagem } from '@/services/tipos';
import { avisar, confirmar } from '@/utils/dialogos';
import { formatarData } from '@/utils/formatacao';
import { somenteAdmin } from '@/components/SomenteAdmin';
import { Icone, NomeIcone } from '@/components/Icone';

function MensagensAdminScreen() {
  const [mensagens, setMensagens] = useState<Mensagem[] | null>(null);
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    try {
      setErro(null);
      setMensagens(await api.listarMensagens());
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setAtualizando(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { carregar(); }, [carregar]));

  async function alternar(m: Mensagem) {
    try {
      await api.marcarRespondida(m.id, !m.respondida);
      carregar();
    } catch (e) {
      avisar('Algo deu errado', (e as Error).message, 'erro');
    }
  }

  async function excluir(m: Mensagem) {
    if (!(await confirmar('Excluir mensagem', `Excluir a mensagem "${m.assunto}"?`, 'Excluir'))) return;
    try {
      await api.excluirMensagem(m.id);
      carregar();
    } catch (e) {
      avisar('Algo deu errado', (e as Error).message, 'erro');
    }
  }

  if (!mensagens) return erro ? <MensagemErro texto={erro} onTentar={carregar} /> : <Carregando />;

  return (
    <FlatList
      data={mensagens}
      keyExtractor={(m) => m.id.toString()}
      contentContainerStyle={{ padding: Espaco.lg, gap: Espaco.md, flexGrow: 1 }}
      refreshControl={<RefreshControl refreshing={atualizando} tintColor={Cores.primaria}
        onRefresh={() => { setAtualizando(true); carregar(); }} />}
      ListEmptyComponent={<Vazio icone="email-outline" titulo="Nenhuma mensagem" />}
      renderItem={({ item }) => (
        <Cartao estilo={item.respondida && { opacity: 0.65 }}>
          <View style={styles.topo}>
            <Text style={styles.assunto}>{item.assunto}</Text>
            <Text style={styles.data}>{formatarData(item.criado_em)}</Text>
          </View>
          <Text style={styles.de}>{item.nome} • {item.email}{item.telefone ? ` • ${item.telefone}` : ''}</Text>
          <Text style={styles.texto}>{item.mensagem}</Text>
          <View style={styles.acoes}>
            <Pressable style={styles.acao} onPress={() => Linking.openURL(`mailto:${item.email}?subject=Re: ${item.assunto}`)}>
              <Icone name="email-outline" size={18} color={Cores.primaria} />
              <Text style={styles.acaoTexto}>Responder</Text>
            </Pressable>
            <Pressable style={styles.acao} onPress={() => alternar(item)}>
              <Icone name={item.respondida ? 'undo' : 'check-all'} size={18}
                color={Cores.sucesso} />
              <Text style={[styles.acaoTexto, { color: Cores.sucesso }]}>
                {item.respondida ? 'Reabrir' : 'Marcar respondida'}
              </Text>
            </Pressable>
            <Pressable style={styles.acao} onPress={() => excluir(item)} accessibilityLabel="Excluir mensagem">
              <Icone name="trash-can-outline" size={18} color={Cores.erro} />
            </Pressable>
          </View>
        </Cartao>
      )}
    />
  );
}

const styles = StyleSheet.create({
  topo: { flexDirection: 'row', justifyContent: 'space-between', gap: Espaco.sm },
  assunto: { flex: 1, fontSize: Fonte.normal, fontWeight: '800', color: Cores.texto },
  data: { fontSize: 12, color: Cores.textoClaro },
  de: { fontSize: Fonte.pequena, color: Cores.textoSecundario, marginTop: 2 },
  texto: { fontSize: Fonte.normal, color: Cores.texto, marginTop: Espaco.sm, lineHeight: 21 },
  acoes: { flexDirection: 'row', gap: Espaco.lg, marginTop: Espaco.md, alignItems: 'center' },
  acao: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  acaoTexto: { color: Cores.primaria, fontWeight: '600', fontSize: Fonte.pequena },
});

export default somenteAdmin(MensagensAdminScreen);
