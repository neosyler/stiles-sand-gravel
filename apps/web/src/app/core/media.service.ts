import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, of, shareReplay } from 'rxjs';
import { MediaIndex } from './media.types';

@Injectable({ providedIn: 'root' })
export class MediaService {
  private readonly http = inject(HttpClient);

  readonly media$: Observable<MediaIndex> = this.http.get<MediaIndex>('/api/media').pipe(
    catchError(() =>
      of({
        generatedAt: new Date().toISOString(),
        counts: { hero: 0, services: 0, materials: 0, gallery: 0 },
        hero: [],
        services: [],
        materials: [],
        gallery: [],
        all: [],
      }),
    ),
    shareReplay(1),
  );
}
