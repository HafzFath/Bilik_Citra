<?php
 
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ImageProcessingController;
 
Route::get('/', function () {
    return view('welcome');
});
 
Route::get('/pengolahan-citra', [ImageProcessingController::class, 'index'])
    ->name('citra.index');
