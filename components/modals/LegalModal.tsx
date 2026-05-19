import { fonts } from '@/lib/fonts';
import { Modal, View, Text, StyleSheet, ScrollView } from 'react-native';
import { Colors } from '@/constants/colors';
import Header from '@/components/layout/Header';

type Section = {
  title: string;
  body: (string | { type: 'list'; items: string[] })[];
};

const TERMS_SECTIONS: Section[] = [
  {
    title: '第1条（適用）',
    body: [
      'Piercing Cyclone運営チーム（以下「運営」といいます。）が提供する「Piercing Cyclone Official App」（以下「本アプリ」といいます。）の利用条件を定めるものです。',
      'ユーザーは、本規約に同意のうえ、本アプリを利用するものとします。',
    ],
  },
  {
    title: '第2条（本アプリについて）',
    body: [
      '本アプリは、Piercing Cycloneに関する会員情報、ライブ情報、コンテンツ、謎解き企画等を提供するファンクラブ向け公式アプリです。',
      '運営は、必要に応じて本アプリの内容を変更、追加、停止または終了できるものとします。',
    ],
  },
  {
    title: '第3条（アカウント）',
    body: [
      'ユーザーは、メールアドレスおよびパスワードを用いて本アプリのアカウントを作成するものとします。',
      'ユーザーは、自己の責任においてアカウント情報を管理するものとし、第三者への貸与、譲渡、共有をしてはなりません。',
    ],
  },
  {
    title: '第4条（禁止事項）',
    body: [
      'ユーザーは、本アプリの利用にあたり、以下の行為を行ってはなりません。',
      {
        type: 'list',
        items: [
          '法令または公序良俗に違反する行為',
          '他者になりすます行為',
          'アカウントを第三者へ貸与または共有する行為',
          '本アプリの運営を妨害する行為',
          '本アプリのシステムへ不正にアクセスする行為',
          '本アプリの解析、逆コンパイル、リバースエンジニアリング等の行為',
          '謎解きコンテンツの解答、ネタバレ、攻略情報等を無断転載または公開する行為',
          'その他、運営が不適切と判断する行為',
        ],
      },
    ],
  },
  {
    title: '第5条（会員証・ポイント）',
    body: [
      '本アプリ内で表示される会員証は、本人確認またはスタッフ確認の目的で利用される場合があります。',
      '本アプリ内のポイントは、利用状況等を示す実績機能であり、金銭的価値を有するものではありません。',
      'ポイントは、現金との交換・第三者への譲渡・換金を行うことはできません。',
      '退会またはアカウント削除時には、ポイントその他の利用情報は失効する場合があります。',
    ],
  },
  {
    title: '第6条（知的財産権）',
    body: [
      '本アプリ内に掲載される文章、画像、音声、映像、デザイン、謎解きコンテンツその他一切の情報に関する権利は、運営または正当な権利者に帰属します。',
      'ユーザーによるスクリーンショットやSNS投稿は原則として可能ですが、謎解きの解答や重大なネタバレの公開は禁止します。',
    ],
  },
  {
    title: '第7条（利用停止）',
    body: [
      '運営は、ユーザーが本規約に違反した場合、または運営上問題があると判断した場合、事前の通知なくアカウント停止または利用制限を行うことができます。',
    ],
  },
  {
    title: '第8条（退会）',
    body: [
      'ユーザーが退会を希望する場合は、運営指定のお問い合わせ窓口へ連絡するものとします。',
      '退会に伴い、ポイントその他の利用データが削除される場合があります。',
    ],
  },
  {
    title: '第9条（免責）',
    body: [
      '運営は、本アプリの内容について、完全性、正確性、継続性、有用性等を保証するものではありません。',
      '運営は、本アプリの利用または利用不能によりユーザーに生じた損害について、運営に故意または重過失がある場合を除き、責任を負いません。',
    ],
  },
  {
    title: '第10条（規約変更）',
    body: [
      '運営は、必要に応じて本規約を変更できるものとします。',
      '変更後の規約は、本アプリまたは関連サイトへ掲載した時点から効力を生じるものとします。',
    ],
  },
  {
    title: '第11条（準拠法・管轄）',
    body: [
      '本規約は日本法に準拠します。',
      '本アプリに関して紛争が生じた場合、東京地方裁判所を第一審の専属的合意管轄裁判所とします。',
    ],
  },
  {
    title: '第12条（お問い合わせ）',
    body: [
      'Piercing Cyclone運営チーム',
      'メールアドレス：piercingcyclone@gmail.com',
    ],
  },
];

const PRIVACY_SECTIONS: Section[] = [
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

const CONTENT = {
  terms: {
    title: 'TERMS OF SERVICE',
    lead: '本利用規約（以下「本規約」といいます。）は、以下の条件を定めるものです。',
    sections: TERMS_SECTIONS,
    footerText: '制定日：2026年4月9日',
  },
  privacy: {
    title: 'PRIVACY POLICY',
    lead: 'Piercing Cyclone運営チームは、ユーザーのプライバシーを尊重し、以下の方針に基づき個人情報を取り扱います。',
    sections: PRIVACY_SECTIONS,
    footerText: '制定日：2026年4月9日',
  },
};

type Props = {
  visible: boolean;
  onClose: () => void;
  type: 'terms' | 'privacy';
};

export default function LegalModal({ visible, onClose, type }: Props) {
  const { title, lead, sections, footerText } = CONTENT[type];

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <Header
          title={title}
          variant="regular"
          showBack={false}
          showClose
          onClose={onClose}
        />

        <View style={styles.card}>
          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.lead}>{lead}</Text>

            {sections.map((section) => (
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
              <Text style={styles.footerText}>{footerText}</Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
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
