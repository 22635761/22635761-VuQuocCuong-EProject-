| Dịch vụ             | Mô tả                                                                 | Cổng             |
| ------------------- | --------------------------------------------------------------------- | ---------------- |
| **API Gateway**     | Điểm truy cập duy nhất cho client, định tuyến request tới các service | `3003`           |
| **Auth Service**    | Quản lý đăng ký, đăng nhập, xác thực người dùng (JWT)                 | `3000`           |
| **Product Service** | Quản lý sản phẩm, gửi message qua RabbitMQ                            | `3001`           |
| **Order Service**   | Xử lý đơn hàng nhận từ RabbitMQ                                       | `3002`           |
| **RabbitMQ**        | Trung gian giao tiếp giữa các service                                 | `5672` / `15672` |
| **MongoDB**         | Cơ sở dữ liệu lưu người dùng, sản phẩm, đơn hàng                      | `27017`          |


Tạo các file .env
Tạo file .env riêng trong từng service (Auth, Product, Order, API Gateway).
auth/.env:
![alt text](public/img/env_auth.png)

orther/.env:
![alt text](public/img/orther_env.png)

product/.env:
![alt text](public/img/p_env.png)

Test trên Postman 
🔹 Đăng ký
POST http://localhost:3003/auth/register
Body:
{
  "username": "cuong",
  "password": "123456"
}
![alt text](public/img/dktc.png)

🔹 Đăng nhập
POST http://localhost:3003/auth/login
Body:
{
  "username": "cuong",
  "password": "123456"
}

![alt text](public/img/dntc.png)


Lưu token trả về.

{
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4ZWY2YjQ1YjRiNTg1ZTI0MWZiYjUyNyIsImlhdCI6MTc2MDUyMTIzNH0.yIj6C56kqbehESmj8kccDGqRNdxOLxCMhmfXJq-7WBU"
}



🔹 Tạo sản phẩm
POST http://localhost:3003/products
Header: Authorization: Bearer <JWT_TOKEN>
Body:
{
  "name": "Laptop Dell XPS 13",
  "price": 2500,
  "description": "13-inch ultrabook"
}
🔹 Mua sản phẩm
POST http://localhost:3003/products/buy
Header: Authorization: Bearer <JWT_TOKEN>
Body:
{
  "ids": ["<product_id>"]
}