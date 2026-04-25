import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getLive, checkinToLive, getUserCheckins } from '@/lib/lives';
import { addPoints } from '@/lib/profiles';
import { supabase } from '@/lib/supabase';
import { Live } from '@/lib/types';
import { Colors } from '@/constants/colors';

export default function LiveDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [live, setLive] = useState<Live | null>(null);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    async function load() {
      const [liveData, { data: { user } }] = await Promise.all([
        getLive(id),
        supabase.auth.getUser(),
      ]);
      setLive(liveData);
      if (user) {
        setUserId(user.id);
        const checkins = await getUserCheckins(user.id);
        setIsCheckedIn(checkins.some(c => c.live_id === id));
      }
      setLoading(false);
    }
    load();
  }, [id]);

  async function handleCheckin() {
    if (!userId || !live) return;
    setChecking(true);
    try {
      await checkinToLive(userId, live.id);
      await addPoints(userId, 50, `ライブ参戦: ${live.title}`);
      setIsCheckedIn(true);
      Alert.alert('チェックイン完了！', '50ポイントを獲得しました！🎉');
    } catch (e: any) {
      Alert.alert('エラー', e.message);
    } finally {
      setChecking(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  if (!live) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>ライブ情報が見つかりません</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>戻る</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>← 戻る</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>{live.title}</Text>

          <View style={styles.infoCard}>
            <InfoRow label="日時" value={new Date(live.date).toLocaleDateString('ja-JP', {
              year: 'numeric', month: 'long', day: 'numeric', weekday: 'long', hour: '2-digit', minute: '2-digit',
            })} />
            <InfoRow label="会場" value={live.venue} />
          </View>

          {live.description && (
            <View style={styles.descCard}>
              <Text style={styles.descTitle}>詳細</Text>
              <Text style={styles.descText}>{live.description}</Text>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        {isCheckedIn ? (
          <View style={styles.checkedButton}>
            <Text style={styles.checkedButtonText}>✓ 参戦済み</Text>
          </View>
        ) : (
          <TouchableOpacity style={styles.checkinButton} onPress={handleCheckin} disabled={checking}>
            {checking ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.checkinButtonText}>チェックイン（+50pt）</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    backgroundColor: Colors.background,
  },
  errorText: { color: Colors.textSecondary, fontSize: 16, marginBottom: 16 },
  backButton: {
    backgroundColor: Colors.primary, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12,
  },
  backText: { color: '#fff', fontSize: 16 },
  header: { paddingTop: 60, paddingHorizontal: 24, paddingBottom: 16 },
  backBtn: { alignSelf: 'flex-start' },
  backBtnText: { color: Colors.primary, fontSize: 16 },
  content: { paddingHorizontal: 24 },
  title: {
    fontSize: 26, fontWeight: 'bold', color: Colors.text, marginBottom: 20,
  },
  infoCard: {
    backgroundColor: Colors.surface, borderRadius: 16, padding: 16,
    marginBottom: 16, borderWidth: 1, borderColor: Colors.border,
  },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  infoLabel: { color: Colors.textSecondary, fontSize: 14 },
  infoValue: { color: Colors.text, fontSize: 14, fontWeight: '600', flex: 1, textAlign: 'right' },
  descCard: {
    backgroundColor: Colors.surface, borderRadius: 16, padding: 16,
    marginBottom: 100, borderWidth: 1, borderColor: Colors.border,
  },
  descTitle: { color: Colors.textSecondary, fontSize: 12, marginBottom: 8 },
  descText: { color: Colors.text, fontSize: 15, lineHeight: 24 },
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: 24, backgroundColor: Colors.background,
  },
  checkinButton: {
    backgroundColor: Colors.primary, borderRadius: 16,
    paddingVertical: 18, alignItems: 'center',
  },
  checkinButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  checkedButton: {
    backgroundColor: Colors.success, borderRadius: 16,
    paddingVertical: 18, alignItems: 'center',
  },
  checkedButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
