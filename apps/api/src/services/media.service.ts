import fs from 'node:fs';
import path from 'node:path';
import { env } from '../config/env.js';
import { MediaCategory, MediaIndex, MediaItem } from '../types/media.js';

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp']);
const VIDEO_EXTENSIONS = new Set(['.mp4', '.mov']);

const HERO_KEYWORDS = ['truck', 'dump', 'delivery', 'hauler', 'load', 'trailer'];
const SERVICE_KEYWORDS = ['grading', 'grapple', 'brush', 'wood', 'clearing', 'skid', 'cat', 'excavat'];
const MATERIAL_KEYWORDS = ['sand', 'gravel', 'stone', 'topsoil', 'dirt', 'limestone', 'asphalt', 'concrete'];
const MATERIAL_TAGS = [
  'sand',
  'topsoil',
  'pea',
  'gravel',
  'rock',
  'landscape',
  'stone',
  'fill',
  'dirt',
  'stabilized',
  'concrete',
  'asphalt',
  'limestone',
];

interface PlacementOverride {
  category: MediaCategory;
  tags?: string[];
  featured?: boolean;
}

// Manual curation based on actual uploaded media content.
const PLACEMENT_OVERRIDES: Record<string, PlacementOverride> = {
  'stiles-sand-gravel-dup-trucks-southwest-michigan-02.jpeg': {
    category: 'hero',
    tags: ['dump-trucks', 'delivery', 'truck'],
    featured: true,
  },
  'stiles-sand-gravel-material-delivery-trailer-battle-creek-mi-04.jpeg': {
    category: 'hero',
    tags: ['trailer', 'delivery', 'truck'],
    featured: false,
  },
  'stiles-sand-gravel-rock-delivery-battle-creek-mi-01.jpeg': {
    category: 'hero',
    tags: ['delivery', 'stockpile', 'truck'],
  },
  'stiles-sand-gravel-dump-truck-delivery-battle-creek-mi-video-01.mov': {
    category: 'services',
    tags: ['delivery', 'in-action', 'video'],
    featured: true,
  },
  'stiles-sand-gravel-grading-site-prep-michigan-01.jpeg': {
    category: 'services',
    tags: ['grading', 'site-prep'],
    featured: true,
  },
  'stiles-sand-site-prep-michigan-01.jpeg': {
    category: 'services',
    tags: ['grading', 'site-prep'],
  },
  'stiles-sand-gravel-crushed-asphalt-battle-creek-mi-02.jpeg': {
    category: 'materials',
    tags: ['crushed-asphalt', 'asphalt'],
  },
  'stiles-sand-gravel-crushed-asphalt-sample-battle-creek-mi-03.jpeg': {
    category: 'materials',
    tags: ['crushed-asphalt', 'asphalt', 'sample'],
  },
  'stiles-sand-gravel-crushed-stone-delivery-battle-creek-mi-01.jpeg': {
    category: 'materials',
    tags: ['crushed-stone', 'stone'],
  },
  'stiles-sand-gravel-crushed-stone-delivery-southwest-michigan-01.jpeg': {
    category: 'materials',
    tags: ['crushed-stone', 'stone'],
  },
  'stiles-sand-gravel-sand-battle-creek-mi-02.jpeg': {
    category: 'materials',
    tags: ['sand'],
  },
  'stiles-sand-gravel-topsoil-battle-creek-mi-02.jpeg': {
    category: 'materials',
    tags: ['topsoil'],
  },
  'stiles-sand-gravel-fill-dirt-battle-creek-mi-02.jpeg': {
    category: 'materials',
    tags: ['fill-dirt', 'fill', 'dirt'],
  },
  'stiles-sand-gravel-limestone-battle-creek-mi-02.jpeg': {
    category: 'materials',
    tags: ['limestone'],
  },
  'stiles-sand-gravel-landscape-stone-battle-creek-mi-01.jpeg': {
    category: 'materials',
    tags: ['landscape-stone', 'landscape', 'stone'],
  },
  'stiles-sand-gravel-pea-gravel-battle-creek-mi-01.jpeg': {
    category: 'materials',
    tags: ['pea-gravel', 'pea', 'gravel'],
  },
  'stiles-sand-pea-gravel-southwest-michigan-01.jpeg': {
    category: 'materials',
    tags: ['pea-gravel', 'pea', 'gravel'],
  },
  'stiles-sand-pea-gravel-large-battle-creek-mi-03.jpeg': {
    category: 'materials',
    tags: ['pea-gravel', 'pea', 'gravel'],
  },
  'stiles-sand-gravel-river-rock-battle-creek-mi-02.jpeg': {
    category: 'materials',
    tags: ['river-rock', 'rock', 'stone'],
  },
  'stiles-sand-gravel-stabilized-gravel-delivery-battle-creek-mi-01.jpeg': {
    category: 'materials',
    tags: ['stabilized-gravel', 'stabilized', 'gravel'],
  },
};

let cache: MediaIndex | null = null;
let lastScan = 0;

const MIME_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.mp4': 'video/mp4',
  '.mov': 'video/quicktime',
};

function inferCategory(name: string): MediaCategory {
  const lower = name.toLowerCase();
  if (HERO_KEYWORDS.some((keyword) => lower.includes(keyword))) {
    return 'hero';
  }
  if (SERVICE_KEYWORDS.some((keyword) => lower.includes(keyword))) {
    return 'services';
  }
  if (MATERIAL_KEYWORDS.some((keyword) => lower.includes(keyword))) {
    return 'materials';
  }
  return 'gallery';
}

function inferAltText(filename: string, category: MediaCategory): string {
  const cleaned = filename
    .replace(/[-_]+/g, ' ')
    .replace(/\.[^.]+$/, '')
    .trim();

  if (category === 'hero') {
    return `Dump truck delivering gravel in Battle Creek, MI (${cleaned})`;
  }
  if (category === 'services') {
    return `Stiles Sand & Gravel equipment at work in Southwest Michigan (${cleaned})`;
  }
  if (category === 'materials') {
    return `Bulk landscaping material ready for delivery (${cleaned})`;
  }
  return `Stiles Sand & Gravel project gallery image (${cleaned})`;
}

function walkMediaFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) {
    return [];
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkMediaFiles(fullPath));
      continue;
    }

    const ext = path.extname(entry.name).toLowerCase();
    if (IMAGE_EXTENSIONS.has(ext) || VIDEO_EXTENSIONS.has(ext)) {
      files.push(fullPath);
    }
  }

  return files;
}

function createMediaItem(filePath: string): MediaItem {
  const filename = path.basename(filePath);
  const ext = path.extname(filename).toLowerCase();
  const kind = VIDEO_EXTENSIONS.has(ext) ? 'video' : 'image';
  const override = PLACEMENT_OVERRIDES[filename];
  const category = override?.category ?? inferCategory(filename);

  const relativePath = path.relative(env.mediaDir, filePath).split(path.sep).join('/');
  const lowerFilename = filename.toLowerCase();
  const inferredTags = MATERIAL_TAGS.filter((tag) => lowerFilename.includes(tag));
  const tags = override?.tags ?? inferredTags;
  const encoded = relativePath
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');

  return {
    id: Buffer.from(relativePath).toString('base64url'),
    filename,
    url: `/media/${encoded}`,
    kind,
    category,
    alt: inferAltText(filename, category),
    width: kind === 'image' ? 1600 : 1920,
    height: kind === 'image' ? 1067 : 1080,
    mimeType: MIME_TYPES[ext] ?? 'application/octet-stream',
    tags,
    featured: override?.featured ?? false,
  };
}

function buildMediaIndex(): MediaIndex {
  const files = walkMediaFiles(env.mediaDir);
  const all = files.map(createMediaItem);

  const imagesByStem = new Map<string, MediaItem>();
  for (const item of all) {
    if (item.kind === 'image') {
      imagesByStem.set(item.filename.replace(/\.[^.]+$/, '').toLowerCase(), item);
    }
  }

  const fallbackPoster = all.find((item) => item.kind === 'image');
  for (const item of all) {
    if (item.kind !== 'video') {
      continue;
    }
    const stem = item.filename.replace(/\.[^.]+$/, '').toLowerCase();
    const poster = imagesByStem.get(stem) ?? fallbackPoster;
    if (poster) {
      item.posterUrl = poster.url;
    }
  }

  const sortByFeatured = (items: MediaItem[]): MediaItem[] =>
    [...items].sort((a, b) => Number(b.featured) - Number(a.featured));

  const hero = sortByFeatured(all.filter((item) => item.category === 'hero'));
  const services = sortByFeatured(all.filter((item) => item.category === 'services'));
  const materials = all.filter((item) => item.category === 'materials');

  const used = new Set<string>([...hero, ...services, ...materials].map((item) => item.id));
  const gallery = all.filter((item) => !used.has(item.id));

  return {
    generatedAt: new Date().toISOString(),
    counts: {
      hero: hero.length,
      services: services.length,
      materials: materials.length,
      gallery: gallery.length,
    },
    hero,
    services,
    materials,
    gallery,
    all,
  };
}

export function getMediaIndex(): MediaIndex {
  const now = Date.now();
  if (!cache || now - lastScan > 60_000) {
    cache = buildMediaIndex();
    lastScan = now;
  }

  return cache;
}

export function refreshMediaIndex(): MediaIndex {
  cache = buildMediaIndex();
  lastScan = Date.now();
  return cache;
}
