(() => {
  const API_BASE = "https://84fcb76e-ab21-4692-94c1-a86c2b92b808-00-2rnc2uogakcb7.pike.replit.dev";

  const DashboardModule = {
    init: async () => {
      const anggotaEl = document.getElementById("totalAnggota");
      const soalEl = document.getElementById("totalSoal");
      const rataEl = document.getElementById("rataNilai");

      if (!anggotaEl || !soalEl || !rataEl) {
        console.error("Elemen dashboard tidak ditemukan!");
        return;
      }

      try {
        // Ambil total anggota
        const resAnggota = await fetch(`${API_BASE}/admin/statistik/anggota`);
        const dataAnggota = await resAnggota.json();
        anggotaEl.textContent = dataAnggota.total_anggota ?? 0;

        // Ambil total soal
        const resSoal = await fetch(`${API_BASE}/admin/statistik/soal`);
        const dataSoal = await resSoal.json();
        soalEl.textContent = dataSoal.total_soal ?? 0;

        // Ambil rata-rata nilai
        const resNilai = await fetch(`${API_BASE}/admin/statistik/nilai`);
        const dataNilai = await resNilai.json();
        rataEl.textContent = Math.round(dataNilai.rata_rata_nilai ?? 0);

      } catch (err) {
        console.error("Gagal memuat data dashboard:", err);
        anggotaEl.textContent = "-";
        soalEl.textContent = "-";
        rataEl.textContent = "-";
      }
    }
  };

  window.DashboardModule = DashboardModule;
})();
