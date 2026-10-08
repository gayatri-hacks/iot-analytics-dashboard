import app from './app.js';
import { validateConfig, config } from './config.js';
import { connectDatabase } from './db.js';

validateConfig();
await connectDatabase();
app.listen(config.port, () => console.log(`API listening on http://localhost:${config.port}`));
