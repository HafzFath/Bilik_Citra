<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
    <title>{{ $title ?? 'Bilik Citra – Pengolahan Citra Digital' }}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="{{ asset('css/bilik-citra.css') }}">
</head>
<body>
    <div class="layout-wrapper">
        <!-- Top App Bar -->
        <header class="app-header">
            <div class="header-brand">
                <div class="brand-icon">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                        <polyline points="2 17 12 22 22 17"></polyline>
                        <polyline points="2 12 12 17 22 12"></polyline>
                    </svg>
                </div>
                <div class="brand-titles">
                    <h1>Bilik Citra</h1>
                    <p>Studio Pengolahan Citra Digital & Analisis Histogram</p>
                </div>
            </div>
            <div class="header-status">
                <span class="badge badge-accent">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
                    </svg>
                    100% Client-Side
                </span>
            </div>
        </header>

        <!-- Main Grid Layout -->
        <div class="app-container">
            <!-- Sidebar / Kolom Kontrol Kiri -->
            <aside class="sidebar">
                <!-- 1. Area Unggah Berkas -->
                <section class="panel-card upload-panel">
                    <h2 class="panel-heading">Berkas Citra</h2>
                    <label class="drop-zone" id="dropZone" for="file">
                        <input type="file" id="file" accept="image/*">
                        <!-- Placeholder Sebelum Unggah -->
                        <div class="drop-content" id="upload-placeholder">
                            <div class="drop-icon">
                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                    <polyline points="17 8 12 3 7 8"></polyline>
                                    <line x1="12" y1="3" x2="12" y2="15"></line>
                                </svg>
                            </div>
                            <span class="drop-title">Pilih gambar atau seret ke sini</span>
                            <span class="drop-subtitle">Format didukung: PNG, JPG, WebP</span>
                        </div>
                        <!-- Kotak Informasi File (Hanya muncul saat gambar telah diunggah) -->
                        <div class="file-loaded-info hidden" id="file-info-card" hidden>
                            <div class="file-badge">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                    <polyline points="21 15 16 10 5 21"></polyline>
                                </svg>
                                <div class="file-details">
                                    <span class="file-name" id="fileName">-</span>
                                    <span class="file-size" id="fileSize">0 KB</span>
                                </div>
                            </div>
                            <span class="change-file-hint">Klik untuk mengganti</span>
                        </div>
                    </label>
                </section>

                <!-- 2. Grid Tombol Alat -->
                <section class="panel-card tools-panel">
                    <h2 class="panel-heading">Pilihan Alat</h2>
                    <div class="tools-grid" id="tools"></div>
                </section>

                <!-- 3. Panel Pengaturan Parameter -->
                <section class="panel-card settings-panel">
                    <div class="settings-header">
                        <h2 class="panel-heading" id="ctlTitle">Pengaturan Alat</h2>
                        <span class="badge badge-subtle" id="activeToolBadge">Grayscale</span>
                    </div>
                    <div class="controls-container" id="ctl"></div>
                    <button class="btn btn-secondary btn-full" type="button" id="resetTool">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="1 4 1 10 7 10"></polyline>
                            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
                        </svg>
                        Kembalikan Pengaturan Alat
                    </button>
                </section>
            </aside>

            <!-- Workspace / Kolom Kanan -->
            <main class="workspace">
                <div class="stage-container" id="stage">
                    <!-- Placeholder "Belum Ada Citra Terpilih" (Hanya muncul saat belum ada gambar) -->
                    <div class="empty-state" id="empty-workspace">
                        <div class="empty-icon">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                <polyline points="21 15 16 10 5 21"></polyline>
                            </svg>
                        </div>
                        <h3>Belum Ada Citra Terpilih</h3>
                        <p>Silakan unggah berkas gambar melalui panel samping atau jatuhkan langsung ke area ini untuk memulai pemrosesan dan analisis histogram.</p>
                    </div>

                    <!-- Container Visualisasi Aktif (Sebelum & Sesudah) (Hanya muncul setelah gambar diunggah) -->
                    <div class="comparison-views hidden" id="active-workspace" hidden>
                        <!-- Kolom Citra Sebelum (Original) -->
                        <div class="image-column">
                            <div class="column-card">
                                <div class="column-header">
                                    <div class="col-title-group">
                                        <span class="label-badge">Sebelum</span>
                                        <span class="col-caption">Citra Awal</span>
                                    </div>
                                    <span class="meta-pill" id="srcMeta">- × - px</span>
                                </div>
                                <div class="canvas-viewport">
                                    <canvas id="cSrc"></canvas>
                                </div>
                                <!-- Histogram Sebelum -->
                                <div class="histogram-card">
                                    <div class="histogram-header">
                                        <span class="hist-title">Distribusi Warna (Sebelum)</span>
                                        <div class="hist-legend">
                                            <span class="legend-dot dot-red"></span><span class="legend-text">R</span>
                                            <span class="legend-dot dot-green"></span><span class="legend-text">G</span>
                                            <span class="legend-dot dot-blue"></span><span class="legend-text">B</span>
                                        </div>
                                    </div>
                                    <div class="histogram-canvas-wrapper">
                                        <canvas id="cHistSrc" width="512" height="140"></canvas>
                                    </div>
                                    <div class="histogram-axis">
                                        <span>0 (Gelap)</span>
                                        <span>128</span>
                                        <span>255 (Terang)</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Kolom Citra Sesudah (Processed) -->
                        <div class="image-column">
                            <div class="column-card">
                                <div class="column-header">
                                    <div class="col-title-group">
                                        <span class="label-badge label-badge-accent">Sesudah</span>
                                        <span class="col-caption" id="appliedFilterName">Hasil Pemrosesan</span>
                                    </div>
                                    <span class="meta-pill meta-accent" id="outMeta">0 ms</span>
                                </div>
                                <div class="canvas-viewport">
                                    <canvas id="cOut"></canvas>
                                </div>
                                <!-- Histogram Sesudah -->
                                <div class="histogram-card">
                                    <div class="histogram-header">
                                        <span class="hist-title">Distribusi Warna (Sesudah)</span>
                                        <div class="hist-legend">
                                            <span class="legend-dot dot-red"></span><span class="legend-text">R</span>
                                            <span class="legend-dot dot-green"></span><span class="legend-text">G</span>
                                            <span class="legend-dot dot-blue"></span><span class="legend-text">B</span>
                                        </div>
                                    </div>
                                    <div class="histogram-canvas-wrapper">
                                        <canvas id="cHistOut" width="512" height="140"></canvas>
                                    </div>
                                    <div class="histogram-axis">
                                        <span>0 (Gelap)</span>
                                        <span>128</span>
                                        <span>255 (Terang)</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Baris Tombol Aksi Bawah -->
                <div class="action-footer">
                    <div class="action-buttons">
                        <button class="btn btn-primary" id="dl" disabled>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                <polyline points="7 10 12 15 17 10"></polyline>
                                <line x1="12" y1="15" x2="12" y2="3"></line>
                            </svg>
                            Unduh PNG
                        </button>
                        <button class="btn btn-secondary" id="chain" disabled>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <polyline points="16 3 21 3 21 8"></polyline>
                                <line x1="4" y1="20" x2="21" y2="3"></line>
                                <polyline points="21 16 21 21 16 21"></polyline>
                                <line x1="15" y1="15" x2="21" y2="21"></line>
                                <line x1="4" y1="4" x2="9" y2="9"></line>
                            </svg>
                            Pakai Hasil Sebagai Gambar Awal
                        </button>
                        <button class="btn btn-ghost" id="reset" disabled>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                                <path d="M3 3v5h5"></path>
                            </svg>
                            Kembalikan ke Gambar Awal
                        </button>
                    </div>
                    <div class="status-indicator" id="status" role="status"></div>
                </div>
            </main>
        </div>
    </div>

    <script src="{{ asset('js/bilik-citra.js') }}"></script>
</body>
</html>
