# DevOps Final Project: Smart Note API

**Môn học:** DevOps - Học kỳ 2026
**Nhóm:** Làng Xì Mi
**Thành viên:**
1. **Nguyễn Bá Toàn:** Thiết kế kiến trúc hạ tầng, thiết lập Server Ubuntu, cấu hình UFW Firewall và Nginx.
2. **Trần Tiến Minh:** Xây dựng backend Node.js (Express), kết nối và cấu hình mô hình dữ liệu.
3. **Hồ Thăng Bảo Huy:** Cài đặt MongoDB, thiết lập PM2, cấu hình Git repo và kiểm thử bằng Postman.

## Hướng dẫn triển khai thủ công (Week 1)
1. Clone source code: `git clone <repository_url>`
2. Cài đặt các dependencies: `sudo apt install nginx mongodb` và Node.js.
3. Vào thư mục dự án chạy: `npm install`
4. Khởi chạy ứng dụng: `pm2 start server.js --name note-api`
5. Cấu hình Nginx proxy_pass về `localhost:3000` và khởi động lại Nginx.