import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { Carregando, MensagemErro, Vazio } from '@/components/Interface';
import { ProdutoImagem } from '@/components/ProdutoImagem';
import { Cores, Espaco, Fonte, Raio, Sombra } from '@/constants/theme';
import { api } from '@/services/api';
import type { Produto } from '@/services/tipos';
import { avisar, confirmar } from '@/utils/dialogos';
import { formatarPreco } from '@/utils/formatacao';
import { somenteAdmin } from '@/components/SomenteAdmin';
import { Icone, NomeIcone } from '@/components/Icone';

/** READ + DELETE de produtos (CREATE e UPDATE ficam no formulário). */
function ProdutosAdminScreen() {
  const router = useRouter();
  const [produtos, setProdutos] = useState<Produto[] | null>(null);
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    try {
      setErro(null);
      setProdutos(await api.listarProdutos({ todos: true }));
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setAtualizando(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { carregar(); }, [carregar]));

  async function excluir(p: Produto) {
    const ok = await confirmar('Excluir produto', `Excluir "${p.nome}" do cardápio?`, 'Excluir');
    if (!ok) return;
    try {
      const r = await api.excluirProduto(p.id);
      if (r.modo === 'desativado') {
        avisar('Produto desativado', 'Ele já aparece em pedidos, então foi escondido do cardápio em vez de apagado.');
      }
      carregar();
    } catch (e) {
      avisar('Não foi possível excluir', (e as Error).message, 'erro');
    }
  }

  const editar = (id?: number) =>
    router.push(id ? { pathname: '/admin/produto-form', params: { id: String(id) } } : '/admin/produto-form');

  if (!produtos) return erro ? <MensagemErro texto={erro} onTentar={carregar} /> : <Carregando />;

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={produtos}
        keyExtractor={(p) => p.id.toString()}
        contentContainerStyle={styles.lista}
        refreshControl={<RefreshControl refreshing={atualizando} tintColor={Cores.primaria}
          onRefresh={() => { setAtualizando(true); carregar(); }} />}
        ListHeaderComponent={erro ? <MensagemErro texto={erro} /> : null}
        ListEmptyComponent={<Vazio icone="cake-variant-outline" titulo="Nenhum produto ainda" texto="Toque em + para cadastrar." />}
        renderItem={({ item }) => (
          <View style={[styles.linha, !item.ativo && styles.inativo]} testID={`admin-produto-${item.id}`}>
            <View style={styles.imagem}>
              <ProdutoImagem imagem={item.imagem} categoria={item.categoria} tamanho="pequeno" />
            </View>
            <View style={styles.info}>
              <Text style={styles.nome} numberOfLines={1}>{item.nome}</Text>
              <Text style={styles.detalhe}>
                {item.categoria} • <Text style={styles.preco}>{formatarPreco(item.preco)}</Text>
              </Text>
              {!item.ativo ? <Text style={styles.oculto}>Fora do cardápio</Text> : null}
            </View>
            <Pressable onPress={() => editar(item.id)} hitSlop={8} style={styles.acao}
              accessibilityLabel={`Editar ${item.nome}`} testID={`editar-${item.id}`}>
              <Icone name="pencil-outline" size={22} color={Cores.primaria} />
            </Pressable>
            <Pressable onPress={() => excluir(item)} hitSlop={8} style={styles.acao}
              accessibilityLabel={`Excluir ${item.nome}`} testID={`excluir-${item.id}`}>
              <Icone name="trash-can-outline" size={22} color={Cores.erro} />
            </Pressable>
          </View>
        )}
      />

      <Pressable style={styles.fab} onPress={() => editar()} accessibilityLabel="Novo produto" testID="novo-produto">
        <Icone name="plus" size={30} color={Cores.branco} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  lista: { padding: Espaco.lg, gap: Espaco.md, paddingBottom: 100 },
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Cores.superficie,
    borderRadius: Raio.lg,
    padding: Espaco.md,
    gap: Espaco.md,
    ...Sombra,
  },
  inativo: { opacity: 0.6 },
  imagem: { width: 52, height: 52, borderRadius: Raio.md, overflow: 'hidden' },
  info: { flex: 1 },
  nome: { fontSize: Fonte.normal, fontWeight: '700', color: Cores.texto },
  detalhe: { fontSize: Fonte.pequena, color: Cores.textoSecundario, marginTop: 2 },
  preco: { color: Cores.primaria, fontWeight: '700' },
  oculto: { fontSize: 12, color: Cores.aviso, fontWeight: '700', marginTop: 2 },
  acao: { padding: Espaco.xs },
  fab: {
    position: 'absolute',
    right: Espaco.xl,
    bottom: Espaco.xxl,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Cores.primaria,
    justifyContent: 'center',
    alignItems: 'center',
    ...Sombra,
    shadowOpacity: 0.25,
  },
});

export default somenteAdmin(ProdutosAdminScreen);
