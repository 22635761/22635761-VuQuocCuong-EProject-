const express = require("express");
const mongoose = require("mongoose");
const config = require("./config"); // ĐÃ ĐÚNG — vì bạn đang ở src/
const authMiddleware = require("./middlewares/authMiddleware");
const AuthController = require("./controllers/authController");

class App {
  constructor() {
    this.app = express();
    this.authController = new AuthController();
    this.setMiddlewares();
    this.connectDB();
    this.setRoutes();
  }

  async connectDB() {
    try {
      await mongoose.connect(config.mongoURI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log("✅ MongoDB connected successfully to", config.mongoURI);
    } catch (err) {
      console.error("❌ MongoDB connection error:", err.message);
    }
  }

  setMiddlewares() {
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: false }));
  }

  setRoutes() {
    this.app.post("/register", (req, res) => this.authController.register(req, res));
    this.app.post("/login", (req, res) => this.authController.login(req, res));
    this.app.get("/dashboard", authMiddleware, (req, res) =>
      res.json({ message: "Welcome to dashboard" })
    );
  }

  start() {
    const PORT = process.env.PORT || 3000;
    this.server = this.app.listen(PORT, () => console.log(`🚀 Auth Service running on port ${PORT}`));
  }
}

module.exports = App;
