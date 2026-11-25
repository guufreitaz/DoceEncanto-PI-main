import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Botao } from '@/components/Botao';
import { Campo } from '@/components/Campo';
import { Icone } from '@/components/Icone';
import { MensagemErro } from '@/components/Interface';
import { Cores, Espaco, Fonte } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { avisar } from '@/utils/dialogos';
import { emailValido } from '@/utils/formatacao';

export default function LoginScreen() {
  const router = useRouter();
  const { entrar } = useAuth();
  const senhaRef = useRef<TextInput>(null);

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function handleEntrar() {
    if (!emailValido(email)) return setErro('Digite um e-mail válido.');
    if (!senha) return setErro('Digite sua senha.');
    setErro(null);
    setEnviando(true);
    try {
      const u = await entrar(email, senha);
      router.replace('/catalogo');
      avisar(`Olá, ${u.nome.split(' ')[0]}!`, 'Login feito com sucesso. Escolha suas delícias no cardápio.', 'sucesso');
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.conteudo} keyboardShouldPersistTaps="handled">
          <View style={styles.iconCircle}>
            <Icone name="cupcake" size={44} color={Cores.primaria} />
          </View>
          <Text style={styles.title}>Doce Encanto</Text>
          <Text style={styles.subtitle}>O sabor irresistível da confeitaria artesanal</Text>

          <Campo
            rotulo="E-mail"
            placeholder="maria@exemplo.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            returnKeyType="next"
            value={email}
            onChangeText={setEmail}
            onSubmitEditing={() => senhaRef.current?.focus()}
            testID="login-email"
          />
          <Campo
            ref={senhaRef}
            rotulo="Senha"
            placeholder="Sua senha secreta"
            secureTextEntry
            autoComplete="password"
            returnKeyType="go"
            value={senha}
            onChangeText={setSenha}
            onSubmitEditing={handleEntrar}
            testID="login-senha"
          />

          <Pressable
            style={styles.forgotButton}
            onPress={() =>
              avisar('Esqueceu a senha?', 'Fale com a Doce Encanto pelo WhatsApp (11) 98888-0000 para redefinir.')
            }>
            <Text style={styles.forgotText}>Esqueceu sua senha?</Text>
          </Pressable>

          {erro ? <MensagemErro texto={erro} /> : null}

          <Botao titulo="Entrar" onPress={handleEntrar} carregando={enviando} testID="login-entrar" />

          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>Não tem uma conta?</Text>
            <Pressable onPress={() => router.push('/cadastro')} hitSlop={8}>
              <Text style={styles.registerLink}> Cadastre-se</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Cores.fundo },
  conteudo: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: Espaco.xxl, paddingVertical: Espaco.xl },
  iconCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: Cores.rosaClaro,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Espaco.md,
  },
  title: { fontSize: Fonte.destaque + 2, fontWeight: '800', color: Cores.primaria, textAlign: 'center' },
  subtitle: {
    fontSize: Fonte.normal,
    color: Cores.textoSecundario,
    textAlign: 'center',
    marginTop: Espaco.xs,
    marginBottom: Espaco.xxl,
  },
  forgotButton: { alignSelf: 'flex-end', marginTop: -Espaco.sm, marginBottom: Espaco.lg, padding: Espaco.xs },
  forgotText: { fontSize: Fonte.pequena, color: Cores.textoSecundario },
  registerContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: Espaco.xl },
  registerText: { fontSize: Fonte.normal, color: Cores.textoSecundario },
  registerLink: { fontSize: Fonte.normal, color: Cores.primaria, fontWeight: '700' },
});
