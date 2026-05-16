import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { fonts } from '@/lib/fonts';

export type TagVariant = 'strong' | 'primary' | 'secondary';

type Props = {
  label: string;
  variant?: TagVariant;
  style?: ViewStyle;
};

export default function Tag({ label, variant = 'primary', style }: Props) {
  if (variant === 'strong') {
    return (
      <LinearGradient
        colors={['#654cab', '#ea6025']}
        start={{ x: 0, y: 1 }}
        end={{ x: 1, y: 0 }}
        style={[styles.base, style]}
      >
        <Text style={[styles.label, styles.labelLight]}>{label}</Text>
      </LinearGradient>
    );
  }

  return (
    <View style={[styles.base, styles[variant], style]}>
      <Text
        style={[
          styles.label,
          variant === 'secondary' ? styles.labelSecondary : styles.labelLight,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    borderRadius: 2,
    alignSelf: 'flex-start',
  },
  primary: {
    backgroundColor: '#222',
  },
  secondary: {
    borderWidth: 1,
    borderColor: '#898989',
  },
  label: {
    ...fonts.condensedBold,
    fontSize: 10,
    lineHeight: 16,
    letterSpacing: 1,
  },
  labelLight: {
    color: '#fff',
  },
  labelSecondary: {
    color: '#898989',
  },
});
