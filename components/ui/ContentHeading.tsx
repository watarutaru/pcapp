import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { fonts } from '@/lib/fonts';

type Props = {
  label: string;
  icon?: React.ReactNode;
  style?: ViewStyle;
};

export default function ContentHeading({ label, icon, style }: Props) {
  return (
    <View style={[styles.container, style]}>
      {icon && <View style={styles.icon}>{icon}</View>}
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  icon: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    ...fonts.condensed,
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: 1,
    color: '#222',
  },
});
