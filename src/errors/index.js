const AppError = require('./AppError');
const ERROR_DICTIONARY = require('./error.dictionary');
const domainErrors = require('./domainErrors');

module.exports = {
  AppError,
  ERROR_DICTIONARY,
  ...domainErrors,
};
