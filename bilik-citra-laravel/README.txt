Salin isi folder ini ke proyek Laravel:

public/css/bilik-citra.css                         -> public/css/
public/js/bilik-citra.js                           -> public/js/
resources/views/bilik-citra.blade.php              -> resources/views/
app/Http/Controllers/ImageProcessingController.php -> app/Http/Controllers/
routes-snippet/web.php.txt                         -> tempel isinya ke routes/web.php

Jalankan: php artisan serve, lalu buka http://127.0.0.1:8000/pengolahan-citra
Pengolahan citra berjalan di browser (JavaScript + Canvas), jadi tidak perlu database atau paket tambahan.
