import '@angular/compiler';
import cors from 'cors';
import express, { NextFunction, Request, Response } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import helmet from 'helmet';
import { CommonEngine } from '@angular/ssr/node';
import { APP_BASE_HREF } from '@angular/common';
import type { ApplicationRef } from '@angular/core';
import type { BootstrapContext } from '@angular/platform-browser';
import { apiRouter } from './routes/index.js';
import { env } from './config/env.js';
import { errorHandler, notFoundHandler } from './middleware/error-handler.js';
import { getMediaIndex } from './services/media.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../../');
const browserDistBasePath = path.join(rootDir, 'dist/apps/web/browser');
const browserDistPath = fs.existsSync(path.join(browserDistBasePath, 'browser'))
  ? path.join(browserDistBasePath, 'browser')
  : browserDistBasePath;
const serverDistPath = path.join(rootDir, 'dist/apps/web/server');

const app = express();

app.set('trust proxy', 1);
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", 'https://challenges.cloudflare.com'],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
        imgSrc: ["'self'", 'data:', 'https:'],
        mediaSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", 'https:', 'https://challenges.cloudflare.com'],
        frameSrc: [
          "'self'",
          'https://www.google.com',
          'https://www.google.com/maps',
          'https://maps.google.com',
          'https://challenges.cloudflare.com',
        ],
      },
    },
  }),
);
app.use(cors({ origin: env.corsOrigin === '*' ? true : env.corsOrigin }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/media', express.static(env.mediaDir, { maxAge: '7d' }));
app.use('/api', apiRouter);
app.use('/api/*', notFoundHandler);

if (fs.existsSync(browserDistPath)) {
  app.use(
    express.static(browserDistPath, {
      maxAge: '30d',
      index: false,
    }),
  );
}

interface SsrRuntime {
  engine: CommonEngine;
  bootstrap: (context: BootstrapContext) => Promise<ApplicationRef>;
  templatePath: string;
}

async function loadSsrRuntime(): Promise<SsrRuntime | null> {
  const candidateServerFiles = ['main.server.mjs', 'main.mjs', 'main.server.js', 'main.js'].map((file) =>
    path.join(serverDistPath, file),
  );
  const mainServerPath = candidateServerFiles.find((file) => fs.existsSync(file));
  if (!mainServerPath) {
    return null;
  }

  const templatePath = fs.existsSync(path.join(browserDistPath, 'index.csr.html'))
    ? path.join(browserDistPath, 'index.csr.html')
    : path.join(browserDistPath, 'index.html');

  if (!fs.existsSync(templatePath)) {
    return null;
  }

  const moduleUrl = pathToFileURL(mainServerPath).href;
  const imported = (await import(moduleUrl)) as {
    default?: (context: BootstrapContext) => Promise<ApplicationRef>;
  };
  if (!imported.default) {
    return null;
  }

  return {
    engine: new CommonEngine(),
    bootstrap: imported.default,
    templatePath,
  };
}

let ssrRuntime: SsrRuntime | null = null;
getMediaIndex();
loadSsrRuntime()
  .then((runtime) => {
    ssrRuntime = runtime;
  })
  .catch(() => {
    ssrRuntime = null;
  });

app.get('*', async (req: Request, res: Response, next: NextFunction) => {
  if (req.path.startsWith('/api')) {
    return next();
  }

  try {
    if (!ssrRuntime) {
      const fallbackHtml = path.join(browserDistPath, 'index.html');
      if (fs.existsSync(fallbackHtml)) {
        return res.sendFile(fallbackHtml);
      }

      return res
        .status(503)
        .send('Web app is not built yet. Run npm run build from repository root before npm run start.');
    }

    const html = await ssrRuntime.engine.render({
      bootstrap: ssrRuntime.bootstrap,
      documentFilePath: ssrRuntime.templatePath,
      url: `${req.protocol}://${req.get('host')}${req.originalUrl}`,
      publicPath: browserDistPath,
      providers: [{ provide: APP_BASE_HREF, useValue: req.baseUrl }],
    });

    return res.send(html);
  } catch (error) {
    return next(error);
  }
});

app.use(errorHandler);

app.listen(env.port, () => {
  console.log(`API + SSR server listening on http://localhost:${env.port}`);
});
