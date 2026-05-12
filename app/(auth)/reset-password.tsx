import { fonts } from '@/lib/fonts';
import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import LogoSvg from '@/components/LogoSvg';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleUpdate() {
    if (!password || !confirm) {
      Alert.alert('エラー', 'パスワードを入力してください');
      return;
    }
    if (password !== confirm) {
      Alert.alert('エラー', 'パスワードが一致しません');
      return;
    }
    if (password.length < 8) {
      Alert.alert('エラー', 'パスワードは8文字以上で入力してください');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      Alert.alert('完了', 'パスワードを変更しました', [
        { text: 'OK', onPress: () => router.replace('/(auth)/login') },
      ]);
    } catch (e) {
      Alert.alert('エラー', e instanceof Error ? e.message : 'エラーが発生しました');
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

          <View style={styles.buttonWrap}>
            <TouchableOpacity style={styles.submitButton} onPress={handleUpdate} disabled={loading}>
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.submitButtonText}>パスワードを変更する</Text>
              }
            </TouchableOpacity>
          </View>
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
    fontFamily: fonts.regular,
    fontSize: 36,
    fontWeight: '400',
    color: '#231815',
    letterSpacing: 0.8,
    textAlign: 'center',
    lineHeight: 36,
  },
  brandSubtitle: {
    fontFamily: fonts.regular,
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
    fontFamily: fonts.jpBold,
    fontSize: 16,
    color: '#222',
    textAlign: 'center',
  },
  field: {
    gap: 6,
  },
  fieldLabel: {
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
    fontFamily: fonts.jpBold,
    fontSize: 16,
    color: '#fff',
    lineHeight: 24,
  },
});
