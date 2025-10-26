const express = require("express");
const httpProxy = require("http-proxy");
const cors = require("cors");
const { createProxyMiddleware } = require("http-proxy-middleware");

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
    target: "http://auth:3000",   // KHÔNG thêm ${req.url}
    changeOrigin: true,
    proxyTimeout: 30000,
    pathRewrite: { "^/auth": "" } // /auth/login -> /login
  });
});



app.use("/products", (req, res) => {
  console.log("👉 req.url:", req.url);
  console.log("👉 req.originalUrl:", req.originalUrl);

  const path = req.originalUrl.replace(/^\/products/, "");
  const target = `http://product:3001/api/products${path}`;

  console.log(`[GATEWAY] ${req.method} ${req.originalUrl} -> ${target}`);

  proxy.web(req, res, {
    target: "http://product:3001",
    changeOrigin: true,
    proxyTimeout: 30000,
    pathRewrite: { "^/products": "/api/products" } // ✅ chỉ rewrite 1 lần
  });
});









// Order service
// Route /orders → chuyển đến /api/products/buy trong Product Service
app.post("/orders", (req, res) => {
  console.log(`[GATEWAY] ${req.method} ${req.originalUrl} -> product:3001/api/products/buy`);
  proxy.web(req, res, {
    target: "http://product:3001/api/products/buy",
    changeOrigin: true,
    ignorePath: true
  });
});




const port = process.env.PORT || 3003;
app.listen(port, () => {
  console.log(`✅ API Gateway listening on port ${port}`);
});
