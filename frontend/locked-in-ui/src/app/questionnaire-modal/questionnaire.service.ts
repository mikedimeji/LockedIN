import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface QuestionnaireStatus {
  status: 'not_started' | 'skipped' | 'completed';
  isPremium: boolean;
}

export interface QuestionnaireAnswers {
  focusCompletionDifficulty?: string;
  sustainedAttentionDifficulty?: string;
  distractionFrequency?: string;
  sleepHours?: string;
  chronotype?: string;
  dailyFocusTime?: string;
  primaryFocusChallenge?: string;
  workEnvironment?: string;
  taskBreakdownEase?: string;
  procrastinationTendency?: string;
  stressLevel?: string;
  primaryMotivation?: string;
}

@Injectable({ providedIn: 'root' })
export class QuestionnaireService {
  private base = `${environment.apiUrl}/profile/questionnaire`;

  constructor(private http: HttpClient) {}

  private headers(): HttpHeaders {
    const token = localStorage.getItem('authToken') || '';
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  getStatus(): Observable<QuestionnaireStatus> {
    return this.http.get<QuestionnaireStatus>(`${this.base}/status`, { headers: this.headers() });
  }

  submit(answers: QuestionnaireAnswers): Observable<void> {
    return this.http.post<void>(this.base, answers, { headers: this.headers() });
  }

  skip(): Observable<void> {
    return this.http.post<void>(`${this.base}/skip`, {}, { headers: this.headers() });
  }
}
