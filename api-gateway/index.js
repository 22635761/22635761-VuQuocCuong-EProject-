const express = require("express");
const httpProxy = require("http-proxy");

const proxy = httpProxy.createProxyServer();
const app = express();


// Thêm error handling cho proxy
proxy.on('error', (err, req, res) => {
  console.error('Proxy error:', err);
  res.status(500).json({ message: 'Proxy error' });
});


// Route requests to the auth service
app.use("/auth", (req, res) => {
  proxy.web(req, res, { target: "http://auth:3000" });
});

// Route requests to the product service
app.use("/products", (req, res) => {
  proxy.web(req, res, { target: "http://product:3001" });
});

// Route requests to the order service - THÊM TIMEOUT
app.use("/orders", (req, res) => {
  proxy.web(req, res, { 
    target: "http://order:3002",
    timeout: 5000
  });
});

// Start the server
const port = process.env.PORT || 3003;
app.listen(port, () => {
  console.log(`API Gateway listening on port ${port}`);
});
