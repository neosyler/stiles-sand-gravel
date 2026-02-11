import { CommonModule } from '@angular/common';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  AfterViewInit,
  Component,
  ElementRef,
  Inject,
  OnDestroy,
  PLATFORM_ID,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { businessConfig } from '../../config/business.config';
import { SeoService } from '../../core/seo.service';

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          theme?: 'light' | 'dark' | 'auto';
          callback?: (token: string) => void;
          'expired-callback'?: () => void;
          'error-callback'?: () => void;
        },
      ) => string | number;
      reset: (id?: string | number) => void;
      remove: (id: string | number) => void;
    };
  }
}

@Component({
  standalone: true,
  selector: 'app-contact',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './contact.component.html',
})
export class ContactComponent implements AfterViewInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly http = inject(HttpClient);
  private readonly seo = inject(SeoService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  readonly business = businessConfig;
  readonly loading = signal(false);
  readonly success = signal<string | null>(null);
  readonly error = signal<string | null>(null);
  private turnstileWidgetId: string | number | null = null;

  @ViewChild('turnstileContainer') turnstileContainer?: ElementRef<HTMLDivElement>;

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required]],
    phone: ['', [Validators.required]],
    email: [''],
    address: [''],
    city: [''],
    materialNeeded: [''],
    quantityYards: [''],
    preferredDeliveryDate: [''],
    notes: [''],
    website: [''],
    turnstileToken: [''],
  });

  constructor(@Inject(DOCUMENT) private readonly document: Document) {
    this.seo.setPageSeo(
      'Contact & Quote Request | Stiles Sand & Gravel',
      'Call, text, or request a quote for gravel, sand, and bulk material delivery in Southwest Michigan.',
      '/contact',
    );
  }

  ngAfterViewInit(): void {
    if (!this.isBrowser || !this.business.security.turnstileSiteKey) {
      return;
    }

    this.loadTurnstileScript()
      .then(() => this.renderTurnstile())
      .catch(() => {
        this.error.set('Captcha failed to load. Please refresh and try again.');
      });
  }

  ngOnDestroy(): void {
    if (this.isBrowser && window.turnstile && this.turnstileWidgetId !== null) {
      window.turnstile.remove(this.turnstileWidgetId);
    }
  }

  private loadTurnstileScript(): Promise<void> {
    if (window.turnstile) {
      return Promise.resolve();
    }

    const existing = this.document.querySelector<HTMLScriptElement>(
      'script[data-turnstile-script="true"]',
    );
    if (existing) {
      return new Promise((resolve, reject) => {
        existing.addEventListener('load', () => resolve(), { once: true });
        existing.addEventListener('error', () => reject(new Error('Turnstile script load failed')), {
          once: true,
        });
      });
    }

    return new Promise((resolve, reject) => {
      const script = this.document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.defer = true;
      script.dataset['turnstileScript'] = 'true';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Turnstile script load failed'));
      this.document.head.appendChild(script);
    });
  }

  private renderTurnstile(): void {
    if (!window.turnstile || !this.turnstileContainer?.nativeElement) {
      return;
    }

    this.turnstileWidgetId = window.turnstile.render(this.turnstileContainer.nativeElement, {
      sitekey: this.business.security.turnstileSiteKey,
      theme: 'dark',
      callback: (token: string) => {
        this.form.controls.turnstileToken.setValue(token);
      },
      'expired-callback': () => {
        this.form.controls.turnstileToken.setValue('');
      },
      'error-callback': () => {
        this.form.controls.turnstileToken.setValue('');
      },
    });
  }

  submit(): void {
    this.success.set(null);
    this.error.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (this.business.security.turnstileSiteKey && !this.form.controls.turnstileToken.value) {
      this.error.set('Please complete captcha verification before submitting.');
      return;
    }

    this.loading.set(true);
    this.http.post('/api/quote-request', this.form.getRawValue()).subscribe({
      next: () => {
        this.loading.set(false);
        this.success.set('Thanks. Your quote request was sent. We will contact you shortly.');
        this.form.reset({
          name: '',
          phone: '',
          email: '',
          address: '',
          city: '',
          materialNeeded: '',
          quantityYards: '',
          preferredDeliveryDate: '',
          notes: '',
          website: '',
          turnstileToken: '',
        });
        if (this.business.security.turnstileSiteKey && window.turnstile && this.turnstileWidgetId !== null) {
          window.turnstile.reset(this.turnstileWidgetId);
        }
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Unable to send quote request right now. Please call or text directly.');
      },
    });
  }
}
