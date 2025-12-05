(() => {

  // -------------------------------
  // Supabase init
  // -------------------------------
  const supabase = window.supabase.createClient(
    "https://jwtrpjzlewbnqfuqqjfr.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3dHJwanpsZXdibnFmdXFxamZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzNjU2MTUsImV4cCI6MjA3OTk0MTYxNX0.9toQAPwc7Fm5bW05VOQnkArAKWQFy8Sg8QsdWqVaqCo"
  );

  const TABLE = "tbl_soal";
  const BUCKET = "soal";

  // -------------------------------
  // State
  // -------------------------------
  let dataSoal = [];
  let currentPage = 1;
  let itemsPerPage = 10;
  let totalPages = 1;

  // -------------------------------
  // Helper
  // -------------------------------
  const $ = (id) => document.getElementById(id);

  function escapeHtml(str = "") {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  // -------------------------------
  // Upload file to Supabase storage - DIUBAH
  // -------------------------------
  async function uploadFile(file, folder) {
    if (!file) {
      console.log(`File ${folder} kosong, mengembalikan null`);
      return null;
    }

    try {
      console.log(`Memulai upload ${folder}:`, file.name, file.type, file.size);

      // Validasi folder
      const validFolder = folder.toLowerCase();
      const fileName = `${validFolder}/${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 10)}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;

      console.log(`Mengupload ke: ${fileName}`);

      // Upload file
      const { data, error } = await supabase.storage
        .from(BUCKET)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error(`Error upload ${folder}:`, error);
        
        // Coba hapus spasi atau karakter aneh
        if (error.message.includes('Invalid character')) {
          const safeFileName = `${validFolder}/${Date.now()}-${Math.random()
            .toString(36)
            .substring(2, 10)}.${file.name.split('.').pop()}`;
          
          console.log(`Mencoba upload dengan nama aman: ${safeFileName}`);
          
          const { data: retryData, error: retryError } = await supabase.storage
            .from(BUCKET)
            .upload(safeFileName, file);
            
          if (retryError) {
            console.error(`Gagal upload setelah retry:`, retryError);
            return null;
          }
          
          console.log(`Upload berhasil setelah retry:`, retryData);
          
          // Get public URL
          const { data: urlData } = supabase.storage
            .from(BUCKET)
            .getPublicUrl(safeFileName);
            
          console.log(`Public URL:`, urlData.publicUrl);
          return urlData.publicUrl;
        }
        
        return null;
      }

      console.log(`Upload sukses:`, data);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(BUCKET)
        .getPublicUrl(fileName);

      console.log(`Public URL untuk ${folder}:`, urlData.publicUrl);
      return urlData.publicUrl;

    } catch (error) {
      console.error(`Exception saat upload ${folder}:`, error);
      return null;
    }
  }

  // -------------------------------
  // Ambil data dari Supabase
  // -------------------------------
  async function loadData() {
    const tabel = $("tabelSoal");
    tabel.innerHTML = `<tr><td colspan="11" class="text-center p-4">Memuat...</td></tr>`;

    const { data, error } = await supabase
      .from(TABLE)
      .select("*")
      .order("id_soal", { ascending: false });

    if (error) {
      console.error("Error loading data:", error);
      tabel.innerHTML = `<tr><td colspan="11" class="text-red-600 text-center p-4">Gagal memuat data</td></tr>`;
      return;
    }

    console.log("Data loaded:", data);
    dataSoal = data;
    totalPages = Math.max(1, Math.ceil(dataSoal.length / itemsPerPage));

    renderTable();
    renderPagination();
  }

  // -------------------------------
  // Render table
  // -------------------------------
  function renderTable() {
    const tabel = $("tabelSoal");

    const start = (currentPage - 1) * itemsPerPage;
    const pageData = dataSoal.slice(start, start + itemsPerPage);

    if (pageData.length === 0) {
      tabel.innerHTML = `<tr><td colspan="11" class="text-center p-4 text-gray-500">Belum ada data</td></tr>`;
      return;
    }

    tabel.innerHTML = pageData
      .map((item) => {
        return `
        <tr class="hover:bg-gray-50">
          <td class="px-3 py-2">${item.id_soal}</td>
          <td class="px-3 py-2">${escapeHtml(item.soal)}</td>
          <td class="px-3 py-2">
            ${item.image_file ? `<img src="${item.image_file}" class="w-20 h-20 object-cover rounded" />` : "-"}
          </td>
          <td class="px-3 py-2">
            ${item.voice_file ? `<audio controls class="w-32"><source src="${item.voice_file}"></audio>` : "-"}
          </td>
          <td class="px-3 py-2">${item.opsi_a}</td>
          <td class="px-3 py-2">${item.opsi_b}</td>
          <td class="px-3 py-2">${item.opsi_c}</td>
          <td class="px-3 py-2">${item.opsi_d}</td>
          <td class="px-3 py-2">${item.bobot_nilai}</td>
          <td class="px-3 py-2 font-semibold">${item.opsi_benar}</td>
          <td class="px-3 py-2">
            <button onclick="hapusSoal(${item.id_soal})" class="bg-red-600 text-white px-3 py-1 rounded">
              Hapus
            </button>
          </td>
        </tr>`;
      })
      .join("");
  }

  // -------------------------------
  // Pagination
  // -------------------------------
  function renderPagination() {
    const box = $("pagination");
    box.innerHTML = "";

    if (totalPages <= 1) return;

    for (let i = 1; i <= totalPages; i++) {
      const btn = document.createElement("button");
      btn.textContent = i;
      btn.className =
        "px-3 py-1 rounded border " +
        (i === currentPage ? "bg-blue-600 text-white" : "bg-gray-100");

      btn.onclick = () => {
        currentPage = i;
        renderTable();
        renderPagination();
      };

      box.appendChild(btn);
    }
  }

  // -------------------------------
  // Tambah soal - DIUBAH
  // -------------------------------
  async function tambahSoal(soalData) {
    console.log("Menambahkan soal dengan data:", soalData);
    
    const tabel = $("tabelSoal");
    tabel.innerHTML = `<tr><td colspan="11" class="text-center p-4">Menyimpan...</td></tr>`;

    const { data, error } = await supabase
      .from(TABLE)
      .insert([soalData])
      .select()
      .single();

    if (error) {
      console.error("Error inserting data:", error);
      alert("Gagal menyimpan soal: " + error.message);
      return;
    }

    console.log("Data berhasil disimpan:", data);
    dataSoal.unshift(data);
    totalPages = Math.ceil(dataSoal.length / itemsPerPage);
    currentPage = 1;

    renderTable();
    renderPagination();

    alert("Soal berhasil ditambahkan!");
  }

  // -------------------------------
  // Hapus soal
  // -------------------------------
  window.hapusSoal = async function (id) {
    if (!confirm("Hapus soal ini?")) return;

    const { error } = await supabase.from(TABLE).delete().eq("id_soal", id);

    if (error) {
      alert("Gagal menghapus soal: " + error.message);
      return;
    }

    dataSoal = dataSoal.filter((s) => s.id_soal !== id);
    totalPages = Math.ceil(dataSoal.length / itemsPerPage);

    renderTable();
    renderPagination();

    alert("Soal dihapus!");
  };

  // -------------------------------
  // INIT FORM - DIUBAH
  // -------------------------------
  window.initSoal = async function () {
    console.log("Initializing form...");

    const form = $("formSoal");
    const gambarInput = $("gambarSoal");
    const audioInput = $("audioSoal");

    // Preview gambar
    gambarInput.addEventListener("change", () => {
      const file = gambarInput.files[0];
      if (!file) {
        $("previewGambar").classList.add("hidden");
        return;
      }

      console.log("Gambar dipilih:", file.name, file.type, file.size);
      $("previewImg").src = URL.createObjectURL(file);
      $("previewGambar").classList.remove("hidden");
    });

    // Preview audio
    audioInput.addEventListener("change", () => {
      const file = audioInput.files[0];
      if (!file) {
        $("previewAudio").classList.add("hidden");
        return;
      }

      console.log("Audio dipilih:", file.name, file.type, file.size);
      $("audioPlayer").src = URL.createObjectURL(file);
      $("previewAudio").classList.remove("hidden");
    });

    // Submit form
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      console.log("Form submitted");

      // Ambil nilai form
      const soal = $("soal").value.trim();
      const opsiA = $("opsiA").value.trim();
      const opsiB = $("opsiB").value.trim();
      const opsiC = $("opsiC").value.trim();
      const opsiD = $("opsiD").value.trim();
      const bobot = Number($("bobot").value);
      const opsiBenar = $("opsiBenar").value.trim();

      const imageFile = gambarInput.files[0];
      const audioFile = audioInput.files[0];

      console.log("Data form:", { soal, opsiA, opsiB, opsiC, opsiD, bobot, opsiBenar });
      console.log("Image file:", imageFile);
      console.log("Audio file:", audioFile);

      // Validasi
      if (!soal || !opsiA || !opsiB || !opsiC || !opsiD || !opsiBenar) {
        alert("Harap isi semua field yang wajib!");
        return;
      }

      // Tampilkan loading
      const submitBtn = form.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.textContent = "Menyimpan...";
      submitBtn.disabled = true;

      try {
        // Upload file secara paralel
        const [imageUrl, audioUrl] = await Promise.all([
          uploadFile(imageFile, "image"),
          uploadFile(audioFile, "audio")
        ]);

        console.log("Upload results:", { imageUrl, audioUrl });

        // Simpan ke database
        await tambahSoal({
          soal,
          opsi_a: opsiA,
          opsi_b: opsiB,
          opsi_c: opsiC,
          opsi_d: opsiD,
          bobot_nilai: bobot,
          opsi_benar: opsiBenar,
          image_file: imageUrl,
          voice_file: audioUrl,
        });

        // Reset form
        form.reset();
        $("previewGambar").classList.add("hidden");
        $("previewAudio").classList.add("hidden");

      } catch (error) {
        console.error("Error dalam proses submit:", error);
        alert("Terjadi kesalahan: " + error.message);
      } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
      }
    });

    // Load data awal
    await loadData();
    
    console.log("Form initialized successfully");
  };

  document.addEventListener("DOMContentLoaded", loginCheck);

  function loginCheck() {
    console.log("DOM Content Loaded");
    if (typeof window.initSoal === "function") {
      window.initSoal();
    } else {
      console.error("initSoal function not found");
    }
  }

})();