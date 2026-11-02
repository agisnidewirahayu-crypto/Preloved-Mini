(function () {
  let box;

  function siapkan() {
    if (box) return box;
    box = document.createElement("div");
    box.className = "modal dialog";
    box.innerHTML =
      '<div class="modal-content dialog-box" role="alertdialog" aria-modal="true">' +
      '<div class="dialog-ikon"></div><h3 class="dialog-judul"></h3><p class="dialog-pesan"></p>' +
      '<div class="dialog-aksi"></div></div>';
    document.body.appendChild(box);
    return box;
  }

  function tampil(o) {
    return new Promise(function (selesai) {
      const d = siapkan();
      d.querySelector(".dialog-ikon").textContent = o.ikon || "💬";
      d.querySelector(".dialog-judul").textContent = o.judul || "";
      d.querySelector(".dialog-pesan").textContent = o.pesan || "";
      const aksi = d.querySelector(".dialog-aksi");
      aksi.innerHTML = "";

      function tutup(nilai) {
        d.classList.remove("show");
        document.removeEventListener("keydown", tombolKeyboard);
        selesai(nilai);
      }
      function tombolKeyboard(e) { if (e.key === "Escape") tutup(false); }

      if (o.batal) {
        const b = document.createElement("button");
        b.className = "btn btn-secondary";
        b.textContent = o.batal;
        b.addEventListener("click", function () { tutup(false); });
        aksi.appendChild(b);
      }
      const ok = document.createElement("button");
      ok.className = "btn " + (o.bahaya ? "btn-bahaya" : "btn-primary");
      ok.textContent = o.tombol || "OK";
      ok.addEventListener("click", function () { tutup(true); });
      aksi.appendChild(ok);

      d.onclick = function (e) { if (e.target === d) tutup(false); };
      document.addEventListener("keydown", tombolKeyboard);
      d.classList.add("show");
      ok.focus();
    });
  }

  window.dialogInfo = function (o) { return tampil(Object.assign({ tombol: "Mengerti" }, o)); };
  window.dialogKonfirmasi = function (o) { return tampil(Object.assign({ tombol: "Ya", batal: "Batal" }, o)); };
})();
