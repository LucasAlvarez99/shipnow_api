const path = require('path');
const winston = require('winston');
const env = require('./env.config');

/**
 * Niveles de log del proyecto (no son los default de Winston: acá se
 * agrega "warning" y "fatal" en lugar de "warn"/sin fatal). El número
 * indica prioridad: cuanto más bajo, más grave. Cuando un transport
 * define `level: 'X'`, Winston incluye en ese transport todo lo que
 * tenga prioridad <= la de X.
 */
const LOG_LEVELS = {
  fatal: 0,
  error: 1,
  warning: 2,
  info: 3,
  http: 4,
  debug: 5,
};

const LOG_COLORS = {
  fatal: 'bold red',
  error: 'red',
  warning: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

winston.addColors(LOG_COLORS);

// Nivel de consola/techo general del logger. Viene de LOG_LEVEL, una
// variable de entorno obligatoria y validada en config/env.config.js
// (nunca hardcodeada acá). Recomendado: 'debug' en desarrollo, 'info'
// en producción — pero es una decisión de config del deploy, no algo
// fijo en el código.
const consoleLevel = env.LOG_LEVEL;

const LOGS_DIR = path.join(__dirname, '..', '..', 'logs');

// Quita los códigos ANSI de color para poder calcular el padding real
// del texto (si no, el padEnd cuenta también los caracteres de color).
function stripAnsi(str) {
  return str.replace(/\x1b\[[0-9;]*m/g, '');
}

// Formato base compartido entre transports: "timestamp [level]  mensaje".
function buildPrintf() {
  return winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    const visibleLevel = stripAnsi(level);
    const bracket = `[${visibleLevel}]`;
    const padding = ' '.repeat(Math.max(1, 10 - bracket.length));
    const coloredBracket = visibleLevel === level ? bracket : `[${level}]`;
    const metaEntries = Object.keys(meta);
    const metaString = metaEntries.length ? ` ${JSON.stringify(meta)}` : '';
    return `${timestamp} ${coloredBracket}${padding}${stack || message}${metaString}`;
  });
}

const baseFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true })
);

// Consola: con colores, para lectura cómoda durante el desarrollo/debug.
const consoleFormat = winston.format.combine(baseFormat, winston.format.colorize(), buildPrintf());

// Archivo: sin colores (los códigos ANSI no tienen sentido en un .log).
const fileFormat = winston.format.combine(baseFormat, buildPrintf());

// error.log: SOLO fatal y error (nivel del transport = 'error', prioridad
// 1; con nuestros niveles fatal=0/error=1/warning=2..., eso deja afuera
// warning/info/http/debug). Pensado para poder mirar rápido "qué se
// rompió", sin ruido de actividad normal mezclado.
const errorFileTransport = new winston.transports.File({
  dirname: LOGS_DIR,
  filename: 'error.log',
  level: 'error',
  format: fileFormat,
});

// combined.log: actividad general de la app, hasta el techo definido
// por LOG_LEVEL (en producción, típicamente hasta 'info'; en desarrollo,
// hasta 'debug'). Incluye TODO lo que también cae en error.log (fatal y
// error también se escriben acá), más el resto de los niveles.
const combinedFileTransport = new winston.transports.File({
  dirname: LOGS_DIR,
  filename: 'combined.log',
  level: env.LOG_LEVEL,
  format: fileFormat,
});

// Consola: SOLO en desarrollo. En test queda silenciosa (no ensucia la
// salida de `npm test`, que ya reporta sus propios resultados) y en
// producción tampoco escribe a stdout — la actividad real vive en
// combined.log/error.log, que es lo que un orquestador/monitoreo va a
// leer o recolectar, no la consola de un proceso en background.
const transports = [errorFileTransport, combinedFileTransport];
if (env.NODE_ENV === 'development') {
  transports.push(new winston.transports.Console({ level: consoleLevel, format: consoleFormat }));
}

const logger = winston.createLogger({
  levels: LOG_LEVELS,
  level: env.LOG_LEVEL, // techo general del logger
  format: baseFormat,
  transports,
  exitOnError: false,
});

module.exports = logger;
