// Piercing Cyclone 会員管理スプレッドシート
//
// 【セットアップ手順】
// 1. Googleスプレッドシートを新規作成し、スクリプトエディタを開く
// 2. このファイルの内容を貼り付けて保存
// 3. 「プロジェクトの設定」→「スクリプト プロパティ」に以下を追加:
//    - SUPABASE_URL  : https://xxxxxx.supabase.co
//    - SUPABASE_KEY  : Supabase の service_role キー（Settings → API → service_role）
// 4. スプレッドシートをリロードすると「会員管理」メニューが出現

const SHEET_NAME = '会員一覧';
const IMPORT_SHEET_NAME = '会員インポート';

const HEADER_BG = '#e94560';
const READONLY_COLOR = '#999999';

function getConfig() {
  const props = PropertiesService.getScriptProperties();
  return {
    url: props.getProperty('SUPABASE_URL'),
    key: props.getProperty('SUPABASE_KEY'),
  };
}

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('会員管理')
    .addItem('一覧を取得・更新', 'fetchMembers')
    .addItem('変更を同期', 'syncAll')
    .addSeparator()
    .addItem('インポートシートを準備', 'setupImportSheet')
    .addItem('一括インポート実行', 'importMembers')
    .addToUi();
}

// ────────────────────────────────────────────────
// 一覧取得
// 会員一覧シートに全会員を表示する
// 列: 会員番号 | メール | ニックネーム | ロール | ステージ | ポイント | 参戦回数 | 登録日 | user_id(hidden)
// ────────────────────────────────────────────────
function fetchMembers() {
  const { url, key } = getConfig();

  const profilesRes = UrlFetchApp.fetch(
    `${url}/rest/v1/profiles?select=member_number,user_id,nickname,role,stage,total_points,visit_count,created_at&order=member_number.asc.nullslast,created_at.asc`,
    { headers: { 'apikey': key, 'Authorization': `Bearer ${key}` } }
  );
  const profiles = JSON.parse(profilesRes.getContentText());

  // メールアドレスは auth.users から取得
  const authRes = UrlFetchApp.fetch(
    `${url}/auth/v1/admin/users?page=1&per_page=1000`,
    { headers: { 'apikey': key, 'Authorization': `Bearer ${key}` } }
  );
  const authData = JSON.parse(authRes.getContentText());
  const emailMap = {};
  (authData.users || []).forEach(u => { emailMap[u.id] = u.email; });

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);

  sheet.clearContents();
  sheet.clearFormats();
  sheet.showColumns(1, sheet.getLastColumn() || 9);

  const headers = ['会員番号', 'メールアドレス', 'ニックネーム', 'ロール', 'ステージ', 'ポイント', '参戦回数', '登録日', 'user_id'];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers])
    .setFontWeight('bold').setBackground(HEADER_BG).setFontColor('#ffffff');

  if (profiles.length > 0) {
    const rows = profiles.map(m => [
      m.member_number ?? '',
      emailMap[m.user_id] ?? '',
      m.nickname,
      m.role,
      m.stage,
      m.total_points,
      m.visit_count,
      m.created_at ? new Date(m.created_at) : '',
      m.user_id,
    ]);
    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);

    // 読み取り専用列（メール・登録日・user_id）をグレーに
    [2, 8, 9].forEach(col => {
      sheet.getRange(2, col, rows.length, 1).setFontColor(READONLY_COLOR);
    });
    sheet.getRange(2, 4, rows.length, 1).setFontWeight('bold'); // ロール列を強調
  }

  sheet.autoResizeColumns(1, 8);
  sheet.hideColumns(9); // user_id は非表示（同期時に内部参照）

  SpreadsheetApp.getUi().alert(
    `${profiles.length}件の会員情報を取得しました。\n\n` +
    '編集できる列: 会員番号・ニックネーム・ロール・ステージ・ポイント・参戦回数\n' +
    '変更後は「変更を同期」を実行してください。'
  );
}

// ────────────────────────────────────────────────
// 変更同期
// シートで編集した内容を Supabase に一括反映する
// ────────────────────────────────────────────────
function syncAll() {
  const { url, key } = getConfig();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    SpreadsheetApp.getUi().alert('「会員一覧」シートが見つかりません。先に一覧を取得してください。');
    return;
  }
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    SpreadsheetApp.getUi().alert('データがありません。');
    return;
  }

  // user_id 列を一時的に表示してから取得
  sheet.showColumns(9);
  const data = sheet.getRange(2, 1, lastRow - 1, 9).getValues();
  sheet.hideColumns(9);

  const errors = [];
  let updated = 0;

  data.forEach(([memberNumber, , nickname, role, stage, totalPoints, visitCount, , userId]) => {
    if (!userId) return;

    const normalizedRole = String(role).trim().toLowerCase();
    if (!['member', 'admin'].includes(normalizedRole)) {
      errors.push(`${String(userId).substring(0, 8)}...: ロールが無効 ("${role}")`);
      return;
    }

    const payload = {
      nickname: String(nickname).trim(),
      role: normalizedRole,
      stage: String(stage).trim(),
      total_points: parseInt(totalPoints) || 0,
      visit_count: parseInt(visitCount) || 0,
      member_number: memberNumber !== '' ? (parseInt(memberNumber) || null) : null,
    };

    const res = UrlFetchApp.fetch(
      `${url}/rest/v1/profiles?user_id=eq.${encodeURIComponent(userId)}`,
      {
        method: 'PATCH',
        headers: {
          'apikey': key, 'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json', 'Prefer': 'return=minimal',
        },
        payload: JSON.stringify(payload),
        muteHttpExceptions: true,
      }
    );

    if (res.getResponseCode() === 204) {
      updated++;
    } else {
      errors.push(`${String(userId).substring(0, 8)}...: 失敗 (HTTP ${res.getResponseCode()})`);
    }
  });

  let message = `${updated}件を同期しました。`;
  if (errors.length > 0) message += '\n\nエラー:\n' + errors.join('\n');
  SpreadsheetApp.getUi().alert(message);

  if (updated > 0) fetchMembers();
}

// ────────────────────────────────────────────────
// インポートシート準備
// 既存会員を一括登録するためのシートを作成する
// ────────────────────────────────────────────────
function setupImportSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(IMPORT_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(IMPORT_SHEET_NAME);
  }

  sheet.clearContents();
  sheet.clearFormats();

  const headers = ['会員番号', 'メールアドレス', 'ニックネーム', '初期パスワード', 'ステータス'];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers])
    .setFontWeight('bold').setBackground(HEADER_BG).setFontColor('#ffffff');

  sheet.setColumnWidth(1, 80);
  sheet.setColumnWidth(2, 230);
  sheet.setColumnWidth(3, 150);
  sheet.setColumnWidth(4, 150);
  sheet.setColumnWidth(5, 250);

  // ステータス列はグレーに（自動入力）
  sheet.getRange(2, 5, 100, 1).setFontColor(READONLY_COLOR);

  ss.setActiveSheet(sheet);

  SpreadsheetApp.getUi().alert(
    '「会員インポート」シートを準備しました。\n\n' +
    '2行目以降に以下を入力してください:\n' +
    '・会員番号: 引き継ぐ番号（例: 1, 2, 3）\n' +
    '・メールアドレス: Googleフォームに登録したアドレス\n' +
    '・ニックネーム: 表示名\n' +
    '・初期パスワード: 仮パスワード（6文字以上）\n\n' +
    '入力後、「一括インポート実行」を実行してください。\n' +
    '会員には「初期パスワードでログインし、必要に応じてパスワードをリセットしてください」と案内してください。'
  );
}

// ────────────────────────────────────────────────
// 一括インポート
// インポートシートの内容をもとに Supabase にアカウントを作成する
// - auth.users にユーザーを作成（email_confirm: true でメール確認不要）
// - trigger が profiles を自動作成
// - 直後に member_number と nickname を PATCH
// ────────────────────────────────────────────────
function importMembers() {
  const { url, key } = getConfig();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(IMPORT_SHEET_NAME);

  if (!sheet) {
    SpreadsheetApp.getUi().alert('先に「インポートシートを準備」を実行してください。');
    return;
  }
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    SpreadsheetApp.getUi().alert('インポートシートにデータがありません。');
    return;
  }

  const data = sheet.getRange(2, 1, lastRow - 1, 5).getValues();
  let imported = 0;
  let skipped = 0;

  data.forEach(([memberNumber, email, nickname, password, status], index) => {
    const row = index + 2;
    const emailStr = String(email).trim();

    if (!emailStr) return;
    if (String(status).startsWith('完了') || String(status).startsWith('スキップ')) {
      skipped++;
      return;
    }

    const nicknameStr = String(nickname).trim() || emailStr.split('@')[0];
    const passwordStr = String(password).trim();
    const memberNum = memberNumber !== '' ? (parseInt(memberNumber) || null) : null;

    if (passwordStr.length < 6) {
      sheet.getRange(row, 5).setValue('エラー: パスワードは6文字以上');
      return;
    }

    // auth.users にユーザーを作成
    const createRes = UrlFetchApp.fetch(`${url}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        'apikey': key, 'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      payload: JSON.stringify({
        email: emailStr,
        password: passwordStr,
        email_confirm: true,            // メール確認不要でそのままログイン可
        user_metadata: { nickname: nicknameStr },
      }),
      muteHttpExceptions: true,
    });

    const createCode = createRes.getResponseCode();
    if (createCode === 422) {
      sheet.getRange(row, 5).setValue('スキップ（既にアカウントあり）');
      skipped++;
      return;
    }
    if (createCode !== 200 && createCode !== 201) {
      sheet.getRange(row, 5).setValue(`エラー (HTTP ${createCode}): ${createRes.getContentText().substring(0, 80)}`);
      return;
    }

    const newUser = JSON.parse(createRes.getContentText());
    const userId = newUser.id;

    // trigger が profiles を作成するまで少し待つ
    Utilities.sleep(600);

    // member_number と nickname を確定（upsert で trigger 未完了でも対応）
    const profilePayload = { user_id: userId, nickname: nicknameStr };
    if (memberNum !== null) profilePayload.member_number = memberNum;

    const patchRes = UrlFetchApp.fetch(
      `${url}/rest/v1/profiles`,
      {
        method: 'POST',
        headers: {
          'apikey': key, 'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates,return=minimal',
        },
        payload: JSON.stringify(profilePayload),
        muteHttpExceptions: true,
      }
    );

    const patchCode = patchRes.getResponseCode();
    if (patchCode === 200 || patchCode === 201 || patchCode === 204) {
      sheet.getRange(row, 5).setValue(`完了 (user_id: ${userId.substring(0, 8)}...)`);
      imported++;
    } else {
      sheet.getRange(row, 5).setValue(`アカウント作成済・プロフィール更新失敗 (HTTP ${patchCode})`);
      imported++;
    }
  });

  SpreadsheetApp.getUi().alert(
    `インポート完了: ${imported}件\nスキップ: ${skipped}件\n\n` +
    '会員に以下を案内してください:\n' +
    '「アプリのログイン画面から、登録したメールアドレスと初期パスワードでログインできます。\n' +
    'パスワードを変更したい場合は「パスワードを忘れた方はこちら」からリセットしてください。」'
  );
}
