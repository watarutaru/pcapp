import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Image, Platform,
} from 'react-native';
import { CameraView, Camera } from 'expo-camera';
import { SvgXml } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { checkinToLive, getLive } from '@/lib/lives';
import { addPoints } from '@/lib/profiles';

const qrSvg = `<svg viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="8" y="8" width="44" height="44" rx="4" stroke="rgba(255,255,255,0.6)" stroke-width="4"/>
  <rect x="20" y="20" width="20" height="20" rx="2" fill="rgba(255,255,255,0.6)"/>
  <rect x="76" y="8" width="44" height="44" rx="4" stroke="rgba(255,255,255,0.6)" stroke-width="4"/>
  <rect x="88" y="20" width="20" height="20" rx="2" fill="rgba(255,255,255,0.6)"/>
  <rect x="8" y="76" width="44" height="44" rx="4" stroke="rgba(255,255,255,0.6)" stroke-width="4"/>
  <rect x="20" y="88" width="20" height="20" rx="2" fill="rgba(255,255,255,0.6)"/>
  <rect x="76" y="76" width="8" height="8" rx="1" fill="rgba(255,255,255,0.6)"/>
  <rect x="92" y="76" width="8" height="8" rx="1" fill="rgba(255,255,255,0.6)"/>
  <rect x="108" y="76" width="8" height="8" rx="1" fill="rgba(255,255,255,0.6)"/>
  <rect x="76" y="92" width="8" height="8" rx="1" fill="rgba(255,255,255,0.6)"/>
  <rect x="108" y="92" width="8" height="8" rx="1" fill="rgba(255,255,255,0.6)"/>
  <rect x="76" y="108" width="8" height="8" rx="1" fill="rgba(255,255,255,0.6)"/>
  <rect x="92" y="108" width="8" height="8" rx="1" fill="rgba(255,255,255,0.6)"/>
  <rect x="108" y="108" width="8" height="8" rx="1" fill="rgba(255,255,255,0.6)"/>
</svg>`;

const closeSvg = `<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M8 8l16 16M24 8L8 24" stroke="white" stroke-width="2" stroke-linecap="round"/>
</svg>`;

export default function QrCheckinScreen() {
  const router = useRouter();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [successTitle, setSuccessTitle] = useState<string | null>(null);

  useEffect(() => {
    Camera.requestCameraPermissionsAsync().then(({ status }) => {
      setHasPermission(status === 'granted');
    });
  }, []);

  async function handleBarCodeScanned({ data }: { data: string }) {
    if (scanned || processing) return;
    setScanned(true);
    setProcessing(true);

    try {
      let liveId: string;
      try {
        const parsed = JSON.parse(data);
        liveId = parsed.live_id;
      } catch {
        liveId = data.trim();
      }

      if (!liveId) {
        Alert.alert('エラー', '無効なQRコードです', [
          { text: 'OK', onPress: () => setScanned(false) },
        ]);
        setProcessing(false);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('ログインが必要です');

      const live = await getLive(liveId);
      if (!live) {
        Alert.alert('エラー', 'ライブ情報が見つかりません', [
          { text: 'OK', onPress: () => setScanned(false) },
        ]);
        setProcessing(false);
        return;
      }

      const isNew = await checkinToLive(user.id, liveId);
      if (!isNew) {
        Alert.alert(
          'チェックイン済み',
          `${live.title}\n\nすでにこのライブに参戦記録があります`,
          [{ text: 'OK', onPress: () => router.back() }],
        );
        return;
      }

      await addPoints(user.id, 50, `ライブ参戦: ${live.title}`);
      setSuccessTitle(live.title);
    } catch (e) {
      Alert.alert('エラー', e instanceof Error ? e.message : 'エラーが発生しました', [
        { text: 'OK', onPress: () => setScanned(false) },
      ]);
    } finally {
      setProcessing(false);
    }
  }

  /* 成功画面 */
  if (successTitle !== null) {
    return (
      <View style={styles.container}>
        {/* ヘッダー */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>CHECK IN</Text>
          <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()} activeOpacity={0.7}>
            <SvgXml xml={closeSvg} width={32} height={32} />
          </TouchableOpacity>
        </View>

        {/* 成功コンテンツ */}
        <View style={styles.successBody}>
          <Text style={styles.successText}>Dragged!</Text>
          <Text style={styles.successText}>今日もありがとう</Text>
        </View>

        <View style={styles.successBottom}>
          <Image
            source={require('@/assets/images/checkin-success.png')}
            style={styles.successImage}
            resizeMode="contain"
          />
          <TouchableOpacity style={styles.closeWhiteBtn} onPress={() => router.back()} activeOpacity={0.8}>
            <Text style={styles.closeWhiteBtnText}>閉じる</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  /* カメラ権限なし */
  if (hasPermission === null) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator color="rgba(255,255,255,0.5)" size="large" />
      </View>
    );
  }

  if (!hasPermission) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.errorText}>カメラへのアクセスが許可されていません</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backText}>戻る</Text>
        </TouchableOpacity>
      </View>
    );
  }

  /* スキャン画面 */
  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFill}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
      />
      <View style={styles.scanOverlay}>
        {/* ヘッダー */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>CHECK IN</Text>
          <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()} activeOpacity={0.7}>
            <SvgXml xml={closeSvg} width={32} height={32} />
          </TouchableOpacity>
        </View>

        {/* スキャンエリア */}
        <View style={styles.scanCenter}>
          <View style={styles.qrFrame}>
            <SvgXml xml={qrSvg} width={128} height={128} />
          </View>
          <View style={styles.instructionBox}>
            <Text style={styles.instruction}>会場のQRコードを読み取ってください</Text>
            {processing && (
              <View style={styles.processingRow}>
                <ActivityIndicator color="rgba(255,255,255,0.7)" size="small" />
                <Text style={styles.processingText}>処理中...</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#222',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 56 : 40,
    paddingHorizontal: 20,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  headerTitle: {
    fontFamily: Platform.OS === 'ios' ? 'AvenirNextCondensed-Regular' : 'sans-serif-condensed',
    fontSize: 24,
    color: '#fff',
    letterSpacing: 1,
    lineHeight: 32,
    flex: 1,
    textAlign: 'center',
  },
  closeBtn: {
    position: 'absolute',
    right: 20,
    top: Platform.OS === 'ios' ? 56 : 40,
  },
  scanOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'space-between',
  },
  scanCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 32,
  },
  qrFrame: {
    width: 256,
    height: 256,
    borderRadius: 16,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  instructionBox: {
    alignItems: 'center',
    gap: 12,
    width: 326,
  },
  instruction: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
    lineHeight: 28,
    letterSpacing: -0.44,
  },
  processingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  processingText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
  },
  errorText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 40,
  },
  backButton: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 60,
    paddingHorizontal: 32,
    paddingVertical: 12,
  },
  backText: {
    color: '#fff',
    fontSize: 16,
  },
  successBody: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successText: {
    color: '#fff',
    fontSize: 27,
    letterSpacing: -0.44,
    lineHeight: 41,
    textAlign: 'center',
  },
  successBottom: {
    paddingHorizontal: 24,
    paddingBottom: 48,
    alignItems: 'center',
    gap: 36,
  },
  successImage: {
    width: '100%',
    height: 200,
  },
  closeWhiteBtn: {
    width: 230,
    backgroundColor: '#fff',
    borderRadius: 60,
    paddingVertical: 12,
    alignItems: 'center',
  },
  closeWhiteBtnText: {
    color: '#222',
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: -0.3,
  },
});
