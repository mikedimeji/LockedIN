import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { environment } from '../environments/environment';

export interface PremiumStatus {
  isPremium: boolean;
  subscriptionStatus: string; // 'active' | 'past_due' | 'cancelled' | 'inactive'
}

export interface FocusInsights {
  hasProfile: boolean;
  focusScore: number;
  focusCategory: string;
  recommendedSessionMins: string;
  bestStudyWindow: string;
  challengeAdvice: string;
  procrastinationTip: string;
  weeklySessionGoal: number;
  workflowTips: string[];
}

@Injectable({ providedIn: 'root' })
export class PremiumService {
  private base = `${environment.apiUrl}/subscription`;

  constructor(private http: HttpClient) {}

  getStatus(): Observable<PremiumStatus> {
    return this.http.get<PremiumStatus>(`${this.base}/status`);
  }

  createCheckout(plan: 'monthly' | 'annual'): Observable<{ checkoutUrl: string }> {
    return this.http.post<{ checkoutUrl: string }>(`${this.base}/checkout`, { plan });
  }
}

@Injectable({ providedIn: 'root' })
export class PremiumModalService {
  private openSubject = new Subject<void>();
  readonly openModal$ = this.openSubject.asObservable();
  open(): void { this.openSubject.next(); }
}
