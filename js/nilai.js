const NilaiModule = (() => {
  // -------------------------------
  // Supabase init
  // -------------------------------
  const supabase = window.supabase.createClient(
    "https://jwtrpjzlewbnqfuqqjfr.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3dHJwanpsZXdibnFmdXFxamZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzNjU2MTUsImV4cCI6MjA3OTk0MTYxNX0.9toQAPwc7Fm5bW05VOQnkArAKWQFy8Sg8QsdWqVaqCo"
  );

  const TABLE = "tbl_nilai"; // Ganti dengan nama tabel nilai Anda
  const TABLE_ANGGOTA = "tbl_anggota"; // Ganti dengan tabel anggota

  // State
  let dataNilai = [];

  // -------------------------------
  // Helper functions
  // -------------------------------
  const $ = (id) => document.getElementById(id);

  function formatWaktu(waktu) {
    if (!waktu) return "-";
    // Jika waktu dalam format timestamp ISO, konversi ke format yang lebih readable
    if (waktu.includes('T') && waktu.includes('Z')) {
      try {
        const date = new Date(waktu);
        return date.toLocaleDateString('id-ID') + ' ' + date.toLocaleTimeString('id-ID');
      } catch (e) {
        return waktu;
      }
    }
    return waktu;
  }

  function formatNilai(nilai) {
    if (nilai === null || nilai === undefined) return "0";
    return nilai.toString();
  }

  function getStatusByNilai(nilai) {
    if (nilai === null || nilai === undefined) {
      return "<span class='text-gray-500 font-medium'>Belum dinilai</span>";
    }
    const num = parseInt(nilai);
    if (num >= 85) return "<span class='text-green-600 font-semibold'>Sangat Baik</span>";
    if (num >= 70) return "<span class='text-blue-600 font-medium'>Baik</span>";
    if (num >= 60) return "<span class='text-yellow-600 font-medium'>Cukup</span>";
    return "<span class='text-red-600 font-medium'>Perlu Perbaikan</span>";
  }

  function getStatusBadge(nilai) {
    if (nilai === null || nilai === undefined) {
      return '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Belum</span>';
    }
    const num = parseInt(nilai);
    if (num >= 85) return '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Sangat Baik</span>';
    if (num >= 70) return '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Baik</span>';
    if (num >= 60) return '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Cukup</span>';
    return '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Perlu Perbaikan</span>';
  }

  // -------------------------------
  // Load data dari Supabase
  // -------------------------------
  async function loadData() {
    const tabel = $("tabelNilai");
    if (!tabel) return;

    tabel.innerHTML = `<tr><td colspan="6" class="text-center text-gray-500 p-4">Memuat data...</td></tr>`;

    try {
      // Ambil data nilai dengan join ke tabel anggota
      const { data, error } = await supabase
        .from(TABLE)
        .select(`
          id_nilai,
          id_anggota,
          nilai_pengerjaan,
          waktu_pengerjaan,
          anggota:${TABLE_ANGGOTA}(nama_anggota)
        `)
        .order("id_nilai", { ascending: false });

      if (error) {
        console.error("Error loading nilai:", error);
        tabel.innerHTML = `<tr><td colspan="6" class="text-center text-red-600 p-4">Gagal memuat data: ${error.message}</td></tr>`;
        return;
      }

      console.log("Data nilai loaded:", data);
      dataNilai = data || [];
      renderTable();

    } catch (error) {
      console.error("Exception loading data:", error);
      tabel.innerHTML = `<tr><td colspan="6" class="text-center text-red-600 p-4">Terjadi kesalahan: ${error.message}</td></tr>`;
    }
  }

  // -------------------------------
  // Render tabel - HANYA TAMPILAN (tidak bisa edit)
  // -------------------------------
  function renderTable() {
    const tabel = $("tabelNilai");
    if (!tabel) return;

    if (dataNilai.length === 0) {
      tabel.innerHTML = `<tr><td colspan="6" class="text-center text-gray-500 p-4">Belum ada data nilai</td></tr>`;
      return;
    }

    tabel.innerHTML = dataNilai.map((item, index) => {
      // Ambil nama anggota dari relasi
      const namaAnggota = item.anggota?.nama_anggota || `Anggota ID: ${item.id_anggota}`;
      const nilai = item.nilai_pengerjaan;
      const waktu = item.waktu_pengerjaan;
      
      return `
        <tr class="hover:bg-gray-50 border-b" data-id="${item.id_nilai}">
          <td class="p-3 text-center border-r">${index + 1}</td>
          <td class="p-3 border-r">
            <div class="font-medium">${namaAnggota}</div>
            <div class="text-xs text-gray-500">ID: ${item.id_anggota}</div>
          </td>
          <td class="p-3 text-center border-r">
            <div class="text-lg font-bold ${nilai >= 70 ? 'text-green-600' : nilai >= 60 ? 'text-yellow-600' : 'text-red-600'}">
              ${formatNilai(nilai)}
            </div>
          </td>
          <td class="p-3 border-r">
            <div class="text-sm">${formatWaktu(waktu)}</div>
          </td>
          <td class="p-3 text-center border-r">
            ${getStatusBadge(nilai)}
          </td>
          <td class="p-3 text-center">
            <button 
              onclick="NilaiModule.hapusNilai(${item.id_nilai})" 
              class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 flex items-center justify-center gap-1"
              title="Hapus data nilai"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
              </svg>
              Hapus
            </button>
          </td>
        </tr>
      `;
    }).join("");
  }

  // -------------------------------
  // Hapus nilai
  // -------------------------------
  async function hapusNilai(id) {
    if (!confirm("Apakah Anda yakin ingin menghapus data nilai ini?\n\nTindakan ini tidak dapat dibatalkan.")) {
      return;
    }

    try {
      const { error } = await supabase
        .from(TABLE)
        .delete()
        .eq('id_nilai', id);

      if (error) {
        console.error("Error deleting nilai:", error);
        alert(`Gagal menghapus data: ${error.message}`);
        return;
      }

      // Hapus dari local data
      dataNilai = dataNilai.filter(item => item.id_nilai !== id);
      
      // Re-render table
      renderTable();
      
      // Tampilkan notifikasi sukses
      showNotification("Data nilai berhasil dihapus!", "success");

    } catch (error) {
      console.error("Exception deleting nilai:", error);
      alert(`Terjadi kesalahan: ${error.message}`);
    }
  }

  // -------------------------------
  // Notifikasi
  // -------------------------------
  function showNotification(message, type = "info") {
    // Hapus notifikasi sebelumnya
    const existingNotif = document.getElementById('nilai-notification');
    if (existingNotif) existingNotif.remove();
    
    // Buat notifikasi baru
    const notif = document.createElement('div');
    notif.id = 'nilai-notification';
    const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';
    notif.className = `fixed top-4 right-4 ${bgColor} text-white px-4 py-3 rounded-lg shadow-lg z-50`;
    notif.innerHTML = `
      <div class="flex items-center">
        <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
        </svg>
        <span>${message}</span>
      </div>
    `;
    
    document.body.appendChild(notif);
    
    // Hapus otomatis setelah 3 detik
    setTimeout(() => {
      if (notif.parentNode) {
        notif.parentNode.removeChild(notif);
      }
    }, 3000);
  }

  // -------------------------------
  // Public API
  // -------------------------------
  return {
    init: function(tableId = "tabelNilai") {
      console.log("NilaiModule initialized - Read Only Mode");
      loadData();
      
      // Auto-refresh setiap 60 detik
      setInterval(() => {
        loadData();
      }, 60000);
    },
    
    hapusNilai: hapusNilai,
    
    refreshData: loadData,
    
    getData: () => dataNilai
  };
})();

// Export ke window object
window.NilaiModule = NilaiModule;