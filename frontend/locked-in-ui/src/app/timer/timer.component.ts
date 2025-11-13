import { Component, Inject, PLATFORM_ID, OnInit, OnDestroy, Renderer2 } from '@angular/core';
import { isPlatformBrowser, NgIf, NgClass } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Subscription, catchError, switchMap, of } from 'rxjs';

import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
import { GoldStreakService } from '../gold-streak.service';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-timer',
  standalone: true,
  templateUrl: './timer.component.html',
  styleUrls: ['./timer.component.css'],
  imports: [
    NgClass,
    NgIf,
  ]
})
export class TimerComponent implements OnInit, OnDestroy {
  minutes: number = 25;
  seconds: number = 0;
  hours: number = 0;
  
  // Timer state tracking
  private intervalId: any;
  isRunning: boolean = false;
  isExpanded: boolean = false;
  
  // Gold and streak tracking
  initialMinutes: number = 25; // Store initial time setting
  pauseCount: number = 0; // Track number of pauses
  timerStartTime: Date | null = null; // When timer was started
  timerEndTime: Date | null = null; // When timer completed
  totalPauseTime: number = 0; // In milliseconds
  pauseStartTime: Date | null = null; // When pause started
  goldEarned: number = 0;
  previousGold: number = 0;
  currentStreak: number = 0;
  longestStreak: number = 0;
  showGoldMessage: boolean = false;
  streakUpdated: boolean = false;
  
  // New properties for improved pause functionality
  completedPomodoros: number = 0;
  pausedMidPomodoro: boolean = false;
  showPauseTooltip: boolean = false;
  showPauseConfirm: boolean = false;
  
  private audio: HTMLAudioElement | null = null;
  private subscriptions: Subscription[] = [];

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    public dialog: MatDialog,
    private route: ActivatedRoute,
    private http: HttpClient,
    private goldStreakService: GoldStreakService,
    private authService: AuthService,
    private renderer: Renderer2 
  ) {
    // Only create the audio object if we're running in the browser
    if (isPlatformBrowser(this.platformId)) {
      this.audio = new Audio('/assets/sounds/soundbit.wav');
    }
  }

  ngOnInit(): void {
    // Handle route parameters
    const routeSub = this.route.queryParams.subscribe(params => {
      const duration = params['duration'];
      if(duration) {
        this.setDuration(+duration);
        this.startTimer();
      }
    });
    this.subscriptions.push(routeSub);

    // Get initial gold balance and streak info if user is logged in
    if (this.authService.isLoggedIn()) {
      this.loadUserStats();
    }
  }

  ngOnDestroy(): void {
    // Clean up all subscriptions
    this.subscriptions.forEach(sub => sub.unsubscribe());
    
    // Clear any timers
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    if (isPlatformBrowser(this.platformId)) {
    this.renderer.removeClass(document.body, 'timer-fullscreen-active');
  }
  }

  loadUserStats(): void {
    // Get initial gold balance
    const goldSub = this.goldStreakService.getGoldBalance().subscribe({
      next: (response) => {
        this.previousGold = response.currentGold;
      },
      error: (error) => {
        console.error('Error loading gold balance:', error);
        
        // Try to refresh token if we get a 403
        if (error.status === 403) {
          this.handleTokenRefresh();
        }
      }
    });
    this.subscriptions.push(goldSub);

    // Get initial streak info
    const streakSub = this.goldStreakService.getCurrentStreak().subscribe({
      next: (response) => {
        this.currentStreak = response.currentStreak;
        this.longestStreak = response.longestStreak;
      },
      error: (error) => {
        console.error('Error loading streak info:', error);
        
        // Try to refresh token if we get a 403
        if (error.status === 403) {
          this.handleTokenRefresh();
        }
      }
    });
    this.subscriptions.push(streakSub);
  }

  handleTokenRefresh(): void {
    const refreshSub = this.authService.refreshAccessToken().subscribe({
      next: (response) => {
        if (response && response.token) {
          // Token refreshed, reload stats
          this.loadUserStats();
        }
      },
      error: (error) => {
        console.error('Error refreshing token:', error);
        // Could redirect to login here if needed
      }
    });
    this.subscriptions.push(refreshSub);
  }

  setDuration(durationInMinutes: number): void {
    this.hours = Math.floor(durationInMinutes / 60);
    this.minutes = durationInMinutes % 60;
    this.seconds = 0;
    this.initialMinutes = durationInMinutes; // Store initial time for gold calculation
  }

  startTimer(): void {
  if (!this.isRunning) {
    // If resuming from pause
    if (this.pauseStartTime) {
      const pauseEndTime = new Date();
      this.totalPauseTime += pauseEndTime.getTime() - this.pauseStartTime.getTime();
      this.pauseStartTime = null;
    } else {
      // Fresh start
      this.timerStartTime = new Date();
      this.pauseCount = 0;
      this.totalPauseTime = 0;
      this.completedPomodoros = 0;
      this.pausedMidPomodoro = false;
    }
    
    this.isRunning = true;
    this.isExpanded = true;

    // HIDE UI ELEMENTS BUT KEEP BACKGROUND
    if (isPlatformBrowser(this.platformId)) {
      const elementsToHide = [
        '.pixel-clock-container',
        '.stats-display', 
        '.profile-display',
        '.auth-buttons',
        '.retro-nav-container'
      ];
      
      elementsToHide.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
          (el as HTMLElement).style.display = 'none';
        });
      });
      
      // Add darker overlay to timer (keeping background visible)
      const timer = document.querySelector('.timer.expanded') as HTMLElement;
      if (timer) {
        timer.style.background = 'rgba(0, 0, 0, 0.8)';
      }
    }

    if (this.audio) {
      this.audio.play().catch(err => console.error('Error playing audio:', err));
    }
    this.intervalId = setInterval(() => {
      this.countDown();
    }, 1000);
  }
}

  pauseTimer(): void {
    if (this.isRunning) {
      this.isRunning = false;
      clearInterval(this.intervalId);
      this.pauseCount++;
      this.pauseStartTime = new Date();
      
      // Check if we're in the middle of a pomodoro (not at a 25-minute boundary)
      if (this.timerStartTime) {
        const currentDurationMs = new Date().getTime() - this.timerStartTime.getTime() - this.totalPauseTime;
        const currentMinutes = Math.floor(currentDurationMs / (1000 * 60));
        const completedFullPomodoros = Math.floor(currentMinutes / 25);
        
        // If we've completed any full pomodoros, save them
        if (completedFullPomodoros > 0) {
          this.completedPomodoros += completedFullPomodoros;
          
          // Reset the timer effective start time to count only the remaining time
          const adjustedTime = completedFullPomodoros * 25 * 60 * 1000; // Time for completed pomodoros
          this.totalPauseTime += adjustedTime; // Add this as "pause" time to offset the timer
          
          // Show a message about saved pomodoros
          this.goldEarned = 0; // Will be calculated later
          this.streakUpdated = false;
          this.showGoldMessage = true;
          setTimeout(() => {
            this.showGoldMessage = false;
          }, 3000);
        }
        
        // If there's a partial pomodoro in progress
        const remainingMinutes = currentMinutes % 25;
        if (remainingMinutes > 0) {
          this.pausedMidPomodoro = true;
        }
      }
    } else {
      this.startTimer();
    }
  }

  openConfirmDialog(): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent);

    const dialogSub = dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.resetTimer();
      }
    });
    this.subscriptions.push(dialogSub);
  }

  resetTimer(): void {
  if (this.isRunning) {
    this.pauseTimer();
  }
  
  // SHOW UI ELEMENTS AGAIN WHEN RESET
  if (isPlatformBrowser(this.platformId)) {
    const elementsToShow = [
      '.pixel-clock-container',
      '.stats-display', 
      '.profile-display',
      '.auth-buttons',
      '.retro-nav-container'
    ];
    
    elementsToShow.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        (el as HTMLElement).style.display = '';
      });
    });
    
    // Reset timer background
    const timer = document.querySelector('.timer') as HTMLElement;
    if (timer) {
      timer.style.background = '';
    }
  }

  this.hours = 0;
  this.minutes = 25;
  this.seconds = 0;
  this.isExpanded = false;  // Collapse the timer back to the original state
  
  // Reset tracking
  this.timerStartTime = null;
  this.timerEndTime = null;
  this.pauseStartTime = null;
  this.pauseCount = 0;
  this.totalPauseTime = 0;
  this.goldEarned = 0;
  this.showGoldMessage = false;
  this.streakUpdated = false;
  this.completedPomodoros = 0;
  this.pausedMidPomodoro = false;
}

  private countDown(): void {
    this.seconds--;
    if (this.seconds < 0) {
      if (this.minutes > 0) {
        this.minutes--;
        this.seconds = 59;
      } else if (this.hours > 0) {
        this.hours--;
        this.minutes = 59;
        this.seconds = 59;
      } else {
        // Timer completed
        this.timerEndTime = new Date();
        this.isRunning = false;
        clearInterval(this.intervalId);
        this.handleTimerCompletion();
      }
    }
  }

  handleInputChange(event: any, timeType: 'hours' | 'minutes' | 'seconds'): void {
    const value = parseInt(event.target.value, 10);
    if (!isNaN(value)) {
      this[timeType] = value;
      
      // Update initialMinutes for gold calculation
      if (timeType === 'hours' || timeType === 'minutes') {
        this.initialMinutes = this.hours * 60 + this.minutes;
      }
    }
    event.target.value = this.formatTime(this[timeType]);
  }

  formatTime(time: number): string {
    return time < 10 ? '0' + time : time.toString();
  }

  // Handle timer completion and reward calculation
  private handleTimerCompletion(): void {
  if (!this.timerStartTime || !this.timerEndTime) {
    return;
  }

  // SHOW UI ELEMENTS AGAIN WHEN TIMER COMPLETES
  if (isPlatformBrowser(this.platformId)) {
    const elementsToShow = [
      '.pixel-clock-container',
      '.stats-display', 
      '.profile-display',
      '.auth-buttons',
      '.retro-nav-container'
    ];
    
    elementsToShow.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        (el as HTMLElement).style.display = '';
      });
    });
    
    // Reset timer background to original
    const timer = document.querySelector('.timer') as HTMLElement;
    if (timer) {
      timer.style.background = '';
    }
  }

  // Check if user is logged in before attempting to award gold
  if (!this.authService.isLoggedIn()) {
    console.log('User not logged in - no gold will be awarded');
    this.showNotLoggedInMessage();
    return;
  }

  // Calculate actual duration in minutes (excluding pauses)
  const totalDurationMs = this.timerEndTime.getTime() - this.timerStartTime.getTime() - this.totalPauseTime;
  const durationMinutes = Math.floor((totalDurationMs + 15000) / (1000 * 60)); // More generous calculation with 15s buffer
  
  // Add any pomodoros we completed and saved during pauses
  const totalPomodorosCompleted = Math.floor(durationMinutes / 25) + this.completedPomodoros;
  
  // If we have any completed pomodoros (either now or from previous pauses)
  if (totalPomodorosCompleted > 0) {
    // Call the service to handle pomodoro reward
    const rewardSub = this.goldStreakService.rewardPomodoro(totalPomodorosCompleted)
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.error('Error rewarding pomodoro:', error);
          
          // If we get a 403, try to refresh the token and retry
          if (error.status === 403) {
            return this.authService.refreshAccessToken().pipe(
              switchMap(refreshResponse => {
                if (refreshResponse && refreshResponse.token) {
                  // Token refreshed, retry the request
                  return this.goldStreakService.rewardPomodoro(totalPomodorosCompleted);
                }
                return of(null);
              }),
              catchError(refreshError => {
                console.error('Failed to refresh token:', refreshError);
                this.showErrorMessage();
                return of(null);
              })
            );
          }
          
          this.showErrorMessage();
          return of(null);
        })
      )
      .subscribe({
        next: (response) => {
          if (response) {
            console.log('Pomodoro reward response:', response);
            
            // Calculate gold earned (current - previous)
            this.goldEarned = response.currentGold - this.previousGold;
            this.previousGold = response.currentGold; // Update for next time
            
            // Update streak info
            this.currentStreak = response.currentStreak;
            this.longestStreak = response.longestStreak;
            this.streakUpdated = true;
            
            // Show notification
            this.showGoldMessage = true;

            setTimeout(() => {
              this.showGoldMessage = false;
              this.resetTimer();
            }, 5000);
          }
        }
      });
      
    this.subscriptions.push(rewardSub);
  } else {
    // Not a valid pomodoro - show message but don't award gold
    this.goldEarned = 0;
    this.streakUpdated = false;
    this.showGoldMessage = true;
    setTimeout(() => {
      this.showGoldMessage = false;
      this.resetTimer();
    }, 5000);
  }
  
  // Reset tracking for next time
  this.completedPomodoros = 0;
  this.pausedMidPomodoro = false;
}

  private showErrorMessage(): void {
    this.goldEarned = 0;
    this.streakUpdated = false;
    this.showGoldMessage = true;
    setTimeout(() => {
      this.showGoldMessage = false;
    }, 5000);
  }

  private showNotLoggedInMessage(): void {
    this.goldEarned = 0;
    this.streakUpdated = false;
    this.showGoldMessage = true;
    setTimeout(() => {
      this.showGoldMessage = false;
    }, 5000);
  }

  // Helper method to get message based on earned rewards
  getGoldMessage(): string {
    let message = '';
    
    if (!this.authService.isLoggedIn()) {
      message = 'Login to earn gold and track your progress!';
    } else if (this.pausedMidPomodoro && this.isRunning === false) {
      message = 'Timer paused! Current pomodoro progress will be reset.';
      if (this.completedPomodoros > 0) {
        message += `<br>${this.completedPomodoros} pomodoro${this.completedPomodoros !== 1 ? 's' : ''} saved.`;
      }
    } else if (this.goldEarned <= 0 && this.completedPomodoros > 0) {
      message = `${this.completedPomodoros} pomodoro${this.completedPomodoros !== 1 ? 's' : ''} completed and saved!`;
    } else if (this.goldEarned <= 0) {
      message = 'No gold earned. Complete at least 25 minutes to earn gold.';
    } else {
      message = `+${this.goldEarned} gold earned!`;
    }
    
    if (this.streakUpdated) {
      message += `<br>Streak: ${this.currentStreak} day${this.currentStreak !== 1 ? 's' : ''}!`;
    }
    
    return message;
  }
  
  // Toggle tooltip visibility
  showTooltip(): void {
    this.showPauseTooltip = true;
  }
  
  hideTooltip(): void {
    this.showPauseTooltip = false;
  }
  
  // Get tooltip message based on timer state
  getTooltipMessage(): string {
    if (!this.timerStartTime && !this.pauseStartTime) {
      return "Pomodoro Timer: Set time and click 'Start'. Complete 25-min sessions to earn gold!";
    } else if (this.isRunning) {
      return "Click to pause";
    } else if (this.pauseStartTime) {
      return "Click to resume";
    }
    return "";
  }
  
  // Handle click on time display to pause/resume
  handleTimeClick(): void {
    // Only handle click if timer is running or paused
    if (this.isRunning) {
      // Show confirmation dialog for pause
      this.showPauseConfirm = true;
    } else if (this.pauseStartTime) {
      // Resume immediately if paused
      this.startTimer();
    }
  }
  
  // Handle pause confirmation
  confirmPause(confirmed: boolean): void {
    this.showPauseConfirm = false;
    
    if (confirmed) {
      this.pauseTimer();
    }
  }
}





