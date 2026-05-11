import { fonts } from '@/lib/fonts';
import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { Link } from 'expo-router';
import { signInWithPassword, resetPassword } from '@/lib/auth';
import { Colors } from '@/constants/colors';
import LogoSvg from '@/components/LogoSvg';

type ViewType = 'welcome' | 'login';

export default function LoginScreen() {
  const [view, setView] = useState<ViewType>('welcome');
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

  if (view === 'login') {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.inner}>
          <TouchableOpacity style={styles.backButton} onPress={() => setView('welcome')}>
            <Text style={styles.backButtonText}>← 戻る</Text>
          </TouchableOpacity>

          <Text style={styles.heading}>ログイン</Text>

          <TextInput
            style={styles.input}
            placeholder="メールアドレス"
            placeholderTextColor={Colors.textSecondary}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoFocus
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
      </KeyboardAvoidingView>
    );
  }

  return (
    <View style={styles.welcome}>
      <View style={styles.welcomeContent}>
        <View style={styles.titleBlock}>
          <Text style={styles.brandTitle}>Piercing Cyclone</Text>
          <Text style={styles.brandSubtitle}>OFFICIAL APP</Text>
        </View>

        <LogoSvg size={175} />

        <View style={styles.buttonGroup}>
          <TouchableOpacity style={styles.primaryButton} onPress={() => setView('login')}>
            <Text style={styles.primaryButtonText}>ログイン</Text>
          </TouchableOpacity>

          <Link href="/(auth)/signup" asChild>
            <TouchableOpacity style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>ファンクラブに入会する</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  welcome: {
    flex: 1,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcomeContent: {
    alignItems: 'center',
    gap: 36,
    width: 283,
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
  buttonGroup: {
    alignItems: 'center',
    gap: 16,
    width: 230,
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
  inner: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 32,
    backgroundColor: Colors.surface,
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 24,
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
