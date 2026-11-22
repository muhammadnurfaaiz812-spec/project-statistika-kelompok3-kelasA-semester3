/* =====================================================================
   statistika.js — Logika & UI Halaman Statistika Deskriptif (Soal 1)
   Bagian 1: modul Statistik (fungsi murni tanpa DOM, bisa diuji di Node)
   Bagian 2: penghubung ke statistika.html
   ===================================================================== */
const Statistik = (() => {
  'use strict';

  const POLA_ANGKA = /^[-+]?(\d+(\.\d*)?|\.\d+)([eE][-+]?\d+)?$/;
  const NAMA_NOMOR = /^(no\.?|nomor|id|index|indeks|urut|nim)$/i;

  function keAngka(teks) {
    const t = String(teks).replace(/\u2212/g, '-').trim().replace(/^["']|["']$/g, '').trim();
    if (!POLA_ANGKA.test(t)) return null;
    const x = Number(t);
    return Number.isFinite(x) ? x : null;
  }

  /* Input manual: pemisah boleh koma, titik koma, spasi, atau baris baru.
     Koma tunggal di dalam angka dibaca sebagai desimal (3,5 -> 3.5). */
  function bacaManual(teks) {
    const mentah = String(teks).replace(/\r/g, '').replace(/\u2212/g, '-');
    const potongan = mentah.split(/[;\s]+/).filter((t) => t !== '');
    const adaTitikKoma = mentah.indexOf(';') !== -1;
    const komaPemisah =
      !adaTitikKoma &&
      potongan.some((t) => /^,|,$/.test(t) || (t.match(/,/g) || []).length >= 2);

    const angka = [];
    let diabaikan = 0;
    potongan.forEach((t) => {
      const bagian = komaPemisah ? t.split(',') : [t.replace(',', '.')];
      bagian.forEach((b) => {
        if (b === '') return;
        const x = keAngka(b);
        if (x === null) diabaikan++;
        else angka.push(x);
      });
    });
    return { angka, diabaikan };
  }

  function pecahBaris(baris, pemisah) {
    const hasil = [];
    let sel = '';
    let dalamKutip = false;
    for (let i = 0; i < baris.length; i++) {
      const c = baris[i];
      if (c === '"') dalamKutip = !dalamKutip;
      else if (!dalamKutip && (c === pemisah || c === '\t')) {
        hasil.push(sel);
        sel = '';
      } else sel += c;
    }
    hasil.push(sel);
    return hasil;
  }

  const jumlahKoma = (b) => (b.match(/,/g) || []).length;

  /* CSV: mengambil SATU kolom numerik (kolom nomor/ID dilewati bila ada kolom lain).
     Pemisah: ';' atau tab bila ada; koma hanya dianggap pemisah jika baris pertama
     berupa header teks atau ada baris dengan >= 2 koma. Selain itu koma = desimal. */
  function bacaCSV(teks) {
    const isi = String(teks).replace(/^\uFEFF/, '').replace(/\r/g, '').replace(/\u2212/g, '-');
    const baris = isi.split('\n').filter((b) => b.trim() !== '');
    if (!baris.length) return { angka: [], diabaikan: 0, kolom: null, jumlahKolom: 0 };

    const angkaDari = (s) => keAngka(s.replace(',', '.'));
    let pemisah = null;
    if (isi.indexOf(';') !== -1) pemisah = ';';
    else if (isi.indexOf('\t') !== -1) pemisah = '\t';
    else if (
      jumlahKoma(baris[0]) > 0 &&
      pecahBaris(baris[0], ',').some((s) => s.trim() !== '' && angkaDari(s.trim()) === null)
    ) pemisah = ',';
    else if (baris.some((b) => jumlahKoma(b) >= 2)) pemisah = ',';

    const sel = baris.map((b) => (pemisah ? pecahBaris(b, pemisah) : [b]).map((s) => s.trim()));
    const adaHeader = sel[0].some((s) => s !== '') && sel[0].every((s) => s === '' || angkaDari(s) === null);
    const header = adaHeader ? sel[0] : [];
    const data = adaHeader ? sel.slice(1) : sel;

    const lebar = sel.reduce((m, r) => Math.max(m, r.length), 0);
    const banyakAngka = new Array(lebar).fill(0);
    data.forEach((r) => r.forEach((s, j) => {
      if (s !== '' && angkaDari(s) !== null) banyakAngka[j]++;
    }));
    const numerik = banyakAngka.map((c, j) => (c > 0 ? j : -1)).filter((j) => j >= 0);
    if (!numerik.length) return { angka: [], diabaikan: 0, kolom: null, jumlahKolom: 0 };

    const layak = numerik.filter((j) => !NAMA_NOMOR.test(header[j] || ''));
    const calon = layak.length ? layak : numerik;
    const dipilih = calon.reduce((b, j) => (banyakAngka[j] > banyakAngka[b] ? j : b), calon[0]);

    const angka = [];
    let diabaikan = 0;
    data.forEach((r) => {
      const s = r[dipilih];
      if (s === undefined || s === '') return;
      const x = angkaDari(s);
      if (x === null) diabaikan++;
      else angka.push(x);
    });
    return {
      angka,
      diabaikan,
      kolom: header[dipilih] || (lebar > 1 ? 'kolom ' + (dipilih + 1) : null),
      jumlahKolom: numerik.length,
    };
  }

  /* Penjumlahan Neumaier: mengurangi galat pembulatan pada data besar */
  function jumlahkan(arr) {
    let s = 0;
    let c = 0;
    for (let i = 0; i < arr.length; i++) {
      const x = arr[i];
      const t = s + x;
      if (Math.abs(s) >= Math.abs(x)) c += s - t + x;
      else c += x - t + s;
      s = t;
    }
    return s + c;
  }

  function medianDari(s) {
    const n = s.length;
    if (n === 0) return null;
    const m = Math.floor(n / 2);
    return n % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
  }

  function cariModus(s) {
    const frek = new Map();
    let maks = 0;
    s.forEach((x) => {
      const f = (frek.get(x) || 0) + 1;
      frek.set(x, f);
      if (f > maks) maks = f;
    });
    const nilai = [];
    let semuaSama = true;
    frek.forEach((f, x) => {
      if (f === maks) nilai.push(x);
      else semuaSama = false;
    });
    const ada = maks > 1 && !(frek.size > 1 && semuaSama);
    return { ada, nilai: ada ? nilai : [], frekuensi: ada ? maks : 0, banyak: ada ? nilai.length : 0 };
  }

  function persenLinear(s, p) {
    const h = (s.length - 1) * p;
    const lo = Math.floor(h);
    const f = h - lo;
    return lo + 1 < s.length ? s[lo] + f * (s[lo + 1] - s[lo]) : s[lo];
  }

  function persenLetak(s, p) {
    const n = s.length;
    const pos = p * (n + 1);
    if (pos <= 1) return s[0];
    if (pos >= n) return s[n - 1];
    const lo = Math.floor(pos);
    return s[lo - 1] + (pos - lo) * (s[lo] - s[lo - 1]);
  }

  /* 'linear'  : interpolasi linear (sama dengan Excel QUARTILE.INC)
     'halves'  : median dua belahan, median tidak ikut ke kedua belahan (Moore–McCabe)
     'letak'   : letak i(n + 1) / 4 */
  function kuartil(s, metode) {
    const n = s.length;
    if (n === 1) return { q1: s[0], q3: s[0] };
    if (metode === 'halves') {
      const m = Math.floor(n / 2);
      return { q1: medianDari(s.slice(0, m)), q3: medianDari(s.slice(n % 2 ? m + 1 : m)) };
    }
    if (metode === 'letak') return { q1: persenLetak(s, 0.25), q3: persenLetak(s, 0.75) };
    return { q1: persenLinear(s, 0.25), q3: persenLinear(s, 0.75) };
  }

  function hitungStatistik(data, opsi = {}) {
    const jenis = opsi.jenis === 'population' ? 'population' : 'sample';
    const metode = opsi.kuartil || 'linear';
    const s = data.slice().sort((a, b) => a - b);
    const n = s.length;
    if (n === 0) return null;

    const jumlah = jumlahkan(s);
    const mean = jumlah / n;

    const ssd = jumlahkan(s.map((x) => (x - mean) ** 2));
    const variansPopulasi = ssd / n;
    const variansSampel = n > 1 ? ssd / (n - 1) : null;
    const sdPopulasi = Math.sqrt(variansPopulasi);
    const sdSampel = variansSampel === null ? null : Math.sqrt(variansSampel);

    const { q1, q3 } = kuartil(s, metode);
    const iqr = q3 - q1;
    const pagarBawah = q1 - 1.5 * iqr;
    const pagarAtas = q3 + 1.5 * iqr;
    const outlier = s.filter((x) => x < pagarBawah || x > pagarAtas);

    return {
      n, jumlah, mean,
      median: medianDari(s),
      modus: cariModus(s),
      min: s[0],
      max: s[n - 1],
      range: s[n - 1] - s[0],
      jenis,
      varians: jenis === 'sample' ? variansSampel : variansPopulasi,
      sd: jenis === 'sample' ? sdSampel : sdPopulasi,
      variansSampel, variansPopulasi, sdSampel, sdPopulasi,
      q1, q3, iqr, pagarBawah, pagarAtas, outlier,
      metodeKuartil: metode,
      terurut: s,
    };
  }

  function langkahBagus(mentah) {
    const p = Math.pow(10, Math.floor(Math.log10(mentah)));
    const f = mentah / p;
    const nf = f <= 1 + 1e-9 ? 1 : f <= 2 + 1e-9 ? 2 : f <= 2.5 + 1e-9 ? 2.5 : f <= 5 + 1e-9 ? 5 : 10;
    return Number((nf * p).toPrecision(12));
  }

  const bulatkan = (x) => Number(x.toPrecision(12));

  function buatHistogram(terurut) {
    const n = terurut.length;
    const min = terurut[0];
    const max = terurut[n - 1];
    if (min === max) {
      return { batas: [min - 0.5, min + 0.5], frekuensi: [n], lebar: 1, kelasSturges: 1 };
    }
    const kelasSturges = Math.ceil(Math.log2(n) + 1);
    const lebar = langkahBagus((max - min) / kelasSturges);
    const awal = Math.floor(min / lebar + 1e-9) * lebar;

    const batas = [bulatkan(awal)];
    let i = 0;
    while (batas[batas.length - 1] <= max) {
      i++;
      batas.push(bulatkan(awal + i * lebar));
    }
    const frekuensi = new Array(batas.length - 1).fill(0);
    terurut.forEach((x) => {
      let idx = Math.floor((x - awal) / lebar + 1e-9);
      if (idx < 0) idx = 0;
      if (idx > frekuensi.length - 1) idx = frekuensi.length - 1;
      frekuensi[idx]++;
    });
    return { batas, frekuensi, lebar, kelasSturges };
  }

  function dataBoxplot(h) {
    const s = h.terurut;
    let kumisBawah = s[0];
    let kumisAtas = s[s.length - 1];
    for (let i = 0; i < s.length; i++) {
      if (s[i] >= h.pagarBawah) { kumisBawah = s[i]; break; }
    }
    for (let i = s.length - 1; i >= 0; i--) {
      if (s[i] <= h.pagarAtas) { kumisAtas = s[i]; break; }
    }
    return { kumisBawah, kumisAtas, q1: h.q1, median: h.median, q3: h.q3, mean: h.mean, outlier: h.outlier };
  }

  const pemformatBawaan =
    typeof Intl !== 'undefined' ? new Intl.NumberFormat('id-ID', { maximumFractionDigits: 4 }) : null;

  function formatAngka(x, desimalMaks) {
    if (typeof x !== 'number' || !Number.isFinite(x)) return '–';
    if (x === 0) x = 0;
    if (x !== 0 && Math.abs(x) < 0.0001) return x.toExponential(2).replace('.', ',');
    let pemformat = pemformatBawaan;
    if (desimalMaks !== undefined && typeof Intl !== 'undefined') {
      pemformat = new Intl.NumberFormat('id-ID', { maximumFractionDigits: desimalMaks });
    }
    return pemformat ? pemformat.format(x) : String(x).replace('.', ',');
  }

  return { bacaManual, bacaCSV, hitungStatistik, buatHistogram, dataBoxplot, langkahBagus, formatAngka };
})();

/* =====================================================================
   PENGHUBUNG KE statistika.html
   ===================================================================== */
function initStatistik() {
  const S = Statistik;
  const $ = (id) => document.getElementById(id);
  const teks = (id, nilai) => {
    const e = $(id);
    if (e) e.textContent = nilai;
  };

  const BATAS_DATA = 100000;
  const BATAS_BERKAS = 5 * 1024 * 1024;
  const TAB_MODE = ['tab-manual', 'tab-csv'];
  const TAB_GRAFIK = ['view-hist', 'view-box'];
  const ID_HASIL = [
    'res-n', 'res-sum', 'res-mean', 'res-median', 'res-mode', 'res-min', 'res-max',
    'res-range', 'res-var', 'res-sd', 'res-q1', 'res-q3', 'res-iqr', 'res-outlier',
    'kpi-n', 'kpi-sum', 'kpi-mean', 'kpi-median', 'kpi-mode',
    'badge-iqr', 'fence-low', 'fence-high', 'outlier-list',
  ];

  let mode = 'manual';
  let tampilan = 'hist';
  let dataCSV = null;
  let hasil = null;
  let kadaluarsa = false;

  /* ---------- Pesan, opsi, dan label ---------- */
  function tampilkanPesan(pesan, jenis) {
    const e = $('alert-area');
    if (!e) return;
    if (!pesan) {
      e.textContent = '';
      e.hidden = true;
      return;
    }
    e.textContent = pesan;
    e.dataset.jenis = jenis || 'info';
    e.hidden = false;
  }

  function jenisData() {
    const r = document.querySelector('input[name="calc-type"]:checked');
    return r ? r.value : 'sample';
  }

  const opsiHitung = () => ({ jenis: jenisData(), kuartil: $('select-kuartil').value });

  function perbaruiJumlah() {
    const d = S.bacaManual($('textarea-data').value);
    let t = d.angka.length + ' data terbaca';
    if (d.diabaikan) t += ' (' + d.diabaikan + ' non-angka diabaikan)';
    teks('info-count', t);
  }

  function perbaruiLabel() {
    const sampel = jenisData() === 'sample';
    teks('lbl-var', sampel ? 'sampel' : 'populasi');
    teks('lbl-sd', sampel ? 'sampel' : 'populasi');
    teks('sym-var', sampel ? 's²' : 'σ²');
    teks('sym-sd', sampel ? 's' : 'σ');
  }

  /* Daftar angka yang dipersingkat: "30, 41, 52 … +4 lainnya" */
  const ringkas = (arr, maks) =>
    arr.slice(0, maks).map((x) => S.formatAngka(x)).join(', ') +
    (arr.length > maks ? ' … +' + (arr.length - maks) + ' lainnya' : '');

  /* ---------- Tabel & kartu hasil ---------- */
  function susunBaris(h) {
    const f = S.formatAngka;
    const sampel = h.jenis === 'sample';
    const label = sampel ? 'sampel' : 'populasi';
    const tidakAda = 'Tidak terdefinisi (n = 1)';
    const teksModus = h.modus.ada
      ? ringkas(h.modus.nilai, 5) + ' (muncul ' + h.modus.frekuensi + '×)'
      : 'Tidak ada modus';
    const teksOutlier = h.outlier.length
      ? 'Ada ' + h.outlier.length + ' outlier: ' + ringkas(h.outlier, 10)
      : 'Tidak ada outlier';

    return [
      { id: 'res-n', no: 1, nama: 'Jumlah data (n)', notasi: 'n', nilai: f(h.n) },
      { id: 'res-sum', no: 2, nama: 'Total nilai (Σx)', notasi: 'Σx', nilai: f(h.jumlah) },
      { id: 'res-mean', no: 3, nama: 'Mean (rata-rata)', notasi: 'x̄', nilai: f(h.mean) },
      { id: 'res-median', no: 4, nama: 'Median', notasi: 'Me', nilai: f(h.median) },
      { id: 'res-mode', no: 5, nama: 'Modus', notasi: 'Mo', nilai: teksModus },
      { id: 'res-min', no: 6, nama: 'Nilai minimum', notasi: 'min', nilai: f(h.min) },
      { id: 'res-max', no: 7, nama: 'Nilai maksimum', notasi: 'max', nilai: f(h.max) },
      { id: 'res-range', no: 8, nama: 'Range (jangkauan)', notasi: 'R', nilai: f(h.range) },
      { id: 'res-var', no: 9, nama: 'Varians (' + label + ')', notasi: sampel ? 's²' : 'σ²', nilai: h.varians === null ? tidakAda : f(h.varians) },
      { id: 'res-sd', no: 10, nama: 'Standar deviasi (' + label + ')', notasi: sampel ? 's' : 'σ', nilai: h.sd === null ? tidakAda : f(h.sd) },
      { id: 'res-q1', no: 11, nama: 'Kuartil 1 (Q1)', notasi: 'Q1', nilai: f(h.q1) },
      { id: 'res-q3', no: 12, nama: 'Kuartil 3 (Q3)', notasi: 'Q3', nilai: f(h.q3) },
      { id: 'res-iqr', no: 13, nama: 'Interquartile Range (IQR)', notasi: 'IQR', nilai: f(h.iqr) },
      { id: 'res-outlier', no: 14, nama: 'Deteksi outlier', notasi: '1,5×IQR', nilai: teksOutlier },
    ];
  }

  function tampilkanHasil() {
    const f = S.formatAngka;
    const baris = susunBaris(hasil);
    baris.forEach((b) => teks(b.id, b.nilai));
    const nilai = (id) => baris.find((b) => b.id === id).nilai;

    teks('kpi-n', nilai('res-n'));
    teks('kpi-sum', nilai('res-sum'));
    teks('kpi-mean', nilai('res-mean'));
    teks('kpi-median', nilai('res-median'));

    const m = hasil.modus;
    teks('kpi-mode', m.ada ? m.nilai.slice(0, 3).map((x) => f(x)).join(', ') : 'Tidak ada');
    teks('kpi-mode-sub', m.ada
      ? 'muncul ' + m.frekuensi + '×' + (m.banyak > 3 ? ' · +' + (m.banyak - 3) + ' lainnya' : '')
      : '');

    teks('badge-iqr', f(hasil.iqr));
    teks('fence-low', f(hasil.pagarBawah));
    teks('fence-high', f(hasil.pagarAtas));

    const outEl = $('outlier-list');
    if (outEl) {
      if (hasil.outlier.length) {
        outEl.textContent = ringkas(hasil.outlier, 10) + ' (' + hasil.outlier.length + ' nilai)';
        outEl.classList.remove('no-outlier');
      } else {
        outEl.textContent = 'Tidak ada outlier terdeteksi';
        outEl.classList.add('no-outlier');
      }
    }
    perbaruiLabel();
  }

  function kosongkanHasil() {
    ID_HASIL.forEach((id) => teks(id, '–'));
    teks('kpi-mode-sub', '');
    perbaruiLabel();
    const svg = $('chart-svg');
    if (svg) while (svg.firstChild) svg.removeChild(svg.firstChild);
    teks('chart-note', '');
  }

  /* =================================================================
     VISUALISASI SVG — digambar ulang sesuai lebar wadah agar teks
     tetap terbaca di ponsel; warna dibaca dari variabel CSS.
     ================================================================= */
  const NS = 'http://www.w3.org/2000/svg';
  const H = 270;
  const M = { kiri: 50, kanan: 20, atas: 22, bawah: 46 };
  let W = 660;
  let C = {};

  function bacaWarna() {
    const gaya = getComputedStyle(document.documentElement);
    const v = (nama, cadangan) => gaya.getPropertyValue(nama).trim() || cadangan;
    C = {
      utama: v('--forest-mid', '#1d4d3e'),
      tua: v('--forest-dark', '#14362b'),
      aksen: v('--gold', '#d97706'),
      bahaya: v('--danger', '#b91c1c'),
      teks: v('--ink-body', '#374640'),
      garis: v('--ink-muted', '#5f6f68'),
    };
  }

  function ukurLebar() {
    const area = $('chart-area');
    if (!area) return 660;
    const cs = getComputedStyle(area);
    const w = area.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    return Math.max(300, Math.min(960, w > 0 ? Math.floor(w) : 660));
  }

  function elemen(nama, atribut, isi) {
    const e = document.createElementNS(NS, nama);
    Object.keys(atribut || {}).forEach((k) => e.setAttribute(k, atribut[k]));
    if (isi !== undefined && isi !== null) e.textContent = isi;
    return e;
  }

  function garis(svg, x1, y1, x2, y2, atribut) {
    svg.appendChild(elemen('line', Object.assign({ x1, y1, x2, y2, stroke: C.garis, 'stroke-opacity': '0.35' }, atribut || {})));
  }

  function label(svg, x, y, isi, atribut) {
    svg.appendChild(elemen('text', Object.assign({ x, y, fill: C.teks, 'font-size': '12', 'text-anchor': 'middle' }, atribut || {}), isi));
  }

  function gambarGrafik() {
    const svg = $('chart-svg');
    if (!svg || !hasil) return;
    W = ukurLebar();
    bacaWarna();
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    svg.style.minWidth = '0';
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    if (tampilan === 'hist') gambarHistogram(svg);
    else gambarBoxplot(svg);
  }

  function gambarHistogram(svg) {
    const f = S.formatAngka;
    const h = S.buatHistogram(hasil.terurut);
    const lebarArea = W - M.kiri - M.kanan;
    const tinggiArea = H - M.atas - M.bawah;
    const y0 = M.atas + tinggiArea;
    const jumlahKelas = h.frekuensi.length;

    const fMaks = Math.max.apply(null, h.frekuensi);
    const langkahY = Math.max(1, Math.ceil(S.langkahBagus(fMaks / 5)));
    const yMaks = Math.ceil(fMaks / langkahY) * langkahY;

    for (let v = 0; v <= yMaks; v += langkahY) {
      const y = y0 - (v / yMaks) * tinggiArea;
      garis(svg, M.kiri, y, W - M.kanan, y, {
        'stroke-opacity': v === 0 ? '0.8' : '0.25',
        'stroke-dasharray': v === 0 ? 'none' : '4 4',
      });
      label(svg, M.kiri - 8, y + 4, String(v), { 'text-anchor': 'end' });
    }
    garis(svg, M.kiri, M.atas, M.kiri, y0, { 'stroke-opacity': '0.8' });

    const lb = lebarArea / jumlahKelas;
    h.frekuensi.forEach((fr, i) => {
      if (fr === 0) return;
      const tinggi = (fr / yMaks) * tinggiArea;
      const x = M.kiri + i * lb;
      svg.appendChild(elemen('rect', {
        x: x + 2, y: y0 - tinggi, width: Math.max(lb - 4, 2), height: tinggi,
        rx: 4, fill: C.utama, 'fill-opacity': '0.9',
      }));
      if (lb >= 18) label(svg, x + lb / 2, y0 - tinggi - 5, String(fr), { 'font-weight': '700', fill: C.tua });
    });

    const maksLabel = Math.max(2, Math.floor(lebarArea / 56));
    const lompat = Math.max(1, Math.ceil(h.batas.length / maksLabel));
    h.batas.forEach((b, i) => {
      if (i % lompat === 0 || i === h.batas.length - 1) label(svg, M.kiri + i * lb, y0 + 18, f(b, 2));
    });
    label(svg, M.kiri + lebarArea / 2, H - 6, 'Interval Nilai Data', { 'font-weight': '600' });
    label(svg, 14, M.atas + tinggiArea / 2, 'Frekuensi', {
      'font-weight': '600',
      transform: 'rotate(-90 14 ' + (M.atas + tinggiArea / 2) + ')',
    });

    teks('chart-note',
      'Histogram: ' + jumlahKelas + ' kelas interval dengan lebar kelas ' + f(h.lebar, 4) +
      ' (aturan Sturges k = ' + h.kelasSturges + '). Batas bawah inklusif, batas atas eksklusif.');
  }

  function gambarBoxplot(svg) {
    const f = S.formatAngka;
    const b = S.dataBoxplot(hasil);
    const lebarArea = W - M.kiri - M.kanan;
    const tinggiArea = H - M.atas - M.bawah;
    const y0 = M.atas + tinggiArea;
    const yTengah = M.atas + tinggiArea / 2 - 4;

    let lo = hasil.min;
    let hi = hasil.max;
    if (lo === hi) { lo -= 1; hi += 1; }
    const pad = (hi - lo) * 0.06;
    lo -= pad;
    hi += pad;
    const x = (v) => M.kiri + ((v - lo) / (hi - lo)) * lebarArea;

    garis(svg, M.kiri, y0, W - M.kanan, y0, { 'stroke-opacity': '0.8' });
    const langkah = S.langkahBagus((hi - lo) / Math.max(3, Math.floor(lebarArea / 90)));
    for (let i = Math.ceil(lo / langkah - 1e-9); i * langkah <= hi + 1e-9; i++) {
      const v = Number((i * langkah).toPrecision(12));
      garis(svg, x(v), y0, x(v), y0 + 5, { 'stroke-opacity': '0.8' });
      label(svg, x(v), y0 + 18, f(v, 2));
    }
    label(svg, M.kiri + lebarArea / 2, H - 6, 'Sebaran Nilai Data', { 'font-weight': '600' });

    const tebal = { stroke: C.utama, 'stroke-opacity': '1', 'stroke-width': '2' };
    garis(svg, x(b.kumisBawah), yTengah, x(b.q1), yTengah, tebal);
    garis(svg, x(b.q3), yTengah, x(b.kumisAtas), yTengah, tebal);
    garis(svg, x(b.kumisBawah), yTengah - 14, x(b.kumisBawah), yTengah + 14, tebal);
    garis(svg, x(b.kumisAtas), yTengah - 14, x(b.kumisAtas), yTengah + 14, tebal);

    svg.appendChild(elemen('rect', {
      x: x(b.q1), y: yTengah - 32, width: Math.max(x(b.q3) - x(b.q1), 2), height: 64, rx: 4,
      fill: C.utama, 'fill-opacity': '0.18', stroke: C.utama, 'stroke-width': '2.2',
    }));
    garis(svg, x(b.median), yTengah - 32, x(b.median), yTengah + 32, {
      stroke: C.aksen, 'stroke-opacity': '1', 'stroke-width': '4',
    });

    const mx = x(b.mean);
    svg.appendChild(elemen('polygon', {
      points: [mx + ',' + (yTengah - 7), (mx + 7) + ',' + yTengah, mx + ',' + (yTengah + 7), (mx - 7) + ',' + yTengah].join(' '),
      fill: C.tua,
    }));

    b.outlier.forEach((o) => {
      svg.appendChild(elemen('circle', { cx: x(o), cy: yTengah, r: 5, fill: C.bahaya }));
      label(svg, x(o), yTengah - 11, f(o), { fill: C.bahaya, 'font-weight': '700', 'font-size': '11' });
    });

    teks('chart-note',
      'Boxplot: Q1 = ' + f(b.q1) + ', Median = ' + f(b.median) + ', Q3 = ' + f(b.q3) +
      ' | Kumis: ' + f(b.kumisBawah) + ' s.d. ' + f(b.kumisAtas) +
      '. Garis emas = Median, belah ketupat = Mean, titik merah = Outlier (' + b.outlier.length + ').');
  }

  /* =================================================================
     AKSI TOMBOL & FILE
     ================================================================= */
  function ambilData() {
    if (mode === 'csv') {
      if (!dataCSV) return { angka: [], diabaikan: 0, galat: 'Belum ada file CSV yang dipilih.' };
      return dataCSV;
    }
    return S.bacaManual($('textarea-data').value);
  }

  function gulirKeHasil() {
    if (!window.matchMedia('(max-width: 960px)').matches) return;
    const kurangiGerak = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    $('hasil-area').scrollIntoView({ behavior: kurangiGerak ? 'auto' : 'smooth', block: 'start' });
  }

  function hitung(gulir) {
    const d = ambilData();
    if (d.galat) { tampilkanPesan(d.galat, 'galat'); return; }
    if (d.angka.length === 0) {
      tampilkanPesan('Tidak ada angka valid yang dapat dihitung. Periksa kembali data yang dimasukkan.', 'galat');
      return;
    }
    if (d.angka.length > BATAS_DATA) {
      tampilkanPesan('Data terlalu banyak (maksimal ' + S.formatAngka(BATAS_DATA) + ' angka).', 'galat');
      return;
    }
    hasil = S.hitungStatistik(d.angka, opsiHitung());
    kadaluarsa = false;
    tampilkanHasil();
    gambarGrafik();

    const catatan = [];
    if (d.diabaikan) catatan.push(d.diabaikan + ' nilai non-angka diabaikan.');
    if (hasil.n === 1 && hasil.jenis === 'sample') {
      catatan.push('Hanya terdapat 1 data, sehingga varians dan standar deviasi sampel tidak terdefinisi.');
    }
    tampilkanPesan(catatan.join(' '), 'info');
    if (gulir) gulirKeHasil();
  }

  /* Dipanggil saat jenis data / metode kuartil diubah */
  function hitungUlang() {
    perbaruiLabel();
    if (hasil) hitung(false);
  }

  function reset() {
    $('textarea-data').value = '';
    $('input-csv').value = '';
    teks('csv-filename', '');
    const radioSampel = document.querySelector('input[name="calc-type"][value="sample"]');
    if (radioSampel) radioSampel.checked = true;
    $('select-kuartil').value = 'linear';
    dataCSV = null;
    hasil = null;
    kadaluarsa = false;
    tampilkanPesan('');
    kosongkanHasil();
    perbaruiJumlah();
  }

  /* Tab dengan tabindex bergulir + navigasi panah kiri/kanan */
  function aktifkanTab(daftar, aktifId) {
    daftar.forEach((id) => {
      const e = $(id);
      const on = id === aktifId;
      e.setAttribute('aria-selected', String(on));
      e.tabIndex = on ? 0 : -1;
    });
  }

  function panahTab(daftar, pilih) {
    daftar.forEach((id, i) => {
      $(id).addEventListener('keydown', (e) => {
        const arah = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (!arah) return;
        e.preventDefault();
        const tujuan = daftar[(i + arah + daftar.length) % daftar.length];
        pilih(tujuan);
        $(tujuan).focus();
      });
    });
  }

  function pilihMode(m) {
    mode = m;
    aktifkanTab(TAB_MODE, m === 'csv' ? 'tab-csv' : 'tab-manual');
    $('manual-area').hidden = m !== 'manual';
    $('upload-csv-area').hidden = m !== 'csv';
    kadaluarsa = false;
    tampilkanPesan('');
  }

  function pilihTampilan(v) {
    tampilan = v;
    aktifkanTab(TAB_GRAFIK, v === 'box' ? 'view-box' : 'view-hist');
    gambarGrafik();
  }

  function prosesFileObjek(file) {
    dataCSV = null;
    teks('csv-filename', '');
    if (!file) return;
    if (file.size > BATAS_BERKAS) {
      tampilkanPesan('Berkas terlalu besar (maksimal 5 MB).', 'galat');
      return;
    }
    const pembaca = new FileReader();
    pembaca.onload = () => {
      const d = S.bacaCSV(String(pembaca.result));
      if (d.angka.length === 0) {
        tampilkanPesan('Tidak ada data numerik pada berkas ini. Pastikan ada kolom yang berisi angka.', 'galat');
        return;
      }
      dataCSV = d;
      let t = '✓ ' + file.name + ': ' + d.angka.length + ' data';
      if (d.kolom) t += ' dari kolom "' + d.kolom + '"';
      if (d.jumlahKolom > 1) t += ' (' + d.jumlahKolom + ' kolom numerik, kolom lain diabaikan)';
      if (d.diabaikan) t += ', ' + d.diabaikan + ' sel teks diabaikan';
      teks('csv-filename', t);
      tampilkanPesan('');
      hitung(true);
    };
    pembaca.onerror = () => tampilkanPesan('Gagal membaca file CSV. Silakan pilih ulang berkasnya.', 'galat');
    pembaca.readAsText(file);
  }

  function unduhBerkas(isi, nama, jenis) {
    const url = URL.createObjectURL(new Blob([isi], { type: jenis }));
    const a = document.createElement('a');
    a.href = url;
    a.download = nama;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  const unduhContohCSV = () =>
    unduhBerkas('Nilai_Ujian\n65\n70\n72\n75\n78\n80\n82\n85\n88\n90\n92\n145\n',
      'contoh-data-statistika.csv', 'text/csv;charset=utf-8;');

  function isiTabel() {
    return [['No.', 'Ukuran statistik', 'Notasi', 'Hasil']].concat(
      susunBaris(hasil).map((b) => [b.no, b.nama, b.notasi, b.nilai])
    );
  }

  function salinCadangan(isi, berhasil) {
    const ta = document.createElement('textarea');
    ta.value = isi;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
    document.body.removeChild(ta);
    if (ok) berhasil();
    else tampilkanPesan('Gagal menyalin otomatis. Blok tabelnya lalu tekan Ctrl+C.', 'galat');
  }

  function salinTabel() {
    if (!hasil) {
      tampilkanPesan('Belum ada hasil perhitungan. Tekan Hitung Statistik terlebih dahulu.', 'galat');
      return;
    }
    const isi = isiTabel().map((baris) => baris.join('\t')).join('\n');
    const tombol = $('btn-copy-table');
    const asli = tombol.textContent;
    const berhasil = () => {
      tombol.textContent = 'Tersalin ✓';
      setTimeout(() => { tombol.textContent = asli; }, 1500);
    };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(isi).then(berhasil, () => salinCadangan(isi, berhasil));
    } else {
      salinCadangan(isi, berhasil);
    }
  }

  function eksporCSV() {
    if (!hasil) {
      tampilkanPesan('Belum ada hasil perhitungan. Tekan Hitung Statistik terlebih dahulu.', 'galat');
      return;
    }
    const kutip = (c) => '"' + String(c).replace(/"/g, '""') + '"';
    const isi = isiTabel().map((baris) => baris.map(kutip).join(';')).join('\r\n');
    unduhBerkas('\uFEFF' + isi, 'hasil-statistika.csv', 'text/csv;charset=utf-8;');
  }

  /* ---------- Event listeners ---------- */
  $('btn-hitung').addEventListener('click', () => hitung(true));
  $('btn-reset').addEventListener('click', reset);
  $('btn-sample').addEventListener('click', () => {
    const contoh = $('textarea-data').defaultValue.trim();
    if (!contoh) return;
    $('textarea-data').value = contoh;
    tampilkanPesan('');
    perbaruiJumlah();
    hitung(true);
  });
  $('textarea-data').addEventListener('input', () => {
    perbaruiJumlah();
    if (hasil && !kadaluarsa) {
      kadaluarsa = true;
      tampilkanPesan('Data diubah. Tekan Hitung Statistik untuk memperbarui hasil.', 'info');
    }
  });

  $('tab-manual').addEventListener('click', () => pilihMode('manual'));
  $('tab-csv').addEventListener('click', () => pilihMode('csv'));
  panahTab(TAB_MODE, (id) => pilihMode(id === 'tab-csv' ? 'csv' : 'manual'));
  document.addEventListener('app:modechange', (e) => {
    if (e.detail && e.detail.mode) mode = e.detail.mode;
  });

  $('input-csv').addEventListener('change', (e) => prosesFileObjek(e.target.files && e.target.files[0]));
  $('btn-download-sample-csv')?.addEventListener('click', unduhContohCSV);

  const dropzone = $('dropzone-csv');
  if (dropzone) {
    ['dragenter', 'dragover'].forEach((evt) => dropzone.addEventListener(evt, (e) => {
      e.preventDefault();
      dropzone.classList.add('is-dragover');
    }));
    ['dragleave', 'drop'].forEach((evt) => dropzone.addEventListener(evt, (e) => {
      e.preventDefault();
      dropzone.classList.remove('is-dragover');
    }));
    dropzone.addEventListener('drop', (e) => {
      const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      if (file) prosesFileObjek(file);
    });
  }

  $('view-hist').addEventListener('click', () => pilihTampilan('hist'));
  $('view-box').addEventListener('click', () => pilihTampilan('box'));
  panahTab(TAB_GRAFIK, (id) => pilihTampilan(id === 'view-box' ? 'box' : 'hist'));
  $('select-kuartil').addEventListener('change', hitungUlang);
  document.querySelectorAll('input[name="calc-type"]').forEach((r) => r.addEventListener('change', hitungUlang));
  $('btn-copy-table').addEventListener('click', salinTabel);
  $('btn-export-csv').addEventListener('click', eksporCSV);

  /* Gambar ulang grafik bila lebar wadah berubah (rotasi layar, ubah ukuran jendela) */
  const areaGrafik = $('chart-area');
  if (areaGrafik && typeof ResizeObserver !== 'undefined') {
    let lebarLama = 0;
    let menunggu = false;
    new ResizeObserver(() => {
      if (menunggu) return;
      menunggu = true;
      requestAnimationFrame(() => {
        menunggu = false;
        const w = ukurLebar();
        if (hasil && Math.abs(w - lebarLama) >= 2) {
          lebarLama = w;
          gambarGrafik();
        }
      });
    }).observe(areaGrafik);
  }

  /* ---------- Inisialisasi & hitung otomatis data contoh ---------- */
  pilihMode('manual');
  aktifkanTab(TAB_GRAFIK, 'view-hist');
  perbaruiJumlah();
  perbaruiLabel();
  if ($('textarea-data').value.trim()) hitung(false);
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('btn-hitung')) initStatistik();
  });
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Statistik;
}