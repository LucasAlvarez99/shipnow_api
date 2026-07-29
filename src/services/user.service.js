const userRepository = require('../repositories/user.repository');
const { USER_ROLES } = require('../constants');
const { UserNotFoundError, ForbiddenError, ValidationError } = require('../errors');

class UserService {
  async getAll() {
    return userRepository.getAll();
  }

  async getById(id) {
    const user = await userRepository.getById(id);
    if (!user) {
      throw new UserNotFoundError(id);
    }
    return user;
  }

  async create(data) {
    if (!data.name || !data.email || !data.password) {
      throw new ValidationError({ required: ['name', 'email', 'password'] });
    }

    // Regla de negocio: si no se especifica rol, se asigna USER por defecto (nunca ADMIN por default).
    const role = data.role === USER_ROLES.ADMIN ? USER_ROLES.ADMIN : USER_ROLES.USER;
    return userRepository.create({ ...data, role });
  }

  async update(id, data) {
    const updated = await userRepository.update(id, data);
    if (!updated) {
      throw new UserNotFoundError(id);
    }
    return updated;
  }

  async delete(id) {
    const deleted = await userRepository.softDelete(id);
    if (!deleted) {
      throw new UserNotFoundError(id);
    }
    return deleted;
  }

  // Ejemplo de lógica de negocio que NO debe vivir en el Repository: validar permisos.
  assertIsAdmin(user) {
    if (user.role !== USER_ROLES.ADMIN) {
      throw new ForbiddenError({ requiredRole: USER_ROLES.ADMIN });
    }
  }
}

module.exports = new UserService();
