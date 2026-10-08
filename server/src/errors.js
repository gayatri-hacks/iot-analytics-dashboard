export class AppError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export function notFound(req, res) {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` });
}

export function errorHandler(error, req, res, next) {
  if (error.code === 11000) return res.status(409).json({ error: 'Username already exists' });
  if (error.name === 'ValidationError') return res.status(400).json({ error: 'Invalid request data', details: error.message });
  const status = error.status || 500;
  if (status >= 500) console.error(error);
  return res.status(status).json({ error: status >= 500 ? 'Internal server error' : error.message });
}
