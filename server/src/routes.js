import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { config } from './config.js';
import { User, Reading } from './models.js';
import { AppError } from './errors.js';
import { auth, requireRole } from './middleware.js';
import { generateReading } from './generator.js';
import { analyzeReadings } from './analysis.js';

const router = express.Router();
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, standardHeaders: 'draft-8', legacyHeaders: false });
const credentials = (body = {}) => {
  const username = typeof body.username === 'string' ? body.username.trim() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  if (!/^[a-zA-Z0-9_-]{3,30}$/.test(username)) throw new AppError(400, 'Username must be 3-30 characters and use letters, numbers, underscores, or hyphens');
  if (password.length < 8) throw new AppError(400, 'Password must be at least 8 characters');
  return { username, password };
};
const publicUser = (user) => ({ id: user._id, username: user.username, role: user.role });
const tokenFor = (user) => jwt.sign({ userId: user._id.toString() }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });

router.post('/auth/register', authLimiter, async (req, res) => {
  const { username, password } = credentials(req.body);
  const user = await User.create({ username, passwordHash: await bcrypt.hash(password, 12), role: username === config.adminUsername ? 'admin' : 'analyst' });
  return res.status(201).json({ user: publicUser(user), token: tokenFor(user) });
});

router.post('/auth/login', authLimiter, async (req, res) => {
  const { username, password } = credentials(req.body);
  const user = await User.findOne({ username });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) throw new AppError(401, 'Invalid credentials');
  return res.json({ user: publicUser(user), token: tokenFor(user) });
});

router.get('/auth/me', auth, (req, res) => res.json({ user: publicUser(req.user) }));

router.post('/readings/generate', auth, async (req, res) => {
  const count = Number(req.body?.count);
  if (!Number.isInteger(count) || count < 1 || count > 500) throw new AppError(400, 'Count must be an integer from 1 to 500');
  const readings = Array.from({ length: count }, () => ({ ...generateReading(), userId: req.user._id }));
  const saved = await Reading.insertMany(readings);
  return res.status(201).json({ readings: saved, count: saved.length });
});

router.get('/readings', auth, async (req, res) => {
  const readings = await Reading.find({ userId: req.user._id }).sort({ timestamp: 1 }).lean();
  return res.json({ readings, count: readings.length });
});

router.get('/readings/analysis', auth, async (req, res) => {
  const readings = await Reading.find({ userId: req.user._id }).sort({ timestamp: 1 }).lean();
  const analysis = analyzeReadings(readings);
  const anomalyIndexes = new Set(analysis.anomalyIndexes);
  const markedReadings = readings.map((reading, index) => ({ ...reading, isAnomaly: anomalyIndexes.has(index) }));
  await Promise.all(markedReadings.filter((reading) => reading.isAnomaly).map((reading) => Reading.updateOne({ _id: reading._id }, { isAnomaly: true })));
  return res.json({ ...analysis, readings: markedReadings });
});

router.get('/admin/readings', auth, requireRole('admin'), async (req, res) => {
  const readings = await Reading.find().populate('userId', 'username role').sort({ timestamp: -1 }).lean();
  return res.json({ readings, count: readings.length });
});

export default router;
