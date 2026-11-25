// Dublês de módulos nativos para rodar os testes fora do celular
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
jest.mock('expo-web-browser', () => ({ openBrowserAsync: jest.fn() }));
