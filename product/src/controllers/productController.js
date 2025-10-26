const Product = require("../models/product");
const messageBroker = require("../utils/messageBroker");
const uuid = require('uuid');

/**
 * Class to hold the API implementation for the product services
 */
class ProductController {

  constructor() {
    this.createOrder = this.createOrder.bind(this);
    this.getOrderStatus = this.getOrderStatus.bind(this);
    this.ordersMap = new Map();
  }

  async createProduct(req, res, next) {
    try {
      const token = req.headers.authorization;
      if (!token) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const product = new Product(req.body);

      const validationError = product.validateSync();
      if (validationError) {
        return res.status(400).json({ message: validationError.message });
      }

      await product.save({ timeout: 30000 });

      res.status(201).json(product);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  }

  async createOrder(req, res, next) {
    try {
      const token = req.headers.authorization;
      if (!token) {
        return res.status(401).json({ message: "Unauthorized" });
      }
  
      const { ids } = req.body;
      console.log("🛍️ Creating order for product IDs:", ids);
      
      const products = await Product.find({ _id: { $in: ids } });
      console.log("📦 Found products:", products.length);

      const orderId = uuid.v4();
      
      // DEBUG: Kiểm tra req.user
      console.log("🔍 DEBUG - Full req.user object:", JSON.stringify(req.user, null, 2));
      console.log("🔍 DEBUG - req.user keys:", Object.keys(req.user || {}));
      console.log("🔍 DEBUG - req.user.username:", req.user?.username);
      console.log("🔍 DEBUG - req.user.id:", req.user?.id);

      // FIX: Sử dụng fallback nếu username không tồn tại
      const username = req.user?.username || req.user?.id || "unknown_user";
      console.log("👤 Using username:", username);

      this.ordersMap.set(orderId, { 
        status: "pending", 
        products, 
        username: username
      });
  
      // FIX: Đảm bảo gửi username trong message
      const orderMessage = {
        products,
        username: username,  // QUAN TRỌNG: Thêm username
        orderId,
      };

      console.log("📤 Publishing message to orders queue:", orderMessage);
      await messageBroker.publishMessage("orders", orderMessage);
      console.log("✅ Message published successfully");

      // Consumer cho products queue
      messageBroker.consumeMessage("products", (data) => {
        console.log("📥 Received message from products queue:", data);
        const { orderId } = data;
        const order = this.ordersMap.get(orderId);
        if (order) {
          console.log("🔄 Updating order status to completed");
          this.ordersMap.set(orderId, { ...order, ...data, status: 'completed' });
          console.log("✅ Order updated in map");
        }
      });
  
      // Long polling với timeout và debug
      console.log("⏳ Starting long polling for order:", orderId);
      const startTime = Date.now();
      const timeout = 30000; // 30 seconds
      
      let order = this.ordersMap.get(orderId);
      let pollCount = 0;
      
      while (order.status !== 'completed') {
        pollCount++;
        if (Date.now() - startTime > timeout) {
          console.log("⏰ Order timeout after 30 seconds");
          return res.status(408).json({ message: "Order timeout" });
        }
        
        if (pollCount % 5 === 0) {
          console.log(`🔄 Still polling... (${pollCount} attempts, ${Math.round((Date.now() - startTime) / 1000)}s elapsed)`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        order = this.ordersMap.get(orderId);
      }
  
      console.log("✅ Order completed after", pollCount, "polls");
      const completedOrder = this.ordersMap.get(orderId);
      console.log("📦 Completed order details:", completedOrder);
      
      return res.status(201).json(completedOrder);
    } catch (error) {
      console.error("❌ Order creation error:", error);
      res.status(500).json({ message: "Server error: " + error.message });
    }
  }
  
async getProductById(req, res) {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Not found" });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}




  async getOrderStatus(req, res, next) {
    const { orderId } = req.params;
    const order = this.ordersMap.get(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    return res.status(200).json(order);
  }

  async getProducts(req, res, next) {
    try {
      const token = req.headers.authorization;
      if (!token) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      const products = await Product.find({});

      res.status(200).json(products);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  }
}

module.exports = ProductController;