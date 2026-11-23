# Minh chứng Duy trì Dữ liệu Database (Database Persistence)

## 1. Mục đích thực nghiệm
Chứng minh cơ chế lưu trữ bền vững (Persistence) của cơ sở dữ liệu MongoDB thông qua Docker Named Volume (`mongo_data:/data/db`). Khi các container bị tắt hoặc xóa hoàn toàn bằng lệnh `docker compose down`, toàn bộ dữ liệu ghi chú đã lưu trước đó không bị mất và được phục hồi nguyên vẹn khi khởi chạy lại bằng `docker compose up -d`.

---

## 2. Các bước thực nghiệm và Minh chứng

### Bước 1: Trạng thái ban đầu trên giao diện (`Screenshot 2026-11-03 233716.png`)
* **Thao tác:** Người dùng truy cập ứng dụng qua IP Public của AWS EC2 (`3.25.171.188`), tạo và kiểm tra các ghi chú hiện có trên hệ thống, bao gồm ghi chú `test live demo` với nội dung `đây là test live để test chức năng xập server`.
* **Kết quả:** Hệ thống hiển thị đầy đủ 3 ghi chú được lưu trong MongoDB.

### Bước 2: Dừng toàn bộ hệ thống bằng `docker compose down` (`Screenshot 2026-11-04 001157.png`)
* **Thao tác:** SSH vào máy chủ EC2 và thực hiện lệnh:
  ```bash
  sudo docker compose down
  ```
* **Kết quả:** Docker lần lượt xóa container `note-api-app`, container `note-api-db` và network `devops-note-api_note-network`. Tuy nhiên, Docker giữ nguyên named volume `mongo_data` (không dùng cờ `-v`).

### Bước 3: Xác nhận gián đoạn dịch vụ (`Screenshot 2026-11-04 001131.png`)
* **Thao tác:** Truy cập lại trang web qua trình duyệt khi container đã bị dừng.
* **Kết quả:** Nginx trả về lỗi **`502 Bad Gateway`**, xác nhận ứng dụng backend Node.js và MongoDB đã dừng hoàn toàn, không còn phục vụ kết nối.

### Bước 4: Khởi động lại hệ thống với container mới (`Screenshot 2026-11-04 001229.png`)
* **Thao tác:** Khởi chạy lại toàn bộ hệ thống bằng lệnh:
  ```bash
  sudo docker compose up -d
  ```
* **Kết quả:** Docker tự động tạo lại network và khởi động các container mới cho `note-api-db` và `note-api-app`. Container `note-api-db` tự động mount lại volume `mongo_data:/data/db`.

### Bước 5: Kiểm tra dữ liệu được duy trì thành công (`Screenshot 2026-11-04 001238.png`)
* **Thao tác:** Làm mới lại trang web trên trình duyệt (`http://3.25.171.188`).
* **Kết quả:** Trạng thái hệ thống chuyển sang **Hệ thống Online**, bản ghi `test demo live` (`đây là test để check dữ liệu`) vẫn tồn tại nguyên vẹn trên giao diện.

---

## 3. Kết luận
Thực nghiệm xác nhận cấu hình volume trong `docker-compose.yml` hoạt động chính xác theo tiêu chuẩn DevOps:
* Tách biệt hoàn toàn tầng tính toán (Compute - Containers) và tầng lưu trữ (Storage - Named Volumes).
* Dữ liệu an toàn trước các chu kỳ triển khai mới, nâng cấp container hoặc sự cố sập container.
