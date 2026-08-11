/* =========================================================================
   FILE 4 / 4 — POLIMORFISME (Polymorphism)
   =========================================================================
   Konsep: kode di luar class bisa memanggil method dengan NAMA yang
   sama persis (mis. `hitungTarif(km)`), tanpa perlu tahu atau peduli
   objeknya itu Motor, Mobil, atau MobilPremium — JavaScript otomatis
   menjalankan versi hitungTarif() milik class objek tsb (method yang
   di-override di file 3 — Pewarisan). Hasilnya beda-beda tergantung
   objeknya, walau cara memanggilnya seragam.

   Fungsi-fungsi pembungkus (wrapper) di bawah ini bukan cuma teori —
   dipakai betulan oleh transgo-app.js supaya polimorfismenya "kelihatan"
   di satu tempat, bukan tersebar dan implisit di banyak file.

   WAJIB dimuat SETELAH oop-01-abstraksi.js & oop-03-pewarisan.js karena
   memanggil method yang didefinisikan/di-override di sana.
   ========================================================================= */

/* ---- Polimorfisme lewat Kendaraan (Motor / Mobil / MobilPremium) ---- */

// Dipanggil dengan cara SAMA untuk kendaraan jenis apa pun, tapi rumus
// tarifnya beda tergantung objeknya (lihat hitungTarif() di masing-masing
// subclass pada oop-03-pewarisan.js).
function hitungTarifPolimorfik(kendaraan, jarakKm) {
  return kendaraan.hitungTarif(jarakKm);
}

// Sama halnya: getJenis() mengembalikan label berbeda tergantung objeknya.
function labelJenisPolimorfik(kendaraan) {
  return kendaraan.getJenis();
}

/* ---- Polimorfisme lewat Pengguna (Penumpang / Pengemudi) ---- */

// getProfil() mengembalikan bentuk data yang berbeda: Penumpang punya
// `totalPesanan`, Pengemudi punya `jenisKendaraan` & `totalPerjalanan` —
// tapi dipanggil dari luar dengan cara yang sama persis.
function profilPolimorfik(pengguna) {
  return pengguna.getProfil();
}

// role() mengembalikan "penumpang" atau "pengemudi" tergantung objeknya.
function roleLabelPolimorfik(pengguna) {
  return pengguna.role();
}
