import { View, Text, Pressable } from 'react-native';
import Animated from 'react-native-reanimated';
import { colors, fontFamily, radii, liquidGlass, shadow } from '@/theme/tokens';
import { CATEGORIES, CategoryDef } from '@/constants/categories';
import { LiquidGlassSurface } from '@/components/ui/LiquidGlassSurface';
import { usePressScale } from '@/hooks/usePressScale';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface CategoryPickerGridProps {
  value: string;
  onChange: (key: string) => void;
  categories?: CategoryDef[];
}

function CategoryPill({ cat, selected, onPress }: { cat: CategoryDef; selected: boolean; onPress: () => void }) {
  const press = usePressScale({ scaleTo: 0.95 });
  const Icon = cat.icon;

  return (
    <AnimatedPressable
      onPress={() => press.onPress(onPress)}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      style={press.style}
    >
      <View
        style={{
          borderRadius: radii.pill + 2,
          borderWidth: selected ? 1.5 : 0,
          borderColor: selected ? cat.color : 'transparent',
          ...(selected ? shadow.glow(cat.color) : null),
        }}
      >
        <LiquidGlassSurface
          radius={radii.pill}
          borderWidth={1.3}
          intensity={liquidGlass.blurButton}
          contentStyle={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            paddingVertical: 7,
            paddingHorizontal: 12,
          }}
        >
          {/* Icon's own glass badge — gradient border + blur fill, same recipe as the Notification/Settings buttons */}
          <LiquidGlassSurface
            radius={17}
            borderWidth={1.1}
            intensity={liquidGlass.blurButton}
            contentStyle={{ width: 34, height: 34, alignItems: 'center', justifyContent: 'center' }}
          >
            <Icon size={21} color={cat.color} strokeWidth={2} />
          </LiquidGlassSurface>
          <Text
            numberOfLines={1}
            style={{
              color: selected ? colors.ink : colors.inkSecondary,
              fontFamily: selected ? fontFamily.bold : fontFamily.semibold,
              fontSize: 12.5,
            }}
          >
            {cat.label}
          </Text>
        </LiquidGlassSurface>
      </View>
    </AnimatedPressable>
  );
}

/**
 * Single-select flow of glass-morph category pills — used by AddTransaction and the
 * category-reassignment sheet on TransactionDetail. Local to the transactions
 * feature (not shared/ui) per the task's file-ownership constraints.
 */
export function CategoryPickerGrid({ value, onChange, categories = CATEGORIES }: CategoryPickerGridProps) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
      {categories.map((cat) => (
        <CategoryPill key={cat.key} cat={cat} selected={value === cat.key} onPress={() => onChange(cat.key)} />
      ))}
    </View>
  );
}
