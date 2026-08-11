# =============================================================================
# FILE 3 / 4 — PEWARISAN (Inheritance)
# =============================================================================
# Konsep: subclass mewarisi seluruh atribut & method dari parent class
# lewat tanda kurung `class Anak(Induk):`, supaya kode yang sama (id,
# saldo, top_up, dst) tidak perlu ditulis ulang di setiap class
# turunan. Subclass lalu tinggal menambah atribut baru yang spesifik
# untuknya, dan MENIMPA (override) method yang perlu berperilaku beda
# — itulah yang jadi bibit POLIMORFISME di file 4.
#
# File ini WAJIB di-import SETELAH oop_01_abstraksi.py, karena:
#   - Penumpang & Pengemudi butuh class Pengguna sudah ada.
#   - Motor, Mobil, MobilPremium butuh class Kendaraan sudah ada.
# =============================================================================

from datetime import datetime

from oop_01_abstraksi import Pengguna, Kendaraan, AutentikasiError


# -----------------------------------------------------------------------
# Penumpang & Pengemudi — keduanya turunan dari Pengguna, mewarisi
# id, saldo, top_up(), kurangi_saldo(), dst tanpa perlu menulis ulang.
# Yang di-override: login(), get_profil(), role() — inilah
# POLIMORFISME-nya (lihat oop_04_polimorfisme.py).
# -----------------------------------------------------------------------
class Penumpang(Pengguna):
    def __init__(self, nama, email, password):
        super().__init__(nama, email, password)  # panggil constructor Pengguna
        self.riwayat_pesanan = []

    def login(self, password_input):
        if not self.cek_password(password_input):
            raise AutentikasiError("Email atau password penumpang salah.")
        return True

    def get_profil(self):
        return {
            "id": self.id, "nama": self.nama, "email": self.email, "saldo": self._saldo,
            "role": self.role(), "totalPesanan": len(self.riwayat_pesanan),
        }

    def role(self):
        return "penumpang"

    def tambah_riwayat(self, pesanan_id):
        self.riwayat_pesanan.append(pesanan_id)

    def serialize(self):
        data = super().serialize()
        data["riwayatPesanan"] = self.riwayat_pesanan
        return data

    @staticmethod
    def deserialize(data):
        u = Penumpang(data["nama"], data["email"], data["password"])
        u.id = data["id"]
        u._saldo = data["saldo"]
        u.dibuat_pada = datetime.fromisoformat(data["dibuatPada"])
        u.riwayat_pesanan = data.get("riwayatPesanan", [])
        return u


class Pengemudi(Pengguna):
    def __init__(self, nama, email, password, jenis_kendaraan="Motor"):
        super().__init__(nama, email, password)  # panggil constructor Pengguna
        self.jenis_kendaraan = jenis_kendaraan
        self.status_tersedia = True
        self.riwayat_perjalanan = []

    def login(self, password_input):
        if not self.cek_password(password_input):
            raise AutentikasiError("Email atau password pengemudi salah.")
        return True

    def get_profil(self):
        return {
            "id": self.id, "nama": self.nama, "email": self.email, "saldo": self._saldo,
            "role": self.role(), "jenisKendaraan": self.jenis_kendaraan,
            "totalPerjalanan": len(self.riwayat_perjalanan),
        }

    def role(self):
        return "pengemudi"

    def tambah_riwayat(self, pesanan_id):
        self.riwayat_perjalanan.append(pesanan_id)

    def serialize(self):
        data = super().serialize()
        data.update({
            "jenisKendaraan": self.jenis_kendaraan,
            "statusTersedia": self.status_tersedia,
            "riwayatPerjalanan": self.riwayat_perjalanan,
        })
        return data

    @staticmethod
    def deserialize(data):
        u = Pengemudi(data["nama"], data["email"], data["password"], data.get("jenisKendaraan", "Motor"))
        u.id = data["id"]
        u._saldo = data["saldo"]
        u.dibuat_pada = datetime.fromisoformat(data["dibuatPada"])
        u.status_tersedia = data.get("statusTersedia", True)
        u.riwayat_perjalanan = data.get("riwayatPerjalanan", [])
        return u


def deserialize_user(data):
    return Pengemudi.deserialize(data) if data.get("role") == "pengemudi" else Penumpang.deserialize(data)


# -----------------------------------------------------------------------
# Motor, Mobil, MobilPremium — ketiganya turunan dari Kendaraan,
# mewarisi id, plat_nomor, kapasitas, set_tersedia(), dst. Yang
# di-override cuma hitung_tarif() & get_jenis(), masing-masing dengan
# rumus/label berbeda — inilah POLIMORFISME-nya (lihat
# oop_04_polimorfisme.py).
# -----------------------------------------------------------------------
class Motor(Kendaraan):
    def hitung_tarif(self, jarak_km):
        return 2000 + 800 * jarak_km

    def get_jenis(self):
        return "Motor"


class Mobil(Kendaraan):
    def hitung_tarif(self, jarak_km):
        return 5000 + 1500 * jarak_km

    def get_jenis(self):
        return "Mobil"


class MobilPremium(Kendaraan):
    def hitung_tarif(self, jarak_km):
        return (10000 + 3000 * jarak_km) * 1.15

    def get_jenis(self):
        return "Mobil Premium"


def deserialize_kendaraan(data):
    jenis = data["jenis"]
    if jenis == "Motor":
        k = Motor(data["platNomor"], data["namaKendaraan"], data["kapasitas"])
    elif jenis == "Mobil":
        k = Mobil(data["platNomor"], data["namaKendaraan"], data["kapasitas"])
    else:
        k = MobilPremium(data["platNomor"], data["namaKendaraan"], data["kapasitas"])
    k.id = data["id"]
    k.tersedia = data["tersedia"]
    return k
