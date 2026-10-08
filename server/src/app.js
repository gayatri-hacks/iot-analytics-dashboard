import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import routes from './routes.js';
import { config } from './config.js';
import { errorHandler, notFound } from './errors.js';

const app = express();
app.use(helmet());
app.use(cors({ origin: config.clientOrigin }));
app.use(express.json({ limit: '20kb' }));
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api', routes);
app.use(notFound);
app.use(errorHandler);

export default app;
