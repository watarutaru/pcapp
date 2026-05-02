import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { Link } from 'expo-router';
import { sendMagicLink } from '@/lib/auth';
import { Colors } from '@/constants/colors';

export default function SignupScreen() {
  const [email, setEmail] = useState('');
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSignup() {
    if (!email || !nickname) {
      Alert.alert('エラー', 'すべての項目を入力してください');
      return;
    }
    setLoading(true);
    try {
      await sendMagicLink(email, nickname);
      setSent(true);
    } catch (e) {
      Alert.alert('登録失敗', e instanceof Error ? e.message : 'エラーが発生しました');
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <View style={styles.center}>
        <Text style={styles.logo}>🌀 Piercing Cyclone</Text>
        <Text style={styles.title}>メールを確認してください</Text>
        <Text style={styles.description}>
          {email} にログインリンクを送信しました。{'\n'}
          メール内のリンクをタップしてログインできます。
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

        <TouchableOpacity style={styles.button} onPress={handleSignup} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>登録してログイン</Text>
          )}
        </TouchableOpacity>

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
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 40,
  },
  description: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  input: {
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
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  linkButton: {
    marginTop: 24,
    alignItems: 'center',
  },
  linkText: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
});
