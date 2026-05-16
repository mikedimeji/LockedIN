import { Component, Inject, PLATFORM_ID, OnInit, OnDestroy, Renderer2 } from '@angular/core';
import { isPlatformBrowser, NgIf, NgClass } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Subscription, catchError, of } from 'rxjs';

import { GoldStreakService } from '../gold-streak.service';
import { AuthService } from '../auth.service';
import { HeartService } from '../heart.service';
import { TutorialService, TutorialStep } from '../tutorial-modal/tutorial.service';
import { TutorialModalComponent } from '../tutorial-modal/tutorial-modal.component';

@Component({
  selector: 'app-timer',
  standalone: true,
  templateUrl: './timer.component.html',
  styleUrls: ['./timer.component.css'],
  imports: [
    NgClass,
    NgIf,
    TutorialModalComponent
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
  timerOpacity: 0 | 1 | 2 = 0; // 0 = opaque, 1 = glass, 2 = ghost
  
  // Gold and streak tracking
  initialMinutes: number = 25;
  pauseCount: number = 0;
  timerStartTime: Date | null = null;
  timerEndTime: Date | null = null;
  totalPauseTime: number = 0;
  pauseStartTime: Date | null = null;
  goldEarned: number = 0;
  previousGold: number = 0;
  currentStreak: number = 0;
  longestStreak: number = 0;
  showGoldMessage: boolean = false;
  streakUpdated: boolean = false;

  // Completion screen
  showCompletionScreen = false;
  sessionDurationMinutes = 0;
  
  // Pause functionality
  completedPomodoros: number = 0;
  pausedMidPomodoro: boolean = false;
  showPauseTooltip: boolean = false;
  showPauseConfirm: boolean = false;

  // Hearts
  heartPoints: number = 2;
  showHeartWarning: boolean = false;
  heartBroken: boolean = false;
  heartGone: boolean = false;
  private pendingHeartAction: 'pause' | 'reset' | null = null;
  
  // Tutorial
  showTutorial: boolean = false;
  tutorialSteps: TutorialStep[] = [];
  
  private audio: HTMLAudioElement | null = null;
  private completeAudio: HTMLAudioElement | null = null;
  private subscriptions: Subscription[] = [];

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private route: ActivatedRoute,
    private http: HttpClient,
    private goldStreakService: GoldStreakService,
    public authService: AuthService,
    public heartService: HeartService,
    private renderer: Renderer2,
    private tutorialService: TutorialService
  ) {
    if (isPlatformBrowser(this.platformId)) {
      this.audio = new Audio('/assets/sounds/soundbit.wav');
      this.completeAudio = new Audio('/assets/sounds/complete2.mp3');
    }
  }

  ngOnInit(): void {
    // Check if user needs tutorial
    if (this.authService.isLoggedIn() && !this.tutorialService.hasSeenTutorial('timer')) {
      this.tutorialSteps = this.tutorialService.getTutorialSteps('timer');
      this.showTutorial = true;
    }

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
    this.subscriptions.forEach(sub => sub.unsubscribe());
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    if (isPlatformBrowser(this.platformId)) {
      this.renderer.removeClass(document.body, 'timer-fullscreen-active');
    }
  }

  onTutorialComplete(dontShowAgain: boolean): void {
    if (dontShowAgain) {
      this.tutorialService.markTutorialAsSeen('timer');
    }
    this.showTutorial = false;
  }

  onTutorialSkip(): void {
    this.showTutorial = false;
  }

  loadUserStats(): void {
    const goldSub = this.goldStreakService.getGoldBalance().subscribe({
      next: (response) => { this.previousGold = response.currentGold; },
      error: () => {}
    });
    this.subscriptions.push(goldSub);

    const streakSub = this.goldStreakService.getCurrentStreak().subscribe({
      next: (response) => {
        this.currentStreak = response.currentStreak;
        this.longestStreak = response.longestStreak;
      },
      error: () => {}
    });
    this.subscriptions.push(streakSub);

    // getHearts() updates the shared BehaviorSubject via tap — no local assignment needed
    const heartSub = this.heartService.getHearts().subscribe({ error: () => {} });
    this.subscriptions.push(heartSub);
  }

  setDuration(durationInMinutes: number): void {
    this.hours = Math.floor(durationInMinutes / 60);
    this.minutes = durationInMinutes % 60;
    this.seconds = 0;
    this.initialMinutes = durationInMinutes;
  }

  startTimer(): void {
    if (!this.isRunning) {
      if (this.pauseStartTime) {
        const pauseEndTime = new Date();
        this.totalPauseTime += pauseEndTime.getTime() - this.pauseStartTime.getTime();
        this.pauseStartTime = null;
      } else {
        this.timerStartTime = new Date();
        this.pauseCount = 0;
        this.totalPauseTime = 0;
        this.completedPomodoros = 0;
        this.pausedMidPomodoro = false;
      }
      
      this.isRunning = true;
      this.isExpanded = true;
      document.body.classList.add('timer-running');

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
      if (this.heartService.currentHeartPoints === 0) {
        this.executePause();
      } else {
        this.pendingHeartAction = 'pause';
        this.showHeartWarning = true;
      }
    } else {
      this.startTimer();
    }
  }

  openConfirmDialog(): void {
    if (this.isRunning || this.pauseStartTime) {
      if (this.heartService.currentHeartPoints === 0) {
        this.resetTimer();
      } else {
        this.pendingHeartAction = 'reset';
        this.showHeartWarning = true;
      }
    } else {
      this.resetTimer();
    }
  }

  onHeartWarningConfirm(): void {
    this.showHeartWarning = false;
    const action = this.pendingHeartAction;
    this.pendingHeartAction = null;

    // Optimistic update — switch image immediately via shared service
    const optimisticPoints = Math.max(0, this.heartService.currentHeartPoints - 1);
    this.heartService.setHeartPoints(optimisticPoints);

    if (action === 'pause') this.executePause();
    else this.resetTimer();

    // Sync with backend in background (tap inside breakHeart() corrects value if needed)
    const heartSub = this.heartService.breakHeart().subscribe({
      error: (err) => console.error('breakHeart API failed:', err)
    });
    this.subscriptions.push(heartSub);
  }

  onHeartWarningCancel(): void {
    this.showHeartWarning = false;
    this.pendingHeartAction = null;
  }

  private executePause(): void {
    this.isRunning = false;
    clearInterval(this.intervalId);
    this.pauseCount++;
    this.pauseStartTime = new Date();

    if (this.timerStartTime) {
      const currentDurationMs = new Date().getTime() - this.timerStartTime.getTime() - this.totalPauseTime;
      const currentMinutes = Math.floor(currentDurationMs / (1000 * 60));
      const completedFullPomodoros = Math.floor(currentMinutes / 25);

      if (completedFullPomodoros > 0) {
        this.completedPomodoros += completedFullPomodoros;
        this.totalPauseTime += completedFullPomodoros * 25 * 60 * 1000;
        this.goldEarned = 0;
        this.streakUpdated = false;
        this.showGoldMessage = true;
        setTimeout(() => { this.showGoldMessage = false; }, 3000);
      }

      if (currentMinutes % 25 > 0) this.pausedMidPomodoro = true;
    }
  }

  dismissCompletion(): void {
    this.showCompletionScreen = false;
    this.resetTimer();
  }

  resetTimer(): void {
    this.isRunning = false;
    this.isExpanded = false;
    this.showCompletionScreen = false;
    document.body.classList.remove('timer-running');

    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    
    this.hours = 0;
    this.minutes = 25;
    this.seconds = 0;
    
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
      
      const timer = document.querySelector('.timer') as HTMLElement;
      if (timer) {
        timer.style.background = '';
      }
    }
    
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
      
      if (timeType === 'hours' || timeType === 'minutes') {
        this.initialMinutes = this.hours * 60 + this.minutes;
      }
    }
    event.target.value = this.formatTime(this[timeType]);
  }

  formatTime(time: number): string {
    return time < 10 ? '0' + time : time.toString();
  }

  private handleTimerCompletion(): void {
    if (!this.timerStartTime || !this.timerEndTime) {
      return;
    }

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
      
      const timer = document.querySelector('.timer') as HTMLElement;
      if (timer) {
        timer.style.background = '';
      }
    }

    const totalDurationMs = this.timerEndTime.getTime() - this.timerStartTime.getTime() - this.totalPauseTime;
    const durationMinutes = Math.floor((totalDurationMs + 15000) / (1000 * 60));
    this.sessionDurationMinutes = durationMinutes;
    const totalPomodorosCompleted = Math.floor(durationMinutes / 25) + this.completedPomodoros;

    if (!this.authService.isLoggedIn()) {
      this.goldEarned = 0;
      this.showCompletionScreen = true;
      this.completedPomodoros = 0;
      this.pausedMidPomodoro = false;
      return;
    }

    if (totalPomodorosCompleted > 0) {
      const rewardSub = this.goldStreakService.rewardPomodoro(totalPomodorosCompleted)
        .pipe(catchError((error: HttpErrorResponse) => {
          console.error('Error rewarding pomodoro:', error);
          return of(null);
        }))
        .subscribe({
          next: (response) => {
            if (response) {
              this.goldEarned = response.currentGold - this.previousGold;
              this.previousGold = response.currentGold;
              this.currentStreak = response.currentStreak;
              this.longestStreak = response.longestStreak;
              this.streakUpdated = true;
            }
            this.completeAudio?.play().catch(() => {});
            this.showCompletionScreen = true;
          }
        });
      this.subscriptions.push(rewardSub);
    } else {
      this.goldEarned = 0;
      this.showCompletionScreen = true;
    }

    this.completedPomodoros = 0;
    this.pausedMidPomodoro = false;
  }

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
  
  showTooltip(): void {
    this.showPauseTooltip = true;
  }
  
  hideTooltip(): void {
    this.showPauseTooltip = false;
  }
  
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
  
  cycleOpacity(): void {
    this.timerOpacity = ((this.timerOpacity + 1) % 3) as 0 | 1 | 2;
  }

  handleTimeClick(): void {
    if (this.isRunning) {
      this.showPauseConfirm = true;
    } else if (this.pauseStartTime) {
      this.startTimer();
    }
  }
  
  confirmPause(confirmed: boolean): void {
    this.showPauseConfirm = false;
    
    if (confirmed) {
      this.pauseTimer();
    }
  }
}





