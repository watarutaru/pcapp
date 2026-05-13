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
      <TouchableOpacity
        style={[styles.button, !onPrev && styles.buttonDisabled]}
        onPress={onPrev}
        disabled={!onPrev}
        activeOpacity={0.7}
      >
        <IcArrow direction="left" size={16} />
      </TouchableOpacity>
      <View style={styles.spacer} />
      <TouchableOpacity
        style={[styles.button, !onNext && styles.buttonDisabled]}
        onPress={onNext}
        disabled={!onNext}
        activeOpacity={0.7}
      >
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
  buttonDisabled: {
    opacity: 0.3,
  },
  spacer: {
    flex: 1,
  },
});
