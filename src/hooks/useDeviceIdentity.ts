import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { getOrCreateDeviceId } from '@/utils/deviceId';

/** Resolves once on mount so screens don't need to await inside a submit handler. */
export function useDeviceIdentity() {
  const [deviceId, setDeviceId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getOrCreateDeviceId().then((id) => {
      if (!cancelled) setDeviceId(id);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return {
    deviceId,
    deviceName: Constants.deviceName ?? `${Platform.OS} device`,
  };
}
