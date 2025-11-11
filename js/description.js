(() => {
  const API_BASE = "https://84fcb76e-ab21-4692-94c1-a86c2b92b808-00-2rnc2uogakcb7.pike.replit.dev";
  const perPage = 5;

  const MateriAPI = {
    getAll: async () => {
      const res = await fetch(`${API_BASE}/admin/materi`);
      const json = await res.json();
      return json.data || [];
    },
    add: async (nama_materi) => {
      const res = await fetch(`${API_BASE}/admin/tambah-materi`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nama_materi }),
      });
      return await res.json();
    },
  };

  const DescriptionAPI = {
    getAll: async () => {
      const res = await fetch(`${API_BASE}/admin/description`);
      const json = await res.json();
      return json.data || [];
    },
    add: async (id_materi, description) => {
      const res = await fetch(`${API_BASE}/admin/tambah-description`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_materi, description }),
      });
      return await res.json();
    },
    update: async (id_description, description) => {
      const res = await fetch(`${API_BASE}/admin/update-description`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_description, description }),
      });
      return await res.json();
    },
  };

  const DescriptionModule = {
    init: (formId, selectId, inputBaruId, containerBaruId, tabelId, hasilId, paginationId) => {
      const form = document.getElementById(formId);
      const selectMateri = document.getElementById(selectId);
      const namaMateriBaru = document.getElementById(inputBaruId);
      const containerBaru = document.getElementById(containerBaruId);
      const tabel = document.getElementById(tabelId);
      const hasil = document.getElementById(hasilId);
      const pagination = document.getElementById(paginationId);
      const textarea = document.getElementById("description");
      const btnSubmit = document.getElementById("btnSubmit");
      const btnCancel = document.getElementById("btnCancel");
      const idDescription = document.getElementById("idDescription");

      let materiList = [];
      let descriptionList = [];
      let currentPage = 1;

      const showLoading = (msg = "Memuat...") => {
        tabel.innerHTML = `<tr><td colspan="4" class="text-center py-4 text-blue-600">${msg}</td></tr>`;
      };

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

        tabel.innerHTML = pageData.map(d => {
          const materi = materiList.find(m => m.id_materi === d.id_materi);
          return `
            <tr class="hover:bg-gray-50">
              <td class="px-5 py-3">${d.id_description}</td>
              <td class="px-5 py-3 font-medium">${materi ? materi.nama_materi : "-"}</td>
              <td class="px-5 py-3">${d.description}</td>
              <td class="px-5 py-3 text-center text-gray-400 text-sm">#${d.id_materi}</td>
            </tr>
          `;
        }).join("");
      };

      const loadData = async () => {
        try {
          showLoading("Memuat data...");
          materiList = await MateriAPI.getAll();
          descriptionList = await DescriptionAPI.getAll();

          selectMateri.innerHTML = `<option value="">-- Pilih Materi --</option>`;
          materiList.forEach(m => {
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

      // 🔹 Saat user memilih materi
      selectMateri.addEventListener("change", () => {
        const selectedId = selectMateri.value;

        if (selectedId === "new") {
          containerBaru.classList.remove("hidden");
          textarea.value = "";
          idDescription.value = "";
          btnSubmit.textContent = "Simpan Description";
          btnSubmit.classList.remove("bg-green-600");
          btnSubmit.classList.add("bg-blue-600");
          btnCancel.classList.add("hidden");
          return;
        }

        containerBaru.classList.add("hidden");

        // Cek apakah materi ini sudah punya deskripsi
        const existing = descriptionList.find(d => d.id_materi === parseInt(selectedId));

        if (existing) {
          textarea.value = existing.description;
          idDescription.value = existing.id_description;
          btnSubmit.textContent = "Update Description";
          btnSubmit.classList.remove("bg-blue-600");
          btnSubmit.classList.add("bg-green-600");
          btnCancel.classList.remove("hidden");
        } else {
          textarea.value = "";
          idDescription.value = "";
          btnSubmit.textContent = "Simpan Description";
          btnSubmit.classList.remove("bg-green-600");
          btnSubmit.classList.add("bg-blue-600");
          btnCancel.classList.add("hidden");
        }
      });

      // 🔹 Tombol batal
      btnCancel.addEventListener("click", () => {
        textarea.value = "";
        idDescription.value = "";
        selectMateri.value = "";
        btnSubmit.textContent = "Simpan Description";
        btnSubmit.classList.remove("bg-green-600");
        btnSubmit.classList.add("bg-blue-600");
        btnCancel.classList.add("hidden");
      });

      // 🔹 Submit form (simpan / update)
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        hasil.textContent = "";
        const selectedId = selectMateri.value;
        const deskripsi = textarea.value.trim();

        if (!selectedId) return (hasil.textContent = "Pilih materi terlebih dahulu!");
        if (!deskripsi) return (hasil.textContent = "Deskripsi tidak boleh kosong.");

        try {
          showLoading("Menyimpan data...");

          if (selectedId === "new") {
            const materiRes = await MateriAPI.add(namaMateriBaru.value.trim());
            const id_materi = materiRes.id_materi || materiRes.data?.id_materi;
            await DescriptionAPI.add(id_materi, deskripsi);
          } else if (idDescription.value) {
            await DescriptionAPI.update(parseInt(idDescription.value), deskripsi);
          } else {
            await DescriptionAPI.add(parseInt(selectedId), deskripsi);
          }

          hasil.textContent = "✅ Data berhasil disimpan!";
          hasil.className = "mt-2 text-green-700 font-medium";

          await loadData();

          // Reset form setelah berhasil
          form.reset();
          textarea.value = "";
          idDescription.value = "";
          btnSubmit.textContent = "Simpan Description";
          btnSubmit.classList.remove("bg-green-600");
          btnSubmit.classList.add("bg-blue-600");
          btnCancel.classList.add("hidden");
        } catch (err) {
          hasil.textContent = `❌ ${err.message}`;
          hasil.className = "mt-2 text-red-600 font-medium";
        }
      });

      loadData();
    },
  };

  window.DescriptionModule = DescriptionModule;
})();
