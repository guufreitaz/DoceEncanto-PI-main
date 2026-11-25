import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { Cores } from '@/constants/theme';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ModalProvider } from '@/components/Modal';
import { CartProvider } from '@/contexts/CartContext';
import { FavoritosProvider } from '@/contexts/FavoritosContext';

SplashScreen.preventAutoHideAsync().catch(() => {});

function Navegacao() {
  const { carregando } = useAuth();

  // Esconde a tela de abertura só depois de saber se há alguém logado
  useEffect(() => {
    if (!carregando) SplashScreen.hideAsync().catch(() => {});
  }, [carregando]);

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: Cores.fundo },
        headerTintColor: Cores.primaria,
        headerTitleStyle: { color: Cores.texto, fontWeight: '700' },
        headerShadowVisible: false,
        headerBackTitle: 'Voltar',
        contentStyle: { backgroundColor: Cores.fundo },
      }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="cadastro" options={{ title: 'Criar conta' }} />
      <Stack.Screen name="(loja)" options={{ headerShown: false }} />
      <Stack.Screen name="produto/[id]" options={{ title: '' }} />
      <Stack.Screen name="pagamento" options={{ title: 'Finalizar compra' }} />
      <Stack.Screen name="pedido/[id]" options={{ title: 'Pedido' }} />
      <Stack.Screen name="editar-perfil" options={{ title: 'Meus dados' }} />
      <Stack.Screen name="admin/produtos" options={{ title: 'Gerenciar produtos' }} />
      <Stack.Screen name="admin/produto-form" options={{ title: 'Produto' }} />
      <Stack.Screen name="admin/pedidos" options={{ title: 'Todos os pedidos' }} />
      <Stack.Screen name="admin/mensagens" options={{ title: 'Mensagens de clientes' }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <ModalProvider>
      <AuthProvider>
        <CartProvider>
          <FavoritosProvider>
            <StatusBar style="dark" />
            <Navegacao />
          </FavoritosProvider>
        </CartProvider>
      </AuthProvider>
    </ModalProvider>
  );
}
