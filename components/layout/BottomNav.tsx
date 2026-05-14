import { View, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import IcHome, { NavIconVariant } from '@/components/icons/IcHome';
import IcLive from '@/components/icons/IcLive';
import IcDiary from '@/components/icons/IcDiary';
import IcNazo from '@/components/icons/IcNazo';
import IcMusic from '@/components/icons/IcMusic';
import { Colors } from '@/constants/colors';

export type NavTab = 'home' | 'live' | 'diary' | 'nazo' | 'music';

type NavItem = {
  key: NavTab;
  Icon: React.ComponentType<{ size?: number; color?: string; variant?: NavIconVariant }>;
};

const NAV_ITEMS: NavItem[] = [
  { key: 'home', Icon: IcHome },
  { key: 'live', Icon: IcLive },
  { key: 'diary', Icon: IcDiary },
  { key: 'nazo', Icon: IcNazo },
  { key: 'music', Icon: IcMusic },
];

type Props = {
  activeTab?: NavTab;
  onTabPress?: (tab: NavTab) => void;
  style?: ViewStyle;
};

export default function BottomNav({ activeTab = 'home', onTabPress, style }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }, style]}>
      {NAV_ITEMS.map(({ key, Icon }) => {
        const isActive = activeTab === key;
        return (
          <TouchableOpacity
            key={key}
            style={styles.item}
            onPress={() => onTabPress?.(key)}
            activeOpacity={0.7}
          >
            <Icon size={32} color={Colors.textSecondary} variant={isActive ? 'color' : 'regular'} />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: '#efefef',
    paddingHorizontal: 32,
    minHeight: 64,
  },
  item: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
  },
});
