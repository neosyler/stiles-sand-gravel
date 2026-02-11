export const businessConfig = {
  name: 'Stiles Sand & Gravel',
  domain: 'https://stilessandgravel.com',
  phone: '269-420-9476',
  phoneHref: 'tel:+12694209476',
  smsHref: 'sms:+12694209476',
  email: 'info@stilessandgravel.com',
  address: {
    street: '14440 N Uldriks Dr',
    city: 'Battle Creek',
    state: 'MI',
    zip: '49017',
    lat: 42.3813,
    lng: -85.1498,
  },
  serviceAreas: [
    'Battle Creek',
    'Marshall',
    'Kalamazoo',
    'Portage',
    'Albion',
    'Springfield',
    'Augusta',
    'Richland',
    'Southwest Michigan',
  ],
  security: {
    turnstileSiteKey: '',
  },
  social: {
    mapsLink:
      'https://www.google.com/maps/search/?api=1&query=14440+N+Uldriks+Dr+Battle+Creek+MI+49017',
  },
} as const;

export type BusinessConfig = typeof businessConfig;
