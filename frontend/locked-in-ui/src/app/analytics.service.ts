import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import posthog from 'posthog-js';
import { environment } from '../environments/environment';

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private ready = false;

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  init(): void {
    if (!isPlatformBrowser(this.platformId) || this.ready || !environment.posthogToken) return;
    posthog.init(environment.posthogToken, {
      api_host: 'https://us.i.posthog.com',
      capture_pageview: false,
      person_profiles: 'always',
    });
    this.ready = true;
  }

  track(event: string, props?: Record<string, any>): void {
    if (!this.ready) return;
    posthog.capture(event, props);
  }

  identify(userId: string): void {
    if (!this.ready) return;
    posthog.identify(userId);
  }

  reset(): void {
    if (!this.ready) return;
    posthog.reset();
  }

  pageview(path: string): void {
    if (!this.ready) return;
    posthog.capture('$pageview', { $current_url: `https://tokispirit.com${path}` });
  }
}
