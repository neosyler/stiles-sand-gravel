import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MediaService } from '../../core/media.service';
import { SeoService } from '../../core/seo.service';
import { MediaItem } from '../../core/media.types';

@Component({
  standalone: true,
  selector: 'app-services',
  imports: [CommonModule],
  templateUrl: './services.component.html',
})
export class ServicesComponent {
  private readonly mediaService = inject(MediaService);
  private readonly seo = inject(SeoService);

  readonly media = toSignal(this.mediaService.media$);
  readonly serviceVisualMap = computed<Record<string, MediaItem | undefined>>(() => {
    const all = this.media()?.all ?? [];
    const findByFilename = (name: string) => all.find((item) => item.filename === name);
    const findByKeywords = (keywords: string[]) =>
      all.find((item) => keywords.some((keyword) => item.filename.toLowerCase().includes(keyword)));

    return {
      'Bulk Material Delivery (1-15 Yards)':
        findByFilename('stiles-sand-gravel-dup-trucks-southwest-michigan-02.jpeg') ??
        findByFilename('stiles-sand-gravel-rock-delivery-battle-creek-mi-01.jpeg') ??
        findByKeywords(['truck', 'delivery']),
      Grading:
        findByFilename('stiles-sand-gravel-grading-site-prep-michigan-01.jpeg') ??
        findByFilename('stiles-sand-site-prep-michigan-01.jpeg') ??
        findByKeywords(['grading', 'site-prep']),
      'Caterpillar Skid Steer Work': findByFilename(
        'stiles-sand-gravel-dump-truck-delivery-battle-creek-mi-video-01.mov',
      ),
    };
  });

  readonly services = [
    {
      title: 'Bulk Material Delivery (1-15 Yards)',
      description:
        'Dump truck capacity supports small and large jobs with efficient, on-time drop-offs.',
    },
    {
      title: 'Grading',
      description: 'Site prep and grading services to improve drainage and establish clean base elevation.',
    },
    {
      title: 'Caterpillar Skid Steer Work',
      description: 'Compact equipment support for tight sites, cleanup, leveling, and material movement.',
    },
  ];

  constructor() {
    this.seo.setPageSeo(
      'Services | Stiles Sand & Gravel',
      'Delivery, grading, and skid steer services from a local Southwest Michigan team with real equipment capacity.',
      '/services',
    );
  }
}
