import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface TimeBlock {
  id?: number;
  date: string;        // yyyy-MM-dd
  startMinute: number; // minutes from midnight
  endMinute: number;
  type: 'DEEP_WORK' | 'BREAK' | 'SCHEDULE';
  title: string;
}

@Injectable({ providedIn: 'root' })
export class ScheduleService {
  private readonly api = `${environment.apiUrl}/schedule`;

  constructor(private http: HttpClient) {}

  getBlocks(date: string): Observable<TimeBlock[]> {
    return this.http.get<TimeBlock[]>(`${this.api}/${date}`);
  }

  createBlock(block: Omit<TimeBlock, 'id'>): Observable<TimeBlock> {
    return this.http.post<TimeBlock>(`${this.api}/block`, block);
  }

  updateBlock(id: number, block: Partial<TimeBlock>): Observable<TimeBlock> {
    return this.http.put<TimeBlock>(`${this.api}/block/${id}`, block);
  }

  deleteBlock(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/block/${id}`);
  }

  minutesToDisplay(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    const ampm = h >= 12 ? 'pm' : 'am';
    const display = h % 12 === 0 ? 12 : h % 12;
    return m === 0 ? `${display}${ampm}` : `${display}:${m.toString().padStart(2, '0')}${ampm}`;
  }
}
