import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { Botao } from '@/components/Botao';
import { Campo } from '@/components/Campo';
import { enderecoVazio, FormEndereco, validarEndereco, ValoresEndereco } from '@/components/FormEndereco';
import { MensagemErro, TituloSecao } from '@/components/Interface';
import { Cores, Espaco, Fonte } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { avisar } from '@/utils/dialogos';
import { emailValido, mascaraTelefone, soDigitos } from '@/utils/formatacao';

type Erros = Record<string, string | undefined>;

export default function CadastroScreen() {
  const router = useRouter();
  const { cadastrar } = useAuth();

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [senha, setSenha] = useState('');
  const [endereco, setEndereco] = useState<ValoresEndereco>(enderecoVazio);
  const [erros, setErros] = useState<Erros>({});
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  function validar(): boolean {
    const e: Erros = { ...validarEndereco(endereco) };
    if (nome.trim().split(/\s+/).length < 2) e.nome = 'Informe nome e sobrenome.';
    if (!emailValido(email)) e.email = 'E-mail inválido.';
    if (soDigitos(telefone).length < 10) e.telefone = 'Telefone com DDD.';
    if (senha.length < 6) e.senha = 'A senha precisa ter pelo menos 6 caracteres.';
    setErros(e);
    return Object.values(e).every((v) => !v);
  }

  async function handleCadastrar() {
    if (!validar()) return setErroGeral('Confira os campos destacados.');
    setErroGeral(null);
    setEnviando(true);
    try {
      const u = await cadastrar({ nome: nome.trim(), email: email.trim(), telefone, senha, ...endereco });
      router.replace('/catalogo');
      avisar('Conta criada!', `Seja bem-vinda(o) à Doce Encanto, ${u.nome.split(' ')[0]}.`, 'sucesso');
    } catch (e) {
      setErroGeral((e as Error).message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <TituloSecao>Seus dados</TituloSecao>
        <Campo rotulo="Nome completo" placeholder="Ex: Maria Oliveira" autoComplete="name" value={nome}
          onChangeText={setNome} erro={erros.nome} testID="cadastro-nome" />
        <Campo rotulo="E-mail" placeholder="Ex: maria@exemplo.com" keyboardType="email-address" autoCapitalize="none"
          autoComplete="email" value={email} onChangeText={setEmail} erro={erros.email} testID="cadastro-email" />
        <Campo rotulo="Telefone" placeholder="(11) 99999-9999" keyboardType="phone-pad" value={telefone}
          onChangeText={(t) => setTelefone(mascaraTelefone(t))} erro={erros.telefone} testID="cadastro-telefone" />
        <Campo rotulo="Senha" placeholder="Mínimo de 6 caracteres" secureTextEntry autoComplete="new-password"
          value={senha} onChangeText={setSenha} erro={erros.senha} testID="cadastro-senha" />

        <TituloSecao>Endereço de entrega</TituloSecao>
        <FormEndereco valores={endereco} onChange={setEndereco} erros={erros} />

        {erroGeral ? <MensagemErro texto={erroGeral} /> : null}
        <Botao titulo="Cadastrar" onPress={handleCadastrar} carregando={enviando} testID="cadastro-enviar" />

        <Pressable onPress={() => router.back()} hitSlop={8}>
          <Text style={styles.link}>Já possui conta? Fazer login</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: Espaco.xl, paddingTop: 0, paddingBottom: Espaco.xxl * 2 },
  link: { textAlign: 'center', color: Cores.primaria, marginTop: Espaco.xl, fontSize: Fonte.normal, fontWeight: '600' },
});
