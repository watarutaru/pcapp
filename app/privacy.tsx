import { fonts } from '@/lib/fonts';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';
import Header from '@/components/layout/Header';

type Section = {
  title: string;
  body: (string | { type: 'list'; items: string[] })[];
};

const SECTIONS: Section[] = [
  {
    title: '1. 取得する情報',
    body: [
      '本アプリでは、以下の情報を取得する場合があります。',
      {
        type: 'list',
        items: [
          'メールアドレス',
          'ニックネーム',
          'ログイン情報',
          '利用状況に関する情報',
          '端末情報およびアクセス情報',
        ],
      },
    ],
  },
  {
    title: '2. 利用目的',
    body: [
      '取得した情報は、以下の目的で利用します。',
      {
        type: 'list',
        items: [
          '本アプリの提供および運営',
          'ログイン認証',
          '会員情報の管理',
          'お問い合わせ対応',
          '不正利用防止',
          'サービス改善',
        ],
      },
    ],
  },
  {
    title: '3. 外部サービスについて',
    body: [
      '本アプリでは、サービス運営およびデータ管理のために Supabase を利用する場合があります。',
    ],
  },
  {
    title: '4. 情報の管理',
    body: [
      '運営は、取得した情報について、不正アクセス、漏えい、紛失等を防止するため、合理的な範囲で適切な管理を行います。',
    ],
  },
  {
    title: '5. 第三者提供',
    body: [
      '運営は、法令に基づく場合を除き、ユーザー情報を本人の同意なく第三者へ提供しません。',
    ],
  },
  {
    title: '6. アカウント削除について',
    body: [
      'ユーザーが退会を希望する場合、運営指定の窓口より削除依頼を行うことができます。',
      '削除後、一部情報は復元できない場合があります。',
    ],
  },
  {
    title: '7. ポリシー変更',
    body: [
      '本ポリシーは、必要に応じて変更される場合があります。',
      '変更後の内容は、本アプリまたは関連サイトへ掲載した時点で効力を生じます。',
    ],
  },
  {
    title: '8. お問い合わせ',
    body: [
      'Piercing Cyclone運営チーム',
      'メールアドレス：piercingcyclone@gmail.com',
    ],
  },
];

export default function PrivacyScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Header
        title="PRIVACY POLICY"
        variant="regular"
        showBack
        onBack={() => router.back()}
      />

      <View style={styles.card}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.lead}>
            Piercing Cyclone運営チームは、ユーザーのプライバシーを尊重し、以下の方針に基づき個人情報を取り扱います。
          </Text>

          {SECTIONS.map((section) => (
            <View key={section.title} style={styles.section}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              {section.body.map((block, i) => {
                if (typeof block === 'string') {
                  return (
                    <Text key={i} style={styles.bodyText}>
                      {block}
                    </Text>
                  );
                }
                return (
                  <View key={i} style={styles.list}>
                    {block.items.map((item, j) => (
                      <View key={j} style={styles.listItem}>
                        <Text style={styles.bullet}>・</Text>
                        <Text style={[styles.bodyText, styles.listText]}>{item}</Text>
                      </View>
                    ))}
                  </View>
                );
              })}
            </View>
          ))}

          <View style={styles.footer}>
            <Text style={styles.footerText}>制定日：2026年4月9日</Text>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  card: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 56,
    gap: 28,
  },
  lead: {
    ...fonts.jpLight,
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    ...fonts.jpBold,
    fontSize: 14,
    color: Colors.text,
    lineHeight: 22,
  },
  bodyText: {
    ...fonts.jpLight,
    fontSize: 13,
    color: Colors.text,
    lineHeight: 22,
  },
  list: {
    gap: 6,
  },
  listItem: {
    flexDirection: 'row',
  },
  bullet: {
    ...fonts.jpLight,
    fontSize: 13,
    color: Colors.text,
    lineHeight: 22,
  },
  listText: {
    flex: 1,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 20,
  },
  footerText: {
    ...fonts.jpLight,
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
});
