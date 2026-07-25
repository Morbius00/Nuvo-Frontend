import * as Crypto from 'expo-crypto';
import { secureStorage } from './storage';

const DEVICE_ID_KEY = 'nuvo_device_id';

/** Stable per-install identifier — survives app restarts, distinct from the OS-level device. */
export async function getOrCreateDeviceId(): Promise<string> {
  const existing = await secureStorage.getItem(DEVICE_ID_KEY);
  if (existing) return existing;

  const id = Crypto.randomUUID();
  await secureStorage.setItem(DEVICE_ID_KEY, id);
  return id;
}
