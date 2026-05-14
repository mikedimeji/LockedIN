import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';
import { environment } from '../environments/environment'; // ✅ ADD THIS

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/home/auth`; // ✅ ADD THIS
  private tokenRefreshInProgress = false;
  private loginStatusSubject = new BehaviorSubject<boolean>(false);
  public loginStatus$ = this.loginStatusSubject.asObservable();

  constructor(private router: Router, private http: HttpClient) {
    this.checkSessionOnStartup();
    this.loginStatusSubject.next(this.isLoggedIn());
  }

  // Check if the code is running in a browser environment
  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  }

  // Check if the user is logged in by checking if the JWT token exists in localStorage
  isLoggedIn(): boolean {
    if (!this.isBrowser()) {
      return false;
    }
    const token = localStorage.getItem('authToken');
    return !!token;
  }

  // Check session on application startup
  private checkSessionOnStartup(): void {
    if (!this.isBrowser()) {
      return;
    }

    // Get the last activity timestamp
    const lastActivity = localStorage.getItem('lastActivityTime');
    const currentTime = Date.now();
    
    // If no last activity or it was more than 12 hours ago (or your preferred timeout),
    // force a token refresh or sign out
    if (!lastActivity || (currentTime - parseInt(lastActivity)) > 12 * 60 * 60 * 1000) {
      console.log('Session expired due to inactivity, attempting token refresh');
      this.attemptTokenRefresh();
    } else {
      // Update last activity
      this.updateLastActivity();
    }
  }

  // Attempt to refresh the token
  private attemptTokenRefresh(): void {
    const refreshToken = this.getRefreshToken();
    
    if (!refreshToken) {
      this.signOut();
      return;
    }

    if (this.tokenRefreshInProgress) {
      return;
    }

    this.tokenRefreshInProgress = true;
    
    this.refreshAccessToken().subscribe({
      next: (data) => {
        if (data && data.token) {
          localStorage.setItem('authToken', data.token);
          if (data.refreshToken) {
            localStorage.setItem('refreshToken', data.refreshToken);
          }
          this.updateLastActivity();
          this.tokenRefreshInProgress = false;
          
          // ADD this line to emit login status after successful refresh
          this.emitLoginStatus();
        } else {
          this.signOut();
        }
      },
      error: () => {
        this.signOut();
        this.tokenRefreshInProgress = false;
      }
    });
  }

  getUsername(): string {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return 'User';
    }
    
    const username = localStorage.getItem('username');
    return username || 'User'; // Return a default if username is not found
  }

  // Log out the user by removing the token from localStorage
  signOut(): void {
    if (this.isBrowser()) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
    }
    this.emitLoginStatus();
    
    this.router.navigate(['/login']);
  }

  onLoginComplete(): void {
    this.updateLastActivity();
    this.emitLoginStatus();
  }

  // Get the refresh token from localStorage
  getRefreshToken(): string | null {
    return this.isBrowser() ? localStorage.getItem('refreshToken') : null;
  }

  // Update last activity timestamp
  private updateLastActivity(): void {
    if (this.isBrowser() && this.isLoggedIn()) {
      localStorage.setItem('lastActivityTime', Date.now().toString());
    }
  }

  private emitLoginStatus(): void {
    const isLoggedIn = this.isLoggedIn();
    console.log('Emitting login status:', isLoggedIn);
    this.loginStatusSubject.next(isLoggedIn);
  }

  // Attempt to refresh the access token using the refresh token
  refreshAccessToken(): Observable<any> {
    const refreshToken = this.getRefreshToken();
    if (refreshToken) {
      return this.http.post<{ token: string }>(
        `${this.apiUrl}/refresh-token`, // ✅ CHANGED THIS
        { refreshToken }
      );
    }
    return new Observable(observer => {
      observer.error('No refresh token found');
    });
  }
}


