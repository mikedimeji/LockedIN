import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

export interface PremiumStatus {
  isPremium: boolean;
  goldRequired: number;
  currentGold: number;
  canAfford: boolean;
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
  private base = `${environment.apiUrl}/profile/premium`;

  constructor(private http: HttpClient) {}

  getStatus(): Observable<PremiumStatus> {
    return this.http.get<PremiumStatus>(this.base);
  }

  unlock(): Observable<PremiumStatus> {
    return this.http.post<PremiumStatus>(`${this.base}/unlock`, {});
  }
}
