import { View, Text, TouchableOpacity, StyleSheet, ViewStyle, Platform } from 'react-native';
import { fonts } from '@/lib/fonts';
import { IcEdit } from '@/components/icons';

type InfoRowProps = {
  label: string;
  value: string;
};

function InfoRow({ label, value }: InfoRowProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

type Props = {
  memberNumber?: string;
  nickname?: string;
  email?: string;
  onEdit?: () => void;
  style?: ViewStyle;
};

export default function UserInfoCard({
  memberNumber = '',
  nickname = '',
  email = '',
  onEdit,
  style,
}: Props) {
  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity style={styles.editButton} onPress={onEdit}>
        <IcEdit size={16} color="#fff" />
        <Text style={styles.editLabel}>変更</Text>
      </TouchableOpacity>
      <InfoRow label="会員番号" value={memberNumber} />
      <InfoRow label="ニックネーム" value={nickname} />
      <InfoRow label="メールアドレス" value={email} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 10,
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 16,
    alignItems: 'flex-end',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  editLabel: {
    ...fonts.jpRegular,
    fontFamily: Platform.select({
      ios: 'AvenirNext-Regular',
      android: 'NotoSansMono_400Regular',
      default: "'Avenir Next', 'Noto Sans Mono', 'Noto Sans JP', sans-serif",
    }),
    fontSize: 14,
    lineHeight: 14,
    color: '#fff',
  },
  row: {
    gap: 6,
    width: '100%',
  },
  rowLabel: {
    ...fonts.jpRegular,
    fontFamily: Platform.select({
      ios: 'AvenirNext-Regular',
      android: 'NotoSansMono_400Regular',
      default: "'Avenir Next', 'Noto Sans Mono', 'Noto Sans JP', sans-serif",
    }),
    fontSize: 11,
    color: '#fff',
    letterSpacing: -0.44,
  },
  rowValue: {
    ...fonts.jpRegular,
    fontFamily: Platform.select({
      ios: 'AvenirNext-Regular',
      android: 'NotoSansMono_400Regular',
      default: "'Avenir Next', 'Noto Sans Mono', 'Noto Sans JP', sans-serif",
    }),
    fontSize: 14,
    color: '#fff',
  },
});
