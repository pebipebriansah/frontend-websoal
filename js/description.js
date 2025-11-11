(() => {
  const API_BASE = "https://84fcb76e-ab21-4692-94c1-a86c2b92b808-00-2rnc2uogakcb7.pike.replit.dev";
  const perPage = 5;

  // 🔹 API untuk Materi
  const MateriAPI = {
    getAll: async () => {
      const res = await fetch(`${API_BASE}/admin/materi`);
      if (!res.ok) throw new Error(`Gagal memuat materi (${res.status})`);
      const json = await res.json();
      return json.data || [];
    },
    add: async (nama_materi) => {
      const res = await fetch(`${API_BASE}/admin/tambah-materi`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nama_materi }),
      });
      if (!res.ok) throw new Error(`Gagal menambah materi (${res.status})`);
      const json = await res.json();
      return json.data || json;
    },
  };

  // 🔹 API untuk Description
  const DescriptionAPI = {
    getAll: async () => {
      const res = await fetch(`${API_BASE}/admin/description`);
      if (!res.ok) throw new Error(`Gagal memuat deskripsi (${res.status})`);
      const json = await res.json();
      return json.data || [];
    },
    getByMateri: async (id_materi) => {
      const res = await fetch(`${API_BASE}/admin/description/${id_materi}`);
      if (!res.ok) return null;
      const json = await res.json();
      return json.data?.[0] || null;
    },
    add: async (id_materi, description) => {
      const res = await fetch(`${API_BASE}/admin/tambah-description`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_materi, description }),
      });
      if (!res.ok) throw new Error(`Gagal menambah deskripsi (${res.status})`);
      return await res.json();
    },
    update: async (id_description, description) => {
      const res = await fetch(`${API_BASE}/admin/update-description`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_description, description }),
      });
      if (!res.ok) throw new Error(`Gagal memperbarui deskripsi (${res.status})`);
      return await res.json();
    },
  };

  // 🔹 Modul utama Description
  const DescriptionModule = {
    init: (formId, selectId, inputBaruId, containerBaruId, tabelId, hasilId, paginationId) => {
      const form = document.getElementById(formId);
      const selectMateri = document.getElementById(selectId);
      const namaMateriBaru = document.getElementById(inputBaruId);
      const containerBaru = document.getElementById(containerBaruId);
      const tabel = document.getElementById(tabelId);
      const hasil = document.getElementById(hasilId);
      const pagination = document.getElementById(paginationId);

      let materiList = [];
      let descriptionList = [];
      let currentPage = 1;
      let currentDescriptionId = null; // untuk mode update

      const showLoading = (msg = "Memuat...") => {
        tabel.innerHTML = `<tr><td colspan="4" class="text-center text-blue-600 py-4">${msg}</td></tr>`;
      };

      // 🔸 Render tabel description
      const renderTable = () => {
        const totalPages = Math.ceil(descriptionList.length / perPage);
        const start = (currentPage - 1) * perPage;
        const end = start + perPage;
        const pageData = descriptionList.slice(start, end);

        if (pageData.length === 0) {
          tabel.innerHTML = `<tr><td colspan="4" class="text-center py-4 text-gray-500">Belum ada data deskripsi.</td></tr>`;
          pagination.innerHTML = "";
          return;
        }

        tabel.innerHTML = pageData.map((d) => {
          const materi = materiList.find((m) => m.id_materi === d.id_materi);
          return `
            <tr class="hover:bg-gray-50">
              <td class="px-5 py-3">${d.id_description}</td>
              <td class="px-5 py-3 font-medium">${materi ? materi.nama_materi : "-"}</td>
              <td class="px-5 py-3">${d.description}</td>
              <td class="px-5 py-3 text-center">
                <button class="bg-yellow-500 text-white px-2 py-1 rounded" onclick="DescriptionModule.edit(${d.id_description}, ${d.id_materi}, \`${d.description}\`)">
                  Edit
                </button>
              </td>
            </tr>`;
        }).join("");

        renderPagination(totalPages);
      };

      // 🔸 Render pagination
      const renderPagination = (totalPages) => {
        if (totalPages <= 1) {
          pagination.innerHTML = "";
          return;
        }

        pagination.innerHTML = Array.from({ length: totalPages }, (_, i) => {
          const page = i + 1;
          return `<button class="px-3 py-1 rounded ${page === currentPage ? "bg-blue-600 text-white" : "bg-gray-200 hover:bg-gray-300"}" data-page="${page}">${page}</button>`;
        }).join("");

        pagination.querySelectorAll("button").forEach((btn) => {
          btn.addEventListener("click", () => {
            currentPage = parseInt(btn.dataset.page);
            renderTable();
          });
        });
      };

      // 🔸 Muat data awal
      const loadData = async () => {
        try {
          showLoading("Memuat data...");
          materiList = await MateriAPI.getAll();
          descriptionList = await DescriptionAPI.getAll();

          selectMateri.innerHTML = `<option value="">-- Pilih Materi --</option>`;
          materiList.forEach((m) => {
            const opt = document.createElement("option");
            opt.value = m.id_materi;
            opt.textContent = m.nama_materi;
            selectMateri.appendChild(opt);
          });

          const optBaru = document.createElement("option");
          optBaru.value = "new";
          optBaru.textContent = "+ Tambah Materi Baru";
          selectMateri.appendChild(optBaru);

          renderTable();
        } catch (err) {
          tabel.innerHTML = `<tr><td colspan="4" class="text-center text-red-600">${err.message}</td></tr>`;
        }
      };

      // 🔸 Cek apakah materi sudah punya deskripsi
      selectMateri.addEventListener("change", async () => {
        const selectedId = selectMateri.value;
        if (selectedId === "new") {
          containerBaru.classList.remove("hidden");
          return;
        }
        containerBaru.classList.add("hidden");

        if (!selectedId) return;

        const existing = await DescriptionAPI.getByMateri(selectedId);
        const btn = form.querySelector('button[type="submit"]');
        if (existing) {
          currentDescriptionId = existing.id_description;
          document.getElementById("description").value = existing.description;
          btn.textContent = "Update";
        } else {
          currentDescriptionId = null;
          document.getElementById("description").value = "";
          btn.textContent = "Simpan";
        }
      });

      // 🔸 Submit form (add/update)
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        hasil.textContent = "";
        const deskripsi = document.getElementById("description").value.trim();
        const selectedId = selectMateri.value;

        if (!deskripsi) {
          hasil.textContent = "Deskripsi tidak boleh kosong.";
          hasil.className = "text-red-600";
          return;
        }

        try {
          showLoading("Menyimpan data...");
          let idMateri;

          if (selectedId === "new") {
            const materiRes = await MateriAPI.add(namaMateriBaru.value.trim());
            idMateri = materiRes.id_materi || materiRes.data?.id_materi;
          } else {
            idMateri = parseInt(selectedId);
          }

          if (currentDescriptionId) {
            await DescriptionAPI.update(currentDescriptionId, deskripsi);
            hasil.textContent = "✅ Deskripsi berhasil diperbarui!";
          } else {
            await DescriptionAPI.add(idMateri, deskripsi);
            hasil.textContent = "✅ Deskripsi berhasil disimpan!";
          }

          hasil.className = "text-green-600";
          currentDescriptionId = null;
          form.reset();
          selectMateri.selectedIndex = 0;
          form.querySelector('button[type="submit"]').textContent = "Simpan";
          await loadData();
        } catch (err) {
          hasil.textContent = `❌ ${err.message}`;
          hasil.className = "text-red-600";
        }
      });

      // 🔸 Edit manual dari tabel
      DescriptionModule.edit = (idDesc, idMateri, desc) => {
        currentDescriptionId = idDesc;
        selectMateri.value = idMateri;
        document.getElementById("description").value = desc;
        form.querySelector('button[type="submit"]').textContent = "Update";
      };

      loadData();
    },
  };

  window.DescriptionModule = DescriptionModule;
})();
