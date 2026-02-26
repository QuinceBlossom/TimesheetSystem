ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'staff';
UPDATE users SET role = 'admin' WHERE id = 1;
UPDATE users SET role = 'manager' WHERE id = 2;
INSERT INTO users (username, full_name, department, password, role) VALUES ('staff.user', 'Nhân Viên Mẫu', 'IT', '123', 'staff');