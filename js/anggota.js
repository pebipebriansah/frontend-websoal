(() => {
  let dataAnggota = [];
  let currentPage = 1;
  let itemsPerPage = 10;
  let totalPages = 1;
  let searchTerm = '';
  let filterJenisKelamin = '';

  const API_BASE = "https://84fcb76e-ab21-4692-94c1-a86c2b92b808-00-2rnc2uogakcb7.pike.replit.dev";

  // Fungsi Filtering
  function getFilteredData() {
    return dataAnggota.filter(anggota => {
      const matchesSearch = anggota.nama_anggota.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          anggota.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          anggota.alamat?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesGender = !filterJenisKelamin || anggota.jenis_kelamin === filterJenisKelamin;
      return matchesSearch && matchesGender;
    });
  }

  function calculatePagination() {
    const filteredData = getFilteredData();
    totalPages = Math.ceil(filteredData.length / itemsPerPage);
    if (currentPage > totalPages) {
      currentPage = totalPages || 1;
    }
  }

  function getCurrentPageData() {
    const filteredData = getFilteredData();
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredData.slice(startIndex, endIndex);
  }

  function showLoading(tabel, message = "Memuat data...") {
    if (!tabel) return;
    tabel.innerHTML = `
      <tr>
        <td colspan="6" class="px-4 py-6 text-center">
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

  function renderFilter() {
    const filterContainer = document.getElementById('filterContainer');
    if (!filterContainer) return;

    filterContainer.innerHTML = `
      <div class="flex flex-col md:flex-row gap-4 mb-4">
        <div class="flex-1">
          <input 
            type="text" 
            id="searchInput" 
            placeholder="Cari nama, username, atau alamat..." 
            class="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value="${searchTerm}"
          />
        </div>
        <div class="w-full md:w-48">
          <select 
            id="genderFilter" 
            class="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Semua Jenis Kelamin</option>
            <option value="L" ${filterJenisKelamin === 'L' ? 'selected' : ''}>Laki-laki</option>
            <option value="P" ${filterJenisKelamin === 'P' ? 'selected' : ''}>Perempuan</option>
          </select>
        </div>
        <button 
          onclick="resetFilterAnggota()" 
          class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Reset Filter
        </button>
      </div>
    `;

    // Event listeners untuk filter
    const searchInput = document.getElementById('searchInput');
    const genderFilter = document.getElementById('genderFilter');

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        searchTerm = e.target.value;
        currentPage = 1;
        calculatePagination();
        renderAnggota();
        renderPagination();
      });
    }

    if (genderFilter) {
      genderFilter.addEventListener('change', (e) => {
        filterJenisKelamin = e.target.value;
        currentPage = 1;
        calculatePagination();
        renderAnggota();
        renderPagination();
      });
    }
  }

  function renderAnggota() {
    const tabel = document.getElementById('tabelAnggota');
    if (!tabel) return;

    const currentData = getCurrentPageData();
    const filteredData = getFilteredData();

    if (currentData.length === 0) {
      tabel.innerHTML = `
        <tr>
          <td colspan="6" class="text-center text-gray-500 p-4">
            ${filteredData.length === 0 ? 'Belum ada data anggota.' : 'Tidak ada data untuk halaman ini.'}
          </td>
        </tr>
      `;
      return;
    }

    tabel.innerHTML = currentData.map((item, i) => {
      const globalIndex = (currentPage - 1) * itemsPerPage + i + 1;
      const jenisKelamin = item.jenis_kelamin === 'L' ? 'Laki-laki' : item.jenis_kelamin === 'P' ? 'Perempuan' : item.jenis_kelamin;
      
      return `
        <tr class="hover:bg-gray-50">
          <td class="border p-2 text-center">${globalIndex}</td>
          <td class="border p-2 font-medium">${item.nama_anggota}</td>
          <td class="border p-2">${item.username}</td>
          <td class="border p-2 text-center">${jenisKelamin}</td>
          <td class="border p-2">${item.alamat || "-"}</td>
          <td class="border p-2 text-center">
            <button class="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition-colors" 
                    onclick="hapusAnggota(${item.id_anggota})">
              Hapus
            </button>
          </td>
        </tr>
      `;
    }).join('');
  }

  function renderPagination() {
    const paginationContainer = document.getElementById('paginationContainer');
    if (!paginationContainer) return;

    const filteredData = getFilteredData();

    if (totalPages <= 1) {
      paginationContainer.innerHTML = '';
      return;
    }

    let paginationHTML = `
      <div class="flex items-center justify-between mt-4">
        <div class="flex items-center space-x-4">
          <span class="text-sm text-gray-700">
            Menampilkan ${Math.min(itemsPerPage, filteredData.length)} dari ${filteredData.length} anggota
          </span>
          <select id="itemsPerPage" class="border rounded px-2 py-1 text-sm" onchange="changeItemsPerPageAnggota(this.value)">
            <option value="10" ${itemsPerPage === 10 ? 'selected' : ''}>10 per halaman</option>
            <option value="15" ${itemsPerPage === 15 ? 'selected' : ''}>15 per halaman</option>
            <option value="20" ${itemsPerPage === 20 ? 'selected' : ''}>20 per halaman</option>
          </select>
        </div>
        
        <div class="flex items-center space-x-2">
    `;

    // Tombol Previous
    if (currentPage > 1) {
      paginationHTML += `
        <button onclick="goToPageAnggota(${currentPage - 1})" 
                class="px-3 py-1 border rounded hover:bg-gray-100 transition-colors">
          &laquo; Prev
        </button>
      `;
    }

    // Tombol halaman
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      paginationHTML += `
        <button onclick="goToPageAnggota(${i})" 
                class="px-3 py-1 border rounded transition-colors ${
                  i === currentPage 
                    ? 'bg-blue-600 text-white border-blue-600' 
                    : 'hover:bg-gray-100'
                }">
          ${i}
        </button>
      `;
    }

    // Tombol Next
    if (currentPage < totalPages) {
      paginationHTML += `
        <button onclick="goToPageAnggota(${currentPage + 1})" 
                class="px-3 py-1 border rounded hover:bg-gray-100 transition-colors">
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

  function goToPageAnggota(page) {
    if (page < 1 || page > totalPages || page === currentPage) return;
    
    currentPage = page;
    calculatePagination();
    renderAnggota();
    renderPagination();
    
    // Scroll ke atas tabel
    const tabel = document.getElementById('tabelAnggota');
    if (tabel) {
      tabel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function changeItemsPerPageAnggota(newItemsPerPage) {
    itemsPerPage = parseInt(newItemsPerPage);
    currentPage = 1;
    calculatePagination();
    renderAnggota();
    renderPagination();
  }

  function resetFilterAnggota() {
    searchTerm = '';
    filterJenisKelamin = '';
    currentPage = 1;
    calculatePagination();
    renderFilter();
    renderAnggota();
    renderPagination();
  }

  async function fetchAnggota() {
    const tabel = document.getElementById('tabelAnggota');
    showLoading(tabel);

    const apiUrl = `${API_BASE}/admin/anggota`;
    try {
      const res = await fetch(apiUrl);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const json = await res.json();
      if (!json.data || !Array.isArray(json.data)) throw new Error("Response API tidak sesuai format");

      dataAnggota = json.data;

      calculatePagination();
      renderFilter();
      renderAnggota();
      renderPagination();
    } catch (err) {
      console.error("Gagal memuat data anggota:", err);
      if (tabel) {
        tabel.innerHTML = `
          <tr>
            <td colspan="6" class="text-center text-red-600 p-2">
              Gagal memuat data anggota. Lihat console untuk detail.
            </td>
          </tr>
        `;
      }
    }
  }

  async function tambahAnggotaAPI(anggotaData) {
    const tabel = document.getElementById('tabelAnggota');
    showLoading(tabel, "Menyimpan anggota...");
    const apiUrl = `${API_BASE}/anggota/tambah`;

    try {
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(anggotaData)
      });

      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const json = await res.json();

      dataAnggota.push({
        id_anggota: json.id_anggota || dataAnggota.length + 1,
        nama_anggota: json.nama_anggota,
        username: json.username,
        jenis_kelamin: anggotaData.jenis_kelamin,
        alamat: anggotaData.alamat
      });

      calculatePagination();
      renderAnggota();
      renderPagination();
      
      const hasil = document.getElementById('hasilAnggota');
      if (hasil) {
        hasil.textContent = "Anggota berhasil ditambahkan!";
        hasil.className = "text-green-600 text-sm font-medium";
      }
    } catch (err) {
      console.error("Gagal menambah anggota:", err);
      const hasil = document.getElementById('hasilAnggota');
      if (hasil) {
        hasil.textContent = "Gagal menambah anggota. Lihat console untuk detail.";
        hasil.className = "text-red-600 text-sm font-medium";
      }
      renderAnggota();
    }
  }

  async function hapusAnggota(id_anggota) {
    const anggota = dataAnggota.find(a => a.id_anggota === id_anggota);
    if (!anggota || !confirm(`Yakin ingin menghapus anggota "${anggota.nama_anggota}"?`)) return;

    const tabel = document.getElementById('tabelAnggota');
    showLoading(tabel, "Menghapus anggota...");

    const apiUrl = `${API_BASE}/admin/anggota/${id_anggota}`;

    try {
      const res = await fetch(apiUrl, { method: "DELETE" });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

      dataAnggota = dataAnggota.filter(item => item.id_anggota !== id_anggota);
      calculatePagination();
      renderAnggota();
      renderPagination();
      
      const hasil = document.getElementById('hasilAnggota');
      if (hasil) {
        hasil.textContent = "Anggota berhasil dihapus!";
        hasil.className = "text-green-600 text-sm font-medium";
      }
    } catch (err) {
      console.error("Gagal menghapus anggota:", err);
      const hasil = document.getElementById('hasilAnggota');
      if (hasil) {
        hasil.textContent = "Gagal menghapus anggota. Lihat console untuk detail.";
        hasil.className = "text-red-600 text-sm font-medium";
      }
      renderAnggota();
    }
  }

  function initAnggota() {
    const form = document.getElementById('formAnggota');
    const tabel = document.getElementById('tabelAnggota');

    if (!form || !tabel) {
      console.error("Form atau tabel anggota tidak ditemukan!");
      return;
    }

    fetchAnggota();

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const anggotaData = {
        nama_anggota: document.getElementById('nama_anggota').value,
        alamat: document.getElementById('alamat').value,
        jenis_kelamin: document.getElementById('jenis_kelamin').value,
        username: document.getElementById('username').value,
        password: document.getElementById('password').value
      };
      tambahAnggotaAPI(anggotaData);
      form.reset();
    });
  }

  // Expose functions to global scope
  window.initAnggota = initAnggota;
  window.hapusAnggota = hapusAnggota;
  window.goToPageAnggota = goToPageAnggota;
  window.changeItemsPerPageAnggota = changeItemsPerPageAnggota;
  window.resetFilterAnggota = resetFilterAnggota;
  
  document.addEventListener("DOMContentLoaded", initAnggota);
})();