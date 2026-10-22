/* ============================================================
   物語の生成
   ------------------------------------------------------------
   ・テンプレート生成（標準）：APIキー不要。ブラウザの中だけで動きます。
     書いた人の文章を、言い回しも文末もそのまま本文にします。
     アプリが加えるのは「章の題」と、文末を持たない短い「つなぎ」だけ。
     語り口の色は、書いた人の文章だけが決めます。
     回答にない人名・地名・年代などの事実が加わることはありません。
   ・AI生成（任意）：config.js の AI_ENDPOINT を設定した場合のみ利用できます。
     失敗したときは自動的にテンプレート生成に切り替わります。

   生成される物語の形：
   {
     title: "物語のタイトル",
     subtitle: "副題",
     tone: "warm" | "memoir" | "novel" | "letter",
     source: "template" | "ai",
     chapters: [ { heading: "見出し", paragraphs: ["段落", ...], role: "epigraph" など（任意） } ]
   }
   ============================================================ */
(function () {
  "use strict";

  /* ---------- 雰囲気ごとの文章テンプレート ----------
     {S} … 主人公の呼び方（自分なら「私」、家族なら「祖母」など）
     {N} … 手紙の宛名
     値が { self, other } のものは、自分／他の人で文を使い分けます。

     つなぎの言葉は、すべて「体言止め」（〜のこと。〜の日。）にしてあります。
     です・ます／だ・である のどちらで書かれた文章にもなじみ、
     書いた人の語り口を上書きしないためです。
     また、事実を含まない言葉だけにしてあります。

     parts … 章のまとめ方。10の質問を4つの章に分け、一つの物語として流れるようにします。
             「次の世代へ伝えたい言葉」は、小説の冒頭の引用（エピグラフ）として扱います。 */
  var PARTS = [
    ["birthplace", "childhood", "school"],
    ["dream", "work"],
    ["turning", "people"],
    ["hardship", "joy"]
  ];

  var TEMPLATES = {
    warm: {
      partTitles: ["ふるさとと、幼い日々", "夢と、働く日々", "分かれ道と、大切な人", "涙と、よろこび"],
      prologue: {
        self: ["これは、私が歩んできた道のりを、私自身の言葉で綴った物語。"],
        other: ["これは、{S}が歩んできた道のりを、思い出の言葉でたどる物語。"]
      },
      bridges: {
        birthplace: "はじまりは、{S}が生まれ育った場所。",
        childhood: "幼い日、夢中になっていたもの。",
        school: "学生時代の、忘れられない一場面。",
        dream: "若い日に、胸に抱いた夢。",
        work: "働く日々のなかで、心に残っていること。",
        turning: "そして訪れた、人生の分かれ道。",
        people: "大切な人と過ごした、かけがえのない時間。",
        hardship: "つらく、苦しかった日々のこと。",
        joy: "そして、人生でいちばんうれしかった日。"
      },
      epilogue: ["ここに綴ったのは、{S}の人生のほんの一部。けれど、その一つひとつが、かけがえのない物語。"]
    },

    memoir: {
      partTitles: ["生い立ち", "志と仕事", "転機と縁", "苦難と喜び"],
      prologue: {
        self: ["私自身の歩みを、私の言葉のままに書き留めた記録。"],
        other: ["{S}の歩みを、残された言葉のままに書き留めた記録。"]
      },
      bridges: {
        birthplace: "生まれ育った土地について。",
        childhood: "幼い頃に好んだもの。",
        school: "学生時代の記憶。",
        dream: "若き日の志。",
        work: "仕事のこと。",
        turning: "人生の転機。",
        people: "人との縁。",
        hardship: "最も苦労したこと。",
        joy: "最も喜ばしかったこと。"
      },
      epilogue: ["以上、{S}の歩みの記録。"]
    },

    novel: {
      partTitles: ["はじまりの場所", "胸に灯した夢", "分かれ道", "光の差す日"],
      prologue: {
        self: ["記憶の糸をたぐり寄せると、浮かび上がってくるいくつもの場面。これは、そのひとつひとつを拾い集めた、私の物語。"],
        other: ["記憶の糸をたぐり寄せると、浮かび上がってくるいくつもの場面。これは、そのひとつひとつを拾い集めた、{S}の物語。"]
      },
      bridges: {
        birthplace: "すべての始まりは、あの場所。",
        childhood: "幼い心をとらえて離さなかったもの――。",
        school: "学生時代。いまも色あせない、ひとつの場面。",
        dream: "若き日、胸に灯した夢。",
        work: "働く日々のなかに刻まれた記憶。",
        turning: "やがて訪れた、分かれ道。",
        people: "思い出のなかには、いつも大切な人の姿。",
        hardship: "けれど、平坦なばかりではない道。",
        joy: "そして、光の差す日。"
      },
      epilogue: ["物語は、ここでひとまず幕。ここに綴られなかった日々もまた、確かに{S}の人生の一部。"]
    },

    // 手紙風は章に分けず、一通の手紙として流れるようにします
    letter: {
      prologue: {
        self: ["家族のみんなへ。", "私がこれまで歩いてきた道のりを、少しずつ書き残しておこうと思います。"],
        other: ["{N}へ。", "あなたが歩んできた道のりを、思い出をたどりながら、手紙に綴ってみました。"]
      },
      bridges: {
        birthplace: "{S}が生まれ育った場所のこと。",
        childhood: "子どもの頃、{S}が好きだったこと。",
        school: "学生時代の、忘れられない思い出。",
        dream: "若い頃、{S}が胸に抱いていた夢。",
        work: "仕事にまつわる思い出。",
        turning: "{S}の人生を大きく変えた出来事。",
        people: "大切な人との、忘れられない時間。",
        hardship: "苦労を重ねた日々のこと。",
        joy: "そして、{S}がいちばんうれしかったこと。",
        message: { self: "最後に、みんなに伝えたいこと。", other: "{S}が次の世代に伝えたい言葉。" }
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

  // つなぎの言葉と、書いた人の最初の一文を同じ段落にして、文章が途切れず流れるようにする
  function weave(bridge, answerParagraphs) {
    var paras = answerParagraphs.slice();
    if (!bridge) return paras;
    if (paras.length && !/^[「『]/.test(paras[0])) {
      paras[0] = bridge + paras[0];
      return paras;
    }
    return [bridge].concat(paras);
  }

  function answerOf(data, id) {
    var idx = -1;
    window.QUESTIONS.forEach(function (q, i) { if (q.id === id) idx = i; });
    return idx >= 0 ? String(data.answers[idx] || "").trim() : "";
  }

  function generateFromTemplate(data) {
    var tpl = TEMPLATES[data.tone] || TEMPLATES.warm;
    var ctx = makeContext(data);
    var chapters = [];
    var answeredCount = window.QUESTIONS.filter(function (q, i) {
      return String(data.answers[i] || "").trim();
    }).length;
    if (answeredCount === 0) return null;

    var message = answerOf(data, "message");
    var bridgeFor = function (id) { return fill(pick(tpl.bridges[id], ctx.isSelf) || "", ctx); };

    if (data.tone === "letter") {
      // 手紙：章に分けず、段落を重ねて一通の手紙に
      chapters.push({ heading: "", paragraphs: pick(tpl.prologue, ctx.isSelf).map(function (t) { return fill(t, ctx); }), role: "prologue" });
      window.QUESTIONS.forEach(function (q) {
        var answer = answerOf(data, q.id);
        if (!answer) return;
        var body = q.id === "message" ? toQuote(answer) : toParagraphs(answer);
        chapters.push({ heading: "", paragraphs: weave(bridgeFor(q.id), body) });
      });
      var closing = pick(tpl.epilogue, ctx.isSelf).map(function (t) { return fill(t, ctx); });
      if (ctx.isSelf && ctx.name) closing.push(ctx.name + "より");
      chapters.push({ heading: "", paragraphs: closing, role: "epilogue" });
    } else {
      // 小説の冒頭に置く引用（エピグラフ）
      if (message) {
        var by = ctx.isSelf ? (ctx.name || "私") + "から、次の世代へ" : ctx.S + "の言葉";
        chapters.push({ heading: "", paragraphs: toQuote(message).concat(["―― " + by]), role: "epigraph" });
      }
      chapters.push({ heading: "", paragraphs: pick(tpl.prologue, ctx.isSelf).map(function (t) { return fill(t, ctx); }), role: "prologue" });

      PARTS.forEach(function (ids, pi) {
        var paragraphs = [];
        ids.forEach(function (id) {
          var answer = answerOf(data, id);
          if (!answer) return; // 答えていない質問は、物語に含めない
          paragraphs = paragraphs.concat(weave(bridgeFor(id), toParagraphs(answer)));
        });
        if (paragraphs.length) chapters.push({ heading: tpl.partTitles[pi], paragraphs: paragraphs });
      });

      // 回答が少ないときは、締めの文を付けすぎない
      if (answeredCount >= 3) {
        chapters.push({ heading: "", paragraphs: tpl.epilogue.map(function (t) { return fill(t, ctx); }), role: "epilogue" });
      }
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
      var chapters = [];
      var epigraph = String(json.epigraph || "").trim();
      if (epigraph && data.tone !== "letter") {
        var ctx = makeContext(data);
        var by = ctx.isSelf ? (ctx.name || "私") + "から、次の世代へ" : ctx.S + "の言葉";
        chapters.push({ heading: "", paragraphs: toQuote(epigraph).concat(["―― " + by]), role: "epigraph" });
      }
      return {
        title: String(json.title || defaultTitle(data)),
        subtitle: String(json.subtitle || defaultSubtitle(data)),
        tone: data.tone,
        source: "ai",
        chapters: chapters.concat(json.chapters.map(function (c) {
          return {
            heading: String(c.heading || ""),
            paragraphs: (Array.isArray(c.paragraphs) ? c.paragraphs : [String(c.paragraphs || "")])
              .map(function (p) { return String(p).trim(); })
              .filter(Boolean)
          };
        }))
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
        if (c.role === "epigraph") lines.push("　　　　" + p);
        else lines.push(/^[「『]/.test(p) ? p : "　" + p);
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
    defaultTitle: defaultTitle,
    defaultSubtitle: defaultSubtitle,
    isAIAvailable: function () { return !!(window.APP_CONFIG || {}).AI_ENDPOINT; }
  };
})();
