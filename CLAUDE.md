# Piercing Cyclone 公式アプリ

Piercing Cyclone（バンド）のファン向け公式アプリ。React Native / Expo製。

## 作業スタイルのルール

- **CI・デプロイの確認**: PR作成後やプッシュ後は「通知を待ちます」と言って止まらず、能動的に `get_check_runs` でCIステータスを確認すること。処理中なら少し待ってから再確認する。
- **PRの自動マージは行わない**: Netlifyクレジット節約のため、`main` への自動マージは行わない。詳細は後述の「Git / ブランチ運用ルール」を参照。

## Git / ブランチ運用ルール

### 基本方針

**`main` ブランチは「Netlifyに自動デプロイされる本番ブランチ」です。Netlifyのクレジットを節約するため、`main` への頻繁なマージは避けてください。**

開発作業は必ず `main` から派生した作業用ブランチで行い、ユーザーが明示的に指示したタイミングでのみ `main` にマージします。

### ブランチ戦略

- **`main`**: 本番デプロイ用。直接コミットしない。
- **作業用ブランチ**: 機能/修正ごとに `main` から派生して作る。命名は目的に応じて以下のプレフィックスを使う:
  - 新機能: `feature/account-screen`
  - バグ修正: `fix/login-error`
  - スタイル調整: `style/font-weight`
  - リファクタ: `refactor/auth-logic`
  - ドキュメント: `docs/readme-update`

### 作業フロー

1. 新しい作業を始めるとき:
   - `main` を最新化(`git checkout main && git pull`)
   - 目的に応じたブランチを切る(`git checkout -b feature/xxx`)
2. 作業中はこまめにコミットする(コミット数は気にしない)
3. 作業が一区切りついたら、GitHubに push する(`git push -u origin feature/xxx`)
4. **`main` へのマージはユーザーが明示的に指示したときのみ実行する**
   - 「mainにマージして」「デプロイして」「リリースして」などの指示があるまで待つ
   - 複数のブランチが溜まっている場合は、まとめてマージする提案をする

### コミットメッセージ

[Conventional Commits](https://www.conventionalcommits.org/ja/v1.0.0/) 形式を推奨:

- `feat: アカウント画面を追加`
- `fix: ログイン時のエラーを修正`
- `style: フォントウェイトを調整`
- `refactor: 認証ロジックを整理`
- `docs: READMEを更新`
- `chore: 依存パッケージを更新`

### Pull Request

- `main` への PR はユーザーの指示があったときに作成する
- PR本文には、含まれる変更の概要を箇条書きで記載する
- マージはユーザー自身が行う（Claude Codeはマージボタンを押さない）

### やってはいけないこと

- `main` への直接 commit / push
- ユーザーの確認なしに `main` へのマージ
- `git push --force`（どうしても必要な場合は事前に相談する）

### 補足: Netlify のデプロイ動作

- `main` への push/マージ → 本番デプロイ（クレジット消費）
- 作業用ブランチへの push → デプロイされない
- 動作確認は基本的にローカル（Expo Go等）で行う

## コーディング方針

### 共通コンポーネントの使用（必須）

画面実装時は、既存の共通コンポーネントを必ず使用すること。独自に同等のスタイルを再実装してはいけない。

| 用途 | コンポーネント |
|---|---|
| ボタン | `components/ui/Button.tsx`（variant: `primary` / `secondary` / `white`） |
| フォーム入力 | `components/form/Form.tsx`（variant: `regular` / `password` / `error`） |
| アイコン | `components/icons/`（`IcHelp`, `IcClose`, `IcArrow` など） |
| レイアウト | `components/layout/`（`Header`, `BottomNav` など） |
| カード | `components/cards/` |
| UI部品 | `components/ui/`（`ButtonText`, `ContentHeading`, `Tab`, `Tag` など） |

---

## 技術スタック

- **フロントエンド**: React Native + Expo Router
- **バックエンド**: Supabase（認証・DB・RLS）
- **Webプレビュー**: Netlify（`expo export --platform web` でビルド・デプロイ）

## ディレクトリ構成

```
app/
  (auth)/          # 認証画面（ログイン・登録・パスワードリセット）
  (tabs)/          # メインタブ画面（index/diary/live/music/nazo/mypage）
  admin/           # 管理画面（live/music/mystery/nazo/qr）
  component-library.tsx  # UIコンポーネント一覧（開発用プレビュー）
components/
  ui/              # 汎用UIパーツ（Button, Tag, Tab, HintAccordion 等）
  cards/           # カードコンポーネント（DiaryCard, LiveCard, MusicCard 等）
  form/            # フォームコンポーネント（Form, NazoInputForm）
  layout/          # レイアウト（Header, BottomNav 等）
  home/            # ホーム専用ブロック（CheckinBlock, StatusBlock）
  icons/           # SVGアイコン一式（IcHome, IcMusic 等）
lib/               # Supabase APIラッパー・型定義
gas/               # Google Apps Script（手動での会員管理用）
```

## デザインコンポーネント

`components/` 配下にアプリ全体で共通利用するUIコンポーネントが揃っている。
**新しい画面や機能を実装する際は、必ず既存コンポーネントを優先して使うこと。**

- カードUI → `components/cards/`
- ボタン・タグ・タブ・アコーディオン等 → `components/ui/`
- フォーム → `components/form/`
- アイコン → `components/icons/`（SVGベース、`IcXxx` 命名）

コンポーネントの一覧と見た目は `app/component-library.tsx` で確認できる。
開発時は管理画面（Admin タブ）→「コンポーネントライブラリ」から参照可能。

## 環境変数

プロジェクトルートに `.env` を作成（`.env.example` を参照）：

```
EXPO_PUBLIC_SUPABASE_URL=https://ehhxerotomgufljnxcuf.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=（Supabase ダッシュボード → Settings → API → anon key）
```

## 開発・動作確認

### 依存関係インストール
```bash
npm install
```

> **注意**: プロジェクトパスに `:` が含まれるため `npx expo` は動作しない。
> 必ず `node_modules/.bin/expo` を直接呼び出すこと。

### スマホでのプレビュー（Expo Go）

> **注意**: LAN直接接続は動作しない。必ず以下のCloudflareトンネル方式を使うこと。
> ngrok（`--tunnel`オプション）は不安定なため使用しない。

**3つのターミナルを順番に起動する：**

**Terminal 1 — Metro:**
```bash
node_modules/.bin/expo start --clear
```

**Terminal 2 — プロキシ:**
```bash
node expo-proxy.js
```

**Terminal 3 — Cloudflareトンネル:**
```bash
cloudflared tunnel --url http://localhost:8090
```

トンネルURLが発行されたら（例: `https://xxxx.trycloudflare.com`）、
Expo Goアプリで以下のURLを手動入力：
```
exp://xxxx.trycloudflare.com
```

### WebプレビューはNetlifyで確認

Webビルド（`expo export --platform web`）はNetlifyに自動デプロイされる。
ブラウザで動作確認したい場合はNetlifyのプレビューURLを使うこと。

## DBスキーマ

`supabase-schema.sql` および `supabase-music-schema.sql` を Supabase SQL Editor で実行済み。テーブル構成：

- `profiles` - ユーザープロフィール・ポイント・ステージ
- `lives` - ライブ情報
- `checkins` - ライブチェックイン履歴
- `points` - ポイント付与履歴
- `diaries` - 交換日記（wataru / tamaru）
- `push_tokens` - プッシュ通知トークン
- `music` - 音楽（アルバム・シングル等）情報（`supabase-music-schema.sql`）
- `mysteries` / 謎解き関連 - 謎・ヒント・解答履歴（`lib/mysteries.ts` 参照）
