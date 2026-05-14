import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
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

  private _heartPoints = new BehaviorSubject<number>(2);
  readonly heartPoints$ = this._heartPoints.asObservable();

  constructor(private http: HttpClient) {}

  get currentHeartPoints(): number {
    return this._heartPoints.getValue();
  }

  setHeartPoints(value: number): void {
    this._heartPoints.next(value);
  }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('accessToken');
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  getHearts(): Observable<HeartStatus> {
    return this.http.get<HeartStatus>(this.apiUrl, { headers: this.getHeaders() }).pipe(
      tap(res => this._heartPoints.next(res.heartPoints))
    );
  }

  breakHeart(): Observable<HeartStatus> {
    return this.http.post<HeartStatus>(`${this.apiUrl}/break`, {}, { headers: this.getHeaders() }).pipe(
      tap(res => this._heartPoints.next(res.heartPoints))
    );
  }
}
