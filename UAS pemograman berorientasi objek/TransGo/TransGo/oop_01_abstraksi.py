# =============================================================================
# FILE 1 / 4 — ABSTRAKSI (Abstraction)
# =============================================================================
# Konsep: kelas "abstrak" tidak boleh langsung dibuat objeknya — dia cuma
# cetakan/kontrak untuk subclass-nya. Pengguna aplikasi cukup tahu APA
# yang bisa dilakukan (topUp(), hitungTarif(), dst) tanpa perlu tahu
# detail rumus/implementasinya, karena detail itu "disembunyikan" dan
# baru diisi di kelas turunannya (lihat file 3 — Pewarisan).
#
# Cara pencegahannya di Python: mengecek `type(self) is Pengguna` di
# dalam __init__ (setara dengan `new.target === NamaClass` di JavaScript).
# Kalau seseorang mencoba `Pengguna(...)` langsung, otomatis error.
# Method seperti login(), get_profil(), hitung_tarif(), get_jenis()
# sengaja HANYA berisi `raise Exception(...)` di sini — ini adalah
# "kontrak" yang WAJIB diisi ulang (override) oleh subclass, sesuai
# prinsip abstraksi.
#
# File ini dimuat/di-import PALING AWAL karena file 3 (Pewarisan) butuh
# class Pengguna & Kendaraan di sini sebagai induknya, dan class-class
# di sini butuh 3 custom exception di bawah.
# =============================================================================

import uuid
from datetime import datetime


# ---------- CUSTOM EXCEPTIONS (error khusus, bukan bawaan Python) ----------
class KendaraanTidakTersediaError(Exception):
    def __init__(self, pesan="Kendaraan yang dipilih sedang tidak tersedia."):
        super().__init__(pesan)


class SaldoTidakCukupError(Exception):
    def __init__(self, pesan="Saldo Anda tidak mencukupi untuk menyelesaikan transaksi ini."):
        super().__init__(pesan)


class AutentikasiError(Exception):
    def __init__(self, pesan="Autentikasi gagal."):
        super().__init__(pesan)


# -----------------------------------------------------------------------
# ABSTRAKSI: Pengguna (kelas dasar/abstrak untuk Penumpang & Pengemudi)
#
# - `type(self) is Pengguna` mencegah class ini dibuat objeknya
#   secara langsung.
# - login(), get_profil(), role() sengaja cuma raise Exception di sini —
#   WAJIB diisi ulang oleh subclass (lihat oop_03_pewarisan.py).
# - Catatan: atribut __password di bawah juga contoh ENKAPSULASI
#   (private attribute via name-mangling Python), tapi karena dia
#   menyatu dengan class abstrak ini, penjelasan lengkapnya ada di
#   oop_02_enkapsulasi.py.
# -----------------------------------------------------------------------
class Pengguna:
    def __init__(self, nama, email, password):
        if type(self) is Pengguna:
            raise Exception("Pengguna adalah kelas abstrak dan tidak bisa diinstansiasi langsung.")
        self.id = uuid.uuid4().hex[:8]
        self.nama = nama
        self.email = email
        self.__password = password  # private (name-mangled) — enkapsulasi
        self._saldo = 0
        self.dibuat_pada = datetime.now()

    def cek_password(self, input_pw):
        return self.__password == input_pw

    def set_password(self, baru):
        if len(baru) < 4:
            raise Exception("Password minimal 4 karakter.")
        self.__password = baru

    def get_saldo(self):
        return self._saldo

    def top_up(self, jumlah):
        if jumlah <= 0:
            raise Exception("Jumlah top up harus lebih dari 0.")
        self._saldo += jumlah
        return self._saldo

    def kurangi_saldo(self, jumlah):
        if jumlah > self._saldo:
            raise SaldoTidakCukupError(
                f"Saldo Anda (Rp{self._saldo:,.0f}) tidak cukup untuk membayar "
                f"Rp{jumlah:,.0f}.".replace(",", ".")
            )
        self._saldo -= jumlah
        return self._saldo

    # ---- kontrak abstrak: WAJIB di-override oleh subclass ----
    def login(self, password_input):
        raise Exception("login() wajib diimplementasikan oleh subclass.")

    def get_profil(self):
        raise Exception("get_profil() wajib diimplementasikan oleh subclass.")

    def role(self):
        raise Exception("role() wajib diimplementasikan oleh subclass.")

    def _raw_password(self):
        return self.__password

    def serialize(self):
        return {
            "role": self.role(),
            "id": self.id,
            "nama": self.nama,
            "email": self.email,
            "password": self._raw_password(),
            "saldo": self._saldo,
            "dibuatPada": self.dibuat_pada.isoformat(),
        }


# -----------------------------------------------------------------------
# ABSTRAKSI: Kendaraan (kelas dasar/abstrak untuk Motor, Mobil,
# MobilPremium)
#
# - Tidak boleh dibuat objeknya langsung (sama seperti Pengguna).
# - hitung_tarif() & get_jenis() cuma "kontrak" kosong di sini —
#   rumus tarif sesungguhnya baru diisi di subclass-nya (lihat
#   oop_03_pewarisan.py), dan pemanggilannya seragam di seluruh
#   app lewat helper di oop_04_polimorfisme.py.
# -----------------------------------------------------------------------
class Kendaraan:
    def __init__(self, plat_nomor, nama_kendaraan, kapasitas):
        if type(self) is Kendaraan:
            raise Exception("Kendaraan adalah kelas abstrak dan tidak bisa diinstansiasi langsung.")
        self.id = uuid.uuid4().hex[:8]
        self.plat_nomor = plat_nomor
        self.nama_kendaraan = nama_kendaraan
        self.kapasitas = kapasitas
        self.tersedia = True

    # ---- kontrak abstrak: WAJIB di-override oleh subclass ----
    def hitung_tarif(self, jarak_km):
        raise Exception("hitung_tarif() wajib diimplementasikan oleh subclass.")

    def get_jenis(self):
        raise Exception("get_jenis() wajib diimplementasikan oleh subclass.")

    def set_tersedia(self, status):
        self.tersedia = status

    def to_dict(self, jarak_contoh=5):
        return {
            "id": self.id,
            "jenis": self.get_jenis(),
            "platNomor": self.plat_nomor,
            "namaKendaraan": self.nama_kendaraan,
            "kapasitas": self.kapasitas,
            "tersedia": self.tersedia,
            "estimasiTarif5km": self.hitung_tarif(jarak_contoh),
        }

    def serialize(self):
        return {
            "jenis": self.get_jenis(),
            "id": self.id,
            "platNomor": self.plat_nomor,
            "namaKendaraan": self.nama_kendaraan,
            "kapasitas": self.kapasitas,
            "tersedia": self.tersedia,
        }
