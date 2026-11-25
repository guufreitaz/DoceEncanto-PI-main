import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';

import { Carregando, Chip, MensagemErro, Vazio } from '@/components/Interface';
import { ProdutoImagem } from '@/components/ProdutoImagem';
import { Cores, Espaco, Fonte, Raio, Sombra } from '@/constants/theme';
import { useCarrinho } from '@/contexts/CartContext';
import { useFavoritos } from '@/contexts/FavoritosContext';
import { api } from '@/services/api';
import { CATEGORIAS, Produto } from '@/services/tipos';
import { formatarPreco } from '@/utils/formatacao';
import { Icone } from '@/components/Icone';

type Ordem = 'relevancia' | 'menor' | 'maior' | 'az';
const ORDENS: { valor: Ordem; rotulo: string }[] = [
  { valor: 'relevancia', rotulo: 'Destaques' },
  { valor: 'menor', rotulo: 'Menor preço' },
  { valor: 'maior', rotulo: 'Maior preço' },
  { valor: 'az', rotulo: 'A–Z' },
];

export default function CatalogoScreen() {
  const router = useRouter();
  const { adicionar } = useCarrinho();
  const { ehFavorito, alternar, favoritos } = useFavoritos();
  const { width } = useWindowDimensions();
  const larguraUtil = Math.min(width, 1100);
  const colunas = larguraUtil >= 900 ? 4 : larguraUtil >= 600 ? 3 : 2;
  const larguraCard = (larguraUtil - Espaco.lg * 2 - Espaco.md * (colunas - 1)) / colunas;

  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [categoria, setCategoria] = useState<string | null>(null);
  const [busca, setBusca] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [adicionado, setAdicionado] = useState<number | null>(null);
  const [soFavoritos, setSoFavoritos] = useState(false);
  const [ordem, setOrdem] = useState<Ordem>('relevancia');

  // Favoritos e ordenação são aplicados no aparelho, sobre a lista que veio da API
  const visiveis = useMemo(() => {
    const lista = soFavoritos ? produtos.filter((p) => favoritos.includes(p.id)) : [...produtos];
    if (ordem === 'menor') lista.sort((a, b) => a.preco - b.preco);
    if (ordem === 'maior') lista.sort((a, b) => b.preco - a.preco);
    if (ordem === 'az') lista.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
    return lista;
  }, [produtos, soFavoritos, favoritos, ordem]);

  const carregar = useCallback(async () => {
    try {
      setErro(null);
      setProdutos(await api.listarProdutos({ categoria: categoria ?? undefined, busca: busca.trim() || undefined }));
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  }, [categoria, busca]);

  // Espera a pessoa parar de digitar antes de buscar
  useEffect(() => {
    const t = setTimeout(carregar, 300);
    return () => clearTimeout(t);
  }, [carregar]);

  function adicionarRapido(p: Produto) {
    adicionar(p);
    setAdicionado(p.id);
    setTimeout(() => setAdicionado((atual) => (atual === p.id ? null : atual)), 1200);
  }

  const cabecalho = (
    <View>
      <View style={styles.banner}>
        <Text style={styles.bannerTitulo}>Frete grátis acima de R$ 150</Text>
        <Text style={styles.bannerTexto}>Bolos, doces e salgados feitos no dia, com entrega em todo o Brasil.</Text>
      </View>
      <View style={styles.busca}>
        <Icone name="magnify" size={18} color={Cores.textoClaro} />
        <TextInput
          style={styles.buscaInput}
          placeholder="Buscar no cardápio"
          placeholderTextColor={Cores.textoClaro}
          value={busca}
          onChangeText={setBusca}
          returnKeyType="search"
          accessibilityLabel="Buscar no cardápio"
        />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips}>
        <Chip rotulo="Todos" ativo={categoria === null && !soFavoritos}
          onPress={() => { setCategoria(null); setSoFavoritos(false); }} />
        <Chip rotulo="Favoritos" ativo={soFavoritos} onPress={() => setSoFavoritos((v) => !v)} />
        {CATEGORIAS.map((c) => (
          <Chip key={c} rotulo={c === 'Doce' ? 'Doces' : c === 'Bolo' ? 'Bolos' : 'Salgados'} ativo={categoria === c}
            onPress={() => setCategoria(categoria === c ? null : c)} />
        ))}
      </ScrollView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.ordem}
        contentContainerStyle={{ alignItems: 'center' }}>
        <Icone name="sort" size={16} color={Cores.textoSecundario} style={{ marginRight: Espaco.sm }} />
        {ORDENS.map((o) => (
          <Pressable key={o.valor} onPress={() => setOrdem(o.valor)} style={styles.ordemItem}
            accessibilityRole="button" accessibilityState={{ selected: ordem === o.valor }}>
            <Text style={[styles.ordemTexto, ordem === o.valor && styles.ordemAtiva]}>{o.rotulo}</Text>
          </Pressable>
        ))}
      </ScrollView>
      {erro ? <MensagemErro texto={erro} onTentar={carregar} /> : null}
    </View>
  );

  if (carregando) return <Carregando texto="Carregando o cardápio..." />;

  return (
    <FlatList
      key={colunas}
      data={visiveis}
      numColumns={colunas}
      keyExtractor={(item) => item.id.toString()}
      ListHeaderComponent={cabecalho}
      contentContainerStyle={[styles.lista, { width: larguraUtil, alignSelf: 'center' }]}
      columnWrapperStyle={{ gap: Espaco.md }}
      refreshControl={<RefreshControl refreshing={atualizando} onRefresh={() => { setAtualizando(true); carregar(); }}
        tintColor={Cores.primaria} />}
      ListEmptyComponent={
        erro ? null : soFavoritos ? (
          <Vazio icone="heart-outline" titulo="Nenhum favorito ainda" texto="Toque no coração de um produto para guardar aqui." />
        ) : (
          <Vazio icone="magnify-close" titulo="Nada encontrado" texto="Tente outra busca ou categoria." />
        )
      }
      renderItem={({ item }) => (
        <Pressable
          style={[styles.card, { width: larguraCard }]}
          onPress={() => router.push({ pathname: '/produto/[id]', params: { id: String(item.id) } })}
          accessibilityLabel={`${item.nome}, ${formatarPreco(item.preco)}`}
          testID={`produto-${item.id}`}>
          <View style={styles.imagem}>
            <ProdutoImagem imagem={item.imagem} categoria={item.categoria} />
            <Pressable style={styles.coracao} onPress={() => alternar(item.id)} hitSlop={8} testID={`favoritar-${item.id}`}
              accessibilityLabel={ehFavorito(item.id) ? `Tirar ${item.nome} dos favoritos` : `Favoritar ${item.nome}`}>
              <Icone name={ehFavorito(item.id) ? 'heart' : 'heart-outline'} size={18} color={Cores.primaria} />
            </Pressable>
          </View>
          <View style={styles.info}>
            <Text style={styles.nome} numberOfLines={2}>{item.nome}</Text>
            <View style={styles.rodapeCard}>
              <Text style={styles.preco}>{formatarPreco(item.preco)}</Text>
              <Pressable
                style={[styles.botaoMais, adicionado === item.id && styles.botaoOk]}
                onPress={() => adicionarRapido(item)}
                hitSlop={8}
                accessibilityLabel={`Adicionar ${item.nome} ao carrinho`}
                testID={`adicionar-${item.id}`}>
                <Icone name={adicionado === item.id ? 'check' : 'plus'} size={20} color={Cores.branco} />
              </Pressable>
            </View>
          </View>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  lista: { padding: Espaco.lg, paddingTop: Espaco.sm, gap: Espaco.md },
  banner: { backgroundColor: Cores.primaria, borderRadius: Raio.lg, padding: Espaco.lg, marginBottom: Espaco.lg },
  bannerTitulo: { color: Cores.branco, fontSize: Fonte.subtitulo, fontWeight: '800' },
  bannerTexto: { color: Cores.rosaClaro, fontSize: Fonte.pequena, marginTop: Espaco.xs },
  busca: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espaco.sm,
    backgroundColor: Cores.superficie,
    borderRadius: Raio.pilula,
    borderWidth: 1,
    borderColor: Cores.borda,
    paddingHorizontal: Espaco.lg,
    height: 46,
  },
  buscaInput: { flex: 1, fontSize: Fonte.campo, color: Cores.texto, height: '100%' },
  chips: { marginTop: Espaco.md },
  ordem: { marginTop: Espaco.sm, marginBottom: Espaco.md },
  ordemItem: { paddingVertical: 4, paddingHorizontal: Espaco.sm },
  ordemTexto: { fontSize: Fonte.pequena, color: Cores.textoSecundario },
  ordemAtiva: { color: Cores.primaria, fontWeight: '700', textDecorationLine: 'underline' },
  coracao: {
    position: 'absolute',
    top: Espaco.sm,
    right: Espaco.sm,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: { backgroundColor: Cores.superficie, borderRadius: Raio.lg, overflow: 'hidden', ...Sombra },
  imagem: { height: 120 },
  info: { padding: Espaco.md, flex: 1, justifyContent: 'space-between' },
  nome: { fontSize: Fonte.normal - 1, fontWeight: '700', color: Cores.texto, minHeight: 38 },
  rodapeCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: Espaco.sm },
  preco: { fontSize: Fonte.normal, fontWeight: '800', color: Cores.primaria },
  botaoMais: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Cores.primaria,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botaoOk: { backgroundColor: Cores.sucesso },
});
