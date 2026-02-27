# TimesheetSystem
# 🚀 Hệ Thống Quản Lý Chấm Công (Timesheet Management System)

Đây là dự án hệ thống phần mềm giúp doanh nghiệp quản lý thời gian làm việc của nhân viên, số hóa quy trình báo cáo và duyệt công một cách tự động, minh bạch.

## ✨ Tính năng nổi bật

Hệ thống được phân quyền chặt chẽ với 3 vai trò chính:

* **👑 Quản trị viên (Admin):**
    * Quản lý toàn bộ danh sách nhân sự trong hệ thống.
    * Thêm mới, chỉnh sửa thông tin, khóa tài khoản nhân viên.
    * Thiết lập và phân công Quản lý (Manager) cho từng Nhân viên (Staff).
* **👔 Quản lý (Manager):**
    * Xem bảng thống kê hiệu suất, tổng số giờ làm việc của nhân viên cấp dưới.
    * Duyệt (Approve) hoặc Từ chối (Reject) các báo cáo công việc hàng ngày.
* **👤 Nhân viên (Staff):**
    * Khai báo và nộp báo cáo công việc (Timesheet) hàng ngày.
    * Theo dõi lịch sử làm việc qua giao diện trực quan.
    * Chặn log giờ quá hạn hoặc log trước cho tương lai để đảm bảo tính minh bạch.

## 🛠️ Công nghệ sử dụng (Tech Stack)a

Dự án được xây dựng theo mô hình Client-Server độc lập:

* **Frontend:** ReactJS (Vite), Axios, thiết kế UI hiện đại, responsive. (Deployed on **Netlify**)
* **Backend:** Node.js, Express.js, RESTful API. (Deployed on **Render**)
* **Database:** MySQL (Cloud DB on **Aiven**).
* **Bảo mật & Quản lý:** Environment Variables (Biến môi trường), Git/GitHub.

## ⚙️ Hướng dẫn cài đặt (Chạy ở Local)

**1. Clone dự án về máy**
```bash
git clone [https://github.com/Username_Cua_Ban/Ten_Repo.git]()

**2. Cài đặt Backend**
cd backend
npm install
# Nhớ tạo file .env và cấu hình các biến kết nối MySQL
npm run dev

**3. Cài đặt Frontend**
cd frontend
npm install
# Đảm bảo file axiosConfig.js đang trỏ về http://localhost:3000
npm run dev


