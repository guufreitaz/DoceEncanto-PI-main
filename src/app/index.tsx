import { Redirect } from 'expo-router';

import { Carregando } from '@/components/Interface';
import { useAuth } from '@/contexts/AuthContext';

/** Porta de entrada: manda para o catálogo se já estiver logado, senão para o login. */
export default function Inicio() {
  const { usuario, carregando } = useAuth();
  if (carregando) return <Carregando />;
  return <Redirect href={usuario ? '/catalogo' : '/login'} />;
}
