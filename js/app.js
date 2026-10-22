/* ============================================================
   人生の物語メーカー  画面の動き
   ============================================================ */
(function () {
  "use strict";

  var CONFIG = window.APP_CONFIG || {};
  var QUESTIONS = window.QUESTIONS;
  var TONES = window.TONES;
  var Gen = window.StoryGenerator;
  var STORAGE_KEY = CONFIG.STORAGE_KEY || "denshosha-story-maker-v1";

  /* ---------- 状態 ---------- */
  function emptyState() {
    return {
      screen: "intro",
      target: "",
      name: "",
      answers: QUESTIONS.map(function () { return ""; }),
      skipped: QUESTIONS.map(function () { return false; }),
      qIndex: 0,
      tone: "warm",
      useAI: false,
      story: null,
      edited: false
    };
  }
  var state = emptyState();

  /* ---------- ブラウザ内保存（localStorage） ---------- */
  var storage = {
    load: function () {
      try {
        var raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        var data = JSON.parse(raw);
        if (!data || !Array.isArray(data.answers)) return null;
        return data;
      } catch (e) { return null; }
    },
    save: function () {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        return true;
      } catch (e) { return false; }
    },
    clear: function () {
      try { window.localStorage.removeItem(STORAGE_KEY); } catch (e) { /* 何もしない */ }
    }
  };

  var saveTimer = null;
  function saveNow() {
    clearTimeout(saveTimer);
    saveTimer = null;
    if (!hasProgress(state)) { storage.clear(); return false; }
    return storage.save();
  }
  function saveSoon(showStatus) {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () {
      // 何も入力されていないときは、保存データ自体を残さない
      if (!hasProgress(state)) { storage.clear(); return; }
      var ok = storage.save();
      if (showStatus) {
        $("save-status").textContent = ok ? "ブラウザに一時保存しました" : "";
      }
    }, 400);
  }

  /* ---------- 小さな道具 ---------- */
  function $(id) { return document.getElementById(id); }
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function isOtherPerson() { return state.target === "family" || state.target === "other"; }
  function personName() { return state.name.trim() || "その方"; }

  function questionText(i) {
    var q = QUESTIONS[i];
    if (state.target === "self") return q.self;
    return q.other.replace(/\{name\}/g, personName());
  }

  /* ---------- 画面の切り替え ---------- */
  function show(screen) {
    state.screen = screen;
    var screens = document.querySelectorAll(".screen");
    for (var i = 0; i < screens.length; i++) {
      screens[i].hidden = screens[i].getAttribute("data-screen") !== screen;
    }
    if (screen === "intro") renderIntro();
    if (screen === "target") renderTarget();
    if (screen === "name") renderName();
    if (screen === "question") renderQuestion();
    if (screen === "tone") renderTone();
    if (screen === "result") renderResult();
    window.scrollTo(0, 0);
    var title = document.querySelector('[data-screen="' + screen + '"] h1, [data-screen="' + screen + '"] h2');
    if (title) { title.setAttribute("tabindex", "-1"); title.focus({ preventScroll: true }); }
    saveSoon(false);
  }

  /* ---------- 1. はじめ ---------- */
  function hasProgress(s) {
    if (!s) return false;
    return !!(s.target || s.story || s.answers.some(function (a) { return a && a.trim(); }));
  }
  function renderIntro() {
    var saved = hasProgress(state);
    $("resume-card").hidden = !saved;
    $("start-row").hidden = saved;
  }

  /* ---------- 2. 誰の物語か ---------- */
  function renderTarget() {
    var buttons = document.querySelectorAll("#screen-target .choice");
    for (var i = 0; i < buttons.length; i++) {
      var on = buttons[i].getAttribute("data-target") === state.target;
      buttons[i].setAttribute("aria-checked", on ? "true" : "false");
    }
  }

  /* ---------- 3. 呼び名 ---------- */
  function renderName() {
    var self = state.target === "self";
    $("name-title").textContent = self ? "お名前を教えてください" : "その方を、どう呼びますか？";
    $("name-lead").textContent = self
      ? "物語のタイトルに使います。空欄のままでも進めます。"
      : "質問や物語の中で使う呼び方です。「父」「祖母」「〇〇さん」など、ふだんの呼び方でかまいません。";
    $("name-label").textContent = self ? "お名前（任意）" : "呼び方（任意）";
    $("input-name").placeholder = self ? "例：山田 花子" : "例：祖母、〇〇先生";
    $("input-name").value = state.name;
    $("name-chips").hidden = state.target !== "family";
    $("name-notice").hidden = self;
  }

  /* ---------- 4. 質問 ---------- */
  function renderQuestion() {
    var i = state.qIndex;
    var total = QUESTIONS.length;
    $("q-count").textContent = "質問 " + (i + 1);
    $("q-bar").style.width = Math.round(((i + 1) / total) * 100) + "%";
    $("q-text").textContent = questionText(i);
    $("q-hint").textContent = QUESTIONS[i].hint;
    $("q-answer").value = state.answers[i];
    $("save-status").textContent = "";
    $("btn-q-prev").textContent = i === 0 ? "← 戻る" : "← 前へ";
    $("btn-q-next").textContent = i === total - 1 ? "雰囲気を選ぶ →" : "次へ →";
    renderDots();
  }

  function renderDots() {
    var wrap = $("q-dots");
    wrap.innerHTML = "";
    QUESTIONS.forEach(function (q, i) {
      var b = el("button", "q-dot", String(i + 1));
      b.type = "button";
      if (state.answers[i].trim()) b.classList.add("is-answered");
      else if (state.skipped[i]) b.classList.add("is-skipped");
      if (i === state.qIndex) { b.classList.add("is-current"); b.setAttribute("aria-current", "step"); }
      var status = state.answers[i].trim() ? "回答済み" : (state.skipped[i] ? "とばした質問" : "未回答");
      b.setAttribute("aria-label", "質問" + (i + 1) + "（" + status + "）へ移動");
      b.addEventListener("click", function () { commitAnswer(); state.qIndex = i; renderQuestion(); saveSoon(false); });
      wrap.appendChild(b);
    });
  }

  function commitAnswer() {
    var v = $("q-answer").value;
    state.answers[state.qIndex] = v;
    if (v.trim()) state.skipped[state.qIndex] = false;
  }

  function nextQuestion(skip) {
    commitAnswer();
    if (skip) state.skipped[state.qIndex] = true;
    if (state.qIndex < QUESTIONS.length - 1) {
      state.qIndex++;
      renderQuestion();
      window.scrollTo(0, 0);
      $("q-text").focus({ preventScroll: true });
      saveSoon(false);
    } else {
      show("tone");
    }
  }

  /* ---------- 5. 雰囲気 ---------- */
  function renderTone() {
    var list = $("tone-list");
    list.innerHTML = "";
    TONES.forEach(function (t) {
      var b = el("button", "choice");
      b.type = "button";
      b.setAttribute("role", "radio");
      b.setAttribute("aria-checked", t.id === state.tone ? "true" : "false");
      b.appendChild(el("span", "choice-label", t.label));
      b.appendChild(el("span", "choice-desc", t.desc));
      b.addEventListener("click", function () { state.tone = t.id; renderTone(); saveSoon(false); });
      list.appendChild(b);
    });

    $("ai-option").hidden = !Gen.isAIAvailable();
    $("input-ai").checked = !!state.useAI;

    var review = $("review-list");
    review.innerHTML = "";
    QUESTIONS.forEach(function (q, i) {
      var li = el("li", "review-item");
      li.appendChild(el("p", "review-q", questionText(i)));
      var a = state.answers[i].trim();
      li.appendChild(el("p", a ? "review-a" : "review-a is-empty", a || "（未回答）"));
      var fix = el("button", "link-button", "この質問を直す");
      fix.type = "button";
      fix.addEventListener("click", function () { state.qIndex = i; show("question"); });
      li.appendChild(fix);
      review.appendChild(li);
    });

    var answered = state.answers.filter(function (a) { return a.trim(); }).length;
    var notice = $("tone-notice");
    var msgs = [];
    if (answered > 0 && answered < 3) {
      msgs.push("回答が " + answered + " 問のため、短めの物語になります。答えていない部分を書き足すことはしません。");
    }
    if (isOtherPerson()) {
      msgs.push("ご家族や他の方について書く物語です。公開や共有の際は、ご本人やご家族への配慮をお願いします。");
    }
    notice.textContent = msgs.join(" ");
    notice.hidden = msgs.length === 0;
    $("tone-error").hidden = true;
  }

  function generate() {
    var answered = state.answers.filter(function (a) { return a.trim(); }).length;
    var err = $("tone-error");
    if (answered === 0) {
      err.textContent = "物語をつくるには、少なくとも1つの質問に答えてください。";
      err.hidden = false;
      return;
    }
    if (state.story && state.edited) {
      if (!window.confirm("いま作り直すと、これまでに編集した文章は失われます。作り直しますか？")) return;
    }
    state.useAI = Gen.isAIAvailable() && $("input-ai").checked;

    var data = { target: state.target, name: state.name, tone: state.tone, answers: state.answers };

    if (!state.useAI) {
      state.story = Gen.generateFromTemplate(data);
      state.edited = false;
      show("result");
      return;
    }

    $("loading").hidden = false;
    Gen.generateWithAI(data).then(function (story) {
      state.story = story;
    }).catch(function () {
      state.story = Gen.generateFromTemplate(data);
      state.aiFailed = true;
    }).then(function () {
      $("loading").hidden = true;
      state.edited = false;
      show("result");
      if (state.aiFailed) {
        state.aiFailed = false;
        window.alert("AIでの作成ができなかったため、標準の方法で物語をつくりました。");
      }
    });
  }

  /* ---------- 6. できあがり ---------- */
  var editing = false;

  function renderResult() {
    if (!state.story) { show("tone"); return; }
    $("result-notice").hidden = !isOtherPerson();
    $("ai-notice").hidden = state.story.source !== "ai";
    $("invitation-link").href = CONFIG.SITE_URL || "#";
    setEditing(false, true);
    $("title-form").hidden = true;
    renderBook();
  }

  function renderBook() {
    var story = state.story;
    var book = $("book");
    book.innerHTML = "";
    book.className = "book tone-" + story.tone;

    var cover = el("header", "book-cover");
    cover.appendChild(el("p", "book-label", "人生の物語"));
    cover.appendChild(el("h1", "book-title", story.title));
    if (story.subtitle) cover.appendChild(el("p", "book-subtitle", "―― " + story.subtitle + " ――"));
    cover.appendChild(el("span", "book-seal", "伝"));
    book.appendChild(cover);

    var num = 0;
    story.chapters.forEach(function (c, ci) {
      var sec = el("section", "chapter" + (c.heading ? "" : " chapter-plain"));
      sec.setAttribute("data-index", ci);
      if (c.heading) {
        num++;
        if (story.tone !== "letter") sec.appendChild(el("p", "chapter-num", Gen.chapterNumber(num)));
        sec.appendChild(el("h2", "chapter-heading", c.heading));
      }
      var body = el("div", "chapter-body");
      c.paragraphs.forEach(function (p) {
        body.appendChild(el("p", /^[「『]/.test(p) ? "quote" : "", p));
      });
      sec.appendChild(body);
      book.appendChild(sec);
    });

    book.appendChild(el("p", "book-colophon", "人生の物語メーカーで作成"));
  }

  /* 本文の直接編集 */
  function setEditing(on, silent) {
    editing = on;
    var book = $("book");
    var targets = book.querySelectorAll(".book-title, .book-subtitle, .chapter-heading, .chapter-body");
    for (var i = 0; i < targets.length; i++) {
      if (on) {
        targets[i].contentEditable = "plaintext-only";
        if (targets[i].contentEditable !== "plaintext-only") targets[i].contentEditable = "true";
        targets[i].setAttribute("spellcheck", "false");
      } else {
        targets[i].removeAttribute("contenteditable");
      }
    }
    book.classList.toggle("is-editing", on);
    $("edit-banner").hidden = !on;
    $("btn-edit-label").textContent = on ? "編集を終える" : "文章を編集";
    $("btn-edit").classList.toggle("is-active", on);
    if (!on && !silent) {
      readBookIntoStory();
      renderBook();
    }
  }

  // 画面上の本文を読み取って保存用データに戻す
  function readBookIntoStory() {
    var story = state.story;
    var book = $("book");
    var t = book.querySelector(".book-title");
    if (t) story.title = t.innerText.replace(/\s+/g, " ").trim() || story.title;
    var st = book.querySelector(".book-subtitle");
    if (st) story.subtitle = st.innerText.replace(/^[―\s]+|[―\s]+$/g, "").trim();
    var secs = book.querySelectorAll(".chapter");
    for (var i = 0; i < secs.length; i++) {
      var c = story.chapters[Number(secs[i].getAttribute("data-index"))];
      if (!c) continue;
      var h = secs[i].querySelector(".chapter-heading");
      if (h) c.heading = h.innerText.replace(/\s+/g, " ").trim() || c.heading;
      var body = secs[i].querySelector(".chapter-body");
      c.paragraphs = body.innerText.replace(/\r\n?/g, "\n").split(/\n+/)
        .map(function (s) { return s.trim(); }).filter(Boolean);
    }
    state.edited = true;
    saveSoon(false);
  }

  function openTitleForm() {
    if (editing) setEditing(false);
    $("input-title").value = state.story.title;
    $("input-subtitle").value = state.story.subtitle || "";
    $("title-form").hidden = false;
    $("input-title").focus();
  }

  function downloadText() {
    if (editing) setEditing(false);
    var text = Gen.storyToText(state.story);
    var blob = new Blob(["﻿" + text.replace(/\n/g, "\r\n")], { type: "text/plain;charset=utf-8" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = safeFileName(state.story.title) + ".txt";
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }

  function safeFileName(name) {
    return (name || "物語").replace(/[\\\/:*?"<>|]/g, "").slice(0, 40) || "物語";
  }

  function printBook() {
    if (editing) setEditing(false);
    var original = document.title;
    document.title = safeFileName(state.story.title); // PDFのファイル名になります
    window.print();
    setTimeout(function () { document.title = original; }, 1000);
  }

  /* ---------- 削除・やり直し ---------- */
  function deleteAll() {
    if (!window.confirm("入力した回答や物語を、このブラウザからすべて削除します。よろしいですか？")) return;
    storage.clear();
    state = emptyState();
    editing = false;
    show("intro");
    window.alert("入力データを削除しました。");
  }

  function restartAll() {
    if (!window.confirm("回答と物語を消して、最初から作り直します。よろしいですか？")) return;
    storage.clear();
    state = emptyState();
    show("target");
  }

  /* ---------- イベントの登録 ---------- */
  function bind() {
    $("brand-link").href = CONFIG.HOME_URL || "#";
    $("btn-start").addEventListener("click", function () { show("target"); });
    $("btn-resume").addEventListener("click", function () {
      var s = state.screen;
      show(s && s !== "intro" ? s : (state.target ? "question" : "target"));
    });
    $("btn-restart").addEventListener("click", function () {
      if (!window.confirm("保存されている内容を消して、最初から始めます。よろしいですか？")) return;
      storage.clear();
      state = emptyState();
      show("target");
    });

    document.querySelectorAll("[data-go]").forEach(function (b) {
      b.addEventListener("click", function () { show(b.getAttribute("data-go")); });
    });

    document.querySelectorAll("#screen-target .choice").forEach(function (b) {
      b.addEventListener("click", function () {
        var t = b.getAttribute("data-target");
        if (state.target && state.target !== t && (state.target === "self" || t === "self")) state.name = "";
        state.target = t;
        show("name");
      });
    });

    $("input-name").addEventListener("input", function () { state.name = this.value; saveSoon(false); });
    document.querySelectorAll("#name-chips .chip").forEach(function (c) {
      c.addEventListener("click", function () { state.name = c.textContent; $("input-name").value = state.name; saveSoon(false); });
    });
    $("btn-name-next").addEventListener("click", function () { state.name = $("input-name").value.trim(); show("question"); });
    $("input-name").addEventListener("keydown", function (e) {
      if (e.key === "Enter" && !e.isComposing) { e.preventDefault(); $("btn-name-next").click(); }
    });

    $("q-answer").addEventListener("input", function () {
      state.answers[state.qIndex] = this.value;
      saveSoon(true);
      var dot = $("q-dots").children[state.qIndex];
      if (dot) dot.classList.toggle("is-answered", !!this.value.trim());
    });
    $("btn-q-prev").addEventListener("click", function () {
      commitAnswer();
      if (state.qIndex === 0) { show("name"); return; }
      state.qIndex--;
      renderQuestion();
      window.scrollTo(0, 0);
      saveSoon(false);
    });
    $("btn-q-next").addEventListener("click", function () { nextQuestion(false); });
    $("btn-q-skip").addEventListener("click", function () {
      $("q-answer").value = state.answers[state.qIndex];
      nextQuestion(true);
    });

    $("btn-tone-back").addEventListener("click", function () { state.qIndex = QUESTIONS.length - 1; show("question"); });
    $("input-ai").addEventListener("change", function () { state.useAI = this.checked; saveSoon(false); });
    $("btn-generate").addEventListener("click", generate);

    $("btn-title").addEventListener("click", openTitleForm);
    $("btn-title-cancel").addEventListener("click", function () { $("title-form").hidden = true; });
    $("title-form").addEventListener("submit", function (e) {
      e.preventDefault();
      var t = $("input-title").value.trim();
      if (t) state.story.title = t;
      state.story.subtitle = $("input-subtitle").value.trim();
      state.edited = true;
      $("title-form").hidden = true;
      renderBook();
      saveSoon(false);
    });

    $("btn-edit").addEventListener("click", function () {
      $("title-form").hidden = true;
      setEditing(!editing);
      if (editing) {
        var first = $("book").querySelector(".chapter-body");
        if (first) first.focus();
      }
    });
    var dirty = false;
    $("book").addEventListener("input", function () { if (editing) dirty = true; });
    $("book").addEventListener("focusout", function () {
      if (editing && dirty) { dirty = false; readBookIntoStory(); }
    });

    $("btn-txt").addEventListener("click", downloadText);
    $("btn-print").addEventListener("click", printBook);

    var dialog = $("pdf-dialog");
    $("btn-pdf").addEventListener("click", function () {
      if (dialog.showModal) dialog.showModal(); else printBook();
    });
    $("btn-pdf-go").addEventListener("click", function () { dialog.close(); setTimeout(printBook, 100); });
    $("btn-pdf-cancel").addEventListener("click", function () { dialog.close(); });

    $("btn-tone-change").addEventListener("click", function () {
      if (editing) setEditing(false);
      show("tone");
    });
    $("btn-restart-all").addEventListener("click", restartAll);
    $("btn-delete-top").addEventListener("click", deleteAll);
    $("btn-delete-bottom").addEventListener("click", deleteAll);
  }

  /* ---------- 起動 ---------- */
  function init() {
    var saved = storage.load();
    if (saved) {
      var base = emptyState();
      Object.keys(base).forEach(function (k) { if (saved[k] !== undefined) base[k] = saved[k]; });
      // 質問数が変わっていても動くように揃える
      base.answers = QUESTIONS.map(function (q, i) { return String(saved.answers[i] || ""); });
      base.skipped = QUESTIONS.map(function (q, i) { return !!(saved.skipped && saved.skipped[i]); });
      base.qIndex = Math.min(Math.max(0, base.qIndex | 0), QUESTIONS.length - 1);
      state = base;
    }
    bind();
    // ページを閉じる直前にも、念のため保存する
    window.addEventListener("pagehide", function () { if (saveTimer) saveNow(); });
    document.addEventListener("visibilitychange", function () {
      if (document.visibilityState === "hidden" && saveTimer) saveNow();
    });
    // 起動時はいつも最初の画面から（続きがあれば「続きから」ボタンを表示）
    var resumeScreen = state.screen;
    show("intro");
    state.screen = resumeScreen;
    saveSoon(false);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
