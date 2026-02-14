import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadDotenv } from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../../../');
loadDotenv({ path: path.join(rootDir, '.env') });

function envValue(key: string): string | undefined {
  const value = process.env[key];
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export const env = {
  nodeEnv: envValue('NODE_ENV') ?? 'development',
  port: Number(envValue('PORT') ?? 3000),
  baseUrl: envValue('BASE_URL') ?? 'https://stilessandgravel.com',
  corsOrigin: envValue('CORS_ORIGIN') ?? '*',
  mediaDir: envValue('MEDIA_DIR') ?? path.join(rootDir, 'media'),
  sqlitePath: envValue('SQLITE_PATH') ?? path.join(rootDir, 'data', 'quotes.db'),
  smtpHost: envValue('SMTP_HOST'),
  smtpPort: Number(envValue('SMTP_PORT') ?? 587),
  smtpUser: envValue('SMTP_USER'),
  smtpPass: envValue('SMTP_PASS'),
  smtpFrom: envValue('SMTP_FROM') ?? 'no-reply@stilessandgravel.com',
  notifyEmail: envValue('NOTIFY_EMAIL') ?? 'info@stilessandgravel.com',
  turnstileSecret: envValue('TURNSTILE_SECRET') ?? '',
};
