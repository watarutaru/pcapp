require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
);

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const CHANNEL_HANDLERS = {
  [process.env.CHANNEL_LIVE_INFO]: handleLiveInfo,
  [process.env.CHANNEL_DIARY_WATARU]: (msg) => handleDiary(msg, 'wataru'),
  [process.env.CHANNEL_DIARY_TAMARU]: (msg) => handleDiary(msg, 'tamaru'),
};

client.once('ready', () => {
  console.log(`Bot ready: ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  const handler = CHANNEL_HANDLERS[message.channelId];
  if (!handler) return;

  try {
    await handler(message);
  } catch (err) {
    console.error(`Error handling message in ${message.channelId}:`, err);
  }
});

/**
 * #live-info 投稿フォーマット:
 * タイトル: ライブ名
 * 日時: YYYY-MM-DD HH:mm
 * 会場: 会場名
 * 詳細: 詳細テキスト（任意）
 */
async function handleLiveInfo(message) {
  const lines = message.content.split('\n').map(l => l.trim()).filter(Boolean);
  const parsed = {};

  for (const line of lines) {
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    const value = line.slice(colonIdx + 1).trim();
    parsed[key] = value;
  }

  const title = parsed['タイトル'] || parsed['title'];
  const dateStr = parsed['日時'] || parsed['date'];
  const venue = parsed['会場'] || parsed['venue'];
  const description = parsed['詳細'] || parsed['description'] || '';

  if (!title || !dateStr || !venue) {
    console.log('Live info message missing required fields, skipping.');
    return;
  }

  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    console.log(`Invalid date: ${dateStr}`);
    return;
  }

  const { error } = await supabase.from('lives').insert({
    title,
    date: date.toISOString(),
    venue,
    description,
  });

  if (error) {
    console.error('Failed to insert live:', error);
    return;
  }

  await message.react('✅');
  console.log(`Live added: ${title}`);

  await sendPushToAllUsers(`🎸 新しいライブが追加されました`, `${title}\n${venue}`);
}

async function handleDiary(message, author) {
  const content = message.content.trim();
  if (!content) return;

  const { error } = await supabase.from('diaries').insert({
    author,
    content,
  });

  if (error) {
    console.error(`Failed to insert diary (${author}):`, error);
    return;
  }

  await message.react('📖');
  console.log(`Diary added (${author})`);

  const authorLabel = author === 'wataru' ? 'WATARU' : 'TAMARU';
  await sendPushToAllUsers(`📖 ${authorLabel}が日記を更新しました`, content.slice(0, 50) + '...');
}

async function sendPushToAllUsers(title, body) {
  const { data: tokens, error } = await supabase
    .from('push_tokens')
    .select('token');

  if (error || !tokens || tokens.length === 0) return;

  const messages = tokens.map(({ token }) => ({
    to: token,
    sound: 'default',
    title,
    body,
  }));

  const CHUNK_SIZE = 100;
  for (let i = 0; i < messages.length; i += CHUNK_SIZE) {
    const chunk = messages.slice(i, i + CHUNK_SIZE);
    try {
      const res = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(chunk),
      });
      const result = await res.json();
      console.log(`Push sent: ${chunk.length} messages`, result.data?.length ?? '');
    } catch (err) {
      console.error('Push send error:', err);
    }
  }
}

client.login(process.env.DISCORD_TOKEN);
