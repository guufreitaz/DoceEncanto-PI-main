import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';

import { Botao } from '@/components/Botao';
import { Campo } from '@/components/Campo';
import { FormEndereco, validarEndereco, ValoresEndereco } from '@/components/FormEndereco';
import { MensagemErro, TituloSecao } from '@/components/Interface';
import { Espaco } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/api';
import { avisar } from '@/utils/dialogos';
import { mascaraTelefone } from '@/utils/formatacao';

/** UPDATE do cadastro da cliente. */
export default function EditarPerfilScreen() {
  const router = useRouter();
  const { usuario, atualizarUsuario } = useAuth();

  const [nome, setNome] = useState(usuario?.nome ?? '');
  const [telefone, setTelefone] = useState(usuario?.telefone ?? '');
  const [senha, setSenha] = useState('');
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
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  async function salvar() {
    const erros = validarEndereco(endereco);
    setErrosEndereco(erros);
    if (nome.trim().length < 3) return setErro('Informe seu nome completo.');
    if (senha && senha.length < 6) return setErro('A nova senha precisa ter pelo menos 6 caracteres.');
    if (Object.keys(erros).length) return setErro('Confira o endereço.');

    setErro(null);
    setSalvando(true);
    try {
      const atualizado = await api.atualizarPerfil({ nome, telefone, ...endereco, ...(senha ? { senha } : {}) });
      atualizarUsuario(atualizado);
      avisar('Dados atualizados!', 'Suas informações foram salvas.', 'sucesso');
      router.back();
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <TituloSecao>Seus dados</TituloSecao>
        <Campo rotulo="Nome completo" value={nome} onChangeText={setNome} />
        <Campo rotulo="E-mail" value={usuario?.email} editable={false} dica="O e-mail não pode ser alterado." />
        <Campo rotulo="Telefone" keyboardType="phone-pad" value={telefone}
          onChangeText={(t) => setTelefone(mascaraTelefone(t))} />
        <Campo rotulo="Nova senha" placeholder="Deixe em branco para manter" secureTextEntry value={senha}
          onChangeText={setSenha} />

        <TituloSecao>Endereço de entrega</TituloSecao>
        <FormEndereco valores={endereco} onChange={setEndereco} erros={errosEndereco} />

        {erro ? <MensagemErro texto={erro} /> : null}
        <Botao titulo="Salvar alterações" onPress={salvar} carregando={salvando} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: Espaco.xl, paddingTop: 0, paddingBottom: Espaco.xxl * 2 },
});
