import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { api, DadosCadastro, definirToken, ErroApi } from '@/services/api';
import type { Usuario } from '@/services/tipos';

const CHAVE_TOKEN = '@doceencanto/token';

type ContextoAuth = {
  usuario: Usuario | null;
  carregando: boolean;
  ehAdmin: boolean;
  entrar: (email: string, senha: string) => Promise<Usuario>;
  cadastrar: (dados: DadosCadastro) => Promise<Usuario>;
  sair: () => Promise<void>;
  atualizarUsuario: (u: Usuario) => void;
};

const AuthContext = createContext<ContextoAuth | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [carregando, setCarregando] = useState(true);

  // Ao abrir o app, recupera a sessão salva e confere com o servidor
  useEffect(() => {
    (async () => {
      try {
        const token = await AsyncStorage.getItem(CHAVE_TOKEN);
        if (token) {
          definirToken(token);
          setUsuario(await api.eu());
        }
      } catch (e) {
        // Token vencido: apaga. Servidor fora do ar: também volta para o login.
        if (e instanceof ErroApi && e.status === 401) await AsyncStorage.removeItem(CHAVE_TOKEN);
        definirToken(null);
      } finally {
        setCarregando(false);
      }
    })();
  }, []);

  const guardarSessao = useCallback(async (token: string, u: Usuario) => {
    definirToken(token);
    await AsyncStorage.setItem(CHAVE_TOKEN, token);
    setUsuario(u);
  }, []);

  const entrar = useCallback(async (email: string, senha: string) => {
    const { token, usuario: u } = await api.login(email.trim(), senha);
    await guardarSessao(token, u);
    return u;
  }, [guardarSessao]);

  const cadastrar = useCallback(async (dados: DadosCadastro) => {
    const { token, usuario: u } = await api.cadastrar(dados);
    await guardarSessao(token, u);
    return u;
  }, [guardarSessao]);

  const sair = useCallback(async () => {
    try {
      await api.sair();
    } catch {
      // mesmo se o servidor não responder, sai do app
    }
    definirToken(null);
    await AsyncStorage.removeItem(CHAVE_TOKEN);
    setUsuario(null);
  }, []);

  const valor = useMemo(
    () => ({
      usuario,
      carregando,
      ehAdmin: usuario?.perfil === 'admin',
      entrar,
      cadastrar,
      sair,
      atualizarUsuario: setUsuario,
    }),
    [usuario, carregando, entrar, cadastrar, sair]
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth precisa estar dentro do AuthProvider');
  return ctx;
}
