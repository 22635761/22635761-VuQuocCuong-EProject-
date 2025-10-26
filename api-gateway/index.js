const express = require("express");
const httpProxy = require("http-proxy");
const cors = require("cors");

const proxy = httpProxy.createProxyServer({});
const app = express();

// CORS
app.use(cors({
  origin: true,
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// Middleware giữ nguyên raw body
app.use((req, res, next) => {
  let rawBody = [];
  req.on("data", chunk => rawBody.push(chunk));
  req.on("end", () => {
    req.rawBody = Buffer.concat(rawBody);
    next();
  });
});

// Ghi lại body vào proxyReq
proxy.on("proxyReq", (proxyReq, req) => {
  if (req.headers.authorization) {
    proxyReq.setHeader("Authorization", req.headers.authorization);
  }
  if (req.rawBody && req.rawBody.length > 0) {
    proxyReq.setHeader("Content-Type", "application/json");
    proxyReq.setHeader("Content-Length", req.rawBody.length);
    proxyReq.write(req.rawBody);
  }
});

// Xử lý lỗi proxy
proxy.on("error", (err, req, res) => {
  console.error("Proxy error:", err);
  if (!res.headersSent) {
    res.status(502).json({ message: "API Gateway proxy error" });
  }
});

// ✅ Route /auth → Auth Service
app.use("/auth", (req, res) => {
  console.log(`[GATEWAY] ${req.method} ${req.originalUrl} -> http://auth:3000${req.url}`);
  proxy.web(req, res, {
    target: "http://auth:3000",
    changeOrigin: true,
    proxyTimeout: 30000
  });
});

// ✅ Route /products → Product Service
app.use("/products", (req, res) => {
  // req.url đã bỏ /products prefix
  // VD: /products/123 -> req.url = /123
  const targetPath = `/api/products${req.url}`;
  
  console.log(`[GATEWAY] ${req.method} ${req.originalUrl} -> http://product:3001${targetPath}`);
  
  // Thay đổi req.url trước khi proxy
  req.url = targetPath;
  
  proxy.web(req, res, {
    target: "http://product:3001",
    changeOrigin: true,
    proxyTimeout: 30000
  });
});

// ✅ Route /orders → Product Service
app.post("/orders", (req, res) => {
  console.log(`[GATEWAY] ${req.method} ${req.originalUrl} -> http://product:3001/api/products/buy`);
  
  req.url = "/api/products/buy";
  
  proxy.web(req, res, {
    target: "http://product:3001",
    changeOrigin: true,
    proxyTimeout: 30000
  });
});

const port = process.env.PORT || 3003;
app.listen(port, () => {
  console.log(`✅ API Gateway listening on port ${port}`);
});