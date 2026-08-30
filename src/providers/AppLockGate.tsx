import { ReactNode, useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus, View, Text } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { FingerprintGlyph } from '@/components/ui/icons/BrandGlyphs';
import { colors, fontFamily } from '@/theme/tokens';
import { useAppSelector } from '@/store/hooks';

interface AppLockGateProps {
  children: ReactNode;
  /** True once it's safe to show the lock screen — e.g. after the launch splash has finished,
   *  so the Face ID prompt doesn't pop up on top of the splash animation. */
  active: boolean;
}

/** Real Face ID / Touch ID app-lock, gated by Settings → Security → "Face ID / Touch ID".
 *  Locks on cold start and every foreground resume; a no-op entirely when the setting is off. */
export function AppLockGate({ children, active }: AppLockGateProps) {
  const biometricEnabled = useAppSelector((s) => s.auth.biometricEnabled);
  const [locked, setLocked] = useState(false);
  const [authenticating, setAuthenticating] = useState(false);
  const authenticatingRef = useRef(false);
  const armedRef = useRef(false);
  const appState = useRef(AppState.currentState);

  const tryUnlock = async () => {
    if (authenticatingRef.current) return;
    authenticatingRef.current = true;
    setAuthenticating(true);
    try {
      const result = await LocalAuthentication.authenticateAsync({ promptMessage: 'Unlock NUVO' });
      if (result.success) setLocked(false);
    } finally {
      authenticatingRef.current = false;
      setAuthenticating(false);
    }
  };

  useEffect(() => {
    if (!active || armedRef.current) return;
    armedRef.current = true;
    if (biometricEnabled) {
      setLocked(true);
      tryUnlock();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      const wasBackgrounded = appState.current.match(/inactive|background/);
      appState.current = next;
      if (wasBackgrounded && next === 'active' && active && biometricEnabled) {
        setLocked(true);
        tryUnlock();
      }
    });
    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, biometricEnabled]);

  return (
    <>
      {children}
      {locked && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: colors.bg,
            alignItems: 'center',
            justifyContent: 'center',
            gap: 20,
            zIndex: 1000,
            elevation: 1000,
          }}
        >
          <FingerprintGlyph size={56} color={colors.primary400} />
          <Text style={{ color: colors.ink, fontFamily: fontFamily.bold, fontSize: 18 }}>NUVO is locked</Text>
          <View style={{ width: 180 }}>
            <PrimaryButton label={authenticating ? 'Verifying…' : 'Unlock'} loading={authenticating} onPress={tryUnlock} />
          </View>
        </View>
      )}
    </>
  );
}
