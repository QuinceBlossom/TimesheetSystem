import { Button, Form, Input, Card, Typography, message } from 'antd';
import axios from '../axiosConfig';

const { Title } = Typography;

// Nhận vào hàm onLoginSuccess từ cha (App.jsx) để báo tin vui khi đăng nhập được
export default function Login({ onLoginSuccess }) {

  const handleLogin = (values) => {
    // Gọi API đăng nhập
    axios.post('http://localhost:3000/login', values)
      .then(res => {
        if (res.data.status === 'success') {
          message.success("Đăng nhập thành công!");
          // Gửi thông tin user ngược lên cho App.jsx biết
          onLoginSuccess(res.data.user);
        } else {
          message.error(res.data.message);
        }
      })
      .catch(err => message.error("Lỗi kết nối Server!"));
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f0f2f5' }}>
      <Card style={{ width: 400, padding: 20 }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <Title level={3}>Timesheet System</Title>
          <p>Đăng nhập để chấm công</p>
        </div>

        <Form layout="vertical" onFinish={handleLogin}>
          <Form.Item label="Tên đăng nhập" name="username" rules={[{ required: true, message: 'Nhập username đi bạn!' }]}>
            <Input placeholder="Ví dụ: khuongduy.ph" />
          </Form.Item>

          <Form.Item label="Mật khẩu" name="password" rules={[{ required: true, message: 'Nhập pass đi!' }]}>
            <Input.Password placeholder="Nhập 123" />
          </Form.Item>

          <Button type="primary" htmlType="submit" block size="large">
            Đăng nhập
          </Button>
        </Form>
      </Card>
    </div>
  );
}