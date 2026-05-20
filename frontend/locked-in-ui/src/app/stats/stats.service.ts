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

  syncAchievements(): Observable<any> {
    return this.http.post<any>(`${this.base}/achievements/sync`, {});
  }

  getTrend(days: number = 28): Observable<any> {
    return this.http.get<any>(`${this.base}/trend?days=${days}`);
  }

  getHeatmap(): Observable<any> {
    return this.http.get<any>(`${this.base}/heatmap`);
  }

  getSubjectBreakdown(): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/subjects`);
  }

  getFocusScore(): Observable<{score: number}> {
    return this.http.get<{score: number}>(`${this.base}/focus-score`);
  }

  getStudyGoals(): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/home/goals`);
  }

  createStudyGoal(subject: string, weeklyHoursTarget: number): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/home/goals`, { subject, weeklyHoursTarget });
  }

  deleteStudyGoal(id: number): Observable<any> {
    return this.http.delete<any>(`${environment.apiUrl}/home/goals/${id}`);
  }
}
