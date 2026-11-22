/* =====================================================================
   probabilitas.js — Logika & UI Halaman Kalkulator Probabilitas (Soal 2)
   A. Probabilitas dasar · B. Bersyarat & Bayes · C. Binomial & Poisson
   ===================================================================== */
(() => {
    'use strict';

    const $ = (id) => document.getElementById(id);

    /* ---------- Galat input: membawa id kolom yang salah ---------- */
    class GalatInput extends Error {
        constructor(pesan, id) {
            super(pesan);
            this.id = id;
        }
    }

    /* Menerima 0,3 / 0.3 / 1e-3 / −0,5. Pemisah ribuan sengaja ditolak. */
    const POLA_ANGKA = /^[-+]?(\d+([.,]\d*)?|[.,]\d+)([eE][-+]?\d+)?$/;

    const parse = (id, label) => {
        const mentah = ($(id)?.value ?? '').replace(/\u2212/g, '-').trim();
        const nilai = POLA_ANGKA.test(mentah) ? Number(mentah.replace(',', '.')) : NaN;
        if (!Number.isFinite(nilai)) throw new GalatInput(`${label} harus berupa angka yang valid.`, id);
        return nilai;
    };

    const probability = (id, label) => {
        const nilai = parse(id, label);
        if (nilai < 0 || nilai > 1) throw new GalatInput(`${label} harus berada di antara 0 dan 1.`, id);
        return nilai;
    };

    const percent = (id, label) => {
        const nilai = parse(id, label);
        if (nilai < 0 || nilai > 100) throw new GalatInput(`${label} harus berada di antara 0% dan 100%.`, id);
        return nilai / 100;
    };

    const integer = (id, label, min = 0) => {
        const nilai = parse(id, label);
        if (!Number.isInteger(nilai) || nilai < min) {
            throw new GalatInput(`${label} harus berupa bilangan bulat minimal ${min}.`, id);
        }
        return nilai;
    };

    /* ---------- Format & keluaran ---------- */
    const pemformat = new Map();
    const fmt = (nilai, digit = 6) => {
        if (!Number.isFinite(nilai)) return '–';
        if (nilai === 0) nilai = 0; // buang -0
        if (digit > 0 && nilai !== 0 && Math.abs(nilai) < 10 ** -digit) return nilai.toExponential(2).replace('.', ',');
        if (!pemformat.has(digit)) pemformat.set(digit, new Intl.NumberFormat('id-ID', { maximumFractionDigits: digit }));
        return pemformat.get(digit).format(nilai);
    };

    const output = (id, nilai) => {
        const e = $(id);
        if (e) e.textContent = nilai;
    };

    const resetOutputs = (ids) => ids.forEach((id) => output(id, '–'));

    const showError = (id, pesan = '') => {
        const e = $(id);
        if (!e) return;
        e.textContent = pesan;
        e.hidden = !pesan;
    };

    /* Menjalankan perhitungan; galat ditampilkan di kotak pesan dan kolom yang salah ditandai */
    const runSafely = (alertId, callback) => {
        const lingkup = $(alertId)?.closest('form, section') || document;
        lingkup.querySelectorAll('[aria-invalid]').forEach((e) => e.removeAttribute('aria-invalid'));
        showError(alertId);
        try {
            callback();
        } catch (galat) {
            showError(alertId, galat.message || 'Terjadi kesalahan perhitungan.');
            if (galat.id && $(galat.id)) $(galat.id).setAttribute('aria-invalid', 'true');
        }
    };

    /* Enter di kolom mana pun menjalankan perhitungan bagian tersebut */
    const pasangForm = (idForm, aksi) =>
        $(idForm)?.addEventListener('submit', (e) => {
            e.preventDefault();
            aksi();
        });

    /* ===================================================================
       SUBMENU (A / B / C) — dapat dioperasikan dengan panah kiri/kanan
       =================================================================== */
    const tabSub = Array.from(document.querySelectorAll('.sub-nav [data-sub]'));

    function pilihSub(nama, fokus) {
        tabSub.forEach((t) => {
            const aktif = t.dataset.sub === nama;
            t.setAttribute('aria-selected', String(aktif));
            t.tabIndex = aktif ? 0 : -1;
            const panel = $(t.getAttribute('aria-controls'));
            if (panel) panel.hidden = !aktif;
            if (aktif && fokus) t.focus();
        });
    }

    tabSub.forEach((t, i) => {
        t.addEventListener('click', () => pilihSub(t.dataset.sub));
        t.addEventListener('keydown', (e) => {
            const arah = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
            if (e.key === 'Home' || e.key === 'End') {
                e.preventDefault();
                pilihSub(tabSub[e.key === 'Home' ? 0 : tabSub.length - 1].dataset.sub, true);
            } else if (arah) {
                e.preventDefault();
                pilihSub(tabSub[(i + arah + tabSub.length) % tabSub.length].dataset.sub, true);
            }
        });
    });

    /* ===================================================================
       A. PROBABILITAS DASAR
       =================================================================== */
    const relasi = $('select-relasi');

    const aturRelasi = () => {
        const kolom = $('wrapper-pab');
        if (kolom && relasi) kolom.hidden = relasi.value !== 'custom';
    };

    function hitungDasar() {
        runSafely('alert-prob', () => {
            const pa = probability('input-pa', 'P(A)');
            const pb = probability('input-pb', 'P(B)');
            let irisan;
            let langkahIrisan;

            if (relasi.value === 'exclusive') {
                irisan = 0;
                langkahIrisan = 'Karena saling lepas, P(A ∩ B) = 0';
            } else if (relasi.value === 'independent') {
                irisan = pa * pb;
                langkahIrisan = `Karena independen, P(A ∩ B) = P(A) × P(B) = ${fmt(pa)} × ${fmt(pb)} = ${fmt(irisan)}`;
            } else {
                irisan = probability('input-pab', 'P(A ∩ B)');
                langkahIrisan = `Diketahui P(A ∩ B) = ${fmt(irisan)}`;
            }

            if (irisan > Math.min(pa, pb) + 1e-12) {
                throw new GalatInput('P(A ∩ B) tidak boleh melebihi P(A) atau P(B).', 'input-pab');
            }

            const gabungan = pa + pb - irisan;
            if (gabungan > 1 + 1e-12) {
                throw new GalatInput(
                    'Kombinasi peluang menghasilkan P(A ∪ B) > 1. Periksa kembali hubungan kejadian.',
                    relasi.value === 'custom' ? 'input-pab' : 'input-pb'
                );
            }

            output('prob-pa', fmt(pa));
            output('prob-pac', fmt(1 - pa));
            output('prob-pb', fmt(pb));
            output('prob-pbc', fmt(1 - pb));
            output('prob-union', fmt(gabungan));
            output('prob-inter', fmt(irisan));

            const salingLepas = Math.abs(irisan) < 1e-12;
            const independen = Math.abs(irisan - pa * pb) < 1e-10;
            output('chip-lepas', `Saling lepas: ${salingLepas ? 'Ya (P(A∩B) = 0)' : 'Tidak'}`);
            output('chip-independen', `Independen: ${independen ? 'Ya (P(A∩B) = P(A)·P(B))' : 'Tidak'}`);

            output('formula-walkthrough', [
                '1. Komplemen:',
                `   P(A') = 1 − P(A) = 1 − ${fmt(pa)} = ${fmt(1 - pa)}`,
                `   P(B') = 1 − P(B) = 1 − ${fmt(pb)} = ${fmt(1 - pb)}`,
                '2. Irisan kejadian:',
                `   ${langkahIrisan}`,
                '3. Gabungan kejadian (A atau B terjadi):',
                '   P(A ∪ B) = P(A) + P(B) − P(A ∩ B)',
                `            = ${fmt(pa)} + ${fmt(pb)} − ${fmt(irisan)} = ${fmt(gabungan)} (${fmt(gabungan * 100, 2)}%)`,
            ].join('\n'));
        });
    }

    relasi?.addEventListener('change', aturRelasi);
    pasangForm('form-dasar', hitungDasar);

    $('btn-reset-prob')?.addEventListener('click', () => {
        $('form-dasar')?.reset();
        aturRelasi();
        showError('alert-prob');
        $('form-dasar')?.querySelectorAll('[aria-invalid]').forEach((e) => e.removeAttribute('aria-invalid'));
        resetOutputs([
            'prob-pa', 'prob-pac', 'prob-pb', 'prob-pbc', 'prob-union', 'prob-inter',
            'formula-walkthrough',
        ]);
        output('chip-lepas', 'Saling lepas: –');
        output('chip-independen', 'Independen: –');
    });

    /* ===================================================================
       B1. PROBABILITAS BERSYARAT P(A | B)
       =================================================================== */
    function hitungBersyarat() {
        runSafely('alert-cond', () => {
            const irisan = probability('input-cond-ab', 'P(A ∩ B)');
            const pb = probability('input-cond-b', 'P(B)');
            if (pb === 0) throw new GalatInput('P(B) harus lebih besar dari 0 untuk menghitung P(A | B).', 'input-cond-b');
            if (irisan > pb + 1e-12) throw new GalatInput('P(A ∩ B) tidak boleh lebih besar dari P(B).', 'input-cond-ab');

            const hasil = irisan / pb;
            output('res-cond', `${fmt(hasil)} (${fmt(hasil * 100, 2)}%)`);
            output(
                'cond-interpretasi',
                `Interpretasi: Apabila kejadian B sudah diketahui terjadi, maka peluang kejadian A ikut terjadi adalah ${fmt(hasil)} atau ${fmt(hasil * 100, 2)}%.`
            );
        });
    }

    pasangForm('form-cond', hitungBersyarat);

    /* ===================================================================
       B2. TEOREMA BAYES (FILTER PHISHING)
       =================================================================== */
    function hitungBayes() {
        runSafely('alert-bayes', () => {
            const prevalensi = percent('input-prevalensi', 'Prevalensi phishing');
            const sensitivitas = percent('input-sensitivitas', 'Sensitivitas deteksi');
            const fpr = percent('input-fpr', 'False positive');

            const pNormal = 1 - prevalensi;
            const pTP = sensitivitas * prevalensi;
            const pFP = fpr * pNormal;
            const pDitandai = pTP + pFP;

            if (pDitandai === 0) {
                throw new GalatInput('Probabilitas email ditandai bernilai 0, sehingga posterior tidak dapat dihitung.', 'input-sensitivitas');
            }

            const posterior = pTP / pDitandai;
            const bagianTP = posterior * 100;
            const bagianFP = (1 - posterior) * 100;

            output('bayes-pflag', `${fmt(pDitandai, 4)} (${fmt(pDitandai * 100, 2)}%)`);
            output('bayes-posterior', `${fmt(posterior, 4)} (${fmt(posterior * 100, 2)}%)`);

            $('bar-tp').style.width = `${bagianTP}%`;
            $('bar-fp').style.width = `${bagianFP}%`;
            output('legend-tp', `● Phishing benar (True Positive): ${fmt(bagianTP, 2)}%`);
            output('legend-fp', `● Email normal (False Positive): ${fmt(bagianFP, 2)}%`);
            $('proportion-bar')?.setAttribute(
                'aria-label',
                `Dari email yang ditandai sistem, ${fmt(bagianTP, 2)}% benar phishing dan ${fmt(bagianFP, 2)}% email normal`
            );

            output(
                'bayes-interpretasi',
                `1) Dari seluruh email yang masuk, peluang sistem memberikan tanda mencurigakan adalah ${fmt(pDitandai * 100, 2)}%. ` +
                `2) Jika sebuah email ditandai oleh sistem, peluang email tersebut benar-benar phishing adalah ${fmt(posterior * 100, 2)}%, ` +
                `sedangkan sisanya ${fmt(bagianFP, 2)}% merupakan alarm palsu (email normal). ` +
                `(Ilustrasi: dari 1.000 email, sekitar ${fmt(Math.round(pDitandai * 1000), 0)} email ditandai dan sekitar ${fmt(Math.round(pTP * 1000), 0)} di antaranya benar-benar phishing).`
            );

            output('bayes-walkthrough', [
                `Diketahui: P(Phishing) = ${fmt(prevalensi, 4)}, P(Normal) = 1 − ${fmt(prevalensi, 4)} = ${fmt(pNormal, 4)}`,
                '1. Probabilitas email ditandai sistem — P(Ditandai):',
                '   P(Ditandai) = P(Ditandai | Phishing)·P(Phishing) + P(Ditandai | Normal)·P(Normal)',
                `               = (${fmt(sensitivitas, 4)} × ${fmt(prevalensi, 4)}) + (${fmt(fpr, 4)} × ${fmt(pNormal, 4)})`,
                `               = ${fmt(pTP, 4)} + ${fmt(pFP, 4)} = ${fmt(pDitandai, 4)} (${fmt(pDitandai * 100, 2)}%)`,
                '2. Probabilitas email benar phishing jika ditandai — P(Phishing | Ditandai):',
                `   P(Phishing | Ditandai) = ${fmt(pTP, 4)} / ${fmt(pDitandai, 4)} = ${fmt(posterior, 4)} (${fmt(posterior * 100, 2)}%)`,
            ].join('\n'));
        });
    }

    pasangForm('form-bayes', hitungBayes);

    $('btn-reset-bayes')?.addEventListener('click', () => {
        $('form-bayes')?.reset();
        $('form-bayes')?.querySelectorAll('[aria-invalid]').forEach((e) => e.removeAttribute('aria-invalid'));
        showError('alert-bayes');
        resetOutputs(['bayes-pflag', 'bayes-posterior', 'bayes-walkthrough']);
        $('bar-tp').style.width = '50%';
        $('bar-fp').style.width = '50%';
        output('legend-tp', '● Phishing benar (True Positive): –');
        output('legend-fp', '● Email normal (False Positive): –');
        $('proportion-bar')?.setAttribute('aria-label', 'Komposisi email yang ditandai sistem');
        output('bayes-interpretasi', 'Tekan Analisis Bayes untuk melihat interpretasi hasil.');
    });

    /* ===================================================================
       C. BONUS: DISTRIBUSI BINOMIAL & POISSON
       Tabel log-faktorial disimpan agar hitungan kumulatif cukup O(n),
       bukan O(n × k) — n dan k hingga 10.000 tetap instan.
       =================================================================== */
    const logFak = [0, 0];
    const logFaktorial = (n) => {
        for (let i = logFak.length; i <= n; i++) logFak[i] = logFak[i - 1] + Math.log(i);
        return logFak[n];
    };

    const binomialPmf = (n, k, p) => {
        if (k > n) return 0;
        if (p === 0) return k === 0 ? 1 : 0;
        if (p === 1) return k === n ? 1 : 0;
        return Math.exp(
            logFaktorial(n) - logFaktorial(k) - logFaktorial(n - k) + k * Math.log(p) + (n - k) * Math.log1p(-p)
        );
    };

    const poissonPmf = (lambda, k) =>
        lambda === 0 ? (k === 0 ? 1 : 0) : Math.exp(-lambda + k * Math.log(lambda) - logFaktorial(k));

    const kumulatif = (pmf, k) => {
        let jumlah = 0;
        for (let i = 0; i <= k; i++) jumlah += pmf(i);
        return Math.min(1, jumlah);
    };

    function hitungBinomial() {
        runSafely('alert-bin', () => {
            const n = integer('input-bin-n', 'n', 1);
            const p = probability('input-bin-p', 'p');
            const k = integer('input-bin-k', 'k');
            if (n > 10000) throw new GalatInput('n terlalu besar (maksimal 10.000).', 'input-bin-n');
            if (k > n) throw new GalatInput('Nilai k tidak boleh melebihi jumlah percobaan n.', 'input-bin-k');

            const tepat = binomialPmf(n, k, p);
            const hingga = kumulatif((i) => binomialPmf(n, i, p), k);

            output('res-bin-eq', `${fmt(tepat)} (${fmt(tepat * 100, 2)}%)`);
            output('res-bin-le', `${fmt(hingga)} (${fmt(hingga * 100, 2)}%)`);
            output(
                'bin-interpretasi',
                `Dari ${fmt(n, 0)} percobaan dengan peluang sukses ${fmt(p)}, peluang memperoleh tepat ${fmt(k, 0)} sukses adalah ${fmt(tepat * 100, 2)}%, dan peluang paling banyak ${fmt(k, 0)} sukses adalah ${fmt(hingga * 100, 2)}%.`
            );
        });
    }

    function hitungPoisson() {
        runSafely('alert-poi', () => {
            const lambda = parse('input-poi-l', 'λ');
            const k = integer('input-poi-k', 'k');
            if (lambda < 0 || lambda > 10000) throw new GalatInput('λ harus berada di antara 0 dan 10.000.', 'input-poi-l');
            if (k > 10000) throw new GalatInput('k terlalu besar (maksimal 10.000).', 'input-poi-k');

            const tepat = poissonPmf(lambda, k);
            const hingga = kumulatif((i) => poissonPmf(lambda, i), k);

            output('res-poi-eq', `${fmt(tepat)} (${fmt(tepat * 100, 2)}%)`);
            output('res-poi-le', `${fmt(hingga)} (${fmt(hingga * 100, 2)}%)`);
            output(
                'poi-interpretasi',
                `Dengan rata-rata ${fmt(lambda)} kejadian per interval, peluang muncul tepat ${fmt(k, 0)} kejadian adalah ${fmt(tepat * 100, 2)}%, dan peluang muncul maksimal ${fmt(k, 0)} kejadian adalah ${fmt(hingga * 100, 2)}%.`
            );
        });
    }

    pasangForm('form-bin', hitungBinomial);
    pasangForm('form-poi', hitungPoisson);

    /* ---------- Inisialisasi: hitung otomatis contoh kasus UTS ----------
       Dijalankan pada DOMContentLoaded (setelah semua script defer terpasang)
       agar lapisan UI tambahan dapat ikut menangkap render awal. */
    document.addEventListener('DOMContentLoaded', () => {
        const aktif = tabSub.find((t) => t.getAttribute('aria-selected') === 'true');
        pilihSub(aktif ? aktif.dataset.sub : 'dasar');
        aturRelasi();
        if ($('form-dasar')) hitungDasar();
        if ($('form-cond')) hitungBersyarat();
        if ($('form-bayes')) hitungBayes();
        if ($('form-bin')) hitungBinomial();
        if ($('form-poi')) hitungPoisson();
    });
})();