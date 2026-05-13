import { fonts } from '@/lib/fonts';
import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Linking, ScrollView,
  ActivityIndicator, Modal,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { getMusic } from '@/lib/music';
import { Music } from '@/lib/types';
import MusicCard from '@/components/cards/MusicCard';
import Header from '@/components/layout/Header';
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
  const [selectedMusic, setSelectedMusic] = useState<Music | null>(null);

  useFocusEffect(useCallback(() => {
    getMusic().then(data => { setMusics(data); setLoading(false); });
  }, []));

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
            {musics.map(music => (
              <TouchableOpacity
                key={music.id}
                onPress={() => setSelectedMusic(music)}
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

      <Modal
        visible={selectedMusic !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedMusic(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSelectedMusic(null)}
        >
          <View style={styles.modalBox} onStartShouldSetResponder={() => true}>
            <Text style={styles.modalTitle}>{selectedMusic?.title}</Text>
            <Text style={styles.modalSubtitle}>プラットフォームを選択</Text>
            <View style={styles.platformList}>
              {PLATFORMS.filter(p => selectedMusic?.[p.key]).map(p => (
                <TouchableOpacity
                  key={p.key}
                  style={styles.platformBtn}
                  onPress={() => {
                    const url = selectedMusic?.[p.key];
                    if (url) Linking.openURL(url);
                    setSelectedMusic(null);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.platformLabel}>{p.label}</Text>
                  <IcArrow direction="right" size={14} color={Colors.text} />
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={styles.modalCancelBtn}
              onPress={() => setSelectedMusic(null)}
              activeOpacity={0.7}
            >
              <Text style={styles.modalCancelText}>閉じる</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    width: '80%',
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 24,
  },
  modalTitle: {
    fontFamily: fonts.jpBold,
    fontSize: 20,
    color: Colors.text,
    fontWeight: '700',
  },
  modalSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
    marginBottom: 16,
  },
  platformList: {
    gap: 8,
    marginBottom: 16,
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
    fontSize: 15,
    color: Colors.text,
  },
  modalCancelBtn: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  modalCancelText: {
    fontSize: 15,
    color: Colors.textSecondary,
  },
});
