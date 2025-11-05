(() => {
  const API_BASE = "https://84fcb76e-ab21-4692-94c1-a86c2b92b808-00-2rnc2uogakcb7.pike.replit.dev";

  let anggotaList = [];

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
    init: (formId, tabelId, hasilId) => {
      const form = document.getElementById(formId);
      const tabel = document.getElementById(tabelId);
      const hasil = document.getElementById(hasilId);

      if (!form || !tabel || !hasil) {
        console.error("Form, tabel, atau hasil tidak ditemukan!");
        return;
      }

      // --- Loading Spinner ---
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

      const render = () => {
        if (anggotaList.length === 0) {
          tabel.innerHTML = `
            <tr>
              <td colspan="6" class="px-4 py-4 text-center text-gray-500">Belum ada data anggota.</td>
            </tr>
          `;
          return;
        }

        tabel.innerHTML = anggotaList.map(a => `
          <tr class="hover:bg-gray-50 transition">
            <td class="px-4 py-2">${a.id_anggota}</td>
            <td class="px-4 py-2">${a.nama_anggota}</td>
            <td class="px-4 py-2">${a.username}</td>
            <td class="px-4 py-2">${a.jenis_kelamin}</td>
            <td class="px-4 py-2">${a.alamat}</td>
            <td class="px-4 py-2 text-center">
              <button class="bg-red-600 text-white px-3 py-1 rounded btn-delete" data-id="${a.id_anggota}">
                Hapus
              </button>
            </td>
          </tr>
        `).join('');
      };

      // --- Delegasi tombol hapus ---
      tabel.addEventListener("click", async (e) => {
        if (!e.target.classList.contains("btn-delete")) return;
        const id = e.target.dataset.id;
        if (!confirm(`Hapus anggota dengan ID ${id}?`)) return;

        try {
          showLoading("Menghapus anggota...");
          const json = await AnggotaAPI.delete(id);
          anggotaList = anggotaList.filter(a => a.id_anggota != id);
          render();
          hasil.textContent = json.message || `Anggota dengan ID ${id} berhasil dihapus.`;
          hasil.className = "text-green-700 mt-2 font-medium";
        } catch (err) {
          console.error("Gagal menghapus anggota:", err);
          hasil.textContent = `Error: ${err.message}`;
          hasil.className = "text-red-600 mt-2 font-medium";
        }
      });

      const loadData = async () => {
        try {
          showLoading();
          anggotaList = await AnggotaAPI.getAll();
          render();
        } catch (err) {
          console.error("Gagal memuat data anggota:", err);
          tabel.innerHTML = `<tr><td colspan="6" class="text-center text-red-600">${err.message}</td></tr>`;
        }
      };

      // --- Tambah anggota ---
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
            id_anggota: json.id_anggota || Date.now(),
            nama_anggota: json.nama_anggota || anggotaData.nama_anggota,
            username: json.username || anggotaData.username,
            jenis_kelamin: anggotaData.jenis_kelamin,
            alamat: anggotaData.alamat
          });
          render();
          hasil.textContent = "Anggota berhasil ditambahkan!";
          hasil.className = "text-green-700 mt-2 font-medium";
          form.reset();
        } catch (err) {
          console.error("Gagal menambah anggota:", err);
          hasil.textContent = `Error: ${err.message}`;
          hasil.className = "text-red-600 mt-2 font-medium";
        }
      });

      loadData();
    }
  };

  window.AnggotaModule = AnggotaModule;
})();
