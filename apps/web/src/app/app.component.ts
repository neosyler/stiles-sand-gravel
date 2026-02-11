import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { businessConfig } from './config/business.config';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.component.html',
})
export class AppComponent {
  readonly business = businessConfig;
  readonly year = new Date().getFullYear();
  readonly menuOpen = signal(false);

  readonly nav = [
    { path: '/', label: 'Home' },
    { path: '/materials', label: 'Materials' },
    { path: '/services', label: 'Services' },
    { path: '/gallery', label: 'Gallery' },
    { path: '/service-area', label: 'Service Area' },
    { path: '/contact', label: 'Contact' },
  ];

  toggleMenu(): void {
    this.menuOpen.update((value) => !value);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }
}
