import { useNavigation } from '@react-navigation/native';

/**
 * React Navigation's typed `navigate` becomes unusably strict once a call
 * crosses from a nested stack into a sibling tab or the root modal stack.
 * Screens navigate across those boundaries constantly (e.g. Home -> Settings,
 * any screen -> ScanReceipt), so this hook centralises the one, deliberate
 * escape hatch instead of repeating a cast in every screen.
 */
export function useCrossNavigation() {
  const navigation = useNavigation() as unknown as { getParent: () => any; navigate: (...args: any[]) => void };

  return {
    /** Navigate to a root-level screen (modals, Settings, Notifications, etc). */
    toRoot: (name: string, params?: object) => navigation.getParent()?.getParent()?.navigate(name, params),
    /** Navigate to a screen inside a sibling tab's stack. */
    toTab: (tab: string, screen?: string, params?: object) =>
      navigation.getParent()?.navigate(tab, screen ? { screen, params } : undefined),
  };
}
