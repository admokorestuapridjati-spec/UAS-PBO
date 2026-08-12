# TransGo 🚕

Simulasi aplikasi pemesanan transportasi online (ride-hailing) yang dibuat
untuk mendemonstrasikan **4 pilar Object-Oriented Programming (OOP)** —
Abstraksi, Enkapsulasi, Pewarisan, dan Polimorfisme — dalam **dua bahasa
sekaligus**: JavaScript (aplikasi web yang jalan di browser) dan Python
(kelas-kelas paralel untuk latihan/pembelajaran).

Ada dua portal:
- **Portal Penumpang** (`transgo-penumpang.html`) — daftar, top up saldo,
  pesan perjalanan (jarak dihitung otomatis dari peta), lihat dashboard &
  riwayat transaksi.
- **Portal Driver** (`transgo-driver.html`) — daftar, lihat pesanan masuk,
  update status perjalanan, lihat riwayat & pendapatan.

---

## 📁 Struktur File

| File | Peran |
|---|---|
| `transgo-penumpang.html` | Halaman utama portal Penumpang |
| `transgo-driver.html` | Halaman utama portal Driver |
| `transgo-style.css` | Semua styling (tema "transit map") |
| `oop-01-abstraksi.js` | Kelas abstrak `Pengguna` & `Kendaraan` + custom error |
| `oop-02-enkapsulasi.js` | Kelas `Pesanan` (status disembunyikan via private field) |
| `oop-03-pewarisan.js` | Subclass `Penumpang`, `Pengemudi`, `Motor`, `Mobil`, `MobilPremium` |
| `oop-04-polimorfisme.js` | Fungsi wrapper polimorfik (`hitungTarifPolimorfik`, dst) |
| `transgo-app.js` | Logika aplikasi: state (localStorage), render UI, event handler |
| `oop_01_abstraksi.py` … `oop_04_polimorfisme.py` | **Versi Python** dari 4 file OOP di atas (kelas & konsep yang sama persis, bukan bagian dari aplikasi web — lihat bagian [Menjalankan Versi Python](#-menjalankan-versi-python-opsional--untuk-belajar)) |

Urutan pemuatan file JS **penting** (lihat komentar di masing-masing file
`.js` dan di `<script>` tag pada file HTML):

```
oop-01-abstraksi.js → oop-02-enkapsulasi.js → oop-03-pewarisan.js
→ oop-04-polimorfisme.js → transgo-app.js
```

---

## ✅ Cara Menjalankan Aplikasi Web (Wajib Pakai Local Server)

Aplikasi ini **murni client-side** (tidak butuh backend/database) — data
disimpan di `localStorage` browser sebagai "database" bersama antara
halaman Penumpang dan Driver.

> ⚠️ **Penting:** Jangan buka file HTML dengan cara diklik dua kali
> (`file://...`). Browser modern menganggap tiap file `file://` sebagai
> origin terpisah, sehingga `localStorage` **tidak akan tersinkron**
> antara portal Penumpang dan Driver (pesanan yang dibuat penumpang tidak
> akan muncul di dashboard driver). Aplikasi harus diakses lewat
> `http://localhost/...` dari server yang sama.

### Opsi 1 — Pakai Python (paling gampang, tidak perlu instal apa pun tambahan)

```bash
# Jalankan dari folder yang berisi semua file di atas
python3 -m http.server 8000
```

Lalu buka di browser:
- Penumpang: `http://localhost:8000/transgo-penumpang.html`
- Driver: `http://localhost:8000/transgo-driver.html`

### Opsi 2 — Pakai Node.js

```bash
npx serve .
# atau
npx http-server -p 8000
```

### Opsi 3 — VS Code Live Server

Instal ekstensi **Live Server**, klik kanan pada `transgo-penumpang.html`
atau `transgo-driver.html` → **"Open with Live Server"**.

Agar simulasi antar dua peran terasa nyata, buka **dua tab browser** dari
origin yang sama: satu tab `transgo-penumpang.html`, satu tab
`transgo-driver.html`. Perubahan data (misal pesanan baru) akan otomatis
sinkron antar tab tanpa perlu refresh manual (lewat event `storage`).

### Koneksi Internet

Aplikasi butuh koneksi internet aktif untuk:
- Google Fonts (Space Grotesk, Inter, IBM Plex Mono)
- Perhitungan jarak otomatis saat memesan, lewat layanan peta gratis:
  - **Nominatim** (OpenStreetMap) — geocoding alamat → koordinat
  - **OSRM** (`router.project-osrm.org`) — menghitung jarak rute
    berkendara antar dua koordinat

  Kalau alamat tidak ditemukan atau layanan peta sedang bermasalah, form
  pemesanan otomatis menampilkan opsi **isi jarak manual (km)** sebagai
  fallback.

---

## 🐍 Menjalankan Versi Python (Opsional — untuk Belajar)

File `oop_01_abstraksi.py` s.d. `oop_04_polimorfisme.py` **bukan bagian
dari aplikasi web** — mereka adalah versi Python dari 4 konsep OOP yang
sama, ditulis sebagai materi belajar/perbandingan sintaks JS vs Python
(class abstrak, private attribute, inheritance, polymorphism).

Tidak butuh instalasi paket eksternal apa pun (lihat `requirements.txt`)
karena hanya memakai modul bawaan Python (`uuid`, `datetime`).

Import berurutan mengikuti urutan yang sama seperti versi JS:

```python
from oop_01_abstraksi import Pengguna, Kendaraan, AutentikasiError, SaldoTidakCukupError
from oop_03_pewarisan import Penumpang, Pengemudi, Motor, Mobil, MobilPremium
from oop_04_polimorfisme import hitung_tarif_polimorfik, profil_polimorfik

# contoh pakai
motor = Motor("L 1234 AB", "Honda Beat", 1)
print(hitung_tarif_polimorfik(motor, 5))   # -> 6000.0

penumpang = Penumpang("Budi", "budi@mail.com", "1234")
penumpang.top_up(50000)
print(profil_polimorfik(penumpang))
```

Jalankan lewat REPL Python interaktif:

```bash
python3
>>> from oop_03_pewarisan import Motor, Penumpang
>>> ...
```

atau tulis skrip `.py` sendiri di folder yang sama lalu jalankan dengan
`python3 nama_skrip.py`.

---

## 📦 Requirements

Lihat `requirements.txt` — proyek ini **tidak punya dependensi eksternal**
(baik untuk bagian web/JS maupun bagian Python), hanya memerlukan:

- Browser modern (Chrome/Firefox/Edge/Safari versi terbaru) untuk
  menjalankan aplikasi web
- Python 3.7+ (opsional) — untuk menjalankan local server ATAU untuk
  mencoba versi Python dari materi OOP
- Koneksi internet — untuk Google Fonts dan fitur hitung jarak otomatis

---

## 🎓 Ringkasan 4 Pilar OOP di Proyek Ini

| Pilar | Implementasi |
|---|---|
| **Abstraksi** | `Pengguna` & `Kendaraan` adalah kelas abstrak (tidak bisa langsung diinstansiasi — dicegah lewat `new.target`/`type(self) is ...`); method seperti `login()`, `hitungTarif()` hanya "kontrak" kosong yang wajib diisi subclass |
| **Enkapsulasi** | Field privat `#password` (di `Pengguna`) dan `#status` (di `Pesanan`) hanya bisa diakses/diubah lewat method publik yang tervalidasi (`cekPassword()`, `setStatus()`, dst) |
| **Pewarisan** | `Penumpang` & `Pengemudi` mewarisi `Pengguna`; `Motor`, `Mobil`, `MobilPremium` mewarisi `Kendaraan` |
| **Polimorfisme** | Method sama seperti `hitungTarif()`, `getJenis()`, `getProfil()`, `role()` dipanggil dengan cara seragam tapi hasilnya berbeda tergantung objeknya — dibungkus lewat fungsi helper di `oop-04-polimorfisme.js` / `oop_04_polimorfisme.py` |

---

## 🔧 Catatan Teknis Lain

- **Reset data:** untuk mulai dari awal (hapus semua akun/pesanan), buka
  DevTools browser → Application/Storage → Local Storage → hapus key yang
  berawalan `transgo_`, lalu refresh halaman.
- **Saldo awal:** setiap akun baru (penumpang maupun driver) otomatis
  mendapat saldo demo Rp50.000 saat registrasi.
- **Akun terpisah per peran:** akun yang didaftarkan di portal Penumpang
  tidak bisa dipakai login di portal Driver, dan sebaliknya.
