import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { fonts } from '@/lib/fonts';

type Props = {
  label: string;
  onPress?: () => void;
  style?: ViewStyle;
};

export default function ButtonText({ label, onPress, style }: Props) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={style}>
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  label: {
    ...fonts.jpRegular,
    fontSize: 14,
    color: '#898989',
    lineHeight: 16,
  },
});
