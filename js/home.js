(() => {

  // Pastikan supabase tersedia
  if (typeof supabase === "undefined") {
    console.error("Supabase belum terload! Pastikan CDN dimuat sebelum file ini.");
    return;
  }

  const supabaseClient = supabase.createClient(
    "https://cwjjqubiuzdstxmtemxa.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3ampxdWJpdXpkc3R4bXRlbXhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyMTk3ODcsImV4cCI6MjA5NDc5NTc4N30.s5ndWn0PRdzKZ8yAIbUJyChWCEKIcz1tu-fCEqELsw0"
  );

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
        // ============================
        // 1. TOTAL ANGGOTA
        // ============================
        const { count: countAnggota, error: errAnggota } =
          await supabaseClient
            .from("tbl_anggota")
            .select("*", { count: "exact", head: true });

        if (errAnggota) console.error(errAnggota);
        anggotaEl.textContent = countAnggota ?? 0;

        // ============================
        // 2. TOTAL SOAL
        // ============================
        const { count: countSoal, error: errSoal } =
          await supabaseClient
            .from("tbl_soal")
            .select("*", { count: "exact", head: true });

        if (errSoal) console.error(errSoal);
        soalEl.textContent = countSoal ?? 0;

        // ============================
        // 3. RATA-RATA NILAI
        // ============================
        const { data: nilaiData, error: errNilai } =
          await supabaseClient
            .from("tbl_nilai")
            .select("nilai_pengerjaan");

        if (errNilai) console.error(errNilai);

        if (!nilaiData?.length) {
          rataEl.textContent = 0;
        } else {
          const total = nilaiData.reduce((sum, n) => sum + n.nilai_pengerjaan, 0);
          rataEl.textContent = Math.round(total / nilaiData.length);
        }

      } catch (error) {
        console.error("Gagal memuat data dashboard:", error);
        anggotaEl.textContent = "-";
        soalEl.textContent = "-";
        rataEl.textContent = "-";
      }
    }
  };

  window.DashboardModule = DashboardModule;
})();
