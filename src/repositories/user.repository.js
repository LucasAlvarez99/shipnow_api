const User = require('../models/user.model');

class UserRepository {
  async getAll() {
    return User.find({ isDeleted: false }).select('-password -isDeleted -__v');
  }

  async getById(id) {
    return User.findOne({ _id: id, isDeleted: false }).select('-password -isDeleted -__v');
  }

  async getByEmail(email) {
    // Este método sí trae el password: lo necesita el Service para validar login.
    return User.findOne({ email, isDeleted: false });
  }

  async create(data) {
    const user = new User(data);
    return user.save();
  }

  async update(id, data) {
    return User.findOneAndUpdate(
      { _id: id, isDeleted: false },
      data,
      { new: true, runValidators: true }
    ).select('-password -isDeleted -__v');
  }

  async softDelete(id) {
    return User.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { isDeleted: true },
      { new: true }
    );
  }
}

module.exports = new UserRepository();
