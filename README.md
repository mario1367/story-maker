# 人生の物語メーカー（デンショウ舎）

「あなたの人生を、ひとつの物語に。」

10の質問に答えるだけで、自分や家族の人生を一冊の本のような物語にできる無料Webアプリです。
HTML・CSS・JavaScriptだけで動くので、サーバーやデータベースはいりません。

---

## 1. ファイル一覧

```
jinsei-monogatari/
├── index.html          … アプリ本体（このファイルを開くと動きます）
├── css/
│   └── style.css       … デザイン（色・文字の大きさなど）
├── js/
│   ├── config.js       … 設定（リンク先・AIの有無）← 主にここだけ書き換えます
│   ├── questions.js    … 10の質問と、物語の雰囲気4種類
│   ├── generator.js    … 物語をつくる仕組み（テンプレート生成／AI生成）
│   └── app.js          … 画面の動き・保存・印刷など
├── assets/
│   └── favicon.svg     … ブラウザのタブに出るアイコン
├── server/             … 【将来用・任意】AI文章生成サーバーの例
│   ├── src/worker.js
│   ├── wrangler.toml
│   └── package.json
└── README.md           … この説明書
```

**公開に必要なのは `index.html`・`css`・`js`・`assets` の4つだけです。**
`server` フォルダは、AI機能を使うときまで公開する必要はありません。

---

## 2. まずはパソコンで動かしてみる

1. フォルダ一式をパソコンに保存します。
2. `index.html` をダブルクリックします。
3. ブラウザ（Chrome、Edge、Safari など）でアプリが開きます。

インターネットにつながっていなくても動きます（その場合、文字の書体だけパソコン標準の明朝体になります）。

---

## 3. インターネットに公開する（設置方法）

### 方法A：GitHub Pages（無料・おすすめ）

1. [GitHub](https://github.com/) で無料アカウントを作ります。
2. 右上の「＋」→「New repository」を選び、名前を `story-maker` などにして「Create repository」。
3. 「uploading an existing file」をクリックし、`index.html`・`css`・`js`・`assets` をまとめてドラッグ＆ドロップ →「Commit changes」。
4. リポジトリの「Settings」→ 左の「Pages」を開きます。
5. 「Branch」で `main` と `/ (root)` を選び「Save」。
6. 数分後、`https://（あなたのユーザー名）.github.io/story-maker/` で公開されます。

### 方法B：今のホームページと同じサーバーに置く

ホームページのサーバーに `story` などのフォルダを作り、上の4つをそのままアップロードします。
`https://（ホームページのアドレス）/story/` で開けるようになります。

### 方法C：Netlify / Cloudflare Pages

どちらも無料で、フォルダをドラッグ＆ドロップするだけで公開できます。

> どの方法でも、ファイルの中身を変更する必要はありません。

---

## 4. 設定を変える（`js/config.js`）

```js
window.APP_CONFIG = {
  SITE_URL: "https://denshosha-studio.hateboothheyhey.chatgpt.site/", // 「詳しくはこちら」のリンク先
  HOME_URL: "https://denshosha-studio.hateboothheyhey.chatgpt.site/", // 左上ロゴのリンク先
  AI_ENDPOINT: "",                                                     // 空のまま＝AIを使わない
  STORAGE_KEY: "denshosha-story-maker-v1"
};
```

- 公式サイトのアドレスが変わったら、`SITE_URL` と `HOME_URL` を書き換えてください。
- 質問の文やヒントを変えたいときは `js/questions.js` を編集します。
- 色を変えたいときは `css/style.css` の最初にある `--shu`（朱色）や `--paper`（生成り色）を変えます。

---

## 5. デンショウ舎のホームページにリンクを追加する

ホームページ側の、リンクを置きたい場所に次のHTMLを貼り付けます。
`href` は、アプリを公開したアドレスに書き換えてください。

### シンプルな文字リンク

```html
<a href="https://（公開したアドレス）/">人生の物語メーカー（無料）</a>
```

### ボタン型のご案内（デザインをそろえた例）

```html
<div style="text-align:center; padding:40px 16px; border-top:1px solid #d8ccb6; border-bottom:1px solid #d8ccb6;">
  <p style="font-family:'Shippori Mincho',serif; font-size:22px; margin:0 0 8px; letter-spacing:.08em;">
    あなたの人生を、ひとつの物語に。
  </p>
  <p style="color:#5d544c; margin:0 0 20px;">
    10の質問に答えるだけ。無料・ログイン不要でお使いいただけます。
  </p>
  <a href="https://（公開したアドレス）/"
     style="display:inline-block; background:#b0432c; color:#fff; padding:14px 36px; border-radius:6px; text-decoration:none; font-size:18px; letter-spacing:.08em;">
    人生の物語メーカーを使ってみる
  </a>
</div>
```

### ホームページ作成サービスを使っている場合

Wix・ペライチ・STUDIO・WordPress などでは、「ボタン」や「リンク」の部品を置き、
リンク先に公開したアドレスを入力するだけでも大丈夫です。
「HTML埋め込み」部品が使える場合は、上のボタン型のHTMLをそのまま貼れます。

> アプリをホームページの中に埋め込む（iframe）こともできますが、印刷やPDF保存が使いにくくなるため、
> **別ページとして開くリンク**をおすすめします。

---

## 6. アプリの機能

| 機能 | 内容 |
|---|---|
| 主人公の選択 | 自分／家族／その他の大切な人 |
| 質問 | 10問。とばす・前へ戻る・番号を押して好きな質問へ移動できます |
| 一時保存 | 入力するたびにブラウザ内へ自動保存。閉じても「続きから」再開できます |
| 雰囲気 | 温かく感動的／落ち着いた自伝風／小説のような物語風／家族への手紙風 |
| 完成画面 | タイトル変更・本文の直接編集・PDF保存・テキスト保存・印刷・雰囲気の変更・最初から作り直す |
| データ削除 | 画面上部と下部の「入力データを削除」ボタン |

### 文章の作り方（テンプレート生成）

標準では、AIを使わずに物語を組み立てます。

- 回答の文章は**そのまま**使い、章の見出しと「つなぎの一文」（例：「物語は、〇〇が生まれ育った場所から始まります。」）を添えるだけです。
- そのため、**回答にない人名・地名・年代などの事実が加わることはありません。**
- 答えなかった質問の章は作りません。回答が少ない場合は、短い物語になります。
- 文末に句点がない回答には「。」を補います（それ以外の言葉は変えません）。

### 個人情報について

- 入力内容は、お使いのブラウザの「localStorage」という場所にだけ保存されます。
- 外部のサーバーへ送ることはありません（AI機能を設定し、利用者がチェックを入れた場合のみ送信されます）。
- 外部から読み込んでいるのは、Googleの文字書体（Google Fonts）だけです。書体の読み込みに入力内容は含まれません。
  完全に外部と通信しないようにしたい場合は、`index.html` の `fonts.googleapis.com` を含む3行を削除してください（パソコン標準の明朝体で表示されます）。

---

## 7. 将来、AI文章生成を追加する方法

### しくみ

```
利用者のブラウザ ──(回答)──▶ デンショウ舎のサーバー ──(APIキー付き)──▶ AIサービス(Claude)
                ◀──(物語)──                      ◀──(文章)──
```

- **APIキーはブラウザ側のJavaScriptに絶対に書きません。** 書くと誰でも盗み見て、勝手に使えてしまいます。
- APIキーは「サーバー側」にだけ保存し、ブラウザはそのサーバーにだけ話しかけます。
- `server/src/worker.js` が、そのサーバーの完成例です（Cloudflare Workers 用）。

### 手順（Cloudflare Workers の例）

1. [Anthropic Console](https://console.anthropic.com/) でアカウントを作り、APIキーを発行します。
   利用上限額（月の上限）も設定しておくと安心です。
2. [Cloudflare](https://dash.cloudflare.com/) で無料アカウントを作ります。
3. パソコンに [Node.js](https://nodejs.org/) を入れ、`server` フォルダでコマンドを実行します。
   ```bash
   cd server
   npm install
   npx wrangler login                     # ブラウザでCloudflareにログイン
   npx wrangler secret put ANTHROPIC_API_KEY   # APIキーを貼り付け（画面には表示されません）
   npx wrangler deploy                    # 公開
   ```
4. 表示されたアドレス（例：`https://story-maker-api.xxxx.workers.dev`）の末尾に `/api/story` を付けて、
   `js/config.js` の `AI_ENDPOINT` に書きます。
   ```js
   AI_ENDPOINT: "https://story-maker-api.xxxx.workers.dev/api/story",
   ```
5. `server/wrangler.toml` の `ALLOWED_ORIGINS` に、アプリを公開したアドレス（例：`https://xxxx.github.io`）を書き、もう一度 `npx wrangler deploy` します。
   これで、他のサイトからこのサーバーを勝手に使われるのを防げます。

設定すると、雰囲気を選ぶ画面に「AIで文章を整える（試験機能）」のチェック欄が現れます。
**チェックを入れた人の回答だけ**がサーバーへ送られ、チェックしなければ今まで通りブラウザ内だけで作成します。
AIが失敗した場合は、自動的にテンプレート生成に切り替わります。

### サーバー側の安全対策（例に入っているもの）

- 回答にない事実を作らない・水増ししない、という指示をAIに与えています。
- 許可したホームページ以外からのアクセスを断ります。
- 1問あたりの文字数に上限を設けています。
- 回答内容をログに残しません。

さらに安全にするなら、Cloudflare の「Rate Limiting（回数制限）」で、同じ人が短時間に何十回も使えないようにしてください。

### 利用料金の目安

AIの料金は「トークン」（文字数のようなもの）で決まります。
物語1本あたり、送る回答が約3,000トークン、返ってくる物語が約4,000トークンと仮定した場合の目安です
（1ドル＝150円で計算。2026年10月時点の公式価格）。

| モデル | 料金（100万トークンあたり 入力／出力） | 物語1本 | 月1,000本 |
|---|---|---|---|
| Claude Opus 5.5（例の初期設定・最も高品質） | $4 ／ $20 | 約14円 | 約14,000円 |
| Claude Sonnet 5.5（品質と価格のバランス） | $2 ／ $10 | 約7円 | 約7,000円 |
| Claude Haiku 5.5（最も安い） | $0.10 ／ $0.50 | 約0.4円 | 約400円 |

- モデルは `server/src/worker.js` の `const MODEL = "claude-opus-5-5";` で変えられます
  （例：`"claude-sonnet-5-5"`、`"claude-haiku-5-5"`）。Haiku に変える場合は、`betas` と `fallbacks` の2行を削除してください。
- Cloudflare Workers は1日10万回までのアクセスなら無料です。
- 料金は変わることがあります。導入前に [公式の料金ページ](https://www.anthropic.com/pricing) を確認し、Anthropic Console で**月の利用上限**を必ず設定してください。

---

## 8. よくある質問

**Q. スマートフォンでPDFにできますか？**
A. 「PDFで保存」を押すと印刷画面が開きます。Androidは「PDFとして保存」を選びます。iPhoneは印刷画面のプレビューを指で広げるか、共有ボタンから保存できます。

**Q. 別のパソコンで続きを書けますか？**
A. 保存はそのブラウザの中だけなので、できません。「テキストで保存」したファイルを使って移すことはできます。

**Q. 入力内容を完全に消したい。**
A. 画面上部か下部の「入力データを削除」を押してください。ブラウザ内の保存データがすべて消えます。

**Q. 質問を増やしたり変えたりできますか？**
A. `js/questions.js` で質問文・ヒントを変えられます。質問を増やす場合は、`js/generator.js` の各雰囲気の `chapters` にも同じ `id` の見出しとつなぎ文を追加してください。
