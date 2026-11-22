# StatKit — Aplikasi Statistika Deskriptif & Kalkulator Probabilitas

Aplikasi berbasis web untuk memenuhi tugas proyek **Ujian Tengah Semester (UTS) Ganjil Tahun Akademik 2026/2027** pada mata kuliah **Statistika**, Program Studi Teknik Informatika, Fakultas Teknik, **Universitas Perjuangan Tasikmalaya (UNPER)**.

---

## Identitas Akademik
* **Mata Kuliah:** Statistika
* **Program Studi:** Teknik Informatika (Semester 3)
* **Dosen Pengampu:** Teuku Mufizar, M.Kom
* **Kelompok:** Kelompok 3
* **Teknologi:** HTML5, CSS3 (Responsive Grid & Flexbox), Vanilla JavaScript (ES6+), SVG Graphics

---

## Fitur Utama Aplikasi

### 1. Modul Statistika Deskriptif (`statistika.html`)
Mengolah sekumpulan data numerik dan menampilkan seluruh hasil dalam satu tampilan terpadu:
* **Mode Input Ganda:**
  * **Input Manual:** Mendukung pemisah spasi, baris baru, titik koma (`;`), maupun koma (`,`), serta otomatis mengenali desimal koma maupun titik.
  * **Upload File CSV:** Mendukung pemilihan berkas maupun *drag-and-drop*, otomatis mengabaikan baris *header* non-angka, serta menyediakan tombol unduh contoh berkas `.csv`.
* **14 Ukuran Statistik Otomatis:**
  1. Jumlah data ($n$)
  2. Total nilai ($\sum x$) dengan algoritma penjumlahan presisi Neumaier
  3. Mean / rata-rata ($\bar{x}$)
  4. Median ($Me$)
  5. Modus ($Mo$) — mendukung data unimodal, bimodal/multimodal, serta deteksi kondisi tanpa modus
  6. Nilai minimum ($\min$)
  7. Nilai maksimum ($\max$)
  8. Range / jangkauan ($R = \max - \min$)
  9. Varians — mendukung opsi **Sampel ($s^2$, pembagi $n-1$)** maupun **Populasi ($\sigma^2$, pembagi $n$)**
  10. Standar deviasi ($s$ atau $\sigma$)
  11. Kuartil 1 ($Q_1$) — mendukung 3 metode (Interpolasi Linear, Median Dua Belahan, dan Letak $i(n+1)/4$)
  12. Kuartil 3 ($Q_3$)
  13. Interquartile Range ($IQR = Q_3 - Q_1$)
  14. Deteksi *Outlier* menggunakan aturan pagar Tukey ($Q_1 - 1,5 \times IQR$ dan $Q_3 + 1,5 \times IQR$)
* **Visualisasi Data Interaktif (SVG):**
  * **Histogram:** Pembagian kelas interval otomatis menggunakan aturan Sturges ($k = 1 + \log_2 n$).
  * **Boxplot:** Menampilkan batas minimum-maksimum dalam pagar, kotak $Q_1$–$Q_3$, garis median, penanda mean, serta titik merah untuk setiap *outlier*.
* **Ekspor & Salin Hasil:** Menyalin tabel ke *clipboard* atau mengunduh hasil dalam format `.csv`.

### 2. Modul Kalkulator Probabilitas (`probabilitas.html`)
* **A. Probabilitas Dasar:**
  * Menghitung $P(A)$, komplemen $P(A')$, $P(B)$, komplemen $P(B')$, gabungan $P(A \cup B)$, dan irisan $P(A \cap B)$.
  * Mendukung hubungan kejadian **Saling Lepas**, **Independen**, maupun nilai irisan $P(A \cap B)$ kustom lengkap dengan rincian langkah penyelesaian.
* **B. Probabilitas Bersyarat & Teorema Bayes:**
  * Menghitung probabilitas bersyarat $P(A \mid B) = \frac{P(A \cap B)}{P(B)}$ beserta interpretasinya.
  * Implementasi **Teorema Bayes** pada studi kasus sistem deteksi *email phishing*, menampilkan probabilitas email ditandai $P(\text{Ditandai})$, probabilitas posterior $P(\text{Phishing} \mid \text{Ditandai})$, grafik batang proporsi *True Positive* vs *False Positive*, serta interpretasi lengkap.
* **C. Distribusi Probabilitas (Fitur Tambahan):**
  * Menghitung peluang tepat $P(X = k)$ dan peluang kumulatif $P(X \le k)$ untuk **Distribusi Binomial** dan **Distribusi Poisson**.

---

## Verifikasi Contoh Kasus Naskah Soal UTS

1. **Contoh Kasus Probabilitas Dasar:**
   * Diketahui $P(A) = 0,3$ dan $P(B) = 0,4$ (saling lepas, sehingga $P(A \cap B) = 0$).
   * Hasil aplikasi: $P(A \cup B) = 0,3 + 0,4 - 0 = 0,7$ ($70\%$).
2. **Contoh Kasus Teorema Bayes (Filter Phishing):**
   * Diketahui prevalensi phishing $P(P) = 8\%$, sensitivitas $P(T \mid P) = 92\%$, dan *false positive* $P(T \mid P') = 3\%$.
   * Hasil aplikasi:
     * Probabilitas email ditandai sistem: $P(T) = (0,92 \times 0,08) + (0,03 \times 0,92) = 0,1012$ (**$10,12\%$**).
     * Probabilitas email benar-benar phishing jika ditandai: $P(P \mid T) = \frac{0,0736}{0,1012} \approx 0,7273$ (**$72,73\%$**).

---

## Struktur Direktori

```text
project-statistika-kelompok-3/
├── statistika.html         # Halaman utama Modul Statistika Deskriptif (Soal 1)
├── probabilitas.html       # Halaman Modul Kalkulator Probabilitas & Bayes (Soal 2)
├── vercel.json             # Konfigurasi routing deployment Vercel
├── README.md               # Dokumentasi proyek
├── css/
│   ├── statistik.css       # Stylesheet Modul Statistika Deskriptif
│   └── probabilitas.css    # Stylesheet Modul Probabilitas
└── js/
    ├── app.js              # Utilitas bersama, manajemen tab, & navigasi
    ├── statistika.js       # Engine perhitungan 14 ukuran statistik & grafik SVG
    └── probabilitas.js     # Engine perhitungan probabilitas, Bayes, & distribusi
```

---

## Cara Menjalankan & Deploy

* **Menjalankan Secara Lokal:** Buka langsung berkas `statistika.html` di peramban (*browser*) modern mana pun tanpa memerlukan instalasi *server* tambahan.
* **Deploy ke Vercel:** Unggah seluruh repositori ini ke GitHub/GitLab lalu hubungkan ke Vercel. Berkas `vercel.json` akan otomatis mengarahkan rute utama `/` ke halaman `statistika.html`.
