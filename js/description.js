// description.js
(() => {
  console.log('Description module loading...');

  // Cek apakah Supabase tersedia
  if (!window.supabase) {
    console.error('Supabase library not loaded! Make sure to load Supabase JS before this script.');
    return;
  }

  // -------------------------------
  // Supabase init
  // -------------------------------
  const supabase = window.supabase.createClient(
    "https://jwtrpjzlewbnqfuqqjfr.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3dHJwanpsZXdibnFmdXFxamZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzNjU2MTUsImV4cCI6MjA3OTk0MTYxNX0.9toQAPwc7Fm5bW05VOQnkArAKWQFy8Sg8QsdWqVaqCo"
  );

  const TABLE_MATERI = "tbl_materi";
  const TABLE_DESCRIPTION = "tbl_description_materi";
  const BUCKET = "materi";
  const perPage = 5;

  // Helper
  const $ = (id) => {
    const element = document.getElementById(id);
    if (!element) {
      console.warn(`Element with id "${id}" not found`);
    }
    return element;
  };

  // -------------------------------
  // Upload file ke Supabase Storage
  // -------------------------------
  async function uploadFile(file, folderType) {
    if (!file) {
      console.log(`No ${folderType} file provided`);
      return null;
    }

    try {
      console.log(`Uploading ${folderType}:`, file.name);

      const folderName = folderType === 'image' ? 'images' : 'audio';
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 10);
      const fileExt = file.name.split('.').pop().toLowerCase();
      const fileName = `${folderName}/${timestamp}_${randomStr}.${fileExt}`;

      console.log(`Upload path: ${fileName}`);

      // Upload ke storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error(`Upload failed:`, uploadError);
        return null;
      }

      console.log(`Upload successful:`, uploadData);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(BUCKET)
        .getPublicUrl(fileName);

      const publicUrl = urlData?.publicUrl;
      console.log(`Public URL:`, publicUrl);

      return publicUrl;

    } catch (error) {
      console.error(`Exception in upload:`, error);
      return null;
    }
  }

  // -------------------------------
  // Materi Module
  // -------------------------------
  const MateriModule = {
    // State
    materiList: [],
    descriptionList: [],
    currentPage: 1,
    totalPages: 1,

    // Initialize
    init: function() {
      console.log('MateriModule.init() called');
      
      // Cek apakah elemen form ada
      const form = $("formDescription");
      if (!form) {
        console.error('Form element with id "formDescription" not found!');
        
        // Tampilkan error di halaman
        const tabel = $("tabelDescription");
        if (tabel) {
          tabel.innerHTML = `
            <tr>
              <td colspan="6" class="px-5 py-8 text-center text-red-600">
                <div class="flex flex-col items-center justify-center">
                  <svg class="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.698-.833-2.464 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                  </svg>
                  Form element tidak ditemukan. Periksa struktur HTML.
                </div>
              </td>
            </tr>
          `;
        }
        return;
      }

      console.log('Form found, setting up event listeners...');

      // Setup event listeners
      this.setupEventListeners();
      
      // Load initial data
      this.loadInitialData();
    },

    // Setup semua event listeners
    setupEventListeners: function() {
      const form = $("formDescription");
      const selectMateri = $("selectMateri");
      const containerBaru = $("containerMateriBaru");
      const btnCancel = $("btnCancel");
      const btnSubmit = $("btnSubmit");
      const imageFileInput = $("image_file");
      const voiceFileInput = $("voice_file");
      const previewImage = $("previewImage");
      const previewVoice = $("previewVoice");

      // Preview file input changes
      if (imageFileInput) {
        imageFileInput.addEventListener("change", function() {
          const file = this.files[0];
          if (previewImage) {
            previewImage.textContent = file 
              ? `File: ${file.name} (${(file.size / 1024).toFixed(1)} KB)` 
              : "Belum ada file yang dipilih";
          }
        });
      }

      if (voiceFileInput) {
        voiceFileInput.addEventListener("change", function() {
          const file = this.files[0];
          if (previewVoice) {
            previewVoice.textContent = file 
              ? `File: ${file.name} (${(file.size / 1024).toFixed(1)} KB)` 
              : "Belum ada file yang dipilih";
          }
        });
      }

      // Handle materi select change
      if (selectMateri) {
        selectMateri.addEventListener("change", function() {
          if (this.value === "new" && containerBaru) {
            containerBaru.classList.remove("hidden");
            const descriptionField = $("description");
            const idDescriptionField = $("idDescription");
            if (descriptionField) descriptionField.value = "";
            if (idDescriptionField) idDescriptionField.value = "";
            if (btnSubmit) {
              btnSubmit.textContent = "Simpan Description";
              btnSubmit.classList.remove("bg-green-600");
              btnSubmit.classList.add("bg-blue-600");
            }
            if (btnCancel) btnCancel.classList.add("hidden");
          } else if (containerBaru) {
            containerBaru.classList.add("hidden");
          }
        });
      }

      // Cancel button
      if (btnCancel) {
        btnCancel.addEventListener("click", function() {
          if (form) form.reset();
          if (containerBaru) containerBaru.classList.add("hidden");
          if (previewImage) previewImage.textContent = "Belum ada file yang dipilih";
          if (previewVoice) previewVoice.textContent = "Belum ada file yang dipilih";
          if (btnSubmit) {
            btnSubmit.textContent = "Simpan Description";
            btnSubmit.classList.remove("bg-green-600");
            btnSubmit.classList.add("bg-blue-600");
          }
          if (btnCancel) btnCancel.classList.add("hidden");
        });
      }

      // Form submit
      if (form) {
        form.addEventListener("submit", async (e) => {
          e.preventDefault();
          
          const selectedMateri = selectMateri ? selectMateri.value : "";
          const description = $("description") ? $("description").value.trim() : "";
          const idDescription = $("idDescription") ? $("idDescription").value : "";
          const namaMateriBaru = $("namaMateriBaru") ? $("namaMateriBaru").value.trim() : "";
          const hasil = $("hasil");

          // Reset hasil
          if (hasil) {
            hasil.textContent = "";
            hasil.className = "mt-2 text-sm font-medium";
          }

          // Validasi
          if (!selectedMateri) {
            if (hasil) {
              hasil.textContent = "Pilih materi terlebih dahulu!";
              hasil.classList.add("text-red-600");
            }
            return;
          }

          if (!description) {
            if (hasil) {
              hasil.textContent = "Deskripsi tidak boleh kosong!";
              hasil.classList.add("text-red-600");
            }
            return;
          }

          if (selectedMateri === "new" && !namaMateriBaru) {
            if (hasil) {
              hasil.textContent = "Nama materi baru tidak boleh kosong!";
              hasil.classList.add("text-red-600");
            }
            return;
          }

          // Disable submit button
          if (btnSubmit) {
            const originalText = btnSubmit.textContent;
            btnSubmit.textContent = "Menyimpan...";
            btnSubmit.disabled = true;
          }

          try {
            await this.handleFormSubmit(selectedMateri, description, idDescription, namaMateriBaru);
          } catch (error) {
            console.error("Submit error:", error);
            if (hasil) {
              hasil.textContent = `❌ Error: ${error.message}`;
              hasil.classList.add("text-red-600");
            }
          } finally {
            // Re-enable submit button
            if (btnSubmit) {
              btnSubmit.textContent = "Simpan Description";
              btnSubmit.disabled = false;
            }
          }
        });
      }
    },

    // Handle form submit
    handleFormSubmit: async function(selectedMateri, description, idDescription, namaMateriBaru) {
      let materiId = selectedMateri;

      // Jika menambah materi baru
      if (selectedMateri === "new") {
        const newMateri = await this.addMateri(namaMateriBaru);
        materiId = newMateri.id_materi;
      }

      // Upload files
      const imageFile = $("image_file") ? $("image_file").files[0] : null;
      const voiceFile = $("voice_file") ? $("voice_file").files[0] : null;

      const [imageUrl, voiceUrl] = await Promise.all([
        uploadFile(imageFile, "image"),
        uploadFile(voiceFile, "audio")
      ]);

      const descriptionData = {
        id_materi: materiId,
        description: description,
        image_file: imageUrl,
        voice_file: voiceUrl
      };

      let result;
      if (idDescription) {
        // Update existing
        result = await this.updateDescription(idDescription, descriptionData);
        if ($("hasil")) {
          $("hasil").textContent = "✅ Deskripsi berhasil diperbarui!";
          $("hasil").className = "mt-2 text-sm font-medium text-green-600";
        }
      } else {
        // Add new
        result = await this.addDescription(descriptionData);
        if ($("hasil")) {
          $("hasil").textContent = "✅ Deskripsi berhasil disimpan!";
          $("hasil").className = "mt-2 text-sm font-medium text-green-600";
        }
      }

      // Refresh data
      await this.loadInitialData();

      // Reset form
      const form = $("formDescription");
      if (form) form.reset();
      
      const containerBaru = $("containerMateriBaru");
      if (containerBaru) containerBaru.classList.add("hidden");
      
      const previewImage = $("previewImage");
      if (previewImage) previewImage.textContent = "Belum ada file yang dipilih";
      
      const previewVoice = $("previewVoice");
      if (previewVoice) previewVoice.textContent = "Belum ada file yang dipilih";
      
      const btnSubmit = $("btnSubmit");
      if (btnSubmit) {
        btnSubmit.textContent = "Simpan Description";
        btnSubmit.classList.remove("bg-green-600");
        btnSubmit.classList.add("bg-blue-600");
      }
      
      const btnCancel = $("btnCancel");
      if (btnCancel) btnCancel.classList.add("hidden");
      
      return result;
    },

    // Load semua materi
    loadMateri: async function() {
      try {
        const { data, error } = await supabase
          .from(TABLE_MATERI)
          .select("*")
          .order("id_materi", { ascending: false });

        if (error) throw error;
        
        this.materiList = data || [];
        return this.materiList;
      } catch (error) {
        console.error("Error loading materi:", error);
        return [];
      }
    },

    // Tambah materi baru
    addMateri: async function(nama_materi) {
      try {
        const { data, error } = await supabase
          .from(TABLE_MATERI)
          .insert([{ nama_materi }])
          .select()
          .single();

        if (error) throw error;
        return data;
      } catch (error) {
        console.error("Error adding materi:", error);
        throw error;
      }
    },

    // Load semua description dengan join materi
    loadDescriptions: async function() {
      try {
        const { data, error } = await supabase
          .from(TABLE_DESCRIPTION)
          .select(`
            *,
            materi:${TABLE_MATERI}(nama_materi)
          `)
          .order("id_description", { ascending: false });

        if (error) throw error;
        
        this.descriptionList = data || [];
        this.totalPages = Math.ceil(this.descriptionList.length / perPage);
        return this.descriptionList;
      } catch (error) {
        console.error("Error loading descriptions:", error);
        return [];
      }
    },

    // Tambah description baru
    addDescription: async function(descriptionData) {
      try {
        const { data, error } = await supabase
          .from(TABLE_DESCRIPTION)
          .insert([descriptionData])
          .select()
          .single();

        if (error) throw error;
        return data;
      } catch (error) {
        console.error("Error adding description:", error);
        throw error;
      }
    },

    // Update description
    updateDescription: async function(id_description, descriptionData) {
      try {
        const { data, error } = await supabase
          .from(TABLE_DESCRIPTION)
          .update(descriptionData)
          .eq("id_description", id_description)
          .select()
          .single();

        if (error) throw error;
        return data;
      } catch (error) {
        console.error("Error updating description:", error);
        throw error;
      }
    },

    // Delete description
    deleteDescription: async function(id_description) {
      if (!confirm("Apakah Anda yakin ingin menghapus deskripsi ini?")) {
        return;
      }

      try {
        const { error } = await supabase
          .from(TABLE_DESCRIPTION)
          .delete()
          .eq("id_description", id_description);

        if (error) throw error;

        // Refresh data
        await this.loadInitialData();
        
        alert("Deskripsi berhasil dihapus!");
      } catch (error) {
        console.error("Error deleting description:", error);
        alert("Gagal menghapus: " + error.message);
      }
    },

    // Edit description
    editDescription: async function(id_description) {
      try {
        const { data, error } = await supabase
          .from(TABLE_DESCRIPTION)
          .select(`
            *,
            materi:${TABLE_MATERI}(nama_materi)
          `)
          .eq("id_description", id_description)
          .single();

        if (error) throw error;

        if (data) {
          // Isi form dengan data yang akan diedit
          const selectMateri = $("selectMateri");
          const descriptionField = $("description");
          const idDescriptionField = $("idDescription");
          const btnSubmit = $("btnSubmit");
          const btnCancel = $("btnCancel");
          const containerBaru = $("containerMateriBaru");

          if (selectMateri) selectMateri.value = data.id_materi;
          if (descriptionField) descriptionField.value = data.description || "";
          if (idDescriptionField) idDescriptionField.value = data.id_description;
          
          // Tampilkan tombol update
          if (btnSubmit) {
            btnSubmit.textContent = "Update Description";
            btnSubmit.classList.remove("bg-blue-600");
            btnSubmit.classList.add("bg-green-600");
          }
          
          if (btnCancel) btnCancel.classList.remove("hidden");
          
          // Sembunyikan container materi baru jika ada
          if (containerBaru) containerBaru.classList.add("hidden");
          
          // Scroll ke form
          const form = $("formDescription");
          if (form) form.scrollIntoView({ behavior: 'smooth' });
        }
      } catch (error) {
        console.error("Error loading description for edit:", error);
        alert("Gagal memuat data untuk edit: " + error.message);
      }
    },

    // Render select materi
    renderMateriSelect: function() {
      const selectMateri = $("selectMateri");
      if (!selectMateri) return;

      selectMateri.innerHTML = '<option value="">-- Pilih Materi --</option>';
      
      this.materiList.forEach(materi => {
        const option = document.createElement('option');
        option.value = materi.id_materi;
        option.textContent = materi.nama_materi;
        selectMateri.appendChild(option);
      });

      // Tambah option untuk materi baru
      const newOption = document.createElement('option');
      newOption.value = "new";
      newOption.textContent = "+ Tambah Materi Baru";
      selectMateri.appendChild(newOption);
    },

    // Render tabel description
    renderTable: function() {
      const tabel = $("tabelDescription");
      if (!tabel) return;

      const start = (this.currentPage - 1) * perPage;
      const end = start + perPage;
      const pageData = this.descriptionList.slice(start, end);

      if (pageData.length === 0) {
        tabel.innerHTML = `
          <tr>
            <td colspan="6" class="px-5 py-8 text-center text-gray-500">
              <div class="flex flex-col items-center justify-center">
                <svg class="w-12 h-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
                Belum ada data deskripsi
              </div>
            </td>
          </tr>
        `;
        this.renderPagination();
        return;
      }

      tabel.innerHTML = pageData.map(item => {
        const materiNama = item.materi?.nama_materi || "Unknown";
        const descriptionText = item.description || "-";
        const shortDescription = descriptionText.length > 50 
          ? descriptionText.substring(0, 50) + "..." 
          : descriptionText;

        return `
          <tr class="hover:bg-gray-50">
            <td class="px-5 py-3 border-b">${item.id_description}</td>
            <td class="px-5 py-3 border-b font-medium">${materiNama}</td>
            <td class="px-5 py-3 border-b" title="${descriptionText}">${shortDescription}</td>
            <td class="px-5 py-3 border-b">
              ${item.image_file 
                ? `<img src="${item.image_file}" alt="Materi Image" class="h-16 w-16 object-cover rounded-lg shadow-sm">` 
                : '<span class="text-gray-400 text-sm">-</span>'}
            </td>
            <td class="px-5 py-3 border-b">
              ${item.voice_file 
                ? `<audio controls class="w-32">
                    <source src="${item.voice_file}" type="audio/mpeg">
                    Browser tidak mendukung audio
                   </audio>` 
                : '<span class="text-gray-400 text-sm">-</span>'}
            </td>
            <td class="px-5 py-3 border-b">
              <div class="flex gap-2">
                <button onclick="MateriModule.editDescription(${item.id_description})" 
                  class="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-sm transition-colors">
                  Edit
                </button>
                <button onclick="MateriModule.deleteDescription(${item.id_description})" 
                  class="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition-colors">
                  Hapus
                </button>
              </div>
            </td>
          </tr>
        `;
      }).join("");

      this.renderPagination();
    },

    // Render pagination
    renderPagination: function() {
      const pagination = $("pagination");
      if (!pagination) return;

      pagination.innerHTML = "";

      if (this.totalPages <= 1) return;

      for (let i = 1; i <= this.totalPages; i++) {
        const button = document.createElement("button");
        button.textContent = i;
        button.className = `px-3 py-1 rounded border ${
          i === this.currentPage 
            ? "bg-blue-600 text-white border-blue-600" 
            : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
        }`;
        
        button.onclick = () => {
          this.currentPage = i;
          this.renderTable();
        };
        
        pagination.appendChild(button);
      }
    },

    // Load all initial data
    loadInitialData: async function() {
      try {
        await Promise.all([
          this.loadMateri(),
          this.loadDescriptions()
        ]);
        
        this.renderMateriSelect();
        this.renderTable();
      } catch (error) {
        console.error("Error loading initial data:", error);
        
        // Tampilkan error di tabel
        const tabel = $("tabelDescription");
        if (tabel) {
          tabel.innerHTML = `
            <tr>
              <td colspan="6" class="px-5 py-8 text-center text-red-600">
                <div class="flex flex-col items-center justify-center">
                  <svg class="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.698-.833-2.464 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                  </svg>
                  Gagal memuat data: ${error.message}
                </div>
              </td>
            </tr>
          `;
        }
      }
    }
  };

  // Export to window
  window.MateriModule = MateriModule;

  console.log('MateriModule loaded successfully');

})();