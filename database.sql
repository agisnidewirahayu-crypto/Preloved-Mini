CREATE DATABASE IF NOT EXISTS preloved_mini CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE preloved_mini;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nama VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('user','admin') NOT NULL DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  nama VARCHAR(150) NOT NULL,
  kategori VARCHAR(50) NOT NULL,
  harga INT NOT NULL,
  kondisi VARCHAR(30) NOT NULL,
  deskripsi TEXT NOT NULL,
  kontak VARCHAR(30) NOT NULL,
  foto VARCHAR(255) DEFAULT '',
  status ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE likes (
  user_id INT NOT NULL,
  product_id INT NOT NULL,
  PRIMARY KEY (user_id, product_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Admin bawaan: admin@prelovedmini.com / admin123  (SEGERA GANTI!)
INSERT INTO users (nama, email, password, role)
VALUES ('Admin', 'admin@prelovedmini.com', '$2y$10$wxw6.X7UHWlsFIHa4.aZTuS9a1gME5XDQaH6PfN4zhT2GdptRaSC6', 'admin');

-- Contoh barang (tanpa foto → tampil emoji)
INSERT INTO products (user_id, nama, kategori, harga, kondisi, deskripsi, kontak, status) VALUES
(1,'Jaket Denim','Fashion',75000,'Baik','Jaket denim preloved yang masih layak digunakan.','6281234567890','approved'),
(1,'Novel Bekas','Buku',25000,'Baik','Novel dengan kondisi baik dan halaman lengkap.','6281234567890','approved'),
(1,'Tas Selempang','Tas & Aksesoris',45000,'Seperti Baru','Tas selempang yang masih bersih dan berfungsi baik.','6281234567890','approved'),
(1,'Headphone','Elektronik',60000,'Baik','Headphone bekas dengan kondisi yang masih baik.','6281234567890','approved'),
(1,'Sneakers','Sepatu/Sandal',85000,'Cukup Baik','Sneakers preloved untuk pemakaian sehari-hari.','6281234567890','approved'),
(1,'Rak Mini','Perabotan',50000,'Baik','Rak kecil untuk menyimpan buku atau barang lainnya.','6281234567890','approved');
