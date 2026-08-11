/* =========================================================================
   FILE 3 / 4 — PEWARISAN (Inheritance)
   =========================================================================
   Konsep: subclass mewarisi seluruh atribut & method dari parent class
   lewat kata kunci `extends`, supaya kode yang sama (id, saldo, topUp,
   dst) tidak perlu ditulis ulang di setiap class turunan. Subclass lalu
   tinggal menambah atribut baru yang spesifik untuknya, dan MENIMPA
   (override) method yang perlu berperilaku beda — itulah yang jadi bibit
   POLIMORFISME di file 4.

   File ini WAJIB dimuat SETELAH oop-01-abstraksi.js, karena:
     - Penumpang & Pengemudi butuh class Pengguna sudah ada.
     - Motor, Mobil, MobilPremium butuh class Kendaraan sudah ada.
   ========================================================================= */

/* ---------------------------------------------------------------
   Penumpang & Pengemudi — keduanya `extends Pengguna`, mewarisi
   id, saldo, topUp(), kurangiSaldo(), dst tanpa perlu menulis
   ulang. Yang di-override: login(), getProfil(), role() — inilah
   POLIMORFISME-nya (lihat oop-04-polimorfisme.js).
   --------------------------------------------------------------- */
class Penumpang extends Pengguna {
  constructor(nama, email, password) {
    super(nama, email, password); // panggil constructor Pengguna
    this.riwayatPesanan = [];
  }
  login(passwordInput) {
    if (!this.cekPassword(passwordInput)) throw new AutentikasiError("Email atau password penumpang salah.");
    return true;
  }
  getProfil() {
    return { id: this.id, nama: this.nama, email: this.email, saldo: this._saldo, role: this.role(), totalPesanan: this.riwayatPesanan.length };
  }
  role() { return "penumpang"; }
  tambahRiwayat(pesananId) { this.riwayatPesanan.push(pesananId); }
  serialize() { return { ...super.serialize(), riwayatPesanan: this.riwayatPesanan }; }
  static deserialize(data) {
    const u = new Penumpang(data.nama, data.email, data.password);
    u.id = data.id;
    u._saldo = data.saldo;
    u.dibuatPada = new Date(data.dibuatPada);
    u.riwayatPesanan = data.riwayatPesanan || [];
    return u;
  }
}

class Pengemudi extends Pengguna {
  constructor(nama, email, password, jenisKendaraan = "Motor") {
    super(nama, email, password); // panggil constructor Pengguna
    this.jenisKendaraan = jenisKendaraan;
    this.statusTersedia = true;
    this.riwayatPerjalanan = [];
  }
  login(passwordInput) {
    if (!this.cekPassword(passwordInput)) throw new AutentikasiError("Email atau password pengemudi salah.");
    return true;
  }
  getProfil() {
    return { id: this.id, nama: this.nama, email: this.email, saldo: this._saldo, role: this.role(), jenisKendaraan: this.jenisKendaraan, totalPerjalanan: this.riwayatPerjalanan.length };
  }
  role() { return "pengemudi"; }
  tambahRiwayat(pesananId) { this.riwayatPerjalanan.push(pesananId); }
  serialize() {
    return { ...super.serialize(), jenisKendaraan: this.jenisKendaraan, statusTersedia: this.statusTersedia, riwayatPerjalanan: this.riwayatPerjalanan };
  }
  static deserialize(data) {
    const u = new Pengemudi(data.nama, data.email, data.password, data.jenisKendaraan);
    u.id = data.id;
    u._saldo = data.saldo;
    u.dibuatPada = new Date(data.dibuatPada);
    u.statusTersedia = data.statusTersedia;
    u.riwayatPerjalanan = data.riwayatPerjalanan || [];
    return u;
  }
}

function deserializeUser(data) {
  return data.role === "pengemudi" ? Pengemudi.deserialize(data) : Penumpang.deserialize(data);
}

/* ---------------------------------------------------------------
   Motor, Mobil, MobilPremium — ketiganya `extends Kendaraan`,
   mewarisi id, platNomor, kapasitas, setTersedia(), dst. Yang
   di-override cuma hitungTarif() & getJenis(), masing-masing
   dengan rumus/label berbeda — inilah POLIMORFISME-nya (lihat
   oop-04-polimorfisme.js).
   --------------------------------------------------------------- */
class Motor extends Kendaraan {
  hitungTarif(jarakKm) { return 2000 + 800 * jarakKm; }
  getJenis() { return "Motor"; }
}
class Mobil extends Kendaraan {
  hitungTarif(jarakKm) { return 5000 + 1500 * jarakKm; }
  getJenis() { return "Mobil"; }
}
class MobilPremium extends Kendaraan {
  hitungTarif(jarakKm) { return (10000 + 3000 * jarakKm) * 1.15; }
  getJenis() { return "Mobil Premium"; }
}

function deserializeKendaraan(data) {
  let k;
  if (data.jenis === "Motor") k = new Motor(data.platNomor, data.namaKendaraan, data.kapasitas);
  else if (data.jenis === "Mobil") k = new Mobil(data.platNomor, data.namaKendaraan, data.kapasitas);
  else k = new MobilPremium(data.platNomor, data.namaKendaraan, data.kapasitas);
  k.id = data.id;
  k.tersedia = data.tersedia;
  return k;
}
