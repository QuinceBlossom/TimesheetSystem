import { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, Select, message, Tag, Popconfirm } from 'antd';
import { UserAddOutlined, DeleteOutlined, EditOutlined, LockOutlined, UnlockOutlined } from '@ant-design/icons';
import axios from '../axiosConfig';

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null); // Khác null là chế độ sửa
  const [form] = Form.useForm(); // Hook để quản lý form

  const currentUser = JSON.parse(localStorage.getItem('timesheet_user'));

  // 1. Hàm lấy danh sách nhân viên
  const fetchUsers = () => {
    axios.get('/users')
      .then(res => setUsers(res.data))
      .catch(err => console.error(err));
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // 2. Hàm xử lý khi bấm nút "Lưu" trên form
  const handleSaveUser = (values) => {
    if (editingUserId) {
      // Chế độ Sửa
      axios.put(`/users/update/${editingUserId}`, values)
        .then(res => {
          if (res.data.status === 'success') {
            message.success(res.data.message);
            setIsModalOpen(false);
            form.resetFields();
            setEditingUserId(null);
            fetchUsers();
          } else {
            message.error(res.data.message);
          }
        })
        .catch(err => message.error("Lỗi hệ thống!"));
    } else {
      // Chế độ Thêm mới
      axios.post('/users/add', values)
        .then(res => {
          if (res.data.status === 'success') {
            message.success(res.data.message);
            setIsModalOpen(false);
            form.resetFields();
            fetchUsers();
          } else {
            message.error(res.data.message);
          }
        })
        .catch(err => message.error("Lỗi hệ thống!"));
    }
  };

  const handleEditClick = (record) => {
    setEditingUserId(record.id);
    form.setFieldsValue({
      username: record.username,
      full_name: record.full_name,
      department: record.department,
      role: record.role,
      manager_id: record.manager_id,
      password: '' // không hiển thị MK cũ
    });
    setIsModalOpen(true);
  };

  // 3. Hàm xóa nhân viên
  const handleDeleteUser = (id) => {
    axios.delete(`/users/delete/${id}`)
      .then(res => {
        if (res.data.status === 'success') {
          message.success(res.data.message);
          fetchUsers();
        } else {
          message.error(res.data.message);
        }
      })
      .catch(err => message.error("Không thể xóa (Do nhân viên này đã có dữ liệu chấm công)!"));
  };

  // 4. Hàm khóa/mở khóa nhân viên
  const handleToggleStatus = (id, currentStatus) => {
    const newStatus = currentStatus === 'Blocked' ? 'Active' : 'Blocked';
    axios.put(`/users/update-status/${id}`, { status: newStatus })
      .then(res => {
        if (res.data.status === 'success') {
          message.success(res.data.message);
          fetchUsers();
        } else {
          message.error(res.data.message);
        }
      })
      .catch(err => message.error("Lỗi cập nhật trạng thái!"));
  }

  // Cấu hình cột cho bảng
  const columns = [
    { title: 'ID', dataIndex: 'id', width: 50 },
    { title: 'Tên đăng nhập', dataIndex: 'username', render: (text) => <b>{text}</b> },
    { title: 'Họ và tên', dataIndex: 'full_name' },
    { title: 'Phòng ban', dataIndex: 'department' },
    {
      title: 'Người quản lý',
      render: (_, record) => {
        const manager = users.find(u => u.id === record.manager_id);
        return manager ? manager.full_name : '---';
      }
    },
    {
      title: 'Vai trò (Quyền)',
      dataIndex: 'role',
      render: (role) => {
        let color = role === 'admin' ? 'red' : role === 'manager' ? 'blue' : 'green';
        return <Tag color={color}>{role ? role.toUpperCase() : 'STAFF'}</Tag>;
      }
    },
    {
      title: 'Hành động',
      render: (_, record) => {
        const isSelf = record.id === currentUser?.id;
        const isBlocked = record.status === 'Blocked';

        // isMainAdmin checks if the record row is the Main Admin (id===1)
        const isMainAdmin = record.id === 1 && record.role === 'admin';
        // isCurrentMainAdmin checks if the logged user is the Main Admin
        const isCurrentMainAdmin = currentUser?.id === 1;

        // Hide action buttons if it's the Main Admin row, and we are NOT the Main Admin
        if (isMainAdmin && !isCurrentMainAdmin) {
          return <span style={{ color: '#999' }}>🔒 (Admin chính)</span>;
        }

        return (
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button type="primary" icon={<EditOutlined />} size="small" onClick={() => handleEditClick(record)}>Sửa</Button>

            {!isSelf && (
              <Popconfirm title={`Bạn muốn ${isBlocked ? 'mở khóa' : 'khóa'} người này?`} onConfirm={() => handleToggleStatus(record.id, record.status)}>
                <Button type={isBlocked ? "default" : "dashed"} danger={!isBlocked} icon={isBlocked ? <UnlockOutlined /> : <LockOutlined />} size="small">
                  {isBlocked ? 'Mở khóa' : 'Khóa'}
                </Button>
              </Popconfirm>
            )}

            {!isSelf && isBlocked && (
              <Popconfirm title="Bạn có chắc chắn muốn xóa vĩnh viễn?" onConfirm={() => handleDeleteUser(record.id)}>
                <Button danger icon={<DeleteOutlined />} size="small">Xóa</Button>
              </Popconfirm>
            )}
          </div>
        );
      }
    }
  ];

  return (
    <div style={{ background: '#fff', padding: 20, borderRadius: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
        <h3>Danh sách nhân sự hệ thống</h3>
        <Button type="primary" icon={<UserAddOutlined />} onClick={() => {
          setEditingUserId(null);
          form.resetFields();
          setIsModalOpen(true);
        }}>
          Thêm nhân viên mới
        </Button>
      </div>

      <Table dataSource={users} columns={columns} rowKey="id" bordered pagination={{ pageSize: 5 }} />

      {/* --- CỬA SỔ NHẬP LIỆU (MODAL) --- */}
      <Modal
        title={editingUserId ? "Sửa thông tin nhân viên" : "Thêm nhân viên mới"}
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          form.resetFields();
          setEditingUserId(null);
        }}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleSaveUser}>

          <Form.Item label="Tên đăng nhập (Duy nhất)" name="username" rules={[{ required: true }]}>
            <Input placeholder="VD: nguyenvan.a" />
          </Form.Item>

          <Form.Item label="Họ và tên" name="full_name" rules={[{ required: true }]}>
            <Input placeholder="VD: Nguyễn Văn A" />
          </Form.Item>

          <Form.Item label="Phòng ban" name="department">
            <Input placeholder="VD: Dev Team, HR..." />
          </Form.Item>

          <Form.Item label="Vai trò (Phân quyền)" name="role" initialValue="staff">
            <Select disabled={editingUserId === 1}>
              <Select.Option value="staff">Nhân viên (Staff)</Select.Option>
              <Select.Option value="manager">Quản lý (Manager)</Select.Option>
              <Select.Option value="admin">Quản trị viên (Admin)</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item label="Người quản lý (Chọn cho nhân viên)" name="manager_id">
            <Select placeholder="-- Chọn người quản lý (Tùy chọn) --" allowClear>
              {users.filter(u => u.role === 'manager' || u.role === 'admin').map(manager => (
                <Select.Option key={manager.id} value={manager.id}>
                  {manager.full_name} ({manager.username})
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label="Mật khẩu" name="password">
            <Input.Password placeholder={editingUserId ? "Để trống nếu không đổi mật khẩu" : "Để trống sẽ tự động là 123"} />
          </Form.Item>

          <Button type="primary" htmlType="submit" block size="large">Lưu lại</Button>
        </Form>
      </Modal>
    </div>
  );
}