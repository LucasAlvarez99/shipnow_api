const userRepository = require('../repositories/user.repository');
const { USER_ROLES } = require('../constants');

class UserService {
  async getAll() {
    return userRepository.getAll();
  }

  async getById(id) {
    const user = await userRepository.getById(id);
    if (!user) {
      const error = new Error('Usuario no encontrado');
      error.statusCode = 404;
      throw error;
    }
    return user;
  }

  async create(data) {
    // Regla de negocio: si no se especifica rol, se asigna USER por defecto (nunca ADMIN por default).
    const role = data.role === USER_ROLES.ADMIN ? USER_ROLES.ADMIN : USER_ROLES.USER;
    return userRepository.create({ ...data, role });
  }

  async update(id, data) {
    const updated = await userRepository.update(id, data);
    if (!updated) {
      const error = new Error('Usuario no encontrado');
      error.statusCode = 404;
      throw error;
    }
    return updated;
  }

  async delete(id) {
    const deleted = await userRepository.softDelete(id);
    if (!deleted) {
      const error = new Error('Usuario no encontrado');
      error.statusCode = 404;
      throw error;
    }
    return deleted;
  }

  // Ejemplo de lógica de negocio que NO debe vivir en el Repository: validar permisos.
  assertIsAdmin(user) {
    if (user.role !== USER_ROLES.ADMIN) {
      const error = new Error('Requiere permisos de administrador');
      error.statusCode = 403;
      throw error;
    }
  }
}

module.exports = new UserService();
