import { Redirect } from 'expo-router';
import { Tabs } from 'expo-router/tabs';
import type { ColorValue } from 'react-native';

import { Icone, NomeIcone } from '@/components/Icone';
import { Carregando } from '@/components/Interface';
import { Cores } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useCarrinho } from '@/contexts/CartContext';

const icone = (nome: NomeIcone) =>
  function IconeAba({ color, size }: { color: ColorValue; size: number }) {
    return <Icone name={nome} color={color as string} size={size} />;
  };

/** Abas principais da loja. Só entra quem estiver logado. */
export default function LojaLayout() {
  const { usuario, carregando } = useAuth();
  const { quantidadeTotal } = useCarrinho();

  // Espera a sessão carregar antes de montar as abas (senão as telas chamam a API sem o token)
  if (carregando) return <Carregando />;
  if (!usuario) return <Redirect href="/login" />;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Cores.primaria,
        tabBarInactiveTintColor: Cores.textoClaro,
        tabBarStyle: { backgroundColor: Cores.superficie, borderTopColor: Cores.borda },
        headerStyle: { backgroundColor: Cores.fundo },
        headerShadowVisible: false,
        headerTitleStyle: { color: Cores.texto, fontWeight: '700' },
        sceneStyle: { backgroundColor: Cores.fundo },
      }}>
      <Tabs.Screen
        name="catalogo"
        options={{ title: 'Doce Encanto', tabBarLabel: 'Cardápio', tabBarIcon: icone('storefront-outline'), tabBarButtonTestID: 'aba-cardapio',
          headerTitleStyle: { color: Cores.primaria, fontWeight: '800', fontSize: 22 } }}
      />
      <Tabs.Screen
        name="carrinho"
        options={{
          title: 'Carrinho',
          tabBarIcon: icone('cart-outline'),
          tabBarBadge: quantidadeTotal > 0 ? quantidadeTotal : undefined,
          tabBarBadgeStyle: { backgroundColor: Cores.primaria },
          tabBarButtonTestID: 'aba-carrinho',
        }}
      />
      <Tabs.Screen name="pedidos" options={{ title: 'Meus pedidos', tabBarLabel: 'Pedidos', tabBarIcon: icone('receipt-text-outline'), tabBarButtonTestID: 'aba-pedidos' }} />
      <Tabs.Screen name="contato" options={{ title: 'Fale conosco', tabBarLabel: 'Contato', tabBarIcon: icone('message-text-outline'), tabBarButtonTestID: 'aba-contato' }} />
      <Tabs.Screen name="perfil" options={{ title: 'Minha conta', tabBarLabel: 'Conta', tabBarIcon: icone('account-circle-outline'),
        tabBarButtonTestID: 'aba-conta' }} />
    </Tabs>
  );
}
