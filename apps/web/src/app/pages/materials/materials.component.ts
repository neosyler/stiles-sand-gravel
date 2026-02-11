import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MediaService } from '../../core/media.service';
import { SeoService } from '../../core/seo.service';

@Component({
  standalone: true,
  selector: 'app-materials',
  imports: [CommonModule],
  templateUrl: './materials.component.html',
})
export class MaterialsComponent {
  private readonly mediaService = inject(MediaService);
  private readonly seo = inject(SeoService);

  readonly media = toSignal(this.mediaService.media$);
  readonly materialVisualMap = computed(() => {
    const items = this.media()?.all ?? [];
    const findByFilename = (name: string) => items.find((item) => item.filename === name);
    const findByKeywords = (keywords: string[]) =>
      items.find((item) =>
        keywords.some((keyword) => item.tags.includes(keyword) || item.filename.toLowerCase().includes(keyword)),
      );

    return {
      Sand: findByFilename('stiles-sand-gravel-sand-battle-creek-mi-02.jpeg') ?? findByKeywords(['sand']),
      Topsoil:
        findByFilename('stiles-sand-gravel-topsoil-battle-creek-mi-02.jpeg') ?? findByKeywords(['topsoil']),
      'Pea Gravel':
        findByFilename('stiles-sand-gravel-pea-gravel-battle-creek-mi-01.jpeg') ??
        findByFilename('stiles-sand-pea-gravel-southwest-michigan-01.jpeg') ??
        findByFilename('stiles-sand-pea-gravel-large-battle-creek-mi-03.jpeg') ??
        findByKeywords(['pea-gravel', 'pea', 'gravel']),
      'Landscape Stone':
        findByFilename('stiles-sand-gravel-landscape-stone-battle-creek-mi-01.jpeg') ??
        findByKeywords(['landscape-stone', 'landscape', 'stone']),
      'Fill Dirt':
        findByFilename('stiles-sand-gravel-fill-dirt-battle-creek-mi-02.jpeg') ??
        findByKeywords(['fill-dirt', 'fill', 'dirt']),
      'Stabilized Gravel':
        findByFilename('stiles-sand-gravel-stabilized-gravel-delivery-battle-creek-mi-01.jpeg') ??
        findByKeywords(['stabilized-gravel', 'stabilized', 'gravel']),
      'Crushed Concrete': findByKeywords(['crushed-concrete', 'concrete', 'crushed-stone']),
      'Crushed Asphalt':
        findByFilename('stiles-sand-gravel-crushed-asphalt-battle-creek-mi-02.jpeg') ??
        findByFilename('stiles-sand-gravel-crushed-asphalt-sample-battle-creek-mi-03.jpeg') ??
        findByKeywords(['crushed-asphalt', 'asphalt']),
      Limestone:
        findByFilename('stiles-sand-gravel-limestone-battle-creek-mi-02.jpeg') ??
        findByKeywords(['limestone']),
    };
  });

  readonly materials = [
    {
      name: 'Sand',
      description: 'General fill sand and leveling sand for residential and commercial applications.',
    },
    {
      name: 'Topsoil',
      description: 'Quality topsoil for grading, lawn prep, and landscape installations.',
    },
    {
      name: 'Pea Gravel',
      description: 'Clean, rounded aggregate for drainage beds, walkways, and decorative use.',
    },
    {
      name: 'Landscape Stone',
      description: 'Decorative stone options for curb appeal and low-maintenance landscaping.',
    },
    {
      name: 'Fill Dirt',
      description: 'Cost-effective fill material for elevation changes and backfill work.',
    },
    {
      name: 'Stabilized Gravel',
      description: 'Compacts reliably for drives, parking pads, and traffic-ready surfaces.',
    },
    {
      name: 'Crushed Concrete',
      description: 'Recycled aggregate solution for base layers and budget-conscious projects.',
    },
    {
      name: 'Crushed Asphalt',
      description: 'Durable reclaimed asphalt aggregate ideal for driveways and private lanes.',
    },
    {
      name: 'Limestone',
      description: 'A dependable compacting base for construction and drainage applications.',
    },
  ];

  constructor() {
    this.seo.setPageSeo(
      'Bulk Materials in Southwest Michigan | Stiles Sand & Gravel',
      'Order sand, topsoil, gravel, limestone, and more with fast, reliable delivery from Stiles Sand & Gravel in Battle Creek, MI.',
      '/materials',
    );
  }
}
