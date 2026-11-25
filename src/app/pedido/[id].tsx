import { Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useCallback, useRef, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Botao } from '@/components/Botao';
import { LinhaDoTempo } from '@/components/LinhaDoTempo';
import { Cartao, Carregando, Chip, EtiquetaStatus, LinhaValor, MensagemErro, TituloSecao } from '@/components/Interface';
import { Cores, Espaco, Fonte, Raio } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/api';
import type { Pedido } from '@/services/tipos';
import { avisar, confirmar } from '@/utils/dialogos';
import { formatarData, formatarPreco, METODO_PAGAMENTO, STATUS_PEDIDO, StatusPedido } from '@/utils/formatacao';

const AGUARDANDO: StatusPedido[] = ['aguardando_pagamento', 'recusado'];
const ANDAMENTO: StatusPedido[] = ['pago', 'em_preparo', 'enviado', 'entregue', 'cancelado'];

export default function PedidoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { ehAdmin } = useAuth();
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [atualizando, setAtualizando] = useState(false);
  const statusAnterior = useRef<StatusPedido | null>(null);

  /** Guarda o pedido e avisa quando o pagamento acabou de ser aprovado ou recusado. */
  const receber = useCallback((novo: Pedido) => {
    const antes = statusAnterior.current;
    statusAnterior.current = novo.status;
    setPedido(novo);
    if (!antes || antes === novo.status || !AGUARDANDO.includes(antes)) return;
    if (novo.status === 'pago') {
      avisar('Pagamento aprovado!', 'Seu pedido já foi para a cozinha. Acompanhe o andamento por aqui.', 'sucesso');
    } else if (novo.status === 'recusado') {
      avisar('Pagamento recusado', 'O pagamento não foi aprovado. Você pode tentar de novo com outra forma de pagamento.', 'erro');
    } else if (novo.status === 'cancelado') {
      avisar('Pedido cancelado', 'Se mudar de ideia, é só fazer um novo pedido.', 'info');
    }
  }, []);

  // Sincroniza com o servidor (e o servidor com o Mercado Pago) sempre que a tela aparece
  const sincronizar = useCallback(async () => {
    try {
      setErro(null);
      receber(await api.sincronizarPedido(Number(id)));
    } catch (e) {
      setErro((e as Error).message);
      api.buscarPedido(Number(id)).then(receber).catch(() => {});
    } finally {
      setAtualizando(false);
    }
  }, [id, receber]);

  useFocusEffect(useCallback(() => { sincronizar(); }, [sincronizar]));

  async function executar(nome: string, acao: () => Promise<Pedido | void>) {
    setOcupado(nome);
    setErro(null);
    try {
      const novo = await acao();
      if (novo) receber(novo);
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setOcupado(null);
    }
  }

  if (!pedido) return erro ? <MensagemErro texto={erro} onTentar={sincronizar} /> : <Carregando />;

  const modoDemo = AGUARDANDO.includes(pedido.status) && !pedido.mp_preference_id;

  return (
    <ScrollView
      contentContainerStyle={styles.scroll}
      refreshControl={<RefreshControl refreshing={atualizando} tintColor={Cores.primaria}
        onRefresh={() => { setAtualizando(true); sincronizar(); }} />}>
      <Stack.Screen options={{ title: `Pedido #${pedido.id}` }} />

      <Cartao>
        <View style={styles.topo}>
          <EtiquetaStatus status={pedido.status} />
          <Text style={styles.data}>{formatarData(pedido.criado_em)}</Text>
        </View>
        <Text style={styles.total}>{formatarPreco(pedido.total)}</Text>
        {pedido.metodo_pagamento ? (
          <Text style={styles.metodo}>Pago com {METODO_PAGAMENTO[pedido.metodo_pagamento] ?? pedido.metodo_pagamento}</Text>
        ) : null}
        {ehAdmin && pedido.cliente_nome ? <Text style={styles.metodo}>Cliente: {pedido.cliente_nome}</Text> : null}
      </Cartao>

      {erro ? <MensagemErro texto={erro} /> : null}

      {AGUARDANDO.includes(pedido.status) && !ehAdmin ? (
        <View style={styles.acoes}>
          {modoDemo ? (
            <>
              <Text style={styles.demo}>
                Modo demonstração: a API está sem o token do Mercado Pago. Simule a resposta do pagamento:
              </Text>
              <Botao titulo="Simular pagamento aprovado (Pix)" carregando={ocupado === 'aprovar'}
                onPress={() => executar('aprovar', () => api.simularPagamento(pedido.id, true, 'pix'))}
                testID="simular-aprovado" />
              <Botao titulo="Simular pagamento recusado" variante="secundario" carregando={ocupado === 'recusar'}
                onPress={() => executar('recusar', () => api.simularPagamento(pedido.id, false, 'cartao_credito'))} />
            </>
          ) : (
            <>
              <Botao titulo="Pagar com Mercado Pago" carregando={ocupado === 'pagar'}
                onPress={() => executar('pagar', async () => {
                  const { pagamento } = await api.pagarPedido(pedido.id);
                  if (pagamento.url) await WebBrowser.openBrowserAsync(pagamento.url);
                  return api.sincronizarPedido(pedido.id);
                })} />
              <Botao titulo="Já paguei — atualizar status" variante="secundario" carregando={ocupado === 'sinc'}
                onPress={() => executar('sinc', () => api.sincronizarPedido(pedido.id))} />
            </>
          )}
          <Botao titulo="Cancelar pedido" variante="perigo" carregando={ocupado === 'cancelar'}
            onPress={async () => {
              if (await confirmar('Cancelar pedido', 'Tem certeza que quer cancelar este pedido?', 'Cancelar pedido')) {
                executar('cancelar', () => api.cancelarPedido(pedido.id));
              }
            }} />
        </View>
      ) : null}

      {ehAdmin ? (
        <>
          <TituloSecao>Alterar andamento</TituloSecao>
          <View style={styles.chips}>
            {ANDAMENTO.map((s) => (
              <Chip key={s} rotulo={STATUS_PEDIDO[s].rotulo} ativo={pedido.status === s}
                onPress={() => executar(s, () => api.alterarStatusPedido(pedido.id, s))} />
            ))}
          </View>
        </>
      ) : null}

      {pedido.status !== 'cancelado' && pedido.status !== 'recusado' ? (
        <>
          <TituloSecao>Acompanhamento</TituloSecao>
          <Cartao>
            <LinhaDoTempo status={pedido.status} />
          </Cartao>
        </>
      ) : null}

      <TituloSecao>Itens</TituloSecao>
      <Cartao>
        {pedido.itens?.map((i) => (
          <LinhaValor key={i.id} rotulo={`${i.quantidade}× ${i.nome}`} valor={formatarPreco(i.preco_unitario * i.quantidade)} />
        ))}
        <View style={styles.divisor} />
        <LinhaValor rotulo="Subtotal" valor={formatarPreco(pedido.subtotal)} />
        <LinhaValor rotulo="Frete" valor={pedido.frete === 0 ? 'Grátis' : formatarPreco(pedido.frete)} />
        <LinhaValor rotulo="Total" valor={formatarPreco(pedido.total)} destaque />
      </Cartao>

      <TituloSecao>Entrega</TituloSecao>
      <Cartao>
        <Text style={styles.endereco}>
          {pedido.logradouro}, {pedido.numero}
          {pedido.complemento ? ` - ${pedido.complemento}` : ''}
          {'\n'}
          {pedido.bairro ? `${pedido.bairro} - ` : ''}
          {pedido.cidade}/{pedido.uf}
          {'\n'}CEP {pedido.cep}
        </Text>
      </Cartao>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: Espaco.xl, paddingBottom: Espaco.xxl * 2 },
  topo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  data: { color: Cores.textoSecundario, fontSize: Fonte.pequena },
  total: { fontSize: Fonte.destaque, fontWeight: '800', color: Cores.texto, marginTop: Espaco.md },
  metodo: { color: Cores.textoSecundario, marginTop: Espaco.xs, fontSize: Fonte.normal },
  acoes: { gap: Espaco.md, marginTop: Espaco.lg },
  demo: {
    backgroundColor: Cores.avisoClaro,
    color: Cores.aviso,
    padding: Espaco.md,
    borderRadius: Raio.md,
    fontSize: Fonte.pequena,
    lineHeight: 19,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Espaco.sm },
  divisor: { height: 1, backgroundColor: Cores.borda, marginVertical: Espaco.sm },
  endereco: { color: Cores.texto, fontSize: Fonte.normal, lineHeight: 22 },
});
