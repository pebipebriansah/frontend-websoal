(() => {

  // ===============================
  // SUPABASE INIT
  // ===============================
  const supabase = window.supabase.createClient(
    "https://cwjjqubiuzdstxmtemxa.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3ampxdWJpdXpkc3R4bXRlbXhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyMTk3ODcsImV4cCI6MjA5NDc5NTc4N30.s5ndWn0PRdzKZ8yAIbUJyChWCEKIcz1tu-fCEqELsw0"
  );

  const TABLE_DESC = "tbl_description_materi";
  const TABLE_MATERI = "tbl_materi";
  const BUCKET = "materi-file";

  // ===============================
  // STATE
  // ===============================
  let materiList = [];
  let descriptionList = [];

  let mode = "insert"; // insert | update
  let currentDescriptionId = null;

  const $ = id => document.getElementById(id);

  // ===============================
  // UPLOAD FILE → STORAGE
  // ===============================
  async function uploadFile(file, folder) {
    if (!file) return null;

    const fileName =
      `${folder}/${Date.now()}-${file.name.replace(/\s+/g, "_")}`;

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(fileName, file);

    if (error) {
      console.error("Upload error:", error);
      return null;
    }

    const { data } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(fileName);

    return data.publicUrl;
  }

  // ===============================
  // LOAD MATERI
  // ===============================
  async function loadMateri() {
    const { data, error } = await supabase
      .from(TABLE_MATERI)
      .select("id_materi, nama_materi")
      .order("nama_materi");

    if (error) return console.error(error);

    materiList = data || [];
    renderMateriSelect();
  }

  function renderMateriSelect() {
    const select = $("selectMateri");
    select.innerHTML = `<option value="">-- Pilih Materi --</option>`;

    materiList.forEach(m => {
      select.innerHTML += `
        <option value="${m.id_materi}">
          ${m.nama_materi}
        </option>`;
    });

    select.onchange = onMateriChange;
  }

  // ===============================
  // SAAT MATERI DIPILIH
  // ===============================
  async function onMateriChange(e) {
    resetForm(false);
    const idMateri = e.target.value;
    if (!idMateri) return;

    const { data } = await supabase
      .from(TABLE_DESC)
      .select("*")
      .eq("id_materi", idMateri)
      .maybeSingle();

    if (!data) {
      mode = "insert";
      currentDescriptionId = null;
      return;
    }

    // MODE UPDATE
    mode = "update";
    currentDescriptionId = data.id_description;

    $("description").value = data.description || "";
    $("idDescription").value = data.id_description;

    // PREVIEW IMAGE
    if (data.image_file) {
      $("previewImage").src = data.image_file;
      $("previewImage").classList.remove("hidden");
    }

    // PREVIEW AUDIO
    if (data.voice_file) {
      $("previewVoice").src = data.voice_file;
      $("previewVoice").classList.remove("hidden");
    }
  }

  // ===============================
  // SUBMIT FORM
  // ===============================
  async function submitDescription(e) {
    e.preventDefault();

    const idMateri = $("selectMateri").value;
    const description = $("description").value.trim();

    if (!idMateri || !description) {
      alert("Materi & deskripsi wajib diisi");
      return;
    }

    const imgFile = $("imageFile").files[0];
    const voiceFile = $("voiceFile").files[0];

    const payload = {
      id_materi: idMateri,
      description
    };

    if (imgFile) payload.image_file = await uploadFile(imgFile, "image");
    if (voiceFile) payload.voice_file = await uploadFile(voiceFile, "voice");

    let res;
    if (mode === "update") {
      res = await supabase
        .from(TABLE_DESC)
        .update(payload)
        .eq("id_description", currentDescriptionId);
    } else {
      res = await supabase
        .from(TABLE_DESC)
        .insert(payload);
    }

    if (res.error) {
      console.error(res.error);
      alert("Gagal menyimpan data");
      return;
    }

    alert("Data berhasil disimpan");
    resetForm();
    loadDescriptions();
  }

  // ===============================
  // RESET FORM
  // ===============================
  function resetForm(clearSelect = true) {
    $("description").value = "";
    $("imageFile").value = "";
    $("voiceFile").value = "";
    $("idDescription").value = "";

    $("previewImage").classList.add("hidden");
    $("previewVoice").classList.add("hidden");

    if (clearSelect) $("selectMateri").value = "";

    mode = "insert";
    currentDescriptionId = null;
  }

  // ===============================
  // LOAD TABLE
  // ===============================
  async function loadDescriptions() {
    const { data, error } = await supabase
      .from(TABLE_DESC)
      .select(`
        id_description,
        description,
        image_file,
        voice_file,
        materi:tbl_materi!tbl_description_materi_id_materi_fkey(nama_materi)
      `)
      .order("id_description", { ascending: false });

    if (error) return console.error(error);

    descriptionList = data || [];
    renderTable();
  }

  function renderTable() {
    const tabel = $("tabelDescription");

    if (descriptionList.length === 0) {
      tabel.innerHTML = `
        <tr>
          <td colspan="6" class="text-center py-6 text-gray-400">
            Belum ada data
          </td>
        </tr>`;
      return;
    }

    tabel.innerHTML = descriptionList.map(d => `
      <tr class="border-t">
        <td class="px-4 py-2">${d.id_description}</td>
        <td class="px-4 py-2">${d.materi?.nama_materi}</td>
        <td class="px-4 py-2">${d.description}</td>

        <td class="px-4 py-2">
          ${d.image_file
            ? `<img src="${d.image_file}" class="w-24 rounded">`
            : "-"}
        </td>

        <td class="px-4 py-2">
          ${d.voice_file
            ? `<audio controls class="w-40">
                <source src="${d.voice_file}">
               </audio>`
            : "-"}
        </td>

        <td class="px-4 py-2 text-gray-400">Auto</td>
      </tr>
    `).join("");
  }

  // ===============================
  // INIT
  // ===============================
  window.initDescription = async () => {
    $("formDescription").addEventListener("submit", submitDescription);

    $("imageFile").onchange = e => {
      const file = e.target.files[0];
      if (!file) return;
      $("previewImage").src = URL.createObjectURL(file);
      $("previewImage").classList.remove("hidden");
    };

    $("voiceFile").onchange = e => {
      const file = e.target.files[0];
      if (!file) return;
      $("previewVoice").src = URL.createObjectURL(file);
      $("previewVoice").classList.remove("hidden");
    };

    await loadMateri();
    await loadDescriptions();
  };

})();
