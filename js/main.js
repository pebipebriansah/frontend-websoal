let currentScript = null; // Script halaman aktif saat ini

// 🔐 Fungsi untuk memeriksa login
function checkLogin() {
  const idUser = localStorage.getItem('id_user');
  const username = localStorage.getItem('username');

  if (!idUser || !username) {
    window.location.href = '../index.html';
    return false;
  }
  return true;
}

// 📄 Fungsi utama untuk load halaman dinamis
async function loadPage(page) {
  if (!checkLogin()) return;

  const content = document.getElementById('content');
  if (!content) return console.error("❌ Element #content tidak ditemukan di HTML utama!");

  try {
    // --- Load HTML halaman ---
    const res = await fetch(`pages/${page}.html`);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const html = await res.text();

    content.innerHTML = html;

    // Tunggu render DOM selesai
    await new Promise((resolve) => requestAnimationFrame(resolve));

    // --- Hapus script sebelumnya ---
    if (currentScript) {
      currentScript.remove();
      currentScript = null;
    }

    // --- Tentukan script JS yang sesuai dengan halaman ---
    const scriptMap = {
      soal: 'js/soal.js',
      nilai: 'js/nilai.js',
      anggota: 'js/anggota.js',
      description: 'js/description.js',
      home: 'js/home.js',
    };

    const scriptPath = scriptMap[page];
    if (!scriptPath) {
      console.warn(`⚠️ Tidak ada script terdaftar untuk halaman: ${page}`);
      return;
    }

    // --- Load script JS halaman ---
    currentScript = document.createElement('script');
    currentScript.src = scriptPath;
    currentScript.defer = true; // 🔄 biar load setelah DOM siap
    currentScript.onload = async () => {
      console.log(`✅ Script ${scriptPath} berhasil dimuat.`);

      // Pastikan DOM halaman benar-benar siap
      await new Promise((resolve) => requestAnimationFrame(resolve));

      // --- Inisialisasi modul per halaman ---
      switch (page) {
        case 'soal':
          if (typeof initSoal === 'function') initSoal();
          break;

        case 'nilai':
          if (typeof NilaiModule !== 'undefined') {
            NilaiModule.init("tabelNilai");
          }
          break;

        case 'anggota':
          if (typeof AnggotaModule !== 'undefined') {
            AnggotaModule.init("formAnggota", "tabelAnggota", "hasilAnggota", "paginationAnggota");
          }
          break;

        case 'description':
          if (typeof DescriptionModule !== 'undefined') {
            // 🔍 Tambahan pengecekan sebelum init
            const ids = [
              "formDescription",
              "selectMateri",
              "namaMateriBaru",
              "containerMateriBaru",
              "tabelDescription",
              "hasil",
              "pagination"
            ];

            const missing = ids.filter(id => !document.getElementById(id));
            if (missing.length > 0) {
              console.error(`❌ Elemen berikut tidak ditemukan di DOM: ${missing.join(', ')}`);
            } else {
              DescriptionModule.init(...ids);
            }
          }
          break;

        case 'home':
          if (typeof DashboardModule !== 'undefined') {
            DashboardModule.init();
          }
          break;
      }
    };

    document.body.appendChild(currentScript);

  } catch (err) {
    console.error("❌ Error loadPage:", err);
    content.innerHTML = `<p class="text-red-600 text-center mt-4">Gagal memuat halaman <b>${page}</b></p>`;
  }
}

// 🚪 Fungsi logout
function logout() {
  localStorage.removeItem('id_user');
  localStorage.removeItem('username');
  window.location.href = 'index.html';
}

// 🚀 Saat halaman utama selesai dimuat
document.addEventListener("DOMContentLoaded", () => {
  if (checkLogin()) loadPage("home");
});
