CREATE DATABASE IF NOT EXISTS smart_campus;
USE smart_campus;

DROP TABLE IF EXISTS complaints;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  roll_no VARCHAR(50) UNIQUE,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('student','admin') NOT NULL DEFAULT 'student',
  department VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE complaints (
  id INT AUTO_INCREMENT PRIMARY KEY,
  complaint_code VARCHAR(30) NOT NULL UNIQUE,
  student_id INT NOT NULL,
  category VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  department VARCHAR(100) NOT NULL,
  location VARCHAR(255) NOT NULL,
  photo VARCHAR(500),
  status ENUM('Submitted','Processing','Resolved','Rejected')
    NOT NULL DEFAULT 'Submitted',
  admin_note TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (student_id)
    REFERENCES users(id)
    ON DELETE CASCADE
);

-- Demo Admin Account
-- Admin Login:
-- Email: giteshmore6767@gmail.com
-- Password: admin@123

INSERT INTO users
(name, email, password_hash, role, department)
VALUES
(
  'Campus Admin',
  'giteshmore6767@gmail.com',
  '$2a$10$tLiXPLaeUy37O.4U8IyK9uhVEeFQ93.GQqCZJcg3D0.1h.Xgx7We2',
  'admin',
  'Administration'
);