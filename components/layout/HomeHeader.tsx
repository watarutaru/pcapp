import { View, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import IcAccount from '@/components/icons/IcAccount';

type Props = {
  onAccountPress?: () => void;
  style?: ViewStyle;
};

export default function HomeHeader({ onAccountPress, style }: Props) {
  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity onPress={onAccountPress} hitSlop={8}>
        <IcAccount size={32} color="#222" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    minHeight: 64,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    backgroundColor: 'transparent',
  },
});
