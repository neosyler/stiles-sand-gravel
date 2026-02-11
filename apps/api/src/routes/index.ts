import { Router } from 'express';
import { healthRouter } from './health.routes.js';
import { mediaRouter } from './media.routes.js';
import { quoteRouter } from './quote.routes.js';

export const apiRouter = Router();

apiRouter.use(healthRouter);
apiRouter.use(mediaRouter);
apiRouter.use(quoteRouter);
