import { bootstrapApplication } from '@angular/platform-browser';
import { config } from './app/app.config.server';
import { AppComponent } from './app/app.component';

export default function bootstrap() {
  return bootstrapApplication(AppComponent, config);
}
