import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Carregando, Chip, MensagemErro, Vazio } from '@/components/Interface';
import { ListaPedidos } from '@/components/ListaPedidos';
import { Espaco } from '@/constants/theme';
import { api } from '@/services/api';
import type { Pedido } from '@/services/tipos';
import { STATUS_PEDIDO, StatusPedido } from '@/utils/formatacao';
import { somenteAdmin } from '@/components/SomenteAdmin';

const FILTROS: (StatusPedido | null)[] = [null, 'aguardando_pagamento', 'pago', 'em_preparo', 'enviado', 'entregue', 'cancelado'];

function PedidosAdminScreen() {
  const [filtro, setFiltro] = useState<StatusPedido | null>(null);
  const [pedidos, setPedidos] = useState<Pedido[] | null>(null);
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    try {
      setErro(null);
      setPedidos(await api.listarPedidos(filtro ?? undefined));
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setAtualizando(false);
    }
  }, [filtro]);

  useFocusEffect(useCallback(() => { carregar(); }, [carregar]));

  return (
    <View style={{ flex: 1 }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtros}
        contentContainerStyle={styles.filtrosConteudo}>
        {FILTROS.map((s) => (
          <Chip key={s ?? 'todos'} rotulo={s ? STATUS_PEDIDO[s].rotulo : 'Todos'} ativo={filtro === s}
            onPress={() => setFiltro(s)} />
        ))}
      </ScrollView>
      {!pedidos ? (
        erro ? <MensagemErro texto={erro} onTentar={carregar} /> : <Carregando />
      ) : (
        <ListaPedidos
          pedidos={pedidos}
          mostrarCliente
          atualizando={atualizando}
          onAtualizar={() => { setAtualizando(true); carregar(); }}
          cabecalho={erro ? <MensagemErro texto={erro} /> : undefined}
          vazio={<Vazio icone="inbox-outline" titulo="Nenhum pedido aqui" />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  filtros: { flexGrow: 0, flexShrink: 0 },
  filtrosConteudo: { paddingHorizontal: Espaco.lg, paddingVertical: Espaco.md, alignItems: 'center' },
});

export default somenteAdmin(PedidosAdminScreen);
