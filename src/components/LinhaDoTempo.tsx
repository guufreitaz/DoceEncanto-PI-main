import { StyleSheet, Text, View } from 'react-native';

import { Cores, Espaco, Fonte } from '@/constants/theme';
import type { StatusPedido } from '@/utils/formatacao';

import { Icone, NomeIcone } from './Icone';

const ETAPAS: { status: StatusPedido | 'feito'; rotulo: string; icone: NomeIcone }[] = [
  { status: 'feito', rotulo: 'Pedido feito', icone: 'receipt-text-outline' },
  { status: 'pago', rotulo: 'Pagamento aprovado', icone: 'credit-card-check-outline' },
  { status: 'em_preparo', rotulo: 'Em preparo', icone: 'chef-hat' },
  { status: 'enviado', rotulo: 'Saiu para entrega', icone: 'truck-delivery-outline' },
  { status: 'entregue', rotulo: 'Entregue', icone: 'package-variant-closed-check' },
];

/** Em que etapa o pedido está (0 = só foi feito). -1 = cancelado/recusado, sem linha do tempo. */
export function etapaAtual(status: StatusPedido): number {
  if (status === 'cancelado' || status === 'recusado') return -1;
  if (status === 'aguardando_pagamento') return 0;
  return ETAPAS.findIndex((e) => e.status === status);
}

/** Acompanhamento do pedido, do pagamento até a entrega. */
export function LinhaDoTempo({ status }: { status: StatusPedido }) {
  const atual = etapaAtual(status);
  if (atual < 0) return null;

  return (
    <View accessibilityLabel={`Andamento: ${ETAPAS[atual].rotulo}`} testID="linha-do-tempo">
      {ETAPAS.map((etapa, i) => {
        const feita = i <= atual;
        const ultima = i === ETAPAS.length - 1;
        return (
          <View key={etapa.status} style={styles.linha}>
            <View style={styles.trilho}>
              <View style={[styles.bolinha, feita ? styles.bolinhaFeita : styles.bolinhaPendente]}>
                <Icone name={feita ? etapa.icone : etapa.icone} size={16} color={feita ? Cores.branco : Cores.textoClaro} />
              </View>
              {!ultima ? <View style={[styles.traco, i < atual && styles.tracoFeito]} /> : null}
            </View>
            <View style={styles.texto}>
              <Text style={[styles.rotulo, feita ? styles.rotuloFeito : null, i === atual && styles.rotuloAtual]}>
                {etapa.rotulo}
              </Text>
              {i === atual && i < ETAPAS.length - 1 ? <Text style={styles.agora}>Etapa atual</Text> : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  linha: { flexDirection: 'row', minHeight: 52 },
  trilho: { alignItems: 'center', width: 32, marginRight: Espaco.md },
  bolinha: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  bolinhaFeita: { backgroundColor: Cores.primaria },
  bolinhaPendente: { backgroundColor: Cores.fundo, borderWidth: 1.5, borderColor: Cores.borda },
  traco: { flex: 1, width: 2, backgroundColor: Cores.borda, marginVertical: 2 },
  tracoFeito: { backgroundColor: Cores.primaria },
  texto: { flex: 1, paddingTop: 6 },
  rotulo: { fontSize: Fonte.normal, color: Cores.textoClaro },
  rotuloFeito: { color: Cores.texto },
  rotuloAtual: { fontWeight: '800', color: Cores.primaria },
  agora: { fontSize: 12, color: Cores.textoSecundario, marginTop: 2 },
});
