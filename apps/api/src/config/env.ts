import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../../../');

export const env = {
  nodeEnv: process.env['NODE_ENV'] ?? 'development',
  port: Number(process.env['PORT'] ?? 3000),
  baseUrl: process.env['BASE_URL'] ?? 'https://stilessandgravel.com',
  corsOrigin: process.env['CORS_ORIGIN'] ?? '*',
  mediaDir: process.env['MEDIA_DIR'] ?? path.join(rootDir, 'media'),
  sqlitePath: process.env['SQLITE_PATH'] ?? path.join(rootDir, 'data', 'quotes.db'),
  smtpHost: process.env['SMTP_HOST'],
  smtpPort: Number(process.env['SMTP_PORT'] ?? 587),
  smtpUser: process.env['SMTP_USER'],
  smtpPass: process.env['SMTP_PASS'],
  smtpFrom: process.env['SMTP_FROM'] ?? 'no-reply@stilessandgravel.com',
  notifyEmail: process.env['NOTIFY_EMAIL'] ?? 'info@stilessandgravel.com',
  turnstileSecret: process.env['TURNSTILE_SECRET'] ?? '',
};
