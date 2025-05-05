import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class StatsService {
  private apiBaseUrl = 'http://localhost:8080/api/home';

  constructor(private http: HttpClient) { }

  /**
   * Get summary statistics for the user
   */
  getUserStatsSummary(): Observable<any> {
    return this.http.get<any>(`${this.apiBaseUrl}/stats/summary`);
  }

  /**
   * Get historical stats data for charts
   */
  getUserStatsHistory(timeframe: string = 'week'): Observable<any> {
    return this.http.get<any>(`${this.apiBaseUrl}/stats/history?timeframe=${timeframe}`);
  }

  /**
   * Get streak timeline data 
   */
  getStreakTimeline(): Observable<any> {
    return this.http.get<any>(`${this.apiBaseUrl}/stats/streak-timeline`);
  }

  /**
   * Get user achievements
   */
  getUserAchievements(): Observable<any> {
    return this.http.get<any>(`${this.apiBaseUrl}/stats/achievements`);
  }

  /**
   * Error handling
   */
  private handleError(error: any) {
    console.error('An error occurred', error);
    return Promise.reject(error.message || error);
  }
}