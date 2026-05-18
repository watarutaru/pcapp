import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { fonts } from '@/lib/fonts';
import { FanclubLogo } from '@/components/icons';

type Props = {
  memberNumber?: string;
  nickname?: string;
  style?: ViewStyle;
};

export default function MembershipCard({ memberNumber = '', nickname = '', style }: Props) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <Text style={styles.memberNumber}>{memberNumber}</Text>
        <Text style={styles.nickname}>{nickname}</Text>
      </View>
      <View style={styles.logoArea}>
        <FanclubLogo width="100%" height="100%" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    paddingTop: 12,
    paddingHorizontal: 24,
    paddingBottom: 0,
  },
  memberNumber: {
    ...fonts.regular,
    fontSize: 12,
    color: '#222',
    lineHeight: 20,
    letterSpacing: 0.2,
  },
  nickname: {
    ...fonts.jpBold,
    fontSize: 20,
    color: '#222',
    lineHeight: 28,
  },
  logoArea: {
    aspectRatio: 350 / 169,
    overflow: 'hidden',
  },
});
