import { fonts } from '@/lib/fonts';
import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Linking, ScrollView,
  ActivityIndicator, Image,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { getMusic } from '@/lib/music';
import { Music } from '@/lib/types';
import MusicCard from '@/components/cards/MusicCard';
import Header from '@/components/layout/Header';
import ContentModal from '@/components/layout/ContentModal';
import { Colors } from '@/constants/colors';
import { IcArrow } from '@/components/icons';

const PLATFORMS: { key: keyof Pick<Music, 'spotify_url' | 'apple_music_url' | 'youtube_music_url' | 'line_music_url'>; label: string }[] = [
  { key: 'spotify_url', label: 'Spotify' },
  { key: 'apple_music_url', label: 'Apple Music' },
  { key: 'youtube_music_url', label: 'YouTube Music' },
  { key: 'line_music_url', label: 'LINE MUSIC' },
];

export default function MusicScreen() {
  const [musics, setMusics] = useState<Music[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  useFocusEffect(useCallback(() => {
    getMusic().then(data => { setMusics(data); setLoading(false); });
  }, []));

  const selectedMusic = selectedIndex >= 0 ? musics[selectedIndex] : null;

  const handleClose = () => setSelectedIndex(-1);
  const handlePrev = () => setSelectedIndex(i => Math.max(0, i - 1));
  const handleNext = () => setSelectedIndex(i => Math.min(musics.length - 1, i + 1));

  return (
    <>
      <View style={styles.container}>
        <Header title="WORKS" showBack={false} />

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={Colors.primary} size="large" />
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
            {musics.length === 0 && (
              <Text style={styles.emptyText}>Musicがありません</Text>
            )}
            {musics.map((music, index) => (
              <TouchableOpacity
                key={music.id}
                onPress={() => setSelectedIndex(index)}
                activeOpacity={0.7}
              >
                <MusicCard
                  title={music.title}
                  type={music.type}
                  albumArt={music.jacket_url ? { uri: music.jacket_url } : undefined}
                />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      <ContentModal
        visible={selectedIndex >= 0}
        onClose={handleClose}
        title="WORKS"
        hasPrev={selectedIndex > 0}
        hasNext={selectedIndex < musics.length - 1}
        onPrev={handlePrev}
        onNext={handleNext}
      >
        {selectedMusic && (
          <MusicModalContent
            music={selectedMusic}
            onClose={handleClose}
          />
        )}
      </ContentModal>
    </>
  );
}

function MusicModalContent({ music, onClose }: { music: Music; onClose: () => void }) {
  const availablePlatforms = PLATFORMS.filter(p => music[p.key]);

  return (
    <>
      {music.jacket_url ? (
        <View style={modalStyles.albumArtWrapper}>
          <Image
            source={{ uri: music.jacket_url }}
            style={modalStyles.albumArt}
            resizeMode="cover"
          />
        </View>
      ) : null}

      <View style={modalStyles.titleSection}>
        <Text style={modalStyles.titleText}>{music.title}</Text>
        <Text style={modalStyles.typeText}>{music.type}</Text>
      </View>

      {availablePlatforms.length > 0 ? (
        <View style={modalStyles.platformList}>
          <Text style={modalStyles.platformHeading}>プラットフォームを選択</Text>
          {availablePlatforms.map(p => (
            <TouchableOpacity
              key={p.key}
              style={modalStyles.platformBtn}
              onPress={() => {
                const url = music[p.key];
                if (url) Linking.openURL(url);
                onClose();
              }}
              activeOpacity={0.7}
            >
              <Text style={modalStyles.platformLabel}>{p.label}</Text>
              <IcArrow direction="right" size={14} color={Colors.text} />
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <Text style={modalStyles.noPlatformText}>配信リンクは準備中です</Text>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 40,
    gap: 12,
  },
  emptyText: {
    textAlign: 'center',
    color: Colors.textSecondary,
    fontSize: 14,
    marginTop: 40,
  },
});

const modalStyles = StyleSheet.create({
  albumArtWrapper: {
    alignSelf: 'center',
    width: 180,
    height: 180,
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  albumArt: {
    width: '100%',
    height: '100%',
  },
  titleSection: {
    gap: 4,
  },
  titleText: {
    fontFamily: fonts.jpBold,
    fontSize: 20,
    fontWeight: '500',
    color: '#0a0a0a',
    lineHeight: 28,
  },
  typeText: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: Colors.textSecondary,
  },
  platformList: {
    gap: 8,
  },
  platformHeading: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  platformBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
  },
  platformLabel: {
    fontFamily: fonts.regular,
    fontSize: 15,
    color: Colors.text,
  },
  noPlatformText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
});
