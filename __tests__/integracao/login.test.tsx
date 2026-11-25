/**
 * TESTE DE INTEGRAÇÃO: tela de login + AuthContext + cliente da API juntos.
 * Só a rede (fetch) e a navegação são simuladas.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

import LoginScreen from '@/app/login';
import { AuthProvider } from '@/contexts/AuthContext';

const mockRouter = { replace: jest.fn(), push: jest.fn(), back: jest.fn() };
jest.mock('expo-router', () => ({ useRouter: () => mockRouter }));

const resposta = (corpo: unknown, status = 200) =>
  Promise.resolve({ ok: status < 400, status, json: async () => corpo } as Response);

const usuario = { id: 2, nome: 'Maria Oliveira', email: 'maria@exemplo.com', perfil: 'cliente' };

async function abrirLogin() {
  await render(<AuthProvider><LoginScreen /></AuthProvider>);
}

beforeEach(async () => {
  jest.clearAllMocks();
  await AsyncStorage.clear();
});

test('login correto chama a API, salva o token e vai para o catálogo', async () => {
  globalThis.fetch = jest.fn(() => resposta({ token: 'tok-123', usuario })) as jest.Mock;
  await abrirLogin();

  await fireEvent.changeText(screen.getByTestId('login-email'), 'maria@exemplo.com');
  await fireEvent.changeText(screen.getByTestId('login-senha'), '123456');
  await fireEvent.press(screen.getByTestId('login-entrar'));

  await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith('/catalogo'));
  const [url, opcoes] = (globalThis.fetch as jest.Mock).mock.calls[0];
  expect(url).toMatch(/\/auth\/login$/);
  expect(JSON.parse(opcoes.body)).toEqual({ email: 'maria@exemplo.com', senha: '123456' });
  expect(await AsyncStorage.getItem('@doceencanto/token')).toBe('tok-123');
});

test('senha errada mostra a mensagem do servidor e não navega', async () => {
  globalThis.fetch = jest.fn(() => resposta({ erro: 'E-mail ou senha incorretos.' }, 401)) as jest.Mock;
  await abrirLogin();

  await fireEvent.changeText(screen.getByTestId('login-email'), 'maria@exemplo.com');
  await fireEvent.changeText(screen.getByTestId('login-senha'), 'errada');
  await fireEvent.press(screen.getByTestId('login-entrar'));

  expect(await screen.findByText('E-mail ou senha incorretos.')).toBeOnTheScreen();
  expect(mockRouter.replace).not.toHaveBeenCalled();
});

test('e-mail inválido é barrado antes de chamar a API', async () => {
  globalThis.fetch = jest.fn() as jest.Mock;
  await abrirLogin();

  await fireEvent.changeText(screen.getByTestId('login-email'), 'maria');
  await fireEvent.press(screen.getByTestId('login-entrar'));

  expect(await screen.findByText('Digite um e-mail válido.')).toBeOnTheScreen();
  expect(globalThis.fetch).not.toHaveBeenCalled();
});
