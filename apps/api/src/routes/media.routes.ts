import { Router } from 'express';
import { getMediaIndex, refreshMediaIndex } from '../services/media.service.js';

export const mediaRouter = Router();

mediaRouter.get('/media', (_req, res) => {
  res.json(getMediaIndex());
});

mediaRouter.post('/media/refresh', (_req, res) => {
  res.json(refreshMediaIndex());
});
