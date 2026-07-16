import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Storage adapter behind one interface so the backing store can be swapped
 * (e.g. for react-native-mmkv in a custom dev client) without touching callers.
 * Sensitive values (tokens) go through SecureStore; everything else (redux-persist,
 * UI prefs) goes through AsyncStorage so the app runs unmodified in Expo Go.
 */
export const secureStorage = {
  async getItem(key: string) {
    return SecureStore.getItemAsync(key);
  },
  async setItem(key: string, value: string) {
    return SecureStore.setItemAsync(key, value);
  },
  async removeItem(key: string) {
    return SecureStore.deleteItemAsync(key);
  },
};

export const persistStorage = {
  getItem: (key: string) => AsyncStorage.getItem(key),
  setItem: (key: string, value: string) => AsyncStorage.setItem(key, value),
  removeItem: (key: string) => AsyncStorage.removeItem(key),
};
