const path = require('path');
const winston = require('winston');
require('winston-daily-rotate-file');
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

const isProduction = env.NODE_ENV === 'production';

// En desarrollo se ve todo (incluye debug). En producción solo lo
// relevante: info, warning, error y fatal. Se apoya en NODE_ENV
// (única fuente de verdad de entorno, definida en config/env.config.js).
const consoleLevel = isProduction ? 'info' : 'debug';

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

// Persistencia de errores con rotación diaria. Como el nivel del
// transport es 'error' (prioridad 1) y nuestros niveles son
// fatal=0, error=1, warning=2..., acá SOLO caen 'fatal' y 'error'
// (ni 'warning', ni 'info', ni 'debug').
const errorFileTransport = new winston.transports.DailyRotateFile({
  dirname: LOGS_DIR,
  filename: 'error-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  level: 'error',
  format: fileFormat,
  maxFiles: '14d', // conserva 14 días de historial; los más viejos se eliminan solos
  zippedArchive: true, // los rotados anteriores se comprimen para no ocupar tanto espacio
});

const logger = winston.createLogger({
  levels: LOG_LEVELS,
  level: isProduction ? 'info' : 'debug', // techo general del logger
  format: baseFormat,
  transports: [
    new winston.transports.Console({ level: consoleLevel, format: consoleFormat }),
    errorFileTransport,
  ],
  exitOnError: false,
});

module.exports = logger;
