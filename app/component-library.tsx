import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { fonts } from '@/lib/fonts';

import Button from '@/components/ui/Button';
import ButtonText from '@/components/ui/ButtonText';
import Tag from '@/components/ui/Tag';
import Tab from '@/components/ui/Tab';
import ContentHeading from '@/components/ui/ContentHeading';
import HintAccordion from '@/components/ui/HintAccordion';
import LiveInformation from '@/components/ui/LiveInformation';
import Setlist from '@/components/ui/Setlist';

import LiveCard from '@/components/cards/LiveCard';
import DiaryCard from '@/components/cards/DiaryCard';
import NazoCard from '@/components/cards/NazoCard';
import MusicCard from '@/components/cards/MusicCard';
import MembershipCard from '@/components/cards/MembershipCard';
import UserInfoCard from '@/components/cards/UserInfoCard';

import Form from '@/components/form/Form';
import NazoInputForm from '@/components/form/NazoInputForm';

import StatusBlock from '@/components/home/StatusBlock';
import CheckinBlock from '@/components/home/CheckinBlock';

import Header from '@/components/layout/Header';
import BottomNav, { NavTab } from '@/components/layout/BottomNav';
import ModalBottomNav from '@/components/layout/ModalBottomNav';

import {
  IcHome, IcLive, IcDiary, IcNazo, IcMusic, IcAccount, IcClose,
  IcArrowLeft, IcArrow, IcCalendar, IcBicycle, IcSetlist, IcHint,
  IcHelp, IcEye, IcFace, IcEdit, IcLock, IcQR, IcWriterTmrr, IcWriterWataru,
} from '@/components/icons';

const SECTIONS = [
  'UI', 'Cards', 'Forms', 'Home', 'Layout', 'Icons',
] as const;

type Section = (typeof SECTIONS)[number];

// ─────────────── Shared ───────────────

function SectionTitle({ label }: { label: string }) {
  return (
    <View style={styles.sectionTitle}>
      <Text style={styles.sectionTitleText}>{label}</Text>
    </View>
  );
}

function StoryLabel({ label }: { label: string }) {
  return <Text style={styles.storyLabel}>{label}</Text>;
}

function StoryRow({ children }: { children: React.ReactNode }) {
  return <View style={styles.storyRow}>{children}</View>;
}

function Story({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.story}>
      <StoryLabel label={label} />
      {children}
    </View>
  );
}

// ─────────────── Sections ───────────────

function UiSection() {
  const [hintOpen, setHintOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'ALL' | 'SINGLE' | 'ALBUM'>('ALL');

  return (
    <>
      <SectionTitle label="Button" />
      <Story label="primary / secondary / white">
        <StoryRow>
          <Button label="PRIMARY" style={styles.flex1} />
          <Button label="SECONDARY" variant="secondary" style={styles.flex1} />
          <View style={[styles.flex1, styles.whiteBg]}>
            <Button label="WHITE" variant="white" />
          </View>
        </StoryRow>
      </Story>
      <Story label="loading / disabled">
        <StoryRow>
          <Button label="LOADING" loading style={styles.flex1} />
          <Button label="DISABLED" disabled style={styles.flex1} />
        </StoryRow>
      </Story>

      <SectionTitle label="ButtonText" />
      <Story label="default">
        <ButtonText label="テキストボタン" />
      </Story>

      <SectionTitle label="Tag" />
      <Story label="strong / primary / secondary">
        <StoryRow>
          <Tag label="STRONG" variant="strong" />
          <Tag label="PRIMARY" variant="primary" />
          <Tag label="SECONDARY" variant="secondary" />
        </StoryRow>
      </Story>

      <SectionTitle label="Tab" />
      <Story label="active / inactive">
        <StoryRow>
          {(['ALL', 'SINGLE', 'ALBUM'] as const).map((t) => (
            <Tab key={t} label={t} active={activeTab === t} onPress={() => setActiveTab(t)} />
          ))}
        </StoryRow>
      </Story>

      <SectionTitle label="ContentHeading" />
      <Story label="with icon / without icon">
        <ContentHeading label="SET LIST" icon={<IcSetlist size={24} color="#222" />} />
        <ContentHeading label="HEADING" style={{ marginTop: 8 }} />
      </Story>

      <SectionTitle label="HintAccordion" />
      <Story label={hintOpen ? 'open' : 'closed'}>
        <HintAccordion
          hint="これはヒントのテキストです。謎を解くための手がかりがここに表示されます。"
          open={hintOpen}
          onToggle={() => setHintOpen(!hintOpen)}
        />
      </Story>

      <SectionTitle label="LiveInformation" />
      <Story label="full">
        <LiveInformation
          venue="渋谷CLUB QUATTRO"
          time="OPEN 17:30 / START 18:00"
          ticket="¥3,500（税込）"
          performers="Piercing Cyclone"
        />
      </Story>

      <SectionTitle label="Setlist" />
      <Story label="default">
        <Setlist songs={['サイクロン', 'ピアシング', '嵐の夜に', 'last song']} />
      </Story>
    </>
  );
}

function CardsSection() {
  return (
    <>
      <SectionTitle label="LiveCard" />
      <Story label="upcoming">
        <LiveCard
          variant="upcoming"
          title="PIERCING CYCLONE TOUR 2025"
          date="2025.08.15"
          venue="渋谷CLUB QUATTRO"
          time="OPEN 17:30 / START 18:00"
          tag="NEXT"
        />
      </Story>
      <Story label="history">
        <LiveCard
          variant="history"
          title="PIERCING CYCLONE ONEMAN"
          date="2024.12.22"
          venue="下北沢SHELTER"
          tag="SOLD OUT"
        />
      </Story>

      <SectionTitle label="DiaryCard" />
      <Story label="default">
        <DiaryCard
          date="2025.05.10"
          writer="wataru"
          preview="今日は朝から音楽の話をしていたんだけど、やっぱり音楽って不思議だなと思って..."
        />
      </Story>

      <SectionTitle label="NazoCard" />
      <Story label="locked / unlocked">
        <NazoCard vol="VOL.01" title="最初の謎" locked />
        <NazoCard vol="VOL.02" title="解かれた謎" locked={false} style={{ marginTop: 8 }} />
      </Story>

      <SectionTitle label="MusicCard" />
      <Story label="default">
        <MusicCard title="サイクロン" type="Single" />
      </Story>

      <SectionTitle label="MembershipCard" />
      <Story label="default">
        <View style={styles.membershipWrapper}>
          <MembershipCard memberNumber="No. 000123" nickname="ファンの名前" />
        </View>
      </Story>

      <SectionTitle label="UserInfoCard" />
      <Story label="default (dark bg)">
        <View style={styles.darkBg}>
          <UserInfoCard
            memberNumber="No. 000123"
            nickname="ファンの名前"
            email="fan@example.com"
          />
        </View>
      </Story>
    </>
  );
}

function FormsSection() {
  const [text, setText] = useState('');

  return (
    <>
      <SectionTitle label="Form" />
      <Story label="regular">
        <Form label="メールアドレス" placeholder="email@example.com" />
      </Story>
      <Story label="password">
        <Form label="パスワード" variant="password" placeholder="••••••••" />
      </Story>
      <Story label="error">
        <Form
          label="メールアドレス"
          variant="error"
          value="wrong@"
          errorMessage="正しいメールアドレスを入力してください"
        />
      </Story>

      <SectionTitle label="NazoInputForm" />
      <Story label="default">
        <NazoInputForm value={text} onChangeText={setText} />
      </Story>
      <Story label="failure">
        <NazoInputForm variant="failure" />
      </Story>
      <Story label="success">
        <NazoInputForm variant="success" />
      </Story>
    </>
  );
}

function HomeSection() {
  return (
    <>
      <SectionTitle label="StatusBlock" />
      <Story label="default">
        <StatusBlock stage="SILVER" points={1250} />
      </Story>

      <SectionTitle label="CheckinBlock" />
      <Story label="default">
        <CheckinBlock />
      </Story>
    </>
  );
}

function LayoutSection() {
  const [activeNavTab, setActiveNavTab] = useState<NavTab>('home');

  return (
    <>
      <SectionTitle label="BottomNav" />
      <Story label="interactive — tap to switch active tab">
        <View style={styles.outlined}>
          <BottomNav activeTab={activeNavTab} onTabPress={setActiveNavTab} />
        </View>
      </Story>

      <SectionTitle label="Header" />
      <Story label="regular (back)">
        <View style={styles.outlined}>
          <Header title="LIVE DETAIL" showBack showClose={false} />
        </View>
      </Story>
      <Story label="regular (close)">
        <View style={styles.outlined}>
          <Header title="MY PAGE" showBack={false} showClose />
        </View>
      </Story>
      <Story label="white">
        <View style={[styles.outlined, styles.darkBg]}>
          <Header title="DIARY" variant="white" showBack />
        </View>
      </Story>

      <SectionTitle label="ModalBottomNav" />
      <Story label="default">
        <ModalBottomNav />
      </Story>
    </>
  );
}

function IconsSection() {
  const icons = [
    { name: 'IcHome', el: <IcHome size={28} /> },
    { name: 'IcLive', el: <IcLive size={28} /> },
    { name: 'IcDiary', el: <IcDiary size={28} /> },
    { name: 'IcNazo', el: <IcNazo size={28} /> },
    { name: 'IcMusic', el: <IcMusic size={28} /> },
    { name: 'IcAccount', el: <IcAccount size={28} /> },
    { name: 'IcClose', el: <IcClose size={28} /> },
    { name: 'IcArrowLeft', el: <IcArrowLeft size={28} /> },
    { name: 'IcArrow ↑', el: <IcArrow direction="up" size={28} /> },
    { name: 'IcArrow ↓', el: <IcArrow direction="down" size={28} /> },
    { name: 'IcArrow →', el: <IcArrow direction="right" size={28} /> },
    { name: 'IcCalendar', el: <IcCalendar size={28} /> },
    { name: 'IcBicycle', el: <IcBicycle size={28} /> },
    { name: 'IcSetlist', el: <IcSetlist size={28} /> },
    { name: 'IcHint', el: <IcHint size={28} /> },
    { name: 'IcHelp', el: <IcHelp size={28} /> },
    { name: 'IcEye', el: <IcEye size={28} /> },
    { name: 'IcFace', el: <IcFace size={28} /> },
    { name: 'IcEdit', el: <IcEdit size={28} /> },
    { name: 'IcLock (gray)', el: <IcLock variant="gray" size={28} /> },
    { name: 'IcLock (grad)', el: <IcLock variant="gradient" size={28} /> },
    { name: 'IcQR', el: <IcQR size={28} /> },
    { name: 'IcWriterWataru', el: <IcWriterWataru size={28} /> },
    { name: 'IcWriterTmrr', el: <IcWriterTmrr size={28} /> },
  ];

  return (
    <>
      <SectionTitle label="Icons (size=28)" />
      <View style={styles.iconGrid}>
        {icons.map(({ name, el }) => (
          <View key={name} style={styles.iconCell}>
            {el}
            <Text style={styles.iconName}>{name}</Text>
          </View>
        ))}
      </View>
    </>
  );
}

// ─────────────── Main screen ───────────────

export default function ComponentLibraryScreen() {
  const [activeSection, setActiveSection] = useState<Section>('UI');

  const renderSection = () => {
    switch (activeSection) {
      case 'UI': return <UiSection />;
      case 'Cards': return <CardsSection />;
      case 'Forms': return <FormsSection />;
      case 'Home': return <HomeSection />;
      case 'Layout': return <LayoutSection />;
      case 'Icons': return <IconsSection />;
    }
  };

  return (
    <View style={styles.screen}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <Text style={styles.topBarTitle}>Component Library</Text>
      </View>

      {/* Section tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabBar}
        contentContainerStyle={styles.tabBarContent}
      >
        {SECTIONS.map((s) => (
          <TouchableOpacity
            key={s}
            onPress={() => setActiveSection(s)}
            style={[styles.tabBtn, activeSection === s && styles.tabBtnActive]}
          >
            <Text style={[styles.tabBtnText, activeSection === s && styles.tabBtnTextActive]}>
              {s}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Content */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {renderSection()}
        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  topBar: {
    backgroundColor: '#222',
    paddingTop: 56,
    paddingBottom: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  topBarTitle: {
    ...fonts.condensedBold,
    fontSize: 20,
    letterSpacing: 1,
    color: '#fff',
  },
  tabBar: {
    backgroundColor: '#222',
    flexGrow: 0,
  },
  tabBarContent: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    gap: 8,
    flexDirection: 'row',
  },
  tabBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#555',
  },
  tabBtnActive: {
    backgroundColor: '#fff',
    borderColor: '#fff',
  },
  tabBtnText: {
    ...fonts.condensedMedium,
    fontSize: 13,
    letterSpacing: 0.5,
    color: '#aaa',
  },
  tabBtnTextActive: {
    color: '#222',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 4,
  },
  // Section header
  sectionTitle: {
    marginTop: 20,
    marginBottom: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#654cab',
    paddingLeft: 8,
  },
  sectionTitleText: {
    ...fonts.condensedBold,
    fontSize: 14,
    letterSpacing: 1,
    color: '#222',
    textTransform: 'uppercase',
  },
  // Story wrapper
  story: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 4,
    gap: 10,
    borderWidth: 1,
    borderColor: '#efefef',
  },
  storyLabel: {
    ...fonts.regular,
    fontSize: 10,
    letterSpacing: 0.5,
    color: '#898989',
    textTransform: 'uppercase',
  },
  storyRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
  },
  // Helpers
  flex1: {
    flex: 1,
  },
  whiteBg: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#efefef',
  },
  outlined: {
    borderWidth: 1,
    borderColor: '#efefef',
    borderRadius: 8,
    overflow: 'hidden',
  },
  darkBg: {
    backgroundColor: '#654cab',
    borderRadius: 8,
    padding: 16,
  },
  membershipWrapper: {
    alignItems: 'flex-start',
  },
  // Icons
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 0,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#efefef',
    overflow: 'hidden',
  },
  iconCell: {
    width: '25%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 4,
    gap: 6,
    borderWidth: 0.5,
    borderColor: '#efefef',
  },
  iconName: {
    ...fonts.regular,
    fontSize: 9,
    color: '#898989',
    textAlign: 'center',
  },
});
