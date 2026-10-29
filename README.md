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

## Album và dòng thời gian

Album có **26 ảnh**, chia thành 7 chặng: Hoàng thành Thăng Long 2025, những ngày có Sữa, Huế, rừng dừa Bảy Mẫu, Hội An 2026, Đà Nẵng và những ngày bình thường. Huế có 6 ảnh chụp chung của hai bạn: 2 ảnh chụp gần trong tối 01/09, 2 ảnh toàn cảnh sáng 02/09/2026 và 2 ảnh đôi dưới vòm cổng do người dùng chọn. Hai ảnh vòm cổng là bản lưu màn hình ngày 15/09, chưa rõ ngày chụp nên để trống ngày riêng, không dùng ngày lưu làm ngày đi chơi. Bảy Mẫu có 3 ảnh đôi, gồm hai ảnh thấy trọn thuyền thúng; chú thích vui nhẹ. Album chỉ giữ ảnh đôi, ảnh cùng Sữa và ảnh riêng của Sữa; bỏ các ảnh chụp riêng từng người. Các chặng và ảnh được Java sắp theo ngày chụp. Ngày ảnh mới lấy từ EXIF hoặc thông tin hiển thị trong Google Photos; 5 ảnh cũ chưa có ngày được giữ ở chặng cuối, không tự gán ngày.

Dùng bộ lọc địa điểm hoặc bộ lọc hai đứa / có Sữa; bấm ảnh để xem lớn, dùng phím trái/phải để chuyển ảnh và Escape để đóng. Cuộn phim có 8 khung hình đại diện các chặng. Ảnh lưu cùng dự án nên người xem không cần đăng nhập Google Photos.

Để thêm ảnh:

1. Chép bản ảnh dùng cho web vào `web/assets/photos/`.
2. Khai báo chặng trong `config/events.tsv` với 4 cột cách nhau bằng Tab: mã chặng, địa điểm, tiêu đề, lời dẫn.
3. Thêm dòng vào `config/photos.tsv` với 5 cột: tên tệp, chú thích, loại ảnh, ngày `yyyy-MM-dd` (có thể để trống), mã chặng.

```text
hoi-an.jpg	Hai đứa dưới đèn lồng.	couple	2026-09-03	hoi-an-2026
sua.jpg	Sữa với chiếc khăn đỏ.	pet	2026-01-21	sua
```

Loại ảnh hỗ trợ: `couple`, `family`, `pet`, `portrait`. Dòng 3 cột cũ vẫn được đọc vào chặng `everyday`. Chạy lại build sau khi sửa dữ liệu. Java kiểm tra ngày, mã chặng và tệp ảnh.

Ảnh mới được xuất JPEG tối đa 1800 px, bỏ metadata vị trí và tối ưu dung lượng trước khi đưa lên web. Màu phim chỉ là lớp hiển thị; nút màu ảnh và chế độ xem lớn cho phép xem ảnh không phủ màu phim. Tệp gốc tải về không bị chỉnh sửa.

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

Đặt thư mục đầu ra là `dist`. Nếu môi trường build không có JDK, dùng bản build sẵn trên máy qua Direct Upload. Bản hiện tại đã được triển khai tại **https://mox-minh-hai-nam.pages.dev/**. Mã nguồn nằm trong kho riêng tư **https://github.com/tuanbui100821/mox-minh-hai-nam**.


### Tự động cập nhật từ GitHub

Mỗi lần push lên nhánh `main` của kho `tuanbui100821/mox-minh-hai-nam`, GitHub Actions chạy `.github/workflows/deploy-pages.yml` để:

1. Lấy đúng mã nguồn của commit vừa push.
2. Cài Java 17 và build trang tĩnh vào `dist/`.
3. Dùng Wrangler triển khai lên **https://mox-minh-hai-nam.pages.dev/**.

Theo dõi kết quả ở https://github.com/tuanbui100821/mox-minh-hai-nam/actions. Có thể bấm **Run workflow** để chạy lại trên nhánh `main`.

Dự án Cloudflare giữ kiểu Direct Upload và được GitHub Actions cập nhật tự động. Không cần tạo lại dự án hoặc đổi địa chỉ. Kho GitHub vẫn riêng tư; website là đường dẫn công khai. Trang `lilmox.pages.dev` trước đó không bị thay đổi.

GitHub Secrets của kho chứa `CLOUDFLARE_ACCOUNT_ID` và `CLOUDFLARE_API_TOKEN`. Token chỉ có quyền Cloudflare Pages: Edit trong tài khoản đã chọn và hết hạn ngày **29/10/2027**. Gia hạn hoặc thay token trong Secrets trước ngày đó để tiếp tục triển khai. Không đưa giá trị token vào mã nguồn.

Có thể triển khai thủ công trên máy khi cần:

```powershell
.\build.ps1
npx wrangler pages deploy dist --project-name mox-minh-hai-nam --branch main
```