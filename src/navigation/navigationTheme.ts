import { DarkTheme, Theme } from '@react-navigation/native';
import { colors } from '@/theme/tokens';

export const nuvoNavigationTheme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: colors.primary500,
    background: colors.bg,
    card: colors.bgRaised,
    text: colors.ink,
    border: colors.hairline,
    notification: colors.danger500,
  },
};
