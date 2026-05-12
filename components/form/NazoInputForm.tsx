import { View, Text, TextInput, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { fonts } from '@/lib/fonts';
import { IcFace, IcLock } from '@/components/icons';

export type NazoInputVariant = 'default' | 'failure' | 'success';

type Props = {
  value?: string;
  onChangeText?: (text: string) => void;
  onSubmit?: () => void;
  variant?: NazoInputVariant;
  style?: ViewStyle;
};

export default function NazoInputForm({
  value,
  onChangeText,
  onSubmit,
  variant = 'default',
  style,
}: Props) {
  if (variant === 'success') {
    return (
      <LinearGradient
        colors={['#654cab', '#ea6025']}
        start={{ x: 0, y: 1 }}
        end={{ x: 1, y: 0 }}
        style={[styles.successContainer, style]}
      >
        <IcLock variant="gray" size={32} />
        <Text style={styles.successText}>謎を解きあかした！</Text>
      </LinearGradient>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          autoCapitalize="none"
        />
        <TouchableOpacity style={styles.submitButton} onPress={onSubmit}>
          <Text style={styles.submitLabel}>送信</Text>
        </TouchableOpacity>
      </View>
      {variant === 'failure' && (
        <View style={styles.errorBox}>
          <IcFace size={24} />
          <Text style={styles.errorText}>残念！ もう一回トライしてみるのじゃ</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderColor: '#222',
    borderRadius: 6,
    paddingHorizontal: 16,
    fontFamily: fonts.regular,
    fontSize: 16,
    color: '#222',
  },
  submitButton: {
    height: 44,
    paddingHorizontal: 24,
    backgroundColor: '#222',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitLabel: {
    fontFamily: fonts.medium,
    fontSize: 16,
    color: '#fff',
    lineHeight: 24,
    letterSpacing: -0.3,
  },
  errorBox: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: '#fffad8',
    borderRadius: 6,
  },
  errorText: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: '#222',
  },
  successContainer: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 6,
  },
  successText: {
    fontFamily: fonts.jpRegular,
    fontSize: 14,
    color: '#fff',
  },
});
