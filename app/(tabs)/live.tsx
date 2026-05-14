import { fonts } from '@/lib/fonts';
import { useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { getLives, getUserCheckins } from '@/lib/lives';
import { supabase } from '@/lib/supabase';
import { Live } from '@/lib/types';
import { Colors } from '@/constants/colors';
import { useUnread } from '@/lib/UnreadContext';
import ContentModal from '@/components/layout/ContentModal';
import Header from '@/components/layout/Header';
import Tab from '@/components/ui/Tab';
import Tag from '@/components/ui/Tag';
import Button from '@/components/ui/Button';
import LiveCard from '@/components/cards/LiveCard';
import Setlist from '@/components/ui/Setlist';
import { LiveInformation } from '@/components/ui';

type LiveTab = 'UPCOMING' | 'HISTORY';

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const wd = WEEKDAYS[d.getDay()];
  return `${y}.${m}.${day} (${wd})`;
}

function formatTime(dateStr: string, openTime?: string) {
  const d = new Date(dateStr);
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  const start = `開演 ${h}:${min}`;
  return openTime ? `開場 ${openTime} / ${start}` : start;
}

export default function LiveScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<LiveTab>('UPCOMING');
  const [lives, setLives] = useState<Live[]>([]);
  const [checkedInIds, setCheckedInIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const { readIds, refresh: refreshUnread, markRead } = useUnread();

  const load = useCallback(async () => {
    const [livesData, { data: { user } }] = await Promise.all([
      getLives(),
      supabase.auth.getUser(),
    ]);
    setLives(livesData);
    if (user) {
      const checkins = await getUserCheckins(user.id);
      setCheckedInIds(new Set(checkins.map(c => c.live_id)));
    }
    setLoading(false);
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([load(), refreshUnread()]);
    setRefreshing(false);
  }, [load, refreshUnread]);

  useFocusEffect(useCallback(() => {
    load();
    refreshUnread();
  }, [load, refreshUnread]));

  const now = new Date();
  const filteredLives = lives.filter(l =>
    tab === 'UPCOMING'
      ? new Date(l.date) >= now
      : new Date(l.date) < now
  );

  const selectedLive = selectedIndex >= 0 ? filteredLives[selectedIndex] : null;

  useEffect(() => {
    if (selectedLive) {
      markRead('live', selectedLive.id);
    }
  }, [selectedLive?.id]);

  const handleClose = () => setSelectedIndex(-1);
  const handlePrev = () => setSelectedIndex(i => Math.max(0, i - 1));
  const handleNext = () => setSelectedIndex(i => Math.min(filteredLives.length - 1, i + 1));

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="LIVE" showBack={false} />

      <View style={styles.tabRow}>
        <Tab label="UPCOMING" active={tab === 'UPCOMING'} onPress={() => setTab('UPCOMING')} />
        <Tab label="HISTORY" active={tab === 'HISTORY'} onPress={() => setTab('HISTORY')} />
      </View>

      <FlatList
        data={filteredLives}
        keyExtractor={item => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => {
          const isCheckedIn = checkedInIds.has(item.id);
          const isUnread = !readIds.live.has(item.id);
          return (
            <View style={styles.cardWrapper}>
              <TouchableOpacity onPress={() => setSelectedIndex(index)} activeOpacity={0.8}>
                <LiveCard
                  variant={tab === 'UPCOMING' ? 'upcoming' : 'history'}
                  title={item.title}
                  date={formatDate(item.date)}
                  venue={item.venue}
                  time={formatTime(item.date, item.open_time)}
                  tag={isCheckedIn ? 'Dragged!' : undefined}
                  illustration={require('@/assets/images/live-illust.png')}
                />
              </TouchableOpacity>
              {isUnread && <View style={styles.unreadDot} />}
            </View>
          );
        }}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {tab === 'UPCOMING' ? '予定はありません' : '過去のライブはありません'}
          </Text>
        }
      />

      <ContentModal
        visible={selectedIndex >= 0}
        onClose={handleClose}
        title="LIVE"
        hasPrev={selectedIndex > 0}
        hasNext={selectedIndex < filteredLives.length - 1}
        onPrev={handlePrev}
        onNext={handleNext}
      >
        {selectedLive && (
          <LiveModalContent
            live={selectedLive}
            isCheckedIn={checkedInIds.has(selectedLive.id)}
            onCheckin={() => {
              handleClose();
              router.push('/qr-checkin' as any);
            }}
          />
        )}
      </ContentModal>
    </View>
  );
}

function LiveModalContent({
  live, isCheckedIn, onCheckin,
}: {
  live: Live;
  isCheckedIn: boolean;
  onCheckin: () => void;
}) {
  const songs = live.set_list
    ? live.set_list.split('\n').filter(s => s.trim())
    : [];

  return (
    <>
      {isCheckedIn && <Tag label="Dragged!" variant="strong" />}

      <View style={modalStyles.titleSection}>
        <Text style={modalStyles.dateText}>{formatDate(live.date)}</Text>
        <Text style={modalStyles.titleText}>{live.title}</Text>
      </View>

      <LiveInformation
        venue={live.venue}
        time={formatTime(live.date, live.open_time)}
        ticket={live.ticket_info}
        performers={live.artists}
      />

      {live.description ? (
        <Text style={modalStyles.descriptionText}>{live.description}</Text>
      ) : null}

      {songs.length > 0 && <Setlist songs={songs} />}

      <View style={modalStyles.checkinSection}>
        {isCheckedIn ? (
          <Button label="参戦済み" variant="secondary" disabled />
        ) : (
          <Button label="このライブにチェックインする" onPress={onCheckin} />
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  tabRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  list: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 16,
  },
  cardWrapper: {
    position: 'relative',
  },
  unreadDot: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ef4444',
    borderWidth: 2,
    borderColor: '#f9f9f9',
  },
  emptyText: {
    textAlign: 'center',
    color: Colors.textSecondary,
    fontSize: 14,
    marginTop: 40,
  },
});

const modalStyles = StyleSheet.create({
  titleSection: {
    gap: 8,
  },
  dateText: {
    fontFamily: fonts.regular,
    fontSize: 16,
    color: Colors.text,
  },
  titleText: {
    fontFamily: fonts.jpBold,
    fontSize: 20,
    fontWeight: '500',
    color: '#0a0a0a',
    lineHeight: 28,
  },
  descriptionText: {
    fontFamily: fonts.jpLight,
    fontSize: 14,
    color: '#364153',
    lineHeight: 23,
  },
  checkinSection: {
    paddingTop: 8,
  },
});
