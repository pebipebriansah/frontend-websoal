let currentScript = null; // Script halaman aktif saat ini

// Fungsi untuk memeriksa login
function checkLogin() {
  const idUser = localStorage.getItem('id_user');
  const username = localStorage.getItem('username');

  if (!idUser || !username) {
    window.location.href = '../index.html';
    return false;
  }
  return true;
}

// Fungsi untuk load halaman
async function loadPage(page) {
  if (!checkLogin()) return;

  const content = document.getElementById('content');
  if (!content) return console.error("Element #content tidak ditemukan!");

  try {
    // Load HTML halaman
    const res = await fetch(`pages/${page}.html`);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const html = await res.text();
    content.innerHTML = html;

    // Hapus script sebelumnya
    if (currentScript) {
      currentScript.remove();
      currentScript = null;
    }

    // Tentukan script halaman
    let scriptPath = null;
    switch (page) {
      case 'soal':
        scriptPath = 'js/soal.js';
        break;
      case 'nilai':
        scriptPath = 'js/nilai.js';
        break;
      case 'anggota':
        scriptPath = 'js/anggota.js';
        break;
      case 'description':
        scriptPath = 'js/description.js';
        break;
      case 'home':
        scriptPath = 'js/home.js'; // Script untuk dashboard
        break;
    }

    // Muat script dinamis dan panggil init setelah load
    if (scriptPath) {
      currentScript = document.createElement('script');
      currentScript.src = scriptPath;
      currentScript.onload = () => {
        console.log(`✅ Script ${scriptPath} berhasil dimuat.`);

        // Inisialisasi modul sesuai halaman
        switch (page) {
          case 'soal':
            if (typeof initSoal === 'function') initSoal();
            break;
          case 'nilai':
            if (typeof NilaiModule !== 'undefined')
              NilaiModule.init("tabelNilai");
            break;
          case 'anggota':
            if (typeof AnggotaModule !== 'undefined')
              AnggotaModule.init("formAnggota", "tabelAnggota", "hasilAnggota");
            break;
          case 'description':
            if (typeof DescriptionModule !== 'undefined') {
              DescriptionModule.init(
                "formDescription",       // id form
                "selectMateri",          // id dropdown materi
                "namaMateriBaru",        // input untuk materi baru
                "containerMateriBaru",   // container input materi baru
                "tabelDescription",      // id tabel deskripsi
                "hasil",                 // id hasil pesan
                "pagination"             // id pagination
              );
            }
            break;
          case 'home':
            if (typeof DashboardModule !== 'undefined') DashboardModule.init();
            break;
        }
      };
      document.body.appendChild(currentScript);
    }
  } catch (err) {
    console.error(err);
    content.innerHTML = `<p class="text-red-600">Gagal memuat halaman: ${page}</p>`;
  }
}

// Logout
function logout() {
  localStorage.removeItem('id_user');
  localStorage.removeItem('username');
  window.location.href = 'index.html';
}

// Load halaman default
document.addEventListener("DOMContentLoaded", () => {
  if (checkLogin()) loadPage("home");
});
