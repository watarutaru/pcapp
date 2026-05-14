import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useState } from 'react';
import { fonts } from '@/lib/fonts';
import { FanclubLogo } from '@/components/icons';

type Props = {
  memberNumber?: string;
  nickname?: string;
  style?: ViewStyle;
};

// SVG viewBox is 350×169; the original card showed 155px tall (bottom 14px clipped)
const LOGO_VISIBLE_RATIO = 155 / 350;
const LOGO_FULL_RATIO = 169 / 350;

export default function MembershipCard({ memberNumber = '', nickname = '', style }: Props) {
  const [logoWidth, setLogoWidth] = useState(350);

  return (
    <View style={[styles.container, style]}>
      <View style={styles.header}>
        <Text style={styles.memberNumber}>{memberNumber}</Text>
        <Text style={styles.nickname}>{nickname}</Text>
      </View>
      <View
        style={[styles.logoArea, { height: logoWidth * LOGO_VISIBLE_RATIO }]}
        onLayout={(e) => setLogoWidth(e.nativeEvent.layout.width)}
      >
        <FanclubLogo width={logoWidth} height={logoWidth * LOGO_FULL_RATIO} />
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
    fontFamily: fonts.regular,
    fontSize: 12,
    color: '#222',
    lineHeight: 20,
    letterSpacing: 0.2,
  },
  nickname: {
    fontFamily: fonts.jpBlack,
    fontSize: 24,
    color: '#222',
    lineHeight: 32,
  },
  logoArea: {
    overflow: 'hidden',
  },
});
