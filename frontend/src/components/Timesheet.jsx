import { useEffect, useState } from 'react';
import axios from '../axiosConfig';
import { Table, Select, InputNumber, Button, Input, message, Alert, TimePicker, Popconfirm } from 'antd';
import { PlusOutlined, DeleteOutlined, SaveOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';

dayjs.locale('vi');

export default function Timesheet({ user, onSaved }) {
  const [tasks, setTasks] = useState([]);
  const [data, setData] = useState([]);
  const [currentDate, setCurrentDate] = useState(dayjs()); // Quản lý tuần đang xem
  const [missingDays, setMissingDays] = useState([]);
  const [pendingScrollDate, setPendingScrollDate] = useState(null); // State để chờ scroll sau khi render

  // --- LOGIC 1: LOAD DỮ LIỆU TỪ DATABASE VÀO BẢNG ---
  const fetchAndMergeData = async () => {
    // 1. Tạo khung xương cho 5 ngày (Thứ 2 -> Thứ 6)
    const startOfWeek = currentDate.startOf('week');
    let weekFrame = [];
    for (let i = 0; i < 5; i++) {
      weekFrame.push(startOfWeek.add(i, 'day'));
    }

    try {
      // 2. Gọi API lấy dữ liệu cũ của user
      const res = await axios.get(`http://localhost:3000/work-logs/user/${user.id}`);
      const dbLogs = res.data; // Dữ liệu từ DB

      let finalData = [];

      // 3. Ghép dữ liệu DB vào khung xương
      weekFrame.forEach(dayObj => {
        const dateStr = dayObj.format('YYYY-MM-DD');
        const dayName = dayObj.format('dddd');

        // Tìm xem ngày này trong DB có dữ liệu không?
        const logsForDay = dbLogs.filter(log => dayjs(log.work_date).format('YYYY-MM-DD') === dateStr);

        if (logsForDay.length > 0) {
          // Nếu CÓ: Map dữ liệu DB ra bảng
          logsForDay.forEach(log => {
            finalData.push({
              key: log.id, // Lưu ý: Key bây giờ là ID thật trong DB
              id: log.id,  // Lưu thêm ID để phân biệt Add/Edit
              date: dateStr,
              dayName: dayName,
              taskId: log.task_id,
              hours: log.hours,
              desc: log.description || ''
            });
          });
        } else {
          // Nếu KHÔNG: Tạo dòng trống để nhập
          finalData.push({
            key: dateStr + '-empty', // Key giả
            id: null,                // Không có ID
            date: dateStr,
            dayName: dayName,
            taskId: null,
            hours: 8.8,
            desc: ''
          });
        }
      });

      setData(finalData);
      checkMissingDays(dbLogs); // Tiện thể check cảnh báo luôn

    } catch (error) {
      console.error("Lỗi load dữ liệu:", error);
    }
  };

  // Chạy hàm này mỗi khi đổi tuần hoặc đổi user
  useEffect(() => {
    if (user) fetchAndMergeData();
  }, [currentDate, user]);

  // Effect để xử lý scroll sau khi data đã load xong
  useEffect(() => {
    if (pendingScrollDate) {
      // Tìm element có id tương ứng
      const element = document.getElementById(`date-${pendingScrollDate}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Highlight nhẹ để user thấy
        element.style.backgroundColor = '#fff1f0';
        setTimeout(() => {
          element.style.backgroundColor = 'transparent';
        }, 2000);
        setPendingScrollDate(null); // Reset state
      }
    }
  }, [data, pendingScrollDate]);

  // --- LOGIC 2: HỆ THỐNG KIỂM TRA CÔNG THIẾU ---
  const checkMissingDays = (workedLogs) => {
    const workedDates = workedLogs.map(item => dayjs(item.work_date).format('YYYY-MM-DD'));
    const missing = [];
    const today = dayjs();

    for (let i = 1; i <= 10; i++) {
      const pastDay = today.subtract(i, 'day');
      if (pastDay.day() === 0 || pastDay.day() === 6) continue;
      const dateStr = pastDay.format('YYYY-MM-DD');
      if (!workedDates.includes(dateStr)) {
        // Lưu object thay vì string để xử lý click
        missing.push({
          date: dateStr,
          label: pastDay.format('DD/MM (dddd)')
        });
      }
    }
    setMissingDays(missing);
  };

  // Hàm xử lý khi click vào ngày thiếu
  const handleJumpToDate = (dateStr) => {
    const targetDate = dayjs(dateStr);
    const startOfTargetWeek = targetDate.startOf('week');
    const startOfCurrentView = currentDate.startOf('week');

    // Nếu ngày đó KHÔNG nằm trong tuần đang xem -> Chuyển tuần
    if (!startOfTargetWeek.isSame(startOfCurrentView, 'day')) {
      setCurrentDate(targetDate);
    }

    // Đặt cờ để scroll sau khi render lại
    setPendingScrollDate(dateStr);
  };

  // --- LOGIC 3: CÁC HÀM XỬ LÝ (GIỮ NGUYÊN HOẶC SỬA NHẸ) ---
  useEffect(() => {
    axios.get('http://localhost:3000/tasks').then(res => {
      setTasks(res.data.map(t => ({ value: t.id, label: t.task_name })));
    });
  }, []);

  const handleAddRow = (currentRecord) => {
    const newData = [...data];
    const index = newData.findIndex(item => item.key === currentRecord.key);
    // Dòng mới thêm sẽ không có ID -> Để Backend biết là INSERT
    const newRow = {
      ...currentRecord,
      key: Date.now().toString(),
      id: null,
      taskId: null, hours: 8.8, desc: ''
    };
    newData.splice(index + 1, 0, newRow);
    setData(newData);
  };

  const handleDeleteRow = (record) => {
    // Nếu dòng này đã có trong DB (có id) -> Gọi API Xóa thật
    if (record.id) {
      axios.delete(`http://localhost:3000/work-logs/${record.id}`)
        .then(() => {
          message.success("Đã xóa dữ liệu!");
          fetchAndMergeData(); // Load lại bảng
        })
        .catch(() => message.error("Lỗi khi xóa!"));
    } else {
      // Nếu dòng này mới nhập (chưa lưu) -> Chỉ xóa trên giao diện
      const count = data.filter(item => item.date === record.date).length;
      if (count > 1) {
        setData(data.filter(item => item.key !== record.key));
      } else {
        // Reset dòng cuối cùng về rỗng
        handleUpdate(record.key, 'taskId', null);
        handleUpdate(record.key, 'hours', 0);
        handleUpdate(record.key, 'desc', '');
      }
    }
  };

  const handleUpdate = (key, field, value) => {
    const newData = data.map(item => item.key === key ? { ...item, [field]: value } : item);
    setData(newData);
  };

  const handleSubmit = () => {
    // Lọc các dòng có dữ liệu
    const validItems = data.filter(item => item.taskId && item.hours > 0);

    if (validItems.length === 0) {
      message.warning("Bạn chưa nhập công việc nào cả!");
      return;
    }

    const payload = validItems.map(item => ({ ...item, userId: user.id }));

    axios.post('http://localhost:3000/submit-logs', payload)
      .then(res => {
        // --- SỬA ĐOẠN NÀY ---
        // Kiểm tra kỹ phản hồi từ Server
        if (res.data.status === 'success') {
          message.success(res.data.message || "✅ Đã lưu thành công!");
          fetchAndMergeData();
          if (onSaved) onSaved();
        } else {
          // Nếu Server bảo 'fail' -> Hiện thông báo lỗi đỏ lòm cho nhân viên biết
          message.error(res.data.message);
        }
        // --------------------
      })
      .catch(err => {
        console.error(err);
        message.error("❌ Lỗi kết nối Server!");
      });
  };

  // --- HÀM CONVERT GIỜ ---
  const floatToTime = (num) => {
    if (!num) return null;
    const hours = Math.floor(num);
    const minutes = Math.round((num - hours) * 60);
    return dayjs().hour(hours).minute(minutes);
  };

  const timeToFloat = (timeObj) => {
    if (!timeObj) return 0;
    return timeObj.hour() + timeObj.minute() / 60;
  };

  // Cấu hình bảng
  const columns = [
    {
      title: 'Ngày',
      dataIndex: 'date',
      width: 120,
      render: (value, record) => (
        <div id={`date-${record.date}`} style={{ textAlign: 'center', transition: 'background-color 0.5s' }}>
          <b style={{ color: '#1890ff' }}>{record.dayName}</b>
          <br />
          <span style={{ fontSize: '12px', color: '#888' }}>{dayjs(value).format('DD/MM')}</span>
        </div>
      ),
      onCell: (record) => {
        const sameDateItems = data.filter(item => item.date === record.date);
        if (record.key === sameDateItems[0].key) {
          return { rowSpan: sameDateItems.length, style: { background: '#fafafa', verticalAlign: 'middle' } };
        }
        return { rowSpan: 0 };
      }
    },
    {
      title: 'Công việc',
      width: 250,
      render: (_, record) => <Select placeholder="Chọn việc..." style={{ width: '100%' }} options={tasks} value={record.taskId} onChange={(val) => handleUpdate(record.key, 'taskId', val)} />
    },
    {
      title: 'Thời gian',
      width: 140,
      render: (_, record) => (
        <TimePicker
          format="HH:mm"
          placeholder="00:00"
          showNow={false}
          minuteStep={5}
          value={floatToTime(record.hours)}
          onChange={(time) => handleUpdate(record.key, 'hours', timeToFloat(time))}
          style={{ width: '100%' }}
        />
      )
    },
    {
      title: 'Mô tả chi tiết',
      render: (_, record) => <Input value={record.desc} onChange={(e) => handleUpdate(record.key, 'desc', e.target.value)} />
    },
    {
      title: 'Xóa/Thêm',
      width: 100,
      align: 'center',
      render: (_, record) => (
        <div style={{ display: 'flex', gap: 5, justifyContent: 'center' }}>
          <Button type="dashed" icon={<PlusOutlined />} size="small" onClick={() => handleAddRow(record)} />
          {/* Thêm Popconfirm để hỏi trước khi xóa */}
          <Popconfirm title="Bạn có chắc muốn xóa?" onConfirm={() => handleDeleteRow(record)}>
            <Button danger icon={<DeleteOutlined />} size="small" />
          </Popconfirm>
        </div>
      )
    }
  ];

  return (
    <div style={{ background: '#fff', padding: 20, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
      {missingDays.length > 0 && (
        <Alert
          message="Cảnh báo: Bạn chưa nhập giờ làm việc!"
          description={
            <ul>
              {missingDays.map(day => (
                <li key={day.date}>
                  <a
                    style={{ color: '#ff4d4f', cursor: 'pointer', textDecoration: 'underline' }}
                    onClick={() => handleJumpToDate(day.date)}
                  >
                    🔴 {day.label}
                  </a>
                </li>
              ))}
            </ul>
          }
          type="error"
          showIcon
          style={{ marginBottom: 20 }}
        />
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, alignItems: 'center' }}>
        <Button icon={<LeftOutlined />} onClick={() => setCurrentDate(currentDate.subtract(1, 'week'))}>Tuần trước</Button>
        <div style={{ textAlign: 'center' }}>
          <h3>Bảng Mô tả Công Việc</h3>
          <span style={{ color: '#1890ff', fontWeight: 'bold' }}>
            {currentDate.startOf('week').format('DD/MM')} - {currentDate.startOf('week').add(4, 'day').format('DD/MM/YYYY')}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Button icon={<RightOutlined />} onClick={() => setCurrentDate(currentDate.add(1, 'week'))} style={{ marginRight: 10 }}>Tuần sau</Button>
          <Button type="primary" icon={<SaveOutlined />} size="large" onClick={handleSubmit}>Gửi Báo Cáo</Button>
        </div>
      </div>
      <Table dataSource={data} columns={columns} pagination={false} bordered rowKey="key" />
    </div>
  );
}