import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator,
  ScrollView,
} from 'react-native';
import { CameraView, Camera } from 'expo-camera';
import { getLives, checkinToLive } from '@/lib/lives';
import { addPoints, getProfile } from '@/lib/profiles';
import { Live } from '@/lib/types';
import { Colors } from '@/constants/colors';

type Step = 'scan' | 'select_live' | 'done';

export default function AdminScreen() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [step, setStep] = useState<Step>('scan');
  const [scannedUserId, setScannedUserId] = useState<string | null>(null);
  const [lives, setLives] = useState<Live[]>([]);
  const [processing, setProcessing] = useState(false);
  const [livesLoading, setLivesLoading] = useState(false);

  useEffect(() => {
    Camera.requestCameraPermissionsAsync().then(({ status }) => {
      setHasPermission(status === 'granted');
    });
  }, []);

  async function handleBarCodeScanned({ data }: { data: string }) {
    if (step !== 'scan' || processing) return;
    setProcessing(true);

    const userId = data.trim();
    if (!userId) {
      Alert.alert('エラー', '無効なQRコードです');
      setProcessing(false);
      return;
    }

    // スキャンされたIDのプロフィールが存在するか確認
    const profile = await getProfile(userId);
    if (!profile) {
      Alert.alert('エラー', '会員が見つかりません', [
        { text: 'OK', onPress: () => setProcessing(false) },
      ]);
      return;
    }

    setScannedUserId(userId);
    setLivesLoading(true);
    const liveList = await getLives();
    setLives(liveList);
    setLivesLoading(false);
    setStep('select_live');
    setProcessing(false);
  }

  async function handleSelectLive(live: Live) {
    if (!scannedUserId) return;
    setProcessing(true);
    try {
      const profile = await getProfile(scannedUserId);
      const isNew = await checkinToLive(scannedUserId, live.id);

      if (!isNew) {
        Alert.alert(
          'チェックイン済み',
          `${profile?.nickname ?? '会員'} はすでに\n${live.title}\nにチェックイン済みです`,
          [{ text: 'OK', onPress: () => resetScan() }],
        );
        return;
      }

      await addPoints(scannedUserId, 50, `ライブ参戦: ${live.title}`);
      const updatedProfile = await getProfile(scannedUserId);
      Alert.alert(
        'チェックイン完了！',
        `${updatedProfile?.nickname ?? '会員'}\n\n${live.title}\n50ポイントを付与しました\n合計: ${updatedProfile?.total_points ?? '?'}pt`,
        [{ text: 'OK', onPress: () => resetScan() }],
      );
    } catch (e) {
      Alert.alert('エラー', e instanceof Error ? e.message : 'エラーが発生しました', [
        { text: 'OK', onPress: () => setProcessing(false) },
      ]);
    }
  }

  function resetScan() {
    setScannedUserId(null);
    setLives([]);
    setStep('scan');
    setProcessing(false);
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
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {step === 'scan' && (
        <CameraView
          style={styles.camera}
          onBarcodeScanned={processing ? undefined : handleBarCodeScanned}
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        >
          <View style={styles.overlay}>
            <View style={styles.topBar}>
              <Text style={styles.adminLabel}>管理者モード</Text>
            </View>
            <Text style={styles.instruction}>会員証QRコードを読み取ってください</Text>
            <View style={styles.scanFrame}>
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
            </View>
            {processing && (
              <View style={styles.processingBadge}>
                <ActivityIndicator color="#fff" size="small" />
                <Text style={styles.processingText}>確認中...</Text>
              </View>
            )}
          </View>
        </CameraView>
      )}

      {step === 'select_live' && (
        <View style={styles.selectContainer}>
          <View style={styles.selectHeader}>
            <Text style={styles.selectTitle}>ライブを選択</Text>
            <Text style={styles.selectSub}>チェックインするライブを選んでください</Text>
          </View>

          {livesLoading ? (
            <ActivityIndicator color={Colors.primary} size="large" style={{ marginTop: 40 }} />
          ) : (
            <ScrollView style={styles.liveList}>
              {lives.map(live => (
                <TouchableOpacity
                  key={live.id}
                  style={styles.liveItem}
                  onPress={() => handleSelectLive(live)}
                  disabled={processing}
                >
                  <View style={styles.liveInfo}>
                    <Text style={styles.liveTitle}>{live.title}</Text>
                    <Text style={styles.liveDate}>
                      {new Date(live.date).toLocaleDateString('ja-JP', {
                        year: 'numeric', month: 'long', day: 'numeric',
                      })}
                    </Text>
                    <Text style={styles.liveVenue}>{live.venue}</Text>
                  </View>
                  {processing ? (
                    <ActivityIndicator color={Colors.primary} size="small" />
                  ) : (
                    <Text style={styles.liveArrow}>+50pt →</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          <TouchableOpacity style={styles.cancelButton} onPress={resetScan}>
            <Text style={styles.cancelText}>キャンセル（スキャンに戻る）</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const CORNER_SIZE = 28;
const CORNER_THICKNESS = 3;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    backgroundColor: Colors.background,
  },
  errorText: {
    color: Colors.textSecondary, fontSize: 16, textAlign: 'center', paddingHorizontal: 40,
  },
  camera: { flex: 1 },
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center',
  },
  topBar: {
    position: 'absolute', top: 60, left: 24, right: 24,
    alignItems: 'center',
  },
  adminLabel: {
    color: Colors.primary, fontSize: 14, fontWeight: '700',
    backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 16, paddingVertical: 6,
    borderRadius: 20, overflow: 'hidden',
  },
  instruction: {
    color: '#fff', fontSize: 15, marginBottom: 40, textAlign: 'center', paddingHorizontal: 40,
  },
  scanFrame: { width: 240, height: 240, position: 'relative' },
  corner: {
    position: 'absolute', width: CORNER_SIZE, height: CORNER_SIZE, borderColor: Colors.primary,
  },
  topLeft: { top: 0, left: 0, borderTopWidth: CORNER_THICKNESS, borderLeftWidth: CORNER_THICKNESS },
  topRight: { top: 0, right: 0, borderTopWidth: CORNER_THICKNESS, borderRightWidth: CORNER_THICKNESS },
  bottomLeft: { bottom: 0, left: 0, borderBottomWidth: CORNER_THICKNESS, borderLeftWidth: CORNER_THICKNESS },
  bottomRight: { bottom: 0, right: 0, borderBottomWidth: CORNER_THICKNESS, borderRightWidth: CORNER_THICKNESS },
  processingBadge: {
    marginTop: 40, flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: 20, paddingHorizontal: 20, paddingVertical: 10,
  },
  processingText: { color: '#fff', fontSize: 14, marginLeft: 8 },
  selectContainer: { flex: 1, backgroundColor: Colors.background },
  selectHeader: { paddingTop: 60, paddingHorizontal: 24, paddingBottom: 16 },
  selectTitle: { fontSize: 22, fontWeight: 'bold', color: Colors.text, marginBottom: 4 },
  selectSub: { fontSize: 14, color: Colors.textSecondary },
  liveList: { flex: 1, paddingHorizontal: 24 },
  liveItem: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface, borderRadius: 16, padding: 16,
    marginBottom: 12, borderWidth: 1, borderColor: Colors.border,
  },
  liveInfo: { flex: 1 },
  liveTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 4 },
  liveDate: { fontSize: 13, color: Colors.textSecondary, marginBottom: 2 },
  liveVenue: { fontSize: 12, color: Colors.textSecondary },
  liveArrow: { color: Colors.primary, fontSize: 14, fontWeight: '700' },
  cancelButton: {
    margin: 24, borderWidth: 1, borderColor: Colors.border,
    borderRadius: 16, paddingVertical: 16, alignItems: 'center',
  },
  cancelText: { color: Colors.textSecondary, fontSize: 14 },
});
