import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface GCalEvent {
  id:          string;
  title:       string;
  startTime:   string;
  endTime:     string;
  allDay:      boolean;
  startMinute: number;
  endMinute:   number;
  type?:       'DEEP_WORK' | 'BREAK' | 'SCHEDULE'; // user-assigned override, stored in memory
}

@Injectable({ providedIn: 'root' })
export class GoogleCalendarService {
  private readonly api = `${environment.apiUrl}/calendar`;

  constructor(private http: HttpClient) {}

  getStatus(): Observable<{ connected: boolean }> {
    return this.http.get<{ connected: boolean }>(`${this.api}/status`)
      .pipe(catchError(() => of({ connected: false })));
  }

  getAuthUrl(): Observable<{ url: string }> {
    return this.http.get<{ url: string }>(`${this.api}/auth`);
  }

  getEvents(date: string): Observable<GCalEvent[]> {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return this.http.get<GCalEvent[]>(`${this.api}/events?date=${date}&timezone=${encodeURIComponent(tz)}`)
      .pipe(catchError(() => of([])));
  }

  disconnect(): Observable<void> {
    return this.http.delete<void>(`${this.api}/disconnect`);
  }
}
