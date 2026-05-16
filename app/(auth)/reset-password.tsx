import { fonts } from '@/lib/fonts';
import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import LogoSvg from '@/components/LogoSvg';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  async function handleUpdate() {
    setError('');
    if (!password || !confirm) {
      setError('パスワードを入力してください');
      return;
    }
    if (password !== confirm) {
      setError('パスワードが一致しません');
      return;
    }
    if (password.length < 8) {
      setError('パスワードは8文字以上で入力してください');
      return;
    }
    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'エラーが発生しました');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.inner}>
        <View style={styles.titleBlock}>
          <Text style={styles.brandTitle}>Piercing Cyclone</Text>
          <Text style={styles.brandSubtitle}>OFFICIAL APP</Text>
        </View>

        <LogoSvg size={120} />

        <View style={styles.formGroup}>
          <Text style={styles.heading}>パスワードの再設定</Text>

          {done ? (
            <>
              <Text style={styles.infoText}>パスワードを変更しました</Text>
              <View style={styles.buttonWrap}>
                <TouchableOpacity style={styles.submitButton} onPress={() => router.replace('/(auth)/login')}>
                  <Text style={styles.submitButtonText}>ログイン画面へ</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>新しいパスワード</Text>
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoFocus
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>新しいパスワード（確認）</Text>
                <TextInput
                  style={styles.input}
                  value={confirm}
                  onChangeText={setConfirm}
                  secureTextEntry
                />
              </View>

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <View style={styles.buttonWrap}>
                <TouchableOpacity style={styles.submitButton} onPress={handleUpdate} disabled={loading}>
                  {loading
                    ? <ActivityIndicator color="#fff" />
                    : <Text style={styles.submitButtonText}>パスワードを変更する</Text>
                  }
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fdfdfd',
  },
  inner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 46,
    gap: 32,
  },
  titleBlock: {
    alignItems: 'center',
    gap: 12,
    width: '100%',
  },
  brandTitle: {
    ...fonts.regular,
    fontSize: 36,
    fontWeight: '400',
    color: '#231815',
    letterSpacing: 0.8,
    textAlign: 'center',
    lineHeight: 36,
  },
  brandSubtitle: {
    ...fonts.regular,
    fontSize: 16,
    fontWeight: '300',
    color: '#231815',
    letterSpacing: 0.8,
    textAlign: 'center',
  },
  formGroup: {
    width: '100%',
    gap: 16,
  },
  heading: {
    ...fonts.jpBold,
    fontSize: 16,
    color: '#222',
    textAlign: 'center',
  },
  field: {
    gap: 6,
  },
  fieldLabel: {
    ...fonts.regular,
    fontSize: 11,
    color: '#222',
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: '#222',
    borderRadius: 6,
    paddingHorizontal: 12,
    backgroundColor: 'transparent',
    color: '#222',
    fontSize: 14,
  },
  buttonWrap: {
    paddingTop: 16,
  },
  submitButton: {
    backgroundColor: '#222',
    borderRadius: 60,
    paddingVertical: 12,
    alignItems: 'center',
    width: '100%',
  },
  submitButtonText: {
    ...fonts.jpBold,
    fontSize: 16,
    color: '#fff',
    lineHeight: 24,
  },
  errorText: {
    ...fonts.jpRegular,
    fontSize: 13,
    color: '#c0392b',
    textAlign: 'center',
  },
  infoText: {
    ...fonts.jpRegular,
    fontSize: 13,
    color: '#27ae60',
    textAlign: 'center',
  },
});
