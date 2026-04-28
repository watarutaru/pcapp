import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import { CameraView, Camera } from 'expo-camera';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { checkinToLive, getLive } from '@/lib/lives';
import { addPoints, getProfile } from '@/lib/profiles';
import { Colors } from '@/constants/colors';

export default function QrCheckinScreen() {
  const router = useRouter();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [processing, setProcessing] = useState(false);

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
      // QRコードのデータ形式: {"live_id": "uuid"}
      let liveId: string;
      try {
        const parsed = JSON.parse(data);
        liveId = parsed.live_id;
      } catch {
        // プレーンなUUIDの場合
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

      await checkinToLive(user.id, liveId);
      await addPoints(user.id, 50, `ライブ参戦: ${live.title}`);

      const profile = await getProfile(user.id);

      Alert.alert(
        'チェックイン完了！🎉',
        `${live.title}\n\n50ポイントを獲得しました！\n合計: ${profile?.total_points ?? '?'}pt`,
        [{ text: 'OK', onPress: () => router.back() }],
      );
    } catch (e) {
      Alert.alert('エラー', e instanceof Error ? e.message : 'エラーが発生しました', [
        { text: 'OK', onPress: () => setScanned(false) },
      ]);
    } finally {
      setProcessing(false);
    }
  }

  if (hasPermission === null) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  if (!hasPermission) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>カメラへのアクセスが許可されていません</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backText}>戻る</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
      >
        <View style={styles.overlay}>
          <View style={styles.topBar}>
            <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕ 閉じる</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.instruction}>ライブのQRコードを読み取ってください</Text>

          <View style={styles.scanFrame}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>

          {processing && (
            <View style={styles.processingBadge}>
              <ActivityIndicator color="#fff" size="small" />
              <Text style={styles.processingText}>処理中...</Text>
            </View>
          )}
        </View>
      </CameraView>
    </View>
  );
}

const CORNER_SIZE = 28;
const CORNER_THICKNESS = 3;
const CORNER_COLOR = Colors.primary;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    backgroundColor: Colors.background,
  },
  errorText: { color: Colors.textSecondary, fontSize: 16, textAlign: 'center', marginBottom: 20, paddingHorizontal: 40 },
  backButton: {
    backgroundColor: Colors.primary, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12,
  },
  backText: { color: '#fff', fontSize: 16 },
  camera: { flex: 1 },
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center',
  },
  topBar: {
    position: 'absolute', top: 60, left: 24, right: 24,
    flexDirection: 'row', justifyContent: 'flex-end',
  },
  closeBtn: {
    backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8,
  },
  closeBtnText: { color: '#fff', fontSize: 14 },
  instruction: {
    color: '#fff', fontSize: 15, marginBottom: 40, textAlign: 'center',
    paddingHorizontal: 40,
  },
  scanFrame: {
    width: 240, height: 240, position: 'relative',
  },
  corner: {
    position: 'absolute', width: CORNER_SIZE, height: CORNER_SIZE,
    borderColor: CORNER_COLOR,
  },
  topLeft: {
    top: 0, left: 0,
    borderTopWidth: CORNER_THICKNESS, borderLeftWidth: CORNER_THICKNESS,
  },
  topRight: {
    top: 0, right: 0,
    borderTopWidth: CORNER_THICKNESS, borderRightWidth: CORNER_THICKNESS,
  },
  bottomLeft: {
    bottom: 0, left: 0,
    borderBottomWidth: CORNER_THICKNESS, borderLeftWidth: CORNER_THICKNESS,
  },
  bottomRight: {
    bottom: 0, right: 0,
    borderBottomWidth: CORNER_THICKNESS, borderRightWidth: CORNER_THICKNESS,
  },
  processingBadge: {
    marginTop: 40, flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: 20, paddingHorizontal: 20, paddingVertical: 10,
  },
  processingText: { color: '#fff', fontSize: 14, marginLeft: 8 },
});
