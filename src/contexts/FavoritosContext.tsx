import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { useAuth } from './AuthContext';

type ContextoFavoritos = {
  favoritos: number[];
  ehFavorito: (produtoId: number) => boolean;
  alternar: (produtoId: number) => void;
};

const FavoritosContext = createContext<ContextoFavoritos | null>(null);

/** Produtos favoritos de cada cliente, guardados no aparelho. */
export function FavoritosProvider({ children }: { children: ReactNode }) {
  const { usuario } = useAuth();
  const chave = usuario ? `@doceencanto/favoritos/${usuario.id}` : null;
  const [favoritos, setFavoritos] = useState<number[]>([]);

  useEffect(() => {
    setFavoritos([]);
    if (!chave) return;
    AsyncStorage.getItem(chave)
      .then((salvo) => salvo && setFavoritos(JSON.parse(salvo)))
      .catch(() => {});
  }, [chave]);

  const alternar = useCallback(
    (produtoId: number) => {
      setFavoritos((atual) => {
        const novo = atual.includes(produtoId) ? atual.filter((id) => id !== produtoId) : [...atual, produtoId];
        if (chave) AsyncStorage.setItem(chave, JSON.stringify(novo)).catch(() => {});
        return novo;
      });
    },
    [chave]
  );

  const valor = useMemo(
    () => ({ favoritos, ehFavorito: (id: number) => favoritos.includes(id), alternar }),
    [favoritos, alternar]
  );
  return <FavoritosContext.Provider value={valor}>{children}</FavoritosContext.Provider>;
}

export function useFavoritos() {
  const ctx = useContext(FavoritosContext);
  if (!ctx) throw new Error('useFavoritos precisa estar dentro do FavoritosProvider');
  return ctx;
}
