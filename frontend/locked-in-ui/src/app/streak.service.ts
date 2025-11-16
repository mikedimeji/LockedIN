import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { StreakDTO } from './gold-streak.service';

@Injectable({
  providedIn: 'root'
})
export class StreakService {
  private baseUrl = 'https://lockedin-backend.onrender.com/api/home';

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