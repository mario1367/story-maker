/* ============================================================
   人生の物語メーカー  設定ファイル
   ここだけ書き換えれば、リンク先やAI機能を切り替えられます。
   ============================================================ */
window.APP_CONFIG = {
  // 「詳しくはこちら」ボタンのリンク先（デンショウ舎公式ホームページ）
  SITE_URL: "https://denshosha-studio.hateboothheyhey.chatgpt.site/",

  // ヘッダーのロゴから戻るリンク先（空にするとリンクなし）
  HOME_URL: "https://denshosha-studio.hateboothheyhey.chatgpt.site/",

  // AI文章生成のサーバーURL。
  // 空のままなら、APIキー不要の「テンプレート生成」だけで動きます。
  // 例： "https://story-api.example.workers.dev/api/story"
  // ※ APIキーは絶対にここへ書かないでください（サーバー側に保存します）。
  AI_ENDPOINT: "",

  // ブラウザ内一時保存に使う名前（通常は変更不要）
  STORAGE_KEY: "denshosha-story-maker-v2"
};
