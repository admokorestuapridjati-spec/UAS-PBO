/* =========================================================================
   FILE 2 / 4 — ENKAPSULASI (Encapsulation)
   =========================================================================
   Konsep: data yang "sensitif" atau yang tidak boleh diubah sembarangan
   dari luar disembunyikan sebagai private field (ditandai `#` di depan
   nama field), dan HANYA bisa dibaca/diubah lewat method publik yang
   sudah divalidasi. Ini mencegah bug seperti status pesanan diisi nilai
   acak/typo dari kode lain di luar class ini.

   Contoh lain enkapsulasi di project ini ada di class Pengguna
   (oop-01-abstraksi.js) lewat private field #password — hanya bisa
   dicek lewat cekPassword(), tidak bisa dibaca langsung dari luar.

   Class Pesanan di bawah ini TIDAK mewarisi apa pun (tidak `extends`),
   jadi dia berdiri sendiri dan tidak butuh file 1 atau file 3 di-load
   duluan — cukup dipanggil setelah class Kendaraan ada (untuk method
   hitungTarif() saat pesanan dibuat).
   ========================================================================= */

/* ---------------------------------------------------------------
   Pesanan — status pesanan disembunyikan lewat private field
   #status, dan HANYA bisa diubah lewat setStatus() yang memvalidasi
   dulu apakah nilai barunya termasuk status yang sah (lihat
   STATUS_VALID). Dari luar class ini, tidak ada cara untuk
   mengubah #status secara langsung (mis. `pesanan.#status = "x"`
   akan error kalau ditulis di luar class).

   `driverId` menyimpan pengemudi mana yang MENANGANI pesanan ini
   (diisi otomatis begitu ada pengemudi pertama kali mengubah
   statusnya) — dipakai untuk mencatat riwayat perjalanan
   pengemudi yang bersangkutan. Lihat handleUpdateStatus() di
   transgo-app.js.
   --------------------------------------------------------------- */
class Pesanan {
  #status; // private field — enkapsulasi
  static STATUS_VALID = ["menunggu_konfirmasi", "diproses", "dalam_perjalanan", "selesai", "dibatalkan"];

  constructor(penumpangId, kendaraan, lokasiJemput, lokasiTujuan, jarakKm) {
    this.id = crypto.randomUUID().slice(0, 8);
    this.penumpangId = penumpangId;
    this.driverId = null; // BUG FIX: dulu tidak pernah diisi -> riwayat pengemudi selalu kosong
    this.kendaraan = kendaraan;
    this.lokasiJemput = lokasiJemput;
    this.lokasiTujuan = lokasiTujuan;
    this.jarakKm = jarakKm;
    this.tarif = kendaraan.hitungTarif(jarakKm); // polimorfik: rumus beda tiap jenis kendaraan
    this.#status = "menunggu_konfirmasi";
    this.waktuDibuat = new Date();
  }

  // ---- akses terkontrol ke #status (inti enkapsulasi di class ini) ----
  getStatus() { return this.#status; }
  setStatus(baru) {
    if (!Pesanan.STATUS_VALID.includes(baru)) throw new Error(`Status '${baru}' tidak valid.`);
    this.#status = baru;
  }

  toDict() {
    return {
      id: this.id, penumpangId: this.penumpangId, driverId: this.driverId, kendaraan: this.kendaraan.getJenis(),
      platNomor: this.kendaraan.platNomor, lokasiJemput: this.lokasiJemput, lokasiTujuan: this.lokasiTujuan,
      jarakKm: this.jarakKm, tarif: this.tarif, status: this.#status,
      waktuDibuat: this.waktuDibuat.toLocaleString('id-ID', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' }),
    };
  }
  serialize() {
    return {
      id: this.id, penumpangId: this.penumpangId, driverId: this.driverId, kendaraanId: this.kendaraan.id,
      lokasiJemput: this.lokasiJemput, lokasiTujuan: this.lokasiTujuan, jarakKm: this.jarakKm,
      tarif: this.tarif, status: this.#status, waktuDibuat: this.waktuDibuat.toISOString(),
    };
  }
}

function deserializePesanan(data, kendaraanMap) {
  const kendaraan = kendaraanMap.get(data.kendaraanId);
  if (!kendaraan) return null;
  const p = new Pesanan(data.penumpangId, kendaraan, data.lokasiJemput, data.lokasiTujuan, data.jarakKm);
  p.id = data.id;
  p.driverId = data.driverId || null;
  p.tarif = data.tarif;
  p.waktuDibuat = new Date(data.waktuDibuat);
  p.setStatus(data.status); // tetap lewat method publik, bukan akses langsung ke #status
  return p;
}
