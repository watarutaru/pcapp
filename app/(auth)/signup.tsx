import { fonts } from '@/lib/fonts';
import { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { Link } from 'expo-router';
import { signUpWithPassword } from '@/lib/auth';
import LogoSvg from '@/components/LogoSvg';
import Button from '@/components/ui/Button';
import Form from '@/components/form/Form';

export default function SignupScreen() {
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function handleSignup() {
    setError('');
    if (!nickname || !email || !password) {
      setError('すべての項目を入力してください');
      return;
    }
    if (password.length < 6) {
      setError('パスワードは6文字以上で入力してください');
      return;
    }
    setLoading(true);
    try {
      await signUpWithPassword(email, password, nickname);
      setSent(true);
    } catch (e) {
      const msg = e instanceof Error ? e.message : '';
      setError(msg || '登録に失敗しました。時間をおいて再度お試しください。');
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <View style={styles.sentContainer}>
        <View style={styles.titleBlock}>
          <Text style={styles.brandTitle}>Piercing Cyclone</Text>
          <Text style={styles.brandSubtitle}>OFFICIAL APP</Text>
        </View>
        <LogoSvg size={120} />
        <View style={styles.sentContent}>
          <Text style={styles.sentHeading}>確認メールを送信しました</Text>
          <Text style={styles.sentDescription}>
            {email} に確認メールを送信しました。{'\n'}
            メール内のリンクをタップして登録を完了してください。
          </Text>
        </View>
      </View>
    );
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
        <View style={styles.titleBlock}>
          <Text style={styles.brandTitle}>Piercing Cyclone</Text>
          <Text style={styles.brandSubtitle}>OFFICIAL APP</Text>
        </View>

        <LogoSvg size={174} />

        <View style={styles.formGroup}>
          <Text style={styles.heading}>会員登録</Text>

          <Form
            label="ニックネーム"
            value={nickname}
            onChangeText={setNickname}
            variant={error && !nickname ? 'error' : 'regular'}
          />

          <Form
            label="メールアドレス"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            variant={error && !email ? 'error' : 'regular'}
          />

          <Form
            label="パスワード（6文字以上）"
            value={password}
            onChangeText={setPassword}
            variant={error ? 'error' : 'password'}
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <View style={styles.buttonWrap}>
            <Button label="登録する" onPress={handleSignup} loading={loading} />
          </View>

          <Link href="/(auth)/login" asChild>
            <TouchableOpacity style={styles.loginWrap}>
              <Text style={styles.loginText}>すでにアカウントをお持ちの方はこちら</Text>
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
  sentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fdfdfd',
    paddingHorizontal: 46,
    gap: 36,
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
  heading: {
    ...fonts.jpBold,
    fontSize: 16,
    color: '#222',
    textAlign: 'center',
  },
  buttonWrap: {
    paddingTop: 16,
  },
  loginWrap: {
    alignItems: 'center',
  },
  loginText: {
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
  sentContent: {
    width: '100%',
    gap: 12,
    alignItems: 'center',
  },
  sentHeading: {
    ...fonts.jpBold,
    fontSize: 16,
    color: '#222',
    textAlign: 'center',
  },
  sentDescription: {
    ...fonts.jpRegular,
    fontSize: 14,
    color: '#898989',
    textAlign: 'center',
    lineHeight: 22,
  },
});
