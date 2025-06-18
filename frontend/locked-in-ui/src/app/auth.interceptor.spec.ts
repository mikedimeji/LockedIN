// src/app/auth.interceptor.spec.ts
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HTTP_INTERCEPTORS, HttpClient } from '@angular/common/http';
import { authInterceptor } from './auth.interceptor';

describe('AuthInterceptor', () => {
  let httpClient: HttpClient;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        { provide: HTTP_INTERCEPTORS, useFactory: () => authInterceptor, multi: true }
      ]
    });

    httpClient = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    
    // Mock localStorage
    spyOn(localStorage, 'getItem').and.returnValue('test-token');
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should add Authorization header to requests', () => {
    httpClient.get('/api/test').subscribe();
    
    const req = httpMock.expectOne('/api/test');
    expect(req.request.headers.has('Authorization')).toBeTrue();
    expect(req.request.headers.get('Authorization')).toBe('Bearer test-token');
    req.flush({});
  });

  it('should specifically handle gold/add endpoint', () => {
    httpClient.post('http://localhost:8080/api/home/gold/add', { amount: 10 }).subscribe();
    
    const req = httpMock.expectOne('http://localhost:8080/api/home/gold/add');
    expect(req.request.headers.has('Authorization')).toBeTrue();
    expect(req.request.headers.get('Authorization')).toBe('Bearer test-token');
    req.flush({});
  });
});