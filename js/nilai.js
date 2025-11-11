(() => {
  const API_BASE = "https://84fcb76e-ab21-4692-94c1-a86c2b92b808-00-2rnc2uogakcb7.pike.replit.dev";
  let nilaiList = [];

  const NilaiAPI = {
    getAll: async () => {
      const res = await fetch(`${API_BASE}/admin/nilai`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const json = await res.json();
      if (!json.data || !Array.isArray(json.data)) throw new Error("Response API tidak sesuai format");
      return json.data;
    },
    update: async (data) => {
      const res = await fetch(`${API_BASE}/admin/update-nilai`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return await res.json();
    }
  };

  const NilaiModule = {
    init: () => {
      const tabel = document.getElementById("tabelNilai");
      if (!tabel) return console.error("Element tabelNilai tidak ditemukan!");

      // Fungsi spinner di tengah tabel
      const showLoading = (message = "Memuat data...") => {
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
      };

      const render = () => {
        if (nilaiList.length === 0) {
          tabel.innerHTML = `<tr><td colspan="10" class="text-center text-gray-500 p-2">Belum ada data nilai.</td></tr>`;
          return;
        }

        tabel.innerHTML = nilaiList.map((item, i) => {
          const editable = true; // hanya kolom tertentu yang bisa diubah
          return `
            <tr data-id="${item.id_nilai}">
              <td class="border p-2 text-center">${i + 1}</td>
              <td class="border p-2">${item.nama_anggota || '-'}</td>
              <td class="border p-2 text-center">${item.nilai_pengerjaan ?? '-'}</td>

              <!-- Kolom editable -->
              <td class="border p-2 text-center" contenteditable="${editable}">${item.nilai_keseimbangan ?? ''}</td>
              <td class="border p-2 text-center" contenteditable="${editable}">${item.nilai_kekuatan ?? ''}</td>
              <td class="border p-2 text-center" contenteditable="${editable}">${item.nilai_ketahanan ?? ''}</td>
              <td class="border p-2 text-center" contenteditable="${editable}">${item.keterangan ?? ''}</td>

              <td class="border p-2 text-center">${item.waktu_pengerjaan ?? '-'}</td>
              <td class="border p-2 text-center">${item.status ?? '-'}</td>
              <td class="border p-2 text-center">
                <button class="updateBtn bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 text-sm">
                  Update
                </button>
              </td>
            </tr>
          `;
        }).join('');

        // Event listener untuk tombol update
        tabel.querySelectorAll(".updateBtn").forEach(btn => {
          btn.addEventListener("click", async (e) => {
            const row = e.target.closest("tr");
            const id_nilai = row.dataset.id;

            // Ambil data dari kolom (sesuai urutan tabel)
            const nilai_keseimbangan = row.children[3].textContent.trim() || null;
            const nilai_kekuatan = row.children[4].textContent.trim() || null;
            const nilai_ketahanan = row.children[5].textContent.trim() || null;
            const keterangan = row.children[6].textContent.trim() || null;

            const payload = {
              id_nilai: Number(id_nilai),
              nilai_keseimbangan: nilai_keseimbangan ? Number(nilai_keseimbangan) : null,
              nilai_kekuatan: nilai_kekuatan ? Number(nilai_kekuatan) : null,
              nilai_ketahanan: nilai_ketahanan ? Number(nilai_ketahanan) : null,
              keterangan: keterangan || null
            };

            try {
              showLoading("Mengupdate nilai...");
              await NilaiAPI.update(payload);
              await loadData();
              alert(`✅ Nilai anggota "${row.children[1].textContent}" berhasil diperbarui!`);
            } catch (err) {
              console.error("Gagal update nilai:", err);
              alert("❌ Gagal update nilai. Lihat console.");
            }
          });
        });
      };

      const loadData = async () => {
        try {
          showLoading();
          nilaiList = await NilaiAPI.getAll();
          render();
        } catch (err) {
          console.error("Gagal memuat data nilai:", err);
          tabel.innerHTML = `<tr><td colspan="10" class="text-center text-red-600 p-2">Gagal memuat data. Lihat console.</td></tr>`;
        }
      };

      loadData();
    }
  };

  window.NilaiModule = NilaiModule;
})();
