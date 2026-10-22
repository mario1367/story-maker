/* ============================================================
   物語の生成
   ------------------------------------------------------------
   ・テンプレート生成（標準）：APIキー不要。ブラウザの中だけで動きます。
     書いた人の文章を、言い回しも文末もそのまま本文にし、ひと続きの文章にまとめます。
     アプリが加えるのは、文の頭の短い「つなぎの言葉」と、最初と最後のひとことだけ。
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
     chapters: [ { heading: "見出し（なくてもよい）", paragraphs: ["段落", ...], role: "prologue" | "main" | "epilogue"（任意） } ]
   }
   ============================================================ */
(function () {
  "use strict";

  /* ---------- 雰囲気ごとの文章テンプレート ----------
     雰囲気によって変わるのは、物語の最初（prologue）と最後（epilogue）のひとことです。
     {S} … 主人公の呼び方（自分なら「私」、家族なら「祖母」など）
     {N} … 手紙の宛名
     値が { self, other } のものは、自分／他の人で文を使い分けます。
     どれも「体言止め」にして、書いた人の語り口（です・ます／だ・である）を上書きしないようにしています。 */

  // 最後の質問（悟ったこと・伝えたいこと）。物語の結びに、書いた人の言葉のまま置きます
  var LESSON = "lesson";

  var TEMPLATES = {
    // インタビュー形式：本づくりの取材記事のように、聞き手の質問と本人の答えを交互に並べます
    interview: {
      prologue: {
        self: ["人生でいちばん大きな失敗と、そこから学んだこと。その道のりを、ご本人の言葉で語っていただきました。"],
        other: ["{S}の人生でいちばん大きな失敗と、そこから学んだこと。その道のりを、インタビューの形でまとめました。"]
      },
      // 聞き手の質問。家族の物語でも、ご本人に直接たずねる形にします
      //（実際にご家族へインタビューしながら入力する使い方にも合うように）
      questions: {
        failure: "これまでの人生で、一番大きな失敗は何でしたか。",
        feeling: "そのとき、どんなお気持ちでしたか。",
        overcome: "そこから、どうやって乗り越えたのでしょう。",
        support: "乗り越えるとき、支えになった人や言葉はありましたか。",
        now: "今、その失敗を振り返って、どう思われますか。",
        lesson: "最後に、その経験から次の世代に伝えたいことを聞かせてください。"
      },
      epilogue: ["聞き手：人生の物語メーカー"]
    },

    warm: {
      prologue: {
        self: ["これは、私の人生でいちばん大きな失敗と、そこから学んだことを、私自身の言葉で綴った物語。"],
        other: ["これは、{S}の人生でいちばん大きな失敗と、そこから学んだことを、思い出の言葉でたどる物語。"]
      },
      epilogue: ["ここに綴ったのは、{S}の人生のほんの一部。けれど、その一つひとつが、かけがえのない物語。"]
    },

    memoir: {
      prologue: {
        self: ["私の人生で最も大きな失敗と、そこから得たものを、私の言葉のままに書き留めた記録。"],
        other: ["{S}の人生で最も大きな失敗と、そこから得たものを、残された言葉のままに書き留めた記録。"]
      },
      epilogue: ["以上、{S}の歩みの記録。"]
    },

    novel: {
      prologue: {
        self: ["記憶の糸をたぐると、ひときわ鮮やかに浮かび上がる、ひとつの失敗。これは、そこから始まる私の物語。"],
        other: ["記憶の糸をたぐると、ひときわ鮮やかに浮かび上がる、ひとつの失敗。これは、そこから始まる{S}の物語。"]
      },
      epilogue: ["物語は、ここでひとまず幕。ここに綴られなかった日々もまた、確かに{S}の人生の一部。"]
    },

    letter: {
      prologue: {
        self: ["家族のみんなへ。", "私の人生でいちばん大きな失敗のことを、書き残しておこうと思います。"],
        other: ["{N}へ。", "あなたの人生でいちばん大きな失敗と、そこから学んだことを、手紙に綴ってみました。"]
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

  // 「次の世代に伝えたいこと」を「」でくくる
  function toQuote(answer) {
    var text = String(answer).replace(/\r\n?/g, "\n").trim();
    if (/^[「『]/.test(text)) return toParagraphs(text);
    // 複数行は一つにつなげる（行末に句点がなければ補う）。最後の句点は「」の前では付けない
    text = toParagraphs(text).join("").replace(/[。．]$/, "");
    return ["「" + text + "」"];
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
    var map = { interview: "人生を語る、インタビュー", warm: "心に残る、人生の記憶", memoir: "歩みの記録", novel: "ひとつの人生をめぐる物語", letter: "大切な人への手紙" };
    return map[data.tone] || "";
  }

  /* ---------- テンプレート生成 ----------
     章に分けず、ひと続きの文章にします。
     書いた人の文の頭に、短いつなぎの言葉（「そのときは、」「それでも、」など）を付けて、
     前の答えから自然につながるようにします。書いた人の言葉そのものは変えません。 */

  function answerOf(data, id) {
    var idx = -1;
    window.QUESTIONS.forEach(function (q, i) { if (q.id === id) idx = i; });
    return idx >= 0 ? String(data.answers[idx] || "").trim() : "";
  }

  // 回答の段落を一つにまとめる（文末に句点がなければ補う）
  function joinAnswer(answer) {
    return toParagraphs(answer).join("");
  }

  // 文が「名詞」や「〜です／〜だ」で終わっているか（「支えになったのは、〇〇。」の形にできるか）
  function endsLikeNoun(text) {
    var first = String(text).split(/[。！？!?]/)[0].replace(/[」』）)]+$/, "");
    if (/(です|でした|だ|だった)$/.test(first)) return true;
    return !/[たるうくすぬむぶつぐいんよねなかわぞさけ]$/.test(first);
  }

  // つなぎの言葉と回答を続ける。
  // 回答がすでに、つなぎに当たる言葉（「その時」「でも」など）で始まっていれば、つなぎは付けない
  function lead(prefix, text, skip) {
    if (skip && skip.test(text)) return text;
    if (text.indexOf(prefix.replace(/[、，]$/, "")) === 0) return text;
    return prefix + text;
  }
  var STARTS_WITH_TIME = /^(その時|そのとき|その頃|そのころ|あの時|あのとき|当時)/;
  var STARTS_WITH_LINK = /^(でも|しかし|けれど|けれども|それでも|それから|その後|そこで|だから|そして)/;

  // 質問ごとのつなぎ方（{S}は主人公の呼び方）
  var FLOW = {
    failure: function (t, ctx) {
      return endsLikeNoun(t)
        ? lead(ctx.S + "の人生でいちばん大きな失敗は、", t)
        : ctx.S + "の人生でいちばん大きな失敗。" + t;
    },
    feeling: function (t) { return lead("そのときは、", t, STARTS_WITH_TIME); },
    overcome: function (t) { return lead("それでも、", t, STARTS_WITH_LINK); },
    support: function (t) {
      return endsLikeNoun(t)
        ? lead("そんなとき支えになったのは、", t, STARTS_WITH_LINK)
        : lead("そんなとき、", t, STARTS_WITH_LINK);
    },
    // 「今は〜」で始まる答えには「振り返ると、」だけを付けて、「今」が重ならないように
    now: function (t) { return /^(今|いま)/.test(t) ? lead("振り返ると、", t) : lead("今振り返ると、", t); }
  };

  // どの答えを同じ段落にするか
  var FLOW_PARAGRAPHS = [["failure", "feeling"], ["overcome", "support"], ["now"]];

  function generateFromTemplate(data) {
    var tpl = TEMPLATES[data.tone] || TEMPLATES.warm;
    var ctx = makeContext(data);
    var answeredCount = window.QUESTIONS.filter(function (q, i) {
      return String(data.answers[i] || "").trim();
    }).length;
    if (answeredCount === 0) return null;

    if (data.tone === "interview") return interviewStory(data, tpl, ctx, answeredCount);

    var paragraphs = [];
    FLOW_PARAGRAPHS.forEach(function (ids) {
      var text = "";
      ids.forEach(function (id) {
        var answer = answerOf(data, id);
        if (!answer) return; // 答えていない質問は、物語に含めない
        text += FLOW[id](joinAnswer(answer), ctx);
      });
      if (text) paragraphs.push(text);
    });

    // 結び：悟ったこと・伝えたいことを、書いた人の言葉のまま「」で
    var lesson = answerOf(data, LESSON);
    if (lesson) {
      var lessonLead = ctx.isSelf
        ? (data.tone === "letter" ? "そして、みんなに伝えたいこと。" : "そして、この経験から次の世代へ伝えたいこと。")
        : "そして、この経験から" + ctx.S + "が次の世代へ伝えたいこと。";
      paragraphs.push(lessonLead);
      paragraphs = paragraphs.concat(toQuote(lesson));
    }

    var chapters = [];
    chapters.push({ heading: "", paragraphs: pick(tpl.prologue, ctx.isSelf).map(function (t) { return fill(t, ctx); }), role: "prologue" });
    chapters.push({ heading: "", paragraphs: paragraphs, role: "main" });

    // 回答が少ないときは、締めの文を付けすぎない
    if (answeredCount >= 3 || data.tone === "letter") {
      var closing = pick(tpl.epilogue, ctx.isSelf).map(function (t) { return fill(t, ctx); });
      if (data.tone === "letter" && ctx.isSelf && ctx.name) closing.push(ctx.name + "より");
      chapters.push({ heading: "", paragraphs: closing, role: "epilogue" });
    }

    return {
      title: defaultTitle(data),
      subtitle: defaultSubtitle(data),
      tone: data.tone,
      source: "template",
      chapters: chapters
    };
  }

  /* インタビュー形式：
     ・見出し代わりに、最後の答え（伝えたいこと）を冒頭に大きく引用
     ・リード文
     ・「――」で始まる聞き手の質問と、書いた人の答え（言葉はそのまま）を交互に */
  function interviewStory(data, tpl, ctx, answeredCount) {
    var chapters = [];
    var lesson = answerOf(data, LESSON);
    if (lesson) {
      chapters.push({ heading: "", paragraphs: toQuote(lesson).concat(["―― " + (ctx.isSelf ? (ctx.name || "語り手") : ctx.S)]), role: "epigraph" });
    }
    chapters.push({ heading: "", paragraphs: pick(tpl.prologue, ctx.isSelf).map(function (t) { return fill(t, ctx); }), role: "prologue" });

    var qa = [];
    window.QUESTIONS.forEach(function (q) {
      var answer = answerOf(data, q.id);
      if (!answer) return; // 答えていない質問は、記事に含めない
      qa.push("――" + fill(pick(tpl.questions[q.id], ctx.isSelf), ctx));
      qa = qa.concat(toParagraphs(answer));
    });
    chapters.push({ heading: "", paragraphs: qa.concat(tpl.epilogue), role: "qa" });

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
        if (c.role === "epigraph") lines.push("　　　　" + p);
        else if (c.role === "qa" && /^――/.test(p)) { lines.push(""); lines.push(p); }
        else if (c.role === "qa" && /^聞き手：/.test(p)) { lines.push(""); lines.push("　　　　　　　　" + p); }
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
