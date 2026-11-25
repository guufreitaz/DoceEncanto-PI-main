import * as ImagePicker from 'expo-image-picker';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { Botao } from '@/components/Botao';
import { Campo } from '@/components/Campo';
import { Carregando, Chip, MensagemErro } from '@/components/Interface';
import { ProdutoImagem } from '@/components/ProdutoImagem';
import { Cores, Espaco, Fonte, Raio } from '@/constants/theme';
import { api } from '@/services/api';
import { Categoria, CATEGORIAS } from '@/services/tipos';
import { avisar } from '@/utils/dialogos';
import { lerPreco } from '@/utils/formatacao';
import { somenteAdmin } from '@/components/SomenteAdmin';
import { Icone, NomeIcone } from '@/components/Icone';

/** CREATE e UPDATE de produto. Sem "id" na rota = novo produto; com "id" = edição. */
function FormularioProdutoScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const editando = Boolean(id);

  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [preco, setPreco] = useState('');
  const [categoria, setCategoria] = useState<Categoria>('Bolo');
  const [imagem, setImagem] = useState<string | null>(null);
  const [ativo, setAtivo] = useState(true);
  const [carregando, setCarregando] = useState(editando);
  const [salvando, setSalvando] = useState(false);
  const [erros, setErros] = useState<Record<string, string>>({});
  const [erroGeral, setErroGeral] = useState<string | null>(null);

  // Modo edição: busca o produto e preenche o formulário
  useEffect(() => {
    if (!id) return;
    api.buscarProduto(Number(id))
      .then((p) => {
        setNome(p.nome);
        setDescricao(p.descricao);
        setPreco(p.preco.toFixed(2).replace('.', ','));
        setCategoria(p.categoria);
        setImagem(p.imagem);
        setAtivo(p.ativo);
      })
      .catch((e) => setErroGeral(e.message))
      .finally(() => setCarregando(false));
  }, [id]);

  async function escolherFoto() {
    const permissao = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissao.granted) return avisar('Permissão negada', 'Libere o acesso às fotos nas configurações do celular.', 'aviso');
    const r = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.4, // a foto vai para o banco em base64, então reduzimos o tamanho
      base64: true,
    });
    if (!r.canceled && r.assets[0]?.base64) {
      setImagem(`data:${r.assets[0].mimeType ?? 'image/jpeg'};base64,${r.assets[0].base64}`);
    }
  }

  async function salvar() {
    const valor = lerPreco(preco);
    const e: Record<string, string> = {};
    if (nome.trim().length < 3) e.nome = 'O nome precisa ter pelo menos 3 letras.';
    if (!Number.isFinite(valor) || valor <= 0) e.preco = 'Informe um preço válido, ex: 89,90';
    setErros(e);
    if (Object.keys(e).length) return;

    setSalvando(true);
    setErroGeral(null);
    try {
      const dados = { nome: nome.trim(), descricao: descricao.trim(), preco: valor, categoria, imagem, ativo };
      if (editando) await api.alterarProduto(Number(id), dados);
      else await api.criarProduto(dados);
      router.back();
      avisar(editando ? 'Produto atualizado' : 'Produto cadastrado', `${dados.nome} já está ${ativo ? 'no cardápio' : 'salvo, fora do cardápio'}.`, 'sucesso');
    } catch (err) {
      setErroGeral((err as Error).message);
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) return <Carregando />;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Stack.Screen options={{ title: editando ? 'Editar produto' : 'Novo produto' }} />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Pressable style={styles.foto} onPress={escolherFoto} accessibilityLabel="Escolher foto do produto">
          {imagem ? (
            <ProdutoImagem imagem={imagem} categoria={categoria} />
          ) : (
            <View style={styles.fotoVazia}>
              <Icone name="camera-outline" size={32} color={Cores.textoClaro} />
              <Text style={styles.fotoTexto}>Carregar foto do produto</Text>
            </View>
          )}
        </Pressable>
        {imagem ? (
          <Pressable onPress={() => setImagem(null)} style={{ alignSelf: 'center', marginBottom: Espaco.lg }}>
            <Text style={styles.removerFoto}>Remover foto</Text>
          </Pressable>
        ) : null}

        <Campo rotulo="Nome do produto" placeholder="Ex: Bolo Red Velvet de Casamento" value={nome}
          onChangeText={setNome} erro={erros.nome} testID="produto-nome" />
        <Campo rotulo="Descrição" placeholder="Massa aveludada, recheio de cream cheese..." multiline
          value={descricao} onChangeText={setDescricao} testID="produto-descricao" />
        <Campo rotulo="Preço (R$)" placeholder="Ex: 89,90" keyboardType="decimal-pad" value={preco}
          onChangeText={setPreco} erro={erros.preco} testID="produto-preco" />

        <Text style={styles.rotulo}>Categoria</Text>
        <View style={styles.categorias}>
          {CATEGORIAS.map((c) => (
            <Chip key={c} rotulo={c} ativo={categoria === c} onPress={() => setCategoria(c)} />
          ))}
        </View>

        <View style={styles.ativo}>
          <View style={{ flex: 1 }}>
            <Text style={styles.rotulo}>Aparece no cardápio</Text>
            <Text style={styles.dica}>Desligue para esconder sem apagar</Text>
          </View>
          <Switch value={ativo} onValueChange={setAtivo} trackColor={{ true: Cores.primaria, false: Cores.borda }}
            thumbColor={Cores.branco} />
        </View>

        {erroGeral ? <MensagemErro texto={erroGeral} /> : null}
        <Botao titulo={editando ? 'Salvar alterações' : 'Cadastrar produto'} onPress={salvar} carregando={salvando}
          testID="produto-salvar" />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: Espaco.xl, paddingBottom: Espaco.xxl * 2 },
  foto: {
    height: 180,
    borderRadius: Raio.lg,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: Cores.borda,
    backgroundColor: Cores.superficie,
    marginBottom: Espaco.sm,
  },
  fotoVazia: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Espaco.sm },
  fotoTexto: { color: Cores.textoSecundario, fontSize: Fonte.normal },
  removerFoto: { color: Cores.erro, fontWeight: '600', fontSize: Fonte.pequena },
  rotulo: { fontSize: Fonte.pequena, fontWeight: '600', color: Cores.texto, marginBottom: Espaco.sm },
  dica: { fontSize: Fonte.pequena, color: Cores.textoSecundario, marginTop: -Espaco.xs },
  categorias: { flexDirection: 'row', marginBottom: Espaco.xl },
  ativo: { flexDirection: 'row', alignItems: 'center', marginBottom: Espaco.xl },
});

export default somenteAdmin(FormularioProdutoScreen);
