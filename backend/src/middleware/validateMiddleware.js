const ApiError = require('../utils/errors');

const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    try {
      const parsed = schema.parse(req[source]);
      req[source] = parsed;
      next();
    } catch (error) {
      if (error.errors) {
        const formattedErrors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));
        return next(ApiError.badRequest('Validation failed', formattedErrors));
      }
      return next(ApiError.badRequest('Invalid input data'));
    }
  };
};

module.exports = validate;
