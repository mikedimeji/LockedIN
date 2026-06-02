import { Component, OnInit, AfterViewInit, OnDestroy, Inject, PLATFORM_ID, HostBinding, HostListener } from '@angular/core';
import { Router, RouterLink, RouterOutlet, NavigationEnd } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from './header/header.component';
import { UserLoginComponent } from './user-login/user-login.component';
import { TimerComponent } from './timer/timer.component';
import { NotificationsComponent } from "./notifications/notifications.component";
import { UserRegisterComponent } from './user-register/user-register.component';
import { ConfirmDialogComponent } from './confirm-dialog/confirm-dialog.component';
import { ThemesComponent } from './themes/themes.component';
import { SpotifyPlayerComponent } from "./spotify-player/spotify-player.component";
import { PlannerComponent } from "./planner/planner.component";
import { PixelClockComponent } from './pixel-clock/pixel-clock.component';
import { AmbienceComponent } from "./ambience/ambience.component";
import { QuestionnaireModalComponent } from './questionnaire-modal/questionnaire-modal.component';
import { AuthService } from './auth.service';
import { GoldStreakService } from './gold-streak.service';
import { HeartService } from './heart.service';
import { QuestionnaireService } from './questionnaire-modal/questionnaire.service';
import { PremiumService, PremiumModalService } from './premium.service';
import { interval } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { of, filter, Subscription } from 'rxjs';
import { UserPreferencesService } from './user-preferences.service';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  standalone: true,
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  imports: [
    CommonModule,
    FormsModule,
    HeaderComponent,
    TimerComponent,
    AmbienceComponent,
    UserRegisterComponent,
    PixelClockComponent,
    UserLoginComponent,
    PlannerComponent,
    NotificationsComponent,
    ConfirmDialogComponent,
    RouterOutlet,
    RouterLink,
    ThemesComponent,
    SpotifyPlayerComponent,
    QuestionnaireModalComponent,
  ]
})
export class AppComponent implements OnInit, OnDestroy {

  @HostBinding('attr.ngSkipHydration') ngSkipHydration = true;

  // Listen for custom attribute changes to trigger refresh
  @HostListener('attr.data-refresh-needed')
  onRefreshAttributeChanged() {
    console.log('data-refresh-needed attribute changed, refreshing user data');
    this.refreshUserData();
  }

// PFP-related properties
showPfpSelector: boolean = false;
selectedPfp: string = 'assets/images/durarara1.jpg'; // current default
availablePfps = [
  // ── Free / default ──
  { path: 'assets/images/durarara1.jpg',       name: 'Durarara',       premium: false, unlocked: true,  goldCost: 0,   isAnimated: false },
  { path: 'assets/images/pfp/cute.gif',         name: 'Cute Pinky',     premium: false, unlocked: true,  goldCost: 0,   isAnimated: true  },
  { path: 'assets/images/pfp/cat2.jpg',         name: 'Cat Two',        premium: false, unlocked: true,  goldCost: 0,   isAnimated: false },
  { path: 'assets/images/pfp/gurrenl.jpg',      name: 'Gurren Lagann',  premium: false, unlocked: true,  goldCost: 0,   isAnimated: false },
  { path: 'assets/images/pfp/ken.png.jpeg',     name: 'Ken',            premium: false, unlocked: true,  goldCost: 0,   isAnimated: false },
  { path: 'assets/images/pfp/straydogs.jpg',    name: 'Stray Dogs',     premium: false, unlocked: true,  goldCost: 0,   isAnimated: false },
  { path: 'assets/images/pfp/poutinggirl.jpg',  name: 'Pouting Girl',   premium: false, unlocked: true,  goldCost: 0,   isAnimated: false },

  // ── Static premium (cheap: 25–150) ──
  { path: 'assets/images/pfp/cat.jpg',          name: 'Anime Cat',      premium: true,  unlocked: false, goldCost: 25,  isAnimated: false },
  { path: 'assets/images/pfp/cat3.jpg',         name: 'Cat Three',      premium: true,  unlocked: false, goldCost: 25,  isAnimated: false },
  { path: 'assets/images/pfp/gurrenl2.jpg',     name: 'Gurren Lagann 2',premium: true,  unlocked: false, goldCost: 30,  isAnimated: false },
  { path: 'assets/images/pfp/edward.jpg',       name: 'Edward',         premium: true,  unlocked: false, goldCost: 40,  isAnimated: false },
  { path: 'assets/images/pfp/flcl.jpg',         name: 'FLCL',           premium: true,  unlocked: false, goldCost: 50,  isAnimated: false },

  // ── GIF premium (mid: 200–500) ──
  { path: 'assets/images/pfp/edward1.gif',      name: 'Edward Red',     premium: true,  unlocked: false, goldCost: 200, isAnimated: true  },
  { path: 'assets/images/pfp/fire.gif',         name: 'Fire',           premium: true,  unlocked: false, goldCost: 200, isAnimated: true  },
  { path: 'assets/images/pfp/pod.gif',          name: 'Pod 042',        premium: true,  unlocked: false, goldCost: 250, isAnimated: true  },
  { path: 'assets/images/pfp/space.gif',        name: 'Space',          premium: true,  unlocked: false, goldCost: 250, isAnimated: true  },
  { path: 'assets/images/pfp/lucky.gif',        name: 'Lucky Star',     premium: true,  unlocked: false, goldCost: 300, isAnimated: true  },
  { path: 'assets/images/pfp/cyber.gif',        name: 'Cyber',          premium: true,  unlocked: false, goldCost: 300, isAnimated: true  },
  { path: 'assets/images/pfp/gon.gif',          name: 'Gon',            premium: true,  unlocked: false, goldCost: 350, isAnimated: true  },
  { path: 'assets/images/pfp/mikasa.gif',       name: 'Mikasa',         premium: true,  unlocked: false, goldCost: 350, isAnimated: true  },
  { path: 'assets/images/pfp/trunks.gif',       name: 'Trunks',         premium: true,  unlocked: false, goldCost: 350, isAnimated: true  },
  { path: 'assets/images/pfp/kurapika.gif',     name: 'Kurapika',       premium: true,  unlocked: false, goldCost: 400, isAnimated: true  },
  { path: 'assets/images/pfp/chrollo.gif',      name: 'Chrollo',        premium: true,  unlocked: false, goldCost: 400, isAnimated: true  },

  // ── GIF premium (premium tier: 500–800) ──
  { path: 'assets/images/pfp/aestheticoon.gif', name: 'Aesthetic Moon', premium: true,  unlocked: false, goldCost: 500, isAnimated: true  },
  { path: 'assets/images/pfp/sailormoon.gif',   name: 'Sailor Moon',    premium: true,  unlocked: false, goldCost: 600, isAnimated: true  },
];
  selectedTheme: string = 'assets/images/themes/city.jpg'; // Default to video
  isVideoBackground: boolean = true; // Assume video by default
  isRegisterMode = false;
  isLoginMode = false;
  showSpotifyPlayer: boolean = false;
  showAmbiencePanel: boolean = false;
  isNavHidden: boolean = false;
  
  isLoading: boolean = false;

  isPremium: boolean = false;
  premiumPlan: string | null = null;
  showPremiumModal: boolean = false;
  premiumCheckingOut: boolean = false;
  showPremiumBanner: boolean = false;

  appDialog: { show: boolean; mode: 'alert'|'confirm'; type: 'info'|'success'|'error'; title: string; message: string; onConfirm?: () => void } =
    { show: false, mode: 'alert', type: 'info', title: '', message: '' };

  showAlert(type: 'info'|'success'|'error', title: string, message: string, onConfirm?: () => void): void {
    this.appDialog = { show: true, mode: 'alert', type, title, message, onConfirm };
  }

  showConfirm(title: string, message: string, onConfirm: () => void): void {
    this.appDialog = { show: true, mode: 'confirm', type: 'info', title, message, onConfirm };
  }

  closeAppDialog(): void { this.appDialog = { ...this.appDialog, show: false }; }

  appDialogConfirm(): void {
    const cb = this.appDialog.onConfirm;
    this.closeAppDialog();
    if (cb) cb();
  }

  // Gold and streak properties
  goldBalance: number = 0;
  currentStreak: number = 0;
  longestStreak: number = 0;

  get heartImgSrc(): string {
    const hp = this.heartService.currentHeartPoints;
    if (hp >= 2) return 'assets/images/hearts/redheart.png';
    if (hp === 1) return 'assets/images/hearts/heart-halfred.png';
    return 'assets/images/hearts/heart-emptyred.png';
  }

  // For tracking subscriptions
  private routerSubscription: Subscription | null = null;
  private premiumModalSub: Subscription | null = null;
  private customEventListenerAdded: boolean = false;

  // Notifications properties
  showNotifications: boolean = false;
  hasUnreadNotifications: boolean = false;

  showQuestionnaire: boolean = false;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private router: Router,
    public authService: AuthService,
    private goldStreakService: GoldStreakService,
    public heartService: HeartService,
    private userPreferencesService: UserPreferencesService,
    private questionnaireService: QuestionnaireService,
    private premiumService: PremiumService,
    private premiumModalService: PremiumModalService,
    private cdr: ChangeDetectorRef
  ) {}


  ngOnInit(): void {
  if (isPlatformBrowser(this.platformId)) {
    // Subscribe to global premium modal open requests
    this.premiumModalSub = this.premiumModalService.openModal$.subscribe(() => {
      this.showPremiumModal = true;
    });

    // Setup custom event listener for refresh
    this.setupCustomEventListener();

    // Listen for router navigation end events to refresh data
    this.setupRouterListener();

    this.checkUnreadNotifications();

    // Load user data if logged in
    if (this.authService.isLoggedIn()) {
      this.loadUserDataFromBackend();
    } else {
      // If not logged in, use localStorage fallbacks
      this.setupTheme();
      this.loadNavVisibility();
      this.setupPfp();
    }
  }
}

private loadUserDataFromBackend(): void {
  this.isLoading = true;
  this.userPreferencesService.loadUserData().subscribe({
    next: (data) => {
      console.log('User data loaded from backend:', data);

      const DEFAULT_THEME = 'assets/videos/witch.gif';

      // Apply preferences
      const prefs = data.preferences;
      this.selectedTheme = prefs?.selectedTheme || DEFAULT_THEME;
      this.isVideoBackground = prefs?.isVideoBackground;
      this.isNavHidden = prefs.navHidden;
      this.selectedPfp = prefs.selectedPfp;

      // Update PFP unlock status
      this.updatePfpUnlockStatus(data.pfps);

      // Load other user data (gold, streaks)
      this.refreshUserData();

      // Load premium status for gold border + banner
      this.premiumService.getStatus().subscribe({
        next: (status) => {
          this.isPremium = status.isPremium;
          this.premiumPlan = status.plan ?? null;
          if (!status.isPremium && !localStorage.getItem('premiumBannerDismissed')) {
            this.showPremiumBanner = true;
          }
        },
        error: () => {}
      });

      this.isLoading = false;
      this.cdr.detectChanges();

      // Force background refresh
      this.forceBackgroundRefresh();

      // Show questionnaire for new accounts
      this.questionnaireService.getStatus().subscribe({
        next: (status) => {
          if (status.status === 'not_started') {
            this.showQuestionnaire = true;
          }
        },
        error: () => {}
      });
    },
    error: (error) => {
      console.error('Error loading user data from backend:', error);
      // Fallback to localStorage
      this.setupTheme();
      this.loadNavVisibility();
      this.setupPfp();
      this.isLoading = false;
    }
  });
}
  
  // Set up theme preferences
  private setupTheme(): void {
    const theme = localStorage.getItem('selectedTheme');
    if (theme) {
      this.selectedTheme = theme;
      
      // Try to get explicit video flag first
      const isVideoStr = localStorage.getItem('isVideoBackground');
      if (isVideoStr !== null) {
        this.isVideoBackground = isVideoStr === 'true';
        console.log('Using explicit video flag:', this.isVideoBackground);
      } else {
        // Fall back to checking file extension
        this.isVideoBackground = theme.endsWith('.mp4') || theme.endsWith('.gif');
        console.log('Determined by extension:', this.isVideoBackground);
      }
      
      console.log('Selected theme:', this.selectedTheme, 'Is video?', this.isVideoBackground);
    } else {
      this.selectedTheme = 'assets/videos/witch.gif';
      this.isVideoBackground = true;
    }
  }
  
  // Load nav visibility settings
  private loadNavVisibility(): void {
    const navHidden = localStorage.getItem('navHidden');
    if (navHidden !== null) {
      this.isNavHidden = navHidden === 'true';
    }
  }
  
  // Setup custom event listener for refresh
  private setupCustomEventListener(): void {
    if (isPlatformBrowser(this.platformId) && !this.customEventListenerAdded) {
      document.addEventListener('userDataRefreshNeeded', (event: any) => {
        console.log('User data refresh event received from:', event.detail?.source);
        this.refreshUserData();
      });
      this.customEventListenerAdded = true;
    }
  }
  
  // Setup router listener to refresh data on navigation
  private setupRouterListener(): void {
    this.routerSubscription = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      if (this.authService.isLoggedIn()) {
        console.log('Navigation completed, refreshing user data');
        this.refreshUserData();
      }
    });
  }

  // REPLACE the existing toggleNavVisibility() method
toggleNavVisibility(): void {
  this.isNavHidden = !this.isNavHidden;
  
  if (this.authService.isLoggedIn()) {
    // Save to backend
    this.userPreferencesService.updateNavVisibility(this.isNavHidden).subscribe({
      next: (prefs) => {
        console.log('Nav visibility updated on backend:', prefs);
      },
      error: (error) => {
        console.error('Error updating nav visibility on backend:', error);
        // Fallback to localStorage
        if (isPlatformBrowser(this.platformId)) {
          localStorage.setItem('navHidden', this.isNavHidden.toString());
        }
      }
    });
  } else {
    // Save to localStorage for non-logged-in users
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('navHidden', this.isNavHidden.toString());
    }
  }
}

  refreshUserData(): void {
    if (this.authService.isLoggedIn()) {
      console.log('Refreshing user data');
      
      // Get gold balance
      this.goldStreakService.getGoldBalance().pipe(
        catchError(error => {
          console.error('Error fetching gold balance:', error);
          return of({ currentGold: this.goldBalance }); // Keep current value on error
        })
      ).subscribe(data => {
        console.log('Gold balance refreshed:', data);
        if (data && data.currentGold !== undefined) {
          this.goldBalance = data.currentGold;
        }
      });
      
      // Get streak data
      this.goldStreakService.getCurrentStreak().pipe(
        catchError(error => {
          console.error('Error fetching streak data:', error);
          return of({ 
            currentStreak: this.currentStreak, 
            longestStreak: this.longestStreak 
          }); // Keep current values
        })
      ).subscribe(data => {
        console.log('Streak data refreshed:', data);
        if (data) {
          if (data.currentStreak !== undefined) {
            this.currentStreak = data.currentStreak;
          }
          if (data.longestStreak !== undefined) {
            this.longestStreak = data.longestStreak;
          }
        }
      });
    } else {
      // Reset values if not logged in
      this.goldBalance = 0;
      this.currentStreak = 0;
      this.longestStreak = 0;
      this.heartService.setHeartPoints(2);
    }
  }
  // Clean up on destroy
  ngOnDestroy(): void {
    this.routerSubscription?.unsubscribe();
    this.premiumModalSub?.unsubscribe();
  }

  openPremiumModal(): void {
    this.showPremiumModal = true;
    this.showPremiumBanner = false;
    localStorage.setItem('premiumBannerDismissed', 'true');
  }

  closePremiumModal(): void {
    this.showPremiumModal = false;
    this.premiumCheckingOut = false;
  }

  subscribePremium(plan: 'monthly' | 'annual'): void {
    if (this.premiumCheckingOut) return;
    this.premiumCheckingOut = true;
    this.premiumService.createCheckout(plan).subscribe({
      next: ({ checkoutUrl }) => { window.location.href = checkoutUrl; },
      error: () => { this.premiumCheckingOut = false; }
    });
  }

  manageSubscription(): void {
    this.premiumService.openPortal().subscribe({
      next: ({ url }) => { window.location.href = url; },
      error: () => {}
    });
  }

  
  // In your component class...
ngAfterViewInit() {
  setTimeout(() => {
    // Properly cast to HTMLVideoElement
    const videoElement = document.querySelector('video.background-video') as HTMLVideoElement;
    console.log('Video element found:', videoElement ? 'YES' : 'NO');
    
    if (videoElement) {
      console.log('Video source:', videoElement.querySelector('source')?.getAttribute('src'));
      console.log('Video is playing:', !videoElement.paused);
      console.log('Video dimensions:', videoElement.videoWidth, 'x', videoElement.videoHeight);
      console.log('Video display style:', window.getComputedStyle(videoElement).display);
      console.log('Video z-index:', window.getComputedStyle(videoElement).zIndex);
      
      // Try to force play
      videoElement.play().then(() => {
        console.log('Successfully started video playback');
      }).catch(err => {
        console.error('Error starting video playback:', err);
      });
    }
  }, 1000);
}

  navigateTo(route: string) {
    this.router.navigate([`/${route}`]);
  }

  showRegister() {
    this.router.navigate(['/register']);
  }

  toggleSpotifyPlayer() {
    this.showSpotifyPlayer = !this.showSpotifyPlayer;
  }

  toggleAmbiencePanel() {
    this.showAmbiencePanel = !this.showAmbiencePanel;
  }

  showLogin() {
    this.router.navigate(['/login']);
  }

  onSignOut(): void {
    this.authService.signOut();
    // Reset user data on sign out
    this.goldBalance = 0;
    this.currentStreak = 0;
    this.longestStreak = 0;
  }

  // Toggle PFP selector visibility
  togglePfpSelector(): void {
    this.showPfpSelector = !this.showPfpSelector;
  }

  // Close PFP selector
  closePfpSelector(): void {
    this.showPfpSelector = false;
  }

  // Check if a PFP is currently selected
  isPfpSelected(pfpPath: string): boolean {
    return this.selectedPfp === pfpPath;
  }

  // REPLACE the existing changePfp() method
changePfp(pfp: any): void {
  if (pfp.premium && !pfp.unlocked) {
    // Handle premium PFP purchase
    this.purchasePfp(pfp);
  } else if (pfp.unlocked) {
    // Change to unlocked PFP
    this.selectedPfp = pfp.path;
    
    if (this.authService.isLoggedIn()) {
      // Save to backend
      this.userPreferencesService.updateSelectedPfp(pfp.path).subscribe({
        next: (prefs) => {
          console.log('PFP updated on backend:', prefs);
        },
        error: (error) => {
          console.error('Error updating PFP on backend:', error);
          // Fallback to localStorage
          if (isPlatformBrowser(this.platformId)) {
            localStorage.setItem('selectedPfp', pfp.path);
          }
        }
      });
    } else {
      // Save to localStorage for non-logged-in users
      if (isPlatformBrowser(this.platformId)) {
        localStorage.setItem('selectedPfp', pfp.path);
      }
    }
    
    // Close selector after selection
    this.closePfpSelector();
    
    console.log('Changed PFP to:', pfp.name);
  }
}

  // Handle PFP purchase
  // REPLACE the existing purchasePfp() method
purchasePfp(pfp: any): void {
  if (!this.authService.isLoggedIn()) {
    this.showAlert('info', 'LOGIN REQUIRED', 'Please log in to purchase avatars.');
    return;
  }

  if (this.goldBalance >= pfp.goldCost) {
    this.showConfirm('PURCHASE AVATAR', `"${pfp.name}" — ${pfp.goldCost} gold`, () => {
      this.userPreferencesService.purchasePfp(pfp.path, pfp.name, pfp.goldCost).subscribe({
        next: (result) => {
          if (result.success) {
            this.goldBalance = result.remainingGold;
            pfp.unlocked = true;
            this.selectedPfp = pfp.path;
            this.closePfpSelector();
            console.log(`Purchased and equipped ${pfp.name} for ${pfp.goldCost} gold`);
            this.showAlert('success', 'PURCHASED', result.message);
            this.refreshUserData();
          }
        },
        error: (error) => {
          console.error('Error purchasing PFP:', error);
          let errorMessage = 'Purchase failed. Please try again.';
          if (error.status === 400) {
            errorMessage = error.error || 'Insufficient gold or invalid request';
          }
          this.showAlert('error', 'PURCHASE FAILED', errorMessage);
          this.refreshUserData();
        }
      });
    });
  } else {
    this.showAlert('error', 'INSUFFICIENT GOLD', `You need ${pfp.goldCost} gold but only have ${this.goldBalance}.`);
  }
}

  // REPLACE the existing setupPfp() method
private setupPfp(): void {
  if (this.authService.isLoggedIn()) {
    // If logged in, PFP data comes from backend (already loaded in loadUserDataFromBackend)
    return;
  }
  
  // Fallback to localStorage for non-logged-in users
  const savedPfp = localStorage.getItem('selectedPfp');
  if (savedPfp) {
    this.selectedPfp = savedPfp;
  }
  
  // Load unlocked PFPs from localStorage
  const unlockedPfps = localStorage.getItem('unlockedPfps');
  if (unlockedPfps) {
    try {
      const unlockedPaths = JSON.parse(unlockedPfps);
      this.availablePfps.forEach(pfp => {
        if (unlockedPaths.includes(pfp.path)) {
          pfp.unlocked = true;
        }
      });
    } catch (error) {
      console.error('Error loading unlocked PFPs:', error);
    }
  }
}

private updatePfpUnlockStatus(unlockedPfpPaths: string[]): void {
  this.availablePfps.forEach(pfp => {
    pfp.unlocked = unlockedPfpPaths.includes(pfp.path) || !pfp.premium;
  });
}

  showFeedbackModal: boolean = false;
  feedbackText: string = '';
  feedbackSending: boolean = false;

  openFeedback(): void {
    this.feedbackText = '';
    this.feedbackSending = false;
    this.showFeedbackModal = true;
  }

  closeFeedbackModal(): void {
    this.showFeedbackModal = false;
    this.feedbackText = '';
  }

  submitFeedback(): void {
    const text = this.feedbackText.trim();
    if (!text) return;
    this.feedbackSending = true;
    const subject = encodeURIComponent('LockedIN Feedback');
    const body = encodeURIComponent(text + '\n\n— Sent from LockedIN\nUser: ' + (this.authService.getUsername() || 'guest'));
    window.open(`mailto:oladimeji.michael12345@gmail.com?subject=${subject}&body=${body}`, '_blank');
    setTimeout(() => {
      this.showFeedbackModal = false;
      this.feedbackText = '';
      this.feedbackSending = false;
    }, 800);
  }

  // Toggle notifications panel
toggleNotifications(): void {
  this.showNotifications = !this.showNotifications;
}

// Close notifications panel
closeNotifications(): void {
  this.showNotifications = false;
}

checkUnreadNotifications(): void {
  this.hasUnreadNotifications = false;
}

private forceBackgroundRefresh(): void {
  // Force Angular to re-evaluate the background display logic
  const currentTheme = this.selectedTheme;
  const currentVideoFlag = this.isVideoBackground;
  
  // Clear and reset to trigger change detection
  this.selectedTheme = '';
  this.isVideoBackground = false;
  
  // Force change detection
  this.cdr.detectChanges();
  
  // Use setTimeout to ensure the DOM updates
  setTimeout(() => {
    this.selectedTheme = currentTheme;
    this.isVideoBackground = currentVideoFlag;
    
    // Force change detection again
    this.cdr.detectChanges();
    
    console.log('🔄 Background refreshed:', {
      theme: this.selectedTheme,
      isVideo: this.isVideoBackground,
      isGif: this.selectedTheme.toLowerCase().endsWith('.gif')
    });
  }, 100);
}

}





