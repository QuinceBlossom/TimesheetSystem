-- FILE NÀY DÙNG ĐỂ KHỞI TẠO DATABASE KHI SANG MÁY MỚI --

-- 1. Xóa sạch và tạo lại (Reset)
DROP DATABASE IF EXISTS timesheet_db;
CREATE DATABASE timesheet_db;
USE timesheet_db;

-- 2. Tạo bảng Users (Đã bổ sung manager_id và status)
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    full_name VARCHAR(100) NOT NULL,
    department VARCHAR(50),
    password VARCHAR(50) DEFAULT '123',
    role VARCHAR(20) DEFAULT 'staff', -- Cột phân quyền: admin, manager, staff
    status VARCHAR(20) DEFAULT 'Active', -- Trạng thái tài khoản: Active, Blocked
    manager_id INT NULL, -- Lưu ID của Manager quản lý nhân viên này
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 3. Tạo bảng Tasks
CREATE TABLE tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    task_group VARCHAR(100) NOT NULL,
    task_name VARCHAR(100) NOT NULL
);

-- 4. Tạo bảng WorkLogs (Đã bổ sung status)
CREATE TABLE work_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    task_id INT NOT NULL,
    work_date DATE NOT NULL,
    category VARCHAR(50),
    hours FLOAT NOT NULL DEFAULT 0,
    description TEXT,
    status VARCHAR(20) DEFAULT 'Pending', -- Trạng thái duyệt: Pending, Approved, Rejected
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

-- 5. Nạp dữ liệu mẫu (Đầy đủ chức vụ và liên kết Manager - Staff)
INSERT INTO users (username, full_name, department, password, role, status, manager_id) VALUES 
('admin',   'Phạm Khương Duy', 'Ban Giám Đốc',       '123', 'admin', 'Active', NULL),
('manager', 'Quản Lý Mẫu',      'Phòng Quản Lý',      '123', 'manager', 'Active', NULL),
('staff',   'Nhân Viên Mẫu',   'Phòng Kỹ Thuật',     '123', 'staff', 'Active', 2);              

INSERT INTO tasks (task_group, task_name) VALUES 
('Product Kiểm thử', 'Setting'),
('Product Kiểm thử', 'Camera'),
('Common Task', 'Meeting'),
('Common Task', 'Training'),
('Common Task', 'Coding');