/* ══════════════════════════════════════════════════════════════
   Инструменты учителя — логика приложения (без зависимостей)
   ══════════════════════════════════════════════════════════════ */
"use strict";

/* ── утилиты ───────────────────────────────────────────────────── */
const $ = (sel, root) => (root || document).querySelector(sel);
const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
const esc = (s) => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const round1 = (n) => (Math.round(n * 10) / 10);
const fmtPct = (n) => (Number.isFinite(n) ? round1(n) + '%' : '—');
const shuffleArr = (a) => { const x = a.slice(); for (let i = x.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [x[i], x[j]] = [x[j], x[i]]; } return x; };
const parseList = (text) => [...new Set(text.split(/\n|,/).map(s => s.trim()).filter(Boolean))];

/* localStorage: общий список класса и список «закреплённых» */
const LS_LIST = 'teacher:classlist';
const LS_PINNED = 'teacher:pinned';

/* ── переливающийся скроллбар ─────────────────────────────────── */
function initScrollbar() {
  const bar = document.createElement('div');
  bar.className = 'scrollbar';
  const thumb = document.createElement('div');
  thumb.className = 'thumb';
  bar.appendChild(thumb);
  document.body.appendChild(bar);

  let ticking = false;
  const update = () => {
    ticking = false;
    const sh = document.documentElement.scrollHeight;
    const ch = window.innerHeight;
    if (sh <= ch) { bar.classList.remove('visible'); return; }
    bar.classList.add('visible');
    const minH = 28;
    const thumbH = Math.max(minH, ch * ch / sh);
    const offset = (ch - thumbH) * (window.scrollY / (sh - ch));
    thumb.style.height = thumbH + 'px';
    thumb.style.transform = `translateY(${offset}px)`;
  };
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  new ResizeObserver(onScroll).observe(document.body);
  update();
}

/* ── переключение вкладок ──────────────────────────────────────── */
function initTabs() {
  const tabs = $$('.tab');
  const panels = $$('.panel');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const id = tab.dataset.tab;
      tabs.forEach(t => { t.classList.toggle('active', t === tab); t.setAttribute('aria-selected', t === tab); });
      panels.forEach(p => p.classList.toggle('active', p.id === 'panel-' + id));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });
}

/* ══════════════ 1. СОУ калькулятор ══════════════ */
const SOU = {
  init() {
    const counters = $('#gradeCounters');
    // степперы
    counters.addEventListener('click', (e) => {
      const btn = e.target.closest('.stepper');
      if (!btn) return;
      const row = btn.closest('.grade-row');
      const input = $('.grade-val', row);
      const d = btn.dataset.act === 'inc' ? 1 : -1;
      input.value = clamp((parseInt(input.value, 10) || 0) + d, 0, 200);
      this.recalc();
    });
    // прямой ввод
    counters.addEventListener('input', (e) => {
      if (!e.target.classList.contains('grade-val')) return;
      this.recalc();
    });
    counters.addEventListener('change', (e) => {
      if (!e.target.classList.contains('grade-val')) return;
      const v = parseInt(e.target.value, 10);
      e.target.value = Number.isFinite(v) ? clamp(v, 0, 200) : 0;
      this.recalc();
    });

    this.initRings();
    this.recalc();
    $('#copyReport').addEventListener('click', () => this.copyReport());
    $('#printReport').addEventListener('click', () => this.printReport());
  },

  counts() {
    const g = {};
    $$('.grade-val').forEach(inp => { g[inp.dataset.grade] = clamp(parseInt(inp.value, 10) || 0, 0, 200); });
    return g;
  },

  compute() {
    const { '5': n5, '4': n4, '3': n3, '2': n2, na } = this.counts();
    const total = n5 + n4 + n3 + n2 + na;
    const assessed = n5 + n4 + n3 + n2;
    const success = assessed ? (n5 + n4 + n3) / assessed * 100 : null;
    const quality = assessed ? (n5 + n4) / assessed * 100 : null;
    const sou = total ? (n5 * 100 + n4 * 64 + n3 * 36 + n2 * 16 + na * 7) / total : null;
    const avg = assessed ? (n5 * 5 + n4 * 4 + n3 * 3 + n2 * 2) / assessed : null;
    return { n5, n4, n3, n2, na, total, assessed, success, quality, sou, avg };
  },

  ringColor(p) {
    if (p == null) return '#c3c9d8';
    if (p >= 80) return '#16a34a';
    if (p >= 60) return '#d97706';
    return '#dc2626';
  },

  initRings() {
    const size = 62, r = 26, c = 2 * Math.PI * r;
    $$('.ring').forEach(el => {
      el.innerHTML = `<svg width="${size}" height="${size}" viewBox="0 0 64 64">
        <circle class="track" cx="32" cy="32" r="${r}" stroke-width="6" fill="none"/>
        <circle class="prog" cx="32" cy="32" r="${r}" stroke-width="6" fill="none"
          stroke-dasharray="${c.toFixed(2)}" stroke-dashoffset="${c.toFixed(2)}" transform="rotate(-90 32 32)"/>
      </svg>`;
    });
  },

  setRing(key, pct) {
    const el = $(`.ring[data-ring="${key}"] .prog`);
    if (!el) return;
    const c = 2 * Math.PI * 26;
    const p = pct == null ? 0 : clamp(pct, 0, 100);
    el.setAttribute('stroke-dashoffset', (c * (1 - p / 100)).toFixed(2));
    el.setAttribute('stroke', this.ringColor(pct == null ? null : pct));
  },

  recalc() {
    const r = this.compute();
    $('#souTotal').textContent = r.total;
    $('#souAssessed').textContent = r.assessed;
    $('#mSuccess').textContent = r.success == null ? '—' : fmtPct(r.success);
    $('#mQuality').textContent = r.quality == null ? '—' : fmtPct(r.quality);
    $('#mSou').textContent = r.sou == null ? '—' : round1(r.sou) + '%';
    $('#mAvg').textContent = r.avg == null ? '—' : r.avg.toFixed(2);
    this.setRing('success', r.success);
    this.setRing('quality', r.quality);
    this.setRing('sou', r.sou);
    this.setRing('avg', r.avg == null ? null : r.avg / 5 * 100);
  },

  reportText() {
    const r = this.compute();
    const cls = $('#souClass').value.trim();
    const subj = $('#souSubject').value.trim();
    const period = $('#souPeriod').value;
    const head = ['Отчёт по предмету', subj || '…', cls ? `(${cls},` : '', cls ? period + ')' : ''].filter(Boolean).join(' ');
    const lines = [];
    lines.push(head + ':');
    lines.push(`Всего: ${r.total} чел. | 5-ок: ${r.n5} | 4-ок: ${r.n4} | 3-ек: ${r.n3} | 2-ек: ${r.n2} | н/а: ${r.na}`);
    lines.push(`Успеваемость: ${fmtPct(r.success)} | Качество: ${fmtPct(r.quality)} | СОУ: ${r.sou == null ? '—' : round1(r.sou) + '%'} | Ср. балл: ${r.avg == null ? '—' : r.avg.toFixed(2)}`);
    return lines.join('\n');
  },

  async copyReport() {
    const text = this.reportText();
    try { await navigator.clipboard.writeText(text); this.flash($('#copyReport'), 'Скопировано ✓'); }
    catch (e) { this.flash($('#copyReport'), 'Не удалось скопировать'); }
  },

  flash(btn, msg) {
    const old = btn.innerHTML;
    btn.innerHTML = msg;
    setTimeout(() => { btn.innerHTML = old; }, 1400);
  },

  printReport() {
    const r = this.compute();
    const cls = $('#souClass').value.trim();
    const subj = $('#souSubject').value.trim();
    const period = $('#souPeriod').value;
    $('#printReportArea').innerHTML = `
      <h1 style="font:700 22px sans-serif;margin:0 0 16px">Отчёт об успеваемости</h1>
      <p style="font:400 15px sans-serif;margin:0 0 4px">${subj ? 'Предмет: ' + esc(subj) : ''}</p>
      <p style="font:400 15px sans-serif;margin:0 0 20px">${cls ? 'Класс: ' + esc(cls) : ''}${cls ? ' · ' : ''}Период: ${esc(period)}</p>
      <table style="border-collapse:collapse;font:400 14px sans-serif;margin-bottom:20px">
        <tr><td style="padding:6px 16px 6px 0">Всего учеников</td><td style="font-weight:700">${r.total}</td></tr>
        <tr><td style="padding:6px 16px 6px 0">«5»</td><td style="font-weight:700">${r.n5}</td></tr>
        <tr><td style="padding:6px 16px 6px 0">«4»</td><td style="font-weight:700">${r.n4}</td></tr>
        <tr><td style="padding:6px 16px 6px 0">«3»</td><td style="font-weight:700">${r.n3}</td></tr>
        <tr><td style="padding:6px 16px 6px 0">«2»</td><td style="font-weight:700">${r.n2}</td></tr>
        <tr><td style="padding:6px 16px 6px 0">н/а</td><td style="font-weight:700">${r.na}</td></tr>
      </table>
      <p style="font:400 15px sans-serif;line-height:1.8">
        Успеваемость: <b>${fmtPct(r.success)}</b><br>
        Качество знаний: <b>${fmtPct(r.quality)}</b><br>
        СОУ (по Симонову): <b>${r.sou == null ? '—' : round1(r.sou) + '%'}</b><br>
        Средний балл: <b>${r.avg == null ? '—' : r.avg.toFixed(2)}</b>
      </p>`;
    window.print();
  }
};

/* ══════════════ 2. Конвертер ОГЭ/ЕГЭ ══════════════ */
const CONVERT = {
  mode: 'ege',
  subject: 'Информатика',
  score: 0,

  init() {
    $('#examMode').addEventListener('click', (e) => {
      const seg = e.target.closest('.seg');
      if (!seg) return;
      this.mode = seg.dataset.mode;
      $$('#examMode .seg').forEach(s => { s.classList.toggle('active', s === seg); s.setAttribute('aria-selected', s === seg); });
      this.subject = 'Информатика';
      this.score = 0;
      $('#scoreInput').value = 0;
      $('#scoreRange').value = 0;
      this.renderSubjects();
      this.renderTable();
      this.renderResult();
    });

    $('#subjectChips').addEventListener('click', (e) => {
      const chip = e.target.closest('.subject-chip');
      if (!chip) return;
      this.subject = chip.dataset.subject;
      this.score = 0;
      $('#scoreInput').value = 0;
      $('#scoreRange').value = 0;
      this.renderSubjects();
      this.renderTable();
      this.renderResult();
    });

    const syncRange = () => {
      let v = parseInt($('#scoreInput').value, 10);
      if (!Number.isFinite(v)) v = 0;
      const max = this.maxPrimary();
      v = clamp(v, 0, max);
      this.score = v;
      $('#scoreInput').value = v;
      $('#scoreRange').value = v;
      this.renderResult();
    };
    $('#scoreInput').addEventListener('input', syncRange);
    $('#scoreRange').addEventListener('input', (e) => {
      const v = parseInt(e.target.value, 10);
      this.score = v;
      $('#scoreInput').value = v;
      this.renderResult();
    });

    this.renderSubjects();
    this.renderTable();
    this.renderResult();
  },

  subjects() {
    return this.mode === 'ege' ? Object.keys(EGE_SCALES).concat('Математика (база)') : Object.keys(OGE_SCALES);
  },

  maxPrimary() {
    if (this.mode === 'ege') {
      if (this.subject === 'Математика (база)') return EGE_BASE_MATH.max;
      return (EGE_SCALES[this.subject] || { max: 100 }).max;
    }
    return (OGE_SCALES[this.subject] || { max: 100 }).max;
  },

  renderSubjects() {
    $('#subjectChips').innerHTML = this.subjects().map(s =>
      `<button class="subject-chip${s === this.subject ? ' active' : ''}" data-subject="${esc(s)}">${esc(s)}</button>`
    ).join('');
    $('#scoreRange').max = this.maxPrimary();
    $('#scoreLabel').textContent = 'Первичный балл (макс. ' + this.maxPrimary() + ')';
  },

  result() {
    if (this.mode === 'ege') {
      if (this.subject === 'Математика (база)') {
        const b = EGE_BASE_MATH.bands.find(b => this.score >= b.min && this.score <= b.max);
        return { kind: 'grade', grade: b ? b.grade : 2, max: EGE_BASE_MATH.max, note: 'Математика (база) — отметка по 5-балльной шкале' };
      }
      const s = EGE_SCALES[this.subject];
      if (!s) return { kind: 'none' };
      const test = this.score >= 1 && this.score <= s.max ? s.scale[this.score - 1] : 0;
      return { kind: 'test', test, max: s.max, minAt: s.minAt };
    }
    const o = OGE_SCALES[this.subject];
    if (!o) return { kind: 'none' };
    const b = o.bands.find(b => this.score >= b.min && this.score <= b.max);
    return { kind: 'grade', grade: b ? b.grade : 2, max: o.max, note: o.note || '' };
  },

  renderResult() {
    const r = this.result();
    const big = $('#convertBig'), sub = $('#convertSub');
    if (r.kind === 'test') {
      if (this.score < 1) {
        big.textContent = '—'; big.style.color = '';
        sub.textContent = `Введите первичный балл (1–${r.max})`;
        return;
      }
      big.textContent = r.test + ' баллов';
      big.style.color = '';
      const parts = [`${this.score} первичных → ${r.test} тестовых`];
      if (r.test < r.minAt) parts.push('ниже минимума для аттестата');
      else parts.push('аттестат получен');
      sub.textContent = parts.join(' · ');
    } else if (r.kind === 'grade') {
      big.textContent = GRADE_LABELS[r.grade];
      big.style.color = GRADE_COLORS[r.grade];
      sub.textContent = `${this.score} первичных из ${r.max}` + (r.note ? ' · ' + r.note : '');
    } else {
      big.textContent = '—'; big.style.color = '';
      sub.textContent = 'Выберите предмет и введите балл';
    }
  },

  renderTable() {
    const wrap = $('#scaleTable');
    $('#tableTitle').textContent = 'Шкала перевода';
    $('#tableNote').textContent = this.subject + ' · ' + (this.mode === 'ege' ? 'ЕГЭ 2025' : 'ОГЭ 2025');

    if (this.mode === 'ege') {
      if (this.subject === 'Математика (база)') {
        wrap.innerHTML = `<table class="scale-table"><thead><tr><th>Первичный балл</th><th>Отметка</th></tr></thead><tbody>` +
          EGE_BASE_MATH.bands.map(b =>
            `<tr class="${this.score >= b.min && this.score <= b.max ? 'current' : ''}"><td>${b.min}–${b.max}</td><td class="gc-${b.grade}">${GRADE_LABELS[b.grade]}</td></tr>`
          ).join('') + `</tbody></table>`;
        return;
      }
      const s = EGE_SCALES[this.subject];
      if (!s) { wrap.innerHTML = ''; return; }
      let rows = '';
      for (let i = 1; i <= s.max; i++) {
        rows += `<tr class="${i === this.score ? 'current' : ''}"><td>${i}</td><td>${s.scale[i - 1]}</td></tr>`;
      }
      wrap.innerHTML = `<table class="scale-table"><thead><tr><th>Первичный</th><th>Тестовый</th></tr></thead><tbody>${rows}</tbody></table>`;
      const cur = $('.scale-table tr.current', wrap);
      if (cur) cur.scrollIntoView({ block: 'center', behavior: 'smooth' });
    } else {
      const o = OGE_SCALES[this.subject];
      if (!o) { wrap.innerHTML = ''; return; }
      wrap.innerHTML = `<table class="scale-table"><thead><tr><th>Первичный балл</th><th>Отметка</th></tr></thead><tbody>` +
        o.bands.map(b =>
          `<tr class="${this.score >= b.min && this.score <= b.max ? 'current' : ''}"><td>${b.min}–${b.max}</td><td class="gc-${b.grade}">${GRADE_LABELS[b.grade]}</td></tr>`
        ).join('') + `</tbody></table>`;
    }
  }
};

/* ══════════════ 3. Кто к доске ══════════════ */
const BOARD = {
  names: [],
  picked: [],
  spinning: false,

  init() {
    const list = $('#classList');
    list.value = localStorage.getItem(LS_LIST) || '';
    this.syncNames();

    list.addEventListener('input', () => {
      localStorage.setItem(LS_LIST, list.value);
      this.syncNames();
    });

    $('#pickBtn').addEventListener('click', () => this.pick());
    $('#resetPicked').addEventListener('click', () => { this.picked = []; this.render(); });
    this.render();
  },

  syncNames() {
    this.names = parseList($('#classList').value);
    if ($('#seatList')) $('#seatList').value = $('#classList').value;
    this.render();
  },

  pool() {
    const exclude = $('#excludePicked').checked;
    if (!exclude) return this.names.slice();
    const left = this.names.filter(n => !this.picked.includes(n));
    return left.length ? left : (this.picked = [], this.names.slice());
  },

  pick() {
    const pool = this.pool();
    if (!pool.length) { this.flash('Добавьте учеников в список'); return; }
    if (this.spinning) return;
    this.spinning = true;
    const stage = $('#boardStage');
    const nameEl = $('#boardName');
    stage.classList.remove('landed');
    stage.classList.add('spinning');
    nameEl.textContent = '';

    const total = 1400;
    const start = Date.now();
    let last = '';
    const tick = () => {
      let n;
      do { n = pool[Math.floor(Math.random() * pool.length)]; } while (n === last && pool.length > 1);
      last = n;
      nameEl.textContent = n;
      if (Date.now() - start < total) setTimeout(tick, 50);
      else this.land(n);
    };
    tick();
  },

  land(name) {
    this.spinning = false;
    const stage = $('#boardStage');
    stage.classList.remove('spinning');
    stage.classList.add('landed');
    $('#boardName').textContent = name;
    $('.stage-idle', stage).style.display = 'none';
    if (!this.picked.includes(name)) this.picked.push(name);
    this.render();
  },

  flash(msg) {
    const el = $('#boardName');
    el.textContent = msg;
    setTimeout(() => { if (el.textContent === msg) el.textContent = this.names.length ? 'Нажмите «Выбрать»' : ''; }, 1200);
  },

  render() {
    $('#boardTotal').textContent = this.names.length;
    $('#boardLeft').textContent = $('#excludePicked').checked
      ? Math.max(0, this.names.length - this.picked.length)
      : this.names.length;
    $('#pickedList').innerHTML = this.picked.map(n => `<span class="picked-tag">${esc(n)}</span>`).join('');
  }
};

/* ══════════════ 4. Рассадка ══════════════ */
const SEATING = {
  init() {
    $('#seatList').value = localStorage.getItem(LS_LIST) || '';
    $('#seatPinned').value = localStorage.getItem(LS_PINNED) || '';

    $('#seatList').addEventListener('input', (e) => {
      localStorage.setItem(LS_LIST, e.target.value);
      $('#classList').value = e.target.value;
      BOARD.syncNames();
    });
    $('#seatPinned').addEventListener('input', (e) => {
      localStorage.setItem(LS_PINNED, e.target.value);
    });

    $('#shuffleBtn').addEventListener('click', () => this.shuffle());
    $('#exportSeating').addEventListener('click', () => this.copy());
  },

  config() {
    return {
      rows: clamp(parseInt($('#seatRows').value, 10) || 3, 1, 10),
      desks: clamp(parseInt($('#seatDesks').value, 10) || 2, 1, 10),
      perDesk: clamp(parseInt($('#seatPerDesk').value, 10) || 2, 1, 3)
    };
  },

  shuffle() {
    const cfg = this.config();
    const names = parseList($('#seatList').value);
    const pinned = parseList($('#seatPinned').value);
    const pinnedSet = new Set(pinned.map(n => n.toLowerCase()));

    const front = names.filter(n => pinnedSet.has(n.toLowerCase()));
    const rest = names.filter(n => !pinnedSet.has(n.toLowerCase()));

    const frontShuffled = shuffleArr(front);
    const restShuffled = shuffleArr(rest);
    const order = frontShuffled.concat(restShuffled);

    const seats = cfg.rows * cfg.desks * cfg.perDesk;
    let idx = 0;
    const seatsPerRow = cfg.desks * cfg.perDesk;

    let html = '<div class="seat-room">';
    for (let r = 0; r < cfg.rows; r++) {
      html += '<div class="seat-row">';
      for (let d = 0; d < cfg.desks; d++) {
        const hasPinned = Array.from({ length: cfg.perDesk }).some((_, i) => {
          const pos = r * seatsPerRow + d * cfg.perDesk + i;
          return order[pos] && pinnedSet.has(order[pos].toLowerCase());
        });
        html += `<div class="seat-desk${hasPinned ? ' pinned' : ''}"><span class="seat-desk-num">Ряд ${r + 1} · парта ${d + 1}</span>`;
        for (let s = 0; s < cfg.perDesk; s++) {
          const name = order[idx] || '';
          idx++;
          html += `<div class="seat-chair${name ? ' filled' : ''}">${esc(name)}</div>`;
        }
        html += '</div>';
      }
      html += '</div>';
    }
    html += '</div>';
    if (names.length > seats) html += `<p class="muted" style="margin-top:8px">⚠ Мест: ${seats}, учеников: ${names.length} — не хватило мест для ${names.length - seats} чел.</p>`;
    else if (names.length < seats) html += `<p class="muted" style="margin-top:8px">Мест: ${seats}, учеников: ${names.length} — ${seats - names.length} мест свободно.</p>`;

    $('#seatingBoard').innerHTML = html;
  },

  copy() {
    const desks = $$('.seat-desk');
    if (!desks.length) return;
    const text = desks.map(d => {
      const row = $('.seat-desk-num', d).textContent;
      const chairs = $$('.seat-chair', d).map(c => c.textContent.trim() || '—').join(', ');
      return `${row}: ${chairs}`;
    }).join('\n');
    navigator.clipboard.writeText(text).then(
      () => this.flashBtn('Скопировано ✓'),
      () => this.flashBtn('Ошибка')
    );
  },

  flashBtn(msg) {
    const b = $('#exportSeating'); const old = b.innerHTML;
    b.innerHTML = msg; setTimeout(() => b.innerHTML = old, 1200);
  }
};

/* ══════════════ 5. Таймер ══════════════ */
const TIMER = {
  total: 300,
  remaining: 300,
  running: false,
  endAt: 0,
  interval: null,
  audio: null,

  init() {
    const presets = $('#timerPresets');
    presets.addEventListener('click', (e) => {
      const p = e.target.closest('.preset');
      if (!p) return;
      this.setTime(parseInt(p.dataset.sec, 10));
      $$('.preset').forEach(x => x.classList.toggle('active', x === p));
    });
    $$('.preset')[1].classList.add('active'); // 5 мин по умолчанию

    const sync = () => {
      const m = clamp(parseInt($('#timerMin').value, 10) || 0, 0, 180);
      const s = clamp(parseInt($('#timerSec').value, 10) || 0, 0, 59);
      this.setTime(m * 60 + s);
    };
    $('#timerMin').addEventListener('input', sync);
    $('#timerSec').addEventListener('input', sync);

    $('#timerStart').addEventListener('click', () => this.toggle());
    $('#timerReset').addEventListener('click', () => this.reset());
    $('#timerFull').addEventListener('click', () => this.fullscreen());
    $('#fsClose').addEventListener('click', () => this.closeFullscreen());
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.closeFullscreen();
    });

    this.setTime(300);
    this.render();
  },

  setTime(sec) {
    this.total = Math.max(0, sec);
    this.remaining = this.total;
    this.stop();
    this.render();
  },

  toggle() {
    if (this.running) { this.pause(); }
    else {
      if (this.remaining <= 0) this.remaining = this.total;
      this.start();
    }
  },

  start() {
    this.running = true;
    this.endAt = Date.now() + this.remaining * 1000;
    this.interval = setInterval(() => this.tick(), 200);
    this.render();
  },

  pause() {
    this.running = false;
    clearInterval(this.interval);
    this.render();
  },

  stop() {
    this.running = false;
    clearInterval(this.interval);
  },

  reset() {
    this.stop();
    this.remaining = this.total;
    this.render();
  },

  tick() {
    const left = Math.max(0, Math.round((this.endAt - Date.now()) / 1000));
    this.remaining = left;
    if (left <= 0) {
      this.stop();
      this.remaining = 0;
      if ($('#timerSound').checked) this.beep();
      this.render();
      return;
    }
    this.render();
  },

  render() {
    const fmt = (s) => {
      const m = Math.floor(s / 60), sec = s % 60;
      return String(m).padStart(2, '0') + ':' + String(sec).padStart(2, '0');
    };
    const face = $('.card-timer-face');
    $('#timerDigits').textContent = fmt(this.remaining);
    $('#fsDigits').textContent = fmt(this.remaining);

    const state = $('#timerState');
    if (this.remaining <= 0 && this.total > 0) {
      state.textContent = 'Время вышло';
      face.classList.add('finished'); face.classList.remove('running');
      $('#fsState').textContent = 'Время вышло';
    } else if (this.running) {
      state.textContent = 'Идёт отсчёт';
      face.classList.add('running'); face.classList.remove('finished');
      $('#fsState').textContent = 'Идёт отсчёт';
    } else {
      state.textContent = 'Готово';
      face.classList.remove('running', 'finished');
      $('#fsState').textContent = 'Готово';
    }

    $('#timerStart').innerHTML = this.running
      ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg> Пауза'
      : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="6 3 20 12 6 21 6 3"/></svg> Старт';

    // кольцо прогресса
    const p = this.total ? (this.remaining / this.total) : 0;
    $('#timerRing').style.setProperty('--tick', (p * 360) + 'deg');
    $('#timerRing').style.background = this.remaining <= 0 && this.total > 0
      ? 'conic-gradient(#dc2626 var(--tick), transparent 0)'
      : 'conic-gradient(var(--primary) var(--tick), transparent 0)';
  },

  beep() {
    try {
      const ctx = this.audio || (this.audio = new (window.AudioContext || window.webkitAudioContext)());
      if (ctx.state === 'suspended') ctx.resume();
      [0, 0.22, 0.44].forEach(t => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'sine'; o.frequency.value = 880;
        o.connect(g); g.connect(ctx.destination);
        const start = ctx.currentTime + t;
        g.gain.setValueAtTime(0.0001, start);
        g.gain.exponentialRampToValueAtTime(0.5, start + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, start + 0.2);
        o.start(start); o.stop(start + 0.22);
      });
    } catch (e) { /* звук не критичен */ }
  },

  fullscreen() {
    const el = $('#fullscreenTimer');
    el.hidden = false;
    this.render();
    if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
    else if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(() => {});
  },

  closeFullscreen() {
    $('#fullscreenTimer').hidden = true;
    if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(() => {});
  }
};

/* ── запуск ─────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  $('#topbarNote').textContent = 'Все расчёты — локально в браузере';
  initScrollbar();
  initTabs();
  SOU.init();
  CONVERT.init();
  BOARD.init();
  SEATING.init();
  TIMER.init();
});
