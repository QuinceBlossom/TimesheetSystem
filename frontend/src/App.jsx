import { useState, useEffect } from 'react';
import { Tabs, Button, Tag, message } from 'antd';
import { EditOutlined, CalendarOutlined, LogoutOutlined } from '@ant-design/icons';
import Timesheet from './components/Timesheet';
import MonthlyView from './components/MonthlyView';
import Login from './components/Login';

// Import 2 trang mới
import AdminDashboard from './components/AdminDashboard';
import ManagerDashboard from './components/ManagerDashboard';

function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    const savedUser = localStorage.getItem('timesheet_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  // 1. STATE DÙNG ĐỂ LÀM MỚI LỊCH
  const [refreshKey, setRefreshKey] = useState(0);

  const handleLogin = (user) => {
    setCurrentUser(user);
    localStorage.setItem('timesheet_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('timesheet_user');
  };

  // 2. HÀM KÍCH HOẠT LÀM MỚI (Đã sửa lỗi thiếu dấu đóng ngoặc ở đây)
  const triggerRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  // Lắng nghe sự kiện Force Logout từ Axios
  useEffect(() => {
    const onForceLogout = (e) => {
      handleLogout();
      message.error(e.detail.message || "Phiên đăng nhập không hợp lệ!");
    };

    window.addEventListener('forceLogout', onForceLogout);
    return () => window.removeEventListener('forceLogout', onForceLogout);
  }, []);
  // ----------------------------------------------------------------

  if (!currentUser) {
    return <Login onLoginSuccess={handleLogin} />;
  }

  // --- LOGIC PHÂN QUYỀN HIỂN THỊ ---

  // 1. Giao diện cho ADMIN
  if (currentUser.role === 'admin') {
    return (
      <div style={{ padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2><Tag color="red">ADMIN</Tag> Xin chào, {currentUser.full_name}</h2>
          <Button icon={<LogoutOutlined />} onClick={handleLogout}>Đăng xuất</Button>
        </div>
        <AdminDashboard />
      </div>
    );
  }

  // 2. Giao diện cho MANAGER
  if (currentUser.role === 'manager') {
    return (
      <div style={{ padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2><Tag color="blue">MANAGER</Tag> Xin chào, {currentUser.full_name}</h2>
          <Button icon={<LogoutOutlined />} onClick={handleLogout}>Đăng xuất</Button>
        </div>
        <ManagerDashboard user={currentUser} />
      </div>
    );
  }

  // 3. Giao diện cho STAFF (Nhân viên)
  const items = [
    {
      key: '1',
      label: <span><EditOutlined /> Nhập Công Việc</span>,
      // Truyền hàm triggerRefresh vào để Timesheet gọi khi lưu xong
      children: <Timesheet user={currentUser} onSaved={triggerRefresh} />
    },
    {
      key: '2',
      label: <span><CalendarOutlined /> Theo dõi khối lượng công việc tháng</span>,
      // Truyền refreshKey vào để MonthlyView biết đường tải lại
      children: <MonthlyView user={currentUser} refreshTrigger={refreshKey} />
    }
  ];

  return (
    <div style={{ padding: '20px 50px', backgroundColor: '#f0f2f5', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2><Tag color="green">STAFF</Tag> Xin chào, {currentUser.full_name}</h2>
        <Button icon={<LogoutOutlined />} onClick={handleLogout}>Đăng xuất</Button>
      </div>
      <Tabs defaultActiveKey="1" items={items} type="card" />
    </div>
  );
}

export default App;