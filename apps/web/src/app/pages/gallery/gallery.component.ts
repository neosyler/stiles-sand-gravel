import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MediaService } from '../../core/media.service';
import { SeoService } from '../../core/seo.service';
import { MediaItem } from '../../core/media.types';

@Component({
  standalone: true,
  selector: 'app-gallery',
  imports: [CommonModule],
  templateUrl: './gallery.component.html',
})
export class GalleryComponent {
  private readonly mediaService = inject(MediaService);
  private readonly seo = inject(SeoService);

  readonly media = toSignal(this.mediaService.media$);
  readonly gallery = computed(() => {
    const media = this.media();
    if (!media) {
      return [];
    }
    return media.gallery.length > 0 ? media.gallery : media.all;
  });
  readonly selected = signal<MediaItem | null>(null);

  constructor() {
    this.seo.setPageSeo(
      'Gallery | Stiles Sand & Gravel',
      'View real trucks, deliveries, and equipment photos/videos from Stiles Sand & Gravel in Southwest Michigan.',
      '/gallery',
    );
  }

  open(item: MediaItem): void {
    this.selected.set(item);
  }

  close(): void {
    this.selected.set(null);
  }
}
