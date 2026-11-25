import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Botao } from '@/components/Botao';
import { Carregando, MensagemErro } from '@/components/Interface';
import { ProdutoImagem } from '@/components/ProdutoImagem';
import { Cores, Espaco, Fonte, Raio } from '@/constants/theme';
import { Icone } from '@/components/Icone';
import { useCarrinho } from '@/contexts/CartContext';
import { useFavoritos } from '@/contexts/FavoritosContext';
import { api } from '@/services/api';
import type { Produto } from '@/services/tipos';
import { QUANTIDADE_MAXIMA } from '@/utils/carrinho';
import { mostrarModal } from '@/utils/dialogos';
import { formatarPreco } from '@/utils/formatacao';

export default function ProdutoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { adicionar } = useCarrinho();
  const { ehFavorito, alternar } = useFavoritos();

  const [produto, setProduto] = useState<Produto | null>(null);
  const [quantidade, setQuantidade] = useState(1);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    api.buscarProduto(Number(id)).then(setProduto).catch((e) => setErro(e.message));
  }, [id]);

  if (erro) return <MensagemErro texto={erro} />;
  if (!produto) return <Carregando />;

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen
        options={{
          title: produto.categoria,
          headerRight: () => (
            <Pressable onPress={() => alternar(produto.id)} hitSlop={10} testID="favoritar-detalhe"
              accessibilityLabel={ehFavorito(produto.id) ? 'Tirar dos favoritos' : 'Adicionar aos favoritos'}>
              <Icone name={ehFavorito(produto.id) ? 'heart' : 'heart-outline'} size={24} color={Cores.primaria} />
            </Pressable>
          ),
        }}
      />
      <ScrollView contentContainerStyle={{ paddingBottom: 140 }}>
        <View style={styles.imagem}>
          <ProdutoImagem imagem={produto.imagem} categoria={produto.categoria} tamanho="grande" />
        </View>
        <View style={styles.conteudo}>
          <Text style={styles.nome}>{produto.nome}</Text>
          <Text style={styles.preco}>{formatarPreco(produto.preco)}</Text>
          {produto.descricao ? <Text style={styles.descricao}>{produto.descricao}</Text> : null}

          <Text style={styles.rotulo}>Quantidade</Text>
          <View style={styles.stepper}>
            <Pressable style={styles.stepperBotao} onPress={() => setQuantidade((q) => Math.max(1, q - 1))}
              accessibilityLabel="Diminuir quantidade" disabled={quantidade <= 1}>
              <Text style={[styles.stepperTexto, quantidade <= 1 && { opacity: 0.3 }]}>−</Text>
            </Pressable>
            <Text style={styles.stepperValor} testID="quantidade-produto">{quantidade}</Text>
            <Pressable style={styles.stepperBotao}
              onPress={() => setQuantidade((q) => Math.min(QUANTIDADE_MAXIMA, q + 1))} accessibilityLabel="Aumentar quantidade">
              <Text style={styles.stepperTexto}>+</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.rodape, { paddingBottom: Espaco.lg + insets.bottom }]}>
        <Botao
          titulo={`Adicionar • ${formatarPreco(produto.preco * quantidade)}`}
          onPress={async () => {
            adicionar(produto, quantidade);
            const verCarrinho = await mostrarModal({
              tipo: 'sucesso',
              titulo: 'Adicionado ao carrinho',
              mensagem: `${quantidade}× ${produto.nome}`,
              textoOk: 'Ver carrinho',
              textoCancelar: 'Continuar comprando',
            });
            if (verCarrinho) router.replace('/carrinho');
            else router.back();
          }}
          testID="adicionar-carrinho"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  imagem: { height: 280 },
  conteudo: { padding: Espaco.xl },
  nome: { fontSize: Fonte.titulo, fontWeight: '800', color: Cores.texto },
  preco: { fontSize: Fonte.titulo, fontWeight: '800', color: Cores.primaria, marginTop: Espaco.sm },
  descricao: { fontSize: Fonte.normal, color: Cores.textoSecundario, lineHeight: 22, marginTop: Espaco.md },
  rotulo: { fontSize: Fonte.pequena, fontWeight: '700', color: Cores.texto, marginTop: Espaco.xl, marginBottom: Espaco.sm },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: Cores.superficie,
    borderRadius: Raio.pilula,
    borderWidth: 1,
    borderColor: Cores.borda,
  },
  stepperBotao: { width: 48, height: 44, alignItems: 'center', justifyContent: 'center' },
  stepperTexto: { fontSize: 22, color: Cores.primaria, fontWeight: '700' },
  stepperValor: { minWidth: 32, textAlign: 'center', fontSize: Fonte.subtitulo, fontWeight: '700', color: Cores.texto },
  rodape: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: Espaco.lg,
    backgroundColor: Cores.superficie,
    borderTopWidth: 1,
    borderTopColor: Cores.borda,
  },
});
