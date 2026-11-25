import { Redirect } from 'expo-router';
import type { ComponentType } from 'react';

import { useAuth } from '@/contexts/AuthContext';

import { Carregando } from './Interface';

/** Protege as telas de administração: só a administradora entra. */
export function somenteAdmin<P extends object>(Tela: ComponentType<P>) {
  return function TelaProtegida(props: P) {
    const { usuario, carregando, ehAdmin } = useAuth();
    if (carregando) return <Carregando />;
    if (!usuario) return <Redirect href="/login" />;
    if (!ehAdmin) return <Redirect href="/catalogo" />;
    return <Tela {...props} />;
  };
}
