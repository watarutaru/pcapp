import { Platform } from 'react-native';

// フォール優先順位: Avenir Next > Lato > Noto Sans JP
// iOS   : Avenir Next（システムフォント）
// Android: Lato（ロード済み）
// Web   : CSS フォールバックスタック（Noto Sans JP で日本語をカバー）

const WEB_STACK = "'Avenir Next', 'AvenirNext-Regular', Lato, 'Noto Sans JP', sans-serif";
const WEB_STACK_MED = "'Avenir Next', 'AvenirNext-Medium', Lato, 'Noto Sans JP', sans-serif";
const WEB_STACK_BOLD = "'Avenir Next', 'AvenirNext-Bold', Lato, 'Noto Sans JP', sans-serif";
const WEB_STACK_HEAVY = "'Avenir Next', 'AvenirNext-Heavy', Lato, 'Noto Sans JP', sans-serif";
const WEB_CONDENSED = "'Avenir Next Condensed', 'AvenirNextCondensed-Regular', Lato, 'Noto Sans JP', sans-serif";
const WEB_CONDENSED_MED = "'Avenir Next Condensed', 'AvenirNextCondensed-Medium', Lato, 'Noto Sans JP', sans-serif";
const WEB_CONDENSED_BOLD = "'Avenir Next Condensed', 'AvenirNextCondensed-Bold', Lato, 'Noto Sans JP', sans-serif";

export const fonts = {
  // --- Avenir Next Condensed（見出し・タイトル）---
  condensed: Platform.select({
    ios: 'AvenirNextCondensed-Regular',
    android: 'Lato_400Regular',
    default: WEB_CONDENSED,
  })!,
  condensedMedium: Platform.select({
    ios: 'AvenirNextCondensed-Medium',
    android: 'Lato_700Bold',
    default: WEB_CONDENSED_MED,
  })!,
  condensedBold: Platform.select({
    ios: 'AvenirNextCondensed-Bold',
    android: 'Lato_900Black',
    default: WEB_CONDENSED_BOLD,
  })!,

  // --- Avenir Next（本文・UI テキスト）---
  regular: Platform.select({
    ios: 'AvenirNext-Regular',
    android: 'Lato_400Regular',
    default: WEB_STACK,
  })!,
  medium: Platform.select({
    ios: 'AvenirNext-Medium',
    android: 'Lato_700Bold',
    default: WEB_STACK_MED,
  })!,
  heavy: Platform.select({
    ios: 'AvenirNext-Heavy',
    android: 'Lato_900Black',
    default: WEB_STACK_HEAVY,
  })!,

  // --- jp* キー: 同一フォントスタックにエイリアス ---
  // Avenir Next / Lato が日本語文字のフォールバックをOS側で処理する。
  // Noto Sans JP との混在によるメトリクス差異を防ぐため統一している。
  jpLight: Platform.select({
    ios: 'AvenirNext-Regular',
    android: 'Lato_300Light',
    default: WEB_STACK,
  })!,
  jpRegular: Platform.select({
    ios: 'AvenirNext-Regular',
    android: 'Lato_400Regular',
    default: WEB_STACK,
  })!,
  jpBold: Platform.select({
    ios: 'AvenirNext-Bold',
    android: 'Lato_700Bold',
    default: WEB_STACK_BOLD,
  })!,
  jpBlack: Platform.select({
    ios: 'AvenirNext-Heavy',
    android: 'Lato_900Black',
    default: WEB_STACK_HEAVY,
  })!,
};
