import jwt from 'jsonwebtoken';
import { config } from './config.js';
import { User } from './models.js';

export async function auth(req, res, next) {
  try {
    const header = req.get('authorization');
    const token = header?.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Authentication token is required' });

    // Verify the token before loading the user so every protected route has one trusted identity.
    const payload = jwt.verify(token, config.jwtSecret);
    const user = await User.findById(payload.userId).select('-passwordHash');
    if (!user) return res.status(401).json({ error: 'User no longer exists' });
    req.user = user;
    return next();
  } catch (error) {
    return res.status(401).json({ error: error.name === 'TokenExpiredError' ? 'Token has expired' : 'Invalid token' });
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) return res.status(403).json({ error: 'Insufficient permissions' });
    return next();
  };
}
