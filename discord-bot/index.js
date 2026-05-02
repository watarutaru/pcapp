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
    GatewayIntentBits.GuildMessageReactions,
  ],
});

const CHANNEL_HANDLERS = {
  [process.env.CHANNEL_LIVE_INFO]: handleLiveInfo,
  [process.env.CHANNEL_DIARY_WATARU]: (msg) => handleDiary(msg, 'wataru'),
  [process.env.CHANNEL_DIARY_TAMARU]: (msg) => handleDiary(msg, 'tamaru'),
  [process.env.CHANNEL_PC_NAZO]: handlePcNazo,
};

// pending pc-nazo submissions: confirmationMessageId -> { parsedData, suggestedAnswers, status }
const pendingNazos = new Map();

client.once('ready', () => {
  console.log(`Bot ready: ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  // Reply to a pending nazo confirmation (✏️ additional answers flow)
  if (message.reference?.messageId && pendingNazos.has(message.reference.messageId)) {
    const entry = pendingNazos.get(message.reference.messageId);
    if (entry.status === 'waiting_for_additional') {
      await handleAdditionalAnswers(message, message.reference.messageId, entry);
      return;
    }
  }

  const handler = CHANNEL_HANDLERS[message.channelId];
  if (!handler) return;

  try {
    await handler(message);
  } catch (err) {
    console.error(`Error handling message in ${message.channelId}:`, err);
  }
});

client.on('messageReactionAdd', async (reaction, user) => {
  if (user.bot) return;

  const entry = pendingNazos.get(reaction.message.id);
  if (!entry) return;

  const emoji = reaction.emoji.name;

  if (emoji === '✅') {
    await saveNazoToDB(reaction.message, entry);
  } else if (emoji === '✏️') {
    entry.status = 'waiting_for_additional';
    await reaction.message.reply('追加の正解をカンマ区切りでこのメッセージにリプライしてください。\n例: `答,こたえ,kotae`');
  } else if (emoji === '❌') {
    pendingNazos.delete(reaction.message.id);
    await reaction.message.reply('❌ キャンセルしました。');
  }
});

const VALID_CATEGORIES = ['ライブ', '配信', 'イベント', 'グッズ'];

/**
 * #live-info 投稿フォーマット:
 * タイトル: ライブ名
 * 日時: YYYY-MM-DD HH:mm
 * 会場: 会場名
 * カテゴリ: ライブ | 配信 | イベント | グッズ  （省略時: ライブ）
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
  const rawCategory = parsed['カテゴリ'] || parsed['category'] || 'ライブ';
  const category = VALID_CATEGORIES.includes(rawCategory) ? rawCategory : 'ライブ';

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
    category,
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

/**
 * #pc-nazo 投稿フォーマット（画像を添付すること）:
 * タイトル: 第1問
 * 日付: YYYY-MM-DD
 * 本文: ヒントや説明（1行）
 * 正解: 答え,こたえ,kotae
 * 表示用正解: こたえ
 */
async function handlePcNazo(message) {
  const attachment = message.attachments.first();
  if (!attachment) {
    await message.reply('⚠️ 画像を添付してください。');
    return;
  }

  const lines = message.content.split('\n').map(l => l.trim()).filter(Boolean);
  const parsed = {};

  for (const line of lines) {
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    const value = line.slice(colonIdx + 1).trim();
    parsed[key] = value;
  }

  const title = parsed['タイトル'];
  const dateStr = parsed['日付'];
  const body = parsed['本文'];
  const answersRaw = parsed['正解'];
  const answerDisplay = parsed['表示用正解'];

  if (!title || !dateStr || !body || !answersRaw || !answerDisplay) {
    await message.reply('⚠️ 必須項目が不足しています。\nタイトル・日付・本文・正解・表示用正解 を入力してください。');
    return;
  }

  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    await message.reply(`⚠️ 日付の形式が正しくありません: \`${dateStr}\``);
    return;
  }

  const correctAnswers = answersRaw.split(',').map(s => s.trim()).filter(Boolean);
  const suggested = generateVariants(correctAnswers);

  const confirmText = [
    '📋 **以下の内容で登録しようとしています**\n',
    `**タイトル:** ${title}`,
    `**日付:** ${dateStr}`,
    `**本文:** ${body}`,
    `**表示用正解:** ${answerDisplay}\n`,
    '**【正解リスト（手入力）】**',
    correctAnswers.map(a => `・${a}`).join('\n'),
  ];

  if (suggested.length > 0) {
    confirmText.push('\n**【自動追加候補】**');
    confirmText.push(suggested.map(a => `・${a}`).join('\n'));
  } else {
    confirmText.push('\n（自動生成候補はありません）');
  }

  confirmText.push('\n✅ そのまま登録　✏️ 候補を追加してリプライ　❌ キャンセル');

  const confirmMsg = await message.reply(confirmText.join('\n'));

  await confirmMsg.react('✅');
  await confirmMsg.react('✏️');
  await confirmMsg.react('❌');

  pendingNazos.set(confirmMsg.id, {
    originalMessage: message,
    title,
    date: date.toISOString(),
    body,
    correctAnswers,
    suggestedAnswers: suggested,
    answerDisplay,
    attachment,
    status: 'confirming',
  });
}

async function handleAdditionalAnswers(replyMessage, confirmMsgId, entry) {
  const additional = replyMessage.content.split(',').map(s => s.trim()).filter(Boolean);
  if (additional.length === 0) return;

  entry.correctAnswers = [...entry.correctAnswers, ...additional];
  entry.status = 'confirming';

  const newSuggested = generateVariants(entry.correctAnswers);
  entry.suggestedAnswers = newSuggested;

  const updateText = [
    '📋 **正解リストを更新しました。内容を確認してください**\n',
    '**【正解リスト（確定分）】**',
    entry.correctAnswers.map(a => `・${a}`).join('\n'),
  ];

  if (newSuggested.length > 0) {
    updateText.push('\n**【自動追加候補（更新）】**');
    updateText.push(newSuggested.map(a => `・${a}`).join('\n'));
  }

  updateText.push('\n✅ 登録　✏️ さらに追加　❌ キャンセル');

  const newConfirmMsg = await replyMessage.reply(updateText.join('\n'));
  await newConfirmMsg.react('✅');
  await newConfirmMsg.react('✏️');
  await newConfirmMsg.react('❌');

  // Move pending entry to the new confirmation message
  pendingNazos.delete(confirmMsgId);
  pendingNazos.set(newConfirmMsg.id, entry);
}

async function saveNazoToDB(confirmMessage, entry) {
  try {
    // Upload image to Supabase Storage
    const imageResponse = await fetch(entry.attachment.url);
    const imageBuffer = await imageResponse.arrayBuffer();
    const imageData = Buffer.from(imageBuffer);

    const ext = entry.attachment.name?.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('nazo-images')
      .upload(fileName, imageData, {
        contentType: entry.attachment.contentType || 'image/jpeg',
        upsert: false,
      });

    if (uploadError) {
      console.error('Image upload failed:', uploadError);
      await confirmMessage.reply('⚠️ 画像のアップロードに失敗しました。');
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('nazo-images')
      .getPublicUrl(fileName);

    // Include suggested answers in the final list
    const allAnswers = [...new Set([...entry.correctAnswers, ...entry.suggestedAnswers])];

    const { error: insertError } = await supabase.from('pc_nazo').insert({
      title: entry.title,
      date: entry.date,
      body: entry.body,
      image_url: publicUrl,
      correct_answers: allAnswers,
      answer_display: entry.answerDisplay,
    });

    if (insertError) {
      console.error('Failed to insert pc_nazo:', insertError);
      await confirmMessage.reply('⚠️ データベースへの保存に失敗しました。');
      return;
    }

    pendingNazos.delete(confirmMessage.id);
    await confirmMessage.reply(`✅ **登録完了！**\n「${entry.title}」を登録しました。\n正解リスト: ${allAnswers.join(', ')}`);
    console.log(`PC謎 added: ${entry.title}`);

    await sendPushToAllUsers('🔐 新しいPC謎が公開されました', entry.title);
  } catch (err) {
    console.error('saveNazoToDB error:', err);
    await confirmMessage.reply('⚠️ 予期しないエラーが発生しました。');
  }
}

// ---- Answer variant generation ----

function toKatakana(str) {
  return str.replace(/[ぁ-ゖ]/g, c =>
    String.fromCharCode(c.charCodeAt(0) + 0x60)
  );
}

function toHiragana(str) {
  return str.replace(/[ァ-ヶ]/g, c =>
    String.fromCharCode(c.charCodeAt(0) - 0x60)
  );
}

function toHalfWidth(str) {
  return str.replace(/[Ａ-Ｚａ-ｚ０-９]/g, c =>
    String.fromCharCode(c.charCodeAt(0) - 0xfee0)
  );
}

function normalizeAnswer(str) {
  return str
    .trim()
    .toLowerCase()
    .replace(/[Ａ-Ｚａ-ｚ０-９]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .replace(/\s+/g, '');
}

function generateVariants(answers) {
  const originalNormalized = new Set(answers.map(normalizeAnswer));
  const variants = new Set();

  for (const answer of answers) {
    const candidates = [
      toKatakana(answer),
      toHiragana(answer),
      toHalfWidth(answer),
      answer.toUpperCase(),
      answer.toLowerCase(),
      answer.replace(/\s+/g, ''),
    ];

    for (const c of candidates) {
      if (c !== answer && !originalNormalized.has(normalizeAnswer(c))) {
        variants.add(c);
      }
    }
  }

  // Deduplicate variants that normalize to the same value
  const seen = new Set();
  return [...variants].filter(v => {
    const n = normalizeAnswer(v);
    if (seen.has(n)) return false;
    seen.add(n);
    return true;
  });
}

// ---- Push notifications ----

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
