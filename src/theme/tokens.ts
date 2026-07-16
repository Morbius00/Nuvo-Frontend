/**
 * Single source of truth for raw values that can't be expressed as NativeWind
 * classNames (SVG props, LinearGradient stops, Reanimated interpolation, shadow
 * objects). Keep in sync with tailwind.config.js colors.
 */

export const colors = {
  bg: '#030811',
  bgRaised: '#1A1D26',
  surface: '#20242E',
  surface2: '#262B36',

  hairline: 'rgba(255,255,255,0.08)',
  glassBorder: 'rgba(255,255,255,0.12)',
  glassFill: 'rgba(255,255,255,0.04)',
  glassFillStrong: 'rgba(255,255,255,0.07)',

  primary50: '#E9FFEF',
  primary100: '#CBFFDA',
  primary200: '#9CFFBC',
  primary300: '#7CFF9E',
  primary400: '#4FF08A',
  primary500: '#6CCB00',
  primary600: '#0B964E',
  primary700: '#0FAE5C',
  primary800: '#0B8A48',
  primary900: '#026A2A',

  lime400: '#C6FF6B',
  lime500: '#A0FF18',
  lime600: '#A0E23F',

  cyan400: '#22EED3',
  cyan500: '#00A692',

  sapGreen600: '#3E6B21',
  sapGreen700: '#2E5119',
  sapGreen800: '#1F3312',

  danger400: '#FF8080',
  danger500: '#FF5C5C',
  danger600: '#E23F3F',

  tierGreen: '#22E37A',
  tierYellow: '#FFAE00',
  tierOrange: '#FF9900',
  tierRed: '#FF4D4D',
  tierHard: '#E11D48',

  ink: '#F5F7F7',
  inkSecondary: 'rgba(245,247,247,0.64)',
  inkMuted: 'rgba(245,247,247,0.40)',
  inkOnPrimary: '#04140B',
} as const;

/** Balance / CTA gradient — the lime-to-emerald diagonal seen on hero cards & primary buttons. */
export const primaryGradient = [colors.lime400, colors.primary500, colors.primary900] as const;
export const glassHighlightGradient = ['rgba(255,255,255,0.14)', 'rgba(255,255,255,0.02)'] as const;
export const bgAuroraGreen = ['rgba(34,227,122,0.95)', 'rgba(34,227,122,0.22)', 'rgba(34,227,122,0)'] as const;
export const bgAuroraLime = ['rgba(182,255,77,0.4)', 'rgba(182,255,77,0.16)', 'rgba(182,255,77,0)'] as const;
export const bgAuroraCyan = ['rgba(34,211,238,0.4)', 'rgba(34,211,238,0.15)', 'rgba(34,211,238,0)'] as const;
export const bgAuroraLocations = [0, 0.4, 1] as const;

/** Lime → cyan → deep sap green sweep used on the Financial Health Score screen. */
export const healthGradient = [colors.lime400, colors.cyan400, colors.sapGreen600] as const;

/**
 * Glassmorphism — pure frosted glass:
 * BlurView + white-tinted fill + hairline border. Nothing else.
 */
export const liquidGlass = {
  blurCard: 22,
  blurButton: 18,
  blurSheet: 22,
} as const;

export const radii = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 24,
  xxl: 28,
  pill: 999,
};

export const spacing = (n: number) => n * 4;

/** Stop-loss tier thresholds & colors, spec §7.2.2. */
export const stopLossTiers = [
  { key: 'green', label: 'On Track', min: 0, max: 50, color: colors.tierGreen },
  { key: 'yellow', label: 'Watch', min: 50, max: 75, color: colors.tierYellow },
  { key: 'orange', label: 'Caution', min: 75, max: 90, color: colors.tierOrange },
  { key: 'red', label: 'Critical', min: 90, max: 100, color: colors.tierRed },
  { key: 'hard', label: 'Limit Reached', min: 100, max: Infinity, color: colors.tierHard },
] as const;

export type StopLossTierKey = (typeof stopLossTiers)[number]['key'];

export function tierForUtilisation(pct: number) {
  return stopLossTiers.find((t) => pct >= t.min && pct < t.max) ?? stopLossTiers[stopLossTiers.length - 1];
}

/** Elevation presets — RN shadow (iOS) + elevation (Android) can't be Tailwind classes reliably. */
export const shadow = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 8,
  },
  /** Liquid glass card — dark depth + lime green ambient glow */
  glassCard: {
    shadowColor: '#4FF08A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 22,
    elevation: 10,
  },
  /** Liquid glass button — tighter lime glow */
  glassButton: {
    shadowColor: '#4FF08A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 6,
  },
  glow: (color: string) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 10,
  }),
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
};

export const fontFamily = {
  regular: 'Manrope_400Regular',
  medium: 'Manrope_500Medium',
  semibold: 'Manrope_600SemiBold',
  bold: 'Manrope_700Bold',
  extrabold: 'Manrope_800ExtraBold',
};
