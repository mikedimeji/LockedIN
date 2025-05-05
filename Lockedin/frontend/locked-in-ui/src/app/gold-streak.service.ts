import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GoldStreakService {
  private apiBaseUrl = 'http://localhost:8080/api/home';

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
   * @param pomodorosCompleted The number of pomodoros completed
   */
  rewardPomodoro(pomodorosCompleted: number): Observable<any> {
    return this.http.post<any>(`${this.apiBaseUrl}/gold/pomodoro-reward`, {
      pomodorosCompleted: pomodorosCompleted
    })
    .pipe(
      catchError(this.handleError)
    );
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
}