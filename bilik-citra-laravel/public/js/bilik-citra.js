(function(){
/* =====================================================================
   BILIK CITRA - PENGOLAHAN CITRA DIGITAL (6 FITUR)
   ---------------------------------------------------------------------
   Konsep dasar:
   - Citra digital = kumpulan piksel. Tiap piksel RGB punya 3 kanal
     (Merah, Hijau, Biru) bernilai 0-255.
   - Gambar digambar ke <canvas>, lalu getImageData() mengambil pikselnya
     sebagai array: [R,G,B,A, R,G,B,A, ...] (4 angka per piksel).
   - Tiap fitur membaca array ini, menghitung nilai baru tiap piksel, lalu
     menulisnya ke array hasil yang ditampilkan lewat putImageData().
   - Semua fitur ada di fungsi process() di bawah.
   ===================================================================== */
var MAX=1400,$=function(i){return document.getElementById(i)};
var cSrc=$('cSrc'),cOut=$('cOut'),sx=cSrc.getContext('2d',{willReadFrequently:true}),ox=cOut.getContext('2d');
/* original = piksel gambar awal | current = sumber yang sedang diolah
   active = fitur yang dipilih    | timer = penunda agar slider tidak berat */
var original=null,current=null,active='gray',timer=null;

/* Daftar fitur + pengaturannya. Tiap kontrol punya:
   k = nama parameter, t = jenis (r=slider, c=centang, s=pilihan, k=warna),
   l = label, min/max/step = rentang slider, v = nilai awal. */
var OPS=[
{id:'gray',name:'Grayscale',c:[
 {k:'r',t:'r',l:'Bobot merah (R)',min:0,max:1,step:.001,v:.299,d:3},
 {k:'g',t:'r',l:'Bobot hijau (G)',min:0,max:1,step:.001,v:.587,d:3},
 {k:'b',t:'r',l:'Bobot biru (B)',min:0,max:1,step:.001,v:.114,d:3},
 {k:'norm',t:'c',l:'Normalkan bobot (jumlah = 1)',v:true},
 {k:'mix',t:'r',l:'Intensitas',min:0,max:100,step:1,v:100,u:'%'}]},
{id:'bin',name:'Binarisasi',c:[
 {k:'T',t:'r',l:'Ambang (T)',min:0,max:255,step:1,v:128},
 {k:'inv',t:'c',l:'Balik hitam dan putih',v:false},
 {k:'fg',t:'k',l:'Warna objek',v:'#ffffff'},
 {k:'bg',t:'k',l:'Warna latar',v:'#000000'}]},
{id:'bc',name:'Kecerahan & kontras',c:[
 {k:'alpha',t:'r',l:'Kontras (α)',min:0,max:3,step:.01,v:1,d:2},
 {k:'beta',t:'r',l:'Kecerahan (β)',min:-255,max:255,step:1,v:0},
 {k:'gamma',t:'r',l:'Gamma',min:.2,max:3,step:.01,v:1,d:2}]},
{id:'blur',name:'Blur',c:[
 {k:'type',t:'s',l:'Jenis filter',v:'gauss',o:[['mean','Mean filter'],['gauss','Gaussian blur']]},
 {k:'size',t:'r',l:'Ukuran kernel',min:1,max:41,step:2,v:5,f:function(x){return x+' × '+x}},
 {k:'sigma',t:'r',l:'Sigma (Gaussian)',min:.3,max:12,step:.1,v:1.5,d:1},
 {k:'mix',t:'r',l:'Intensitas',min:0,max:100,step:1,v:100,u:'%'}]},
{id:'edge',name:'Deteksi tepi',c:[
 {k:'op',t:'s',l:'Operator',v:'sobel',o:[['sobel','Sobel'],['prewitt','Prewitt'],['scharr','Scharr']]},
 {k:'gain',t:'r',l:'Kekuatan tepi',min:.1,max:5,step:.05,v:1,d:2},
 {k:'thr',t:'r',l:'Ambang tepi',min:0,max:255,step:1,v:0},
 {k:'inv',t:'c',l:'Garis gelap di latar putih',v:false}]},
{id:'neg',name:'Citra negatif',c:[
 {k:'r',t:'c',l:'Balik kanal merah',v:true},
 {k:'g',t:'c',l:'Balik kanal hijau',v:true},
 {k:'b',t:'c',l:'Balik kanal biru',v:true},
 {k:'mix',t:'r',l:'Intensitas',min:0,max:100,step:1,v:100,u:'%'}]}];

var S={};
function defaults(o){var s={};o.c.forEach(function(c){s[c.k]=c.v});return s}
OPS.forEach(function(o){S[o.id]=defaults(o)});
function op(id){return OPS.filter(function(o){return o.id===id})[0]}

function mk(t,a,h){var e=document.createElement(t);for(var k in a)e.setAttribute(k,a[k]);if(h!=null)e.textContent=h;return e}
function fmt(c,v){return c.f?c.f(v):(c.d!=null?(+v).toFixed(c.d):v)+(c.u||'')}

function buildTools(){
  var ul=$('tools');
  OPS.forEach(function(o){
    var li=mk('li',{}),b=mk('button',{type:'button','data-id':o.id,'aria-pressed':'false'},o.name);
    b.onclick=function(){active=o.id;render()};li.appendChild(b);ul.appendChild(li);
  });
}
function buildCtl(){
  var box=$('ctl'),o=op(active),s=S[active];box.innerHTML='';
  o.c.forEach(function(c){
    var row=mk('div',{'class':'row'}),id='c_'+c.k;
    if(c.t==='r'){
      var hd=mk('div',{'class':'hd'}),lb=mk('label',{'for':id},c.l),out=mk('output',{},fmt(c,s[c.k]));
      hd.appendChild(lb);hd.appendChild(out);
      var i=mk('input',{type:'range',id:id,min:c.min,max:c.max,step:c.step,value:s[c.k]});
      i.oninput=function(){s[c.k]=parseFloat(i.value);out.textContent=fmt(c,s[c.k]);schedule()};
      row.appendChild(hd);row.appendChild(i);
    }else if(c.t==='c'){
      var l=mk('label',{'class':'chk'}),i2=mk('input',{type:'checkbox',id:id});i2.checked=!!s[c.k];
      i2.onchange=function(){s[c.k]=i2.checked;schedule()};
      l.appendChild(i2);l.appendChild(mk('span',{},c.l));row.appendChild(l);
    }else if(c.t==='s'){
      row.appendChild(mk('label',{'for':id},c.l));
      var sel=mk('select',{id:id});c.o.forEach(function(x){sel.appendChild(mk('option',{value:x[0]},x[1]))});
      sel.value=s[c.k];sel.onchange=function(){s[c.k]=sel.value;schedule()};row.appendChild(sel);
    }else if(c.t==='k'){
      row.appendChild(mk('label',{'for':id},c.l));
      var k=mk('input',{type:'color',id:id,value:s[c.k]});k.oninput=function(){s[c.k]=k.value;schedule()};row.appendChild(k);
    }
    box.appendChild(row);
  });
}

function cl(v){return v<0?0:v>255?255:v}
function gray(d){var n=d.width*d.height,g=new Float32Array(n),p=d.data;for(var i=0,j=0;i<n;i++,j+=4)g[i]=.299*p[j]+.587*p[j+1]+.114*p[j+2];return g}
function hex(h){var n=parseInt(h.slice(1),16);return[n>>16&255,n>>8&255,n&255]}

/* process(): inti pengolahan citra.
   src.data = array piksel asli, out/d = array hasil, n = jumlah piksel.
   i = nomor piksel, j = posisi kanal R-nya di array (j = i*4). */
function process(id,src){
  var w=src.width,h=src.height,n=w*h,s=src.data,out=new ImageData(w,h),d=out.data,p=S[id],i,j,m;
  /* ---------------------------------------------------------------
     1. KONVERSI GRAYSCALE (KEABUAN)
     Penjelasan : mengubah citra berwarna (RGB, 3 kanal) menjadi citra
                  hitam-putih/skala keabuan dengan rata-rata berbobot
                  intensitas warna.
     Cara kerja : I = 0.299 x R + 0.587 x G + 0.114 x B
                  (hijau berbobot terbesar karena mata paling peka hijau)
     Kesulitan  : sangat mudah
     --------------------------------------------------------------- */
  if(id==='gray'){
    var a=p.r,b=p.g,c=p.b;if(p.norm){var t=a+b+c||1;a/=t;b/=t;c/=t}
    m=p.mix/100;
    for(i=0,j=0;i<n;i++,j+=4){// rumus utama: I = a*R + b*G + c*B  (bawaan a=0.299, b=0.587, c=0.114)
      var v=a*s[j]+b*s[j+1]+c*s[j+2];
      // R, G, B diisi nilai sama = abu-abu; 'm' (intensitas) mencampur dengan warna asli
      d[j]=cl(s[j]+(v-s[j])*m);d[j+1]=cl(s[j+1]+(v-s[j+1])*m);d[j+2]=cl(s[j+2]+(v-s[j+2])*m);d[j+3]=s[j+3]}
  }else if(id==='bin'){
    /* ---------------------------------------------------------------
       2. BINARISASI (THRESHOLDING)
       Penjelasan : mengubah citra grayscale menjadi citra biner (hanya
                    2 nilai: hitam 0 atau putih 255) berdasarkan ambang T.
       Kegunaan   : memisahkan objek utama dari latar belakang.
       Kesulitan  : sangat mudah (cukup if/else pada tiap piksel).
       --------------------------------------------------------------- */
    var g=gray(src),F=hex(p.fg),B=hex(p.bg);
    for(i=0,j=0;i<n;i++,j+=4){// if/else per piksel: terang >= T jadi objek (putih 255), selain itu latar (hitam 0)
      var on=g[i]>=p.T;if(p.inv)on=!on;var q=on?F:B;d[j]=q[0];d[j+1]=q[1];d[j+2]=q[2];d[j+3]=s[j+3]}
  }else if(id==='bc'){
    /* ---------------------------------------------------------------
       3. KECERAHAN DAN KONTRAS
       Penjelasan : menambah/mengurangi intensitas piksel secara linier
                    (kecerahan) dan mengalikannya (kontras).
       Cara kerja : g(x,y) = alpha x f(x,y) + beta
                    alpha = kontras, beta = kecerahan.
                    (gamma = tambahan; gamma 1 berarti tidak berpengaruh)
       Kesulitan  : mudah
       --------------------------------------------------------------- */
    var lut=new Uint8ClampedArray(256),gm=1/p.gamma;
    // tabel LUT: hasil untuk setiap nilai 0-255 dihitung sekali agar cepat
    // cl() menjaga hasil tetap di rentang 0-255
    for(i=0;i<256;i++){var x=cl(p.alpha*i+p.beta);lut[i]=255*Math.pow(x/255,gm)}
    for(i=0,j=0;i<n;i++,j+=4){d[j]=lut[s[j]];d[j+1]=lut[s[j+1]];d[j+2]=lut[s[j+2]];d[j+3]=s[j+3]}
  }else if(id==='neg'){
    /* ---------------------------------------------------------------
       6. CITRA NEGATIF (IMAGE NEGATIVES)
       Penjelasan : membalik intensitas piksel; area terang jadi gelap
                    dan sebaliknya (seperti klise film foto jadul).
       Cara kerja : s = L - 1 - f(x,y); untuk citra 8-bit (L = 256)
                    s = 255 - piksel asli.
       Kegunaan   : memperjelas detail putih/abu-abu di area dominan
                    gelap (citra medis, mis. X-Ray atau mamografi).
       Kesulitan  : sangat mudah
       --------------------------------------------------------------- */
    m=p.mix/100;var f=[p.r,p.g,p.b];
    for(i=0,j=0;i<n;i++,j+=4){for(var ch=0;ch<3;ch++){// ng = 255 - o  (rumus negatif per kanal; kanal yang tidak dipilih dibiarkan)
      var o=s[j+ch],ng=f[ch]?255-o:o;d[j+ch]=o+(ng-o)*m}d[j+3]=s[j+3]}
  }else if(id==='blur'){
    /* ---------------------------------------------------------------
       4. PENAPISAN SPASIAL DASAR (BLUR / SMOOTHING)
       Penjelasan : menghaluskan citra / mengurangi derau (noise) dengan
                    kernel konvolusi: Mean Filter atau Gaussian Blur.
       Cara kerja : nilai tiap piksel diganti rata-rata (berbobot) piksel
                    di sekitarnya, mis. jendela 3 x 3.
                    Mean = semua bobot sama; Gaussian = piksel dekat
                    berbobot lebih besar.
       Kesulitan  : mudah (di OpenCV/MATLAB sudah ada fungsi bawaan).
       Catatan    : di sini ditulis manual. Kernel 2D dipecah jadi 2 kali
                    proses 1D (horizontal lalu vertikal) agar cepat; hasilnya
                    sama dengan kernel 2D biasa.
       --------------------------------------------------------------- */
    var k=Math.round(p.size),r=(k-1)>>1,ker=new Float32Array(k),sum=0;
    for(i=-r;i<=r;i++){ker[i+r]=p.type==='gauss'?Math.exp(-i*i/(2*p.sigma*p.sigma)):1;sum+=ker[i+r]}
    // normalisasi: jumlah bobot = 1 supaya kecerahan gambar tidak berubah
    for(i=0;i<k;i++)ker[i]/=sum;
    // TAHAP 1: haluskan ke arah horizontal (piksel tepi memakai piksel terdekat/clamp)
    var tmp=new Float32Array(n*4),x,y,u,acc0,acc1,acc2,q2;
    for(y=0;y<h;y++)for(x=0;x<w;x++){acc0=acc1=acc2=0;
      for(u=-r;u<=r;u++){var xx=x+u;xx=xx<0?0:xx>=w?w-1:xx;q2=(y*w+xx)*4;var kv=ker[u+r];acc0+=s[q2]*kv;acc1+=s[q2+1]*kv;acc2+=s[q2+2]*kv}
      q2=(y*w+x)*4;tmp[q2]=acc0;tmp[q2+1]=acc1;tmp[q2+2]=acc2}
    m=p.mix/100;
    // TAHAP 2: haluskan hasil tahap 1 ke arah vertikal
    for(y=0;y<h;y++)for(x=0;x<w;x++){acc0=acc1=acc2=0;
      for(u=-r;u<=r;u++){var yy=y+u;yy=yy<0?0:yy>=h?h-1:yy;q2=(yy*w+x)*4;var kw=ker[u+r];acc0+=tmp[q2]*kw;acc1+=tmp[q2+1]*kw;acc2+=tmp[q2+2]*kw}
      q2=(y*w+x)*4;d[q2]=s[q2]+(acc0-s[q2])*m;d[q2+1]=s[q2+1]+(acc1-s[q2+1])*m;d[q2+2]=s[q2+2]+(acc2-s[q2+2])*m;d[q2+3]=s[q2+3]}
  }else if(id==='edge'){
    /* ---------------------------------------------------------------
       5. DETEKSI TEPI SEDERHANA (EDGE DETECTION)
       Penjelasan : mendeteksi perubahan mendadak intensitas piksel untuk
                    menemukan garis tepi objek.
       Metode     : operator Sobel, Prewitt (dan Scharr). Canny tidak
                    dibuat di sini.
       Cara kerja : citra grayscale dikonvolusi dengan 2 kernel 3x3:
                    Gx (perubahan horizontal) dan Gy (vertikal),
                    lalu magnitudo G = akar(Gx^2 + Gy^2).
       Kesulitan  : menengah ke bawah (paling mudah memakai Sobel).
       --------------------------------------------------------------- */
    var gr=gray(src),kx,ky;
    // kernel 3x3 sesuai operator yang dipilih (kx = arah horizontal, ky = vertikal)
    if(p.op==='sobel'){kx=[-1,0,1,-2,0,2,-1,0,1];ky=[-1,-2,-1,0,0,0,1,2,1]}
    else if(p.op==='prewitt'){kx=[-1,0,1,-1,0,1,-1,0,1];ky=[-1,-1,-1,0,0,0,1,1,1]}
    else{kx=[-3,0,3,-10,0,10,-3,0,3];ky=[-3,-10,-3,0,0,0,3,10,3];}
    var scale=p.op==='scharr'?1/4:1;
    for(var y3=0;y3<h;y3++)for(var x3=0;x3<w;x3++){
      var gx=0,gy=0,t2=0;
      for(var a2=-1;a2<=1;a2++){var yy2=Math.min(h-1,Math.max(0,y3+a2));
        for(var b2=-1;b2<=1;b2++){var xx2=Math.min(w-1,Math.max(0,x3+b2)),pv=gr[yy2*w+xx2];gx+=pv*kx[t2];gy+=pv*ky[t2];t2++}}
      // magnitudo gradien: makin besar = perubahan intensitas makin tajam = tepi makin jelas
      var mg=cl(Math.sqrt(gx*gx+gy*gy)*scale*p.gain);if(mg<p.thr)mg=0;if(p.inv)mg=255-mg;
      var o2=(y3*w+x3)*4;d[o2]=d[o2+1]=d[o2+2]=mg;d[o2+3]=255}
  }
  return out;
}

// schedule(): hitung ulang saat slider digeser, maksimal sekali per frame agar mulus
function schedule(){if(timer)cancelAnimationFrame(timer);timer=requestAnimationFrame(run)}
// run(): jalankan process() lalu tampilkan hasilnya di canvas 'Sesudah'
function run(){
  if(!current)return;
  var t0=performance.now(),res=process(active,current);
  cOut.width=res.width;cOut.height=res.height;ox.putImageData(res,0,0);
  $('views').hidden=false;$('empty').hidden=true;
  ['dl','chain','reset'].forEach(function(i){$(i).disabled=false});
  $('status').textContent=res.width+' × '+res.height+' px · diproses '+Math.round(performance.now()-t0)+' ms';
}
function render(){
  document.querySelectorAll('#tools button').forEach(function(b){b.setAttribute('aria-pressed',b.dataset.id===active)});
  $('ctlTitle').textContent='Pengaturan: '+op(active).name;
  buildCtl();run();
}
// load(): baca file gambar, perkecil jika > MAX px, simpan pikselnya sebagai 'original'
function load(file){
  if(!file||!/^image\//.test(file.type)){$('status').textContent='File harus berupa gambar (JPG, PNG, WebP, dll).';return}
  var url=URL.createObjectURL(file),img=new Image();
  img.onload=function(){
    var sc=Math.min(1,MAX/Math.max(img.width,img.height)),w=Math.round(img.width*sc),h=Math.round(img.height*sc);
    cSrc.width=w;cSrc.height=h;sx.drawImage(img,0,0,w,h);
    original=sx.getImageData(0,0,w,h);current=original;
    $('dropText').textContent=file.name;URL.revokeObjectURL(url);run();
  };
  img.onerror=function(){$('status').textContent='Gambar tidak dapat dibuka. Coba file lain.'};
  img.src=url;
}
var drop=document.querySelector('.drop');
$('file').onchange=function(e){load(e.target.files[0])};
[drop,$('stage')].forEach(function(z){
  z.addEventListener('dragover',function(e){e.preventDefault();drop.classList.add('over')});
  z.addEventListener('dragleave',function(){drop.classList.remove('over')});
  z.addEventListener('drop',function(e){e.preventDefault();drop.classList.remove('over');load(e.dataTransfer.files[0])});
});
$('resetTool').onclick=function(){S[active]=defaults(op(active));buildCtl();run()};
$('dl').onclick=function(){var a=document.createElement('a');a.href=cOut.toDataURL('image/png');a.download='hasil-'+active+'.png';a.click()};
$('chain').onclick=function(){current=ox.getImageData(0,0,cOut.width,cOut.height);sx.putImageData(current,0,0);run();$('status').textContent='Hasil dipakai sebagai gambar awal. Pilih alat lain untuk melanjutkan.'};
$('reset').onclick=function(){current=original;sx.putImageData(original,0,0);run()};
buildTools();render();
})();
