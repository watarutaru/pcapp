import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { fonts } from '@/lib/fonts';

type Props = {
  stage: string;
  points: number;
  style?: ViewStyle;
};

export default function StatusBlock({ stage, points, style }: Props) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.row}>
        <Text style={styles.label}>STAGE</Text>
        <Text style={styles.valueBody}>{stage}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>POINTS</Text>
        <View style={styles.pointsRow}>
          <Text style={styles.pointsNumber}>{points}</Text>
          <Text style={styles.pointsUnit}> pt</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#efefef',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    width: 167,
    minHeight: 80,
    gap: 6,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    ...fonts.condensed,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 1,
    color: '#222',
    opacity: 0.5,
  },
  valueBody: {
    ...fonts.medium,
    fontSize: 16,
    color: '#222',
  },
  pointsRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  pointsNumber: {
    ...fonts.heavy,
    fontSize: 18,
    letterSpacing: 0.36,
    color: '#222',
  },
  pointsUnit: {
    ...fonts.medium,
    fontSize: 15,
    color: '#222',
  },
});
