import { fonts } from '@/lib/fonts';
import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import { Link } from 'expo-router';
import { signInWithPassword, resetPassword } from '@/lib/auth';
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
        {/* タイトル */}
        <View style={styles.titleBlock}>
          <Text style={styles.brandTitle}>Piercing Cyclone</Text>
          <Text style={styles.brandSubtitle}>OFFICIAL APP</Text>
        </View>

        {/* ロゴ */}
        <LogoSvg size={174} />

        {/* フォーム */}
        <View style={styles.formGroup}>
          {/* メールアドレス */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>メールアドレス</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {/* パスワード */}
          <View style={styles.field}>
            <View style={styles.fieldLabelRow}>
              <Text style={styles.fieldLabel}>パスワード</Text>
              <TouchableOpacity onPress={handleResetPassword} disabled={loading}>
                <Text style={styles.forgotText}>?お忘れの方</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          {/* ログインボタン */}
          <View style={styles.buttonWrap}>
            <TouchableOpacity style={styles.loginButton} onPress={handleLogin} disabled={loading}>
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.loginButtonText}>ログイン</Text>
              }
            </TouchableOpacity>
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
  field: {
    gap: 6,
  },
  fieldLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fieldLabel: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: '#222',
  },
  forgotText: {
    fontFamily: fonts.regular,
    fontSize: 12,
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
  loginButton: {
    backgroundColor: '#222',
    borderRadius: 60,
    paddingVertical: 12,
    alignItems: 'center',
    width: '100%',
  },
  loginButtonText: {
    fontFamily: fonts.jpBold,
    fontSize: 16,
    color: '#fff',
    lineHeight: 24,
  },
  signupWrap: {
    alignItems: 'center',
  },
  signupText: {
    fontFamily: fonts.jpRegular,
    fontSize: 14,
    color: '#898989',
    lineHeight: 14,
  },
});
