import Constants from 'expo-constants';
import { Platform } from 'react-native';

const PORTA_API = 3333;

/**
 * Descobre o endereço da API.
 *
 * 1. Se existir EXPO_PUBLIC_API_URL (no arquivo .env do app), usa ele.
 * 2. Senão, usa o mesmo IP do computador que está rodando o Expo (funciona no
 *    celular com Expo Go na mesma rede Wi-Fi e no emulador).
 * 3. Na web, usa o mesmo endereço da página.
 */
export function descobrirUrlApi(): string {
  const configurada = process.env.EXPO_PUBLIC_API_URL;
  if (configurada) return configurada.replace(/\/$/, '');

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.hostname}:${PORTA_API}`;
  }

  const hostUri = Constants.expoConfig?.hostUri; // ex.: "192.168.0.10:8081"
  const host = hostUri?.split(':')[0];
  if (host) return `http://${host}:${PORTA_API}`;

  // Emulador Android enxerga o computador pelo IP especial 10.0.2.2
  return Platform.OS === 'android' ? `http://10.0.2.2:${PORTA_API}` : `http://localhost:${PORTA_API}`;
}

export const API_URL = descobrirUrlApi();
