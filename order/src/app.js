const express = require("express");
const mongoose = require("mongoose");
const Order = require("./models/order");
const amqp = require("amqplib");
const config = require("./config");

class App {
  constructor() {
    this.app = express();
    this.connectDB();
    this.setupOrderConsumer();
  }

  async connectDB() {
    await mongoose.connect(config.mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB connected");
  }

  async disconnectDB() {
    await mongoose.disconnect();
    console.log("MongoDB disconnected");
  }

  async setupOrderConsumer() {
    console.log("Connecting to RabbitMQ...");
  
    setTimeout(async () => {
      try {
        const amqpServer = "amqp://rabbitmq:5672";
        const connection = await amqp.connect(amqpServer);
        console.log("Connected to RabbitMQ");
        const channel = await connection.createChannel();
        await channel.assertQueue("orders");
  
        channel.consume("orders", async (data) => {
          try {
            console.log("📦 Consuming ORDER service - Message received");
            
            // FIX: Parse message và validate
            const orderData = JSON.parse(data.content.toString());
            console.log("📨 Raw order data:", orderData);
            
            const { products, username, orderId } = orderData;

            // FIX: Validate required fields
            if (!username) {
              console.error("❌ Username is required in message");
              channel.nack(data, false, false); // Reject message
              return;
            }

            if (!products || !Array.isArray(products) || products.length === 0) {
              console.error("❌ Products array is required and cannot be empty");
              channel.nack(data, false, false);
              return;
            }

            console.log(`🛍️ Processing order for user: ${username}, Products: ${products.length}`);

            const newOrder = new Order({
              products: products.map(p => ({
                productId: p._id,
                price: p.price,
              })),
              user: username,
              totalPrice: products.reduce((acc, product) => acc + product.price, 0),
            });

            // Save order to DB
            console.log("💾 Saving order to MongoDB...");
            await newOrder.save();
            console.log("✅ Order saved to DB");

            // Send ACK
            channel.ack(data);
            console.log("📫 ACK sent to ORDER queue");

            // Send fulfilled order to PRODUCTS service
            const orderResponse = {
              orderId,
              user: username,
              products: newOrder.products,
              totalPrice: newOrder.totalPrice
            };

            console.log("🔄 Sending response to products queue:", orderResponse);
            channel.sendToQueue(
              "products",
              Buffer.from(JSON.stringify(orderResponse))
            );
            console.log("✅ Response sent to PRODUCTS queue");

          } catch (error) {
            console.error("❌ Error processing order:", error.message);
            console.error("Error details:", error);
            // Reject message và không thử lại
            channel.nack(data, false, false);
          }
        });
      } catch (err) {
        console.error("Failed to connect to RabbitMQ:", err.message);
      }
    }, 10000);
  }

  start() {
    this.server = this.app.listen(config.port, () =>
      console.log(`Server started on port ${config.port}`)
    );
  }

  async stop() {
    await mongoose.disconnect();
    this.server.close();
    console.log("Server stopped");
  }
}

module.exports = App;