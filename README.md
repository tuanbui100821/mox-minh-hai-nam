# Những ngày có em — gửi Mox

Website kỷ niệm của **Mox × Đại Đế Tuấn Minh**, bắt đầu từ **25/11/2024**, cùng **Sữa**. Mốc hai năm: **25/11/2026**.

Bản hiện tại kể chuyện qua đúng **5 chương**:

1. **The Premiere** — một hero ảnh thật, tấm vé riêng cho Mox và nút bắt đầu câu chuyện.
2. **The Beginning** — ngày bắt đầu, số ngày thực tế và một timeline ngắn với các mốc đã biết.
3. **Our Everyday Magic** — 12 ảnh tuyển chọn, lời dẫn và đoạn nhỏ dành cho Sữa. Nút mở album đầy đủ gồm 26 ảnh theo địa điểm và ngày chụp.
4. **A Letter for You** — hai lời nhắn ngắn, phong bì và bức thư chính được giữ nguyên nội dung.
5. **To Be Continued** — ba điều muốn làm cùng nhau, khung ảnh tiếp theo, một cái ôm và một đoạn kết duy nhất.

Giao diện dùng Midnight Navy `#172234`, Warm Ivory `#F5F0E7`, Antique Gold `#C7A579`, Dusty Rose `#B9858E`, với Lora và Be Vietnam Pro. Ảnh chỉ phủ màu rất nhẹ; chế độ xem lớn dùng ảnh gốc của bản web. Không có màn chờ bắt buộc, trình chiếu tự chạy hoặc bộ lọc màu trùng lặp. Nội dung vẫn đọc được nếu không có animation; ảnh và phong bì dùng bàn phím được. Toàn bộ chuyển động tôn trọng `prefers-reduced-motion`.

## Chạy và build bằng Java

Cần **JDK 17 trở lên**, không cần Maven hay thư viện Java bên ngoài.

```powershell
.\run.ps1
# http://localhost:8080

.\build.ps1
# dist/ và build/anniversary.jar
```

Java đọc cấu hình UTF-8, kiểm tra dữ liệu, tạo HTML, tạo ảnh xem trước và chạy máy chủ xem trước. HTML/CSS/JavaScript phụ trách giao diện trong trình duyệt. Cloudflare Pages phục vụ thư mục `dist/` do Java tạo.

```powershell
java -jar build/anniversary.jar serve 8080
```

## Nội dung và album

- `config/anniversary.properties`: tên, ngày bắt đầu, tên Sữa và lời nhắn.
- `config/photos.tsv`: 5 cột cách nhau bằng Tab: tên tệp, chú thích, loại ảnh, ngày `yyyy-MM-dd`, mã địa điểm. Ngày không rõ để trống.
- `config/events.tsv`: mã địa điểm, tên địa điểm, tiêu đề và lời dẫn tùy chọn.
- `config/featured.txt`: 10–15 tên tệp được chọn cho chương ký ức; hiện có 12. Java kiểm tra trùng tên và ảnh bị thiếu. Danh sách được trình bày theo các nhóm và ngày chụp; ảnh chưa biết ngày không bị gán ngày giả.
- `content/letter.html`: bức thư chính. Được chèn vào `web/index.html` khi build.
- `web/index.html`, `web/story.css`, `web/app.js`, `web/calendar.js`: giao diện hiện tại. Các cảnh và stylesheet cũ không còn được nhúng vào trang.
- `web/assets/photos/`: 26 ảnh đã có, gồm ảnh đôi và ảnh của Sữa. Java tạo bản xem trước JPEG tối đa 720 × 960 px, chất lượng 82%, không metadata tại `dist/assets/photos/previews/`. Bấm ảnh để mở bản web đầy đủ. Các tệp ảnh nguồn được giữ nguyên.

Album đầy đủ mở trong hộp thoại, có chọn địa điểm. Bấm ảnh để xem lớn, dùng ←/→ để chuyển và Escape để trở về album. Escape lần nữa đóng album. Focus bàn phím trở về nút vừa mở. Khi ảnh không tải được, có thông báo và nút thử lại.

Thư mở ngay khi bấm phong bì, không gõ chữ tự động hay bắt chờ hiệu ứng. Nội dung có vùng cuộn riêng; có thể gấp, mở lại hoặc dùng Escape. Nút ôm chỉ hiện một trái tim nhỏ và một lời nhắn, không phát âm thanh.

## Bộ đếm và nhạc

Số ngày được tính theo **ngày lịch tại Việt Nam (UTC+7)**, cập nhật mỗi phút và khi quay lại tab. Java tạo giá trị ban đầu theo cùng múi giờ. Ngày **30/10/2026 = 704 ngày**; đến **25/11/2026 = 730 ngày**. Sau ngày kỷ niệm, số ngày vẫn tiếp tục tăng.

Bài người dùng cung cấp, “I Love You Baby”, nằm ở `web/assets/audio/i-love-you-baby.m4a`. Nhạc chỉ tải và phát khi bấm nút nhạc; nút bắt đầu câu chuyện không tự bật nhạc. Phát lặp ở âm lượng 28%, tạm dừng/bật lại tiếp tục tại vị trí đang nghe. Nếu lỗi tải hoặc hết thời gian chờ, nút trở lại trạng thái cho phép thử lại. Phông chữ có phông dự phòng khi không tải được Google Fonts.

## Kiểm tra

```powershell
node --check web/app.js
node --check web/calendar.js
node tests/calendar.test.cjs
.\build.ps1
git diff --check
```

Kiểm thử bộ đếm gồm thời điểm hiện tại, trước/sau nửa đêm UTC+7, ngày bắt đầu, trước/sau ngày kỷ niệm và ngày nhuận. Giao diện được kiểm tra trên desktop và màn hình nhỏ, ảnh lớn, album lồng nhau, mở/gấp thư, phím mũi tên/Escape, nhạc và các trạng thái tài nguyên không tải được.

## GitHub và Cloudflare

- Mã nguồn riêng tư: https://github.com/tuanbui100821/mox-minh-hai-nam
- Website: https://mox-minh-hai-nam.pages.dev/
- Mỗi push lên `main` chạy `.github/workflows/deploy-pages.yml`: cài Java 17, build và triển khai `dist/` bằng Wrangler.
- Có thể chạy lại bằng **Run workflow** trong GitHub Actions.
- GitHub Secrets giữ `CLOUDFLARE_ACCOUNT_ID` và `CLOUDFLARE_API_TOKEN`, quyền Pages: Edit, hết hạn 29/10/2027. Không đưa token vào mã nguồn.

Triển khai thủ công khi cần:

```powershell
.\build.ps1
npx --yes wrangler@4.155.0 pages deploy dist --project-name=mox-minh-hai-nam --branch=main
```
