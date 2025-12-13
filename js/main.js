let currentScript = null;

// 🔐 Cek login
function checkLogin() {
  const idUser = localStorage.getItem('id_user');
  const username = localStorage.getItem('username');

  if (!idUser || !username) {
    window.location.href = '../index.html';
    return false;
  }
  return true;
}

// 📄 Load halaman
async function loadPage(page) {
  if (!checkLogin()) return;

  const content = document.getElementById('content');
  if (!content) {
    console.error("❌ #content tidak ditemukan");
    return;
  }

  try {
    const res = await fetch(`pages/${page}.html`);
    if (!res.ok) throw new Error(res.status);
    content.innerHTML = await res.text();

    await new Promise(r => requestAnimationFrame(r));

    if (currentScript) {
      currentScript.remove();
      currentScript = null;
    }

    const scriptMap = {
      soal: 'js/soal.js',
      nilai: 'js/nilai.js',
      anggota: 'js/anggota.js',
      description: 'js/description.js',
      home: 'js/home.js',
    };

    const scriptPath = scriptMap[page];
    if (!scriptPath) return;

    currentScript = document.createElement('script');
    currentScript.src = scriptPath;
    currentScript.defer = true;

    currentScript.onload = async () => {
      console.log(`✅ ${scriptPath} loaded`);
      await new Promise(r => requestAnimationFrame(r));

      switch (page) {
        case 'soal':
          if (typeof initSoal === "function") initSoal();
          break;

        case 'description':
          if (typeof initDescription === "function") {
            initDescription();
          } else {
            console.error("❌ initDescription() tidak ditemukan");
          }
          break;

        case 'nilai':
          if (typeof NilaiModule !== "undefined") {
            NilaiModule.init("tabelNilai");
          }
          break;

        case 'anggota':
          if (typeof AnggotaModule !== "undefined") {
            AnggotaModule.init(
              "formAnggota",
              "tabelAnggota",
              "hasilAnggota",
              "paginationAnggota"
            );
          }
          break;

        case 'home':
          if (typeof DashboardModule !== "undefined") {
            DashboardModule.init();
          }
          break;
      }
    };

    document.body.appendChild(currentScript);

  } catch (err) {
    console.error("❌ loadPage error:", err);
    content.innerHTML = `<p class="text-red-600 text-center">Gagal memuat halaman</p>`;
  }
}

// 🚪 Logout
function logout() {
  localStorage.clear();
  window.location.href = 'index.html';
}

// 🚀 Init awal
document.addEventListener("DOMContentLoaded", () => {
  if (checkLogin()) loadPage("home");
});
