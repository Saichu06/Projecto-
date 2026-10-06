const ApiError = require('../utils/errors');
const { sendError } = require('../utils/apiResponse');

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let errors = err.errors || [];

  // Handle Prisma errors
  if (err.code === 'P2002') {
    statusCode = 409;
    const target = err.meta?.target ? ` (${err.meta.target.join(', ')})` : '';
    message = `A resource with this identifier already exists${target}.`;
  } else if (err.code === 'P2025') {
    statusCode = 404;
    message = 'The requested resource was not found.';
  } else if (err.code === 'P2003') {
    statusCode = 400;
    message = 'Invalid reference: Related entity does not exist.';
  }

  // Handle JSON parse syntax errors
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    statusCode = 400;
    message = 'Malformed JSON payload in request body.';
  }

  // Log server errors in development
  if (process.env.NODE_ENV === 'development' && statusCode === 500) {
    console.error('Unhandled Server Error:', err);
  }

  return sendError(res, statusCode, message, errors);
};

const notFoundHandler = (req, res, next) => {
  return sendError(res, 404, `Cannot ${req.method} ${req.originalUrl} - Endpoint not found`);
};

module.exports = {
  errorHandler,
  notFoundHandler,
};
