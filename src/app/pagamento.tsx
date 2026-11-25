import { Redirect, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Botao } from '@/components/Botao';
import { FormEndereco, validarEndereco, ValoresEndereco } from '@/components/FormEndereco';
import { Cartao, LinhaValor, MensagemErro, TituloSecao } from '@/components/Interface';
import { Cores, Espaco, Fonte } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useCarrinho } from '@/contexts/CartContext';
import { api } from '@/services/api';
import { formatarPreco } from '@/utils/formatacao';

/**
 * Finalizar compra: endereço de entrega (com CEP dos Correios), frete e pagamento.
 * O pagamento acontece no checkout do Mercado Pago (Pix, cartão ou boleto) —
 * o app nunca recebe o número do cartão.
 */
export default function PagamentoScreen() {
  const router = useRouter();
  const { usuario } = useAuth();
  const { itens, subtotal, quantidadeTotal, limpar } = useCarrinho();

  const [endereco, setEndereco] = useState<ValoresEndereco>({
    cep: usuario?.cep ?? '',
    logradouro: usuario?.logradouro ?? '',
    numero: usuario?.numero ?? '',
    complemento: usuario?.complemento ?? '',
    bairro: usuario?.bairro ?? '',
    cidade: usuario?.cidade ?? '',
    uf: usuario?.uf ?? '',
  });
  const [errosEndereco, setErrosEndereco] = useState({});
  const [frete, setFrete] = useState<number | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  // Recalcula o frete sempre que a UF ou o subtotal mudam
  useEffect(() => {
    if (endereco.uf.length !== 2) return setFrete(null);
    let ativo = true;
    api.frete(endereco.uf, subtotal)
      .then((r) => ativo && setFrete(r.frete))
      .catch(() => ativo && setFrete(null));
    return () => {
      ativo = false;
    };
  }, [endereco.uf, subtotal]);

  if (itens.length === 0 && !enviando) return <Redirect href="/carrinho" />;

  async function pagar() {
    const erros = validarEndereco(endereco);
    setErrosEndereco(erros);
    if (Object.keys(erros).length) return setErro('Confira o endereço de entrega.');

    setErro(null);
    setEnviando(true);
    try {
      const { pedido, pagamento } = await api.criarPedido(
        itens.map((i) => ({ produto_id: i.produtoId, quantidade: i.quantidade })),
        endereco
      );
      limpar();
      if (pagamento.modo === 'mercado_pago' && pagamento.url) {
        // Abre o checkout do Mercado Pago; quando a pessoa fecha, vamos para o pedido,
        // que consulta a API e mostra se o pagamento foi aprovado.
        await WebBrowser.openBrowserAsync(pagamento.url);
      }
      router.replace({ pathname: '/pedido/[id]', params: { id: String(pedido.id) } });
    } catch (e) {
      setErro((e as Error).message);
      setEnviando(false);
    }
  }

  const total = subtotal + (frete ?? 0);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <TituloSecao>Resumo do pedido</TituloSecao>
        <Cartao>
          {itens.map((i) => (
            <LinhaValor key={i.produtoId} rotulo={`${i.quantidade}× ${i.nome}`} valor={formatarPreco(i.preco * i.quantidade)} />
          ))}
          <View style={styles.divisor} />
          <LinhaValor rotulo={`Subtotal (${quantidadeTotal} itens)`} valor={formatarPreco(subtotal)} />
          <LinhaValor rotulo="Frete" valor={frete === null ? 'informe o CEP' : frete === 0 ? 'Grátis' : formatarPreco(frete)} />
          <View style={styles.divisor} />
          <LinhaValor rotulo="Total" valor={formatarPreco(total)} destaque />
        </Cartao>

        <TituloSecao>Endereço de entrega</TituloSecao>
        <FormEndereco valores={endereco} onChange={setEndereco} erros={errosEndereco} />

        <TituloSecao>Pagamento</TituloSecao>
        <Cartao estilo={styles.mp}>
          <Text style={styles.mpTitulo}>Mercado Pago</Text>
          <Text style={styles.mpTexto}>
            Você escolhe Pix, cartão de crédito ou boleto na página segura do Mercado Pago.
          </Text>
        </Cartao>

        {erro ? <MensagemErro texto={erro} /> : null}
        <Botao titulo={`Pagar ${formatarPreco(total)}`} onPress={pagar} carregando={enviando}
          desabilitado={frete === null} estilo={{ marginTop: Espaco.lg }} testID="pagar" />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: Espaco.xl, paddingTop: 0, paddingBottom: Espaco.xxl * 2 },
  divisor: { height: 1, backgroundColor: Cores.borda, marginVertical: Espaco.sm },
  mp: { borderLeftWidth: 4, borderLeftColor: '#009EE3' },
  mpTitulo: { fontWeight: '800', color: '#009EE3', fontSize: Fonte.normal },
  mpTexto: { color: Cores.textoSecundario, fontSize: Fonte.pequena, marginTop: Espaco.xs, lineHeight: 19 },
});
