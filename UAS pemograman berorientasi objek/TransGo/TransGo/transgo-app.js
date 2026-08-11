/* =========================================================================
   TRANSGO — APPLICATION LOGIC
   =========================================================================
   File ini BUKAN berisi konsep OOP baru — dia "memakai" ke-4 class/fungsi
   OOP yang sudah didefinisikan di:
     1. oop-01-abstraksi.js
     2. oop-02-enkapsulasi.js
     3. oop-03-pewarisan.js
     4. oop-04-polimorfisme.js
   untuk menjalankan aplikasinya sendiri: state management (localStorage
   sebagai "database"), render tampilan, dan event handler form.

   Karena itu, file ini WAJIB dimuat PALING TERAKHIR, setelah ke-4 file
   OOP di atas.

   PENTING soal "orderan belum masuk" di sisi driver:
   Aplikasi ini pakai localStorage sebagai "database" bersama antar
   tab/halaman. localStorage hanya sinkron kalau kedua halaman dibuka
   dari ORIGIN YANG SAMA (protokol+domain+port). Kalau file ini dibuka
   dengan cara diklik dua kali (file://...), browser modern menganggap
   tiap file HTML sebagai origin terpisah -> localStorage TIDAK nyambung.
   Solusinya: jalankan lewat local web server lalu akses via
   http://localhost/... (lihat README yang menyertai file ini).

   Variabel PAGE_ROLE ("penumpang" atau "pengemudi") WAJIB didefinisikan
   di halaman HTML SEBELUM file ini di-load.
   ========================================================================= */

if (typeof PAGE_ROLE === "undefined") {
  throw new Error("PAGE_ROLE belum didefinisikan sebelum transgo-app.js dimuat.");
}

// Helper pencarian user berdasarkan id (USERS di-index pakai email,
// jadi butuh pencarian manual di sini) — dipakai untuk refund saldo
// penumpang ketika pesanan dibatalkan.
function findUserById(id) {
  return [...USERS.values()].find(u => u.id === id) || null;
}

/* =========================================================
   "DATABASE" — localStorage, dipakai bersama oleh
   transgo-driver.html dan transgo-penumpang.html SELAMA
   keduanya dibuka dari origin yang sama (lihat catatan di
   atas file ini).
   ========================================================= */
const USERS = new Map();
const KENDARAAN = new Map();
const PESANAN = new Map();
let currentUser = null;

const LS_KEYS = {
  users: "transgo_users",
  kendaraan: "transgo_kendaraan",
  pesanan: "transgo_pesanan",
  // sesi dipisah per-role, supaya penumpang & driver bisa login
  // bersamaan di device/browser yang sama tanpa saling menimpa sesi
  session: "transgo_session_" + PAGE_ROLE,
};

function seedData() {
  const armada = [
    new Motor("L 1234 AB", "Honda Beat", 1),
    new Motor("L 5566 CD", "Yamaha NMax", 1),
    new Mobil("L 7788 EF", "Toyota Avanza", 4),
    new Mobil("L 9900 GH", "Honda Brio", 4),
    new MobilPremium("L 2468 IJ", "Toyota Alphard", 6),
    new MobilPremium("L 1357 KL", "Mercedes E-Class", 4),
  ];
  armada.forEach(k => KENDARAAN.set(k.id, k));
}

function saveState() {
  try {
    localStorage.setItem(LS_KEYS.users, JSON.stringify([...USERS.values()].map(u => u.serialize())));
    localStorage.setItem(LS_KEYS.kendaraan, JSON.stringify([...KENDARAAN.values()].map(k => k.serialize())));
    localStorage.setItem(LS_KEYS.pesanan, JSON.stringify([...PESANAN.values()].map(p => p.serialize())));
    if (currentUser) localStorage.setItem(LS_KEYS.session, currentUser.email);
    else localStorage.removeItem(LS_KEYS.session);
  } catch (e) {
    console.warn("Gagal menyimpan data ke localStorage:", e);
  }
}

function loadState() {
  try {
    const kendaraanRaw = JSON.parse(localStorage.getItem(LS_KEYS.kendaraan) || "null");
    if (kendaraanRaw && kendaraanRaw.length) {
      KENDARAAN.clear();
      kendaraanRaw.forEach(d => { const k = deserializeKendaraan(d); KENDARAAN.set(k.id, k); });
    }
    const usersRaw = JSON.parse(localStorage.getItem(LS_KEYS.users) || "null");
    if (usersRaw) {
      USERS.clear();
      usersRaw.forEach(d => { const u = deserializeUser(d); USERS.set(u.email, u); });
    }
    const pesananRaw = JSON.parse(localStorage.getItem(LS_KEYS.pesanan) || "null");
    if (pesananRaw) {
      PESANAN.clear();
      pesananRaw.forEach(d => { const p = deserializePesanan(d, KENDARAAN); if (p) PESANAN.set(p.id, p); });
    }
    const sessionEmail = localStorage.getItem(LS_KEYS.session);
    currentUser = (sessionEmail && USERS.has(sessionEmail)) ? USERS.get(sessionEmail) : null;
  } catch (e) {
    console.warn("Gagal memuat data dari localStorage, mulai dari awal:", e);
  }
}

function rerenderActiveView() {
  const active = document.querySelector(".view.active");
  if (!active) return;
  const id = active.id.replace("view-", "");
  if (id === "kendaraan") renderKendaraan();
  if (id === "pesan" && document.getElementById("pesan-kendaraan")) renderPesanForm();
  if (id === "dashboard") renderDashboard();
  if (id === "riwayat") renderRiwayat();
}

// Sinkron otomatis lintas-tab / lintas-halaman: kalau tab lain
// (mis. penumpang bikin pesanan baru) mengubah data, tab ini
// (driver) ikut diperbarui otomatis tanpa perlu refresh manual.
// Ini HANYA jalan kalau kedua halaman satu origin (lihat README).
window.addEventListener("storage", (e) => {
  if (![LS_KEYS.users, LS_KEYS.kendaraan, LS_KEYS.pesanan].includes(e.key)) return;
  loadState();
  if (currentUser) refreshNavAuthState();
  rerenderActiveView();
});

/* =========================================================
   VIEW / NAVIGATION (SPA sederhana tanpa server)
   ========================================================= */
function nav(view) {
  const targetEl = document.getElementById("view-" + view);
  if (!targetEl) return; // view tidak ada di halaman ini (mis. "pesan" di driver.html)

  const needsAuth = ["kendaraan", "pesan", "dashboard", "riwayat"];
  if (needsAuth.includes(view) && !currentUser) {
    toast("error", "Silakan masuk terlebih dahulu.");
    view = "login";
  }
  document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
  document.getElementById("view-" + view).classList.add("active");
  document.querySelectorAll(".stop").forEach(s => s.classList.toggle("active", s.dataset.view === view));

  if (view === "kendaraan") renderKendaraan();
  if (view === "pesan") { jarakState = null; document.getElementById("jarak-result").innerHTML = ""; document.getElementById("jarak-manual-group").classList.add("hidden"); renderPesanForm(); }
  if (view === "dashboard") renderDashboard();
  if (view === "riwayat") renderRiwayat();
  window.scrollTo({top:0, behavior:"smooth"});
}

function toast(type, message) {
  const stack = document.getElementById("toast-stack");
  const el = document.createElement("div");
  el.className = "toast " + type;
  el.textContent = message;
  stack.appendChild(el);
  setTimeout(() => el.remove(), 4200);
}

function fmtRp(n) { return "Rp" + Math.round(n).toLocaleString('id-ID'); }

/* =========================================================
   AUTH HANDLERS (role halaman ditentukan oleh PAGE_ROLE,
   jadi akun penumpang tidak bisa login di driver.html
   dan sebaliknya)
   ========================================================= */
function handleRegister(e) {
  e.preventDefault();
  const nama = document.getElementById("reg-nama").value.trim();
  const email = document.getElementById("reg-email").value.trim().toLowerCase();
  const password = document.getElementById("reg-password").value;

  if (USERS.has(email)) { toast("error", "Email sudah terdaftar. Silakan masuk."); return; }

  let user;
  if (PAGE_ROLE === "pengemudi") {
    const jenisEl = document.getElementById("reg-jenis");
    const jenis = jenisEl ? jenisEl.value : "Motor";
    user = new Pengemudi(nama, email, password, jenis);
  } else {
    user = new Penumpang(nama, email, password);
  }
  user.topUp(50000); // saldo awal demo
  USERS.set(email, user);
  currentUser = user;
  saveState();

  toast("success", `Registrasi berhasil! Selamat datang, ${nama}.`);
  e.target.reset();
  refreshNavAuthState();
  nav("dashboard");
}

function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById("login-email").value.trim().toLowerCase();
  const password = document.getElementById("login-password").value;
  const user = USERS.get(email);
  try {
    if (!user) throw new AutentikasiError("Email tidak ditemukan. Silakan daftar terlebih dahulu.");
    if (roleLabelPolimorfik(user) !== PAGE_ROLE) {
      throw new AutentikasiError(
        PAGE_ROLE === "pengemudi"
          ? "Akun ini terdaftar sebagai Penumpang. Silakan masuk lewat halaman Penumpang."
          : "Akun ini terdaftar sebagai Pengemudi. Silakan masuk lewat halaman Driver."
      );
    }
    user.login(password);
    currentUser = user;
    saveState();
    toast("success", `Selamat datang kembali, ${user.nama}!`);
    e.target.reset();
    refreshNavAuthState();
    nav("dashboard");
  } catch (err) {
    if (err instanceof AutentikasiError) toast("error", err.message);
    else { toast("error", "Terjadi kesalahan saat masuk."); console.error(err); }
  }
}

function handleLogout() {
  currentUser = null;
  saveState();
  refreshNavAuthState();
  toast("success", "Anda telah keluar.");
  nav("home");
}

function refreshNavAuthState() {
  const footer = document.getElementById("nav-footer");
  const badge = document.getElementById("mode-badge");

  if (currentUser) {
    badge.innerHTML = PAGE_ROLE === "pengemudi"
      ? `<span class="mode-pill mode-driver">🟢 MODE DRIVER</span>`
      : `<span class="mode-pill mode-pelanggan">🔵 MODE PELANGGAN</span>`;

    const initial = currentUser.nama.trim()[0]?.toUpperCase() || "?";
    footer.innerHTML = `
      <div class="user-chip">
        <div class="user-avatar">${initial}</div>
        <div class="info">
          <div style="font-weight:600;font-size:.88rem;">${currentUser.nama}</div>
          <div class="role">${roleLabelPolimorfik(currentUser)}</div>
        </div>
      </div>
      <button class="btn-logout" onclick="handleLogout()">Keluar</button>`;
    document.getElementById("hero-cta-primary").textContent = "Buka Dashboard";
    document.getElementById("hero-cta-primary").onclick = () => nav("dashboard");
    document.getElementById("hero-cta-secondary").classList.add("hidden");
  } else {
    badge.innerHTML = "";
    footer.innerHTML = `
      <button class="btn btn-outline btn-block btn-sm" onclick="nav('login')" style="margin-bottom:8px;">Masuk</button>
      <button class="btn btn-primary btn-block btn-sm" onclick="nav('register')">Daftar</button>`;
    document.getElementById("hero-cta-primary").textContent = "Daftar Gratis";
    document.getElementById("hero-cta-primary").onclick = () => nav("register");
    document.getElementById("hero-cta-secondary").classList.remove("hidden");
  }
}

/* =========================================================
   ARMADA (Kendaraan)
   ========================================================= */
function renderKendaraan() {
  const grid = document.getElementById("vehicle-grid");
  const icons = { "Motor": "🏍️", "Mobil": "🚗", "Mobil Premium": "🚙" };
  grid.innerHTML = [...KENDARAAN.values()].map(k => {
    const d = k.toDict();
    return `
    <div class="vcard ${d.tersedia ? "" : "off"}">
      <div class="icon">${icons[d.jenis] || "🚘"}</div>
      <h3>${d.namaKendaraan}</h3>
      <span class="tag">${d.jenis}</span>
      <ul>
        <li>Plat <b>${d.platNomor}</b></li>
        <li>Kapasitas <b>${d.kapasitas} orang</b></li>
        <li>Tarif mulai <b>${fmtRp(d.estimasiTarif5km)}</b></li>
        <li>Status <b class="${d.tersedia ? "ok-pill" : "bad-pill"}">${d.tersedia ? "Tersedia" : "Tidak Tersedia"}</b></li>
      </ul>
    </div>`;
  }).join("");
}

/* =========================================================
   PESAN (Booking) — hanya ada di halaman Penumpang.
   Jarak dihitung otomatis dari alamat pakai layanan peta
   gratis: Nominatim (geocoding) + OSRM (routing)
   ========================================================= */
let jarakState = null;

async function geocodeAddress(query) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`;
  const res = await fetch(url, { headers: { "Accept": "application/json" } });
  if (!res.ok) throw new Error("Gagal menghubungi layanan peta. Coba lagi.");
  const data = await res.json();
  if (!data.length) throw new Error(`Alamat "${query}" tidak ditemukan di peta. Coba tambahkan nama kota/kecamatan.`);
  return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon), label: data[0].display_name };
}

async function computeRouteKm(a, b) {
  const url = `https://router.project-osrm.org/route/v1/driving/${a.lon},${a.lat};${b.lon},${b.lat}?overview=false`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Gagal menghitung rute antar lokasi.");
  const data = await res.json();
  if (data.code !== "Ok" || !data.routes || !data.routes.length) throw new Error("Rute antar dua lokasi tidak ditemukan.");
  return data.routes[0].distance / 1000;
}

async function hitungJarakOtomatis() {
  const jemputText = document.getElementById("pesan-jemput").value.trim();
  const tujuanText = document.getElementById("pesan-tujuan").value.trim();
  if (!jemputText || !tujuanText) { toast("error", "Isi lokasi jemput dan tujuan dulu."); return; }

  const btn = document.getElementById("btn-hitung-jarak");
  const resultBox = document.getElementById("jarak-result");
  jarakState = null;
  btn.disabled = true; btn.textContent = "Menghitung jarak...";
  resultBox.innerHTML = "";
  document.getElementById("jarak-manual-group").classList.add("hidden");
  renderPesanForm();

  try {
    const [a, b] = await Promise.all([geocodeAddress(jemputText), geocodeAddress(tujuanText)]);
    const km = await computeRouteKm(a, b);
    jarakState = { km: Math.round(km * 10) / 10 };
    resultBox.innerHTML = `<span class="ok-pill">✅ Jarak terhitung: ${jarakState.km} km</span>`;
    toast("success", `Jarak berhasil dihitung: ${jarakState.km} km`);
  } catch (err) {
    resultBox.innerHTML = `<span class="bad-pill">⚠️ ${err.message}</span>`;
    document.getElementById("jarak-manual-group").classList.remove("hidden");
    toast("error", err.message);
  } finally {
    btn.disabled = false; btn.textContent = "📍 Hitung Jarak Otomatis";
    renderPesanForm();
  }
}

function pakaiJarakManual() {
  const val = parseFloat(document.getElementById("pesan-jarak-manual").value);
  if (!(val > 0)) { toast("error", "Masukkan jarak yang valid (lebih dari 0)."); return; }
  jarakState = { km: val, manual: true };
  document.getElementById("jarak-result").innerHTML = `<span class="ok-pill">✅ Jarak (manual): ${val} km</span>`;
  toast("success", `Jarak manual dipakai: ${val} km`);
  renderPesanForm();
}

function renderPesanForm() {
  const select = document.getElementById("pesan-kendaraan");
  const miniList = document.getElementById("pesan-mini-list");
  if (!select || !miniList) return;
  const tersedia = [...KENDARAAN.values()].filter(k => k.tersedia);

  if (!jarakState) {
    select.disabled = true;
    select.innerHTML = `<option value="" disabled selected>-- Hitung jarak dulu --</option>`;
  } else {
    select.disabled = false;
    select.innerHTML = `<option value="" disabled selected>-- Pilih kendaraan --</option>` +
      tersedia.map(k => {
        const tarif = hitungTarifPolimorfik(k, jarakState.km);
        return `<option value="${k.id}">${labelJenisPolimorfik(k)} — ${k.namaKendaraan} (${k.platNomor}) — ${fmtRp(tarif)}</option>`;
      }).join("");
  }

  miniList.innerHTML = tersedia.length
    ? tersedia.map(k => {
        const tarifTxt = jarakState ? fmtRp(hitungTarifPolimorfik(k, jarakState.km)) : "menunggu jarak";
        return `<div class="mini-vehicle"><span>${labelJenisPolimorfik(k)} · ${k.namaKendaraan}</span><span>${tarifTxt}</span></div>`;
      }).join("")
    : `<p style="color:var(--muted);font-size:.88rem;">Tidak ada kendaraan tersedia saat ini.</p>`;
}

function handlePesan(e) {
  e.preventDefault();
  if (!currentUser || roleLabelPolimorfik(currentUser) !== "penumpang") { toast("error", "Hanya penumpang yang dapat memesan."); return; }
  if (!jarakState) { toast("error", "Hitung jarak terlebih dahulu sebelum memesan."); return; }

  const kendaraanId = document.getElementById("pesan-kendaraan").value;
  const jemput = document.getElementById("pesan-jemput").value.trim();
  const tujuan = document.getElementById("pesan-tujuan").value.trim();

  if (!kendaraanId || !jemput || !tujuan) { toast("error", "Lengkapi semua data pemesanan dengan benar."); return; }

  const kendaraan = KENDARAAN.get(kendaraanId);
  try {
    if (!kendaraan || !kendaraan.tersedia) throw new KendaraanTidakTersediaError();

    const pesananBaru = new Pesanan(currentUser.id, kendaraan, jemput, tujuan, jarakState.km);
    currentUser.kurangiSaldo(pesananBaru.tarif);

    kendaraan.setTersedia(false);
    PESANAN.set(pesananBaru.id, pesananBaru);
    currentUser.tambahRiwayat(pesananBaru.id);
    saveState();

    toast("success", `Pesanan berhasil dibuat! Jarak ${jarakState.km} km, tarif ${fmtRp(pesananBaru.tarif)} (${labelJenisPolimorfik(kendaraan)}).`);
    e.target.reset();
    jarakState = null;
    document.getElementById("jarak-result").innerHTML = "";
    document.getElementById("jarak-manual-group").classList.add("hidden");
    nav("dashboard");
  } catch (err) {
    if (err instanceof KendaraanTidakTersediaError || err instanceof SaldoTidakCukupError) {
      toast("error", err.message);
    } else { toast("error", "Terjadi kesalahan saat memesan."); console.error(err); }
  }
}

/* =========================================================
   DASHBOARD (isi berbeda otomatis sesuai PAGE_ROLE)
   ========================================================= */
const STATUS_LABEL = {
  menunggu_konfirmasi: ["Menunggu Konfirmasi", "pill-menunggu"],
  diproses: ["Diproses", "pill-diproses"],
  dalam_perjalanan: ["Dalam Perjalanan", "pill-perjalanan"],
  selesai: ["Selesai", "pill-selesai"],
  dibatalkan: ["Dibatalkan", "pill-dibatalkan"],
};

function renderDashboard() {
  if (!currentUser) return;
  const profil = profilPolimorfik(currentUser);

  document.getElementById("profile-bar").innerHTML = `
    <div>
      <h3>${profil.nama}</h3>
      <p class="muted">${profil.email} &middot; ${profil.role.charAt(0).toUpperCase() + profil.role.slice(1)}</p>
    </div>
    <div class="saldo-box">
      <div class="muted">Saldo</div>
      <div class="amt">${fmtRp(profil.saldo)}</div>
      <form class="topup-row" onsubmit="handleTopup(event)">
        <input type="number" id="topup-jumlah" min="1000" step="1000" placeholder="Jumlah" required>
        <button type="submit" class="btn btn-transit btn-sm">Top Up</button>
      </form>
    </div>`;

  const isPenumpang = PAGE_ROLE === "penumpang";
  document.getElementById("dashboard-list-title").textContent = isPenumpang ? "Pesanan Saya" : "Pesanan Masuk — Perlu Ditangani";

  let list;
  if (isPenumpang) {
    list = currentUser.riwayatPesanan.map(id => PESANAN.get(id)).filter(Boolean);
  } else {
    list = [...PESANAN.values()].filter(p => ["menunggu_konfirmasi", "diproses", "dalam_perjalanan"].includes(p.getStatus()));
  }

  const content = document.getElementById("dashboard-content");
  if (!list.length) {
    content.innerHTML = isPenumpang
      ? `<p class="empty">Belum ada pesanan.</p>`
      : `<p class="empty">Belum ada pesanan masuk.</p>`;
    return;
  }

  content.innerHTML = `
  <div class="table-wrap"><table>
    <thead><tr><th>ID</th><th>Kendaraan</th><th>Rute</th><th>Jarak</th><th>Tarif</th><th>Status</th>${!isPenumpang ? "<th>Aksi</th>" : ""}</tr></thead>
    <tbody>
      ${list.map(p => {
        const d = p.toDict();
        const [label, cls] = STATUS_LABEL[d.status];
        return `<tr>
          <td class="mono">#${d.id}</td>
          <td>${d.kendaraan} (${d.platNomor})</td>
          <td>${d.lokasiJemput} → ${d.lokasiTujuan}</td>
          <td>${d.jarakKm} km</td>
          <td class="mono">${fmtRp(d.tarif)}</td>
          <td><span class="pill ${cls}">${label}</span></td>
          ${!isPenumpang ? `<td>
            <form class="topup-row" style="margin:0;" onsubmit="handleUpdateStatus(event,'${d.id}')">
              <select class="status-select" name="status_baru">
                ${Pesanan.STATUS_VALID.map(s => `<option value="${s}" ${s === d.status ? "selected" : ""}>${STATUS_LABEL[s][0]}</option>`).join("")}
              </select>
              <button type="submit" class="btn btn-outline btn-sm">Update</button>
            </form>
          </td>` : ""}
        </tr>`;
      }).join("")}
    </tbody>
  </table></div>`;
}

function handleTopup(e) {
  e.preventDefault();
  const jumlah = parseFloat(document.getElementById("topup-jumlah").value);
  try {
    currentUser.topUp(jumlah);
    saveState();
    toast("success", `Top up berhasil! Saldo sekarang: ${fmtRp(currentUser.getSaldo())}`);
    renderDashboard();
  } catch (err) { toast("error", err.message); }
}

function handleUpdateStatus(e, pesananId) {
  e.preventDefault();
  const statusBaru = e.target.status_baru.value;
  const p = PESANAN.get(pesananId);
  if (!p) { toast("error", "Pesanan tidak ditemukan."); return; }
  try {
    const statusSebelumnya = p.getStatus();

    // BUG FIX: pengemudi yang menangani pesanan tidak pernah tercatat,
    // jadi halaman "Riwayat Perjalanan" pengemudi selalu kosong.
    // Sekarang begitu pengemudi pertama kali menyentuh pesanan ini,
    // dia "ditugaskan" ke pesanan tsb dan dicatat ke riwayatnya.
    if (currentUser && roleLabelPolimorfik(currentUser) === "pengemudi") {
      if (!p.driverId) p.driverId = currentUser.id;
      if (p.driverId === currentUser.id) currentUser.tambahRiwayat(p.id);
    }

    p.setStatus(statusBaru);

    if (["selesai", "dibatalkan"].includes(statusBaru)) p.kendaraan.setTersedia(true);

    // BUG FIX: membatalkan pesanan tidak pernah mengembalikan saldo
    // penumpang yang sudah terlanjur terpotong saat memesan.
    if (statusBaru === "dibatalkan" && statusSebelumnya !== "dibatalkan") {
      const penumpang = findUserById(p.penumpangId);
      if (penumpang) penumpang.topUp(p.tarif);
    }

    // BUG FIX: saldo pengemudi yang menangani pesanan ini tidak pernah
    // bertambah walau pesanan sudah "selesai" -> pendapatan driver
    // tidak pernah masuk ke dashboard-nya. Sekarang begitu status
    // berubah jadi "selesai", tarif pesanan otomatis ditambahkan ke
    // saldo driver yang menangani (p.driverId).
    if (statusBaru === "selesai" && statusSebelumnya !== "selesai") {
      const pengemudi = findUserById(p.driverId);
      if (pengemudi) pengemudi.topUp(p.tarif);
    }

    saveState();
    toast("success", `Status pesanan #${pesananId} diperbarui menjadi '${STATUS_LABEL[statusBaru][0]}'.`);
    renderDashboard();
  } catch (err) { toast("error", err.message); }
}

// Refresh manual — jaring pengaman kalau event "storage" browser
// telat / tidak terpicu (mis. tab sempat idle lama).
function refreshDashboardManual() {
  loadState();
  renderDashboard();
  toast("success", "Data diperbarui.");
}

/* =========================================================
   RIWAYAT
   ========================================================= */
function renderRiwayat() {
  if (!currentUser) return;
  const isPenumpang = PAGE_ROLE === "penumpang";
  const ids = isPenumpang ? currentUser.riwayatPesanan : currentUser.riwayatPerjalanan;
  const list = ids.map(id => PESANAN.get(id)).filter(Boolean);
  const content = document.getElementById("riwayat-content");

  if (!list.length) { content.innerHTML = `<p class="empty">Belum ada riwayat transaksi.</p>`; return; }

  const total = isPenumpang ? list.reduce((sum, p) => sum + p.tarif, 0) : 0;

  content.innerHTML = `
  <div class="table-wrap"><table>
    <thead><tr><th>ID</th><th>Tanggal</th><th>Kendaraan</th><th>Rute</th><th>Jarak</th><th>Tarif</th><th>Status</th></tr></thead>
    <tbody>
      ${list.map(p => {
        const d = p.toDict();
        const [label, cls] = STATUS_LABEL[d.status];
        return `<tr>
          <td class="mono">#${d.id}</td>
          <td>${d.waktuDibuat}</td>
          <td>${d.kendaraan} (${d.platNomor})</td>
          <td>${d.lokasiJemput} → ${d.lokasiTujuan}</td>
          <td>${d.jarakKm} km</td>
          <td class="mono">${fmtRp(d.tarif)}</td>
          <td><span class="pill ${cls}">${label}</span></td>
        </tr>`;
      }).join("")}
    </tbody>
  </table></div>
  ${isPenumpang ? `<div class="total-line">Total Pengeluaran: <b>${fmtRp(total)}</b></div>` : ""}`;
}

/* =========================================================
   INIT — dipanggil dari masing-masing HTML setelah DOM siap
   ========================================================= */
function initTransGo() {
  loadState();
  if (KENDARAAN.size === 0) { seedData(); saveState(); }
  refreshNavAuthState();
  if (currentUser) { nav("dashboard"); } else { nav("home"); }
}
