(() => {
  // ----- Config -----
  const API_BASE = "https://84fcb76e-ab21-4692-94c1-a86c2b92b808-00-2rnc2uogakcb7.pike.replit.dev";
  const ENDPOINT_LIST = `${API_BASE}/admin/soal`;
  const ENDPOINT_TAMBAH = `${API_BASE}/admin/tambah`;
  const ENDPOINT_HAPUS = (id) => `${API_BASE}/admin/soal/${id}`;

  // ----- State -----
  let dataSoal = [];
  let currentPage = 1;
  let itemsPerPage = 10;
  let totalPages = 1;

  // ----- Util -----
  function query(id) { return document.getElementById(id); }

  function escapeHtml(unsafe) {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function showLoading(tabel, message = "Memuat soal...") {
    tabel.innerHTML = `
      <tr><td colspan="11" class="p-4 text-center text-blue-700 font-semibold">
        ${message}...
      </td></tr>`;
  }

  function isProbablyUrl(v) {
    return v && /^https?:\/\//i.test(v);
  }

  // ----- Pagination -----
  function calculatePagination() {
    totalPages = Math.max(1, Math.ceil(dataSoal.length / itemsPerPage));
    if (currentPage > totalPages) currentPage = totalPages;
  }

  function getCurrentPageData() {
    const start = (currentPage - 1) * itemsPerPage;
    return dataSoal.slice(start, start + itemsPerPage);
  }

  // ----- Mapping Response API -----
  function mapAndSetData(arr) {
    dataSoal = arr.map(item => ({
      id_soal: item.id_soal ?? item.id ?? null,
      soal: item.soal ?? "",
      opsiA: item.opsi_a ?? "",
      opsiB: item.opsi_b ?? "",
      opsiC: item.opsi_c ?? "",
      opsiD: item.opsi_d ?? "",
      bobot: Number(item.bobot_nilai ?? 0),
      opsiBenar: item.opsi_benar ?? "",
      image_url: isProbablyUrl(item.image_file) ? item.image_file : null,

      // ---- AUDIO ----
      audio_url: isProbablyUrl(item.voice_file) ? item.voice_file : null
    }));
  }

  // ----- Fetch List Soal -----
  async function fetchSoal(tabel) {
    showLoading(tabel);

    try {
      const res = await fetch(ENDPOINT_LIST);
      const json = await res.json();
      mapAndSetData(json.data);

      calculatePagination();
      renderSoal(tabel);
      renderPagination();
    } catch (e) {
      tabel.innerHTML = `<tr><td colspan="11" class="text-center p-3 text-red-600">
        Gagal memuat data.
      </td></tr>`;
    }
  }

  // ----- Render Table -----
  function renderSoal(tabel) {
    const rows = getCurrentPageData();

    if (!rows.length) {
      tabel.innerHTML = `<tr><td colspan="11" class="text-center text-gray-500 p-4">Belum ada soal.</td></tr>`;
      return;
    }

    tabel.innerHTML = rows
      .map((item, i) => {
        const audioHtml = item.audio_url
          ? `<audio controls class="w-40"><source src="${item.audio_url}" type="audio/mpeg"></audio>`
          : "-";

        const imgHtml = item.image_url
          ? `<img src="${item.image_url}" class="w-28 h-20 object-cover rounded">`
          : "-";

        return `
          <tr class="hover:bg-gray-50">
            <td class="border p-2 text-center">${(currentPage - 1) * itemsPerPage + i + 1}</td>
            <td class="border p-2">${escapeHtml(item.soal)}</td>
            <td class="border p-2 text-center">${imgHtml}</td>
            <td class="border p-2 text-center">${audioHtml}</td>
            <td class="border p-2">${escapeHtml(item.opsiA)}</td>
            <td class="border p-2">${escapeHtml(item.opsiB)}</td>
            <td class="border p-2">${escapeHtml(item.opsiC)}</td>
            <td class="border p-2">${escapeHtml(item.opsiD)}</td>
            <td class="border p-2 text-center">${item.bobot}</td>
            <td class="border p-2 text-center font-semibold">${escapeHtml(item.opsiBenar)}</td>
            <td class="border p-2 text-center">
              <button onclick="hapusSoal(${item.id_soal})" 
                class="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700">
                Hapus
              </button>
            </td>
          </tr>`;
      })
      .join("");
  }

  // ----- Render Pagination -----
  function renderPagination() {
    const c = query("pagination");
    if (!c) return;

    if (totalPages <= 1) {
      c.innerHTML = "";
      return;
    }

    let html = `
      <button onclick="goToPage(${currentPage - 1})" ${currentPage === 1 ? "disabled" : ""}
        class="px-3 py-1 border rounded">Prev</button>
    `;

    for (let i = 1; i <= totalPages; i++) {
      html += `
        <button onclick="goToPage(${i})" 
          class="px-3 py-1 border rounded ${i === currentPage ? 'bg-blue-600 text-white' : ''}">
          ${i}
        </button>`;
    }

    html += `
      <button onclick="goToPage(${currentPage + 1})" ${currentPage === totalPages ? "disabled" : ""}
        class="px-3 py-1 border rounded">Next</button>
    `;

    c.innerHTML = html;
  }

  window.goToPage = function (page) {
    if (page < 1 || page > totalPages) return;
    currentPage = page;
    renderSoal(query("tabelSoal"));
    renderPagination();
  };

  // ----- Tambah Soal + Audio -----
  async function tambahSoalAPI(data, tabel) {
    showLoading(tabel, "Menyimpan soal...");

    try {
      const formData = new FormData();
      for (const key in data) {
        if (data[key] !== null && data[key] !== undefined) {
          formData.append(key, data[key]);
        }
      }

      const res = await fetch(ENDPOINT_TAMBAH, { method: "POST", body: formData });
      const json = await res.json();

      // refresh list
      fetchSoal(tabel);
      alert("Soal berhasil ditambahkan!");
    } catch (e) {
      console.error(e);
      alert("Gagal menambah soal.");
      fetchSoal(tabel);
    }
  }

  // ----- Hapus Soal -----
  window.hapusSoal = async function (id) {
    if (!confirm("Yakin ingin menghapus?")) return;

    showLoading(query("tabelSoal"), "Menghapus...");

    try {
      await fetch(ENDPOINT_HAPUS(id), { method: "DELETE" });
      fetchSoal(query("tabelSoal"));
    } catch (e) {
      alert("Gagal menghapus.");
      fetchSoal(query("tabelSoal"));
    }
  };

  // ----- Init Form -----
  function initSoal() {
    const form = query("formSoal");
    const tabel = query("tabelSoal");

    fetchSoal(tabel);

    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const data = {
        soal: query("soal").value,
        opsi_a: query("opsiA").value,
        opsi_b: query("opsiB").value,
        opsi_c: query("opsiC").value,
        opsi_d: query("opsiD").value,
        bobot_nilai: query("bobot").value,
        opsi_benar: query("opsiBenar").value,
        image_file: query("gambarSoal").files[0] ?? null,

        // ---- AUDIO ----
        voice_file: query("audioSoal").files[0] ?? null
      };

      tambahSoalAPI(data, tabel);
      form.reset();
    });
  }

  document.addEventListener("DOMContentLoaded", initSoal);
})();
