(() => {
  const API_BASE = "https://84fcb76e-ab21-4692-94c1-a86c2b92b808-00-2rnc2uogakcb7.pike.replit.dev";
  let nilaiList = [];

  const NilaiAPI = {
    getAll: async () => {
      const res = await fetch(`${API_BASE}/admin/nilai`);
      const json = await res.json();
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      return json.data || [];
    },
    update: async (data) => {
      const res = await fetch(`${API_BASE}/admin/update-nilai`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      const json = await res.json();
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      return json; // return response detail dari backend
    }
  };

  const NilaiModule = {
    init: () => {
      const tabel = document.getElementById("tabelNilai");
      if (!tabel) return console.error("Element tabelNilai tidak ditemukan!");

      const showLoading = (msg = "Memuat data...") => {
        tabel.innerHTML = `
          <tr>
            <td colspan="11" class="px-4 py-6 text-center text-blue-700">${msg}</td>
          </tr>`;
      };

      const render = () => {
        if (nilaiList.length === 0) {
          tabel.innerHTML = `<tr><td colspan="11" class="text-center text-gray-500 p-2">Belum ada data nilai.</td></tr>`;
          return;
        }

        tabel.innerHTML = nilaiList.map((item, i) => {
          const sudahLengkap =
            item.nilai_keseimbangan != null &&
            item.nilai_kekuatan != null &&
            item.nilai_ketahanan != null &&
            item.keterangan != null;

          return `
            <tr data-id="${item.id_nilai}">
              <td class="border p-2 text-center">${i + 1}</td>
              <td class="border p-2">${item.nama_anggota || '-'}</td>
              <td class="border p-2 text-center">${item.nilai_pengerjaan ?? '-'}</td>
              <td class="border p-2 text-center ${item.nilai_keseimbangan != null ? 'bg-gray-100' : ''}" contenteditable="${item.nilai_keseimbangan == null}">${item.nilai_keseimbangan ?? ''}</td>
              <td class="border p-2 text-center ${item.nilai_kekuatan != null ? 'bg-gray-100' : ''}" contenteditable="${item.nilai_kekuatan == null}">${item.nilai_kekuatan ?? ''}</td>
              <td class="border p-2 text-center ${item.nilai_ketahanan != null ? 'bg-gray-100' : ''}" contenteditable="${item.nilai_ketahanan == null}">${item.nilai_ketahanan ?? ''}</td>
              <td class="border p-2 text-center ${item.keterangan != null ? 'bg-gray-100' : ''}" contenteditable="${item.keterangan == null}">${item.keterangan ?? ''}</td>
              <td class="border p-2 text-center">${item.waktu_pengerjaan ?? '-'}</td>
              <td class="border p-2 text-center">${item.status ?? '-'}</td>
              <td class="border p-2 text-center">
                <button class="updateBtn ${sudahLengkap ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} text-white px-2 py-1 rounded text-sm" ${sudahLengkap ? 'disabled' : ''}>
                  Update
                </button>
              </td>
            </tr>`;
        }).join('');

        // Update handler
        tabel.querySelectorAll(".updateBtn").forEach(btn => {
          btn.addEventListener("click", async (e) => {
            const row = e.target.closest("tr");
            const id_nilai = Number(row.dataset.id);

            const payload = {
              id_nilai,
              nilai_keseimbangan: row.children[3].textContent.trim() || null,
              nilai_kekuatan: row.children[4].textContent.trim() || null,
              nilai_ketahanan: row.children[5].textContent.trim() || null,
              keterangan: row.children[6].textContent.trim() || null
            };

            try {
              showLoading("Menyimpan pembaruan...");
              const updated = await NilaiAPI.update(payload);

              // Ambil data terbaru dari backend setelah update
              await new Promise(res => setTimeout(res, 500)); // beri waktu backend menulis DB
              nilaiList = await NilaiAPI.getAll();
              render();

              alert(`✅ Data anggota "${row.children[1].textContent}" berhasil diperbarui!`);
            } catch (err) {
              console.error("Gagal update nilai:", err);
              alert("Gagal update nilai. Cek console untuk detail.");
            }
          });
        });
      };

      const loadData = async () => {
        showLoading();
        nilaiList = await NilaiAPI.getAll();
        render();
      };

      loadData();
    }
  };

  window.NilaiModule = NilaiModule;
})();
