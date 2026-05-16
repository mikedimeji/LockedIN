import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Never intercept Spotify, CDN, or the refresh-token call itself (would cause infinite loop)
  if (
    req.url.includes('spotify') ||
    req.url.includes('scdn.co') ||
    req.url.includes('/refresh-token')
  ) {
    return next(req);
  }

  const auth = inject(AuthService);
  const token = localStorage.getItem('authToken');

  const authReq = token
    ? req.clone({ headers: req.headers.set('Authorization', `Bearer ${token}`) })
    : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // On 401 or 403 try to silently refresh the token and replay the request once
      if (error.status === 401 || error.status === 403) {
        return auth.refreshAccessToken().pipe(
          switchMap((response: any) => {
            if (response?.token) {
              localStorage.setItem('authToken', response.token);
              if (response.refreshToken) {
                localStorage.setItem('refreshToken', response.refreshToken);
              }
              // Replay original request with the fresh token
              const retryReq = req.clone({
                headers: req.headers.set('Authorization', `Bearer ${response.token}`)
              });
              return next(retryReq);
            }
            auth.signOut();
            return throwError(() => error);
          }),
          catchError(() => {
            // Refresh token itself failed (expired or missing) — force re-login
            auth.signOut();
            return throwError(() => error);
          })
        );
      }
      return throwError(() => error);
    })
  );
};
