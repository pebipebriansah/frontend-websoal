(() => {
  const API_BASE = "https://84fcb76e-ab21-4692-94c1-a86c2b92b808-00-2rnc2uogakcb7.pike.replit.dev";
  const perPage = 5; // jumlah data per halaman

  // 🔹 API untuk Materi
  const MateriAPI = {
    getAll: async () => {
      const res = await fetch(`${API_BASE}/admin/materi`);
      if (!res.ok) throw new Error(`Gagal memuat materi (${res.status})`);
      const json = await res.json();
      console.log("📦 Data Materi dari API:", json);
      // Sesuaikan karena data berada di dalam "data"
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
      console.log("✅ Materi baru:", json);
      // Tangkap id_materi dari berbagai kemungkinan struktur
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
    add: async (id_materi, description) => {
      const res = await fetch(`${API_BASE}/admin/tambah-description`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_materi, description }),
      });
      if (!res.ok) throw new Error(`Gagal menambah deskripsi (${res.status})`);
      return await res.json();
    },
  };

  // 🔹 Modul utama untuk mengelola Description Materi
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

      // 🔸 Helper tampilkan loading
      const showLoading = (msg = "Memuat...") => {
        tabel.innerHTML = `
          <tr><td colspan="4" class="text-center text-blue-600 py-4">${msg}</td></tr>
        `;
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

        tabel.innerHTML = pageData
          .map((d) => {
            const materi = materiList.find((m) => m.id_materi === d.id_materi);
            return `
              <tr class="hover:bg-gray-50">
                <td class="px-5 py-3">${d.id_description}</td>
                <td class="px-5 py-3 font-medium">${materi ? materi.nama_materi : "-"}</td>
                <td class="px-5 py-3">${d.description}</td>
                <td class="px-5 py-3 text-center text-gray-400 text-sm">#${d.id_materi}</td>
              </tr>
            `;
          })
          .join("");

        renderPagination(totalPages);
      };

      // 🔸 Render pagination
      const renderPagination = (totalPages) => {
        if (totalPages <= 1) {
          pagination.innerHTML = "";
          return;
        }

        let html = "";
        for (let i = 1; i <= totalPages; i++) {
          html += `<button class="px-3 py-1 rounded ${i === currentPage ? "bg-blue-600 text-white" : "bg-gray-200 hover:bg-gray-300"}" data-page="${i}">${i}</button>`;
        }
        pagination.innerHTML = html;

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
          showLoading("Memuat data materi & deskripsi...");
          materiList = await MateriAPI.getAll();
          descriptionList = await DescriptionAPI.getAll();

          // isi dropdown materi
          selectMateri.innerHTML = `<option value="">-- Pilih Materi --</option>`;
          if (materiList.length === 0) {
            selectMateri.innerHTML += `<option disabled>(Belum ada materi)</option>`;
          } else {
            materiList.forEach((m) => {
              const opt = document.createElement("option");
              opt.value = m.id_materi;
              opt.textContent = m.nama_materi;
              selectMateri.appendChild(opt);
            });
          }

          // tambahkan opsi untuk menambah materi baru
          const optBaru = document.createElement("option");
          optBaru.value = "new";
          optBaru.textContent = "+ Tambah Materi Baru";
          selectMateri.appendChild(optBaru);

          renderTable();
        } catch (err) {
          tabel.innerHTML = `<tr><td colspan="4" class="text-center text-red-600">${err.message}</td></tr>`;
        }
      };

      // 🔸 Event: ubah dropdown materi
      selectMateri.addEventListener("change", () => {
        if (selectMateri.value === "new") {
          containerBaru.classList.remove("hidden");
        } else {
          containerBaru.classList.add("hidden");
          namaMateriBaru.value = "";
        }
      });

      // 🔸 Event: submit form
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        hasil.textContent = "";
        hasil.className = "mt-2 text-sm font-medium text-blue-600";

        const selectedId = selectMateri.value;
        const deskripsi = document.getElementById("description").value.trim();

        if (!selectedId && !namaMateriBaru.value.trim()) {
          hasil.textContent = "Pilih materi atau buat baru terlebih dahulu.";
          hasil.className = "mt-2 text-sm font-medium text-red-600";
          return;
        }

        if (!deskripsi) {
          hasil.textContent = "Deskripsi tidak boleh kosong.";
          hasil.className = "mt-2 text-sm font-medium text-red-600";
          return;
        }

        try {
          showLoading("Menyimpan data...");
          let idMateri;

          if (selectedId === "new") {
            const materiRes = await MateriAPI.add(namaMateriBaru.value.trim());
            idMateri = materiRes.id_materi || materiRes.data?.id_materi;
            if (!idMateri) throw new Error("Gagal menambahkan materi baru.");
          } else {
            idMateri = parseInt(selectedId);
          }

          await DescriptionAPI.add(idMateri, deskripsi);

          hasil.textContent = "✅ Deskripsi berhasil disimpan!";
          hasil.className = "mt-2 text-sm font-medium text-green-700";
          form.reset();
          containerBaru.classList.add("hidden");

          await loadData();
        } catch (err) {
          hasil.textContent = `❌ ${err.message}`;
          hasil.className = "mt-2 text-sm font-medium text-red-600";
          console.error(err);
        }
      });

      loadData();
    },
  };

  window.DescriptionModule = DescriptionModule;
})();
