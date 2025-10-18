const User = require("../models/user");

class UserRepository {
  async createUser(user) {
    const created = await User.create(user);
    console.log("🟢 User saved to MongoDB:", created);
    return created;
  }

  async getUserByUsername(username) {
    return await User.findOne({ username });
  }
}

module.exports = UserRepository;
