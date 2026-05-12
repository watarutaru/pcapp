import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
} from 'react-native';
import { fonts } from '@/lib/fonts';

export type ButtonVariant = 'primary' | 'secondary' | 'white';

type Props = {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
};

export default function Button({
  label,
  onPress,
  variant = 'primary',
  loading,
  disabled,
  style,
}: Props) {
  const isLight = variant === 'secondary' || variant === 'white';
  return (
    <TouchableOpacity
      style={[styles.base, styles[variant], (disabled || loading) && styles.disabled, style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={isLight ? '#222' : '#fff'} />
      ) : (
        <Text style={[styles.label, isLight ? styles.labelDark : styles.labelLight]}>
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 44,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  primary: {
    backgroundColor: '#222',
  },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#898989',
  },
  white: {
    backgroundColor: '#fff',
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    fontFamily: fonts.jpBold,
    fontSize: 16,
    lineHeight: 16,
  },
  labelLight: {
    color: '#fff',
  },
  labelDark: {
    color: '#222',
  },
});
