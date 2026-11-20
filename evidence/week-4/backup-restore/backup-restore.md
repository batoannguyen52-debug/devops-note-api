# Database Backup and Restore

## 1. Database Backup

**Ảnh 1 – Thực hiện backup dữ liệu**

Quá trình backup được thực hiện thành công, ghi nhận 3 documents từ collection `notedb.notes` và lưu vào file nén:

`db_backup_2026-11-20_12-49-03_nAoPLZ.archive.gz`

Sau khi hoàn tất, thư mục backup được mở để kiểm tra và xác nhận file backup đã được tạo.

## 2. Database Restore

**Ảnh 2 – Thực hiện restore dữ liệu**

Trước khi khôi phục, hệ thống tiến hành kiểm tra checksum và nhận được kết quả `OK`, xác nhận file backup không có lỗi.

Tiếp theo, container `note-api-app` được dừng an toàn để tránh ảnh hưởng đến quá trình restore. Dữ liệu sau đó được khôi phục thành công với tổng cộng 3 documents.

Cuối cùng, cả hai container `note-api-db` và `note-api-app` đều hoạt động trở lại và đạt trạng thái `Healthy`.

## 3. Kết quả

Quá trình backup và restore diễn ra thành công. File backup được tạo và kiểm tra đầy đủ, dữ liệu được khôi phục chính xác, đồng thời các container hoạt động bình thường sau khi hoàn tất.