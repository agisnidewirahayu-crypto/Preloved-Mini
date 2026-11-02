<?php
require 'config.php';

const KATEGORI = ['Fashion', 'Tas & Aksesoris', 'Sepatu/Sandal', 'Buku', 'Elektronik', 'Perabotan'];
const KONDISI  = ['Seperti Baru', 'Baik', 'Cukup Baik'];

$a = $_GET['action'] ?? '';
$q = function ($sql, $p = []) use ($pdo) { $s = $pdo->prepare($sql); $s->execute($p); return $s; };
$in = fn($k) => trim((string)($_POST[$k] ?? ''));

switch ($a) {

/*AKUN*/
case 'me':
    out(['user' => me()]);

case 'register':
    $nama = $in('nama'); $email = strtolower($in('email')); $pass = (string)($_POST['password'] ?? '');
    if ($nama === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) out(['error' => 'Nama atau email tidak valid.'], 400);
    if (strlen($pass) < 6) out(['error' => 'Password minimal 6 karakter.'], 400);
    if ($q('SELECT 1 FROM users WHERE email = ?', [$email])->fetch()) out(['error' => 'Email sudah terdaftar.'], 400);
    $q('INSERT INTO users (nama, email, password) VALUES (?,?,?)', [$nama, $email, password_hash($pass, PASSWORD_DEFAULT)]);
    session_regenerate_id(true);
    $_SESSION['uid'] = $pdo->lastInsertId();
    out(['user' => me()]);

case 'login':
    $u = $q('SELECT * FROM users WHERE email = ?', [strtolower($in('email'))])->fetch();
    if (!$u || !password_verify((string)($_POST['password'] ?? ''), $u['password'])) out(['error' => 'Email atau password salah.'], 401);
    session_regenerate_id(true);
    $_SESSION['uid'] = $u['id'];
    out(['user' => me()]);

case 'logout':
    $_SESSION = []; session_destroy();
    out(['ok' => true]);

/*KATALOG (publik)*/
case 'products':
    $u = me();
    $rows = $q("SELECT p.id, p.nama, p.kategori, p.harga, p.kondisi, p.deskripsi, p.kontak, p.foto,
                (SELECT COUNT(*) FROM likes l WHERE l.product_id = p.id) AS suka,
                (SELECT COUNT(*) FROM likes l WHERE l.product_id = p.id AND l.user_id = ?) AS saya_suka
                FROM products p WHERE p.status = 'approved' ORDER BY p.id DESC", [$u['id'] ?? 0])->fetchAll();
    foreach ($rows as &$r) { $r['id'] = (int)$r['id']; $r['harga'] = (int)$r['harga']; $r['suka'] = (int)$r['suka']; $r['saya_suka'] = (bool)$r['saya_suka']; }
    out(['products' => $rows]);

case 'like': // toggle suka (wajib login)
    $u = needLogin(); $pid = (int)($_POST['product_id'] ?? 0);
    if (!$q("SELECT 1 FROM products WHERE id = ? AND status = 'approved'", [$pid])->fetch()) out(['error' => 'Barang tidak ditemukan.'], 404);
    if ($q('SELECT 1 FROM likes WHERE user_id = ? AND product_id = ?', [$u['id'], $pid])->fetch()) {
        $q('DELETE FROM likes WHERE user_id = ? AND product_id = ?', [$u['id'], $pid]); $liked = false;
    } else {
        $q('INSERT INTO likes (user_id, product_id) VALUES (?,?)', [$u['id'], $pid]); $liked = true;
    }
    $n = (int)$q('SELECT COUNT(*) FROM likes WHERE product_id = ?', [$pid])->fetchColumn();
    out(['suka' => $n, 'saya_suka' => $liked]);

/*JUAL BARANG (wajib login)*/
case 'add_product':
    $u = needLogin();
    $d = ['nama' => $in('nama'), 'kategori' => $in('kategori'), 'harga' => (int)$in('harga'),
          'kondisi' => $in('kondisi'), 'deskripsi' => $in('deskripsi'), 'kontak' => preg_replace('/\D/', '', $in('kontak'))];
    if ($d['nama'] === '' || $d['deskripsi'] === '' || $d['kontak'] === '' || $d['harga'] < 0
        || !in_array($d['kategori'], KATEGORI) || !in_array($d['kondisi'], KONDISI)) out(['error' => 'Mohon lengkapi data barang dengan benar.'], 400);
    if ($d['kontak'][0] === '0') $d['kontak'] = '62' . substr($d['kontak'], 1);

    $foto = '';
    if (!empty($_FILES['foto']['name'])) {
        $f = $_FILES['foto'];
        if ($f['error'] !== UPLOAD_ERR_OK || $f['size'] > 3 * 1024 * 1024) out(['error' => 'Foto gagal diunggah (maks. 3 MB).'], 400);
        $mime = @getimagesize($f['tmp_name'])['mime'] ?? '';
        $ext = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp', 'image/gif' => 'gif'][$mime] ?? null;
        if (!$ext) out(['error' => 'File harus berupa gambar (JPG, PNG, WEBP, GIF).'], 400);
        $dir = __DIR__ . '/uploads'; if (!is_dir($dir)) mkdir($dir, 0755, true);
        $nama = bin2hex(random_bytes(8)) . '.' . $ext;
        move_uploaded_file($f['tmp_name'], "$dir/$nama");
        $foto = "uploads/$nama";
    }
    $status = $u['role'] === 'admin' ? 'approved' : 'pending'; // admin langsung tayang
    $q('INSERT INTO products (user_id,nama,kategori,harga,kondisi,deskripsi,kontak,foto,status) VALUES (?,?,?,?,?,?,?,?,?)',
       [$u['id'], $d['nama'], $d['kategori'], $d['harga'], $d['kondisi'], $d['deskripsi'], $d['kontak'], $foto, $status]);
    out(['status' => $status]);

/*ADMIN*/
case 'admin_products':
    needAdmin();
    out(['products' => $q('SELECT p.*, u.nama AS penjual, u.email,
        (SELECT COUNT(*) FROM likes l WHERE l.product_id = p.id) AS suka
        FROM products p JOIN users u ON u.id = p.user_id ORDER BY p.status = "pending" DESC, p.id DESC')->fetchAll()]);

case 'admin_set_status':
    needAdmin();
    if (!in_array($in('status'), ['pending', 'approved', 'rejected'])) out(['error' => 'Status tidak valid.'], 400);
    $q('UPDATE products SET status = ? WHERE id = ?', [$in('status'), (int)$in('id')]);
    out(['ok' => true]);

case 'admin_update_product':
    needAdmin();
    if (!in_array($in('kategori'), KATEGORI) || !in_array($in('kondisi'), KONDISI) || $in('nama') === '') out(['error' => 'Data tidak valid.'], 400);
    $q('UPDATE products SET nama=?, kategori=?, harga=?, kondisi=?, deskripsi=?, kontak=? WHERE id=?',
       [$in('nama'), $in('kategori'), max(0, (int)$in('harga')), $in('kondisi'), $in('deskripsi'), preg_replace('/\D/', '', $in('kontak')), (int)$in('id')]);
    out(['ok' => true]);

case 'admin_delete_product':
    needAdmin();
    $id = (int)$in('id');
    $f = $q('SELECT foto FROM products WHERE id = ?', [$id])->fetchColumn();
    if ($f && strpos($f, 'uploads/') === 0 && is_file(__DIR__ . '/' . $f)) @unlink(__DIR__ . '/' . $f);
    $q('DELETE FROM products WHERE id = ?', [$id]);
    out(['ok' => true]);

case 'admin_users':
    needAdmin();
    out(['users' => $q('SELECT u.id, u.nama, u.email, u.role, u.created_at,
        (SELECT COUNT(*) FROM products p WHERE p.user_id = u.id) AS jumlah_barang FROM users u ORDER BY u.id')->fetchAll()]);

case 'admin_set_role':
    $me = needAdmin(); $id = (int)$in('id');
    if ($id === (int)$me['id']) out(['error' => 'Tidak bisa mengubah role akunmu sendiri.'], 400);
    if (!in_array($in('role'), ['user', 'admin'])) out(['error' => 'Role tidak valid.'], 400);
    $q('UPDATE users SET role = ? WHERE id = ?', [$in('role'), $id]);
    out(['ok' => true]);

case 'admin_delete_user':
    $me = needAdmin(); $id = (int)$in('id');
    if ($id === (int)$me['id']) out(['error' => 'Tidak bisa menghapus akunmu sendiri.'], 400);
    $q('DELETE FROM users WHERE id = ?', [$id]);
    out(['ok' => true]);

default:
    out(['error' => 'Aksi tidak dikenal.'], 404);
}
