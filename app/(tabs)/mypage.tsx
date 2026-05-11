import { fonts } from '@/lib/fonts';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'expo-router';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, Alert, Modal, TextInput,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SvgXml } from 'react-native-svg';
import { supabase } from '@/lib/supabase';
import { getOrCreateProfile, updateProfile } from '@/lib/profiles';
import { signOut } from '@/lib/auth';
import { Profile } from '@/lib/types';
import { Colors } from '@/constants/colors';

const pencilSvg = `<svg viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M1 10.5V13h2.5l7.373-7.373-2.5-2.5L1 10.5zM12.805 3.695a.664.664 0 0 0 0-.94L11.245 1.195a.664.664 0 0 0-.94 0L9.13 2.37l2.5 2.5 1.175-1.175z" fill="white"/>
</svg>`;

const closeSvg = `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M18 6L6 18M6 6l12 12" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
</svg>`;

export default function MyPageScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editNickname, setEditNickname] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async (userId: string, userEmail: string) => {
    try {
      const p = await getOrCreateProfile(userId, userEmail);
      setProfile(p);
      setEmail(userEmail);
    } finally {
      setLoading(false);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) await load(session.user.id, session.user.email ?? '');
    setRefreshing(false);
  }, [load]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        load(session.user.id, session.user.email ?? '');
      } else {
        setLoading(false);
      }
    });
    return () => subscription.unsubscribe();
  }, [load]);

  function openEditModal() {
    setEditNickname(profile?.nickname ?? '');
    setEditModalVisible(true);
  }

  async function handleSaveNickname() {
    const trimmed = editNickname.trim();
    if (!trimmed) {
      Alert.alert('エラー', 'ニックネームを入力してください');
      return;
    }
    if (!profile) return;
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) return;
      await updateProfile(user.id, { nickname: trimmed });
      setProfile({ ...profile, nickname: trimmed });
      setEditModalVisible(false);
    } catch (e) {
      Alert.alert('エラー', e instanceof Error ? e.message : 'エラーが発生しました');
    } finally {
      setSaving(false);
    }
  }

  async function handleSignOut() {
    Alert.alert('ログアウト', 'ログアウトしますか？', [
      { text: 'キャンセル', style: 'cancel' },
      { text: 'ログアウト', style: 'destructive', onPress: () => signOut() },
    ]);
  }

  function handleDeleteAccount() {
    Alert.alert(
      'アカウント削除',
      'アカウントを削除しますか？この操作は取り消せません。',
      [
        { text: 'キャンセル', style: 'cancel' },
        { text: '削除', style: 'destructive', onPress: () => signOut() },
      ],
    );
  }

  const memberId = profile
    ? (profile.member_number ?? profile.user_id.replace(/-/g, '').slice(0, 11).toUpperCase())
    : '';

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color="#fff" size="large" />
      </View>
    );
  }

  return (
    <>
      <View style={styles.container}>
        {/* グラデーション背景 */}
        <LinearGradient
          colors={['rgba(101,76,171,0.4)', 'rgba(234,96,37,0.4)']}
          start={{ x: 0.75, y: 0 }}
          end={{ x: 0.25, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="rgba(255,255,255,0.5)" />}
          showsVerticalScrollIndicator={false}
        >
          {/* ヘッダー */}
          <View style={styles.header}>
            <View style={styles.headerSpacer} />
            <Text style={styles.title}>ACCOUNT</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <SvgXml xml={closeSvg} width={24} height={24} />
            </TouchableOpacity>
          </View>

          {/* 情報カード */}
          {profile && (
            <View style={styles.infoCard}>
              {/* 変更ボタン */}
              <TouchableOpacity style={styles.editButton} onPress={openEditModal} activeOpacity={0.7}>
                <SvgXml xml={pencilSvg} width={14} height={14} />
                <Text style={styles.editButtonText}>変更</Text>
              </TouchableOpacity>

              {/* 会員番号 */}
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>会員番号</Text>
                <Text style={styles.fieldValue}>{memberId}</Text>
              </View>

              {/* ニックネーム */}
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>ニックネーム</Text>
                <Text style={[styles.fieldValue, styles.fieldValueMedium]}>{profile.nickname}</Text>
              </View>

              {/* メールアドレス */}
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>メールアドレス</Text>
                <Text style={styles.fieldValue}>{email}</Text>
              </View>
            </View>
          )}

          {/* 通知設定 */}
          <TouchableOpacity style={styles.outlineButton} activeOpacity={0.7}>
            <Text style={styles.outlineButtonText}>通知設定</Text>
          </TouchableOpacity>

          {/* 区切り線 */}
          <View style={styles.divider} />

          {/* リンク */}
          <View style={styles.linkList}>
            <TouchableOpacity activeOpacity={0.7}>
              <Text style={styles.linkText}>利用規約</Text>
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.7}>
              <Text style={styles.linkText}>プライバシーポリシー</Text>
            </TouchableOpacity>
          </View>

          {/* ログアウト・削除 */}
          <View style={styles.bottomActions}>
            <TouchableOpacity style={styles.outlineButton} onPress={handleSignOut} activeOpacity={0.7}>
              <Text style={styles.outlineButtonText}>ログアウト</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDeleteAccount} activeOpacity={0.7}>
              <Text style={styles.deleteText}>アカウント削除</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>

      {/* ニックネーム編集モーダル */}
      <Modal visible={editModalVisible} transparent animationType="fade">
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>ニックネームを変更</Text>
            <TextInput
              style={styles.modalInput}
              value={editNickname}
              onChangeText={setEditNickname}
              placeholder="ニックネーム"
              placeholderTextColor={Colors.textSecondary}
              autoFocus
              maxLength={20}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setEditModalVisible(false)}
                disabled={saving}
              >
                <Text style={styles.modalCancelText}>キャンセル</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={handleSaveNickname}
                disabled={saving}
              >
                {saving
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.modalSaveText}>保存</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#222',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#222',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    paddingBottom: 48,
  },
  header: {
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerSpacer: {
    width: 32,
  },
  title: {
    flex: 1,
    fontFamily: fonts.condensed,
    fontSize: 24,
    color: '#fff',
    letterSpacing: 1,
    lineHeight: 32,
    textAlign: 'center',
  },
  closeButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoCard: {
    marginHorizontal: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 10,
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 16,
    marginBottom: 24,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-end',
  },
  editButtonText: {
    fontFamily: fonts.jpLight,
    fontSize: 12,
    color: '#fff',
    lineHeight: 14,
  },
  field: {
    gap: 4,
  },
  fieldLabel: {
    fontSize: 12,
    color: '#fff',
    lineHeight: 16,
  },
  fieldValue: {
    fontFamily: fonts.regular,
    fontSize: 16,
    color: '#fff',
    lineHeight: 20,
  },
  fieldValueMedium: {
    fontFamily: fonts.medium,
    lineHeight: 24,
  },
  outlineButton: {
    marginHorizontal: 24,
    height: 50,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  outlineButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  divider: {
    marginHorizontal: 24,
    marginVertical: 24,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  linkList: {
    marginHorizontal: 24,
    gap: 12,
    marginBottom: 24,
  },
  linkText: {
    fontFamily: fonts.jpBold,
    fontSize: 14,
    color: '#fff',
    lineHeight: 20,
  },
  bottomActions: {
    marginHorizontal: 0,
    gap: 16,
    alignItems: 'center',
  },
  deleteText: {
    fontFamily: fonts.jpBold,
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    lineHeight: 20,
  },

  // モーダル
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalBox: {
    width: '80%',
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 16,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.text,
    marginBottom: 20,
  },
  modalButtons: { flexDirection: 'row', gap: 12 },
  modalCancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalCancelText: { color: Colors.textSecondary, fontSize: 15 },
  modalSaveBtn: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalSaveText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
