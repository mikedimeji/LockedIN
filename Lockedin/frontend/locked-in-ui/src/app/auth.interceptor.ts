// auth.interceptor.ts (corrected version)
import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Skip interceptor for Spotify API requests
  if (req.url.includes('spotify') || req.url.includes('scdn.co')) {
    return next(req);
  }
  
  try {
    const token = localStorage.getItem('authToken');
    
    if (token) {
      // Fix: Make sure to include space after "Bearer"
      // The original code might be missing the space which causes 403 errors
      const cloned = req.clone({
        headers: req.headers.set('Authorization', `Bearer ${token}`)
      });
      
      return next(cloned);
    }
  } catch (error) {
    console.error('Error accessing localStorage:', error);
  }
  
  return next(req);
};


