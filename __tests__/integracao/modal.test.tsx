/**
 * TESTE DE INTEGRAÇÃO: modal próprio do app (ModalProvider + avisar/confirmar).
 */
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Text } from 'react-native';

import { ModalProvider } from '@/components/Modal';
import { avisar, confirmar } from '@/utils/dialogos';

async function montar() {
  await render(<ModalProvider><Text>tela</Text></ModalProvider>);
}

test('aviso de sucesso mostra título e mensagem e fecha no OK', async () => {
  await montar();
  let fechou = false;
  await act(async () => {
    avisar('Conta criada!', 'Seja bem-vinda.', 'sucesso').then(() => { fechou = true; });
  });

  expect(await screen.findByText('Conta criada!')).toBeOnTheScreen();
  expect(screen.getByText('Seja bem-vinda.')).toBeOnTheScreen();
  expect(screen.queryByTestId('modal-cancelar')).not.toBeOnTheScreen();

  await fireEvent.press(screen.getByTestId('modal-ok'));
  await waitFor(() => expect(fechou).toBe(true));
  expect(screen.queryByText('Conta criada!')).not.toBeOnTheScreen();
});

test('confirmação devolve true ao confirmar e false ao cancelar', async () => {
  await montar();
  let sim!: Promise<boolean>;
  await act(async () => { sim = confirmar('Excluir produto', 'Tem certeza?', 'Excluir'); });
  await fireEvent.press(await screen.findByText('Excluir'));
  await expect(sim).resolves.toBe(true);

  let nao!: Promise<boolean>;
  await act(async () => { nao = confirmar('Sair', 'Deseja sair?', 'Sair'); });
  await fireEvent.press(await screen.findByTestId('modal-cancelar'));
  await expect(nao).resolves.toBe(false);
});

test('dois avisos seguidos aparecem um de cada vez (fila)', async () => {
  await montar();
  await act(async () => {
    avisar('Primeiro');
    avisar('Segundo');
  });
  expect(await screen.findByText('Primeiro')).toBeOnTheScreen();
  expect(screen.queryByText('Segundo')).not.toBeOnTheScreen();
  await fireEvent.press(screen.getByTestId('modal-ok'));
  expect(await screen.findByText('Segundo')).toBeOnTheScreen();
});
