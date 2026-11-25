import { useRouter } from 'expo-router';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import type { ReactElement } from 'react';

import { Cores, Espaco, Fonte, Raio, Sombra } from '@/constants/theme';
import type { Pedido } from '@/services/tipos';
import { formatarData, formatarPreco } from '@/utils/formatacao';

import { EtiquetaStatus } from './Interface';

/** Lista de pedidos usada pela cliente (Meus pedidos) e pela administradora (Todos os pedidos). */
export function ListaPedidos({
  pedidos,
  atualizando,
  onAtualizar,
  mostrarCliente,
  cabecalho,
  vazio,
}: {
  pedidos: Pedido[];
  atualizando: boolean;
  onAtualizar: () => void;
  mostrarCliente?: boolean;
  cabecalho?: ReactElement;
  vazio: ReactElement;
}) {
  const router = useRouter();
  return (
    <FlatList
      data={pedidos}
      keyExtractor={(p) => p.id.toString()}
      contentContainerStyle={styles.lista}
      ListHeaderComponent={cabecalho}
      ListEmptyComponent={vazio}
      refreshControl={<RefreshControl refreshing={atualizando} onRefresh={onAtualizar} tintColor={Cores.primaria} />}
      renderItem={({ item }) => (
        <Pressable
          style={styles.linha}
          onPress={() => router.push({ pathname: '/pedido/[id]', params: { id: String(item.id) } })}
          testID={`pedido-${item.id}`}>
          <View style={styles.topo}>
            <Text style={styles.numero}>Pedido #{item.id}</Text>
            <EtiquetaStatus status={item.status} />
          </View>
          {mostrarCliente ? <Text style={styles.cliente}>{item.cliente_nome}</Text> : null}
          <View style={styles.base}>
            <Text style={styles.detalhe}>
              {formatarData(item.criado_em)} • {item.quantidade_itens ?? 0} {item.quantidade_itens === 1 ? 'item' : 'itens'}
            </Text>
            <Text style={styles.total}>{formatarPreco(item.total)}</Text>
          </View>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  lista: { padding: Espaco.lg, gap: Espaco.md, flexGrow: 1 },
  linha: { backgroundColor: Cores.superficie, borderRadius: Raio.lg, padding: Espaco.lg, ...Sombra },
  topo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  numero: { fontSize: Fonte.normal, fontWeight: '800', color: Cores.texto },
  cliente: { fontSize: Fonte.pequena, color: Cores.textoSecundario, marginTop: Espaco.xs },
  base: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: Espaco.sm },
  detalhe: { fontSize: Fonte.pequena, color: Cores.textoSecundario },
  total: { fontSize: Fonte.normal, fontWeight: '800', color: Cores.primaria },
});
