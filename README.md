# Những ngày có em — gửi Mox

Món quà kỷ niệm dành cho **Mox × Đại Đế Tuấn Minh**, từ **25/11/2024**, và bé **Sữa**. Bản dài mang hai sắc thái điện ảnh Hồng Kông: đỏ rượu–hổ phách–ô liu và xanh ngọc–cyan–vàng neon. Giữ lời nhắn **kiss RockKiss**, lá thư riêng và khung hình dành cho ngày mai.

Trang có thêm chiếc vé ngày bắt đầu, cảnh phòng đỏ, cảnh phố xanh, cuộn ảnh chuyển tay kèm lời kể, bốn mẩu nhắn mở riêng, danh sách những điều mong được làm cùng nhau và cảnh sau phần kết. Các mẩu nhắn và kế hoạch tương lai là lời viết gợi ý, không gán những kỷ niệm chưa được cung cấp cho hai bạn.

Các cảnh bổ sung nằm trong `content/`. Java đọc chúng khi build và điền vào trang chính. Bộ chọn màu đổi giữa phối hai sắc phim, phòng đỏ và phố xanh. Màu ảnh dùng hai bộ lọc SVG ở `content/filters.html` kết hợp lớp ánh sáng CSS; không sửa tập tin ảnh gốc. `web/cinema-extended.js` điều khiển cuộn ảnh và lời cuối sau phần kết. Không có ảnh hay nhạc lấy từ phim.

## Chạy trên máy

Cần **JDK 17 trở lên**. Không cần Maven, Node.js hay thư viện ngoài.

```powershell
powershell -ExecutionPolicy Bypass -File .\run.ps1
```

Mở http://localhost:8080. Dừng bằng Ctrl+C. Đổi cổng: `-Port 8090`.

## Build bằng Java

```powershell
powershell -ExecutionPolicy Bypass -File .\build.ps1
```

- `dist/`: website tĩnh để đưa lên Cloudflare Pages hoặc dịch vụ hosting tĩnh.
- `build/anniversary.jar`: ứng dụng Java tự chứa cả giao diện. Chạy `java -jar build/anniversary.jar serve 8080` bằng JDK 17+.

Java thực hiện đọc cấu hình, tạo HTML, dựng album, kiểm tra dữ liệu, xuất trang tĩnh và chạy HTTP server. Giao diện trình duyệt dùng HTML/CSS và JavaScript cho hiệu ứng, bộ đếm, âm thanh và tương tác; trình duyệt không chạy Java trực tiếp. Cloudflare Pages phục vụ bản tĩnh do Java tạo, không chạy máy chủ Java.

## Thêm ảnh sau khi backup

1. Tạo thư mục `web/assets/photos`, chép ảnh `.jpg`, `.png` hoặc `.webp` vào đó.
2. Thêm dòng vào `config/photos.tsv`, mỗi cột cách bằng **Tab**:

```text
hai-dua.jpg	Một ngày có nhau	couple
ca-ba.jpg	Gia đình nhỏ	family
sua.jpg	Vệ tinh đáng yêu	pet
```

3. Chạy lại build hoặc run. Album tự xuất hiện; bộ lọc, phóng to, phím trái/phải và Escape đã có sẵn.

Đã tích hợp 5 ảnh được chọn và tải về trước khi chờ backup: 4 ảnh hai bạn, 1 ảnh có cả Sữa. Có thể thêm ảnh mới theo hướng dẫn trên. Trang dùng ảnh lưu cùng dự án, không cần tài khoản Google của người xem. Màu phim là lớp hiển thị CSS; nút "Màu phim / xem ảnh gốc" đổi qua lại. Khi mở ảnh toàn màn hình sẽ thấy ảnh gốc, các tập tin ảnh được giữ nguyên.

## Cá nhân hóa

Sửa `config/anniversary.properties` (UTF-8) để đổi biệt danh, tên Sữa và ngày bắt đầu. Nội dung thư ở `web/index.html`, các cảnh bổ sung ở `content/`. Thư hiện là lời nhắn viết sẵn, có thể chỉnh lại trước khi gửi Mox. Bấm "Đọc thư anh viết" để mở thư; đây là hiệu ứng giao diện, không phải mật khẩu bảo vệ nội dung.

Ngày bên nhau tính từ 00:00 ngày 25/11/2024 theo UTC+7. Mốc hai năm là 25/11/2026. Giai điệu nhẹ được tổng hợp trong trình duyệt và chỉ phát khi bấm nút. Phông Google Fonts cần mạng; có phông dự phòng khi ngoại tuyến. Hiệu ứng tôn trọng chế độ giảm chuyển động.

## Cloudflare Pages

Build trên máy bằng lệnh trên rồi tải **nội dung thư mục `dist`** lên dự án Pages dùng Direct Upload. Khi dùng Git, thiết lập môi trường có JDK 17 và chạy:

```sh
mkdir -p build/classes
javac -encoding UTF-8 -d build/classes src/Anniversary.java
java -cp build/classes Anniversary build .
```

Đặt thư mục đầu ra là `dist`. Nếu môi trường build không có JDK, dùng bản build sẵn trên máy qua Direct Upload. Bản nền này chưa được đưa lên Internet.

