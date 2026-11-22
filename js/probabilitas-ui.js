/* =====================================================================
   probabilitas-ui.js — lapisan interaksi & animasi (muat SETELAH probabilitas.js)
   Tidak mengubah logika perhitungan; hanya mengamati DOM yang sudah ada.
   ===================================================================== */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let siap = false; // false selama render awal, agar tab tidak ikut "diulang"

  /* 1. Header berbayang saat digulir + tombol kembali ke atas */
  function aturGulir() {
    const header = $('.site-header');
    const atas = document.createElement('button');
    atas.type = 'button';
    atas.className = 'to-top';
    atas.setAttribute('aria-label', 'Kembali ke atas');
    atas.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5m-6 6l6-6 6 6"/></svg>';
    document.body.appendChild(atas);
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

  /* 2. Indikator geser pada submenu A / B / C */
  function aturPil() {
    const sw = $('.sub-nav');
    if (!sw) return;
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
  }

  /* 3. Angka berhitung naik, sorotan nilai berubah, langkah tersingkap.
        Semua angka dalam satu teks ikut dianimasikan, mis. "0,2461 (24,61%)". */
  const POLA = /\d{1,3}(?:\.\d{3})+(?:,\d+)?|\d+(?:,\d+)?/g;
  const keAngka = (t) => parseFloat(t.replace(/\./g, '').replace(',', '.'));
  const desimal = (t) => (t.split(',')[1] || '').length;
  const cacheNF = new Map();
  const nf = (d) => {
    if (!cacheNF.has(d)) cacheNF.set(d, new Intl.NumberFormat('id-ID', { minimumFractionDigits: d, maximumFractionDigits: d }));
    return cacheNF.get(d);
  };

  function naik(el, teks, dariNol) {
    cancelAnimationFrame(el._raf);
    const token = teks.match(POLA) || [];
    const ke = token.map(keAngka);
    const dari = dariNol ? [] : (el._nums || []);
    el._nums = ke;
    if (!token.length || reduce || /\d[eE][-+]?\d/.test(teks)) return;
    const t0 = performance.now();
    const langkah = (t) => {
      const p = Math.min(1, (t - t0) / 700);
      const e = 1 - Math.pow(1 - p, 3);
      let i = 0;
      const s = p === 1 ? teks : teks.replace(POLA, (m) => {
        const a = dari[i] === undefined ? 0 : dari[i];
        const b = ke[i++];
        return nf(desimal(m)).format(a + (b - a) * e);
      });
      el._set = s;
      el.textContent = s;
      if (p < 1) el._raf = requestAnimationFrame(langkah);
    };
    el._raf = requestAnimationFrame(langkah);
  }

  function picu(el, kelas) {
    el.classList.remove(kelas);
    void el.offsetWidth;
    el.classList.add(kelas);
  }

  function aturAngka() {
    document.addEventListener('animationend', (e) => e.target.classList.remove('flash', 'wipe'));
    const pengamat = new MutationObserver((rekaman) => {
      const sudah = new Set();
      rekaman.forEach((r) => {
        const el = r.target.nodeType === 3 ? r.target.parentElement : r.target;
        if (!el || sudah.has(el)) return;
        sudah.add(el);
        const teks = el.textContent;
        const langkah = el.matches('pre');
        if (teks === el._set) return; // tulisan animasi sendiri
        if (teks === el._final && !langkah) return; // nilai tidak berubah
        el._set = el._final = teks;
        if (el.matches('.status span')) el.classList.toggle('is-yes', /:\s*Ya\b/.test(teks));
        picu(el, langkah ? 'wipe' : 'flash'); // langkah selalu bergerak: tanda "dihitung ulang"
        if (el.matches('.kpi strong, .result-banner strong')) naik(el, teks);
      });
    });
    $$('.kpi strong, .result-banner strong, .status span, #formula-walkthrough, #bayes-walkthrough').forEach((el) =>
      pengamat.observe(el, { childList: true, characterData: true, subtree: true }));
  }

  /* 4. Membuka tab: angka berhitung naik lagi dan batang proporsi tumbuh dari nol */
  function ulangPanel(panel) {
    if (!panel || reduce) return;
    $$('.kpi strong, .result-banner strong', panel).forEach((el) => {
      if (el._final) naik(el, el._final, true);
    });
    const batang = $$('.bar', panel);
    if (batang.length) {
      const lebar = batang.map((b) => b.style.width);
      batang.forEach((b) => { b.style.transition = 'none'; b.style.width = '0%'; });
      void panel.offsetWidth;
      batang.forEach((b, i) => { b.style.transition = ''; b.style.width = lebar[i]; });
    }
  }

  function aturTab() {
    const nav = $('.sub-nav');
    if (!nav) return;
    document.addEventListener('DOMContentLoaded', () => setTimeout(() => { siap = true; }));
    new MutationObserver((rekaman) => {
      if (!siap) return;
      rekaman.forEach((r) => {
        if (r.target.getAttribute('aria-selected') === 'true') ulangPanel(document.getElementById(r.target.getAttribute('aria-controls')));
      });
    }).observe(nav, { attributes: true, attributeFilter: ['aria-selected'], subtree: true });
  }

  /* 5. Tombol Hitung berdenyut saat input diubah; kolom salah langsung difokuskan */
  function aturForm() {
    const tombol = (el) => el.closest && el.closest('form') && el.closest('form').querySelector('[type="submit"]');
    const kotor = (e) => { const b = tombol(e.target); if (b) b.classList.add('is-dirty'); };
    document.addEventListener('input', kotor);
    document.addEventListener('change', kotor);
    document.addEventListener('submit', (e) => { const b = tombol(e.target); if (b) b.classList.remove('is-dirty'); }, true);
    $$('[id^="btn-reset"]').forEach((r) => r.addEventListener('click', () => { const b = tombol(r); if (b) b.classList.remove('is-dirty'); }));

    $$('.alert[role="alert"]').forEach((a) => new MutationObserver(() => {
      if (a.hidden) return;
      const salah = (a.closest('form, section') || document).querySelector('[aria-invalid="true"]');
      if (salah) salah.focus();
    }).observe(a, { attributes: true, attributeFilter: ['hidden'], childList: true }));
  }

  /* Dijalankan langsung (script defer) agar render awal oleh probabilitas.js ikut teranimasi */
  aturAngka();
  aturPil();
  aturTab();
  aturForm();
  aturGulir();
})();
