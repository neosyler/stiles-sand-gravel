import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({ message: 'Not found' });
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof ZodError) {
    res.status(400).json({
      message: 'Validation failed',
      issues: err.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      })),
    });
    return;
  }

  const message = err instanceof Error ? err.message : 'Unexpected server error';
  res.status(500).json({ message });
}
