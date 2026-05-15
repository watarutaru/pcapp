import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { Link } from 'expo-router';
import { signUpWithPassword } from '@/lib/auth';
import { Colors } from '@/constants/colors';
import { fonts } from '@/lib/fonts';

export default function SignupScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function handleSignup() {
    setError('');
    if (!email || !password || !nickname) {
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
      <View style={styles.center}>
        <Text style={styles.logo}>🌀 Piercing Cyclone</Text>
        <Text style={styles.title}>確認メールを送信しました</Text>
        <Text style={styles.description}>
          {email} に確認メールを送信しました。{'\n'}
          メール内のリンクをタップして登録を完了してください。
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.inner}>
        <Text style={styles.logo}>🌀 Piercing Cyclone</Text>
        <Text style={styles.title}>会員登録</Text>

        <TextInput
          style={styles.input}
          placeholder="ニックネーム"
          placeholderTextColor={Colors.textSecondary}
          value={nickname}
          onChangeText={setNickname}
        />
        <TextInput
          style={styles.input}
          placeholder="メールアドレス"
          placeholderTextColor={Colors.textSecondary}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="パスワード（6文字以上）"
          placeholderTextColor={Colors.textSecondary}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity style={styles.button} onPress={handleSignup} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>登録する</Text>
          )}
        </TouchableOpacity>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Link href="/(auth)/login" asChild>
          <TouchableOpacity style={styles.linkButton}>
            <Text style={styles.linkText}>すでにアカウントをお持ちの方はこちら</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    paddingHorizontal: 32,
    gap: 16,
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  logo: {
    fontFamily: fonts.condensed,
    fontSize: 28,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  title: {
    fontFamily: fonts.jpBold,
    fontSize: 20,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 40,
  },
  description: {
    fontFamily: fonts.jpRegular,
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  input: {
    fontFamily: fonts.regular,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: Colors.text,
    fontSize: 16,
    marginBottom: 16,
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    fontFamily: fonts.jpBold,
    color: '#fff',
    fontSize: 16,
  },
  linkButton: {
    marginTop: 24,
    alignItems: 'center',
  },
  linkText: {
    fontFamily: fonts.jpRegular,
    color: Colors.textSecondary,
    fontSize: 14,
  },
  errorText: {
    fontFamily: fonts.jpRegular,
    color: '#ef4444',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 12,
  },
});
