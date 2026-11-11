<?php

namespace App\Http\Controllers;

class ImageProcessingController extends Controller
{
    public function index()
    {
        return view('bilik-citra', [
            'title' => 'Bilik Citra – Pengolahan Citra Digital',
        ]);
    }
}
