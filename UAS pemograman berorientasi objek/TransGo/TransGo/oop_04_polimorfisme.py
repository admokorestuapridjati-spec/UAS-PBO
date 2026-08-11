# =============================================================================
# FILE 4 / 4 — POLIMORFISME (Polymorphism)
# =============================================================================
# Konsep: kode di luar class bisa memanggil method dengan NAMA yang
# sama persis (mis. `hitung_tarif(km)`), tanpa perlu tahu atau peduli
# objeknya itu Motor, Mobil, atau MobilPremium — Python otomatis
# menjalankan versi hitung_tarif() milik class objek tsb (method yang
# di-override di file 3 — Pewarisan). Hasilnya beda-beda tergantung
# objeknya, walau cara memanggilnya seragam.

# Fungsi-fungsi pembungkus (wrapper) di bawah ini bukan cuma teori —
# dipakai betulan oleh transgo_app.py supaya polimorfismenya "kelihatan"
# di satu tempat, bukan tersebar dan implisit di banyak file.
#
# WAJIB di-import SETELAH oop_01_abstraksi.py & oop_03_pewarisan.py
# karena memanggil method yang didefinisikan/di-override di sana.
# =============================================================================

# ---- Polimorfisme lewat Kendaraan (Motor / Mobil / MobilPremium) ----

# Dipanggil dengan cara SAMA untuk kendaraan jenis apa pun, tapi rumus
# tarifnya beda tergantung objeknya (lihat hitung_tarif() di masing-masing
# subclass pada oop_03_pewarisan.py).
def hitung_tarif_polimorfik(kendaraan, jarak_km):
    return kendaraan.hitung_tarif(jarak_km)


# Sama halnya: get_jenis() mengembalikan label berbeda tergantung objeknya.
def label_jenis_polimorfik(kendaraan):
    return kendaraan.get_jenis()


# ---- Polimorfisme lewat Pengguna (Penumpang / Pengemudi) ----

# get_profil() mengembalikan bentuk data yang berbeda: Penumpang punya
# `totalPesanan`, Pengemudi punya `jenisKendaraan` & `totalPerjalanan` —
# tapi dipanggil dari luar dengan cara yang sama persis.
def profil_polimorfik(pengguna):
    return pengguna.get_profil()


# role() mengembalikan "penumpang" atau "pengemudi" tergantung objeknya.
def role_label_polimorfik(pengguna):
    return pengguna.role()
