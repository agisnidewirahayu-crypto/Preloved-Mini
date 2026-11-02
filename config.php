<?php
// Pengaturan database (default XAMPP)
const DB_HOST = 'localhost';
const DB_NAME = 'preloved_mini';
const DB_USER = 'root';
const DB_PASS = '';

session_start();
header('Content-Type: application/json; charset=utf-8');

function out($data, $code = 200) {
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    $pdo = new PDO('mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4', DB_USER, DB_PASS, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
} catch (Exception $e) {
    out(['error' => 'Database belum tersambung. Cek config.php & import database.sql'], 500);
}

function me() {
    global $pdo;
    if (empty($_SESSION['uid'])) return null;
    $s = $pdo->prepare('SELECT id, nama, email, role FROM users WHERE id = ?');
    $s->execute([$_SESSION['uid']]);
    return $s->fetch() ?: null;
}
function needLogin() { $u = me(); if (!$u) out(['error' => 'Silakan masuk terlebih dahulu.', 'login' => true], 401); return $u; }
function needAdmin() { $u = needLogin(); if ($u['role'] !== 'admin') out(['error' => 'Khusus admin.'], 403); return $u; }
