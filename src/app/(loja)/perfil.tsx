import { Href, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Botao } from '@/components/Botao';
import { Cartao, TituloSecao } from '@/components/Interface';
import { Cores, Espaco, Fonte, Raio } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useCarrinho } from '@/contexts/CartContext';
import { exportarJson } from '@/services/exportar';
import { avisar, confirmar } from '@/utils/dialogos';
import { Icone, NomeIcone } from '@/components/Icone';


function ItemMenu({ icone, titulo, descricao, onPress, carregando, testID }: {
  icone: NomeIcone;
  titulo: string;
  descricao?: string;
  onPress: () => void;
  carregando?: boolean;
  testID?: string;
}) {
  return (
    <Pressable style={styles.item} onPress={onPress} disabled={carregando} accessibilityRole="button" testID={testID}>
      <View style={styles.itemIcone}>
        <Icone name={icone} size={20} color={Cores.primaria} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.itemTitulo}>{titulo}</Text>
        {descricao ? <Text style={styles.itemDescricao}>{descricao}</Text> : null}
      </View>
      {carregando ? <ActivityIndicator color={Cores.primaria} /> : <Icone name="chevron-right" size={18} color={Cores.textoClaro} />}
    </Pressable>
  );
}

export default function PerfilScreen() {
  const router = useRouter();
  const { usuario, ehAdmin, sair } = useAuth();
  const { limpar } = useCarrinho();
  const [exportando, setExportando] = useState(false);

  async function exportar() {
    setExportando(true);
    try {
      const { arquivo, pedidos } = await exportarJson();
      avisar('Dados exportados', `${arquivo}\n${pedidos} pedidos incluídos. Use este arquivo no dashboard em Python.`, 'sucesso');
    } catch (e) {
      avisar('Não foi possível exportar', (e as Error).message, 'erro');
    } finally {
      setExportando(false);
    }
  }

  async function handleSair() {
    if (!(await confirmar('Sair', 'Deseja sair da sua conta?', 'Sair'))) return;
    limpar();
    await sair();
    router.replace('/login');
  }

  const ir = (href: Href) => () => router.push(href);

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <Cartao estilo={styles.cabecalho}>
        <View style={styles.avatar}>
          <Text style={styles.avatarTexto}>{usuario?.nome?.[0]?.toUpperCase() ?? '?'}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.nome}>{usuario?.nome}</Text>
          <Text style={styles.email}>{usuario?.email}</Text>
          {ehAdmin ? <Text style={styles.admin}>Administradora</Text> : null}
        </View>
      </Cartao>

      <TituloSecao>Minha conta</TituloSecao>
      <Cartao estilo={{ padding: 0 }}>
        <ItemMenu icone="account-outline" titulo="Meus dados" descricao="Nome, telefone, endereço e senha"
          onPress={ir('/editar-perfil')} />
        <ItemMenu icone="receipt-text-outline" titulo="Meus pedidos" onPress={() => router.navigate('/pedidos')} />
      </Cartao>

      {ehAdmin ? (
        <>
          <TituloSecao>Administração</TituloSecao>
          <Cartao estilo={{ padding: 0 }}>
            <ItemMenu icone="tag-multiple-outline" titulo="Gerenciar produtos" descricao="Cadastrar, alterar e excluir"
              onPress={ir('/admin/produtos')} testID="menu-admin-produtos" />
            <ItemMenu icone="clipboard-text-outline" titulo="Todos os pedidos" descricao="Acompanhar e mudar o andamento"
              onPress={ir('/admin/pedidos')} />
            <ItemMenu icone="message-reply-text-outline" titulo="Mensagens de clientes" onPress={ir('/admin/mensagens')} />
            <ItemMenu icone="download-outline" titulo="Exportar dados (JSON)" descricao="Arquivo para o dashboard de Análise de Dados"
              onPress={exportar} carregando={exportando} testID="exportar-json" />
          </Cartao>
        </>
      ) : null}

      <Botao titulo="Sair da conta" variante="perigo" onPress={handleSair} estilo={{ marginTop: Espaco.xxl }}
        testID="sair" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: Espaco.lg, paddingBottom: Espaco.xxl * 2 },
  cabecalho: { flexDirection: 'row', alignItems: 'center', gap: Espaco.lg },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Cores.primaria,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarTexto: { color: Cores.branco, fontSize: Fonte.titulo, fontWeight: '800' },
  nome: { fontSize: Fonte.subtitulo, fontWeight: '800', color: Cores.texto },
  email: { fontSize: Fonte.pequena, color: Cores.textoSecundario, marginTop: 2 },
  admin: {
    alignSelf: 'flex-start',
    marginTop: Espaco.xs,
    backgroundColor: Cores.rosaClaro,
    color: Cores.primariaEscura,
    fontSize: 12,
    fontWeight: '700',
    borderRadius: Raio.pilula,
    paddingHorizontal: 8,
    paddingVertical: 2,
    overflow: 'hidden',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espaco.md,
    padding: Espaco.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Cores.borda,
  },
  itemIcone: {
    width: 38,
    height: 38,
    borderRadius: Raio.pilula,
    backgroundColor: Cores.rosaClaro,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemTitulo: { fontSize: Fonte.normal, fontWeight: '600', color: Cores.texto },
  itemDescricao: { fontSize: Fonte.pequena, color: Cores.textoSecundario, marginTop: 2 },
});
