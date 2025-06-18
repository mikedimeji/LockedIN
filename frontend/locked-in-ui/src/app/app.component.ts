import { Component, OnInit, AfterViewInit, Inject, PLATFORM_ID, HostBinding, HostListener, } from '@angular/core';
import { Router, RouterLink, RouterOutlet, NavigationEnd } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from './header/header.component';
import { UserLoginComponent } from './user-login/user-login.component';
import { TimerComponent } from './timer/timer.component';
import { UserRegisterComponent } from './user-register/user-register.component';
import { ConfirmDialogComponent } from './confirm-dialog/confirm-dialog.component';
import { ThemesComponent } from './themes/themes.component';
import { SpotifyPlayerComponent } from "./spotify-player/spotify-player.component";
import { PlannerComponent } from "./planner/planner.component";
import { AmbienceComponent } from "./ambience/ambience.component";
import { AuthService } from './auth.service';
import { GoldStreakService } from './gold-streak.service';
import { interval } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { of, filter, Subscription } from 'rxjs';

@Component({
  standalone: true,
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  imports: [
    CommonModule,
    HeaderComponent,
    TimerComponent,
    AmbienceComponent,
    UserRegisterComponent,
    UserLoginComponent,
    PlannerComponent,
    ConfirmDialogComponent,
    RouterOutlet,
    RouterLink,
    ThemesComponent,
    SpotifyPlayerComponent,
  ]
})
export class AppComponent implements OnInit {

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
  {
    path: 'assets/images/durarara1.jpg',
    name: 'Durarara Default',
    premium: false,
    unlocked: true,
    goldCost: 0,
    isAnimated: false
  },
  {
    path: 'assets/images/pfp/cat.jpg',
    name: 'Anime Style 1',
    premium: true,
    unlocked: false,
    goldCost: 50,
    isAnimated: false
  },
  {
    path: 'assets/images/pfp/aestheticoon.gif',
    name: 'aesthetic moon',
    premium: true,
    unlocked: false,
    goldCost: 500,
    isAnimated: true
  },
  {
    path: 'assets/images/pfp/sailormoon.gif',
    name: 'sailor moon',
    premium: true,
    unlocked: false,
    goldCost: 800,
    isAnimated: true
  },

  {
    path: 'assets/images/pfp/cute.gif',
    name: 'cute pinky',
    premium: false,
    unlocked: true,
    goldCost: 0,
    isAnimated: true
  },

  {
    path: 'assets/images/pfp/flcl.jpg',
    name: 'flcl',
    premium: true,
    unlocked: false,
    goldCost: 125,
    isAnimated: false
  },

  {
    path: 'assets/images/pfp/cat2.jpg',
    name: 'cat two',
    premium: false,
    unlocked: true,
    goldCost: 0,
    isAnimated: false
  },

  {
    path: 'assets/images/pfp/cat3.jpg',
    name: 'cat three',
    premium: true,
    unlocked: false,
    goldCost: 20,
    isAnimated: false
  },

  {
    path: 'assets/images/pfp/gurrenl.jpg',
    name: 'gurren lagan',
    premium: false,
    unlocked: true,
    goldCost: 0,
    isAnimated: false
  },

  {
    path: 'assets/images/pfp/gurrenl2.jpg',
    name: 'gurren lagan two',
    premium: true,
    unlocked: false,
    goldCost: 35,
    isAnimated: false
  },

  {
    path: 'assets/images/pfp/ken.png.jpeg',
    name: 'ken',
    premium: false,
    unlocked: true,
    goldCost: 0,
    isAnimated: false
  },

  {
    path: 'assets/images/pfp/straydogs.jpg',
    name: 'stray',
    premium: false,
    unlocked: true,
    goldCost: 0,
    isAnimated: false
  },

  {
    path: 'assets/images/pfp/poutinggirl.jpg',
    name: 'pouting girl',
    premium: false,
    unlocked: true,
    goldCost: 0,
    isAnimated: false
  },
];
  selectedTheme: string = 'assets/images/themes/city.jpg'; // Default to video
  isVideoBackground: boolean = true; // Assume video by default
  isRegisterMode = false;
  isLoginMode = false;
  showSpotifyPlayer: boolean = false;
  showAmbiencePanel: boolean = false;
  isNavHidden: boolean = false;
  
  // Gold and streak properties
  goldBalance: number = 0;
  currentStreak: number = 0;
  longestStreak: number = 0;

  // For tracking subscriptions
  private routerSubscription: Subscription | null = null;
  private customEventListenerAdded: boolean = false;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object, 
    private router: Router, 
    public authService: AuthService,
    private goldStreakService: GoldStreakService
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      // Setup theme
      this.setupTheme();
      
      // Load nav visibility preference
      this.loadNavVisibility();


      // set up the pfp correctly  
      this.setupPfp();
      
      // Load user data if logged in
      if (this.authService.isLoggedIn()) {
        this.refreshUserData();
      }
      
      // Setup custom event listener for refresh
      this.setupCustomEventListener();
      
      // Listen for router navigation end events to refresh data
      this.setupRouterListener();
    }
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
      this.selectedTheme = 'assets/videos/yumenikki.mp4';
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

  toggleNavVisibility(): void {
    this.isNavHidden = !this.isNavHidden;
    
    // Optionally save the preference in localStorage so it persists between sessions
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('navHidden', this.isNavHidden.toString());
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
    }
  }
  // Clean up on destroy
  ngOnDestroy(): void {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
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

  // Handle PFP selection
  changePfp(pfp: any): void {
    if (pfp.premium && !pfp.unlocked) {
      // Handle premium PFP purchase
      this.purchasePfp(pfp);
    } else if (pfp.unlocked) {
      // Change to unlocked PFP
      this.selectedPfp = pfp.path;
      
      // Save to localStorage
      if (isPlatformBrowser(this.platformId)) {
        localStorage.setItem('selectedPfp', pfp.path);
      }
      
      // Close selector after selection
      this.closePfpSelector();
      
      console.log('Changed PFP to:', pfp.name);
    }
  }

  // Handle PFP purchase
  purchasePfp(pfp: any): void {
    if (this.goldBalance >= pfp.goldCost) {
      // Confirm purchase (you might want to add a confirmation dialog)
      const confirmed = confirm(`Purchase "${pfp.name}" for ${pfp.goldCost} gold?`);
      
      if (confirmed) {
        // Deduct gold and unlock PFP
        this.goldBalance -= pfp.goldCost;
        pfp.unlocked = true;
        
        // TODO: Send purchase request to backend
        // this.goldStreakService.purchasePfp(pfp.path, pfp.goldCost).subscribe(...)
        
        // Automatically select the newly purchased PFP
        this.selectedPfp = pfp.path;
        
        // Save to localStorage
        if (isPlatformBrowser(this.platformId)) {
          localStorage.setItem('selectedPfp', pfp.path);
          // You might also want to save unlocked PFPs list
          const unlockedPfps = this.availablePfps
            .filter(p => p.unlocked)
            .map(p => p.path);
          localStorage.setItem('unlockedPfps', JSON.stringify(unlockedPfps));
        }
        
        this.closePfpSelector();
        
        console.log(`Purchased and equipped ${pfp.name} for ${pfp.goldCost} gold`);
      }
    } else {
      alert(`Not enough gold! You need ${pfp.goldCost} gold but only have ${this.goldBalance}.`);
    }
  }

  // Load PFP preferences (add this to your ngOnInit or setupTheme method)
  private setupPfp(): void {
    const savedPfp = localStorage.getItem('selectedPfp');
    if (savedPfp) {
      this.selectedPfp = savedPfp;
    }
    
    // Load unlocked PFPs
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

}





