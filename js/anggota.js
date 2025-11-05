(() => {
  const API_BASE = "https://84fcb76e-ab21-4692-94c1-a86c2b92b808-00-2rnc2uogakcb7.pike.replit.dev";

  let anggotaList = [];
  let currentPage = 1;
  let itemsPerPage = 5;
  let searchTerm = '';
  let filterJenisKelamin = '';

  const AnggotaAPI = {
    getAll: async () => {
      const res = await fetch(`${API_BASE}/admin/anggota`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const json = await res.json();
      if (!json.data || !Array.isArray(json.data)) throw new Error("Response API tidak sesuai format");
      return json.data;
    },
    add: async (anggotaData) => {
      const res = await fetch(`${API_BASE}/anggota/tambah`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(anggotaData)
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return await res.json();
    },
    delete: async (id) => {
      const res = await fetch(`${API_BASE}/admin/anggota/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return await res.json();
    }
  };

  const AnggotaModule = {
    init: (formId, tabelId, hasilId, paginationId, filterId) => {
      const form = document.getElementById(formId);
      const tabel = document.getElementById(tabelId);
      const hasil = document.getElementById(hasilId);
      const pagination = document.getElementById(paginationId);
      const filter = document.getElementById(filterId);

      if (!form || !tabel || !hasil || !pagination || !filter) {
        console.error("Elemen tidak ditemukan!");
        return;
      }

      // Fungsi Filtering
      const getFilteredData = () => {
        return anggotaList.filter(anggota => {
          const matchesSearch = anggota.nama_anggota.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              anggota.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              anggota.alamat?.toLowerCase().includes(searchTerm.toLowerCase());
          const matchesGender = !filterJenisKelamin || anggota.jenis_kelamin === filterJenisKelamin;
          return matchesSearch && matchesGender;
        });
      };

      // Fungsi Pagination
      const getPaginatedData = (data) => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return data.slice(startIndex, endIndex);
      };

      const getTotalPages = (data) => {
        return Math.ceil(data.length / itemsPerPage);
      };

      // Render Pagination
      const renderPagination = (totalPages) => {
        if (totalPages <= 1) {
          pagination.innerHTML = '';
          return;
        }

        let paginationHTML = `
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-2">
              <span class="text-sm text-gray-700">Items per page:</span>
              <select class="border rounded p-1 text-sm" id="itemsPerPageSelect">
                <option value="5" ${itemsPerPage === 5 ? 'selected' : ''}>5</option>
                <option value="10" ${itemsPerPage === 10 ? 'selected' : ''}>10</option>
                <option value="20" ${itemsPerPage === 20 ? 'selected' : ''}>20</option>
              </select>
            </div>
            <div class="flex items-center space-x-2">
        `;

        // Tombol Previous
        if (currentPage > 1) {
          paginationHTML += `
            <button class="px-3 py-1 border rounded hover:bg-gray-100" data-page="${currentPage - 1}">
              Previous
            </button>
          `;
        }

        // Numbered pages
        const maxVisiblePages = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

        if (endPage - startPage + 1 < maxVisiblePages) {
          startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
          paginationHTML += `
            <button class="px-3 py-1 border rounded ${
              i === currentPage 
                ? 'bg-blue-600 text-white' 
                : 'hover:bg-gray-100'
            }" data-page="${i}">
              ${i}
            </button>
          `;
        }

        // Tombol Next
        if (currentPage < totalPages) {
          paginationHTML += `
            <button class="px-3 py-1 border rounded hover:bg-gray-100" data-page="${currentPage + 1}">
              Next
            </button>
          `;
        }

        paginationHTML += `
            </div>
          </div>
        `;

        pagination.innerHTML = paginationHTML;

        // Event listeners untuk pagination
        pagination.querySelectorAll('button[data-page]').forEach(btn => {
          btn.addEventListener('click', () => {
            currentPage = parseInt(btn.dataset.page);
            render();
          });
        });

        // Event listener untuk items per page
        const itemsPerPageSelect = pagination.querySelector('#itemsPerPageSelect');
        if (itemsPerPageSelect) {
          itemsPerPageSelect.addEventListener('change', (e) => {
            itemsPerPage = parseInt(e.target.value);
            currentPage = 1;
            render();
          });
        }
      };

      // Render Filter
      const renderFilter = () => {
        filter.innerHTML = `
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
              id="resetFilter" 
              class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Reset Filter
            </button>
          </div>
        `;

        // Event listeners untuk filter
        const searchInput = filter.querySelector('#searchInput');
        const genderFilter = filter.querySelector('#genderFilter');
        const resetFilter = filter.querySelector('#resetFilter');

        searchInput.addEventListener('input', (e) => {
          searchTerm = e.target.value;
          currentPage = 1;
          render();
        });

        genderFilter.addEventListener('change', (e) => {
          filterJenisKelamin = e.target.value;
          currentPage = 1;
          render();
        });

        resetFilter.addEventListener('click', () => {
          searchTerm = '';
          filterJenisKelamin = '';
          currentPage = 1;
          render();
        });
      };

      // Spinner di dalam tabel
      const showLoading = (message = "Memuat data...") => {
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
      };

      const hideLoading = () => {
        tabel.innerHTML = "";
      };

      const render = () => {
        const filteredData = getFilteredData();
        const paginatedData = getPaginatedData(filteredData);
        const totalPages = getTotalPages(filteredData);

        // Render filter
        renderFilter();

        // Render data
        if (filteredData.length === 0) {
          tabel.innerHTML = `
            <tr>
              <td colspan="6" class="px-6 py-8 text-center text-gray-500">
                <div class="flex flex-col items-center justify-center space-y-2">
                  <i class="fas fa-search text-3xl text-gray-400"></i>
                  <span class="text-lg font-medium">Tidak ada data yang ditemukan</span>
                  <p class="text-sm text-gray-500">Coba ubah kata kunci pencarian atau filter</p>
                </div>
              </td>
            </tr>`;
          pagination.innerHTML = '';
          return;
        }

        tabel.innerHTML = paginatedData.map(a => {
          const jenisKelamin = a.jenis_kelamin === 'L' ? 'Laki-laki' : a.jenis_kelamin === 'P' ? 'Perempuan' : a.jenis_kelamin;
          
          return `
            <tr class="hover:bg-gray-50">
              <td class="px-6 py-4 text-sm text-gray-700">${a.id_anggota}</td>
              <td class="px-6 py-4 text-sm font-medium text-gray-900">${a.nama_anggota}</td>
              <td class="px-6 py-4 text-sm text-gray-700">${a.username}</td>
              <td class="px-6 py-4 text-sm text-gray-700">${jenisKelamin}</td>
              <td class="px-6 py-4 text-sm text-gray-700 max-w-xs">${a.alamat || "-"}</td>
              <td class="px-6 py-4 text-sm">
                <button class="text-blue-600 hover:text-blue-800 mr-3">
                  <i class="fas fa-edit"></i> Edit
                </button>
                <button class="text-red-600 hover:text-red-800 btn-delete" data-id="${a.id_anggota}">
                  <i class="fas fa-trash"></i> Hapus
                </button>
              </td>
            </tr>
          `;
        }).join('');

        // Info hasil filter
        const infoText = document.createElement('div');
        infoText.className = 'text-sm text-gray-600 mb-4';
        infoText.innerHTML = `
          Menampilkan ${paginatedData.length} dari ${filteredData.length} anggota 
          ${searchTerm ? `dengan kata kunci "${searchTerm}"` : ''}
          ${filterJenisKelamin ? `(Jenis Kelamin: ${filterJenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan'})` : ''}
        `;
        tabel.parentNode.insertBefore(infoText, tabel);

        // Render pagination
        renderPagination(totalPages);

        // Event listener tombol hapus
        tabel.querySelectorAll(".btn-delete").forEach(btn => {
          btn.addEventListener("click", async () => {
            const id = btn.dataset.id;
            const anggota = anggotaList.find(a => a.id_anggota == id);
            if (!confirm(`Hapus anggota "${anggota.nama_anggota}" dengan ID ${id}?`)) return;

            try {
              showLoading("Menghapus anggota...");
              const json = await AnggotaAPI.delete(id);
              anggotaList = anggotaList.filter(a => a.id_anggota != id);
              render();
              hasil.textContent = json.message || `Anggota "${anggota.nama_anggota}" berhasil dihapus.`;
              hasil.className = "text-green-600 text-sm font-medium";
            } catch (err) {
              console.error("Gagal menghapus anggota:", err);
              hasil.textContent = `Error: ${err.message}`;
              hasil.className = "text-red-600 text-sm font-medium";
            }
          });
        });
      };

      const loadData = async () => {
        try {
          showLoading();
          anggotaList = await AnggotaAPI.getAll();
          render();
        } catch (err) {
          console.error("Gagal memuat data anggota:", err);
          tabel.innerHTML = `
            <tr>
              <td colspan="6" class="text-center text-red-600 py-4">
                <div class="flex flex-col items-center justify-center space-y-2">
                  <i class="fas fa-exclamation-triangle text-2xl"></i>
                  <span class="font-medium">${err.message}</span>
                </div>
              </td>
            </tr>`;
        }
      };

      // Tambah anggota
      form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const anggotaData = {
          nama_anggota: form.querySelector("#nama_anggota").value,
          alamat: form.querySelector("#alamat").value,
          jenis_kelamin: form.querySelector("#jenis_kelamin").value,
          username: form.querySelector("#username").value,
          password: form.querySelector("#password").value
        };

        try {
          showLoading("Menambahkan anggota...");
          const json = await AnggotaAPI.add(anggotaData);
          anggotaList.push({
            id_anggota: json.id_anggota,
            nama_anggota: json.nama_anggota,
            username: json.username,
            jenis_kelamin: anggotaData.jenis_kelamin,
            alamat: anggotaData.alamat
          });
          render();
          hasil.textContent = "Anggota berhasil ditambahkan!";
          hasil.className = "text-green-600 text-sm font-medium";
          form.reset();
        } catch (err) {
          console.error("Gagal menambah anggota:", err);
          hasil.textContent = `Error: ${err.message}`;
          hasil.className = "text-red-600 text-sm font-medium";
        }
      });

      loadData();
    }
  };

  window.AnggotaModule = AnggotaModule;
})();