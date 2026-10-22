/* ============================================================
   物語の生成
   ------------------------------------------------------------
   ・テンプレート生成（標準）：APIキー不要。ブラウザの中だけで動きます。
     回答の文章はそのまま使い、前後に「つなぎの一文」を添えるだけなので、
     回答にない人名・地名・年代などの事実が加わることはありません。
   ・AI生成（任意）：config.js の AI_ENDPOINT を設定した場合のみ利用できます。
     失敗したときは自動的にテンプレート生成に切り替わります。

   生成される物語の形：
   {
     title: "物語のタイトル",
     subtitle: "副題",
     tone: "warm" | "memoir" | "novel" | "letter",
     source: "template" | "ai",
     chapters: [ { heading: "見出し", paragraphs: ["段落", ...] } ]
   }
   ============================================================ */
(function () {
  "use strict";

  /* ---------- 雰囲気ごとの文章テンプレート ----------
     {S} … 主人公の呼び方（自分なら「私」、家族なら「父」など）
     値が { self, other } のものは、自分／他の人で文を使い分けます。
     ここにある文は「事実」を含まない、つなぎの言葉だけにしてあります。 */
  var TEMPLATES = {
    warm: {
      prologue: {
        self: ["これは、私がこれまで歩いてきた道のりを、ひとつずつ思い出しながら綴った物語です。"],
        other: ["これは、{S}が歩んできた道のりを、ひとつずつたどりながら綴った物語です。"]
      },
      chapters: {
        birthplace: { heading: "ふるさと", lead: "物語は、{S}が生まれ育った場所から始まります。" },
        childhood: { heading: "幼い日々", lead: "子どもの頃の{S}が好きだったもの。それは、こんなことでした。" },
        school: { heading: "学び舎の思い出", lead: { self: "学生時代を振り返ると、今も忘れられない思い出があります。", other: "{S}の学生時代には、忘れられない思い出があります。" } },
        dream: { heading: "若き日の夢", lead: "若い頃、{S}の胸には夢がありました。" },
        work: { heading: "働くということ", lead: "仕事について思い返すとき、心に浮かぶことがあります。" },
        turning: { heading: "人生の転機", lead: "人生には、その後の道を大きく変える出来事があります。{S}にとって、それはこんな出来事でした。" },
        people: { heading: "大切な人と", lead: "かけがえのない人との思い出も、{S}の人生を形づくってきました。" },
        hardship: { heading: "苦しかった日々", lead: "人生には、つらく苦しい時期もありました。" },
        joy: { heading: "よろこびの日", lead: "そして、{S}の人生で一番うれしかったこと。" },
        message: { heading: "次の世代へ", lead: "最後に、{S}から次の世代へ伝えたい言葉があります。" }
      },
      epilogue: ["ここに綴ったのは、{S}の人生のほんの一部にすぎません。けれど、その一つひとつが、かけがえのない物語です。"]
    },

    memoir: {
      prologue: {
        self: ["本稿は、私自身の歩みを、記憶と言葉をもとに書き留めたものである。"],
        other: ["本稿は、{S}の歩みを、残された記憶と言葉をもとに書き留めたものである。"]
      },
      chapters: {
        birthplace: { heading: "生い立ち", lead: "まず、生まれ育った土地について記す。" },
        childhood: { heading: "幼少期", lead: "幼い頃の{S}が好んだものは、次のとおりである。" },
        school: { heading: "学生時代", lead: "学生時代の記憶として、とりわけ印象深いものがある。" },
        dream: { heading: "青年期の志", lead: "若い頃に抱いていた夢についても、記しておきたい。" },
        work: { heading: "仕事", lead: "仕事にまつわる記憶のなかで、印象に残っているのは次のことである。" },
        turning: { heading: "転機", lead: "人生の大きな転機となった出来事がある。" },
        people: { heading: "人との縁", lead: "大切な人との思い出として、次のことが記憶に残っている。" },
        hardship: { heading: "苦難", lead: "最も苦労した経験についても、記しておく。" },
        joy: { heading: "喜び", lead: "人生で最もうれしかった出来事は、次のとおりである。" },
        message: { heading: "伝えたいこと", lead: "最後に、次の世代へ残したい言葉を記す。" }
      },
      epilogue: ["以上が、{S}の歩みの記録である。"]
    },

    novel: {
      prologue: {
        self: ["記憶の糸をたぐり寄せると、いくつもの場面が静かに浮かび上がってくる。これは、そのひとつひとつを拾い集めた、私の物語だ。"],
        other: ["記憶の糸をたぐり寄せると、いくつもの場面が静かに浮かび上がってくる。これは、そのひとつひとつを拾い集めた、{S}の物語だ。"]
      },
      chapters: {
        birthplace: { heading: "はじまりの場所", lead: "すべての始まりは、生まれ育ったあの場所にある。" },
        childhood: { heading: "幼き日のときめき", lead: "幼い{S}の心をとらえていたもの――。" },
        school: { heading: "色あせない季節", lead: "学生時代。いまも色あせない場面がある。" },
        dream: { heading: "胸に灯した夢", lead: "若き日の{S}は、胸に夢を抱いていた。" },
        work: { heading: "働く日々", lead: "働く日々のなかにも、忘れがたい記憶が刻まれている。" },
        turning: { heading: "分かれ道", lead: "人生には、ある日を境に景色が変わる瞬間がある。" },
        people: { heading: "かけがえのない人", lead: "思い出のなかには、いつも大切な人の姿がある。" },
        hardship: { heading: "長い坂道", lead: "けれど、道は平坦なばかりではなかった。" },
        joy: { heading: "光の差す日", lead: "そして、胸がいっぱいになるほどうれしかった日のこと。" },
        message: { heading: "受け継がれる言葉", lead: { self: "物語の終わりに、次の世代へ、この言葉を残したい。", other: "物語の終わりに、{S}の言葉をここに記しておこう。" } }
      },
      epilogue: ["物語はここで、ひとまず筆をおく。ここに綴られなかった日々もまた、確かに{S}の人生の一部である。"]
    },

    letter: {
      prologue: {
        self: ["家族のみんなへ。", "私がこれまで歩いてきた道のりを、少しずつ書き残しておこうと思います。"],
        other: ["{N}へ。", "あなたが歩んできた道のりを、思い出をたどりながら、手紙に綴ってみました。"]
      },
      chapters: {
        birthplace: { lead: { self: "まずは、私が生まれ育った場所のことから話させてください。", other: "あなたが生まれ育った場所のこと。" } },
        childhood: { lead: { self: "子どもの頃、私が好きだったのは、こんなことです。", other: "子どもの頃のあなたが好きだったこと。" } },
        school: { lead: { self: "学生時代の、忘れられない思い出もあります。", other: "学生時代の、忘れられない思い出。" } },
        dream: { lead: { self: "若い頃、私にはこんな夢がありました。", other: "若い頃、あなたが胸に抱いていた夢。" } },
        work: { lead: { self: "仕事のことも、少し書いておきますね。", other: "仕事にまつわる、あなたの思い出。" } },
        turning: { lead: { self: "人生の大きな転機になった出来事についても、伝えておきたいと思います。", other: "あなたの人生を大きく変えた出来事。" } },
        people: { lead: { self: "大切な人との思い出も、ここに残しておきます。", other: "大切な人との、忘れられない思い出。" } },
        hardship: { lead: { self: "苦労したこともありました。", other: "苦労を重ねた日々のこと。" } },
        joy: { lead: { self: "そして、一番うれしかったこと。", other: "そして、あなたが一番うれしかったこと。" } },
        message: { lead: { self: "最後に、みんなに伝えたいことがあります。", other: "あなたが次の世代に伝えたい言葉を、ここに書き留めておきます。" } }
      },
      epilogue: {
        self: ["長い手紙を、最後まで読んでくれてありがとう。"],
        other: ["あなたの物語を、これからも大切に受け継いでいきます。"]
      }
    }
  };

  /* ---------- 小さな道具 ---------- */
  function pick(value, isSelf) {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      return isSelf ? value.self : value.other;
    }
    return value;
  }

  function fill(text, ctx) {
    return String(text).replace(/\{S\}/g, ctx.S).replace(/\{N\}/g, ctx.N);
  }

  // 回答を段落に分け、文末に句点がなければ「。」を補う（内容は変えない）
  function toParagraphs(answer) {
    return String(answer)
      .replace(/\r\n?/g, "\n")
      .split(/\n+/)
      .map(function (line) { return line.trim(); })
      .filter(function (line) { return line.length > 0; })
      .map(function (line) {
        return /[。．.！？!?」』）)…〜~ー♪]$/.test(line) ? line : line + "。";
      });
  }

  // 「次の世代に伝えたい言葉」を「」でくくる
  function toQuote(answer) {
    var text = String(answer).replace(/\r\n?/g, "\n").trim();
    if (/^[「『]/.test(text)) return toParagraphs(text);
    text = text.replace(/[。．]$/, "");
    return ["「" + text.replace(/\s*\n+\s*/g, "　") + "」"];
  }

  /* 物語の主人公の呼び方などをまとめる */
  function makeContext(data) {
    var isSelf = data.target === "self";
    var name = (data.name || "").trim();
    var S, N;
    if (isSelf) {
      S = "私";
      N = name;
    } else {
      N = name || "あなた";
      S = data.tone === "letter" ? "あなた" : (name || "その方");
    }
    return { isSelf: isSelf, name: name, S: S, N: N };
  }

  function defaultTitle(data) {
    var name = (data.name || "").trim();
    if (data.target === "self") return name ? name + "の物語" : "私の物語";
    return name ? name + "の物語" : "ある人生の物語";
  }

  function defaultSubtitle(data) {
    var map = { warm: "心に残る、人生の記憶", memoir: "歩みの記録", novel: "ひとつの人生をめぐる物語", letter: "大切な人への手紙" };
    return map[data.tone] || "";
  }

  /* ---------- テンプレート生成 ---------- */
  function generateFromTemplate(data) {
    var tpl = TEMPLATES[data.tone] || TEMPLATES.warm;
    var ctx = makeContext(data);
    var questions = window.QUESTIONS;
    var chapters = [];
    var answeredCount = 0;

    questions.forEach(function (q, i) {
      var answer = (data.answers[i] || "").trim();
      if (!answer) return; // 答えていない質問は、物語に含めない
      answeredCount++;
      var c = tpl.chapters[q.id];
      var paragraphs = [];
      var lead = pick(c.lead, ctx.isSelf);
      if (lead) paragraphs.push(fill(lead, ctx));
      paragraphs = paragraphs.concat(q.id === "message" ? toQuote(answer) : toParagraphs(answer));
      chapters.push({ heading: c.heading || "", paragraphs: paragraphs });
    });

    if (answeredCount === 0) return null;

    var prologue = pick(tpl.prologue, ctx.isSelf).map(function (t) { return fill(t, ctx); });
    chapters.unshift({ heading: "", paragraphs: prologue, role: "prologue" });

    // 回答が少ないときは、締めの文を付けすぎない
    if (answeredCount >= 3 || data.tone === "letter") {
      var epilogue = pick(tpl.epilogue, ctx.isSelf).map(function (t) { return fill(t, ctx); });
      if (data.tone === "letter" && ctx.isSelf && ctx.name) epilogue.push(ctx.name + "より");
      chapters.push({ heading: "", paragraphs: epilogue, role: "epilogue" });
    }

    return {
      title: defaultTitle(data),
      subtitle: defaultSubtitle(data),
      tone: data.tone,
      source: "template",
      chapters: chapters
    };
  }

  /* ---------- AI生成（任意） ----------
     自前のサーバー（server/ フォルダの例を参照）に回答を送り、
     { title, subtitle, chapters:[{heading, paragraphs}] } を受け取ります。 */
  function generateWithAI(data) {
    var endpoint = (window.APP_CONFIG || {}).AI_ENDPOINT;
    if (!endpoint) return Promise.reject(new Error("AI_ENDPOINT が設定されていません"));

    var payload = {
      target: data.target,
      name: (data.name || "").trim(),
      tone: data.tone,
      answers: window.QUESTIONS.map(function (q, i) {
        return { id: q.id, question: q.self, answer: (data.answers[i] || "").trim() };
      }).filter(function (a) { return a.answer; })
    };

    var controller = typeof AbortController !== "undefined" ? new AbortController() : null;
    var timer = controller ? setTimeout(function () { controller.abort(); }, 120000) : null;

    return fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller ? controller.signal : undefined
    }).then(function (res) {
      if (timer) clearTimeout(timer);
      if (!res.ok) throw new Error("サーバーエラー（" + res.status + "）");
      return res.json();
    }).then(function (json) {
      if (!json || !Array.isArray(json.chapters) || json.chapters.length === 0) {
        throw new Error("物語を受け取れませんでした");
      }
      return {
        title: String(json.title || defaultTitle(data)),
        subtitle: String(json.subtitle || defaultSubtitle(data)),
        tone: data.tone,
        source: "ai",
        chapters: json.chapters.map(function (c) {
          return {
            heading: String(c.heading || ""),
            paragraphs: (Array.isArray(c.paragraphs) ? c.paragraphs : [String(c.paragraphs || "")])
              .map(function (p) { return String(p).trim(); })
              .filter(Boolean)
          };
        })
      };
    });
  }

  /* ---------- 物語 → テキスト ---------- */
  var KANJI = ["〇", "一", "二", "三", "四", "五", "六", "七", "八", "九", "十"];
  function chapterNumber(n) {
    if (n <= 10) return "第" + KANJI[n] + "章";
    if (n < 20) return "第十" + KANJI[n - 10] + "章";
    return "第" + n + "章";
  }

  function storyToText(story) {
    var lines = [];
    lines.push(story.title);
    if (story.subtitle) lines.push("―― " + story.subtitle + " ――");
    lines.push("");
    var num = 0;
    story.chapters.forEach(function (c) {
      if (c.heading) {
        num++;
        lines.push("");
        lines.push(story.tone === "letter" ? c.heading : chapterNumber(num) + "　" + c.heading);
        lines.push("");
      } else if (lines.length > 3) {
        lines.push("");
      }
      c.paragraphs.forEach(function (p) {
        lines.push(/^[「『]/.test(p) ? p : "　" + p);
      });
    });
    lines.push("");
    lines.push("");
    lines.push("（この物語は「人生の物語メーカー」で作成しました）");
    return lines.join("\n");
  }

  window.StoryGenerator = {
    generateFromTemplate: generateFromTemplate,
    generateWithAI: generateWithAI,
    storyToText: storyToText,
    chapterNumber: chapterNumber,
    isAIAvailable: function () { return !!(window.APP_CONFIG || {}).AI_ENDPOINT; }
  };
})();
