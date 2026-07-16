import { useMemo } from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { colors, fontFamily, radii } from '@/theme/tokens';
import { formatCurrency } from '@/utils/format';

export interface HeatMapDay {
  date: string;
  amount: number;
}

interface HeatMapCalendarProps {
  days: HeatMapDay[];
  onDayPress?: (date: string) => void;
  cellSize?: number;
}

const WEEKDAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function toKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

function intensityStyle(amount: number, max: number) {
  if (amount <= 0 || max <= 0) return colors.glassFillStrong;
  const ratio = amount / max;
  if (ratio > 0.75) return `${colors.primary500}FF`;
  if (ratio > 0.5) return `${colors.primary500}CC`;
  if (ratio > 0.25) return `${colors.primary500}88`;
  return `${colors.primary500}44`;
}

/** Calendar-grid heatmap — one cell per day, intensity scaled to spend amount. */
export function HeatMapCalendar({ days, onDayPress, cellSize = 34 }: HeatMapCalendarProps) {
  const { weeks, max } = useMemo(() => {
    if (days.length === 0) return { weeks: [] as HeatMapDay[][], max: 0 };
    const byDate = new Map(days.map((d) => [d.date.slice(0, 10), d.amount]));
    const dates = days.map((d) => new Date(d.date));
    const minDate = new Date(Math.min(...dates.map((d) => d.getTime())));
    const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())));

    const start = new Date(minDate);
    start.setDate(start.getDate() - start.getDay());
    const end = new Date(maxDate);
    end.setDate(end.getDate() + (6 - end.getDay()));

    const allDays: HeatMapDay[] = [];
    const cursor = new Date(start);
    while (cursor <= end) {
      const key = toKey(cursor);
      allDays.push({ date: key, amount: byDate.get(key) ?? 0 });
      cursor.setDate(cursor.getDate() + 1);
    }

    const weeksArr: HeatMapDay[][] = [];
    for (let i = 0; i < allDays.length; i += 7) weeksArr.push(allDays.slice(i, i + 7));

    const maxAmount = Math.max(...days.map((d) => d.amount), 0);
    return { weeks: weeksArr, max: maxAmount };
  }, [days]);

  const gap = 6;
  const gridWidth = cellSize * 7 + gap * 6;

  if (weeks.length === 0) return null;

  return (
    <View style={{ alignItems: 'center' }}>
      <View style={{ flexDirection: 'row', width: gridWidth, justifyContent: 'space-between', marginBottom: 8 }}>
        {WEEKDAY_LABELS.map((label, i) => (
          <Text
            key={`${label}-${i}`}
            style={{ width: cellSize, textAlign: 'center', color: colors.inkMuted, fontFamily: fontFamily.semibold, fontSize: 10.5 }}
          >
            {label}
          </Text>
        ))}
      </View>
      <View style={{ gap }}>
        {weeks.map((week, wi) => (
          <View key={wi} style={{ flexDirection: 'row', gap, justifyContent: 'space-between' }}>
            {week.map((day, di) => {
              const dayNum = new Date(day.date).getDate();
              return (
                <Animated.View key={day.date} entering={FadeIn.delay(wi * 60 + di * 12).duration(350)}>
                  <Pressable onPress={() => onDayPress?.(day.date)} disabled={!onDayPress}>
                    <View
                      style={{
                        width: cellSize,
                        height: cellSize,
                        borderRadius: radii.sm - 2,
                        backgroundColor: intensityStyle(day.amount, max),
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text style={{ color: colors.ink, fontFamily: fontFamily.medium, fontSize: 10.5, opacity: 0.85 }}>{dayNum}</Text>
                    </View>
                  </Pressable>
                </Animated.View>
              );
            })}
          </View>
        ))}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14 }}>
        <Text style={{ color: colors.inkMuted, fontFamily: fontFamily.medium, fontSize: 10.5 }}>Less</Text>
        {['44', '88', 'CC', 'FF'].map((alpha) => (
          <View key={alpha} style={{ width: 14, height: 14, borderRadius: 4, backgroundColor: `${colors.primary500}${alpha}` }} />
        ))}
        <Text style={{ color: colors.inkMuted, fontFamily: fontFamily.medium, fontSize: 10.5 }}>More</Text>
      </View>
      {max > 0 && (
        <Text style={{ color: colors.inkMuted, fontFamily: fontFamily.medium, fontSize: 11, marginTop: 8 }}>
          Peak day: {formatCurrency(max)}
        </Text>
      )}
    </View>
  );
}
