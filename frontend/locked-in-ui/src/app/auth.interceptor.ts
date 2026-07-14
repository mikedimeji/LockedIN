import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError, BehaviorSubject, filter, take } from 'rxjs';
import { AuthService } from './auth.service';

// Shared refresh lock — prevents concurrent 401s from each firing their own refresh.
let isRefreshing = false;
const refreshDone$ = new BehaviorSubject<string | null>(null);

export const authInterceptor: HttpInterceptorFn = (req, next) => {
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
      if (error.status !== 401) {
        return throwError(() => error);
      }

      if (isRefreshing) {
        // Another request is already refreshing — wait for the new token, then retry.
        return refreshDone$.pipe(
          filter(t => t !== null),
          take(1),
          switchMap(newToken => next(
            req.clone({ headers: req.headers.set('Authorization', `Bearer ${newToken}`) })
          ))
        );
      }

      isRefreshing = true;
      refreshDone$.next(null);

      return auth.refreshAccessToken().pipe(
        switchMap((response: any) => {
          isRefreshing = false;
          if (response?.token) {
            localStorage.setItem('authToken', response.token);
            if (response.refreshToken) {
              localStorage.setItem('refreshToken', response.refreshToken);
            }
            refreshDone$.next(response.token);
            return next(
              req.clone({ headers: req.headers.set('Authorization', `Bearer ${response.token}`) })
            );
          }
          auth.signOut();
          return throwError(() => error);
        }),
        catchError(() => {
          isRefreshing = false;
          auth.signOut();
          return throwError(() => error);
        })
      );
    })
  );
};
