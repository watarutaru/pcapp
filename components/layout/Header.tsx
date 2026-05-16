import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { fonts } from '@/lib/fonts';
import IcArrowLeft from '@/components/icons/IcArrowLeft';
import IcClose from '@/components/icons/IcClose';

type Props = {
  title: string;
  variant?: 'regular' | 'white';
  showBack?: boolean;
  showClose?: boolean;
  onBack?: () => void;
  onClose?: () => void;
  style?: ViewStyle;
};

export default function Header({
  title,
  variant = 'regular',
  showBack = true,
  showClose = false,
  onBack,
  onClose,
  style,
}: Props) {
  const isWhite = variant === 'white';
  const iconColor = isWhite ? '#fff' : '#222';
  const textColor = isWhite ? '#fff' : '#222';

  return (
    <View style={[styles.container, style]}>
      <View style={styles.inner}>
        {showBack && (
          <TouchableOpacity style={styles.iconLeft} onPress={onBack} hitSlop={8}>
            <IcArrowLeft size={32} color={iconColor} />
          </TouchableOpacity>
        )}
        <Text style={[styles.title, { color: textColor }]}>{title}</Text>
        {showClose && (
          <TouchableOpacity style={styles.iconRight} onPress={onClose} hitSlop={8}>
            <IcClose size={32} color={iconColor} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    width: '100%',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 32,
  },
  title: {
    flex: 1,
    ...fonts.condensed,
    fontSize: 24,
    lineHeight: 32,
    letterSpacing: 1,
    textAlign: 'center',
  },
  iconLeft: {
    position: 'absolute',
    left: 0,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconRight: {
    position: 'absolute',
    right: 0,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
