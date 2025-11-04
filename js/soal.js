(() => {
  let dataSoal = [];

  const API_BASE = "https://84fcb76e-ab21-4692-94c1-a86c2b92b808-00-2rnc2uogakcb7.pike.replit.dev";

  async function fetchSoal(tabel) {
    showLoading(tabel);

    const apiUrl = `${API_BASE}/admin/soal`;
    try {
      const res = await fetch(apiUrl);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const json = await res.json();
      if (!json.data || !Array.isArray(json.data)) throw new Error("Response API tidak sesuai format");

      dataSoal = json.data.map(item => ({
        id_soal: item.id_soal,
        soal: item.soal,
        opsiA: item.opsi_a,
        opsiB: item.opsi_b,
        opsiC: item.opsi_c,
        opsiD: item.opsi_d,
        bobot: Number(item.bobot_nilai),
        opsiBenar: item.opsi_benar
      }));

      renderSoal(tabel);
    } catch (err) {
      console.error("Gagal memuat data soal:", err);
      if (tabel) {
        tabel.innerHTML = `
          <tr>
            <td colspan="9" class="text-center text-red-600 p-2">
              Gagal memuat data soal. Lihat console untuk detail.
            </td>
          </tr>
        `;
      }
    }
  }

  function showLoading(tabel, message = "Memuat soal...") {
    if (!tabel) return;
    tabel.innerHTML = `
      <tr>
        <td colspan="9" class="px-4 py-6 text-center">
          <div class="flex flex-col items-center justify-center space-y-2">
            <svg class="animate-spin h-8 w-8 text-blue-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
            </svg>
            <span class="text-blue-700 font-medium">${message}</span>
          </div>
        </td>
      </tr>
    `;
  }

  function renderSoal(tabel) {
    if (!tabel) return;

    if (dataSoal.length === 0) {
      tabel.innerHTML = `
        <tr>
          <td colspan="9" class="text-center text-gray-500 p-2">Belum ada soal.</td>
        </tr>
      `;
      return;
    }

    tabel.innerHTML = dataSoal.map((item, i) => `
      <tr>
        <td class="border p-2 text-center">${item.id_soal || i + 1}</td>
        <td class="border p-2">${item.soal}</td>
        <td class="border p-2">${item.opsiA}</td>
        <td class="border p-2">${item.opsiB}</td>
        <td class="border p-2">${item.opsiC}</td>
        <td class="border p-2">${item.opsiD}</td>
        <td class="border p-2 text-center">${item.bobot}</td>
        <td class="border p-2 text-center">${item.opsiBenar}</td>
        <td class="border p-2 text-center">
          <button class="bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700" onclick="hapusSoal(${item.id_soal})">
            Hapus
          </button>
        </td>
      </tr>
    `).join('');
  }

  async function tambahSoalAPI(soalData, tabel) {
    showLoading(tabel, "Menyimpan soal...");
    const apiUrl = `${API_BASE}/admin/tambah`;

    try {
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(soalData)
      });

      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const json = await res.json();

      dataSoal.push({
        id_soal: json.id_soal || dataSoal.length + 1,
        soal: json.soal,
        opsiA: json.opsi_a,
        opsiB: json.opsi_b,
        opsiC: json.opsi_c,
        opsiD: json.opsi_d,
        bobot: Number(json.bobot_nilai),
        opsiBenar: json.opsi_benar
      });

      renderSoal(tabel);
      alert("Soal berhasil ditambahkan!");
    } catch (err) {
      console.error("Gagal menambah soal:", err);
      alert("Gagal menambah soal. Lihat console untuk detail.");
      renderSoal(tabel);
    }
  }

  async function hapusSoal(id_soal) {
    if (!confirm("Yakin ingin menghapus soal ini?")) return;

    const tabel = document.getElementById('tabelSoal');
    showLoading(tabel, "Menghapus soal...");

    const apiUrl = `${API_BASE}/admin/soal/${id_soal}`;

    try {
      const res = await fetch(apiUrl, { method: "DELETE" });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

      dataSoal = dataSoal.filter(item => item.id_soal !== id_soal);
      renderSoal(tabel);
      alert("Soal berhasil dihapus!");
    } catch (err) {
      console.error("Gagal menghapus soal:", err);
      alert("Gagal menghapus soal. Lihat console untuk detail.");
      renderSoal(tabel);
    }
  }

  function initSoal() {
    const form = document.getElementById('formSoal');
    const tabel = document.getElementById('tabelSoal');

    if (!form || !tabel) {
      console.error("Form atau tabel soal tidak ditemukan!");
      return;
    }

    fetchSoal(tabel);

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const soalData = {
        soal: document.getElementById('soal').value,
        opsi_a: document.getElementById('opsiA').value,
        opsi_b: document.getElementById('opsiB').value,
        opsi_c: document.getElementById('opsiC').value,
        opsi_d: document.getElementById('opsiD').value,
        bobot_nilai: Number(document.getElementById('bobot').value),
        opsi_benar: document.getElementById('opsiBenar').value
      };
      tambahSoalAPI(soalData, tabel);
      form.reset();
    });
  }

  window.initSoal = initSoal;
  window.hapusSoal = hapusSoal;
  document.addEventListener("DOMContentLoaded", initSoal);
})();
