-- music テーブル
-- Supabase SQL Editor で実行してください

CREATE TABLE IF NOT EXISTS music (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  type text NOT NULL DEFAULT 'アルバム',
  jacket_url text,
  spotify_url text,
  apple_music_url text,
  youtube_music_url text,
  line_music_url text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 表示順でソート
CREATE INDEX IF NOT EXISTS music_sort_order_idx ON music (sort_order ASC);

-- RLS 有効化
ALTER TABLE music ENABLE ROW LEVEL SECURITY;

-- 全ユーザーが閲覧可能
CREATE POLICY "Public music read" ON music
  FOR SELECT TO authenticated USING (true);

-- 管理者のみ書き込み可能
CREATE POLICY "Admin music insert" ON music
  FOR INSERT TO authenticated WITH CHECK (is_admin());

CREATE POLICY "Admin music update" ON music
  FOR UPDATE TO authenticated USING (is_admin());

CREATE POLICY "Admin music delete" ON music
  FOR DELETE TO authenticated USING (is_admin());

-- music-jackets ストレージバケット
-- Supabase ダッシュボード → Storage → New bucket で作成してください:
--   Bucket name: music-jackets
--   Public bucket: ON (ジャケット画像はパブリックアクセス)
--
-- 既存の "nazo-images" バケットと同様の設定で問題ありません。

-- 初期データ投入（既存アルバム "Q" の移行例）
-- INSERT INTO music (title, type, spotify_url, apple_music_url, youtube_music_url, line_music_url, sort_order)
-- VALUES (
--   'Q',
--   'アルバム',
--   'https://open.spotify.com/intl-ja/artist/0lSV8qzQ03K2rAe5LnEHuJ',
--   'https://music.apple.com/jp/artist/piercing-cyclone/1679278359',
--   'https://music.youtube.com/playlist?list=OLAK5uy_lrNDpbQf754xTahHE0UUTWmAfqSOWmFSY',
--   'https://music.line.me/webapp/artist/mi000000001d312ad1',
--   1
-- );
