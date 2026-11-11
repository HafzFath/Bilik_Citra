(function () {
  /* =====================================================================
     BILIK CITRA - PENGOLAHAN CITRA DIGITAL & ANALISIS HISTOGRAM
     ---------------------------------------------------------------------
     Konsep Dasar:
     1. Representasi Citra:
        Citra digital disimpan sebagai ImageData Canvas dengan susunan
        array 1 dimensi bertipe Uint8ClampedArray: [R, G, B, A, R, G, B, A, ...]
        di mana setiap piksel memiliki 4 nilai berurutan (0 - 255).
     2. Histogram Warna:
        Distribusi frekuensi kemunculan intensitas piksel (rentang 0-255)
        dihitung untuk masing-masing kanal Red, Green, dan Blue.
     3. Pemrosesan Real-time:
        Semua manipulasi piksel dan rendering kurva dilakukan 100% pada
        sisi klien (browser) dengan efisiensi tinggi dan frame rate mulus.
     ===================================================================== */

  var MAX = 1400;
  var $ = function (id) { return document.getElementById(id); };

  // Elemen Kanvas & Konteks
  var cSrc = $('cSrc');
  var cOut = $('cOut');
  var cHistSrc = $('cHistSrc');
  var cHistOut = $('cHistOut');

  var sx = cSrc.getContext('2d', { willReadFrequently: true });
  var ox = cOut.getContext('2d');

  // State Manajemen
  var original = null; // Buffer piksel asli dari file
  var current = null;  // Buffer piksel aktif yang diolah
  var active = 'gray'; // ID alat aktif
  var timer = null;    // Timer requestAnimationFrame untuk debounce slider

  // Definisi SVG Icon untuk Tombol Alat
  var ICONS = {
    gray: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0 1 0 20z" fill="currentColor"/></svg>',
    bin: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="12" y1="3" x2="12" y2="21"/></svg>',
    bc: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>',
    blur: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>',
    edge: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>',
    neg: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 2v20M2 12h20"/></svg>'
  };

  /* Daftar Spesifikasi Alat & Pengaturan Parameter */
  var OPS = [
    {
      id: 'gray',
      name: 'Grayscale',
      c: [
        { k: 'r', t: 'r', l: 'Bobot merah (R)', min: 0, max: 1, step: 0.001, v: 0.299, d: 3 },
        { k: 'g', t: 'r', l: 'Bobot hijau (G)', min: 0, max: 1, step: 0.001, v: 0.587, d: 3 },
        { k: 'b', t: 'r', l: 'Bobot biru (B)', min: 0, max: 1, step: 0.001, v: 0.114, d: 3 },
        { k: 'norm', t: 'c', l: 'Normalkan bobot (jumlah = 1)', v: true },
        { k: 'mix', t: 'r', l: 'Intensitas campuran', min: 0, max: 100, step: 1, v: 100, u: '%' }
      ]
    },
    {
      id: 'bin',
      name: 'Binarisasi',
      c: [
        { k: 'T', t: 'r', l: 'Nilai Ambang (T)', min: 0, max: 255, step: 1, v: 128 },
        { k: 'inv', t: 'c', l: 'Balik hitam dan putih', v: false },
        { k: 'fg', t: 'k', l: 'Warna objek (foreground)', v: '#ffffff' },
        { k: 'bg', t: 'k', l: 'Warna latar (background)', v: '#000000' }
      ]
    },
    {
      id: 'bc',
      name: 'Kecerahan',
      c: [
        { k: 'alpha', t: 'r', l: 'Kontras (α)', min: 0, max: 3, step: 0.01, v: 1, d: 2 },
        { k: 'beta', t: 'r', l: 'Kecerahan (β)', min: -255, max: 255, step: 1, v: 0 },
        { k: 'gamma', t: 'r', l: 'Koreksi Gamma (γ)', min: 0.2, max: 3, step: 0.01, v: 1, d: 2 }
      ]
    },
    {
      id: 'blur',
      name: 'Penapisan Blur',
      c: [
        { k: 'type', t: 's', l: 'Jenis filter konvolusi', v: 'gauss', o: [['mean', 'Mean Filter (Rata-rata)'], ['gauss', 'Gaussian Blur']] },
        { k: 'size', t: 'r', l: 'Ukuran kernel', min: 1, max: 41, step: 2, v: 5, f: function (x) { return x + ' × ' + x; } },
        { k: 'sigma', t: 'r', l: 'Sigma (Gaussian Blur)', min: 0.3, max: 12, step: 0.1, v: 1.5, d: 1 },
        { k: 'mix', t: 'r', l: 'Intensitas filter', min: 0, max: 100, step: 1, v: 100, u: '%' }
      ]
    },
    {
      id: 'edge',
      name: 'Deteksi Tepi',
      c: [
        { k: 'op', t: 's', l: 'Operator gradien', v: 'sobel', o: [['sobel', 'Sobel'], ['prewitt', 'Prewitt'], ['scharr', 'Scharr']] },
        { k: 'gain', t: 'r', l: 'Kekuatan tepi (gain)', min: 0.1, max: 5, step: 0.05, v: 1, d: 2 },
        { k: 'thr', t: 'r', l: 'Ambang batas (threshold)', min: 0, max: 255, step: 1, v: 0 },
        { k: 'inv', t: 'c', l: 'Balik (garis gelap di latar putih)', v: false }
      ]
    },
    {
      id: 'neg',
      name: 'Citra Negatif',
      c: [
        { k: 'r', t: 'c', l: 'Balik kanal Merah (R)', v: true },
        { k: 'g', t: 'c', l: 'Balik kanal Hijau (G)', v: true },
        { k: 'b', t: 'c', l: 'Balik kanal Biru (B)', v: true },
        { k: 'mix', t: 'r', l: 'Intensitas efek', min: 0, max: 100, step: 1, v: 100, u: '%' }
      ]
    }
  ];

  var S = {};
  function defaults(o) {
    var s = {};
    o.c.forEach(function (c) { s[c.k] = c.v; });
    return s;
  }
  OPS.forEach(function (o) { S[o.id] = defaults(o); });

  function op(id) {
    return OPS.filter(function (o) { return o.id === id; })[0];
  }

  function mk(t, a, h) {
    var e = document.createElement(t);
    for (var k in a) { e.setAttribute(k, a[k]); }
    if (h != null) { e.textContent = h; }
    return e;
  }

  function fmt(c, v) {
    return c.f ? c.f(v) : (c.d != null ? (+v).toFixed(c.d) : v) + (c.u || '');
  }

  function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    var k = 1024, sizes = ['B', 'KB', 'MB', 'GB'];
    var i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  /* =====================================================================
     UI STATE MANAGEMENT (KONTROL VISIBILITAS PROAKTIF)
     ---------------------------------------------------------------------
     Mengontrol status tampilan secara terpusat:
     - hasImage === false: Menampilkan placeholder upload & empty state.
                           Menyembunyikan info file & workspace gambar.
     - hasImage === true:  Menyembunyikan placeholder upload & empty state.
                           Menampilkan info file & workspace gambar.
     ===================================================================== */
  function updateUIState(hasImage, fileInfo) {
    var uploadPlaceholder = $('upload-placeholder') || $('dropPrompt');
    var fileInfoCard = $('file-info-card') || $('fileInfo');
    var emptyWorkspace = $('empty-workspace') || $('empty');
    var activeWorkspace = $('active-workspace') || $('views');

    function toggle(el, show) {
      if (!el) return;
      if (show) {
        el.classList.remove('hidden');
        el.removeAttribute('hidden');
        el.style.display = '';
      } else {
        el.classList.add('hidden');
        el.setAttribute('hidden', '');
        el.style.display = 'none';
      }
    }

    if (!hasImage) {
      // 1. Kondisi Awal: Belum ada gambar diunggah
      toggle(uploadPlaceholder, true);
      toggle(fileInfoCard, false);
      toggle(emptyWorkspace, true);
      toggle(activeWorkspace, false);

      ['dl', 'chain', 'reset'].forEach(function (btnId) {
        var btn = $(btnId);
        if (btn) btn.disabled = true;
      });
    } else {
      // 2. Kondisi Setelah Gambar Diunggah
      toggle(uploadPlaceholder, false);
      toggle(fileInfoCard, true);
      toggle(emptyWorkspace, false);
      toggle(activeWorkspace, true);

      ['dl', 'chain', 'reset'].forEach(function (btnId) {
        var btn = $(btnId);
        if (btn) btn.disabled = false;
      });

      if (fileInfo) {
        if ($('fileName') && fileInfo.name) $('fileName').textContent = fileInfo.name;
        if ($('fileSize') && fileInfo.size) $('fileSize').textContent = fileInfo.size;
      }
    }
  }

  /* =====================================================================
     BUILD UI: TOMBOL ALAT & PANEL PENGATURAN
     ===================================================================== */
  function buildTools() {
    var container = $('tools');
    container.innerHTML = '';
    OPS.forEach(function (o) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'tool-btn';
      btn.setAttribute('data-id', o.id);
      btn.setAttribute('aria-pressed', o.id === active ? 'true' : 'false');
      btn.innerHTML = (ICONS[o.id] || '') + '<span>' + o.name + '</span>';
      btn.onclick = function () {
        active = o.id;
        render();
      };
      container.appendChild(btn);
    });
  }

  function buildCtl() {
    var box = $('ctl');
    var o = op(active);
    var s = S[active];
    box.innerHTML = '';

    o.c.forEach(function (c) {
      var row = mk('div', { 'class': 'ctl-row' });
      var id = 'c_' + c.k;

      if (c.t === 'r') {
        var hd = mk('div', { 'class': 'ctl-header' });
        var lb = mk('label', { 'for': id, 'class': 'ctl-label' }, c.l);
        var out = mk('span', { 'class': 'ctl-val' }, fmt(c, s[c.k]));
        hd.appendChild(lb);
        hd.appendChild(out);

        var slider = mk('input', {
          type: 'range',
          id: id,
          min: c.min,
          max: c.max,
          step: c.step,
          value: s[c.k]
        });

        slider.oninput = function () {
          s[c.k] = parseFloat(slider.value);
          out.textContent = fmt(c, s[c.k]);
          schedule();
        };

        row.appendChild(hd);
        row.appendChild(slider);
      } else if (c.t === 'c') {
        var label = mk('label', { 'class': 'ctl-checkbox' });
        var checkbox = mk('input', { type: 'checkbox', id: id });
        checkbox.checked = !!s[c.k];
        checkbox.onchange = function () {
          s[c.k] = checkbox.checked;
          schedule();
        };
        label.appendChild(checkbox);
        label.appendChild(mk('span', {}, c.l));
        row.appendChild(label);
      } else if (c.t === 's') {
        var hdSel = mk('div', { 'class': 'ctl-header' });
        hdSel.appendChild(mk('label', { 'for': id, 'class': 'ctl-label' }, c.l));
        var sel = mk('select', { id: id, 'class': 'ctl-select' });
        c.o.forEach(function (x) {
          sel.appendChild(mk('option', { value: x[0] }, x[1]));
        });
        sel.value = s[c.k];
        sel.onchange = function () {
          s[c.k] = sel.value;
          schedule();
        };
        row.appendChild(hdSel);
        row.appendChild(sel);
      } else if (c.t === 'k') {
        var hdCol = mk('div', { 'class': 'ctl-header' });
        hdCol.appendChild(mk('label', { 'for': id, 'class': 'ctl-label' }, c.l));
        var colorWrapper = mk('div', { 'class': 'ctl-color-wrapper' });
        var colorPicker = mk('input', { type: 'color', id: id, value: s[c.k] });
        colorPicker.oninput = function () {
          s[c.k] = colorPicker.value;
          schedule();
        };
        colorWrapper.appendChild(colorPicker);
        row.appendChild(hdCol);
        row.appendChild(colorWrapper);
      }
      box.appendChild(row);
    });
  }

  /* =====================================================================
     PENGOLAHAN CITRA DIGITAL (IMAGE PROCESSING ALGORITHMS)
     ===================================================================== */
  function cl(v) {
    return v < 0 ? 0 : v > 255 ? 255 : v;
  }

  function gray(d) {
    var n = d.width * d.height, g = new Float32Array(n), p = d.data;
    for (var i = 0, j = 0; i < n; i++, j += 4) {
      g[i] = 0.299 * p[j] + 0.587 * p[j + 1] + 0.114 * p[j + 2];
    }
    return g;
  }

  function hex(h) {
    var n = parseInt(h.slice(1), 16);
    return [n >> 16 & 255, n >> 8 & 255, n & 255];
  }

  function process(id, src) {
    var w = src.width, h = src.height, n = w * h, s = src.data;
    var out = new ImageData(w, h), d = out.data, p = S[id], i, j, m;

    /* 1. GRAYSCALE (Skala Keabuan) */
    if (id === 'gray') {
      var a = p.r, b = p.g, c = p.b;
      if (p.norm) {
        var t = a + b + c || 1;
        a /= t; b /= t; c /= t;
      }
      m = p.mix / 100;
      for (i = 0, j = 0; i < n; i++, j += 4) {
        var v = a * s[j] + b * s[j + 1] + c * s[j + 2];
        d[j] = cl(s[j] + (v - s[j]) * m);
        d[j + 1] = cl(s[j + 1] + (v - s[j + 1]) * m);
        d[j + 2] = cl(s[j + 2] + (v - s[j + 2]) * m);
        d[j + 3] = s[j + 3];
      }
    }
    /* 2. BINARISASI (Thresholding) */
    else if (id === 'bin') {
      var g = gray(src), F = hex(p.fg), B = hex(p.bg);
      for (i = 0, j = 0; i < n; i++, j += 4) {
        var on = g[i] >= p.T;
        if (p.inv) on = !on;
        var q = on ? F : B;
        d[j] = q[0];
        d[j + 1] = q[1];
        d[j + 2] = q[2];
        d[j + 3] = s[j + 3];
      }
    }
    /* 3. KECERAHAN & KONTRAS (Linear & Gamma correction) */
    else if (id === 'bc') {
      var lut = new Uint8ClampedArray(256), gm = 1 / p.gamma;
      for (i = 0; i < 256; i++) {
        var x = cl(p.alpha * i + p.beta);
        lut[i] = 255 * Math.pow(x / 255, gm);
      }
      for (i = 0, j = 0; i < n; i++, j += 4) {
        d[j] = lut[s[j]];
        d[j + 1] = lut[s[j + 1]];
        d[j + 2] = lut[s[j + 2]];
        d[j + 3] = s[j + 3];
      }
    }
    /* 4. PENAPISAN SPASIAL (Mean & Gaussian Blur) */
    else if (id === 'blur') {
      var k = Math.round(p.size), r = (k - 1) >> 1, ker = new Float32Array(k), sum = 0;
      for (i = -r; i <= r; i++) {
        ker[i + r] = p.type === 'gauss' ? Math.exp(-i * i / (2 * p.sigma * p.sigma)) : 1;
        sum += ker[i + r];
      }
      for (i = 0; i < k; i++) ker[i] /= sum;

      // Konvolusi Separable 1D: Horizontal Pass
      var tmp = new Float32Array(n * 4), x, y, u, acc0, acc1, acc2, q2;
      for (y = 0; y < h; y++) {
        for (x = 0; x < w; x++) {
          acc0 = acc1 = acc2 = 0;
          for (u = -r; u <= r; u++) {
            var xx = x + u;
            xx = xx < 0 ? 0 : xx >= w ? w - 1 : xx;
            q2 = (y * w + xx) * 4;
            var kv = ker[u + r];
            acc0 += s[q2] * kv;
            acc1 += s[q2 + 1] * kv;
            acc2 += s[q2 + 2] * kv;
          }
          q2 = (y * w + x) * 4;
          tmp[q2] = acc0;
          tmp[q2 + 1] = acc1;
          tmp[q2 + 2] = acc2;
        }
      }
      m = p.mix / 100;
      // Vertikal Pass
      for (y = 0; y < h; y++) {
        for (x = 0; x < w; x++) {
          acc0 = acc1 = acc2 = 0;
          for (u = -r; u <= r; u++) {
            var yy = y + u;
            yy = yy < 0 ? 0 : yy >= h ? h - 1 : yy;
            q2 = (yy * w + x) * 4;
            var kw = ker[u + r];
            acc0 += tmp[q2] * kw;
            acc1 += tmp[q2 + 1] * kw;
            acc2 += tmp[q2 + 2] * kw;
          }
          q2 = (y * w + x) * 4;
          d[q2] = s[q2] + (acc0 - s[q2]) * m;
          d[q2 + 1] = s[q2 + 1] + (acc1 - s[q2 + 1]) * m;
          d[q2 + 2] = s[q2 + 2] + (acc2 - s[q2 + 2]) * m;
          d[q2 + 3] = s[q2 + 3];
        }
      }
    }
    /* 5. DETEKSI TEPI (Sobel, Prewitt, Scharr) */
    else if (id === 'edge') {
      var gr = gray(src), kx, ky;
      if (p.op === 'sobel') {
        kx = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
        ky = [-1, -2, -1, 0, 0, 0, 1, 2, 1];
      } else if (p.op === 'prewitt') {
        kx = [-1, 0, 1, -1, 0, 1, -1, 0, 1];
        ky = [-1, -1, -1, 0, 0, 0, 1, 1, 1];
      } else {
        kx = [-3, 0, 3, -10, 0, 10, -3, 0, 3];
        ky = [-3, -10, -3, 0, 0, 0, 3, 10, 3];
      }
      var scale = p.op === 'scharr' ? 1 / 4 : 1;
      for (var y3 = 0; y3 < h; y3++) {
        for (var x3 = 0; x3 < w; x3++) {
          var gx = 0, gy = 0, t2 = 0;
          for (var a2 = -1; a2 <= 1; a2++) {
            var yy2 = Math.min(h - 1, Math.max(0, y3 + a2));
            for (var b2 = -1; b2 <= 1; b2++) {
              var xx2 = Math.min(w - 1, Math.max(0, x3 + b2));
              var pv = gr[yy2 * w + xx2];
              gx += pv * kx[t2];
              gy += pv * ky[t2];
              t2++;
            }
          }
          var mg = cl(Math.sqrt(gx * gx + gy * gy) * scale * p.gain);
          if (mg < p.thr) mg = 0;
          if (p.inv) mg = 255 - mg;
          var o2 = (y3 * w + x3) * 4;
          d[o2] = d[o2 + 1] = d[o2 + 2] = mg;
          d[o2 + 3] = 255;
        }
      }
    }
    /* 6. CITRA NEGATIF */
    else if (id === 'neg') {
      m = p.mix / 100;
      var f = [p.r, p.g, p.b];
      for (i = 0, j = 0; i < n; i++, j += 4) {
        for (var ch = 0; ch < 3; ch++) {
          var orig = s[j + ch];
          var ng = f[ch] ? 255 - orig : orig;
          d[j + ch] = orig + (ng - orig) * m;
        }
        d[j + 3] = s[j + 3];
      }
    }
    return out;
  }

  /* =====================================================================
     LOGIKA KALKULASI & RENDERING GRAFIK HISTOGRAM (RGB 0-255)
     ===================================================================== */
  function computeHistogram(imgData) {
    var r = new Uint32Array(256);
    var g = new Uint32Array(256);
    var b = new Uint32Array(256);
    var data = imgData.data;
    var len = data.length;

    for (var i = 0; i < len; i += 4) {
      if (data[i + 3] === 0) continue; // Abaikan piksel transparan
      r[data[i]]++;
      g[data[i + 1]]++;
      b[data[i + 2]]++;
    }

    var max = 1;
    for (var k = 0; k < 256; k++) {
      if (r[k] > max) max = r[k];
      if (g[k] > max) max = g[k];
      if (b[k] > max) max = b[k];
    }

    return { r: r, g: g, b: b, max: max };
  }

  function drawHistogram(canvas, hist) {
    if (!canvas || !hist) return;
    var ctx = canvas.getContext('2d');
    var w = canvas.width;
    var h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    // Garis grid horizontal
    ctx.strokeStyle = 'rgba(38, 51, 77, 0.45)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    [0.25, 0.5, 0.75].forEach(function (pct) {
      var y = Math.round(h * pct) + 0.5;
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
    });
    ctx.stroke();

    var max = hist.max || 1;
    var padBottom = 2;
    var drawHeight = h - 6;

    function renderChannel(data, strokeColor, fillColor) {
      ctx.beginPath();
      ctx.moveTo(0, h);

      for (var i = 0; i < 256; i++) {
        var x = (i / 255) * w;
        var barH = (data[i] / max) * drawHeight;
        var y = h - padBottom - barH;
        if (i === 0) {
          ctx.lineTo(0, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.lineTo(w, h);
      ctx.closePath();

      ctx.fillStyle = fillColor;
      ctx.fill();

      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }

    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    renderChannel(hist.b, 'rgba(59, 130, 246, 0.85)', 'rgba(59, 130, 246, 0.35)');
    renderChannel(hist.g, 'rgba(34, 197, 94, 0.85)', 'rgba(34, 197, 94, 0.35)');
    renderChannel(hist.r, 'rgba(239, 68, 68, 0.85)', 'rgba(239, 68, 68, 0.35)');
    ctx.restore();
  }

  /* =====================================================================
     RUN & WORKSPACE PIPELINE
     ===================================================================== */
  function schedule() {
    if (timer) cancelAnimationFrame(timer);
    timer = requestAnimationFrame(run);
  }

  function run() {
    if (!current) return;
    var t0 = performance.now();
    var res = process(active, current);
    var duration = Math.round(performance.now() - t0);

    // Perbarui Canvas Hasil
    cOut.width = res.width;
    cOut.height = res.height;
    ox.putImageData(res, 0, 0);

    // Render Histogram Citra Sesudah (Processed)
    var histOut = computeHistogram(res);
    drawHistogram(cHistOut, histOut);

    // Pastikan UI state aktif
    updateUIState(true);

    $('outMeta').textContent = duration + ' ms';
    $('status').textContent = 'Filter "' + op(active).name + '" berhasil diterapkan dalam ' + duration + ' ms.';
  }

  function render() {
    // Update active state pada tombol alat
    document.querySelectorAll('#tools .tool-btn').forEach(function (b) {
      b.setAttribute('aria-pressed', b.dataset.id === active ? 'true' : 'false');
    });

    var activeOp = op(active);
    $('ctlTitle').textContent = 'Pengaturan: ' + activeOp.name;
    $('activeToolBadge').textContent = activeOp.name;
    if ($('appliedFilterName')) {
      $('appliedFilterName').textContent = activeOp.name;
    }

    buildCtl();
    run();
  }

  /* =====================================================================
     FILE HANDLING & DRAG-AND-DROP
     ===================================================================== */
  function load(file) {
    if (!file || !/^image\//.test(file.type)) {
      $('status').textContent = 'Peringatan: Berkas harus berupa format citra (JPG, PNG, WebP).';
      return;
    }

    var url = URL.createObjectURL(file);
    var img = new Image();

    img.onload = function () {
      var sc = Math.min(1, MAX / Math.max(img.width, img.height));
      var w = Math.round(img.width * sc);
      var h = Math.round(img.height * sc);

      cSrc.width = w;
      cSrc.height = h;
      sx.drawImage(img, 0, 0, w, h);

      original = sx.getImageData(0, 0, w, h);
      current = original;

      // Update State Tampilan UI & Metadata Berkas
      updateUIState(true, {
        name: file.name,
        size: formatBytes(file.size)
      });
      $('srcMeta').textContent = w + ' × ' + h + ' px';

      // Hitung & Render Histogram Citra Sebelum (Original)
      var histSrc = computeHistogram(current);
      drawHistogram(cHistSrc, histSrc);

      URL.revokeObjectURL(url);
      run();
    };

    img.onerror = function () {
      $('status').textContent = 'Gagal memuat gambar. Silakan coba berkas lain.';
    };

    img.src = url;
  }

  var drop = $('dropZone');
  $('file').onchange = function (e) {
    if (e.target.files && e.target.files[0]) {
      load(e.target.files[0]);
    }
  };

  [drop, $('stage')].forEach(function (zone) {
    if (!zone) return;
    zone.addEventListener('dragover', function (e) {
      e.preventDefault();
      drop.classList.add('over');
    });
    zone.addEventListener('dragleave', function () {
      drop.classList.remove('over');
    });
    zone.addEventListener('drop', function (e) {
      e.preventDefault();
      drop.classList.remove('over');
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
        load(e.dataTransfer.files[0]);
      }
    });
  });

  /* =====================================================================
     ACTIONS: RESET, CHAIN, DOWNLOAD
     ===================================================================== */
  // Reset Pengaturan Alat ke Default
  $('resetTool').onclick = function () {
    S[active] = defaults(op(active));
    buildCtl();
    run();
    $('status').textContent = 'Pengaturan parameter "' + op(active).name + '" dikembalikan ke default.';
  };

  // Unduh Hasil Sebagai PNG
  $('dl').onclick = function () {
    var a = document.createElement('a');
    a.href = cOut.toDataURL('image/png');
    a.download = 'bilik-citra-' + active + '-' + Date.now() + '.png';
    a.click();
    $('status').textContent = 'Berkas PNG berhasil diunduh.';
  };

  // Gunakan Hasil Sebagai Gambar Awal (Chaining)
  $('chain').onclick = function () {
    current = ox.getImageData(0, 0, cOut.width, cOut.height);
    cSrc.width = current.width;
    cSrc.height = current.height;
    sx.putImageData(current, 0, 0);

    var histSrc = computeHistogram(current);
    drawHistogram(cHistSrc, histSrc);
    $('srcMeta').textContent = current.width + ' × ' + current.height + ' px';

    run();
    $('status').textContent = 'Hasil olahan kini dijadikan gambar awal. Silakan pilih alat berikutnya.';
  };

  // Kembalikan ke Gambar Awal
  $('reset').onclick = function () {
    current = original;
    cSrc.width = original.width;
    cSrc.height = original.height;
    sx.putImageData(original, 0, 0);

    var histSrc = computeHistogram(original);
    drawHistogram(cHistSrc, histSrc);
    $('srcMeta').textContent = original.width + ' × ' + original.height + ' px';

    run();
    $('status').textContent = 'Citra dikembalikan ke versi awal sebelum modifikasi.';
  };

  // Inisialisasi State UI & Alat
  updateUIState(false);
  buildTools();
  render();

  // Pastikan State Terinisialisasi saat DOM Selesai Dimuat
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      updateUIState(false);
    });
  }
})();
