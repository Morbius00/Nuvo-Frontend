import { useState } from 'react';
import { View, Image, ImageStyle, ViewStyle, StyleProp } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { getCategory } from '@/constants/categories';
import { BRAND_ICONS } from '@/constants/brandIcons';

/** Merchants without a bundled vector mark fall back to a favicon fetched by domain.
 * Matched by substring, so display names like "Spotify Premium" or "Cult.fit ELITE"
 * still resolve to their base company. */
const MERCHANT_DOMAINS: Record<string, string> = {
  // Food & Dining
  "domino's pizza": 'dominos.com',
  dominos: 'dominos.com',
  "domino's": 'dominos.com',
  blinkit: 'blinkit.com',
  zepto: 'zeptonow.com',
  'pizza hut': 'pizzahut.com',
  'third wave coffee': 'thirdwavecoffee.in',
  // Transportation
  ola: 'olacabs.com',
  rapido: 'rapido.bike',
  irctc: 'irctc.co.in',
  bpcl: 'bharatpetroleum.com',
  // Shopping
  amazon: 'amazon.in',
  'amazon.in': 'amazon.in',
  flipkart: 'flipkart.com',
  myntra: 'myntra.com',
  nykaa: 'nykaa.com',
  ajio: 'ajio.com',
  meesho: 'meesho.com',
  // Entertainment
  'prime video': 'primevideo.com',
  hotstar: 'hotstar.com',
  'disney+ hotstar': 'hotstar.com',
  // Health & Wellness
  medplus: 'medplus.in',
  'apollo pharmacy': 'apollopharmacy.in',
  '1mg': '1mg.com',
  practo: 'practo.com',
  'cult.fit': 'cult.fit',
  cultfit: 'cult.fit',
  // Finance
  groww: 'groww.in',
  lic: 'licindia.in',
  'sbi life': 'sbilife.co.in',
  'hdfc mutual fund': 'hdfcfund.com',
  // Utilities
  bsnl: 'bsnl.co.in',
  bescom: 'bescom.co.in',
  'indane gas': 'indane.co.in',
  indane: 'indane.co.in',
};

/** Longest-key match wins so "Cult.fit ELITE" resolves to 'cult.fit' rather than a shorter false positive. */
function findBestKey<T>(map: Record<string, T>, name: string): string | null {
  const exact = Object.prototype.hasOwnProperty.call(map, name) ? name : null;
  if (exact) return exact;

  let bestKey: string | null = null;
  for (const key of Object.keys(map)) {
    if (name.includes(key) && (!bestKey || key.length > bestKey.length)) {
      bestKey = key;
    }
  }
  return bestKey;
}

/** Google's favicon service — reliable, no API key, always returns a real PNG (unlike the
 * now-defunct logo.clearbit.com, which no longer resolves). */
function faviconUrl(domain: string): string {
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
}

interface MerchantIconProps {
  merchant?: string;
  category: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
}

export function MerchantIcon({ merchant, category, size = 36, style }: MerchantIconProps) {
  const [logoFailed, setLogoFailed] = useState(false);
  const cat = getCategory(category);
  const radius = size * 0.28;
  const name = merchant?.toLowerCase().trim() ?? '';

  // Tier 1 — bundled vector brand mark, crisp and works fully offline.
  const brandKey = name ? findBestKey(BRAND_ICONS, name) : null;
  if (brandKey) {
    const brand = BRAND_ICONS[brandKey];
    return (
      <View
        style={[
          {
            width: size,
            height: size,
            borderRadius: radius,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: `${brand.hex}22`,
          },
          style,
        ]}
      >
        <Svg width={size * 0.56} height={size * 0.56} viewBox="0 0 24 24">
          <Path d={brand.path} fill={brand.hex} />
        </Svg>
      </View>
    );
  }

  // Tier 2 — favicon fetched by domain, for merchants without a bundled mark.
  const domainKey = name ? findBestKey(MERCHANT_DOMAINS, name) : null;
  if (domainKey && !logoFailed) {
    return (
      <Image
        source={{ uri: faviconUrl(MERCHANT_DOMAINS[domainKey]) }}
        style={[{ width: size, height: size, borderRadius: radius }, style as StyleProp<ImageStyle>]}
        onError={() => setLogoFailed(true)}
      />
    );
  }

  // Tier 3 — generic category icon.
  const Icon = cat.icon;
  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: radius,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: `${cat.color}22`,
        },
        style,
      ]}
    >
      <Icon size={size * 0.46} color={cat.color} strokeWidth={2} />
    </View>
  );
}
