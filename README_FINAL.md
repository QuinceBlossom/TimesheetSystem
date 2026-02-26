# HỆ THỐNG QUẢN LÝ BÁO CÁO CÔNG VIỆC & THEO DÕI HIỆU SUẤT (Timesheet System)

## 1. Giới thiệu
Đây là ứng dụng web Full-stack giúp doanh nghiệp quản lý quy trình chấm công, báo cáo công việc hàng ngày và theo dõi hiệu suất nhân sự. Hệ thống phân quyền chặt chẽ cho 3 đối tượng: Admin, Manager và Staff.

## 2. Công nghệ sử dụng
- **Frontend:** ReactJS (Vite), Ant Design, Axios, Dayjs.
- **Backend:** Node.js, Express.js.
- **Database:** MySQL.

## 3. Chức năng chính
- **Phân quyền (Role-based):**
  - **Staff:** Nhập Công Việc theo tuần, xem lịch sử làm việc, nhận cảnh báo khi chưa nhập công việc.
  - **Manager:** Xem báo cáo thống kê tổng hợp, đánh giá hiệu suất nhân viên (KPI).
  - **Admin:** Quản lý tài khoản (CRUD User), cấp quyền truy cập.
- **Tiện ích:**

  - Tự động phát hiện ngày thiếu công
  - Giao diện Theo dõi khối lượng công việc tháng trực quan (Workload Monthly View).
  - Hệ thống "Giữ đăng nhập" (Persist Login) khi tải lại trang.

## 4. Hướng dẫn cài đặt & Chạy dự án

### Bước 1: Chuẩn bị Database
1. Mở MySQL Workbench.
2. Mở file script `backend/database_setup.sql`.
3. Chạy toàn bộ script để tạo Database `timesheet_db` và các bảng cần thiết.

### Bước 2: Cài đặt & Chạy Backend (Server)
1. Mở terminal tại thư mục `backend`.
2. Cài đặt thư viện:
   ```bash
   npm install

   //Chạy dự án:
    1. Mở Terminal thứ nhất:
    cd backend
    node server.js  

    2.Mở Terminal thứ 2:
    cd frontend
    npm run dev

## 5. Tài khoản Demo
|   Vai trò   | Username | Password |
|-------------|----------|----------|
| **Admin**   | admin    | `123`    |
| **Manager** | manager  | `123`    |
| **Staff**   | staff    | `123`    |

sql ---------------------------------------
ALTER TABLE work_logs 
ADD COLUMN status VARCHAR(20) DEFAULT 'Pending';

-- (Tùy chọn) Cập nhật toàn bộ dữ liệu cũ thành 'Approved' (Đã duyệt) cho đẹp
UPDATE work_logs SET status = 'Approved' WHERE id > 0;

## 6. Lưu ý khi deploy
.env cũ VITE_API_URL=http://192.168.0.5:3000