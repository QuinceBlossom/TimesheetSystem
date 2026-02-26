(fix)issue: admin thêm chức năng sửa ở khối "hành động", mục đích sẽ có những case cần sửa thông tin cho nhân viên,man, và mục đích nữa là để sắp xếp nhân viên A, nhân B thuộc quản lý A, nhân C thuộc quản lý B.

(fix)issue: Quản lý A và quản lý B đều có thể xem & thực hiện chức năng man toàn năng với toàn bộ nhân viên
sửa như sau quản lý A chỉ có thể thực hiện man toàn năng với nhân viên mà mình quản lý(như quản lý A có thể thực hiện man toàn năng với nhân viên A,B Quản lý B thì là với nhân viên C)

=> phân chia nv cho mỗi man phụ trách tương ứng với mỗi phòng ban:
- man1 phụ trách nv1,nv2
- man2 phụ trách nv2,nv3


issue3: admin > obs:
Khi login admin, thì ở cột hành động ko thể có nút xóa admin đc, tự xóa chính mình? điều này ko hợp lý!

-> nên ẩn nút xóa với vai trờ là admin.

update thêm chức năng cho admin.

issue: login admin2 với vai trò Admin > Xóa Admin2 > Admin2 đã xóa thành công > issue(admin2 đã bị xóa nhưng không bị out khỏi trang Admin, vẫn thực hiện quyền admin được, phải ấn đăng xuất thì mới bị out vad ko login admin2 được nữa)

khi login với vai trò là admin, thì không thể tự xóa chính mình được,
Nên fix cứng Admin hiện tại và admin này có thể thêm sửa xóa đối với vai trò admin khác, những admin được tạo ra sau này thì sẽ chỉ là admin phó mà thôi, các admin phó thì không thể tự xóa lẫn nhau và cũng không thể xóa admin chính.
admin chính có quyền hành to nhất.
=>
Yêu cầu Fix Bug: Quản lý Session & Phân quyền Admin
1. Luồng kiểm tra (Validate) thao tác của Admin

Quy tắc: Hệ thống hiện tại chỉ thiết lập 1 Admin duy nhất.

Logic: Trước khi thực hiện hành động Block (Khóa) hoặc Xóa, hệ thống phải kiểm tra ID của tài khoản đang bị tác động. Nếu ID này trùng với ID của Admin đang thao tác -> Chặn lệnh và hiển thị thông báo: "Không thể tự khóa hoặc xóa tài khoản của chính mình."

Quy trình chuẩn: Admin phải Block người dùng trước để vô hiệu hóa hoàn toàn, sau đó mới có thể xem xét Sửa hoặc Xóa dữ liệu của người dùng đó.

2. Luồng xử lý Backend (Chặn quyền tức thời khi đang Online)

Nguyên nhân lỗi cũ: Hệ thống đang chỉ kiểm tra Token (session) còn hạn hay không, mà bỏ qua việc kiểm tra trạng thái thực tế của user trong Database, dẫn đến việc bị xóa/khóa rồi nhưng Token vẫn dùng được.

Logic cần fix: Tại tất cả các API trong hệ thống (đặc biệt là các API thao tác dữ liệu), sau khi xác thực Token hợp lệ, Backend bắt buộc phải kiểm tra thêm trạng thái của user trong Database:

Nếu user có trạng thái là Blocked hoặc không còn tồn tại (đã bị Xóa) -> Lập tức chặn request, trả về HTTP Code 401 Unauthorized hoặc 403 Forbidden kèm thông báo "Tài khoản đã bị khóa hoặc không tồn tại".

3. Luồng xử lý Frontend (Đá văng user & Chặn Login)

Xử lý Đăng nhập: Khi user bấm Đăng nhập, Frontend gọi API login. Nếu Backend phát hiện trạng thái là Blocked, Frontend hiển thị popup: "Tài khoản của bạn đã bị tạm khóa, không thể đăng nhập" và tuyệt đối không lưu Token.

Xử lý Đăng xuất bắt buộc (Force-logout): Cấu hình chặn lỗi tổng (Interceptor) trên toàn bộ hệ thống Frontend. Bất cứ khi nào nhận được mã lỗi 401 hoặc 403 từ Backend trả về, Frontend phải lập tức:

Xóa sạch Token trong Local Storage/Cookie.

Hiển thị thông báo: "Phiên đăng nhập hết hạn hoặc tài khoản đã bị khóa."

Tự động chuyển hướng (Redirect) người dùng ra màn hình Đăng nhập.
--------------------------------------------------------------
issue2: man > chi tiết > obs:

- man cần xem được toàn bộ lịch sử của nhân viên của mình?
=> có thể thêm 1 chức năng ở mục chi tiết, khi bấm vào có thể xem được lịch của nhân viên đó.
Hoặc khi bấm vào chức năng chọn ngày ở chi tiết thay vì chỉ hiện 1 tấm lịch trắng chơn, có thể thêm vào đó, ngày nào submit r thì khoanh tròn màu xanh, ngày nào chưa thì khanh màu đỏ để man có thể giám sát xem nv của mk ngày nào chưa submit.

admin chính khi sử dụng chức năng sửa thì không thể sửa vai trò được bởi vì admin chính là admin chính, không thể sửa thành admin phó được. 