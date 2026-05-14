import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { StreakDTO } from './gold-streak.service';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class StreakService {
  private baseUrl = `${environment.apiUrl}/home`;

  constructor(private http: HttpClient) { }

  /**
   * Get the current streak information for the authenticated user
   */
  getStreakInfo(): Observable<StreakDTO> {
    return this.http.get<StreakDTO>(this.baseUrl);
  }

  /**
   * Get the current streak value
   */
  getCurrentStreak(): Observable<number> {
    return this.http.get<number>(`${this.baseUrl}/current`);
  }

  /**
   * Get the longest streak value
   */
  getLongestStreak(): Observable<number> {
    return this.http.get<number>(`${this.baseUrl}/longest`);
  }
}