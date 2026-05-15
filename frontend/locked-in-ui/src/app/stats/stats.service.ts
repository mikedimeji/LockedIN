import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { FocusInsights } from '../premium.service';

@Injectable({ providedIn: 'root' })
export class StatsService {
  private base = `${environment.apiUrl}/home/stats`;

  constructor(private http: HttpClient) {}

  getUserStatsSummary(): Observable<any> {
    return this.http.get<any>(`${this.base}/summary`);
  }

  getUserStatsHistory(timeframe: string = 'week'): Observable<any> {
    return this.http.get<any>(`${this.base}/history?timeframe=${timeframe}`);
  }

  getStreakTimeline(): Observable<any> {
    return this.http.get<any>(`${this.base}/streak-timeline`);
  }

  getUserAchievements(): Observable<any> {
    return this.http.get<any>(`${this.base}/achievements`);
  }

  getFocusInsights(): Observable<FocusInsights> {
    return this.http.get<FocusInsights>(`${this.base}/insights`);
  }
}
