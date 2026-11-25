import { useRouter } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { Botao } from '@/components/Botao';
import { LinhaValor, Vazio } from '@/components/Interface';
import { ProdutoImagem } from '@/components/ProdutoImagem';
import { Cores, Espaco, Fonte, Raio, Sombra } from '@/constants/theme';
import { useCarrinho } from '@/contexts/CartContext';
import type { ItemCarrinho } from '@/utils/carrinho';
import { formatarPreco } from '@/utils/formatacao';
import { Icone, NomeIcone } from '@/components/Icone';

export default function CarrinhoScreen() {
  const router = useRouter();
  const { itens, subtotal, quantidadeTotal, alterarQuantidade, remover } = useCarrinho();

  if (itens.length === 0) {
    return (
      <Vazio
        icone="cart-outline"
        titulo="Seu carrinho está vazio"
        texto="Escolha suas delícias no cardápio."
        acao={<Botao titulo="Ver cardápio" onPress={() => router.navigate('/catalogo')} />}
      />
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={itens}
        keyExtractor={(item) => item.produtoId.toString()}
        contentContainerStyle={styles.lista}
        renderItem={({ item }) => (
          <LinhaCarrinho item={item} onAlterar={(q) => alterarQuantidade(item.produtoId, q)}
            onRemover={() => remover(item.produtoId)} />
        )}
      />

      <View style={styles.rodape}>
        <LinhaValor rotulo={`Subtotal (${quantidadeTotal} ${quantidadeTotal === 1 ? 'item' : 'itens'})`}
          valor={formatarPreco(subtotal)} destaque />
        <Text style={styles.aviso}>O frete é calculado na próxima etapa, pelo CEP.</Text>
        <Botao titulo="Finalizar compra" onPress={() => router.push('/pagamento')} testID="finalizar-compra" />
      </View>
    </View>
  );
}

function LinhaCarrinho({ item, onAlterar, onRemover }: {
  item: ItemCarrinho;
  onAlterar: (quantidade: number) => void;
  onRemover: () => void;
}) {
  return (
    <View style={styles.linha} testID={`item-carrinho-${item.produtoId}`}>
      <View style={styles.imagem}>
        <ProdutoImagem imagem={item.imagem} categoria={item.categoria} tamanho="pequeno" />
      </View>
      <View style={styles.info}>
        <Text style={styles.nome} numberOfLines={2}>{item.nome}</Text>
        <Text style={styles.unitario}>{formatarPreco(item.preco)} cada</Text>
        <View style={styles.stepper}>
          {/* Com 1 unidade, o botão de menos vira lixeira: tira o item do carrinho */}
          <Pressable onPress={() => onAlterar(item.quantidade - 1)} hitSlop={6} style={styles.stepperBotao}
            accessibilityLabel={item.quantidade === 1 ? `Remover ${item.nome}` : 'Diminuir quantidade'}
            testID={`menos-${item.produtoId}`}>
            {item.quantidade === 1 ? (
              <Icone name="trash-can-outline" size={16} color={Cores.erro} />
            ) : (
              <Text style={styles.stepperTexto}>−</Text>
            )}
          </Pressable>
          <Text style={styles.stepperValor} testID={`quantidade-${item.produtoId}`}>{item.quantidade}</Text>
          <Pressable onPress={() => onAlterar(item.quantidade + 1)} hitSlop={6} style={styles.stepperBotao}
            accessibilityLabel="Aumentar quantidade" testID={`mais-${item.produtoId}`}>
            <Text style={styles.stepperTexto}>+</Text>
          </Pressable>
        </View>
      </View>
      <View style={styles.direita}>
        <Pressable onPress={onRemover} hitSlop={8} accessibilityLabel={`Remover ${item.nome}`}>
          <Icone name="close" size={20} color={Cores.textoClaro} />
        </Pressable>
        <Text style={styles.total}>{formatarPreco(item.preco * item.quantidade)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  lista: { padding: Espaco.lg, gap: Espaco.md },
  linha: {
    flexDirection: 'row',
    backgroundColor: Cores.superficie,
    borderRadius: Raio.lg,
    padding: Espaco.md,
    gap: Espaco.md,
    ...Sombra,
  },
  imagem: { width: 64, height: 64, borderRadius: Raio.md, overflow: 'hidden' },
  info: { flex: 1 },
  nome: { fontSize: Fonte.normal, fontWeight: '700', color: Cores.texto },
  unitario: { fontSize: Fonte.pequena, color: Cores.textoSecundario, marginTop: 2 },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: Espaco.sm,
    borderWidth: 1,
    borderColor: Cores.borda,
    borderRadius: Raio.pilula,
  },
  stepperBotao: { width: 34, height: 30, alignItems: 'center', justifyContent: 'center' },
  stepperTexto: { fontSize: 18, color: Cores.primaria, fontWeight: '700' },
  stepperValor: { minWidth: 24, textAlign: 'center', fontWeight: '700', color: Cores.texto },
  direita: { alignItems: 'flex-end', justifyContent: 'space-between' },
  total: { fontWeight: '800', color: Cores.texto, fontSize: Fonte.normal },
  rodape: {
    backgroundColor: Cores.superficie,
    borderTopWidth: 1,
    borderTopColor: Cores.borda,
    padding: Espaco.lg,
    gap: Espaco.sm,
  },
  aviso: { fontSize: Fonte.pequena, color: Cores.textoSecundario, marginBottom: Espaco.xs },
});
