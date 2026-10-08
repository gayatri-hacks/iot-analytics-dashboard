import mongoose from 'mongoose';
import { config } from './config.js';

export function connectDatabase() {
  return mongoose.connect(config.mongoUri);
}
