import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

export interface HeartStatus {
  heartPoints: number;
  currentStreak: number;
  streakReset: boolean;
  lastHeartRefillDate: string;
}

@Injectable({ providedIn: 'root' })
export class HeartService {
  private apiUrl = `${environment.apiUrl}/home/hearts`;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('accessToken');
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  getHearts(): Observable<HeartStatus> {
    return this.http.get<HeartStatus>(this.apiUrl, { headers: this.getHeaders() });
  }

  breakHeart(): Observable<HeartStatus> {
    return this.http.post<HeartStatus>(`${this.apiUrl}/break`, {}, { headers: this.getHeaders() });
  }
}
