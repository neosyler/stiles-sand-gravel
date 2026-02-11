import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import { QuoteRequest } from '../types/quote.js';

function getTransporter() {
  if (!env.smtpHost || !env.smtpUser || !env.smtpPass) {
    return null;
  }

  return nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort,
    secure: env.smtpPort === 465,
    auth: {
      user: env.smtpUser,
      pass: env.smtpPass,
    },
  });
}

export async function sendQuoteNotification(input: QuoteRequest): Promise<void> {
  const transporter = getTransporter();
  if (!transporter) {
    return;
  }

  await transporter.sendMail({
    from: env.smtpFrom,
    to: env.notifyEmail,
    subject: `New quote request: ${input.name}`,
    text: [
      `Name: ${input.name}`,
      `Phone: ${input.phone}`,
      `Email: ${input.email ?? ''}`,
      `Address: ${input.address ?? ''}`,
      `City: ${input.city ?? ''}`,
      `Material Needed: ${input.materialNeeded ?? ''}`,
      `Quantity (yards): ${input.quantityYards ?? ''}`,
      `Preferred Delivery Date: ${input.preferredDeliveryDate ?? ''}`,
      `Notes: ${input.notes ?? ''}`,
    ].join('\n'),
  });
}
