import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { fonts } from '@/lib/fonts';
import IcQR from '@/components/icons/IcQR';

type Props = {
  onPress?: () => void;
  style?: ViewStyle;
};

export default function CheckinBlock({ onPress, style }: Props) {
  return (
    <TouchableOpacity style={[styles.container, style]} onPress={onPress} activeOpacity={0.8}>
      <IcQR size={36} color="#fff" />
      <Text style={styles.label}>チェックイン</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#222',
    borderRadius: 10,
    width: 167,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  label: {
    ...fonts.jpRegular,
    fontSize: 11,
    color: '#fff',
    letterSpacing: -0.44,
  },
});
