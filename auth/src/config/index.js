require("dotenv").config();

module.exports = {
  mongoURI: process.env.MONGODB_AUTH_URI || "mongodb://mongodb:27017/auth_db",
  jwtSecret: process.env.JWT_SECRET || "secretkey",
};
