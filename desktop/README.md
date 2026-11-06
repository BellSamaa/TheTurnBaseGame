# Dice Maniac trên Windows

Mọi người dùng cùng một địa chỉ máy chủ trong ứng dụng. Máy chủ chạy Next.js trên PC hoặc mini PC của bạn. Supabase lưu tài khoản, rank và dữ liệu online.

1. Trên máy chủ, tạo `.env.local` ở thư mục gốc game với các biến bên dưới. Dùng thông tin của dự án Supabase đang chạy game. Giữ file này trên máy chủ.

   ```dotenv
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   SUPABASE_SERVICE_ROLE_KEY=
   AUTH_SESSION_SECRET=
   ```

   Dùng khóa ký phiên riêng cho máy chủ. Có thể tạo khóa ngẫu nhiên bằng `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`.

2. Trong thư mục gốc game, chạy `npm ci` nếu chưa cài các gói. Chạy `node desktop/host.cjs --check` để kiểm tra kết nối và hai bảng `users`, `rooms` mà không đọc dữ liệu người chơi. Sau đó chạy `npm run build` và `node desktop/host.cjs` để mở máy chủ ở cổng 3000.
3. Để chơi qua Internet theo buổi, tải cloudflared cho Windows x64 và chạy `& '.\desktop\dist\cloudflared-windows-amd64.exe' tunnel --url http://127.0.0.1:3000` trong PowerShell từ thư mục gốc game, nếu bạn đặt file ở `desktop/dist`. Gửi địa chỉ HTTPS được in ra cùng bộ cài cho bạn bè. Máy chủ và tunnel cần chạy trong lúc chơi. Quick Tunnel cấp địa chỉ mới mỗi lần khởi động. [Cloudflare Quick Tunnel](https://developers.cloudflare.com/tunnel/get-started/quick-tunnels/)
4. Sau khi cài app, mở Dice Maniac, nhập địa chỉ HTTPS rồi bấm **Kết nối**. Trên chính máy chủ, có thể dùng `http://127.0.0.1:3000` để kiểm tra. Vào **Dice Maniac → Đổi máy chủ** khi cần cập nhật địa chỉ.

Để tạo lại bộ cài x64, chạy `npm ci` rồi `npm run build` trong thư mục `desktop`. Bộ cài nằm trong `desktop/dist`.
