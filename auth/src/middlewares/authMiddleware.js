const jwt = require("jsonwebtoken");
const config = require("../config");

/**
 * Middleware xác thực chuẩn Bearer Token
 */
module.exports = function (req, res, next) {
  const authHeader = req.headers.authorization || req.headers["x-auth-token"];

  // Kiểm tra header có tồn tại và bắt đầu bằng "Bearer "
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Missing or invalid Authorization header" });
  }

  // Cắt bỏ tiền tố "Bearer " để lấy token thật
  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = decoded;
    console.log("✅ Token verified for user:", decoded.id);
    next();
  } catch (err) {
    console.error("❌ Invalid token:", err.message);
    res.status(401).json({ message: "Token is not valid" });
  }
};
