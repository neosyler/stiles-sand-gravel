import { APP_BASE_HREF } from '@angular/common';
import { renderApplication } from '@angular/platform-server';
import { bootstrapApplication, type BootstrapContext } from '@angular/platform-browser';
import { config } from './app/app.config.server';
import { AppComponent } from './app/app.component';

export default function bootstrap(context: BootstrapContext) {
  return bootstrapApplication(AppComponent, config, context);
}

export function render(document: string, url: string, baseHref: string, allowedHosts: readonly string[]) {
  return renderApplication(bootstrap, {
    document,
    url,
    allowedHosts: [...allowedHosts],
    platformProviders: [{ provide: APP_BASE_HREF, useValue: baseHref }],
  });
}
