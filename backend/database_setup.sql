-- FILE NÀY DÙNG ĐỂ KHỞI TẠO DATABASE KHI SANG MÁY MỚI --

-- 1. Xóa sạch và tạo lại (Reset)
DROP DATABASE IF EXISTS timesheet_db;
CREATE DATABASE timesheet_db;
USE timesheet_db;

-- 2. Tạo bảng Users (Đã bao gồm cột PASSWORD và ROLE)
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    full_name VARCHAR(100) NOT NULL,
    department VARCHAR(50),
    password VARCHAR(50) DEFAULT '123',
    role VARCHAR(20) DEFAULT 'staff', -- Cột phân quyền: admin, manager, staff
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tạo bảng Tasks
CREATE TABLE tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    task_group VARCHAR(100) NOT NULL,
    task_name VARCHAR(100) NOT NULL
);

-- 4. Tạo bảng WorkLogs
CREATE TABLE work_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    task_id INT NOT NULL,
    work_date DATE NOT NULL,
    category VARCHAR(50),
    hours FLOAT NOT NULL DEFAULT 0,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (task_id) REFERENCES tasks(id)
);

-- 5. Nạp dữ liệu mẫu (Đầy đủ chức vụ)
-- Dữ liệu mẫu Demo (Tên ngắn gọn dễ nhớ)
INSERT INTO users (username, full_name, department, password, role) VALUES 
('admin',   'Phạm Khương Duy', 'Ban Giám Đốc',       '123', 'admin'),
('manager', 'Quản Lý Mẫu',      'Phòng Quản Lý',      '123', 'manager'),
('staff',   'Nhân Viên Mẫu',   'Phòng Kỹ Thuật',     '123', 'staff');               

INSERT INTO tasks (task_group, task_name) VALUES 
('Product Kiểm thử', 'Setting'),
('Product Kiểm thử', 'Camera'),
('Common Task', 'Meeting'),
('Common Task', 'Training'),
('Common Task', 'Coding');
