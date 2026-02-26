-- 1. Thêm cột role (Nếu chạy rồi thì nó báo lỗi, kệ nó)
ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'staff';

-- 2. Thăng chức cho tài khoản của bạn lên làm ADMIN
UPDATE users SET role = 'admin' WHERE username = 'khuongduy.ph'; 

-- 3. Tạo thử 1 ông Quản lý để tí nữa test
INSERT INTO users (username, full_name, department, password, role) 
VALUES ('quanly.test', 'Trần Quản Lý', 'PM Office', '123', 'manager');