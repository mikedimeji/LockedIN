import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { throwError } from 'rxjs';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = localStorage.getItem('authToken');

    if (token) {
      const cloned = req.clone({
        headers: req.headers.set('Authorization', 'Bearer ' + token)
      });

      return next.handle(cloned).pipe(
        catchError((error) => {
          console.error('Request failed', error);
          return throwError(error);
        })
      );
    } else {
      return next.handle(req).pipe(
        catchError((error) => {
          console.error('Request failed', error);
          return throwError(error);
        })
      );
    }
  }
}


