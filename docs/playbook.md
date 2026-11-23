# Troubleshooting Playbook

Tài liệu hướng dẫn chẩn đoán nhanh, ma trận phân loại sự cố và chi tiết quy trình xử lý 6 sự cố vận hành của hệ thống `devops-note-api`.

Mỗi sự cố được xử lý theo quy trình chuẩn: **Triệu chứng → Xác minh → Nguyên nhân → Khắc phục → Phòng tránh**.

Các lệnh trong tài liệu này được mặc định chạy trên máy chủ AWS EC2 (Ubuntu), trong thư mục `~/devops-note-api` (trừ khi có ghi chú khác).

---

## Triage (Chẩn đoán nhanh)

Khi nhận được cảnh báo hoặc phát hiện dấu hiệu bất thường, thực hiện tuần tự các lệnh sau:

```bash
# 1. Kiểm tra trạng thái toàn bộ containers
sudo docker compose ps -a

# 2. Kiểm tra health check và live check
curl -i http://localhost/health
curl -i http://localhost:3000/live

# 3. Xem log gần nhất của app và db
sudo docker compose logs --tail 50 app db

# 4. Kiểm tra trạng thái và cú pháp Nginx
sudo systemctl status nginx --no-pager
sudo nginx -t

# 5. Kiểm tra tài nguyên đĩa cứng và RAM
df -h
free -m
```

### Nguyên tắc nhận diện nhanh:
* `/live=200`, `/health=503`: Tiến trình Node.js vẫn hoạt động nhưng không kết nối được tới cơ sở dữ liệu MongoDB.
* Nginx trả về `502 Bad Gateway` và cổng `3000` không phản hồi: Ứng dụng `note-api-app` bị sập, đang khởi động lại hoặc xung đột cổng.
* Ứng dụng trực tiếp trên cổng 3000 phản hồi tốt nhưng truy cập qua IP/Nginx bị lỗi: Kiểm tra cấu hình Nginx, Security Group hoặc UFW.

---

## 1. Container App dừng (`note-api-app` stopped) — Đã thực nghiệm

* **Triệu chứng:** Người dùng truy cập qua trình duyệt nhận lỗi `502 Bad Gateway`. Gọi trực tiếp `curl http://localhost:3000/health` bị từ chối kết nối (`Connection refused`).
* **Xác minh:**
  ```bash
  sudo docker compose ps -a app
  sudo docker compose logs --tail 30 app
  ```
* **Nguyên nhân:** Container bị tắt chủ động hoặc crash do lỗi runtime, thiếu RAM (OOM Killer), xung đột cổng bind.
* **Khắc phục:**
  ```bash
  sudo docker compose up -d --no-build --wait --wait-timeout 120 app
  sudo bash scripts/smoke-test.sh http://localhost
  ```
* **Phòng tránh:** Duy trì `restart: always` trong `docker-compose.yml`, kiểm thử tự động trước khi deploy, thiết lập container resource limits.

---

## 2. Container DB dừng (`note-api-db` stopped) — Đã thực nghiệm

* **Triệu chứng:** Endpoint `/live` vẫn trả về `200 OK`, nhưng `/health` trả về `503 Service Unavailable`. Các thao tác xem, tạo, xóa ghi chú trả về lỗi `500`.
* **Xác minh:**
  ```bash
  sudo docker compose ps -a db
  sudo docker compose logs --tail 50 db
  curl -i http://localhost:3000/health
  ```
* **Nguyên nhân:** Container MongoDB bị dừng, hỏng tệp lock, hoặc script backup chạy lúc DB đang dừng.
* **Khắc phục:**
  ```bash
  sudo docker compose up -d --no-build --wait --wait-timeout 120 db
  sudo bash scripts/smoke-test.sh http://localhost
  ```
* **Phòng tránh:** Cấu hình Docker healthcheck cho DB, giám sát dung lượng volume `mongo_data`, không tùy tiện xóa volume khi khắc phục sự cố.

---

## 3. Sai cấu hình `MONGO_URI` — Đã thực nghiệm

* **Triệu chứng:** Container `app` không thể chuyển sang trạng thái `healthy`, log ghi nhận `database_connection_failed`.
* **Xác minh:**
  ```bash
  # Kiểm tra file .env (không in công khai credentials)
  grep MONGO_URI .env
  # Kiểm tra phân giải DNS nội bộ Docker giữa app và db
  sudo docker compose exec app getent hosts db
  ```
* **Nguyên nhân:** Cấu hình sai chuỗi kết nối (ví dụ trỏ vào host không tồn tại `missing-db` thay vì `db:27017`).
* **Khắc phục:**
  ```bash
  # Sửa lại file .env với MONGO_URI chuẩn:
  # MONGO_URI=mongodb://db:27017/notedb
  sudo docker compose up -d --no-build --wait --wait-timeout 120 app
  sudo bash scripts/smoke-test.sh http://localhost
  ```
* **Phòng tránh:** Sử dụng `.env.example` chuẩn hóa, xác minh kết nối qua bước deploy smoke test, không sửa thủ công cấu hình trên production ngoài quy trình.

---

## 4. Tệp sao lưu bị lỗi Checksum (Backup Archive Corruption) — Đã thực nghiệm

* **Triệu chứng:** Lệnh khôi phục `./scripts/restore.sh` thất bại ngay tại bước kiểm tra ban đầu và trả về lỗi `checksum mismatch`.
* **Xác minh:**
  ```bash
  sha256sum -c <tên_file_backup>.sha256
  ```
* **Nguyên nhân:** File nén archive bị lỗi trong quá trình truyền tải, ổ cứng gặp bad sector, hoặc file bị sửa đổi nội dung sau khi backup.
* **Khắc phục:**
  * Giữ nguyên file lỗi để phân tích nguyên nhân.
  * Lựa chọn bản sao lưu hợp lệ liền kề trước đó có checksum trùng khớp để khôi phục.
  * Tuyệt đối không tạo lại checksum đè lên file hỏng để ép restore.
* **Phòng tránh:** Tạo checksum SHA256 tự động ngay sau khi backup, lưu trữ file sao lưu ra ngoài server (S3/GCS), định kỳ kiểm thử diễn tập khôi phục (restore drill).

---

## 5. Quá tải CPU máy chủ hoặc đầy ổ đĩa (High CPU / Disk Full)

* **Triệu chứng:** Ứng dụng phản hồi cực chậm hoặc timeout. CloudWatch cảnh báo `CPU > 70%` hoặc console xuất hiện lỗi `No space left on device`.
* **Xác minh:**
  ```bash
  docker stats --no-stream
  free -m
  df -h
  df -i
  docker system df
  ```
* **Nguyên nhân:** Quá trình build Docker tích tụ dangling images và build cache; file log container tăng quá mức; backup cũ không được xoay vòng (log/backup retention).
* **Khắc phục:**
  ```bash
  # 1. Dọn dẹp build cache và image không dùng (giữ nguyên volumes)
  sudo docker system prune -af
  
  # 2. Xóa các bản backup cũ quá hạn
  # 3. Khởi động lại service nếu CPU bị chiếm dụng bởi tiến trình treo
  sudo docker compose restart app
  ```
* **Phòng tránh:** Cấu hình Docker log rotation (`max-size: "10m"`, `max-file: "3"`), thiết lập cron tự động xóa backup cũ hơn 7 ngày, đặt CloudWatch Alarm cho dung lượng đĩa.

---

## 6. Pipeline CI/CD Deploy thất bại & Kích hoạt Tự động Rollback — Đã thực nghiệm

* **Triệu chứng:** GitHub Actions báo job `deploy` đỏ (Failure). Version mới không được áp dụng, người dùng vẫn truy cập được phiên bản trước đó.
* **Xác minh:**
  * Kiểm tra log job `deploy` trên GitHub Actions.
  * Kiểm tra phiên bản hiện tại trên server qua endpoint: `curl http://localhost/health`.
* **Nguyên nhân:** Code mới không vượt qua bước smoke test sau khi deploy (ví dụ API trả về 503), lỗi kết nối SSH Secrets, hoặc lỗi build Dockerfile.
* **Khắc phục:**
  * Script `deploy.sh` tự động khôi phục (rollback) về application image của phiên bản ổn định trước đó.
  * Nhà phát triển sửa lỗi trên branch, kiểm tra passing test ở local trước khi tạo commit mới.
* **Phòng tránh:** Áp dụng kiểm thử tự động nhiều tầng (`test` → `operations` → `rollback verification`), không deploy trực tiếp khi chưa pass CI.
