import { Component, OnInit, AfterViewInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import Chart from 'chart.js/auto';
import { StatsService } from './stats.service';
import { PremiumService, PremiumStatus, FocusInsights } from '../premium.service';
import { TutorialService, TutorialStep } from '../tutorial-modal/tutorial.service';
import { TutorialModalComponent } from '../tutorial-modal/tutorial-modal.component';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

interface SummaryStats {
  currentGold: number;
  totalPomodoros: number;
  currentStreak: number;
  longestStreak: number;
  totalHours: number;
}

interface Achievement {
  id: number;
  name: string;
  date: string;
  description: string;
}

@Component({
  selector: 'app-stats',
  standalone: true,
  imports: [CommonModule, TutorialModalComponent],
  templateUrl: './stats.component.html',
  styleUrls: ['./stats.component.css']
})
export class StatsComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('activityChart') activityChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('streakChart')   streakChartRef!:   ElementRef<HTMLCanvasElement>;

  showTutorial = false;
  tutorialSteps: TutorialStep[] = [];

  loading = true;
  unlocking = false;

  summary: SummaryStats = { currentGold: 0, totalPomodoros: 0, currentStreak: 0, longestStreak: 0, totalHours: 0 };
  premium: PremiumStatus = { isPremium: false, goldRequired: 500, currentGold: 0, canAfford: false };
  insights: FocusInsights | null = null;
  achievements: Achievement[] = [];

  weeklyLabels: string[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  weeklyPomodoros: number[] = [0, 0, 0, 0, 0, 0, 0];
  weeklyGold: number[]      = [0, 0, 0, 0, 0, 0, 0];
  streakDates: string[]     = [];
  streakValues: number[]    = [];

  activeTab: 'activity' | 'streak' = 'activity';

  private activityChart: Chart | null = null;
  private streakChart: Chart | null = null;

  constructor(
    private statsService: StatsService,
    private premiumService: PremiumService,
    private tutorialService: TutorialService
  ) { }

  ngOnInit(): void {
    if (!this.tutorialService.hasSeenTutorial('stats')) {
      this.tutorialSteps = this.tutorialService.getTutorialSteps('stats');
      this.showTutorial = true;
    }
    this.loadAll();
  }

  ngAfterViewInit(): void {}

  ngOnDestroy(): void {
    this.destroyCharts();
  }

  onTutorialComplete(dontShowAgain: boolean): void {
    if (dontShowAgain) this.tutorialService.markTutorialAsSeen('stats');
    this.showTutorial = false;
  }

  onTutorialSkip(): void { this.showTutorial = false; }

  loadAll(): void {
    forkJoin({
      summary:  this.statsService.getUserStatsSummary().pipe(catchError(() => of(this.summary))),
      premium:  this.premiumService.getStatus().pipe(catchError(() => of(this.premium))),
      history:  this.statsService.getUserStatsHistory('week').pipe(catchError(() => of({}))),
      streak:   this.statsService.getStreakTimeline().pipe(catchError(() => of({}))),
      achievements: this.statsService.getUserAchievements().pipe(catchError(() => of([]))),
    }).subscribe(results => {
      this.summary      = results.summary;
      this.premium      = results.premium;
      this.achievements = results.achievements || [];

      const h = results.history as any;
      if (h.labels)    this.weeklyLabels    = h.labels;
      if (h.pomodoros) this.weeklyPomodoros = h.pomodoros;
      if (h.gold)      this.weeklyGold      = h.gold;

      const s = results.streak as any;
      if (s.dates)   this.streakDates  = s.dates;
      if (s.streaks) this.streakValues = s.streaks;

      if (this.premium.isPremium) {
        this.statsService.getFocusInsights().pipe(catchError(() => of(null))).subscribe(ins => {
          this.insights = ins;
          this.loading = false;
          setTimeout(() => this.initCharts(), 50);
        });
      } else {
        this.loading = false;
        setTimeout(() => this.initCharts(), 50);
      }
    });
  }

  unlockPremium(): void {
    if (this.unlocking) return;
    this.unlocking = true;
    this.premiumService.unlock().subscribe({
      next: (status) => {
        this.premium = status;
        this.unlocking = false;
        // reload insights now that premium is active
        this.statsService.getFocusInsights().pipe(catchError(() => of(null))).subscribe(ins => {
          this.insights = ins;
        });
      },
      error: () => { this.unlocking = false; }
    });
  }

  setTab(tab: 'activity' | 'streak'): void {
    this.activeTab = tab;
    setTimeout(() => {
      if (tab === 'activity') this.initActivityChart();
      else this.initStreakChart();
    }, 50);
  }

  get focusScoreWidth(): string {
    return `${this.insights?.focusScore ?? 0}%`;
  }

  get focusScoreColor(): string {
    const s = this.insights?.focusScore ?? 0;
    if (s >= 85) return '#4ade80';
    if (s >= 68) return '#5271ff';
    if (s >= 50) return '#facc15';
    if (s >= 30) return '#fb923c';
    return '#f87171';
  }

  totalHoursDisplay(): string {
    return (this.summary.totalHours ?? 0).toFixed(1);
  }

  private initCharts(): void {
    if (this.activeTab === 'activity') this.initActivityChart();
    else this.initStreakChart();
  }

  private destroyCharts(): void {
    this.activityChart?.destroy();
    this.streakChart?.destroy();
    this.activityChart = null;
    this.streakChart = null;
  }

  private initActivityChart(): void {
    if (!this.activityChartRef) return;
    this.activityChart?.destroy();
    const ctx = this.activityChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    this.activityChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: this.weeklyLabels,
        datasets: [
          {
            label: 'Sessions',
            data: this.weeklyPomodoros,
            backgroundColor: 'rgba(82, 113, 255, 0.65)',
            borderColor: 'rgba(82, 113, 255, 0.9)',
            borderWidth: 1,
            borderRadius: 6,
          },
          {
            label: 'Gold',
            data: this.weeklyGold,
            backgroundColor: 'rgba(255, 215, 0, 0.55)',
            borderColor: 'rgba(255, 215, 0, 0.85)',
            borderWidth: 1,
            borderRadius: 6,
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: 'rgba(255,255,255,0.55)', font: { family: 'Courier New', size: 10 }, boxWidth: 12 } },
          tooltip: { mode: 'index', intersect: false }
        },
        scales: {
          y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.06)' }, ticks: { color: 'rgba(255,255,255,0.35)', font: { family: 'Courier New', size: 10 } } },
          x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: 'rgba(255,255,255,0.35)', font: { family: 'Courier New', size: 10 } } }
        }
      }
    });
  }

  private initStreakChart(): void {
    if (!this.streakChartRef) return;
    this.streakChart?.destroy();
    const ctx = this.streakChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const colors = this.streakValues.map(v => v > 0 ? 'rgba(82,113,255,0.85)' : 'rgba(255,255,255,0.12)');

    this.streakChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: this.streakDates,
        datasets: [{
          label: 'Streak',
          data: this.streakValues,
          fill: true,
          backgroundColor: 'rgba(82,113,255,0.08)',
          borderColor: 'rgba(82,113,255,0.7)',
          tension: 0.35,
          pointBackgroundColor: colors,
          pointBorderColor: colors,
          pointRadius: 4,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const v = ctx.raw as number;
                return v === 1 ? '1 day streak' : `${v} days streak`;
              }
            }
          }
        },
        scales: {
          y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.06)' }, ticks: { color: 'rgba(255,255,255,0.35)', font: { family: 'Courier New', size: 10 }, stepSize: 1 } },
          x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: 'rgba(255,255,255,0.35)', font: { family: 'Courier New', size: 10 }, maxRotation: 45 } }
        }
      }
    });
  }
}
