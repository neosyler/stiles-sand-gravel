import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { businessConfig } from '../../config/business.config';
import { SeoService } from '../../core/seo.service';

@Component({
  standalone: true,
  selector: 'app-service-area',
  imports: [CommonModule],
  templateUrl: './service-area.component.html',
})
export class ServiceAreaComponent {
  private readonly seo = inject(SeoService);

  readonly business = businessConfig;
  readonly showMap = signal(false);

  constructor() {
    this.seo.setPageSeo(
      'Service Area | Stiles Sand & Gravel',
      'Based in Battle Creek, Michigan, Stiles Sand & Gravel serves Southwest Michigan and surrounding communities.',
      '/service-area',
    );
  }

  revealMap(): void {
    this.showMap.set(true);
  }
}
