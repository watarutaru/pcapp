import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
  ActivityIndicator, TouchableOpacity,
} from 'react-native';
import { fonts } from '@/lib/fonts';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { getNextLive } from '@/lib/lives';
import { Profile, Live } from '@/lib/types';
import { Colors } from '@/constants/colors';
import HomeHeader from '@/components/layout/HomeHeader';
import MembershipCard from '@/components/cards/MembershipCard';
import StatusBlock from '@/components/home/StatusBlock';
import CheckinBlock from '@/components/home/CheckinBlock';
import LiveCard from '@/components/cards/LiveCard';
import ContentHeading from '@/components/ui/ContentHeading';
import IcBicycle from '@/components/icons/IcBicycle';

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
  return `${year}.${month}.${day} (${weekdays[d.getDay()]})`;
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

function formatLiveTime(live: Live): string {
  const start = formatTime(live.date);
  if (live.open_time) {
    return `開場 ${formatTime(live.open_time)} / 開演 ${start}`;
  }
  return `開演 ${start}`;
}

export default function HomeScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [nextLive, setNextLive] = useState<Live | null | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [debugInfo, setDebugInfo] = useState('initializing...');

  const load = useCallback(async (userId: string, email: string) => {
    try {
      setDebugInfo(`loading for ${userId.slice(0, 8)}...`);
      const { data: profileData, error: profileError } = await supabase
        .from('profiles').select('*').eq('user_id', userId).maybeSingle();
      if (profileError) {
        setDebugInfo(`select error: ${profileError.code} ${profileError.message}`);
        return;
      }
      if (!profileData) {
        setDebugInfo(`no profile, inserting...`);
        const { error: insertError } = await supabase
          .from('profiles').insert({ user_id: userId, nickname: email.split('@')[0] });
        if (insertError) {
          setDebugInfo(`insert error: ${insertError.code} ${insertError.message}`);
        }
        const { data: retryData, error: retryError } = await supabase
          .from('profiles').select('*').eq('user_id', userId).maybeSingle();
        if (retryError) setDebugInfo(`retry error: ${retryError.code} ${retryError.message}`);
        else if (retryData) { setProfile(retryData); setDebugInfo('ok'); }
        else setDebugInfo('profile still null after insert');
      } else {
        setProfile(profileData);
        setDebugInfo('ok');
      }
      const live = await getNextLive();
      setNextLive(live);
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
      setDebugInfo(`event: ${event}, user: ${session?.user?.id?.slice(0, 8) ?? 'null'}`);
      if (session?.user) {
        load(session.user.id, session.user.email ?? '');
      } else {
        setLoading(false);
      }
    });
    return () => subscription.unsubscribe();
  }, [load]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>プロフィールが見つかりません</Text>
        <Text style={[styles.errorText, { fontSize: 11, marginTop: 8, paddingHorizontal: 16, textAlign: 'center' }]}>{debugInfo}</Text>
      </View>
    );
  }

  const memberId = profile.member_number ?? profile.user_id.replace(/-/g, '').slice(0, 11).toUpperCase();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      showsVerticalScrollIndicator={false}
    >
      <HomeHeader onAccountPress={() => router.push('/(tabs)/mypage' as any)} />

      <View style={styles.body}>
        <View style={styles.topSection}>
          <MembershipCard
            memberNumber={memberId}
            nickname={profile.nickname}
            style={styles.memberCard}
          />
          <View style={styles.tilesRow}>
            <StatusBlock
              stage={profile.stage}
              points={profile.total_points}
              style={styles.tile}
            />
            <CheckinBlock
              onPress={() => router.push('/(tabs)/mypage' as any)}
              style={styles.tile}
            />
          </View>
        </View>

        <View style={styles.nextWaveSection}>
          <ContentHeading
            label="NEXT WAVE"
            icon={<IcBicycle size={24} color="#222" />}
          />
          {nextLive ? (
            <TouchableOpacity
              onPress={() => router.push(`/live/${nextLive.id}` as any)}
              activeOpacity={0.8}
            >
              <LiveCard
                title={nextLive.title}
                date={formatDate(nextLive.date)}
                venue={nextLive.venue}
                time={formatLiveTime(nextLive)}
                illustration={require('@/assets/images/live-illust.png')}
              />
            </TouchableOpacity>
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>直近の予定はありません</Text>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  content: {
    paddingBottom: 32,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  errorText: {
    ...fonts.jpRegular,
    color: Colors.textSecondary,
    fontSize: 16,
  },
  body: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 40,
  },
  topSection: {
    gap: 24,
  },
  memberCard: {
    width: '100%',
  },
  tilesRow: {
    flexDirection: 'row',
    gap: 16,
  },
  tile: {
    flex: 1,
  },
  nextWaveSection: {
    gap: 8,
  },
  emptyCard: {
    backgroundColor: Colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#efefef',
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    ...fonts.jpRegular,
    color: Colors.textSecondary,
    fontSize: 14,
  },
});
