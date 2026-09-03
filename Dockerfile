# syntax=docker/dockerfile:1

# ============================================================
# Stage 1: instala SOLO las dependencias de producción.
# Separado en su propio stage para aprovechar la cache de Docker: si no
# cambian package.json/package-lock.json, este paso no se vuelve a
# ejecutar en builds siguientes, aunque cambie el código de src/.
# ============================================================
FROM node:22-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# ============================================================
# Stage 2: imagen final, lista para correr.
# No se copia el stage "deps" completo: solo su node_modules ya
# resuelto. Nunca se copian node_modules/.git/.env/test/ desde el
# contexto de build (ver .dockerignore) ni desde este stage.
# ============================================================
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY src ./src

# Carpetas que la app necesita poder escribir en runtime (logs de
# Winston, archivos subidos con Multer). Se crean y se les da ownership
# al usuario "node" ACÁ, como root, porque el proceso va a correr sin
# privilegios y ya no va a poder crearlas ni escribir en /app si no son
# suyas desde antes.
RUN mkdir -p logs uploads/documentos-usuario uploads/comprobantes-entrega \
  && chown -R node:node /app

# La imagen base node:22-alpine ya trae un usuario "node" sin
# privilegios (no hay que crearlo): el proceso de la API nunca corre
# como root dentro del contenedor.
USER node

# Puerto por defecto documentado (coincide con .env.example). El puerto
# real en runtime lo define la variable de entorno PORT (obligatoria,
# validada por src/config/env.config.js); si se cambia PORT al correr el
# contenedor, hay que publicarlo con el mismo número en `docker run -p`.
EXPOSE 3000

# Healthcheck (Módulo 8): usa el endpoint /api/health, que no requiere
# autenticación ni expone información sensible. wget viene incluido en
# la imagen alpine (busybox), así que no hace falta instalar curl aparte.
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:${PORT:-3000}/api/health" || exit 1

CMD ["node", "src/server.js"]
