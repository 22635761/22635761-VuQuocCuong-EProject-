require("dotenv").config();

module.exports = {
  mongoURI: process.env.MONGODB_ORDER_URI || "mongodb://mongodb:27017/orders",
  rabbitMQUrl: process.env.RABBITMQ_URI || "amqp://rabbitmq:5672",
  rabbitMQQueue: "orders",
  port: process.env.PORT || 3002,
  jwtSecret: process.env.JWT_SECRET || "secretkey"
};
