import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HttpClient } from '@angular/common/http';
import { GoldStreakService } from './gold-streak.service';

describe('GoldStreakService', () => {
  let service: GoldStreakService;
  let httpMock: HttpTestingController;
  let httpClient: HttpClient;
  
  const apiBaseUrl = 'https://lockedin-backend.onrender.com/api/home';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [GoldStreakService]
    });
    
    service = TestBed.inject(GoldStreakService);
    httpMock = TestBed.inject(HttpTestingController);
    httpClient = TestBed.inject(HttpClient);
  });

  afterEach(() => {
    // Verify no outstanding requests
    httpMock.verify();
    
    // Clean localStorage between tests to ensure clean state
    localStorage.clear();
  });

  describe('Authentication Setup', () => {
    it('should have a valid auth token in localStorage', () => {
      // Set a mock token for testing
      const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0QGV4YW1wbGUuY29tIiwiaWF0IjoxNjgwMDAwMDAwLCJleHAiOjE5OTk5OTk5OTl9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
      localStorage.setItem('authToken', mockToken);
      
      const token = localStorage.getItem('authToken');
      expect(token).toBeTruthy();
      expect(token).toEqual(mockToken);
    });
  });

  describe('getGoldBalance', () => {
    it('should get the current gold balance', () => {
      const mockResponse = { currentGold: 150 };
      
      service.getGoldBalance().subscribe(response => {
        expect(response).toEqual(mockResponse);
      });
      
      const req = httpMock.expectOne(`${apiBaseUrl}/gold`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('getCurrentStreak', () => {
    it('should get the current streak information', () => {
      const mockResponse = { 
        currentStreak: 5,
        longestStreak: 8
      };
      
      service.getCurrentStreak().subscribe(response => {
        expect(response).toEqual(mockResponse);
      });
      
      const req = httpMock.expectOne(`${apiBaseUrl}/streak`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('rewardPomodoro', () => {
    it('should reward gold for completed pomodoros', () => {
      const mockResponse = {
        currentGold: 175,
        currentStreak: 5,
        longestStreak: 8
      };
      
      const pomodorosCompleted = 1;
      
      service.rewardPomodoro(pomodorosCompleted).subscribe(response => {
        expect(response).toEqual(mockResponse);
      });
      
      const req = httpMock.expectOne(`${apiBaseUrl}/gold/pomodoro-reward`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ pomodorosCompleted });
      req.flush(mockResponse);
    });
  });
});