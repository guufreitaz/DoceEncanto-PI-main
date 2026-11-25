import { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Cores, Espaco } from '@/constants/theme';
import type { Endereco } from '@/services/tipos';
import { buscarCep } from '@/services/viacep';
import { mascaraCep, soDigitos } from '@/utils/formatacao';

import { Campo } from './Campo';

export type ValoresEndereco = Required<Record<keyof Endereco, string>>;

export const enderecoVazio: ValoresEndereco = {
  cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', uf: '',
};

export function validarEndereco(e: ValoresEndereco): Partial<Record<keyof Endereco, string>> {
  const erros: Partial<Record<keyof Endereco, string>> = {};
  if (soDigitos(e.cep).length !== 8) erros.cep = 'Informe um CEP com 8 números.';
  if (!e.logradouro.trim()) erros.logradouro = 'Informe a rua.';
  if (!e.numero.trim()) erros.numero = 'Informe o número.';
  if (!e.cidade.trim()) erros.cidade = 'Informe a cidade.';
  if (!/^[A-Za-z]{2}$/.test(e.uf.trim())) erros.uf = 'UF com 2 letras.';
  return erros;
}

/**
 * Bloco de endereço usado no cadastro, no perfil e no checkout.
 * Ao completar o CEP, preenche rua, bairro, cidade e UF pela API ViaCEP (Correios).
 */
export function FormEndereco({
  valores,
  onChange,
  erros = {},
}: {
  valores: ValoresEndereco;
  onChange: (v: ValoresEndereco) => void;
  erros?: Partial<Record<keyof Endereco, string>>;
}) {
  const [buscando, setBuscando] = useState(false);
  const [erroCep, setErroCep] = useState<string | null>(null);
  const muda = (campo: keyof ValoresEndereco) => (texto: string) => onChange({ ...valores, [campo]: texto });

  async function aoMudarCep(texto: string) {
    const cep = mascaraCep(texto);
    onChange({ ...valores, cep });
    setErroCep(null);
    if (soDigitos(cep).length !== 8) return;

    setBuscando(true);
    try {
      const e = await buscarCep(cep);
      onChange({ ...valores, cep, logradouro: e.logradouro, bairro: e.bairro, cidade: e.cidade, uf: e.uf });
    } catch (err) {
      setErroCep((err as Error).message);
    } finally {
      setBuscando(false);
    }
  }

  return (
    <View>
      <View style={styles.linha}>
        <View style={{ flex: 1 }}>
          <Campo
            rotulo="CEP"
            placeholder="00000-000"
            keyboardType="number-pad"
            value={valores.cep}
            onChangeText={aoMudarCep}
            erro={erroCep || erros.cep}
            dica="Preenchemos o endereço pelos Correios"
            testID="campo-cep"
          />
        </View>
        {buscando ? <ActivityIndicator color={Cores.primaria} style={styles.carregando} /> : null}
      </View>
      <Campo rotulo="Rua" value={valores.logradouro} onChangeText={muda('logradouro')} erro={erros.logradouro} />
      <View style={styles.linha}>
        <View style={{ flex: 1 }}>
          <Campo rotulo="Número" keyboardType="number-pad" value={valores.numero} onChangeText={muda('numero')}
            erro={erros.numero} testID="campo-numero" />
        </View>
        <View style={{ flex: 2 }}>
          <Campo rotulo="Complemento" placeholder="Opcional" value={valores.complemento ?? ''}
            onChangeText={muda('complemento')} />
        </View>
      </View>
      <Campo rotulo="Bairro" value={valores.bairro ?? ''} onChangeText={muda('bairro')} />
      <View style={styles.linha}>
        <View style={{ flex: 3 }}>
          <Campo rotulo="Cidade" value={valores.cidade} onChangeText={muda('cidade')} erro={erros.cidade} />
        </View>
        <View style={{ flex: 1 }}>
          <Campo rotulo="UF" autoCapitalize="characters" maxLength={2} value={valores.uf}
            onChangeText={(t) => muda('uf')(t.toUpperCase())} erro={erros.uf} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  linha: { flexDirection: 'row', gap: Espaco.md },
  carregando: { marginTop: 36 },
});
