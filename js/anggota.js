(() => {
  const db = window.supabaseClient;

  if (!db) {
    console.error("Supabase client tidak ditemukan.");
    window.AnggotaModule = { init: () => alert("Supabase belum diinisialisasi!") };
    return;
  }

  let anggotaList = [];
  let currentPage = 1;
  const perPage = 5;

  const AnggotaAPI = {
    getAll: async () => {
      const { data, error } = await db.from("tbl_anggota")
        .select("*")
        .order("id_anggota", { ascending: true });

      if (error) throw error;
      return data || [];
    },

    add: async (payload) => {
      const { data, error } = await db.from("tbl_anggota").insert(payload).select().single();
      if (error) throw error;
      return data;
    },

    delete: async (id) => {
      const { error } = await db.from("tbl_anggota").delete().eq("id_anggota", id);
      if (error) throw error;
      return true;
    }
  };

  const AnggotaModule = {
    init: (formId, tabelId, hasilId, paginationId) => {
      const form = document.getElementById(formId);
      const tabel = document.getElementById(tabelId);
      const hasil = document.getElementById(hasilId);
      const pagination = document.getElementById(paginationId);

      // ---------------------------
      // VALIDASI ID (PERBAIKAN)
      // ---------------------------
      if (!paginationId) {
        console.error("paginationId belum diberikan ke .init()!");
      }

      if (!form) console.error("Form tidak ditemukan:", formId);
      if (!tabel) console.error("Tabel tidak ditemukan:", tabelId);
      if (!hasil) console.error("Hasil tidak ditemukan:", hasilId);
      if (!pagination) console.error("Pagination tidak ditemukan:", paginationId);

      if (!form || !tabel || !hasil || !pagination) {
        return;
      }

      // -------------------------
      // FIX TOTAL → gunakan ID
      // -------------------------
      const namaField = document.getElementById("nama_anggota");
      const usernameField = document.getElementById("username");
      const passwordField = document.getElementById("password");
      const jenisField = document.getElementById("jenis_kelamin");
      const alamatField = document.getElementById("alamat");

      const escapeHtml = (str) =>
        String(str || "")
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;");

      const setResult = (msg, ok = true) => {
        hasil.textContent = msg;
        hasil.className =
          ok
            ? "mt-2 text-sm font-medium text-green-600"
            : "mt-2 text-sm font-medium text-red-600";
      };

      const showLoading = (msg = "Memuat...") => {
        tabel.innerHTML = `
          <tr>
            <td colspan="6" class="text-center py-4">${msg}</td>
          </tr>`;
      };

      const render = () => {
        const totalPages = Math.max(1, Math.ceil(anggotaList.length / perPage));

        if (currentPage > totalPages) currentPage = totalPages;

        const start = (currentPage - 1) * perPage;
        const pageData = anggotaList.slice(start, start + perPage);

        if (pageData.length === 0) {
          tabel.innerHTML = `
            <tr>
              <td colspan="6" class="text-center py-4 text-gray-500">Belum ada data</td>
            </tr>`;
          pagination.innerHTML = "";
          return;
        }

        tabel.innerHTML = pageData
          .map(
            (a) => `
            <tr>
              <td class="px-4 py-2">${a.id_anggota}</td>
              <td class="px-4 py-2">${escapeHtml(a.nama_anggota)}</td>
              <td class="px-4 py-2">${escapeHtml(a.username)}</td>
              <td class="px-4 py-2">${escapeHtml(a.jenis_kelamin)}</td>
              <td class="px-4 py-2">${escapeHtml(a.alamat)}</td>
              <td class="px-4 py-2">
                <button class="btn-delete bg-red-600 text-white px-3 py-1 rounded" data-id="${a.id_anggota}">
                  Hapus
                </button>
              </td>
            </tr>`
          )
          .join("");

        // -------------------------
        // PAGINATION (Sudah FIX)
        // -------------------------
        pagination.innerHTML = "";
        for (let i = 1; i <= totalPages; i++) {
          const btn = document.createElement("button");
          btn.textContent = i;
          btn.dataset.page = i;
          btn.className =
            "px-3 py-1 rounded " +
            (i === currentPage ? "bg-blue-600 text-white" : "bg-gray-300");

          btn.onclick = () => {
            currentPage = i;
            render();
          };

          pagination.appendChild(btn);
        }
      };

      tabel.addEventListener("click", async (e) => {
        const btn = e.target.closest(".btn-delete");
        if (!btn) return;

        const id = btn.dataset.id;
        if (!confirm(`Hapus anggota ID ${id}?`)) return;

        showLoading("Menghapus...");

        await AnggotaAPI.delete(id);
        anggotaList = anggotaList.filter((a) => a.id_anggota != id);

        render();
        setResult("Berhasil menghapus!", true);
      });

      const loadData = async () => {
        showLoading();
        try {
          anggotaList = await AnggotaAPI.getAll();
          currentPage = 1;
          render();
        } catch (err) {
          tabel.innerHTML = `<tr><td colspan="6" class="text-center text-red-600">${err.message}</td></tr>`;
        }
      };

      form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const payload = {
          nama_anggota: namaField.value.trim(),
          username: usernameField.value.trim(),
          password: passwordField.value.trim(),
          jenis_kelamin: jenisField.value,
          alamat: alamatField.value.trim()
        };

        if (!payload.nama_anggota || !payload.username || !payload.password) {
          setResult("Semua field harus diisi!", false);
          return;
        }

        showLoading("Menyimpan...");

        try {
          const inserted = await AnggotaAPI.add(payload);
          anggotaList.push(inserted);
          anggotaList.sort((a, b) => a.id_anggota - b.id_anggota);

          currentPage = Math.ceil(anggotaList.length / perPage);
          render();
          setResult("Berhasil menambah atlet!", true);
          form.reset();
        } catch (err) {
          setResult("Gagal menambah: " + err.message, false);
        }
      });

      loadData();
    }
  };

  window.AnggotaModule = AnggotaModule;
})();
