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

  // ----- Util / UI helpers -----
  function query(id) { return document.getElementById(id); }

  function showLoading(tabel, message = "Memuat soal...") {
    if (!tabel) return;
    tabel.innerHTML = `
      <tr>
        <td colspan="10" class="px-4 py-6 text-center">
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

  function formatCellText(text, maxLen = 200) {
    if (text == null) return "-";
    const s = String(text);
    if (s.length <= maxLen) return escapeHtml(s);
    return escapeHtml(s.slice(0, maxLen)) + '...';
  }

  function escapeHtml(unsafe) {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // ----- Pagination helpers -----
  function calculatePagination() {
    totalPages = Math.max(1, Math.ceil(dataSoal.length / itemsPerPage));
    if (currentPage > totalPages) currentPage = totalPages;
  }

  function getCurrentPageData() {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return dataSoal.slice(startIndex, endIndex);
  }

  // ----- Fetch list -----
  async function fetchSoal(tabel) {
    if (!tabel) return;
    showLoading(tabel);

    try {
      const res = await fetch(ENDPOINT_LIST);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();

      if (!json.data || !Array.isArray(json.data)) {
        console.warn("Response tidak punya .data array, mencoba gunakan root array");
        // fallback: if root is array
        if (Array.isArray(json)) {
          mapAndSetData(json);
        } else {
          throw new Error("Response API tidak sesuai format");
        }
      } else {
        mapAndSetData(json.data);
      }

      calculatePagination();
      renderSoal(tabel);
      renderPagination();
    } catch (err) {
      console.error("Gagal memuat data soal:", err);
      tabel.innerHTML = `
        <tr>
          <td colspan="10" class="text-center text-red-600 p-2">
            Gagal memuat data soal. Lihat console untuk detail.
          </td>
        </tr>
      `;
    }
  }

  function mapAndSetData(arr) {
    dataSoal = arr.map(item => {
      // normalize common fields, be defensive with field names
      return {
        id_soal: item.id_soal ?? item.id ?? null,
        soal: item.soal ?? item.question ?? "",
        opsiA: item.opsi_a ?? item.opsiA ?? "",
        opsiB: item.opsi_b ?? item.opsiB ?? "",
        opsiC: item.opsi_c ?? item.opsiC ?? "",
        opsiD: item.opsi_d ?? item.opsiD ?? "",
        bobot: Number(item.bobot_nilai ?? item.bobot ?? 0),
        opsiBenar: item.opsi_benar ?? item.opsiBenar ?? "",
        // image: API might return a direct URL or a filename; keep original
        image_raw: item.image_file ?? item.image_url ?? item.image ?? null,
        // convenience: if image_raw looks like a full URL use it, else null (backend should ideally send URL)
        image_url: isProbablyUrl(item.image_file ?? item.image_url ?? item.image) ? (item.image_file ?? item.image_url ?? item.image) : null
      };
    });
  }

  function isProbablyUrl(v) {
    if (!v) return false;
    return /^https?:\/\//i.test(v) || /^\/uploads\//i.test(v);
  }

  // ----- Render table -----
  function renderSoal(tabel) {
    if (!tabel) return;

    const currentData = getCurrentPageData();

    if (currentData.length === 0) {
      tabel.innerHTML = `
        <tr>
          <td colspan="10" class="text-center text-gray-500 p-4">
            ${dataSoal.length === 0 ? 'Belum ada soal.' : 'Tidak ada data untuk halaman ini.'}
          </td>
        </tr>
      `;
      return;
    }

    tabel.innerHTML = currentData.map((item, i) => {
      const globalIndex = (currentPage - 1) * itemsPerPage + i + 1;
      const soalShort = formatCellText(item.soal, 220);

      // choose image src: image_url (if provided) else if image_raw seems base64 / data URL show it, else empty
      let imgHtml = '-';
      if (item.image_url) {
        imgHtml = `<img src="${escapeHtml(item.image_url)}" alt="gambar" class="w-28 h-20 object-cover rounded" />`;
      } else if (typeof item.image_raw === 'string' && item.image_raw.startsWith('data:image')) {
        imgHtml = `<img src="${escapeHtml(item.image_raw)}" alt="gambar" class="w-28 h-20 object-cover rounded" />`;
      }

      return `
        <tr class="hover:bg-gray-50 align-top">
          <td class="border p-2 text-center align-top">${globalIndex}</td>
          <td class="border p-2 align-top">${soalShort}</td>
          <td class="border p-2 text-center align-top">${imgHtml}</td>
          <td class="border p-2 align-top">${escapeHtml(item.opsiA)}</td>
          <td class="border p-2 align-top">${escapeHtml(item.opsiB)}</td>
          <td class="border p-2 align-top">${escapeHtml(item.opsiC)}</td>
          <td class="border p-2 align-top">${escapeHtml(item.opsiD)}</td>
          <td class="border p-2 text-center align-top">${item.bobot}</td>
          <td class="border p-2 text-center align-top font-semibold">${escapeHtml(item.opsiBenar)}</td>
          <td class="border p-2 text-center align-top">
            <button class="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition-colors"
                    onclick="hapusSoal(${item.id_soal})">
              Hapus
            </button>
          </td>
        </tr>
      `;
    }).join('');
  }

  // ----- Render pagination -----
  function renderPagination() {
    const paginationContainer = query('pagination');
    if (!paginationContainer) return;

    if (totalPages <= 1) {
      paginationContainer.innerHTML = '';
      return;
    }

    let paginationHTML = `
      <div class="flex items-center justify-between mt-4 w-full">
        <div class="flex items-center space-x-4">
          <span class="text-sm text-gray-700">
            Menampilkan ${Math.min(itemsPerPage, dataSoal.length - (currentPage - 1) * itemsPerPage)} dari ${dataSoal.length} soal
          </span>
          <select id="itemsPerPage" class="border rounded px-2 py-1 text-sm" onchange="changeItemsPerPage(this.value)">
            <option value="10" ${itemsPerPage === 10 ? 'selected' : ''}>10 per halaman</option>
            <option value="15" ${itemsPerPage === 15 ? 'selected' : ''}>15 per halaman</option>
            <option value="20" ${itemsPerPage === 20 ? 'selected' : ''}>20 per halaman</option>
          </select>
        </div>

        <div class="flex items-center space-x-2">
    `;

    // Prev
    if (currentPage > 1) {
      paginationHTML += `
        <button onclick="goToPage(${currentPage - 1})" class="px-3 py-1 border rounded hover:bg-gray-100 transition-colors">
          &laquo; Prev
        </button>
      `;
    }

    // pages
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      paginationHTML += `
        <button onclick="goToPage(${i})" class="px-3 py-1 border rounded transition-colors ${i === currentPage ? 'bg-blue-600 text-white border-blue-600' : 'hover:bg-gray-100'}">
          ${i}
        </button>
      `;
    }

    // Next
    if (currentPage < totalPages) {
      paginationHTML += `
        <button onclick="goToPage(${currentPage + 1})" class="px-3 py-1 border rounded hover:bg-gray-100 transition-colors">
          Next &raquo;
        </button>
      `;
    }

    paginationHTML += `
        </div>
        <div class="text-sm text-gray-700">
          Halaman ${currentPage} dari ${totalPages}
        </div>
      </div>
    `;

    paginationContainer.innerHTML = paginationHTML;
  }

  // ----- Page controls -----
  function goToPage(page) {
    if (page < 1 || page > totalPages || page === currentPage) return;
    currentPage = page;
    const tabel = query('tabelSoal');
    renderSoal(tabel);
    renderPagination();
    if (tabel) tabel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function changeItemsPerPage(newItemsPerPage) {
    itemsPerPage = parseInt(newItemsPerPage, 10) || 10;
    currentPage = 1;
    calculatePagination();
    const tabel = query('tabelSoal');
    renderSoal(tabel);
    renderPagination();
  }

  // ----- Tambah soal (multipart/form-data) -----
  async function tambahSoalAPI(soalData, tabel) {
    if (!tabel) return;
    showLoading(tabel, "Menyimpan soal...");

    try {
      const formData = new FormData();
      formData.append('soal', soalData.soal);
      formData.append('opsi_a', soalData.opsi_a);
      formData.append('opsi_b', soalData.opsi_b);
      formData.append('opsi_c', soalData.opsi_c);
      formData.append('opsi_d', soalData.opsi_d);
      formData.append('bobot_nilai', String(soalData.bobot_nilai ?? 0));
      formData.append('opsi_benar', soalData.opsi_benar ?? '');

      if (soalData.image_file instanceof File) {
        formData.append('image_file', soalData.image_file);
      } else if (typeof soalData.image_file === 'string' && soalData.image_file.startsWith('data:image')) {
        // If the frontend gives base64 string, convert to blob
        const blob = dataURLtoBlob(soalData.image_file);
        formData.append('image_file', blob, 'upload.png');
      }

      const res = await fetch(ENDPOINT_TAMBAH, {
        method: 'POST',
        body: formData // browser will set multipart/form-data boundary
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();

      // Backend should return created soal data including id and image URL (if any)
      // Normalize result and push to dataSoal
      const newItem = {
        id_soal: json.id_soal ?? json.id ?? (dataSoal.length ? Math.max(...dataSoal.map(s => s.id_soal || 0)) + 1 : 1),
        soal: json.soal ?? soalData.soal,
        opsiA: json.opsi_a ?? soalData.opsi_a,
        opsiB: json.opsi_b ?? soalData.opsi_b,
        opsiC: json.opsi_c ?? soalData.opsi_c,
        opsiD: json.opsi_d ?? soalData.opsi_d,
        bobot: Number(json.bobot_nilai ?? soalData.bobot_nilai ?? 0),
        opsiBenar: json.opsi_benar ?? soalData.opsi_benar ?? '',
        image_raw: json.image_file ?? json.image_url ?? null,
        image_url: isProbablyUrl(json.image_file ?? json.image_url ?? null) ? (json.image_file ?? json.image_url) : null
      };

      dataSoal.unshift(newItem); // add to start so user sees it
      calculatePagination();
      // keep user on page 1 to show new item
      currentPage = 1;
      renderSoal(tabel);
      renderPagination();

      // reset form outside (caller does form.reset()), but also hide preview
      const previewBox = query('previewGambar');
      const previewImg = query('previewImg');
      if (previewBox) previewBox.classList.add('hidden');
      if (previewImg) { previewImg.src = ''; previewImg.alt = ''; }

      alert('Soal berhasil ditambahkan!');
    } catch (err) {
      console.error('Gagal menambah soal:', err);
      alert('Gagal menambah soal. Lihat console untuk detail.');
      renderSoal(tabel);
    }
  }

  // convert dataURL -> blob
  function dataURLtoBlob(dataurl) {
    const arr = dataurl.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/png';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  }

  // ----- Hapus soal -----
  async function hapusSoal(id_soal) {
    if (!confirm('Yakin ingin menghapus soal ini?')) return;
    const tabel = query('tabelSoal');
    if (!tabel) return;
    showLoading(tabel, 'Menghapus soal...');

    try {
      const res = await fetch(ENDPOINT_HAPUS(id_soal), { method: 'DELETE' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      dataSoal = dataSoal.filter(x => x.id_soal !== id_soal);
      calculatePagination();
      // adjust currentPage if needed
      if (currentPage > totalPages) currentPage = totalPages;
      renderSoal(tabel);
      renderPagination();
      alert('Soal berhasil dihapus!');
    } catch (err) {
      console.error('Gagal menghapus soal:', err);
      alert('Gagal menghapus soal. Lihat console untuk detail.');
      renderSoal(tabel);
      renderPagination();
    }
  }

  // ----- Init form and preview -----
  function initSoal() {
    const form = query('formSoal');
    const tabel = query('tabelSoal');
    const inputFile = query('gambarSoal');
    const previewBox = query('previewGambar');
    const previewImg = query('previewImg');

    if (!form || !tabel) {
      console.error('Form atau tabel soal tidak ditemukan!');
      return;
    }

    // Fetch initial data
    fetchSoal(tabel);

    // file preview
    if (inputFile && previewBox && previewImg) {
      inputFile.addEventListener('change', (e) => {
        const file = inputFile.files && inputFile.files[0];
        if (!file) {
          previewBox.classList.add('hidden');
          previewImg.src = '';
          return;
        }

        // validate image size (optional) - max 5MB
        const maxMB = 5;
        if (file.size > maxMB * 1024 * 1024) {
          alert(`Ukuran gambar maksimal ${maxMB} MB`);
          inputFile.value = '';
          previewBox.classList.add('hidden');
          previewImg.src = '';
          return;
        }

        const reader = new FileReader();
        reader.onload = function(evt) {
          previewImg.src = evt.target.result;
          previewImg.alt = file.name;
          previewBox.classList.remove('hidden');
        };
        reader.readAsDataURL(file);
      });
    }

    // submit handler
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const soalVal = (query('soal')?.value || '').trim();
      const opsiAVal = (query('opsiA')?.value || '').trim();
      const opsiBVal = (query('opsiB')?.value || '').trim();
      const opsiCVal = (query('opsiC')?.value || '').trim();
      const opsiDVal = (query('opsiD')?.value || '').trim();
      const bobotVal = Number(query('bobot')?.value || 0);
      const opsiBenarVal = (query('opsiBenar')?.value || '').trim();
      const imageFile = (query('gambarSoal') && query('gambarSoal').files && query('gambarSoal').files[0]) ? query('gambarSoal').files[0] : null;

      // basic validation
      if (!soalVal || !opsiAVal || !opsiBVal || !opsiCVal || !opsiDVal || !opsiBenarVal || Number.isNaN(bobotVal)) {
        alert('Lengkapi semua field yang wajib diisi!');
        return;
      }

      const soalData = {
        soal: soalVal,
        opsi_a: opsiAVal,
        opsi_b: opsiBVal,
        opsi_c: opsiCVal,
        opsi_d: opsiDVal,
        bobot_nilai: bobotVal,
        opsi_benar: opsiBenarVal,
        image_file: imageFile
      };

      tambahSoalAPI(soalData, tabel);

      // reset form fields
      form.reset();
      if (previewBox) previewBox.classList.add('hidden');
      if (previewImg) previewImg.src = '';
    });
  }

  // expose to global scope so inline onclick works
  window.initSoal = initSoal;
  window.hapusSoal = hapusSoal;
  window.goToPage = goToPage;
  window.changeItemsPerPage = changeItemsPerPage;

  // auto init when DOM ready
  document.addEventListener('DOMContentLoaded', initSoal);
})();
