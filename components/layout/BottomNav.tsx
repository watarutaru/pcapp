import { View, TouchableOpacity, StyleSheet, ViewStyle, Text } from 'react-native';
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
  badges?: Partial<Record<NavTab, number>>;
  style?: ViewStyle;
};

export default function BottomNav({ activeTab = 'home', onTabPress, badges, style }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }, style]}>
      {NAV_ITEMS.map(({ key, Icon }) => {
        const isActive = activeTab === key;
        const badgeCount = badges?.[key] ?? 0;
        return (
          <TouchableOpacity
            key={key}
            style={styles.item}
            onPress={() => onTabPress?.(key)}
            activeOpacity={0.7}
          >
            <View style={styles.iconWrapper}>
              <Icon size={32} color={Colors.textSecondary} variant={isActive ? 'color' : 'regular'} />
              {badgeCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{badgeCount > 99 ? '99+' : badgeCount}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: '#efefef',
    paddingHorizontal: 32,
    paddingTop: 16,
  },
  item: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  iconWrapper: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: Colors.error,
    borderRadius: 10,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
});
