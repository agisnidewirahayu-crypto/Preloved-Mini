const $ = (id) => document.getElementById(id);
const ikon = { Fashion: "👕", "Tas & Aksesoris": "👜", "Sepatu/Sandal": "👟", Buku: "📚", Elektronik: "🎧", Perabotan: "🪑" };

let tab = "pending";
let produk = [];
let users = [];
let sayaId = null;

async function api(action, obj) {
  const opsi = {};
  if (obj) {
    const fd = new FormData();
    Object.keys(obj).forEach((k) => fd.append(k, obj[k]));
    opsi.method = "POST";
    opsi.body = fd;
  }
  try {
    return await (await fetch("api.php?action=" + action, opsi)).json();
  } catch (e) {
    return { error: "Tidak bisa terhubung ke server." };
  }
}
const rp = (n) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);

// Pembuat elemen kecil (aman: memakai textContent)
function el(tag, props, ...anak) {
  const e = document.createElement(tag);
  Object.assign(e, props || {});
  anak.flat().forEach((a) => e.append(a));
  return e;
}
function tombol(teks, kelas, fn) {
  const b = el("button", { textContent: teks, className: kelas || "" });
  b.addEventListener("click", fn);
  return b;
}
async function aksi(action, data, konfirmasi) {
  if (konfirmasi && !confirm(konfirmasi)) return;
  const r = await api(action, data);
  if (r.error) alert(r.error);
  await muat();
}

/*Muat data*/
async function muat() {
  const [p, u] = await Promise.all([api("admin_products"), api("admin_users")]);
  produk = p.products || [];
  users = u.users || [];
  $("badgePending").textContent = produk.filter((x) => x.status === "pending").length;
  render();
}

function render() {
  const t = $("tabel");
  t.innerHTML = "";
  if (tab === "users") return renderUsers(t);
  const data = tab === "pending" ? produk.filter((x) => x.status === "pending") : produk;
  if (!data.length) {
    t.append(el("tbody", {}, el("tr", {}, el("td", { className: "kosong", textContent: tab === "pending" ? "Tidak ada barang yang menunggu persetujuan 🎉" : "Belum ada produk." }))));
    return;
  }
  t.append(el("thead", {}, el("tr", {}, ["Foto", "Barang", "Harga", "Penjual", "Suka", "Status", "Aksi"].map((h) => el("th", { textContent: h })))));
  const tb = el("tbody");
  data.forEach((p) => {
    const foto = p.foto ? el("img", { src: p.foto, alt: p.nama }) : el("div", { className: "emoji", textContent: ikon[p.kategori] || "🛍️" });
    const tombolAksi = el("div", { className: "aksi" });
    if (p.status !== "approved") tombolAksi.append(tombol("✓ Setujui", "ok", () => aksi("admin_set_status", { id: p.id, status: "approved" })));
    if (p.status === "approved") tombolAksi.append(tombol("Sembunyikan", "", () => aksi("admin_set_status", { id: p.id, status: "rejected" })));
    if (p.status === "pending") tombolAksi.append(tombol("✕ Tolak", "", () => aksi("admin_set_status", { id: p.id, status: "rejected" })));
    tombolAksi.append(tombol("Edit", "", () => bukaEdit(p)));
    tombolAksi.append(tombol("Hapus", "bahaya", () => aksi("admin_delete_product", { id: p.id }, 'Hapus "' + p.nama + '" secara permanen?')));

    tb.append(el("tr", {},
      el("td", {}, foto),
      el("td", {}, el("b", { textContent: p.nama }), el("small", { textContent: p.kategori + " · " + p.kondisi })),
      el("td", { textContent: rp(p.harga) }),
      el("td", {}, p.penjual, el("small", { textContent: "WA: " + p.kontak })),
      el("td", { textContent: "♥ " + p.suka }),
      el("td", {}, el("span", { className: "status " + p.status, textContent: { pending: "Menunggu", approved: "Tayang", rejected: "Ditolak" }[p.status] })),
      el("td", {}, tombolAksi)
    ));
  });
  t.append(tb);
}

function renderUsers(t) {
  t.append(el("thead", {}, el("tr", {}, ["Nama", "Email", "Role", "Barang", "Daftar", "Aksi"].map((h) => el("th", { textContent: h })))));
  const tb = el("tbody");
  users.forEach((u) => {
    const diriSendiri = Number(u.id) === sayaId;
    const tombolAksi = el("div", { className: "aksi" });
    if (!diriSendiri) {
      tombolAksi.append(tombol(u.role === "admin" ? "Jadikan User" : "Jadikan Admin", "", () => aksi("admin_set_role", { id: u.id, role: u.role === "admin" ? "user" : "admin" }, "Ubah role " + u.nama + "?")));
      tombolAksi.append(tombol("Hapus", "bahaya", () => aksi("admin_delete_user", { id: u.id }, "Hapus akun " + u.nama + " beserta semua barangnya?")));
    } else tombolAksi.append(el("small", { textContent: "(akunmu)" }));
    tb.append(el("tr", {},
      el("td", {}, el("b", { textContent: u.nama })),
      el("td", { textContent: u.email }),
      el("td", {}, el("span", { className: "status " + (u.role === "admin" ? "approved" : "pending"), textContent: u.role })),
      el("td", { textContent: u.jumlah_barang }),
      el("td", { textContent: u.created_at.slice(0, 10) }),
      el("td", {}, tombolAksi)
    ));
  });
  t.append(tb);
}

/*Edit produk*/
let editId = null;
function bukaEdit(p) {
  editId = p.id;
  $("eNama").value = p.nama;
  $("eKategori").value = p.kategori;
  $("eHarga").value = p.harga;
  $("eKondisi").value = p.kondisi;
  $("eDeskripsi").value = p.deskripsi;
  $("eKontak").value = p.kontak;
  $("editModal").classList.add("show");
}
$("editClose").addEventListener("click", () => $("editModal").classList.remove("show"));
$("editForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  await aksi("admin_update_product", {
    id: editId, nama: $("eNama").value, kategori: $("eKategori").value, harga: $("eHarga").value,
    kondisi: $("eKondisi").value, deskripsi: $("eDeskripsi").value, kontak: $("eKontak").value,
  });
  $("editModal").classList.remove("show");
});

/*Tab & keluar*/
$("tabs").querySelectorAll("button").forEach((b) =>
  b.addEventListener("click", () => {
    tab = b.dataset.tab;
    $("tabs").querySelectorAll("button").forEach((x) => x.classList.toggle("aktif", x === b));
    render();
  })
);
$("logoutBtn").addEventListener("click", async (e) => {
  e.preventDefault();
  await api("logout", {});
  location.href = "index.html";
});

/*Mulai (hanya admin) */
(async function () {
  const r = await api("me");
  if (!r.user || r.user.role !== "admin") { $("adminDenied").hidden = false; return; }
  sayaId = Number(r.user.id);
  $("adminMain").hidden = false;
  muat();
})();
