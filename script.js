const WA_ADMIN = "088989857155";

const ikonKategori = {
  Fashion: "👕",
  "Tas & Aksesoris": "👜",
  "Sepatu/Sandal": "👟",
  Buku: "📚",
  Elektronik: "🎧",
  Perabotan: "🪑",
};

let produk = [];
let user = null; // null = belum login
let mode = "login"; // mode modal auth: login | daftar

const $ = (id) => document.getElementById(id);

/*Helper*/
async function api(action, data) {
  const opsi = data ? { method: "POST", body: data } : {};
  try {
    const res = await fetch("api.php?action=" + action, opsi);
    return await res.json();
  } catch (e) {
    return {
      error:
        "Tidak bisa terhubung ke server. Pastikan Apache & MySQL XAMPP menyala dan web dibuka lewat http://localhost/",
    };
  }
}
function formData(obj) {
  const fd = new FormData();
  Object.keys(obj).forEach((k) => fd.append(k, obj[k]));
  return fd;
}
function formatRupiah(n) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);
}
function buatVisual(wadah, item) {
  const emoji = ikonKategori[item.kategori] || "🛍️";
  wadah.textContent = "";
  if (!item.foto) {
    wadah.textContent = emoji;
    return;
  }
  const img = document.createElement("img");
  img.src = item.foto;
  img.alt = item.nama;
  img.onerror = () => {
    wadah.textContent = emoji;
  };
  wadah.appendChild(img);
}

/*Katalog*/
async function muatProduk() {
  const r = await api("products");
  if (r.error) {
    $("productGrid").innerHTML = "";
    const p = document.createElement("p");
    p.className = "empty-message";
    p.textContent = r.error;
    $("productGrid").appendChild(p);
    return;
  }
  produk = r.products;
  tampilkanProduk();
}

function tampilkanProduk() {
  const kata = $("searchInput").value.toLowerCase();
  const kat = $("filterKategori").value;
  const urut = $("sortHarga").value;

  const hasil = produk.filter(
    (p) =>
      p.nama.toLowerCase().includes(kata) && (kat === "" || p.kategori === kat)
  );
  if (urut === "termurah") hasil.sort((a, b) => a.harga - b.harga);
  else if (urut === "termahal") hasil.sort((a, b) => b.harga - a.harga);
  else hasil.sort((a, b) => b.id - a.id);

  const grid = $("productGrid");
  grid.innerHTML = "";
  if (hasil.length === 0) {
    const p = document.createElement("p");
    p.className = "empty-message";
    p.textContent = "Barang tidak ditemukan. Coba kata kunci lain.";
    grid.appendChild(p);
    return;
  }

  hasil.forEach((item) => {
    const kartu = document.createElement("article");
    kartu.className = "product-card";

    const visual = document.createElement("div");
    visual.className = "product-visual";
    buatVisual(visual, item);

    const fav = document.createElement("button");
    fav.className = "fav-btn" + (item.saya_suka ? " aktif" : "");
    fav.textContent = "♥" + (item.suka > 0 ? " " + item.suka : "");
    fav.setAttribute("aria-label", "Suka (" + item.suka + " orang menyukai)");
    fav.addEventListener("click", () => toggleSuka(item));

    const info = document.createElement("div");
    info.className = "product-info";
    const tag = document.createElement("span");
    tag.className = "tag";
    tag.textContent = item.kategori;
    const judul = document.createElement("h3");
    judul.textContent = item.nama;
    const kondisi = document.createElement("p");
    kondisi.textContent = "Kondisi: " + item.kondisi;
    const harga = document.createElement("p");
    harga.className = "product-price";
    harga.textContent = formatRupiah(item.harga);
    const aksi = document.createElement("div");
    aksi.className = "product-actions";
    const detail = document.createElement("button");
    detail.textContent = "Lihat Detail";
    detail.addEventListener("click", () => bukaDetail(item));
    aksi.appendChild(detail);

    info.append(tag, judul, kondisi, harga, aksi);
    kartu.append(visual, fav, info);
    grid.appendChild(kartu);
  });
}

async function toggleSuka(item) {
  if (!user) {
    bukaAuth("login", "Masuk dulu untuk menyukai barang ♡");
    return;
  }
  const r = await api("like", formData({ product_id: item.id }));
  if (r.error) {
    if (r.login) bukaAuth("login");
    else alert(r.error);
    return;
  }
  item.suka = r.suka;
  item.saya_suka = r.saya_suka;
  tampilkanProduk();
}

/*Detail (hanya tombol Beli → WhatsApp)*/
function bukaDetail(item) {
  buatVisual($("modalVisual"), item);
  $("modalKategori").textContent = item.kategori;
  $("modalNama").textContent = item.nama;
  $("modalHarga").textContent = formatRupiah(item.harga);
  $("modalKondisi").textContent = "Kondisi: " + item.kondisi;
  $("modalDeskripsi").textContent = item.deskripsi;
  $("modalSuka").textContent =
    item.suka > 0 ? "♥ " + item.suka + " orang menyukai barang ini" : "";

  const nomor = (item.kontak || "").replace(/\D/g, "") || WA_ADMIN;
  const pesan =
    'Halo, saya tertarik dengan barang "' +
    item.nama +
    '" (' +
    formatRupiah(item.harga) +
    ") di Preloved Mini. Apakah masih tersedia?";
  $("modalBeli").href =
    "https://wa.me/" + nomor + "?text=" + encodeURIComponent(pesan);
  $("detailModal").classList.add("show");
}
function tutupModal() {
  $("detailModal").classList.remove("show");
}
$("modalClose").addEventListener("click", tutupModal);
$("detailModal").addEventListener("click", (e) => {
  if (e.target.id === "detailModal") tutupModal();
});

/*Kategori & filter*/
document.querySelectorAll(".category-card").forEach((k) => {
  k.addEventListener("click", () => {
    $("filterKategori").value = k.dataset.kategori;
    $("filterKategori").refresh();
    $("katalog").scrollIntoView({ behavior: "smooth" });
    tampilkanProduk();
  });
});
$("searchInput").addEventListener("input", tampilkanProduk);
$("filterKategori").addEventListener("change", tampilkanProduk);
$("sortHarga").addEventListener("change", tampilkanProduk);

/*Hamburger*/
const hamburger = $("hamburger-menu");
const navMenu = $("navMenu");
function tutupMenu() {
  navMenu.classList.remove("open");
  hamburger.classList.remove("open");
  hamburger.setAttribute("aria-expanded", "false");
}
hamburger.addEventListener("click", () => {
  const buka = navMenu.classList.toggle("open");
  hamburger.classList.toggle("open", buka);
  hamburger.setAttribute("aria-expanded", buka);
});
navMenu
  .querySelectorAll("a")
  .forEach((a) => a.addEventListener("click", tutupMenu));

/*Login / Daftar*/
function perbaruiUI() {
  $("authLink").hidden = !!user;
  $("userMenu").hidden = !user;
  $("loginNote").hidden = !!user;
  if (user) {
    $("userAvatar").textContent = user.nama.trim().charAt(0);
    $("userName").textContent = user.nama.split(" ")[0];
    $("udNama").textContent = user.nama;
    $("udEmail").textContent = user.email;
    $("adminLink").hidden = user.role !== "admin";
  }
}

function bukaAuth(m, sub) {
  mode = m || "login";
  const daftar = mode === "daftar";
  $("authTitle").textContent = daftar ? "Daftar" : "Masuk";
  $("authSub").textContent =
    sub ||
    (daftar
      ? "Buat akun untuk menjual dan menyukai barang."
      : "Masuk untuk menjual barang dan menyukai barang.");
  $("grpNama").hidden = !daftar;
  $("authSubmit").textContent = daftar ? "Daftar" : "Masuk";
  $("authSwitchText").textContent = daftar
    ? "Sudah punya akun?"
    : "Belum punya akun?";
  $("authSwitch").textContent = daftar ? "Masuk" : "Daftar";
  $("authError").textContent = "";
  $("authModal").classList.add("show");
}
function tutupAuth() {
  $("authModal").classList.remove("show");
}

$("authClose").addEventListener("click", tutupAuth);
$("authModal").addEventListener("click", (e) => {
  if (e.target.id === "authModal") tutupAuth();
});
$("authSwitch").addEventListener("click", (e) => {
  e.preventDefault();
  bukaAuth(mode === "login" ? "daftar" : "login");
});
$("loginNoteLink").addEventListener("click", (e) => {
  e.preventDefault();
  bukaAuth("login");
});

$("authLink").addEventListener("click", (e) => {
  e.preventDefault();
  bukaAuth("login");
});

// Menu akun (avatar + nama)
$("userChip").addEventListener("click", () =>
  $("userMenu").classList.toggle("buka")
);
document.addEventListener("click", (e) => {
  if (!e.target.closest("#userMenu")) $("userMenu").classList.remove("buka");
});
$("logoutLink").addEventListener("click", async (e) => {
  e.preventDefault();
  $("userMenu").classList.remove("buka");
  if (!confirm("Keluar dari akun?")) return;
  await api("logout", formData({}));
  user = null;
  perbaruiUI();
  muatProduk();
});

$("authForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const daftar = mode === "daftar";
  const data = {
    email: $("authEmail").value.trim(),
    password: $("authPass").value,
  };
  if (daftar) data.nama = $("authNama").value.trim();

  $("authSubmit").disabled = true;
  const r = await api(daftar ? "register" : "login", formData(data));
  $("authSubmit").disabled = false;

  if (r.error) {
    $("authError").textContent = r.error;
    return;
  }
  user = r.user;
  e.target.reset();
  tutupAuth();
  perbaruiUI();
  muatProduk(); // perbarui status "sudah disukai"
});

/*Form jual*/
$("fotoBarang").addEventListener("change", (e) => {
  const f = e.target.files[0];
  const img = $("previewFoto");
  $("dzNama").textContent = f ? f.name : "Pilih foto barang";
  if (f) {
    img.src = URL.createObjectURL(f);
    img.hidden = false;
  } else img.hidden = true;
});

$("formJual").addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!user) {
    bukaAuth("login", "Masuk dulu untuk menjual barang.");
    return;
  }

  const fd = new FormData();
  fd.append("nama", $("namaBarang").value);
  fd.append("kategori", $("kategoriBarang").value);
  fd.append("harga", $("hargaBarang").value);
  fd.append("kondisi", $("kondisiBarang").value);
  fd.append("deskripsi", $("deskripsiBarang").value);
  fd.append("kontak", $("kontakPenjual").value);
  if ($("fotoBarang").files[0]) fd.append("foto", $("fotoBarang").files[0]);

  const tombol = $("btnSubmit");
  tombol.disabled = true;
  tombol.textContent = "Mengirim...";
  const r = await api("add_product", fd);
  tombol.disabled = false;
  tombol.textContent = "Submit Barang";

  if (r.error) {
    if (r.login) bukaAuth("login");
    else alert(r.error);
    return;
  }
  e.target.reset();
  e.target.querySelectorAll("select").forEach((x) => x.refresh && x.refresh());
  $("previewFoto").hidden = true;
  $("dzNama").textContent = "Pilih foto barang";
  if (r.status === "approved") {
    alert("Barang berhasil ditambahkan ke katalog!");
    muatProduk();
  } else
    alert(
      "Terima kasih! Barangmu sudah dikirim dan menunggu persetujuan admin."
    );
});

/*Dropdown custom*/
function buatSelect(sel) {
  const wrap = document.createElement("div");
  wrap.className = "cselect";
  sel.parentNode.insertBefore(wrap, sel);
  wrap.appendChild(sel);
  sel.tabIndex = -1;

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "cselect-btn";
  btn.setAttribute("aria-haspopup", "listbox");
  const list = document.createElement("ul");
  list.className = "cselect-list";
  list.setAttribute("role", "listbox");
  wrap.append(btn, list);

  function tutup() {
    wrap.classList.remove("buka");
  }

  function isi() {
    list.innerHTML = "";
    Array.from(sel.options).forEach((opt) => {
      const li = document.createElement("li");
      li.setAttribute("role", "option");
      li.textContent = opt.text;
      if (opt.value === sel.value) li.classList.add("dipilih");
      li.addEventListener("click", () => {
        sel.value = opt.value;
        sel.dispatchEvent(new Event("change", { bubbles: true }));
        isi();
        tutup();
        btn.focus();
      });
      list.appendChild(li);
    });
    const cur = sel.options[sel.selectedIndex];
    btn.textContent = cur ? cur.text : "";
    btn.classList.toggle("kosong", sel.required && !sel.value);
  }
  sel.refresh = isi;
  isi();

  btn.addEventListener("click", () => {
    const buka = !wrap.classList.contains("buka");
    document
      .querySelectorAll(".cselect.buka")
      .forEach((w) => w.classList.remove("buka"));
    wrap.classList.toggle("buka", buka);
  });
  wrap.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      tutup();
      btn.focus();
    }
  });
}
document.querySelectorAll("main select, section select").forEach(buatSelect);
document.addEventListener("click", (e) => {
  if (!e.target.closest(".cselect"))
    document
      .querySelectorAll(".cselect.buka")
      .forEach((w) => w.classList.remove("buka"));
});

/*Mulai*/
(async function mulai() {
  const r = await api("me");
  user = r.user || null;
  perbaruiUI();
  muatProduk();
})();
const authPass = document.getElementById("authPass");
const togglePass = document.getElementById("togglePass");

togglePass.addEventListener("click", () => {
  const tampil = authPass.type === "password";
  authPass.type = tampil ? "text" : "password";
  togglePass.textContent = tampil ? "🙈" : "👁";
  togglePass.setAttribute("aria-pressed", tampil);
  togglePass.setAttribute(
    "aria-label",
    tampil ? "Sembunyikan password" : "Tampilkan password"
  );
});
