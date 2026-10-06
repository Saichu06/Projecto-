const sendSuccess = (res, statusCode = 200, message = 'Success', data = null, pagination = undefined) => {
  const response = {
    success: true,
    message,
    data,
  };
  if (pagination !== undefined) {
    response.pagination = pagination;
  }
  return res.status(statusCode).json(response);
};

const sendError = (res, statusCode = 500, message = 'An error occurred', errors = []) => {
  return res.status(statusCode).json({
    success: false,
    message,
    errors: errors.length > 0 ? errors : undefined,
  });
};

module.exports = {
  sendSuccess,
  sendError,
};
