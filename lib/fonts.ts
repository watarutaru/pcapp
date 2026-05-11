import { Platform } from 'react-native';

export const fonts = {
  // Avenir Next Condensed 系（英字タイトル・見出し）
  condensed: Platform.select({
    ios: 'AvenirNextCondensed-Regular',
    android: 'Lato_400Regular',
    default: "'AvenirNextCondensed-Regular', 'Avenir Next Condensed', 'Lato_400Regular', sans-serif",
  })!,
  condensedMedium: Platform.select({
    ios: 'AvenirNextCondensed-Medium',
    android: 'Lato_700Bold',
    default: "'AvenirNextCondensed-Medium', 'Avenir Next Condensed', 'Lato_700Bold', sans-serif",
  })!,
  condensedBold: Platform.select({
    ios: 'AvenirNextCondensed-Bold',
    android: 'Lato_900Black',
    default: "'AvenirNextCondensed-Bold', 'Avenir Next Condensed', 'Lato_900Black', sans-serif",
  })!,

  // Avenir 系（英字本文）
  regular: Platform.select({
    ios: 'Avenir',
    android: 'Lato_400Regular',
    default: "Avenir, 'Lato_400Regular', sans-serif",
  })!,
  medium: Platform.select({
    ios: 'Avenir-Medium',
    android: 'Lato_700Bold',
    default: "'Avenir-Medium', Avenir, 'Lato_700Bold', sans-serif",
  })!,
  heavy: Platform.select({
    ios: 'Avenir-Heavy',
    android: 'Lato_900Black',
    default: "'Avenir-Heavy', Avenir, 'Lato_900Black', sans-serif",
  })!,

  // Hiragino Sans 系（日本語）
  jpLight: Platform.select({
    ios: 'HiraginoSans-W3',
    android: 'Lato_300Light',
    default: "'HiraginoSans-W3', 'Hiragino Sans', 'Lato_300Light', sans-serif",
  })!,
  jpRegular: Platform.select({
    ios: 'HiraginoSans-W5',
    android: 'Lato_400Regular',
    default: "'HiraginoSans-W5', 'Hiragino Sans', 'Lato_400Regular', sans-serif",
  })!,
  jpBold: Platform.select({
    ios: 'HiraginoSans-W6',
    android: 'Lato_700Bold',
    default: "'HiraginoSans-W6', 'Hiragino Sans', 'Lato_700Bold', sans-serif",
  })!,
  jpBlack: Platform.select({
    ios: 'HiraginoSans-W7',
    android: 'Lato_900Black',
    default: "'HiraginoSans-W7', 'Hiragino Sans', 'Lato_900Black', sans-serif",
  })!,
};
