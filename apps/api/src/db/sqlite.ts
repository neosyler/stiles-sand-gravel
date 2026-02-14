import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import { env } from '../config/env.js';
import { QuoteRequest } from '../types/quote.js';

const dbDir = path.dirname(env.sqlitePath);
fs.mkdirSync(dbDir, { recursive: true });

const db = new Database(env.sqlitePath);

db.exec(`
  CREATE TABLE IF NOT EXISTS quote_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    address TEXT,
    city TEXT,
    material_needed TEXT,
    quantity_yards TEXT,
    preferred_delivery_date TEXT,
    notes TEXT,
    created_at TEXT NOT NULL
  );
`);

const insertQuote = db.prepare(`
  INSERT INTO quote_requests (
    name, phone, email, address, city, material_needed, quantity_yards, preferred_delivery_date, notes, created_at
  ) VALUES (
    @name, @phone, @email, @address, @city, @materialNeeded, @quantityYards, @preferredDeliveryDate, @notes, @createdAt
  )
`);

export function saveQuoteRequest(input: QuoteRequest): number {
  const result = insertQuote.run({
    name: input.name,
    phone: input.phone,
    email: input.email ?? '',
    address: input.address ?? '',
    city: input.city ?? '',
    materialNeeded: input.materialNeeded ?? '',
    quantityYards: input.quantityYards ?? '',
    preferredDeliveryDate: input.preferredDeliveryDate ?? '',
    notes: input.notes ?? '',
    createdAt: new Date().toISOString(),
  });

  return Number(result.lastInsertRowid);
}
