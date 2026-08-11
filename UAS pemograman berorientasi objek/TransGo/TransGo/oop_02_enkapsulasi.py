# =============================================================================
# FILE 2 / 4 — ENKAPSULASI (Encapsulation)
# =============================================================================
# Konsep: data yang "sensitif" atau yang tidak boleh diubah sembarangan
# dari luar disembunyikan sebagai private attribute (ditandai `__` di
# depan nama atribut -> Python otomatis melakukan "name mangling"), dan
# HANYA bisa dibaca/diubah lewat method publik yang sudah divalidasi.
# Ini mencegah bug seperti status pesanan diisi nilai acak/typo dari
# kode lain di luar class ini.
#
# Contoh lain enkapsulasi di project ini ada di class Pengguna
# (oop_01_abstraksi.py) lewat private attribute __password — hanya bisa
# dicek lewat cek_password(), tidak bisa dibaca langsung dari luar.
#
# Class Pesanan di bawah ini TIDAK mewarisi apa pun (tidak `extends` /
# subclassing), jadi dia berdiri sendiri dan tidak butuh file 1 atau
# file 3 di-import duluan — cukup dipanggil setelah class Kendaraan ada
# (untuk method hitung_tarif() saat pesanan dibuat).
# =============================================================================

import uuid
from datetime import datetime


# -----------------------------------------------------------------------
# Pesanan — status pesanan disembunyikan lewat private attribute
# __status, dan HANYA bisa diubah lewat set_status() yang memvalidasi
# dulu apakah nilai barunya termasuk status yang sah (lihat
# STATUS_VALID). Dari luar class ini, tidak ada cara untuk mengubah
# __status secara langsung (Python akan mengubahnya jadi nama lain
# lewat name-mangling kalau dicoba dari luar).
#
# `driver_id` menyimpan pengemudi mana yang MENANGANI pesanan ini
# (diisi otomatis begitu ada pengemudi pertama kali mengubah
# statusnya) — dipakai untuk mencatat riwayat perjalanan pengemudi
# yang bersangkutan. Lihat handle_update_status() di transgo_app.py.
# -----------------------------------------------------------------------
class Pesanan:
    STATUS_VALID = ["menunggu_konfirmasi", "diproses", "dalam_perjalanan", "selesai", "dibatalkan"]

    def __init__(self, penumpang_id, kendaraan, lokasi_jemput, lokasi_tujuan, jarak_km):
        self.id = uuid.uuid4().hex[:8]
        self.penumpang_id = penumpang_id
        self.driver_id = None  # BUG FIX: dulu tidak pernah diisi -> riwayat pengemudi selalu kosong
        self.kendaraan = kendaraan
        self.lokasi_jemput = lokasi_jemput
        self.lokasi_tujuan = lokasi_tujuan
        self.jarak_km = jarak_km
        self.tarif = kendaraan.hitung_tarif(jarak_km)  # polimorfik: rumus beda tiap jenis kendaraan
        self.__status = "menunggu_konfirmasi"
        self.waktu_dibuat = datetime.now()

    # ---- akses terkontrol ke __status (inti enkapsulasi di class ini) ----
    def get_status(self):
        return self.__status

    def set_status(self, baru):
        if baru not in Pesanan.STATUS_VALID:
            raise Exception(f"Status '{baru}' tidak valid.")
        self.__status = baru

    def to_dict(self):
        return {
            "id": self.id,
            "penumpangId": self.penumpang_id,
            "driverId": self.driver_id,
            "kendaraan": self.kendaraan.get_jenis(),
            "platNomor": self.kendaraan.plat_nomor,
            "lokasiJemput": self.lokasi_jemput,
            "lokasiTujuan": self.lokasi_tujuan,
            "jarakKm": self.jarak_km,
            "tarif": self.tarif,
            "status": self.__status,
            "waktuDibuat": self.waktu_dibuat.strftime("%d/%m/%Y %H:%M"),
        }

    def serialize(self):
        return {
            "id": self.id,
            "penumpangId": self.penumpang_id,
            "driverId": self.driver_id,
            "kendaraanId": self.kendaraan.id,
            "lokasiJemput": self.lokasi_jemput,
            "lokasiTujuan": self.lokasi_tujuan,
            "jarakKm": self.jarak_km,
            "tarif": self.tarif,
            "status": self.__status,
            "waktuDibuat": self.waktu_dibuat.isoformat(),
        }


def deserialize_pesanan(data, kendaraan_map):
    kendaraan = kendaraan_map.get(data["kendaraanId"])
    if not kendaraan:
        return None
    p = Pesanan(data["penumpangId"], kendaraan, data["lokasiJemput"], data["lokasiTujuan"], data["jarakKm"])
    p.id = data["id"]
    p.driver_id = data.get("driverId")
    p.tarif = data["tarif"]
    p.waktu_dibuat = datetime.fromisoformat(data["waktuDibuat"])
    p.set_status(data["status"])  # tetap lewat method publik, bukan akses langsung ke __status
    return p
