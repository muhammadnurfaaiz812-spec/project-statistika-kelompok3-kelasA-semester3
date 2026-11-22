/* =====================================================================
   statistika-ui.js — lapisan interaksi & animasi (muat SETELAH statistika.js)
   Tidak mengubah logika perhitungan; hanya mengamati DOM yang sudah ada.
   ===================================================================== */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  function elemenBaru(tag, kelas, html) {
    const e = document.createElement(tag);
    e.className = kelas;
    if (html) e.innerHTML = html;
    document.body.appendChild(e);
    return e;
  }

  /* 1. Header berbayang saat digulir + tombol kembali ke atas */
  function aturGulir() {
    const header = $('.site-header');
    const atas = elemenBaru('button', 'to-top',
      '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5m-6 6l6-6 6 6"/></svg>');
    atas.type = 'button';
    atas.setAttribute('aria-label', 'Kembali ke atas');
    atas.addEventListener('click', () => scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }));
    let menunggu = false;
    const perbarui = () => {
      menunggu = false;
      header.classList.toggle('is-scrolled', scrollY > 8);
      atas.classList.toggle('is-show', scrollY > 600);
    };
    addEventListener('scroll', () => {
      if (!menunggu) { menunggu = true; requestAnimationFrame(perbarui); }
    }, { passive: true });
    perbarui();
  }

  /* 2. Indikator geser untuk tombol pilihan (mode input & jenis grafik) */
  function aturPil() {
    $$('.mode-switch, .chart-switch').forEach((sw) => {
      const pil = document.createElement('span');
      pil.className = 'switch-pill no-tr';
      pil.setAttribute('aria-hidden', 'true');
      sw.classList.add('has-pill');
      sw.prepend(pil);
      const letakkan = () => {
        const on = sw.querySelector('[aria-selected="true"]');
        if (!on) return;
        pil.style.setProperty('--x', on.offsetLeft + 'px');
        pil.style.setProperty('--w', on.offsetWidth + 'px');
      };
      new MutationObserver(letakkan).observe(sw, { attributes: true, attributeFilter: ['aria-selected'], subtree: true });
      if (typeof ResizeObserver !== 'undefined') new ResizeObserver(letakkan).observe(sw);
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(letakkan);
      letakkan();
      requestAnimationFrame(() => requestAnimationFrame(() => pil.classList.remove('no-tr')));
    });
  }

  /* 3. Angka berhitung naik + sorotan pada nilai yang berubah */
  function aturAngka() {
    const POLA = /^-?(\d{1,3}(\.\d{3})+|\d+)(,\d+)?$/;
    const keAngka = (t) => (POLA.test(t) ? parseFloat(t.replace(/\./g, '').replace(',', '.')) : null);
    const rafMap = new WeakMap();

    const sorot = (el) => {
      el.classList.remove('flash');
      void el.offsetWidth;
      el.classList.add('flash');
    };
    document.addEventListener('animationend', (e) => e.target.classList.remove('flash'));

    function hitungNaik(el, teks) {
      cancelAnimationFrame(rafMap.get(el));
      const ke = keAngka(teks);
      const dari = typeof el._v === 'number' ? el._v : 0;
      el._v = ke;
      if (ke === null || reduce) return;
      const des = (teks.split(',')[1] || '').length;
      const nf = new Intl.NumberFormat('id-ID', { minimumFractionDigits: des, maximumFractionDigits: des });
      const t0 = performance.now();
      const langkah = (t) => {
        const p = Math.min(1, (t - t0) / 700);
        const s = p === 1 ? teks : nf.format(dari + (ke - dari) * (1 - Math.pow(1 - p, 3)));
        el._set = s;
        el.textContent = s;
        if (p < 1) rafMap.set(el, requestAnimationFrame(langkah));
      };
      rafMap.set(el, requestAnimationFrame(langkah));
    }

    const pengamat = new MutationObserver((rekaman) => {
      const sudah = new Set();
      rekaman.forEach((r) => {
        const el = r.target.nodeType === 3 ? r.target.parentElement : r.target;
        if (!el || sudah.has(el)) return;
        sudah.add(el);
        const teks = el.textContent;
        if (teks === el._set || teks === el._final) return; // tulisan animasi sendiri / nilai tak berubah
        el._set = el._final = teks;
        sorot(el);
        if (el.matches('.kpi strong, .fence-item dd')) hitungNaik(el, teks);
      });
    });
    $$('#hasil-area [id^="res-"], .kpi strong, .fence-item dd, #badge-iqr, #outlier-list').forEach((el) =>
      pengamat.observe(el, { childList: true, characterData: true, subtree: true }));
  }

  /* 4. Grafik: batang tumbuh hanya karena aksi pengguna (bukan saat jendela diubah ukurannya) */
  function aturGrafik() {
    const svg = $('#chart-svg');
    if (!svg) return;
    let siap = true;
    const tandai = () => { siap = true; };
    document.addEventListener('click', (e) => {
      if (e.target.closest('#btn-hitung, #btn-sample, .chart-switch button')) tandai();
    }, true);
    document.addEventListener('change', (e) => {
      if (e.target.matches('#select-kuartil, input[name="calc-type"], #input-csv')) tandai();
    }, true);
    new MutationObserver(() => {
      svg.classList.toggle('anim', siap && !reduce);
      siap = false;
      $$('rect', svg).forEach((r, i) => r.style.setProperty('--i', i * 70 + 'ms'));
    }).observe(svg, { childList: true });
  }

  /* 5. Tombol Hitung berdenyut saat data diubah + pintasan Ctrl/Cmd + Enter */
  function aturInput() {
    const hitung = $('#btn-hitung');
    const area = $('#textarea-data');
    if (!hitung || !area) return;
    area.addEventListener('input', () => hitung.classList.add('is-dirty'));
    area.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); hitung.click(); }
    });
    document.addEventListener('click', (e) => {
      if (e.target.closest('#btn-hitung, #btn-sample, #btn-reset')) hitung.classList.remove('is-dirty');
    });
  }

  /* 6. Toast: pesan muncul melayang bila kotak pesan di panel input tidak terlihat */
  function aturToast() {
    const alertEl = $('#alert-area');
    if (!alertEl) return;
    const toast = elemenBaru('div', 'toast');
    toast.setAttribute('aria-hidden', 'true');
    let timer;
    new MutationObserver(() => {
      if (alertEl.hidden || !alertEl.textContent.trim()) return;
      const r = alertEl.getBoundingClientRect();
      if (r.top >= 0 && r.bottom <= innerHeight - 70) return;
      toast.textContent = alertEl.textContent;
      toast.dataset.jenis = alertEl.dataset.jenis || 'info';
      toast.classList.add('is-show');
      clearTimeout(timer);
      timer = setTimeout(() => toast.classList.remove('is-show'), 4200);
    }).observe(alertEl, { childList: true, attributes: true, attributeFilter: ['hidden'] });
  }

  /* Dijalankan langsung (script defer) agar render awal oleh statistika.js ikut teranimasi */
  aturAngka();
  aturGrafik();
  aturPil();
  aturInput();
  aturToast();
  aturGulir();
})();
