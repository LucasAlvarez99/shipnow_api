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
    await user.save();
    // Nunca devolvemos el password, ni siquiera en la respuesta de creación.
    const { password, ...safeUser } = user.toObject();
    return safeUser;
  }

  async insertMany(users) {
    // Inserción en lote, usada por el módulo de mocking.
    // Ojo: hay que pasar por .toObject() antes de destructurar, igual que en
    // create(). Si no, se pierde el _id (y el resto de los campos), porque
    // un documento de Mongoose no es un objeto plano de JS.
    const inserted = await User.insertMany(users);
    return inserted.map((doc) => {
      const { password, ...safeUser } = doc.toObject();
      return safeUser;
    });
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