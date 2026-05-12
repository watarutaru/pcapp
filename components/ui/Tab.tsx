import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { fonts } from '@/lib/fonts';

type Props = {
  label: string;
  active?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
};

export default function Tab({ label, active = false, onPress, style }: Props) {
  return (
    <TouchableOpacity
      style={[styles.base, active ? styles.active : styles.normal, style]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={[styles.label, active ? styles.labelLight : styles.labelDark]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 32,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  active: {
    backgroundColor: '#222',
  },
  normal: {
    borderWidth: 1,
    borderColor: '#898989',
  },
  label: {
    fontFamily: fonts.condensedMedium,
    fontSize: 16,
    lineHeight: 16,
    letterSpacing: 1,
  },
  labelLight: {
    color: '#fff',
  },
  labelDark: {
    color: '#222',
  },
});
