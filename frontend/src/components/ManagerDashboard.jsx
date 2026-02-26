import { useEffect, useState } from 'react';
import axios from '../axiosConfig';
import { Table, Tag, Button, Modal, Card, Typography, message, Input, Select, DatePicker, InputNumber } from 'antd';
import { EyeOutlined, UserOutlined, PlusCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title } = Typography;

export default function ManagerDashboard({ user }) {
  const [stats, setStats] = useState([]);
  const [tasks, setTasks] = useState([]); // Danh sách đầu việc để Manager chọn

  // State cho Modal & Dữ liệu
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [employeeLogs, setEmployeeLogs] = useState([]);

  // State cho Form "Nhập hộ"
  const [newLog, setNewLog] = useState({ date: null, taskId: null, hours: 0, desc: '' });

  // 1. Load thống kê + Load danh sách Task luôn
  useEffect(() => {
    fetchStats();
    // Lấy danh sách task để nạp vào Select box
    axios.get('http://localhost:3000/tasks').then(res => setTasks(res.data));
  }, []);

  const fetchStats = () => {
    // Only pass managerId if the user is a manager (to be safe, though App.jsx only renders this for managers)
    const url = user?.role === 'manager'
      ? `http://localhost:3000/manager/stats?managerId=${user.id}`
      : 'http://localhost:3000/manager/stats';

    axios.get(url)
      .then(res => setStats(res.data))
      .catch(err => console.error(err));
  };

  const handleViewDetail = (employee) => {
    setSelectedEmployee(employee);
    // Reset form nhập hộ
    setNewLog({ date: null, taskId: null, hours: 0, desc: '' });
    loadEmployeeLogs(employee.id);
    setIsModalOpen(true);
  };

  const loadEmployeeLogs = (empId) => {
    axios.get(`http://localhost:3000/work-logs/user/${empId}`)
      .then(res => setEmployeeLogs(res.data))
      .catch(err => console.error(err));
  };

  // --- HÀM MANAGER DUYỆT / HỦY ---
  const handleUpdateStatus = (logId, newStatus) => {
    axios.put('http://localhost:3000/work-logs/update-status', { id: logId, status: newStatus })
      .then(() => {
        if (newStatus === 'Approved') message.success("Đã duyệt thành công!");
        else message.warning("Đã từ chối công việc này!");

        // Cập nhật giao diện
        setEmployeeLogs(prev => prev.map(log => log.id === logId ? { ...log, status: newStatus } : log));
        fetchStats(); // Update lại số tổng giờ bên ngoài luôn
      })
      .catch(() => message.error("Lỗi kết nối!"));
  };

  // --- HÀM MỚI: MANAGER NHẬP HỘ ---
  const handleManagerAddLog = () => {
    if (!newLog.date || !newLog.taskId || newLog.hours <= 0) {
      message.warning("Vui lòng điền đủ: Ngày, Công việc, Giờ làm > 0");
      return;
    }

    const payload = {
      userId: selectedEmployee.id,
      taskId: newLog.taskId,
      date: newLog.date.format('YYYY-MM-DD'),
      hours: newLog.hours,
      description: newLog.desc
    };

    axios.post('http://localhost:3000/manager/create-log', payload)
      .then(() => {
        message.success("✅ Đã bổ sung công việc cho nhân viên!");
        loadEmployeeLogs(selectedEmployee.id); // Tải lại bảng
        fetchStats(); // Update tổng giờ
        // Reset form
        setNewLog({ date: null, taskId: null, hours: 0, desc: '' });
      })
      .catch(() => message.error("Lỗi khi thêm!"));
  };

  // Cấu hình bảng
  const mainColumns = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    { title: 'Nhân viên', dataIndex: 'full_name', render: (text) => <b style={{ color: '#1890ff' }}>{text}</b> },
    { title: 'Phòng ban', dataIndex: 'department' },
    { title: 'Tổng giờ (Approved)', dataIndex: 'total_hours', render: (val) => <b>{val} giờ</b> },
    {
      title: 'Hành động',
      key: 'action',
      render: (_, record) => <Button type="primary" ghost icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>Chi tiết</Button>
    }
  ];

  const detailColumns = [
    { title: 'Ngày làm', dataIndex: 'work_date', width: 100, render: (val) => dayjs(val).format('DD/MM') },
    { title: 'Công việc', dataIndex: 'task_name', render: (text) => <b>{text}</b> },
    { title: 'Giờ', dataIndex: 'hours', width: 70, render: (val) => <Tag color="blue">{val}h</Tag> },
    {
      title: 'Trạng thái', dataIndex: 'status', width: 100,
      render: (st) => st === 'Approved' ? <Tag color="success">Đã duyệt</Tag> : (st === 'Rejected' ? <Tag color="error">Từ chối</Tag> : <Tag color="warning">Chờ duyệt</Tag>)
    },
    {
      title: 'Duyệt/Hủy',
      render: (_, record) => (record.status || 'Pending') === 'Pending' && (
        <div style={{ display: 'flex', gap: 5 }}>
          <Button size="small" type="primary" onClick={() => handleUpdateStatus(record.id, 'Approved')}>Duyệt</Button>
          <Button size="small" danger onClick={() => handleUpdateStatus(record.id, 'Rejected')}>Hủy</Button>
        </div>
      )
    }
  ];

  return (
    <div>
      <div style={{ display: 'flex', gap: 20, marginBottom: 20 }}>
        <Card style={{ flex: 1 }}><Title level={4}><UserOutlined /> {stats.length} Nhân sự</Title></Card>
        <Card style={{ flex: 1 }}><Title level={4}>⏱ {stats.reduce((sum, i) => sum + parseFloat(i.total_hours), 0).toFixed(1)} giờ Approved</Title></Card>
      </div>

      <h3>📊 Báo cáo hiệu suất nhân sự</h3>
      <Table dataSource={stats} columns={mainColumns} rowKey="id" />

      <Modal
        title={`Chi tiết: ${selectedEmployee?.full_name}`}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        width={900}
        footer={[<Button key="close" onClick={() => setIsModalOpen(false)}>Đóng</Button>]}
      >
        {/* --- KHU VỰC MANAGER NHẬP HỘ --- */}
        <Card size="small" title="🛠 Bổ sung công việc (Quyền Manager)" style={{ marginBottom: 20, background: '#f6ffed', borderColor: '#b7eb8f' }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <DatePicker
              placeholder="Chọn ngày bù..."
              value={newLog.date}
              onChange={(val) => setNewLog({ ...newLog, date: val })}
              cellRender={(current, info) => {
                if (info.type !== 'date') return info.originNode;

                const currentDate = current.format('YYYY-MM-DD');
                const today = dayjs().startOf('day');

                // Skip future dates and weekends (0 = Sunday, 6 = Saturday)
                if (current.isAfter(today) || current.day() === 0 || current.day() === 6) {
                  return info.originNode;
                }

                // Check if log exists for this date
                const hasLog = employeeLogs.some(log => dayjs(log.work_date).format('YYYY-MM-DD') === currentDate);

                const style = {};
                if (hasLog) {
                  style.border = '2px solid #52c41a';    // Green border for submitted
                  style.borderRadius = '50%';
                } else {
                  style.border = '2px solid #ff4d4f';     // Red border for missing
                  style.borderRadius = '50%';
                }

                return (
                  <div className="ant-picker-cell-inner" style={style}>
                    {current.date()}
                  </div>
                );
              }}
            />
            <Select
              placeholder="Chọn việc..."
              style={{ width: 200 }}
              options={tasks.map(t => ({ value: t.id, label: t.task_name }))}
              value={newLog.taskId}
              onChange={(val) => setNewLog({ ...newLog, taskId: val })}
            />
            <InputNumber
              placeholder="Giờ"
              min={0.1} max={24}
              value={newLog.hours}
              onChange={(val) => setNewLog({ ...newLog, hours: val })}
            />
            <Input
              placeholder="Mô tả..."
              value={newLog.desc}
              onChange={(e) => setNewLog({ ...newLog, desc: e.target.value })}
            />
            <Button type="primary" icon={<PlusCircleOutlined />} onClick={handleManagerAddLog}>Thêm</Button>
          </div>
        </Card>

        <Table dataSource={employeeLogs} columns={detailColumns} rowKey="id" pagination={{ pageSize: 5 }} />
      </Modal>
    </div>
  );
}