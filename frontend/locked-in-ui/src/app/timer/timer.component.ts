import { Component, Inject, PLATFORM_ID, OnInit, OnDestroy, Renderer2 } from '@angular/core';
import { isPlatformBrowser, NgIf, NgFor, NgClass } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Subscription, catchError, of } from 'rxjs';

import { GoldStreakService } from '../gold-streak.service';
import { AuthService } from '../auth.service';
import { HeartService } from '../heart.service';
import { PremiumService } from '../premium.service';
import { TutorialService, TutorialStep } from '../tutorial-modal/tutorial.service';
import { TutorialModalComponent } from '../tutorial-modal/tutorial-modal.component';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-timer',
  standalone: true,
  templateUrl: './timer.component.html',
  styleUrls: ['./timer.component.css'],
  imports: [
    NgClass,
    NgIf,
    NgFor,
    FormsModule,
    TutorialModalComponent
  ]
})
export class TimerComponent implements OnInit, OnDestroy {
  // Presets: [label, work minutes, short break, long break]
  readonly presets = [
    { label: '25m', minutes: 25, shortBreak: 5,  longBreak: 30 },
    { label: '45m', minutes: 45, shortBreak: 10, longBreak: 35 },
    { label: '1h',  minutes: 60, shortBreak: 15, longBreak: 45 },
  ] as const;
  selectedPresetIndex: number = 0;

  minutes: number = 25;
  seconds: number = 0;
  hours: number = 0;

  // Break state
  isBreakMode: boolean = false;
  isLongBreak: boolean = false;
  isScheduleBreak: boolean = false; // break launched from schedule block (not pomodoro cycle)
  breakMinutes: number = 0;
  breakSeconds: number = 0;
  pomodoroSetPosition: number = 0; // 0–3; increments after each session, resets after long break
  private pendingBreakMinutes: number = 0;
  private breakIntervalId: any;

  // Deep work mode (launched from schedule)
  deepWorkMode: boolean = false;
  deepWorkPomodorosRemaining: number = 0;
  deepWorkTotal: number = 0;

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

  // Subject tagging (premium)
  isPremium: boolean = false;
  selectedSubject: string = '';
  readonly subjectPresets = ['Maths', 'Science', 'History', 'English', 'Coding', 'Other'];
  
  // Achievement unlock popup
  newlyUnlockedAchievements: string[] = [];
  showAchievementPopup = false;
  private achievementDismissTimer: any = null;

  // Day playlist (Start Day flow from schedule)
  nextDayBlock: { type: string; title: string; startMinute: number; endMinute: number } | null = null;
  nextDayCountdown = 0;
  private nextDayTimerId: any = null;

  private audio: HTMLAudioElement | null = null;
  private completeAudio: HTMLAudioElement | null = null;
  private subscriptions: Subscription[] = [];
  private wakeLock: WakeLockSentinel | null = null;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private route: ActivatedRoute,
    private http: HttpClient,
    private goldStreakService: GoldStreakService,
    public authService: AuthService,
    public heartService: HeartService,
    private premiumService: PremiumService,
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
      if (params['break'] === 'true') {
        const duration = parseInt(params['duration'] ?? '5', 10);
        this.isScheduleBreak = true;
        this.startBreak(duration);
      }

      const duration = params['duration'];
      if (duration && params['break'] !== 'true') {
        this.setDuration(+duration);
        this.startTimer();
      }

      if (params['deepWork'] === 'true') {
        const pomodoros = parseInt(params['pomodoros'] ?? '1', 10);
        const preset    = parseInt(params['preset']    ?? '0', 10);
        this.deepWorkMode = true;
        this.deepWorkTotal = pomodoros;
        this.deepWorkPomodorosRemaining = pomodoros;
        this.selectedPresetIndex = preset < this.presets.length ? preset : 0;
        this.setDuration(this.presets[this.selectedPresetIndex].minutes);
        this.startTimer();
      }
    });
    this.subscriptions.push(routeSub);

    // Get initial gold balance, streak, and premium status if user is logged in
    if (this.authService.isLoggedIn()) {
      this.loadUserStats();
      const premSub = this.premiumService.getStatus().subscribe({
        next: (s) => { this.isPremium = s.isPremium; },
        error: () => {}
      });
      this.subscriptions.push(premSub);
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());

    if (this.intervalId) clearInterval(this.intervalId);
    if (this.breakIntervalId) clearInterval(this.breakIntervalId);
    if (this.nextDayTimerId) clearInterval(this.nextDayTimerId);

    if (isPlatformBrowser(this.platformId)) {
      this.renderer.removeClass(document.body, 'timer-fullscreen-active');
      document.removeEventListener('visibilitychange', this.onVisibilityChange);
    }

    this.releaseWakeLock();
  }

  private async acquireWakeLock(): Promise<void> {
    if (!isPlatformBrowser(this.platformId) || !('wakeLock' in navigator)) return;
    try {
      this.wakeLock = await (navigator as any).wakeLock.request('screen');
      document.addEventListener('visibilitychange', this.onVisibilityChange);
    } catch {}
  }

  private releaseWakeLock(): void {
    if (this.wakeLock) {
      this.wakeLock.release().catch(() => {});
      this.wakeLock = null;
    }
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
  }

  private onVisibilityChange = (): void => {
    if (document.visibilityState === 'visible' && this.isRunning) {
      this.acquireWakeLock();
    }
  };

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

  selectPreset(index: number): void {
    this.selectedPresetIndex = index;
    this.setDuration(this.presets[index].minutes);
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
      this.acquireWakeLock();

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
    if (this.selectedSubject.trim() && this.goldEarned > 0) {
      this.goldStreakService.tagLatestSession(this.selectedSubject.trim())
        .pipe(catchError(() => of(null)))
        .subscribe();
    }
    this.showCompletionScreen = false;
    this.selectedSubject = '';

    if (this.pendingBreakMinutes > 0) {
      this.startBreak(this.pendingBreakMinutes);
      this.pendingBreakMinutes = 0;
    } else {
      this.resetTimer();
      this.checkDayPlaylist();
    }
  }

  private scheduleAutoAdvance(): void {
    if (this.pendingBreakMinutes > 0 && !this.deepWorkMode) {
      setTimeout(() => { if (this.showCompletionScreen) this.dismissCompletion(); }, 3000);
    }
  }

  // ── Day playlist (Start Day flow) ────────────────────────────────────────

  private checkDayPlaylist(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const raw = sessionStorage.getItem('lockedin_day_playlist');
    if (!raw) return;
    try {
      const playlist = JSON.parse(raw) as { type: string; title: string; startMinute: number; endMinute: number }[];
      if (!playlist.length) { sessionStorage.removeItem('lockedin_day_playlist'); return; }
      const [next, ...rest] = playlist;
      sessionStorage.setItem('lockedin_day_playlist', JSON.stringify(rest));
      this.nextDayBlock = next;
      this.nextDayCountdown = 0; // no auto-advance — user must confirm
    } catch { sessionStorage.removeItem('lockedin_day_playlist'); }
  }

  launchNextDayBlock(): void {
    clearInterval(this.nextDayTimerId);
    const block = this.nextDayBlock;
    this.nextDayBlock = null;
    if (!block) return;
    if (block.type === 'DEEP_WORK') {
      const dur = block.endMinute - block.startMinute;
      const pomos = Math.max(1, Math.floor((dur + 5) / 30));
      this.deepWorkMode = true;
      this.deepWorkTotal = pomos;
      this.deepWorkPomodorosRemaining = pomos;
      this.selectedPresetIndex = 0;
      this.setDuration(this.presets[0].minutes);
      this.startTimer();
    } else if (block.type === 'BREAK') {
      this.isScheduleBreak = true;
      this.startBreak(block.endMinute - block.startMinute);
    } else {
      this.setDuration(block.endMinute - block.startMinute);
      this.startTimer();
    }
  }

  skipNextDayBlock(): void {
    clearInterval(this.nextDayTimerId);
    this.nextDayBlock = null;
    sessionStorage.removeItem('lockedin_day_playlist');
  }

  startBreak(minutes: number): void {
    this.isBreakMode = true;
    this.isExpanded = true;
    this.breakMinutes = minutes;
    this.breakSeconds = 0;
    document.body.classList.add('timer-running');
    this.acquireWakeLock();

    if (isPlatformBrowser(this.platformId)) {
      ['.pixel-clock-container', '.stats-display', '.profile-display', '.auth-buttons', '.retro-nav-container']
        .forEach(sel => document.querySelectorAll(sel).forEach(el => (el as HTMLElement).style.display = 'none'));
    }

    this.breakIntervalId = setInterval(() => this.breakCountDown(), 1000);
  }

  private breakCountDown(): void {
    this.breakSeconds--;
    if (this.breakSeconds < 0) {
      if (this.breakMinutes > 0) {
        this.breakMinutes--;
        this.breakSeconds = 59;
      } else {
        clearInterval(this.breakIntervalId);
        this.completeAudio?.play().catch(() => {});
        this.endBreak();
      }
    }
  }

  endBreak(): void {
    this.isBreakMode = false;
    clearInterval(this.breakIntervalId);

    const preset = this.presets[this.selectedPresetIndex];
    this.hours = 0;
    this.minutes = preset.minutes;
    this.seconds = 0;
    this.initialMinutes = preset.minutes;
    this.timerStartTime = null;
    this.timerEndTime = null;
    this.pauseStartTime = null;
    this.pauseCount = 0;
    this.totalPauseTime = 0;
    this.goldEarned = 0;
    this.streakUpdated = false;
    this.completedPomodoros = 0;
    this.pausedMidPomodoro = false;

    // Schedule break: collapse and advance the day playlist, don't restart pomodoro cycle
    if (this.isScheduleBreak) {
      this.isScheduleBreak = false;
      this.isExpanded = false;
      document.body.classList.remove('timer-running');
      this.releaseWakeLock();
      if (isPlatformBrowser(this.platformId)) {
        ['.pixel-clock-container', '.stats-display', '.profile-display', '.auth-buttons', '.retro-nav-container']
          .forEach(sel => document.querySelectorAll(sel).forEach(el => (el as HTMLElement).style.display = ''));
      }
      this.checkDayPlaylist();
      return;
    }

    const wasLongBreak = this.isLongBreak;
    this.isLongBreak = false;

    if (this.deepWorkMode && this.deepWorkPomodorosRemaining > 0) {
      this.startTimer();
    } else if (!wasLongBreak) {
      // Short break ended → auto-start next session in the cycle
      this.startTimer();
    } else {
      // Long break ended (full 4-session cycle complete) → collapse
      this.isExpanded = false;
      document.body.classList.remove('timer-running');
      this.releaseWakeLock();
      if (isPlatformBrowser(this.platformId)) {
        ['.pixel-clock-container', '.stats-display', '.profile-display', '.auth-buttons', '.retro-nav-container']
          .forEach(sel => document.querySelectorAll(sel).forEach(el => (el as HTMLElement).style.display = ''));
      }
    }
  }

  skipBreak(): void {
    clearInterval(this.breakIntervalId);
    this.endBreak();
  }

  resetTimer(): void {
    this.isRunning = false;
    this.isExpanded = false;
    this.showCompletionScreen = false;
    this.isBreakMode = false;
    this.pendingBreakMinutes = 0;
    this.pomodoroSetPosition = 0;
    this.deepWorkMode = false;
    this.deepWorkPomodorosRemaining = 0;
    this.deepWorkTotal = 0;
    document.body.classList.remove('timer-running');
    this.releaseWakeLock();

    if (this.intervalId) clearInterval(this.intervalId);
    if (this.breakIntervalId) clearInterval(this.breakIntervalId);

    const preset = this.presets[this.selectedPresetIndex];
    this.hours = 0;
    this.minutes = preset.minutes;
    this.seconds = 0;
    this.initialMinutes = preset.minutes;
    
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
    if (!this.timerStartTime || !this.timerEndTime) return;

    // Advance the pomodoro set position and calculate break
    this.pomodoroSetPosition++;
    const preset = this.presets[this.selectedPresetIndex];
    this.isLongBreak = this.pomodoroSetPosition >= 4;
    this.pendingBreakMinutes = this.isLongBreak ? preset.longBreak : preset.shortBreak;
    if (this.pomodoroSetPosition >= 4) this.pomodoroSetPosition = 0;

    // Deep work: decrement counter; no break after the final session
    if (this.deepWorkMode) {
      this.deepWorkPomodorosRemaining--;
      if (this.deepWorkPomodorosRemaining <= 0) {
        this.pendingBreakMinutes = 0;
        this.deepWorkMode = false;
      }
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
      const rewardSub = this.goldStreakService.rewardPomodoro(totalPomodorosCompleted, {
        subject: this.selectedSubject || undefined,
        startTime: this.timerStartTime?.toISOString(),
        endTime: this.timerEndTime?.toISOString(),
        durationMinutes,
        pauseCount: this.pauseCount
      }).pipe(catchError((error: HttpErrorResponse) => {
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
              if (response.newAchievements?.length) {
                this.showAchievementUnlocks(response.newAchievements);
              }
            }
            this.completeAudio?.play().catch(() => {});
            this.showCompletionScreen = true;
            this.scheduleAutoAdvance();
          }
        });
      this.subscriptions.push(rewardSub);
    } else {
      this.goldEarned = 0;
      this.showCompletionScreen = true;
      this.scheduleAutoAdvance();
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

  showAchievementUnlocks(names: string[]): void {
    this.newlyUnlockedAchievements = names;
    this.showAchievementPopup = true;
    clearTimeout(this.achievementDismissTimer);
    this.achievementDismissTimer = setTimeout(() => this.dismissAchievementPopup(), 5000);
  }

  dismissAchievementPopup(): void {
    this.showAchievementPopup = false;
    this.newlyUnlockedAchievements = [];
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





