const { PAGINATION } = require('../constants');
const { ValidationError } = require('../errors');

/**
 * Parsea y valida `page`/`limit` desde el query de un request.
 * Único lugar del proyecto que decide qué es una paginación válida:
 * los Controllers de listas (products, users, orders, deliveries)
 * llaman a esto ANTES de pasarle nada al Service, así el criterio es
 * siempre el mismo en toda la API. Nunca deja pasar un `limit` mayor a
 * PAGINATION.MAX_LIMIT, aunque lo pidan explícitamente: es el techo que
 * evita que un query devuelva la colección completa sin control.
 */
function parsePagination(query = {}) {
  const rawPage = query.page;
  const rawLimit = query.limit;

  const page = rawPage === undefined ? PAGINATION.DEFAULT_PAGE : Number(rawPage);
  const limit = rawLimit === undefined ? PAGINATION.DEFAULT_LIMIT : Number(rawLimit);

  if (!Number.isInteger(page) || page < 1) {
    throw new ValidationError({
      field: 'page',
      received: rawPage,
      rule: 'Debe ser un entero mayor o igual a 1',
    });
  }

  if (!Number.isInteger(limit) || limit < 1 || limit > PAGINATION.MAX_LIMIT) {
    throw new ValidationError({
      field: 'limit',
      received: rawLimit,
      rule: `Debe ser un entero entre 1 y ${PAGINATION.MAX_LIMIT}`,
    });
  }

  return { page, limit, skip: (page - 1) * limit };
}

// Arma el bloque `pagination` que acompaña a `data` en toda respuesta de
// lista paginada. `totalPages` en 0 cuando no hay resultados (en vez de
// NaN o 1 vacío), para que el cliente no tenga que hacer esa cuenta.
function buildPaginationMeta({ page, limit, total }) {
  return {
    page,
    limit,
    total,
    totalPages: total === 0 ? 0 : Math.ceil(total / limit),
  };
}

module.exports = { parsePagination, buildPaginationMeta };
