-- 1. Thêm cột password vào bảng users
ALTER TABLE users ADD COLUMN password VARCHAR(50) DEFAULT '123';

-- 2. Đặt mật khẩu cho ông Khương Duy và Văn Anh là '123'
UPDATE users SET password = '123' WHERE id > 0;