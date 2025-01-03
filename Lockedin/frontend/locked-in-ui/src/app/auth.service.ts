import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(private router: Router, private http: HttpClient) {}

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

  // Log out the user by removing the token from localStorage
  signOut(): void {
    if (this.isBrowser()) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('refreshToken');
    }
    this.router.navigate(['/login']);
  }

  // Get the refresh token from localStorage
  getRefreshToken(): string | null {
    return this.isBrowser() ? localStorage.getItem('refreshToken') : null;
  }

  // Attempt to refresh the access token using the refresh token
  refreshAccessToken(): Observable<any> {
    const refreshToken = this.getRefreshToken();
    if (refreshToken) {
      return this.http.post<{ token: string }>(
        'http://localhost:8080/api/home/auth/refresh-token',
        { refreshToken }
      );
    }
    return new Observable(observer => {
      observer.error('No refresh token found');
    });
  }
}
import { HttpClient } from '@angular/common/http';


