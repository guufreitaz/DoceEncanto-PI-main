import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { ComponentProps } from 'react';

/**
 * Ícones do app: família Material Design (a mesma do kit Material 3 do Figma).
 * Lista completa de nomes: https://pictogrammers.com/library/mdi/
 */
export type NomeIcone = ComponentProps<typeof MaterialCommunityIcons>['name'];

export function Icone(props: ComponentProps<typeof MaterialCommunityIcons>) {
  return <MaterialCommunityIcons {...props} />;
}
