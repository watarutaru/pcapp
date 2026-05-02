// Piercing Cyclone 会員管理スプレッドシート
//
// 【セットアップ手順】
// 1. Googleスプレッドシートを新規作成し、シート名を「会員一覧」に変更
// 2. 拡張機能 → Apps Script を開く
// 3. このファイルの内容を貼り付けて保存
// 4. 左メニューの「プロジェクトの設定」→「スクリプト プロパティ」に以下を追加:
//    - SUPABASE_URL  : https://xxxxxx.supabase.co
//    - SUPABASE_KEY  : Supabase の service_role キー（Settings → API → service_role）
// 5. スプレッドシートをリロードすると「会員管理」メニューが出現

const SHEET_NAME = '会員一覧';

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
    .addSeparator()
    .addItem('ロール変更を同期', 'syncRoles')
    .addToUi();
}

// Supabaseから会員一覧を取得してシートに書き込む
function fetchMembers() {
  const { url, key } = getConfig();
  const response = UrlFetchApp.fetch(
    `${url}/rest/v1/profiles?select=user_id,nickname,role,stage,total_points,visit_count&order=created_at.asc`,
    {
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
      },
    }
  );

  const members = JSON.parse(response.getContentText());
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.getActiveSheet();

  sheet.clearContents();

  // ヘッダー行
  const headers = [['user_id', 'ニックネーム', 'ロール（member/admin）', 'ステージ', 'ポイント', '参戦回数', '取得日時']];
  sheet.getRange(1, 1, 1, 7).setValues(headers);
  sheet.getRange(1, 1, 1, 7).setFontWeight('bold').setBackground('#e94560').setFontColor('#ffffff');

  if (members.length === 0) {
    SpreadsheetApp.getUi().alert('会員が見つかりませんでした。');
    return;
  }

  const now = new Date();
  const rows = members.map(m => [
    m.user_id,
    m.nickname,
    m.role,
    m.stage,
    m.total_points,
    m.visit_count,
    now,
  ]);
  sheet.getRange(2, 1, rows.length, 7).setValues(rows);

  // user_id列を薄いグレーに（編集しないことを視覚的に示す）
  sheet.getRange(2, 1, rows.length, 1).setFontColor('#999999');
  // ロール列を強調
  sheet.getRange(2, 3, rows.length, 1).setFontWeight('bold');

  sheet.autoResizeColumns(1, 7);
  SpreadsheetApp.getUi().alert(`${members.length}件の会員情報を取得しました。\n\nロールを変更したい行の「ロール」欄を\n"admin" または "member" に書き換えて、\n「ロール変更を同期」を実行してください。`);
}

// シートのロール列をSupabaseに反映する
function syncRoles() {
  const { url, key } = getConfig();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    SpreadsheetApp.getUi().alert('「会員一覧」シートが見つかりません。先に一覧を取得してください。');
    return;
  }

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    SpreadsheetApp.getUi().alert('データがありません。先に一覧を取得してください。');
    return;
  }

  // A列: user_id, B列: nickname, C列: role
  const data = sheet.getRange(2, 1, lastRow - 1, 3).getValues();
  const errors = [];
  let updated = 0;

  data.forEach(([userId, nickname, role]) => {
    if (!userId || !role) return;

    const normalizedRole = String(role).trim().toLowerCase();
    if (normalizedRole !== 'member' && normalizedRole !== 'admin') {
      errors.push(`「${nickname}」: ロールの値が無効です（"${role}"）`);
      return;
    }

    const res = UrlFetchApp.fetch(
      `${url}/rest/v1/profiles?user_id=eq.${encodeURIComponent(userId)}`,
      {
        method: 'PATCH',
        headers: {
          'apikey': key,
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal',
        },
        payload: JSON.stringify({ role: normalizedRole }),
        muteHttpExceptions: true,
      }
    );

    if (res.getResponseCode() === 204) {
      updated++;
    } else {
      errors.push(`「${nickname}」: 同期失敗 (HTTP ${res.getResponseCode()})`);
    }
  });

  let message = `${updated}件のロールを同期しました。`;
  if (errors.length > 0) {
    message += '\n\nエラーがありました:\n' + errors.join('\n');
  }
  SpreadsheetApp.getUi().alert(message);

  // 同期後に一覧を再取得して最新状態を表示
  if (updated > 0) fetchMembers();
}
