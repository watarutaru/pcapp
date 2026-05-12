import { View, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { IcArrow } from '@/components/icons';

type Props = {
  onPrev?: () => void;
  onNext?: () => void;
  style?: ViewStyle;
};

export default function ModalBottomNav({ onPrev, onNext, style }: Props) {
  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity style={styles.button} onPress={onPrev}>
        <IcArrow direction="left" size={16} />
      </TouchableOpacity>
      <View style={styles.spacer} />
      <TouchableOpacity style={styles.button} onPress={onNext}>
        <IcArrow direction="right" size={16} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 64,
    paddingHorizontal: 24,
    backgroundColor: '#fff',
  },
  button: {
    width: 36,
    height: 36,
    borderRadius: 36,
    backgroundColor: '#efefef',
    alignItems: 'center',
    justifyContent: 'center',
  },
  spacer: {
    flex: 1,
  },
});
