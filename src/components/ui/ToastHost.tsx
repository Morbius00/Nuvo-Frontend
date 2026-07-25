import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { dismissToast } from '@/store/slices/toastSlice';
import { Toast } from './Toast';

/** Mounted once at the app root — renders the front of the toast queue, if any. */
export function ToastHost() {
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const queue = useAppSelector((s) => s.toast.queue);
  const current = queue[0];

  if (!current) return null;

  return (
    <View
      pointerEvents="box-none"
      style={{ position: 'absolute', top: insets.top + 8, left: 16, right: 16, zIndex: 999 }}
    >
      <Toast toast={current} onDismiss={(id) => dispatch(dismissToast(id))} />
    </View>
  );
}
