import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';

import { Botao } from '@/components/Botao';
import { Carregando, MensagemErro, Vazio } from '@/components/Interface';
import { ListaPedidos } from '@/components/ListaPedidos';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/api';
import type { Pedido } from '@/services/tipos';

export default function PedidosScreen() {
  const router = useRouter();
  const { usuario } = useAuth();
  const [pedidos, setPedidos] = useState<Pedido[] | null>(null);
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    try {
      setErro(null);
      const todos = await api.listarPedidos();
      // A admin também vê aqui só os pedidos que ela mesma fez; a lista completa fica em "Conta"
      setPedidos(todos.filter((p) => p.usuario_id === usuario?.id));
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setAtualizando(false);
    }
  }, [usuario?.id]);

  useFocusEffect(useCallback(() => { carregar(); }, [carregar]));

  if (!pedidos) return erro ? <MensagemErro texto={erro} onTentar={carregar} /> : <Carregando />;

  return (
    <ListaPedidos
      pedidos={pedidos}
      atualizando={atualizando}
      onAtualizar={() => { setAtualizando(true); carregar(); }}
      cabecalho={erro ? <MensagemErro texto={erro} /> : undefined}
      vazio={
        <Vazio icone="receipt-text-outline" titulo="Você ainda não fez pedidos" texto="Que tal começar por um bolo?"
          acao={<Botao titulo="Ver cardápio" onPress={() => router.navigate('/catalogo')} />} />
      }
    />
  );
}
