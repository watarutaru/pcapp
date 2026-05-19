-- mysteries テーブルに解説画像URLカラムを追加
ALTER TABLE mysteries ADD COLUMN IF NOT EXISTS explanation_image_url text;
