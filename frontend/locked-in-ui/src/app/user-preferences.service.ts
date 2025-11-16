import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

// Types matching your backend DTOs
export interface UserPreferences {
  selectedPfp: string;
  selectedTheme: string;
  isVideoBackground: boolean;
  showLiveThemes: boolean;
  navHidden: boolean;
}

export interface PurchaseRequest {
  itemPath: string;
  itemName: string;
  goldCost: number;
}

export interface PurchaseResult {
  success: boolean;
  message: string;
  remainingGold: number;
  itemPath: string;
  itemName: string;
}

export interface UnlockedItem {
  path: string;
  name: string;
  goldCost: number;
  unlockedDate: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserPreferencesService {
  private baseUrl = 'https://lockedin-backend.onrender.com/api/home/preferences';
  
  // BehaviorSubjects to track current state
  private preferencesSubject = new BehaviorSubject<UserPreferences | null>(null);
  private unlockedPfpsSubject = new BehaviorSubject<string[]>([]);
  private unlockedThemesSubject = new BehaviorSubject<string[]>([]);

  // Public observables
  public preferences$ = this.preferencesSubject.asObservable();
  public unlockedPfps$ = this.unlockedPfpsSubject.asObservable();
  public unlockedThemes$ = this.unlockedThemesSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Load all user preferences and unlocked items
   */
  loadUserData(): Observable<any> {
    return new Observable(observer => {
      // Load preferences
      this.getUserPreferences().subscribe({
        next: (prefs) => {
          this.preferencesSubject.next(prefs);
          
          // Load unlocked items
          this.getUnlockedPfps().subscribe(pfps => {
            this.unlockedPfpsSubject.next(pfps);
            
            this.getUnlockedThemes().subscribe(themes => {
              this.unlockedThemesSubject.next(themes);
              observer.next({ preferences: prefs, pfps: pfps, themes: themes });
              observer.complete();
            });
          });
        },
        error: (error) => {
          console.error('Error loading user data:', error);
          observer.error(error);
        }
      });
    });
  }

  /**
   * Get user preferences from backend
   */
  getUserPreferences(): Observable<UserPreferences> {
    return this.http.get<UserPreferences>(this.baseUrl).pipe(
      catchError(error => {
        console.error('Error fetching preferences:', error);
        // Return default preferences if API fails
        return of({
          selectedPfp: 'assets/images/durarara1.jpg',
          selectedTheme: 'assets/videos/yumenikki.mp4',
          isVideoBackground: true,
          showLiveThemes: true,
          navHidden: false
        });
      })
    );
  }

  /**
   * Update user preferences
   */
  updatePreferences(preferences: Partial<UserPreferences>): Observable<UserPreferences> {
    return this.http.put<UserPreferences>(this.baseUrl, preferences).pipe(
      tap(updatedPrefs => {
        this.preferencesSubject.next(updatedPrefs);
      }),
      catchError(error => {
        console.error('Error updating preferences:', error);
        throw error;
      })
    );
  }

  /**
   * Update selected PFP
   */
  updateSelectedPfp(pfpPath: string): Observable<UserPreferences> {
    return this.updatePreferences({ selectedPfp: pfpPath });
  }

  /**
   * Update selected theme
   */
  updateSelectedTheme(themePath: string, isVideo: boolean): Observable<UserPreferences> {
    return this.updatePreferences({ 
      selectedTheme: themePath, 
      isVideoBackground: isVideo 
    });
  }

  /**
   * Update navigation visibility
   */
  updateNavVisibility(hidden: boolean): Observable<UserPreferences> {
    return this.updatePreferences({ navHidden: hidden });
  }

  /**
   * Update live themes preference
   */
  updateShowLiveThemes(showLive: boolean): Observable<UserPreferences> {
    return this.updatePreferences({ showLiveThemes: showLive });
  }

  /**
   * Get unlocked PFPs
   */
  getUnlockedPfps(): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/pfps/unlocked`).pipe(
      catchError(error => {
        console.error('Error fetching unlocked PFPs:', error);
        return of([]);
      })
    );
  }

  /**
   * Get unlocked themes
   */
  getUnlockedThemes(): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/themes/unlocked`).pipe(
      catchError(error => {
        console.error('Error fetching unlocked themes:', error);
        return of([]);
      })
    );
  }

  /**
   * Purchase a PFP
   */
  purchasePfp(pfpPath: string, pfpName: string, goldCost: number): Observable<PurchaseResult> {
    const request: PurchaseRequest = {
      itemPath: pfpPath,
      itemName: pfpName,
      goldCost: goldCost
    };

    return this.http.post<PurchaseResult>(`${this.baseUrl}/pfps/purchase`, request).pipe(
      tap(result => {
        if (result.success) {
          // Update unlocked PFPs list
          const currentPfps = this.unlockedPfpsSubject.value;
          this.unlockedPfpsSubject.next([...currentPfps, pfpPath]);
        }
      }),
      catchError(error => {
        console.error('Error purchasing PFP:', error);
        throw error;
      })
    );
  }

  /**
   * Purchase a theme
   */
  purchaseTheme(themePath: string, themeName: string, goldCost: number): Observable<PurchaseResult> {
    const request: PurchaseRequest = {
      itemPath: themePath,
      itemName: themeName,
      goldCost: goldCost
    };

    return this.http.post<PurchaseResult>(`${this.baseUrl}/themes/purchase`, request).pipe(
      tap(result => {
        if (result.success) {
          // Update unlocked themes list
          const currentThemes = this.unlockedThemesSubject.value;
          this.unlockedThemesSubject.next([...currentThemes, themePath]);
        }
      }),
      catchError(error => {
        console.error('Error purchasing theme:', error);
        throw error;
      })
    );
  }

  /**
   * Check if user can afford an item
   */
  canAfford(goldCost: number): Observable<boolean> {
    return this.http.get<boolean>(`${this.baseUrl}/can-afford/${goldCost}`).pipe(
      catchError(error => {
        console.error('Error checking affordability:', error);
        return of(false);
      })
    );
  }

  /**
   * Get current preferences value (synchronous)
   */
  getCurrentPreferences(): UserPreferences | null {
    return this.preferencesSubject.value;
  }

  /**
   * Get current unlocked PFPs (synchronous)
   */
  getCurrentUnlockedPfps(): string[] {
    return this.unlockedPfpsSubject.value;
  }

  /**
   * Get current unlocked themes (synchronous)
   */
  getCurrentUnlockedThemes(): string[] {
    return this.unlockedThemesSubject.value;
  }

  /**
   * Check if a PFP is unlocked
   */
  isPfpUnlocked(pfpPath: string): boolean {
    return this.unlockedPfpsSubject.value.includes(pfpPath);
  }

  /**
   * Check if a theme is unlocked
   */
  isThemeUnlocked(themePath: string): boolean {
    return this.unlockedThemesSubject.value.includes(themePath);
  }
}