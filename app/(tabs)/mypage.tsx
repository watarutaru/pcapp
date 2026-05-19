import { fonts } from '@/lib/fonts';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'expo-router';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, Alert, Modal, TextInput,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '@/lib/supabase';
import { getOrCreateProfile, updateProfile } from '@/lib/profiles';
import { signOut } from '@/lib/auth';
import { Profile } from '@/lib/types';
import { Colors } from '@/constants/colors';
import Header from '@/components/layout/Header';
import UserInfoCard from '@/components/cards/UserInfoCard';
import Button from '@/components/ui/Button';

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
          <Header
            title="ACCOUNT"
            variant="white"
            showBack={false}
            showClose
            onClose={() => router.back()}
            style={styles.header}
          />

          {profile && (
            <UserInfoCard
              memberNumber={memberId}
              nickname={profile.nickname}
              email={email}
              onEdit={openEditModal}
              style={styles.infoCard}
            />
          )}

          <Button
            variant="ghost"
            label="通知設定"
            style={styles.button}
          />

          <View style={styles.divider} />

          <View style={styles.linkList}>
            {profile?.role === 'admin' && (
              <TouchableOpacity onPress={() => router.push('/(tabs)/admin')} activeOpacity={0.7}>
                <Text style={styles.linkText}>管理ページ</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={() => router.push('/terms' as any)} activeOpacity={0.7}>
              <Text style={styles.linkText}>利用規約</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/privacy' as any)} activeOpacity={0.7}>
              <Text style={styles.linkText}>プライバシーポリシー</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.bottomActions}>
            <Button
              variant="ghost"
              label="ログアウト"
              onPress={handleSignOut}
              style={styles.button}
            />
            <TouchableOpacity onPress={handleDeleteAccount} activeOpacity={0.7} style={styles.deleteButton}>
              <Text style={styles.deleteText}>アカウント削除</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>

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
  },
  infoCard: {
    marginHorizontal: 24,
    marginBottom: 24,
  },
  button: {
    marginHorizontal: 24,
  },
  divider: {
    marginHorizontal: 24,
    marginVertical: 24,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  linkList: {
    marginHorizontal: 24,
    gap: 12,
    marginBottom: 24,
  },
  linkText: {
    ...fonts.jpRegular,
    fontSize: 14,
    color: '#fff',
    lineHeight: 20,
  },
  bottomActions: {
    gap: 16,
  },
  deleteButton: {
    alignSelf: 'center',
  },
  deleteText: {
    ...fonts.medium,
    fontWeight: '500',
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
    ...fonts.jpBold,
    fontSize: 18,
    color: Colors.text,
    marginBottom: 16,
  },
  modalInput: {
    ...fonts.jpRegular,
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
  modalCancelText: { ...fonts.jpRegular, color: Colors.textSecondary, fontSize: 15 },
  modalSaveBtn: {
    flex: 1,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalSaveText: { ...fonts.jpBold, color: '#fff', fontSize: 15 },
});
