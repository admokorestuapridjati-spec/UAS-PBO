/* =========================================================================
   FILE 1 / 4 — ABSTRAKSI (Abstraction)
   =========================================================================
   Konsep: kelas "abstrak" tidak boleh langsung dibuat objeknya — dia cuma
   cetakan/kontrak untuk subclass-nya. Pengguna aplikasi cukup tahu APA
   yang bisa dilakukan (topUp(), hitungTarif(), dst) tanpa perlu tahu
   detail rumus/implementasinya, karena detail itu "disembunyikan" dan
   baru diisi di kelas turunannya (lihat file 3 — Pewarisan).

   Cara pencegahannya di JavaScript: mengecek `new.target === NamaClass`
   di dalam constructor. Kalau seseorang mencoba `new Pengguna(...)`
   langsung, otomatis error. Method seperti login(), getProfil(),
   hitungTarif(), getJenis() sengaja HANYA berisi `throw new Error(...)`
   di sini — ini adalah "kontrak" yang WAJIB diisi ulang (override) oleh
   subclass, sesuai prinsip abstraksi.

   File ini dimuat PALING AWAL karena file 3 (Pewarisan) butuh class
   Pengguna & Kendaraan di sini sebagai induknya, dan class-class di sini
   butuh 3 custom exception di bawah.
   ========================================================================= */

/* ---------- CUSTOM EXCEPTIONS (error khusus, bukan bawaan JS) ---------- */
class KendaraanTidakTersediaError extends Error {
  constructor(pesan = "Kendaraan yang dipilih sedang tidak tersedia.") {
    super(pesan); this.name = "KendaraanTidakTersediaError";
  }
}
class SaldoTidakCukupError extends Error {
  constructor(pesan = "Saldo Anda tidak mencukupi untuk menyelesaikan transaksi ini.") {
    super(pesan); this.name = "SaldoTidakCukupError";
  }
}
class AutentikasiError extends Error {
  constructor(pesan = "Autentikasi gagal.") {
    super(pesan); this.name = "AutentikasiError";
  }
}

/* ---------------------------------------------------------------
   ABSTRAKSI: Pengguna (kelas dasar/abstrak untuk Penumpang & Pengemudi)

   - `new.target === Pengguna` mencegah class ini dibuat objeknya
     secara langsung.
   - login(), getProfil(), role() sengaja cuma throw error di sini —
     WAJIB diisi ulang oleh subclass (lihat oop-03-pewarisan.js).
   - Catatan: field #password di bawah juga contoh ENKAPSULASI
     (private field), tapi karena dia menyatu dengan class abstrak
     ini, penjelasan lengkapnya ada di oop-02-enkapsulasi.js.
   --------------------------------------------------------------- */
class Pengguna {
  #password; // private field — enkapsulasi (lihat oop-02-enkapsulasi.js)
  constructor(nama, email, password) {
    if (new.target === Pengguna) {
      throw new Error("Pengguna adalah kelas abstrak dan tidak bisa diinstansiasi langsung.");
    }
    this.id = crypto.randomUUID().slice(0, 8);
    this.nama = nama;
    this.email = email;
    this.#password = password;
    this._saldo = 0;
    this.dibuatPada = new Date();
  }
  cekPassword(input) { return this.#password === input; }
  setPassword(baru) {
    if (baru.length < 4) throw new Error("Password minimal 4 karakter.");
    this.#password = baru;
  }
  getSaldo() { return this._saldo; }
  topUp(jumlah) {
    if (jumlah <= 0) throw new Error("Jumlah top up harus lebih dari 0.");
    this._saldo += jumlah;
    return this._saldo;
  }
  kurangiSaldo(jumlah) {
    if (jumlah > this._saldo) {
      throw new SaldoTidakCukupError(
        `Saldo Anda (Rp${this._saldo.toLocaleString('id-ID')}) tidak cukup untuk membayar Rp${jumlah.toLocaleString('id-ID')}.`
      );
    }
    this._saldo -= jumlah;
    return this._saldo;
  }

  // ---- kontrak abstrak: WAJIB di-override oleh subclass ----
  login(passwordInput) { throw new Error("login() wajib diimplementasikan oleh subclass."); }
  getProfil() { throw new Error("getProfil() wajib diimplementasikan oleh subclass."); }
  role() { throw new Error("role() wajib diimplementasikan oleh subclass."); }

  _rawPassword() { return this.#password; }
  serialize() {
    return {
      role: this.role(), id: this.id, nama: this.nama, email: this.email,
      password: this._rawPassword(), saldo: this._saldo,
      dibuatPada: this.dibuatPada.toISOString(),
    };
  }
}

/* ---------------------------------------------------------------
   ABSTRAKSI: Kendaraan (kelas dasar/abstrak untuk Motor, Mobil,
   MobilPremium)

   - Tidak boleh dibuat objeknya langsung (sama seperti Pengguna).
   - hitungTarif() & getJenis() cuma "kontrak" kosong di sini —
     rumus tarif sesungguhnya baru diisi di subclass-nya (lihat
     oop-03-pewarisan.js), dan pemanggilannya seragam di seluruh
     app lewat helper di oop-04-polimorfisme.js.
   --------------------------------------------------------------- */
class Kendaraan {
  constructor(platNomor, namaKendaraan, kapasitas) {
    if (new.target === Kendaraan) {
      throw new Error("Kendaraan adalah kelas abstrak dan tidak bisa diinstansiasi langsung.");
    }
    this.id = crypto.randomUUID().slice(0, 8);
    this.platNomor = platNomor;
    this.namaKendaraan = namaKendaraan;
    this.kapasitas = kapasitas;
    this.tersedia = true;
  }

  // ---- kontrak abstrak: WAJIB di-override oleh subclass ----
  hitungTarif(jarakKm) { throw new Error("hitungTarif() wajib diimplementasikan oleh subclass."); }
  getJenis() { throw new Error("getJenis() wajib diimplementasikan oleh subclass."); }

  setTersedia(status) { this.tersedia = status; }
  toDict(jarakContoh = 5) {
    return {
      id: this.id, jenis: this.getJenis(), platNomor: this.platNomor,
      namaKendaraan: this.namaKendaraan, kapasitas: this.kapasitas,
      tersedia: this.tersedia, estimasiTarif5km: this.hitungTarif(jarakContoh),
    };
  }
  serialize() {
    return {
      jenis: this.getJenis(), id: this.id, platNomor: this.platNomor,
      namaKendaraan: this.namaKendaraan, kapasitas: this.kapasitas, tersedia: this.tersedia,
    };
  }
}
