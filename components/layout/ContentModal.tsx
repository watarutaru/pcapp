import { useEffect, useRef, useState } from 'react';
import {
  Modal, View, StyleSheet, TouchableOpacity, ScrollView,
  Animated, Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import IcClose from '@/components/icons/IcClose';
import ModalBottomNav from './ModalBottomNav';
import { Colors } from '@/constants/colors';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// Header component: paddingVertical=24*2 + inner height=32
const HEADER_HEIGHT = 80;

type Props = {
  visible: boolean;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
  children: React.ReactNode;
};

export default function ContentModal({
  visible, onClose, onPrev, onNext, hasPrev = false, hasNext = false, children,
}: Props) {
  const [modalVisible, setModalVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (visible) {
      setModalVisible(true);
      slideAnim.setValue(SCREEN_HEIGHT);
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        damping: 22,
        stiffness: 280,
        mass: 0.9,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 260,
        useNativeDriver: true,
      }).start(() => {
        setModalVisible(false);
      });
    }
  }, [visible]);

  return (
    <Modal
      visible={modalVisible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Animated.View
        style={[styles.container, { transform: [{ translateY: slideAnim }] }]}
      >
        <View style={{ height: insets.top + HEADER_HEIGHT }} />

        <View style={styles.card}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <IcClose size={36} variant="circle" />
          </TouchableOpacity>

          <ScrollView
            contentContainerStyle={styles.cardContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </ScrollView>
        </View>

        <ModalBottomNav
          onPrev={hasPrev ? onPrev : undefined}
          onNext={hasNext ? onNext : undefined}
        />
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 16,
    overflow: 'hidden',
  },
  closeButton: {
    alignSelf: 'flex-end',
    marginRight: 24,
    marginBottom: 24,
  },
  cardContent: {
    paddingHorizontal: 24,
    paddingBottom: 48,
    gap: 24,
  },
});
