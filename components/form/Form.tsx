import { View, Text, TextInput, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { fonts } from '@/lib/fonts';
import { IcHelp } from '@/components/icons';

export type FormVariant = 'regular' | 'password' | 'error';

type Props = {
  label: string;
  value?: string;
  onChangeText?: (text: string) => void;
  placeholder?: string;
  variant?: FormVariant;
  errorMessage?: string;
  onForgotPassword?: () => void;
  style?: ViewStyle;
};

export default function Form({
  label,
  value,
  onChangeText,
  placeholder,
  variant = 'regular',
  errorMessage,
  onForgotPassword,
  style,
}: Props) {
  const isPassword = variant === 'password';
  const isError = variant === 'error';

  return (
    <View style={[styles.container, style]}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        {isPassword && (
          <TouchableOpacity style={styles.forgotRow} onPress={onForgotPassword}>
            <IcHelp size={14} />
            <Text style={styles.label}>お忘れの方</Text>
          </TouchableOpacity>
        )}
      </View>
      <TextInput
        style={[styles.input, isError && styles.inputError]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        secureTextEntry={isPassword}
        autoCapitalize="none"
      />
      {isError && errorMessage && (
        <Text style={styles.errorText}>{errorMessage}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  forgotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  label: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: '#222',
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: '#222',
    borderRadius: 6,
    paddingHorizontal: 12,
    fontFamily: fonts.regular,
    fontSize: 16,
    color: '#222',
  },
  inputError: {
    borderColor: '#ee1133',
  },
  errorText: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: '#ee1133',
  },
});
