import { View, Text, Pressable } from 'react-native';
import { colors, fontFamily, radii } from '@/theme/tokens';
import { CATEGORIES, CategoryDef } from '@/constants/categories';

interface CategoryPickerGridProps {
  value: string;
  onChange: (key: string) => void;
  categories?: CategoryDef[];
  columns?: number;
}

/**
 * Single-select grid of category icon cards — used by AddTransaction and the
 * category-reassignment sheet on TransactionDetail. Local to the transactions
 * feature (not shared/ui) per the task's file-ownership constraints.
 */
export function CategoryPickerGrid({ value, onChange, categories = CATEGORIES, columns = 3 }: CategoryPickerGridProps) {
  const widthPct = `${100 / columns - 3}%` as const;

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
      {categories.map((cat) => {
        const Icon = cat.icon;
        const selected = value === cat.key;
        return (
          <Pressable
            key={cat.key}
            onPress={() => onChange(cat.key)}
            style={({ pressed }) => ({
              width: widthPct,
              aspectRatio: 1,
              borderRadius: radii.lg,
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              paddingHorizontal: 4,
              backgroundColor: selected ? `${cat.color}22` : colors.glassFillStrong,
              borderWidth: 1.5,
              borderColor: selected ? cat.color : colors.glassBorder,
              opacity: pressed ? 0.8 : 1,
            })}
          >
            <Icon size={22} color={selected ? cat.color : colors.inkSecondary} strokeWidth={2} />
            <Text
              numberOfLines={2}
              style={{
                color: selected ? colors.ink : colors.inkSecondary,
                fontFamily: fontFamily.semibold,
                fontSize: 10.5,
                textAlign: 'center',
              }}
            >
              {cat.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
