import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../environments/environment'; // ✅ ADD THIS

@Injectable({
  providedIn: 'root'
})
export class GoldStreakService {
  private apiBaseUrl = `${environment.apiUrl}/home`; // ✅ CHANGED THIS

  constructor(private http: HttpClient) { }

  /**
   * Get the current gold balance for the authenticated user
   */
  getGoldBalance(): Observable<any> {
    return this.http.get<any>(`${this.apiBaseUrl}/gold`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Get the current streak information for the authenticated user
   */
  getCurrentStreak(): Observable<any> {
    return this.http.get<any>(`${this.apiBaseUrl}/streak`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Award gold for completed pomodoros
   */
  rewardPomodoro(
    pomodorosCompleted: number,
    opts?: {
      subject?: string;
      startTime?: string;
      endTime?: string;
      durationMinutes?: number;
      pauseCount?: number;
    }
  ): Observable<any> {
    return this.http.post<any>(`${this.apiBaseUrl}/gold/pomodoro-reward`, {
      pomodorosCompleted,
      subject: opts?.subject ?? null,
      startTime: opts?.startTime ?? null,
      endTime: opts?.endTime ?? null,
      durationMinutes: opts?.durationMinutes ?? 0,
      pauseCount: opts?.pauseCount ?? 0
    }).pipe(catchError(this.handleError));
  }

  getSubjectBreakdown(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiBaseUrl}/stats/subjects`)
      .pipe(catchError(this.handleError));
  }

  getFocusScore(): Observable<{score: number}> {
    return this.http.get<{score: number}>(`${this.apiBaseUrl}/stats/focus-score`)
      .pipe(catchError(this.handleError));
  }

  getStudyGoals(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiBaseUrl}/goals`)
      .pipe(catchError(this.handleError));
  }

  createStudyGoal(subject: string, weeklyHoursTarget: number): Observable<any> {
    return this.http.post<any>(`${this.apiBaseUrl}/goals`, { subject, weeklyHoursTarget })
      .pipe(catchError(this.handleError));
  }

  deleteStudyGoal(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiBaseUrl}/goals/${id}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Handle HTTP errors
   */
  private handleError(error: HttpErrorResponse) {
    if (error.status === 0) {
      // A client-side or network error occurred
      console.error('Network error occurred:', error.error);
    } else {
      // The backend returned an unsuccessful response code
      console.error(
        `Backend returned code ${error.status}, body was:`, 
        error.error
      );
    }
    // Return an observable with a user-facing error message
    return throwError(() => error);
  }

  /**
   * Spend gold from user's account
   * @param amount The amount of gold to spend
   */
  spendGold(amount: number): Observable<any> {
    return this.http.post<any>(`${this.apiBaseUrl}/gold/spend`, {
      amount: amount
    })
    .pipe(
      catchError(this.handleError)
    );
  }
}