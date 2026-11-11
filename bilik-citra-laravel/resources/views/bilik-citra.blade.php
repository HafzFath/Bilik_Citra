<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{{ $title ?? 'Bilik Citra – Pengolahan Citra Digital' }}</title>
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@600;800&family=IBM+Plex+Sans:wght@400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="{{ asset('css/bilik-citra.css') }}">
</head>
<body>
<div class="top"><h1>Bilik Citra</h1><span>Semua proses berjalan di browser Anda</span></div>
<div class="app">
  <aside class="side">
    <div class="card">
      <label class="drop"><input type="file" id="file" accept="image/*"><span id="dropText">Pilih gambar atau seret ke sini</span></label>
    </div>
    <div class="card"><h2>Alat</h2><ul class="tools" id="tools"></ul></div>
    <div class="card"><h2 id="ctlTitle">Pengaturan</h2><div class="ctl" id="ctl"></div>
      <button class="btn alt full" type="button" id="resetTool">Kembalikan pengaturan alat</button></div>
  </aside>
  <main class="main">
    <div class="stage" id="stage">
      <div class="empty" id="empty">Unggah gambar untuk mulai. Gambar sebelum dan sesudah akan tampil berdampingan.</div>
      <div class="views" id="views" hidden>
        <figure><figcaption>Sebelum</figcaption><div class="frame"><canvas id="cSrc"></canvas></div></figure>
        <figure><figcaption>Sesudah</figcaption><div class="frame"><canvas id="cOut"></canvas></div></figure>
      </div>
    </div>
    <div class="bar">
      <button class="btn" id="dl" disabled>Unduh PNG</button>
      <button class="btn alt" id="chain" disabled>Pakai hasil sebagai gambar awal</button>
      <button class="btn alt" id="reset" disabled>Kembali ke gambar awal</button>
    </div>
    <div id="status" role="status"></div>
  </main>
</div>
<script src="{{ asset('js/bilik-citra.js') }}"></script>
</body>
</html>
