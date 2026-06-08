import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, retry, throwError, timer } from 'rxjs';
import { environment } from '../environments/environment';

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

  private static readonly QUEUE_KEY = 'tokispirit_pending_rewards';

  /** Drain any rewards that failed in a previous session and retry them now. */
  drainPendingRewards(): void {
    const raw = localStorage.getItem(GoldStreakService.QUEUE_KEY);
    if (!raw) return;
    let queue: any[] = [];
    try { queue = JSON.parse(raw); } catch { localStorage.removeItem(GoldStreakService.QUEUE_KEY); return; }
    if (!queue.length) { localStorage.removeItem(GoldStreakService.QUEUE_KEY); return; }
    localStorage.removeItem(GoldStreakService.QUEUE_KEY);
    for (const payload of queue) {
      this.http.post<any>(`${this.apiBaseUrl}/gold/pomodoro-reward`, payload)
        .pipe(retry({ count: 2, delay: (_, n) => timer(n * 3000) }), catchError(() => throwError(() => null)))
        .subscribe({ error: () => this.enqueueReward(payload) });
    }
  }

  private enqueueReward(payload: any): void {
    let queue: any[] = [];
    try { queue = JSON.parse(localStorage.getItem(GoldStreakService.QUEUE_KEY) ?? '[]'); } catch {}
    queue.push(payload);
    localStorage.setItem(GoldStreakService.QUEUE_KEY, JSON.stringify(queue));
  }

  /**
   * Award gold for completed pomodoros.
   * Retries 3× with exponential backoff; on final failure queues to localStorage
   * so it is retried automatically on next app load.
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
    const payload = {
      pomodorosCompleted,
      subject: opts?.subject ?? null,
      startTime: opts?.startTime ?? null,
      endTime: opts?.endTime ?? null,
      durationMinutes: opts?.durationMinutes ?? 0,
      pauseCount: opts?.pauseCount ?? 0
    };
    return this.http.post<any>(`${this.apiBaseUrl}/gold/pomodoro-reward`, payload).pipe(
      retry({ count: 3, delay: (_, attempt) => timer(attempt * 2000) }),
      catchError((err: HttpErrorResponse) => {
        // 4xx errors are definitive failures — don't queue (e.g. auth expired)
        if (err.status >= 400 && err.status < 500) return throwError(() => err);
        // Network / 5xx — queue for next session
        this.enqueueReward(payload);
        return throwError(() => err);
      })
    );
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

  tagLatestSession(subject: string): Observable<any> {
    return this.http.post<any>(`${this.apiBaseUrl}/stats/tag-session`, { subject })
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