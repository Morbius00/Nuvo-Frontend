import { ReactNode, useEffect, useRef, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
} from '@expo-google-fonts/manrope';
import { store, persistor } from '@/store';
import { AppSplash } from '@/components/ui/AppSplash';
import { ToastHost } from '@/components/ui/ToastHost';

SplashScreen.preventAutoHideAsync().catch(() => {});

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  const [fontsLoaded] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });
  const [persistReady, setPersistReady] = useState(false);
  const [showAppSplash, setShowAppSplash] = useState(true);
  const nativeSplashHidden = useRef(false);

  const appReady = fontsLoaded && persistReady;

  useEffect(() => {
    if (appReady && !nativeSplashHidden.current) {
      nativeSplashHidden.current = true;
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [appReady]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <Provider store={store}>
          <PersistGate loading={null} persistor={persistor} onBeforeLift={() => setPersistReady(true)}>
            <BottomSheetModalProvider>{children}</BottomSheetModalProvider>
            <ToastHost />
          </PersistGate>
        </Provider>
      </SafeAreaProvider>
      {showAppSplash && <AppSplash ready={appReady} onFinish={() => setShowAppSplash(false)} />}
    </GestureHandlerRootView>
  );
}
