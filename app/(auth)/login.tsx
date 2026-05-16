import { fonts } from '@/lib/fonts';
import { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { Link } from 'expo-router';
import { signInWithPassword, resetPassword } from '@/lib/auth';
import LogoSvg from '@/components/LogoSvg';
import Button from '@/components/ui/Button';
import Form from '@/components/form/Form';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  async function handleLogin() {
    setError('');
    setInfo('');
    if (!email || !password) {
      setError('メールアドレスとパスワードを入力してください');
      return;
    }
    setLoading(true);
    try {
      await signInWithPassword(email, password);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'ログインに失敗しました');
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword() {
    setError('');
    setInfo('');
    if (!email) {
      setError('メールアドレスを入力してください');
      return;
    }
    setLoading(true);
    try {
      await resetPassword(email);
      setInfo(`${email} にパスワード再設定メールを送りました`);
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
      <ScrollView
        contentContainerStyle={styles.inner}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* タイトル */}
        <View style={styles.titleBlock}>
          <Text style={styles.brandTitle}>Piercing Cyclone</Text>
          <Text style={styles.brandSubtitle}>OFFICIAL APP</Text>
        </View>

        {/* ロゴ */}
        <LogoSvg size={174} />

        {/* フォーム */}
        <View style={styles.formGroup}>
          <Form
            label="メールアドレス"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            variant={error && !password ? 'error' : 'regular'}
          />

          <Form
            label="パスワード"
            value={password}
            onChangeText={setPassword}
            variant={error ? 'error' : 'password'}
            onForgotPassword={handleResetPassword}
          />

          {/* エラー・情報メッセージ */}
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          {info ? <Text style={styles.infoText}>{info}</Text> : null}

          {/* ログインボタン */}
          <View style={styles.buttonWrap}>
            <Button label="ログイン" onPress={handleLogin} loading={loading} />
          </View>

          {/* 会員登録 */}
          <Link href="/(auth)/signup" asChild>
            <TouchableOpacity style={styles.signupWrap}>
              <Text style={styles.signupText}>会員登録はこちら</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fdfdfd',
  },
  inner: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 46,
    paddingVertical: 48,
    gap: 36,
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
  buttonWrap: {
    paddingTop: 16,
  },
  signupWrap: {
    alignItems: 'center',
  },
  signupText: {
    ...fonts.jpRegular,
    fontSize: 14,
    color: '#898989',
    lineHeight: 14,
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
