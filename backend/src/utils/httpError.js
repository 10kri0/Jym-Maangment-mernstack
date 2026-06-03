function httpError(status, detail) {
  const error = new Error(detail);
  error.status = status;
  error.detail = detail;
  return error;
}

module.exports = { httpError };
