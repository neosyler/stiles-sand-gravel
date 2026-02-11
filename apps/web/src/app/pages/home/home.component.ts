import { CommonModule } from '@angular/common';
import { isPlatformBrowser } from '@angular/common';
import {
  Component,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { businessConfig } from '../../config/business.config';
import { MediaService } from '../../core/media.service';
import { SeoService } from '../../core/seo.service';
import { MediaItem } from '../../core/media.types';

@Component({
  standalone: true,
  selector: 'app-home',
  imports: [CommonModule, RouterLink],
  templateUrl: './home.component.html',
})
export class HomeComponent implements OnInit, OnDestroy {
  private readonly mediaService = inject(MediaService);
  private readonly seo = inject(SeoService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private rotateTimer: ReturnType<typeof setInterval> | null = null;

  readonly business = businessConfig;
  readonly media = toSignal(this.mediaService.media$);
  readonly heroIndex = signal(0);
  readonly heroItems = computed(() => {
    const media = this.media();
    if (!media) {
      return [];
    }
    const all = media.all.filter((item) => item.kind === 'image');
    const heroOrder = [
      'stiles-sand-gravel-dup-trucks-southwest-michigan-02.jpeg',
      'stiles-sand-gravel-grading-site-prep-michigan-01.jpeg',
      'stiles-sand-gravel-sand-battle-creek-mi-02.jpeg',
      'stiles-sand-gravel-crushed-stone-delivery-battle-creek-mi-01.jpeg',
    ];
    const curated = heroOrder
      .map((name) => all.find((item) => item.filename === name))
      .filter((item): item is NonNullable<typeof item> => Boolean(item));
    if (curated.length > 0) {
      return curated;
    }
    const heroImages = media.hero.filter((item) => item.kind === 'image');
    return heroImages.length > 0 ? heroImages : media.hero;
  });
  readonly hero = computed(() => {
    const items = this.heroItems();
    if (items.length === 0) {
      return undefined;
    }
    return items[this.heroIndex() % items.length];
  });
  readonly truckVisuals = computed(() => {
    const all = this.media()?.all ?? [];
    const picks = [
      'stiles-sand-gravel-dup-trucks-southwest-michigan-02.jpeg',
      'stiles-sand-gravel-rock-delivery-battle-creek-mi-01.jpeg',
      'stiles-sand-gravel-material-delivery-trailer-battle-creek-mi-04.jpeg',
    ];
    const selected = picks
      .map((name) => all.find((item) => item.filename === name))
      .filter((item): item is NonNullable<typeof item> => Boolean(item));
    return selected.length > 0 ? selected : this.media()?.hero.slice(1, 4) ?? [];
  });
  readonly localSectionVisuals = computed(() => {
    const all = this.media()?.all ?? [];
    const picks = [
      'stiles-sand-gravel-dup-trucks-southwest-michigan-02.jpeg',
      'stiles-sand-gravel-grading-site-prep-michigan-01.jpeg',
    ];
    const selected = picks
      .map((name) => all.find((item) => item.filename === name))
      .filter((item): item is NonNullable<typeof item> => Boolean(item));
    return selected.length > 0 ? selected : this.truckVisuals().slice(0, 2);
  });
  readonly serviceVisualMap = computed<Record<string, MediaItem | undefined>>(() => {
    const all = this.media()?.all ?? [];
    const findByFilename = (name: string) => all.find((item) => item.filename === name);
    return {
      'Delivery (1–15 yards)':
        findByFilename('stiles-sand-gravel-dup-trucks-southwest-michigan-02.jpeg') ??
        findByFilename('stiles-sand-gravel-rock-delivery-battle-creek-mi-01.jpeg'),
      Grading:
        findByFilename('stiles-sand-gravel-grading-site-prep-michigan-01.jpeg') ??
        findByFilename('stiles-sand-site-prep-michigan-01.jpeg'),
      'Caterpillar skid steer work': findByFilename(
        'stiles-sand-gravel-dump-truck-delivery-battle-creek-mi-video-01.mov',
      ),
    };
  });
  readonly materialVisualMap = computed<Record<string, MediaItem | undefined>>(() => {
    const all = this.media()?.all ?? [];
    const findByFilename = (name: string) => all.find((item) => item.filename === name);
    const findByKeywords = (keywords: string[]) =>
      all.find((item) => keywords.some((keyword) => item.tags.includes(keyword) || item.filename.toLowerCase().includes(keyword)));
    return {
      Sand: findByFilename('stiles-sand-gravel-sand-battle-creek-mi-02.jpeg') ?? findByKeywords(['sand']),
      Topsoil:
        findByFilename('stiles-sand-gravel-topsoil-battle-creek-mi-02.jpeg') ?? findByKeywords(['topsoil']),
      'Pea gravel':
        findByFilename('stiles-sand-gravel-pea-gravel-battle-creek-mi-01.jpeg') ?? findByKeywords(['pea', 'gravel']),
      'Landscape stone':
        findByFilename('stiles-sand-gravel-landscape-stone-battle-creek-mi-01.jpeg') ??
        findByKeywords(['landscape', 'stone']),
      'Fill dirt':
        findByFilename('stiles-sand-gravel-fill-dirt-battle-creek-mi-02.jpeg') ?? findByKeywords(['fill', 'dirt']),
      'Stabilized gravel':
        findByFilename('stiles-sand-gravel-stabilized-gravel-delivery-battle-creek-mi-01.jpeg') ??
        findByKeywords(['stabilized', 'gravel']),
      'Crushed concrete': findByKeywords(['crushed-stone', 'concrete']),
      'Crushed asphalt':
        findByFilename('stiles-sand-gravel-crushed-asphalt-battle-creek-mi-02.jpeg') ??
        findByKeywords(['crushed-asphalt', 'asphalt']),
      Limestone:
        findByFilename('stiles-sand-gravel-limestone-battle-creek-mi-02.jpeg') ?? findByKeywords(['limestone']),
    };
  });
  readonly video = computed(() => this.media()?.all.find((item) => item.kind === 'video'));

  readonly services = [
    'Delivery (1–15 yards)',
    'Grading',
    'Caterpillar skid steer work',
  ];

  readonly materials = [
    'Sand',
    'Topsoil',
    'Pea gravel',
    'Landscape stone',
    'Fill dirt',
    'Stabilized gravel',
    'Crushed concrete',
    'Crushed asphalt',
    'Limestone',
  ];

  constructor() {
    this.seo.setPageSeo(
      'Stiles Sand & Gravel | Sand, Gravel & Bulk Materials Delivered',
      'From 1 to 15 yards in one trip. Fast delivery, big stockpiles, and dependable equipment in Southwest Michigan.',
      '/',
    );

    effect(() => {
      const media = this.media();
      if (!media) {
        return;
      }

      const imageUrls = media.hero
        .filter((item) => item.kind === 'image')
        .slice(0, 4)
        .map((item) => item.url);

      this.seo.setLocalBusinessSchema(imageUrls);

      const topMedia = media.hero[0];
      if (topMedia) {
        this.seo.preloadHeroMedia(topMedia.url, topMedia.kind === 'video' ? 'video' : 'image');
      }
    });
  }

  ngOnInit(): void {
    if (!this.isBrowser) {
      return;
    }
    this.startRotation();
  }

  ngOnDestroy(): void {
    if (this.rotateTimer) {
      clearInterval(this.rotateTimer);
      this.rotateTimer = null;
    }
  }

  private startRotation(): void {
    if (this.rotateTimer) {
      clearInterval(this.rotateTimer);
      this.rotateTimer = null;
    }
    this.rotateTimer = setInterval(() => this.nextHero(), 5500);
  }

  nextHero(): void {
    const count = this.heroItems().length;
    if (count <= 1) {
      return;
    }
    this.heroIndex.update((index) => (index + 1) % count);
  }

  goToHero(index: number): void {
    this.heroIndex.set(index);
  }
}
