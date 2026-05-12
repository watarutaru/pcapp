import { fonts } from '@/lib/fonts';
import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import { Link } from 'expo-router';
import { signInWithPassword, resetPassword } from '@/lib/auth';
import { Colors } from '@/constants/colors';
import LogoSvg from '@/components/LogoSvg';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email || !password) {
      Alert.alert('エラー', 'メールアドレスとパスワードを入力してください');
      return;
    }
    setLoading(true);
    try {
      await signInWithPassword(email, password);
    } catch (e) {
      Alert.alert('ログイン失敗', e instanceof Error ? e.message : 'エラーが発生しました');
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword() {
    if (!email) {
      Alert.alert('エラー', 'メールアドレスを入力してください');
      return;
    }
    setLoading(true);
    try {
      await resetPassword(email);
      Alert.alert('送信しました', `${email} にパスワード再設定メールを送りました。`);
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
      <ScrollView
        contentContainerStyle={styles.inner}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleBlock}>
          <Text style={styles.brandTitle}>Piercing Cyclone</Text>
          <Text style={styles.brandSubtitle}>OFFICIAL APP</Text>
        </View>

        <LogoSvg size={140} />

        <View style={styles.form}>
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
            placeholder="パスワード"
            placeholderTextColor={Colors.textSecondary}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity style={styles.primaryButton} onPress={handleLogin} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryButtonText}>ログイン</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.textLink} onPress={handleResetPassword} disabled={loading}>
            <Text style={styles.textLinkText}>パスワードを忘れた方はこちら</Text>
          </TouchableOpacity>
        </View>

        <Link href="/(auth)/signup" asChild>
          <TouchableOpacity style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>ファンクラブに入会する</Text>
          </TouchableOpacity>
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  inner: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 48,
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
  form: {
    width: '100%',
    gap: 0,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    borderRadius: 60,
    paddingVertical: 12,
    paddingHorizontal: 32,
    alignItems: 'center',
    width: 230,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: Colors.textSecondary,
    borderRadius: 50,
    paddingVertical: 13,
    paddingHorizontal: 24,
    alignItems: 'center',
    width: 230,
  },
  secondaryButtonText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '400',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: 40,
    gap: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  backButtonText: {
    color: Colors.textSecondary,
    fontSize: 16,
  },
  heading: {
    fontSize: 28,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  subheading: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 32,
  },
  input: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: Colors.text,
    fontSize: 16,
    marginBottom: 16,
  },
  textLink: {
    marginTop: 20,
    alignItems: 'center',
  },
  textLinkText: {
    color: Colors.textSecondary,
    fontSize: 13,
  },
});
