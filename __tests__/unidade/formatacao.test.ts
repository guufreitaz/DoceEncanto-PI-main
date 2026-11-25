/** TESTES UNITÁRIOS: funções de formatação e validação do app. */
import {
  emailValido,
  formatarData,
  formatarPreco,
  lerPreco,
  mascaraCep,
  mascaraTelefone,
} from '@/utils/formatacao';

describe('formatarPreco', () => {
  test.each([
    [0, 'R$ 0,00'],
    [14.9, 'R$ 14,90'],
    [1234.5, 'R$ 1.234,50'],
    [1000000, 'R$ 1.000.000,00'],
  ])('%p vira %p', (valor, esperado) => expect(formatarPreco(valor)).toBe(esperado));
});

describe('lerPreco', () => {
  test.each([
    ['89,90', 89.9],
    ['R$ 1.234,50', 1234.5],
    ['12.5', 12.5],
    ['10', 10],
  ])('%p vira %p', (texto, esperado) => expect(lerPreco(texto)).toBe(esperado));
  test('texto sem número vira NaN', () => expect(lerPreco('abc')).toBeNaN());
});

describe('máscaras', () => {
  test('CEP', () => {
    expect(mascaraCep('01310100')).toBe('01310-100');
    expect(mascaraCep('0131')).toBe('0131');
    expect(mascaraCep('01310-1009999')).toBe('01310-100');
  });
  test('telefone celular e fixo', () => {
    expect(mascaraTelefone('11999998888')).toBe('(11) 99999-8888');
    expect(mascaraTelefone('1133334444')).toBe('(11) 3333-4444');
    expect(mascaraTelefone('11')).toBe('(11');
  });
});

test('emailValido', () => {
  expect(emailValido('maria@exemplo.com')).toBe(true);
  expect(emailValido(' maria@exemplo.com.br ')).toBe(true);
  expect(emailValido('maria@')).toBe(false);
  expect(emailValido('maria exemplo.com')).toBe(false);
});

test('formatarData converte a data do banco (UTC) para dd/mm/aaaa hh:mm', () => {
  expect(formatarData('2026-11-23 12:00:00')).toMatch(/^\d{2}\/11\/2026 \d{2}:00$/);
  expect(formatarData('data ruim')).toBe('data ruim');
});
