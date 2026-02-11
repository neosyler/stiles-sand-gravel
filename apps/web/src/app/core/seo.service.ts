import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { businessConfig } from '../config/business.config';

@Injectable({ providedIn: 'root' })
export class SeoService {
  constructor(
    private readonly title: Title,
    private readonly meta: Meta,
    @Inject(DOCUMENT) private readonly document: Document,
  ) {}

  setPageSeo(title: string, description: string, path: string): void {
    this.title.setTitle(title);
    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ property: 'og:title', content: title });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    this.meta.updateTag({ property: 'og:url', content: `${businessConfig.domain}${path}` });

    let canonical = this.document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = this.document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      this.document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', `${businessConfig.domain}${path}`);
  }

  setLocalBusinessSchema(imageUrls: string[]): void {
    const absoluteImages = imageUrls.map((url) =>
      url.startsWith('http') ? url : `${businessConfig.domain}${url}`,
    );

    const schema = {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      name: businessConfig.name,
      url: businessConfig.domain,
      image: absoluteImages,
      telephone: businessConfig.phone,
      address: {
        '@type': 'PostalAddress',
        streetAddress: businessConfig.address.street,
        addressLocality: businessConfig.address.city,
        addressRegion: businessConfig.address.state,
        postalCode: businessConfig.address.zip,
        addressCountry: 'US',
      },
      areaServed: 'Southwest Michigan',
      geo: {
        '@type': 'GeoCoordinates',
        latitude: businessConfig.address.lat,
        longitude: businessConfig.address.lng,
      },
    };

    const existing = this.document.getElementById('local-business-schema');
    if (existing) {
      existing.remove();
    }

    const script = this.document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'local-business-schema';
    script.text = JSON.stringify(schema);
    this.document.head.appendChild(script);
  }

  preloadHeroMedia(url: string, as: 'image' | 'video'): void {
    const existing = this.document.getElementById('hero-preload');
    if (existing) {
      existing.remove();
    }

    const link = this.document.createElement('link');
    link.id = 'hero-preload';
    link.rel = 'preload';
    link.as = as;
    link.href = url;
    this.document.head.appendChild(link);
  }
}
