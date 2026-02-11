export type MediaCategory = 'hero' | 'services' | 'materials' | 'gallery';
export type MediaKind = 'image' | 'video';

export interface MediaItem {
  id: string;
  filename: string;
  url: string;
  kind: MediaKind;
  category: MediaCategory;
  alt: string;
  width: number;
  height: number;
  posterUrl?: string;
  mimeType: string;
  tags: string[];
  featured?: boolean;
}

export interface MediaIndex {
  generatedAt: string;
  counts: Record<MediaCategory, number>;
  hero: MediaItem[];
  services: MediaItem[];
  materials: MediaItem[];
  gallery: MediaItem[];
  all: MediaItem[];
}
