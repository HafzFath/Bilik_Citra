# 🖼️ Bilik Citra – Pengolahan Citra Digital & Analisis Histogram

**Bilik Citra** adalah aplikasi berbasis web interaktif untuk pemrosesan citra digital (*Digital Image Processing*) dan analisis histogram RGB secara *real-time*. Seluruh manipulasi piksel dan rendering kurva histogram dilakukan 100% pada sisi klien (*client-side*) menggunakan HTML5 Canvas API untuk menghasilkan performa pemrosesan yang mulus dan responsif.

---

## ✨ Fitur Utama

- **📊 Analisis Histogram RGB Real-time:** Visualisasi distribusi frekuensi intensitas warna kanal Merah (R), Hijau (G), dan Biru (B) secara terpisah untuk gambar asli (*Input*) dan gambar hasil olahan (*Output*).
- **🎨 Skala Keabuan (Grayscale):** Pengaturan bobot kustom kanal R, G, B, normalisasi bobot, serta penyesuaian intensitas campuran (*mix*).
- **🔲 Binarisasi (Thresholding):** Pengambangan piksel dengan nilai ambang $T$ yang dapat disesuaikan, opsi pembalikan warna (*invert*), serta penyesuaian warna latar belakang dan objek.
- **☀️ Kecerahan & Kontras (Brightness, Contrast & Gamma):** Penyesuaian nilai kontras ($\alpha$), kecerahan ($\beta$), dan koreksi Gamma ($\gamma$) menggunakan pendekatan *Look-Up Table* (LUT) efisien.
- **💧 Penapisan Blur (Spatial Filtering):** Filter konvolusi spasial 1D separable untuk *Mean Filter* dan *Gaussian Blur* dengan ukuran kernel hingga $41 \times 41$ serta pengaturan nilai Sigma.
- **✏️ Deteksi Tepi (Edge Detection):** Implementasi operator gradien spasial **Sobel**, **Prewitt**, dan **Scharr** lengkap dengan kontrol *gain*, *threshold*, dan opsi invert.
- **🔄 Citra Negatif:** Pembalikan nilai intensitas warna piksel per kanal (R, G, B) secara terpisah.
- **🔗 Chaining & Undo State:** Fitur *Chaining* untuk menjadikan citra hasil olahan sebagai citra masukan baru, pengembalian ke gambar awal (*Reset*), serta pengunduhan hasil olahan dalam format PNG.

---

## 🛠️ Teknologi yang Digunakan

- **Backend Framework:** [Laravel](https://laravel.com/) (PHP 8.x)
- **Frontend Engine:** HTML5 Canvas 2D API (`ImageData`, `Uint8ClampedArray`), JavaScript (ES6 Vanilla)
- **Styling:** CSS3 (Desain UI Responsif & Modern)

---

## 🚀 Panduan Instalasi & Memulai

Pastikan komputer Anda sudah terpasang kebutuhan dasar berikut:
- **PHP** $\ge$ 8.1
- **Composer**
- **Node.js & NPM** *(opsional untuk kompilasi aset)*

### Langkah Instalasi

1. **Clone Repositori:**
   ```bash
   git clone [https://github.com/HafzFath/Bilik_Citra.git](https://github.com/HafzFath/Bilik_Citra.git)
   cd Bilik_Citra/bilik-citra-laravel

```

2. **Install Dependensi PHP:**
```bash
composer install

```


3. **Konfigurasi Environment File:**
Salin berkas `.env.example` menjadi `.env`:
```bash
cp .env.example .env

```


4. **Generate Application Key:**
```bash
php artisan key:generate

```


5. **Jalankan Server Lokal:**
```bash
php artisan serve

```


6. **Akses Aplikasi:**
Buka browser dan kunjungi alamat:
```text
[http://127.0.0.1:8000/pengolahan-citra](http://127.0.0.1:8000/pengolahan-citra)

```
