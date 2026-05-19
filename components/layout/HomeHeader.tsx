import { View, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import IcAccount from '@/components/icons/IcAccount';

type Props = {
  onAccountPress?: () => void;
  style?: ViewStyle;
};

export default function HomeHeader({ onAccountPress, style }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.container, { paddingTop: insets.top + 10 }, style]}>
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
