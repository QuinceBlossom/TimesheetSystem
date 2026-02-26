const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

// --- KẾT NỐI DATABASE ---
const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '123456',
    database: process.env.DB_NAME || 'timesheet_db'
});

db.connect((err) => {
    if (err) console.log('❌ Lỗi DB:', err);
    else console.log('✅ Đã kết nối MySQL thành công!');
});

// Middleware kiểm tra Session/Auth
app.use((req, res, next) => {
    // Bỏ qua kiểm tra với request login
    if (req.path === '/login') return next();

    const userId = req.headers['x-user-id'];

    // Nếu không có userId (có thể do frontend chưa tích hợp, tạm thời để lỏng rủi ro nếu cần chặt thì mở code dưới)
    if (!userId) {
        return res.status(401).json({ status: 'fail', message: 'Vui lòng đăng nhập!' });
    }

    // Kiểm tra xem user này có tồn tại và đang bị khóa hay không?
    const sql = "SELECT status FROM users WHERE id = ?";
    db.query(sql, [userId], (err, data) => {
        if (err) return res.status(500).json(err);

        if (data.length === 0) {
            return res.status(401).json({ status: 'fail', message: 'Tài khoản không tồn tại!' });
        }

        if (data[0].status === 'Blocked') {
            return res.status(403).json({ status: 'fail', message: 'Tài khoản của bạn đã bị khóa!' });
        }

        next(); // Nếu qua được hết thì cho đi tiếp
    });
});

// =======================================================
// NHÓM 1: CÁC API CƠ BẢN (Login, Lấy danh mục)
// =======================================================

// 1. Đăng nhập
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const sql = "SELECT * FROM users WHERE username = ? AND password = ?";
    db.query(sql, [username, password], (err, data) => {
        if (err) return res.status(500).json(err);
        if (data.length > 0) {
            const user = data[0];
            if (user.status === 'Blocked') {
                return res.json({ status: 'fail', message: 'Tài khoản của bạn đã bị tạm khóa, không thể đăng nhập' });
            }
            return res.json({ status: 'success', user: user });
        }
        return res.json({ status: 'fail', message: 'Sai tài khoản hoặc mật khẩu!' });
    });
});

// 2. Lấy danh sách nhân viên (Dùng cho Admin hiển thị)
app.get('/users', (req, res) => {
    const sql = "SELECT * FROM users";
    db.query(sql, (err, data) => {
        if (err) return res.json(err);
        return res.json(data);
    });
});

// 3. Lấy danh sách công việc (Tasks) để đổ vào menu chọn
app.get('/tasks', (req, res) => {
    const sql = "SELECT * FROM tasks";
    db.query(sql, (err, data) => {
        if (err) return res.json(err);
        return res.json(data);
    });
});

// =======================================================
// NHÓM 2: CÁC API CỦA NHÂN VIÊN (Chấm công, Xem lịch)
// =======================================================

// 4. Lấy lịch sử làm việc của RIÊNG 1 User (Quan trọng: Để vẽ Lịch & Cảnh báo)
app.get('/work-logs/user/:userId', (req, res) => {
    const userId = req.params.userId;
    // Join bảng để lấy tên công việc hiển thị lên Lịch
    const sql = `
        SELECT w.*, t.task_name 
        FROM work_logs w 
        LEFT JOIN tasks t ON w.task_id = t.id 
        WHERE w.user_id = ?
        ORDER BY w.work_date DESC
    `;
    db.query(sql, [userId], (err, data) => {
        if (err) return res.status(500).json(err);
        return res.json(data);
    });
});

// 5. Nộp báo cáo 
app.post('/submit-logs', (req, res) => {
    const logs = req.body;

    // --- VALIDATION (KIỂM TRA HỢP LỆ) ---
    for (let log of logs) {
        // 1. Lấy ngày hiện tại của Server (theo giờ địa phương)
        const now = new Date();
        const todayStr = now.getFullYear() + '-' +
            String(now.getMonth() + 1).padStart(2, '0') + '-' +
            String(now.getDate()).padStart(2, '0');

        // 2. Kiểm tra nhập tương lai (So sánh chuỗi YYYY-MM-DD)
        if (log.date > todayStr) {
            return res.json({
                status: 'fail',
                message: `❌ Lỗi: Bạn đang nhập cho ngày tương lai (${log.date}). Vui lòng kiểm tra lại!`
            });
        }

        // 3. Kiểm tra nhập quá giờ (Giới hạn 16 tiếng cho hợp lý)
        if (log.hours > 16) {
            return res.json({
                status: 'fail',
                message: `❌ Lỗi: Bạn nhập quá 16 tiếng ngày ${log.date}. Không hợp lý!`
            });
        }

        // 4. Kiểm tra quá hạn 7 ngày
        // Chỉ check khi tạo mới (không có id) hoặc sửa (có id) đều chặn
        const entryDate = new Date(log.date); // Chuyển chuỗi log.date thành Date
        const currentDate = new Date();       // Lấy ngày hiện tại

        // Reset giờ về 0 để tính khoảng cách ngày cho chuẩn
        entryDate.setHours(0, 0, 0, 0);
        currentDate.setHours(0, 0, 0, 0);

        const diffTime = Math.abs(currentDate - entryDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays > 7) {
            return res.json({
                status: 'fail',
                message: `❌ Lỗi: Ngày ${log.date} đã quá hạn 7 ngày khóa sổ. Vui lòng liên hệ Manager.`
            });
        }
    }

    const promises = logs.map(log => {
        return new Promise((resolve, reject) => {
            if (log.id) {
                // UPDATE (Sửa công việc cũ)
                const sql = "UPDATE work_logs SET task_id=?, hours=?, description=? WHERE id=?";
                db.query(sql, [log.taskId, log.hours, log.desc, log.id], (err, result) => {
                    if (err) reject(err); else resolve(result);
                });
            } else {
                // INSERT (Thêm công việc mới)
                // Mặc định status là 'Pending' (Chờ duyệt)
                const sql = "INSERT INTO work_logs (user_id, task_id, work_date, hours, description, status) VALUES (?, ?, ?, ?, ?, 'Pending')";
                db.query(sql, [log.userId, log.taskId, log.date, log.hours, log.desc], (err, result) => {
                    if (err) reject(err); else resolve(result);
                });
            }
        });
    });

    Promise.all(promises)
        .then(() => res.json({ status: 'success', message: 'Đã đồng bộ dữ liệu thành công!' }))
        .catch(err => res.status(500).json(err));
});

// 6. Xóa một dòng chấm công
app.delete('/work-logs/:id', (req, res) => {
    const sql = "DELETE FROM work_logs WHERE id = ?";
    db.query(sql, [req.params.id], (err, result) => {
        if (err) return res.status(500).json(err);
        return res.json({ status: 'success' });
    });
});

// =======================================================
// NHÓM 3: CÁC API QUẢN TRỊ (Admin & Manager)
// =======================================================

// 7. Thêm nhân viên mới (Admin)
app.post('/users/add', (req, res) => {
    const { username, full_name, department, role, password, manager_id } = req.body;
    if (!username || !full_name) {
        return res.json({ status: 'fail', message: 'Thiếu tên đăng nhập hoặc họ tên!' });
    }
    const sql = "INSERT INTO users (username, full_name, department, role, password, manager_id) VALUES (?, ?, ?, ?, ?, ?)";
    const finalPass = password || '123';
    const finalManagerId = manager_id || null;

    db.query(sql, [username, full_name, department, role, finalPass, finalManagerId], (err, result) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') return res.json({ status: 'fail', message: 'Tên đăng nhập này đã tồn tại!' });
            return res.status(500).json(err);
        }
        return res.json({ status: 'success', message: 'Đã thêm nhân viên thành công!' });
    });
});

// 7b. Cập nhật thông tin nhân viên (Admin)
app.put('/users/update/:id', (req, res) => {
    const userId = req.params.id;
    const { username, full_name, department, role, password, manager_id } = req.body;

    if (!username || !full_name) {
        return res.json({ status: 'fail', message: 'Thiếu tên đăng nhập hoặc họ tên!' });
    }

    let sql = "UPDATE users SET username=?, full_name=?, department=?, role=?, manager_id=? WHERE id=?";
    let params = [username, full_name, department, role, manager_id || null, userId];

    if (password && password.trim() !== '') {
        sql = "UPDATE users SET username=?, full_name=?, department=?, role=?, manager_id=?, password=? WHERE id=?";
        params = [username, full_name, department, role, manager_id || null, password, userId];
    }

    db.query(sql, params, (err, result) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') return res.json({ status: 'fail', message: 'Tên đăng nhập này đã tồn tại!' });
            return res.status(500).json(err);
        }
        return res.json({ status: 'success', message: 'Đã cập nhật thông tin nhân viên!' });
    });
});

// 8. Xóa nhân viên (Admin)
app.delete('/users/delete/:id', (req, res) => {
    const targetUserId = req.params.id;
    const currentAdminId = req.headers['x-user-id'];

    if (String(targetUserId) === String(currentAdminId)) {
        return res.json({ status: 'fail', message: 'Không thể tự xóa tài khoản của chính mình!' });
    }

    // Kiểm tra thông tin người bị xóa
    const checkSql = "SELECT role, status FROM users WHERE id = ?";
    db.query(checkSql, [targetUserId], (err, data) => {
        if (err) return res.status(500).json(err);
        if (data.length === 0) return res.json({ status: 'fail', message: 'Người dùng không tồn tại!' });

        const targetUserRole = data[0].role;
        const targetUserStatus = data[0].status;

        // Luật mới: Chỉ Admin chính (ID = 1) mới được quyền xóa các Admin phó khác.
        if (targetUserRole === 'admin' && String(currentAdminId) !== '1') {
            return res.json({ status: 'fail', message: 'Chỉ Admin chính mới có quyền xóa Admin phó!' });
        }

        if (targetUserRole === 'admin' && String(targetUserId) === '1') {
            return res.json({ status: 'fail', message: 'Không thể xóa Admin tối cao của hệ thống!' });
        }

        if (targetUserStatus !== 'Blocked') {
            return res.json({ status: 'fail', message: 'Phải Block (Khóa) nhân viên này trước khi xóa!' });
        }

        const sql = "DELETE FROM users WHERE id = ?";
        db.query(sql, [targetUserId], (err, result) => {
            if (err) return res.status(500).json(err);
            return res.json({ status: 'success', message: 'Đã xóa thành công!' });
        });
    });
});

// 8b. Thay đổi trạng thái người dùng (Khóa/Mở Khóa)
app.put('/users/update-status/:id', (req, res) => {
    const targetUserId = req.params.id;
    const currentAdminId = req.headers['x-user-id'];
    const { status } = req.body; // 'Active' hoặc 'Blocked'

    if (String(targetUserId) === String(currentAdminId)) {
        return res.json({ status: 'fail', message: 'Không thể tự khóa tài khoản của chính mình!' });
    }

    // Kiểm tra thông tin người bị khóa
    const checkSql = "SELECT role FROM users WHERE id = ?";
    db.query(checkSql, [targetUserId], (err, data) => {
        if (err) return res.status(500).json(err);
        if (data.length === 0) return res.json({ status: 'fail', message: 'Người dùng không tồn tại!' });

        const targetUserRole = data[0].role;

        // Luật mới tương tự khi Xóa
        if (targetUserRole === 'admin' && String(currentAdminId) !== '1') {
            return res.json({ status: 'fail', message: 'Chỉ Admin chính mới có quyền khóa Admin phó!' });
        }

        if (targetUserRole === 'admin' && String(targetUserId) === '1') {
            return res.json({ status: 'fail', message: 'Không thể khóa Admin tối cao của hệ thống!' });
        }

        const sql = "UPDATE users SET status = ? WHERE id = ?";
        db.query(sql, [status, targetUserId], (err, result) => {
            if (err) return res.status(500).json(err);
            return res.json({ status: 'success', message: `Đã ${status === 'Blocked' ? 'khóa' : 'mở khóa'} tài khoản!` });
        });
    });
});

// 9. Báo cáo thống kê hiệu suất (Manager)
app.get('/manager/stats', (req, res) => {
    const managerId = req.query.managerId;

    // Chỉ tính tổng giờ của những task ĐÃ DUYỆT (Approved) cho chuẩn KPI
    let sql = `
        SELECT u.id, u.full_name, u.department, 
               COALESCE(SUM(CASE WHEN w.status = 'Approved' THEN w.hours ELSE 0 END), 0) as total_hours
        FROM users u
        LEFT JOIN work_logs w ON u.id = w.user_id 
        WHERE u.role = 'staff'
    `;

    const params = [];
    if (managerId) {
        sql += ` AND u.manager_id = ? `;
        params.push(managerId);
    }

    sql += `
        GROUP BY u.id, u.full_name, u.department
        ORDER BY total_hours DESC;
    `;

    db.query(sql, params, (err, data) => {
        if (err) return res.status(500).json(err);
        return res.json(data);
    });
});

// --- API MỚI: Cập nhật trạng thái (Duyệt / Từ chối) ---
app.put('/work-logs/update-status', (req, res) => {
    const { id, status } = req.body; // status sẽ là 'Approved' hoặc 'Rejected'

    const sql = "UPDATE work_logs SET status = ? WHERE id = ?";

    db.query(sql, [status, id], (err, result) => {
        if (err) return res.status(500).json(err);
        return res.json({ status: 'success', message: 'Đã cập nhật trạng thái!' });
    });
});
// --- API MỚI: Manager nhập hộ công việc (Quyền lực tối thượng - Bỏ qua check ngày) ---
app.post('/manager/create-log', (req, res) => {
    const { userId, taskId, date, hours, description } = req.body;

    // Manager nhập thì auto là 'Approved' (Đã duyệt)
    const sql = "INSERT INTO work_logs (user_id, task_id, work_date, hours, description, status) VALUES (?, ?, ?, ?, ?, 'Approved')";

    db.query(sql, [userId, taskId, date, hours, description], (err, result) => {
        if (err) return res.status(500).json(err);
        return res.json({ status: 'success', message: 'Đã bổ sung công việc thành công!' });
    });
});

// --- KHỞI ĐỘNG SERVER ---
app.listen(PORT, () => {
    console.log(`Server đang chạy tại http://localhost:${PORT}`);
});