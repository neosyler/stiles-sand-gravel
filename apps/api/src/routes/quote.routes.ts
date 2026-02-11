import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';
import { saveQuoteRequest } from '../db/sqlite.js';
import { sendQuoteNotification } from '../services/email.service.js';
import { quoteRequestSchema } from '../utils/validation.js';

export const quoteRouter = Router();

const quoteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many quote requests. Please try again shortly.' },
});

async function verifyTurnstileToken(token: string, remoteIp: string): Promise<boolean> {
  if (!env.turnstileSecret) {
    return true;
  }

  const body = new URLSearchParams({
    secret: env.turnstileSecret,
    response: token,
    remoteip: remoteIp,
  });

  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  if (!response.ok) {
    return false;
  }

  const result = (await response.json()) as { success?: boolean };
  return Boolean(result.success);
}

quoteRouter.post('/quote-request', quoteLimiter, async (req, res, next) => {
  try {
    const parsed = quoteRequestSchema.parse(req.body);
    const { website, turnstileToken, ...quoteData } = parsed;

    // Honeypot field should always remain empty for real users.
    if (website && website.trim().length > 0) {
      res.status(200).json({ success: true });
      return;
    }

    if (env.turnstileSecret) {
      if (!turnstileToken) {
        res.status(400).json({ message: 'Captcha verification is required.' });
        return;
      }

      const isValid = await verifyTurnstileToken(turnstileToken, req.ip ?? '');
      if (!isValid) {
        res.status(400).json({ message: 'Captcha verification failed.' });
        return;
      }
    }

    const quoteId = saveQuoteRequest(quoteData);
    await sendQuoteNotification(quoteData);
    res.status(201).json({ success: true, quoteId });
  } catch (error) {
    next(error);
  }
});
