import { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Linking, ScrollView,
  Image, Modal, Platform,
} from 'react-native';
import { SvgXml } from 'react-native-svg';
import { Colors } from '@/constants/colors';

const arrowSvg = `<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M6 3l5 5-5 5" stroke="#222" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const ALBUMS = [
  {
    id: 'q',
    title: 'Q',
    type: 'アルバム',
    jacket: require('@/assets/images/album-q.png'),
    platforms: [
      { label: 'Spotify', url: 'https://open.spotify.com/intl-ja/artist/0lSV8qzQ03K2rAe5LnEHuJ' },
      { label: 'Apple Music', url: 'https://music.apple.com/jp/artist/piercing-cyclone/1679278359' },
      { label: 'YouTube Music', url: 'https://music.youtube.com/playlist?list=OLAK5uy_lrNDpbQf754xTahHE0UUTWmAfqSOWmFSY' },
      { label: 'LINE MUSIC', url: 'https://music.line.me/webapp/artist/mi000000001d312ad1' },
    ],
  },
];

export default function MusicScreen() {
  const [selectedAlbum, setSelectedAlbum] = useState<typeof ALBUMS[0] | null>(null);

  return (
    <>
      <View style={styles.container}>
        {/* ヘッダー */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>WORKS</Text>
        </View>

        {/* アルバムリスト */}
        <ScrollView
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        >
          {ALBUMS.map(album => (
            <TouchableOpacity
              key={album.id}
              style={styles.card}
              onPress={() => setSelectedAlbum(album)}
              activeOpacity={0.7}
            >
              <Image source={album.jacket} style={styles.jacket} />
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle}>{album.title}</Text>
                <Text style={styles.cardType}>{album.type}</Text>
              </View>
              <SvgXml xml={arrowSvg} width={16} height={16} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* プラットフォーム選択モーダル */}
      <Modal
        visible={selectedAlbum !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedAlbum(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSelectedAlbum(null)}
        >
          <View style={styles.modalBox} onStartShouldSetResponder={() => true}>
            <Text style={styles.modalTitle}>{selectedAlbum?.title}</Text>
            <Text style={styles.modalSubtitle}>プラットフォームを選択</Text>
            <View style={styles.platformList}>
              {selectedAlbum?.platforms.map(p => (
                <TouchableOpacity
                  key={p.label}
                  style={styles.platformBtn}
                  onPress={() => {
                    Linking.openURL(p.url);
                    setSelectedAlbum(null);
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.platformLabel}>{p.label}</Text>
                  <SvgXml xml={arrowSvg} width={14} height={14} />
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={styles.modalCancelBtn}
              onPress={() => setSelectedAlbum(null)}
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
    backgroundColor: '#f5f5f5',
  },
  header: {
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 16,
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: Platform.OS === 'ios' ? 'AvenirNextCondensed-Regular' : 'sans-serif-condensed',
    fontSize: 24,
    color: Colors.text,
    letterSpacing: 1,
    lineHeight: 32,
  },
  list: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 40,
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#efefef',
    borderRadius: 10,
    padding: 12,
  },
  jacket: {
    width: 60,
    height: 60,
    borderWidth: 0.5,
    borderColor: '#efefef',
  },
  cardInfo: {
    flex: 1,
    gap: 8,
  },
  cardTitle: {
    fontFamily: Platform.OS === 'ios' ? 'HiraginoSans-W6' : 'sans-serif-medium',
    fontSize: 16,
    color: '#222',
  },
  cardType: {
    fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'sans-serif',
    fontSize: 12,
    color: '#898989',
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
    fontFamily: Platform.OS === 'ios' ? 'HiraginoSans-W6' : 'sans-serif-medium',
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
