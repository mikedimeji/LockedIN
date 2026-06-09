import { Component, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Chart from 'chart.js/auto';
import { ActivatedRoute, Router } from '@angular/router';
import { StatsService } from './stats.service';
import { PremiumService, PremiumModalService, PremiumStatus, FocusInsights } from '../premium.service';
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
  todaySessions: number;
  todayMinutes: number;
  bestDaySessions: number;
  thisWeekSessions: number;
  lastWeekSessions: number;
  totalXp: number;
  rankName: string;
  rankIndex: number;
  rankXpFloor: number;
  rankXpCeiling: number;
}

interface Achievement {
  id: number;
  name: string;
  date: string;
  description: string;
  goldReward: number;
  type: string;
  locked: boolean;
  progress: number;
  target: number;
}

type Section = 'overview' | 'focus' | 'activity' | 'achievements';

@Component({
  selector: 'app-stats',
  standalone: true,
  imports: [CommonModule, FormsModule, TutorialModalComponent],
  templateUrl: './stats.component.html',
  styleUrls: ['./stats.component.css']
})
export class StatsComponent implements OnInit, OnDestroy {
  @ViewChild('trendChart')    trendChartRef!:    ElementRef<HTMLCanvasElement>;
  @ViewChild('activityChart') activityChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('streakChart')   streakChartRef!:   ElementRef<HTMLCanvasElement>;

  showTutorial = false;
  tutorialSteps: TutorialStep[] = [];

  loading = true;
  activeSection: Section = 'overview';

  summary: SummaryStats = { currentGold: 0, totalPomodoros: 0, currentStreak: 0, longestStreak: 0, totalHours: 0, todaySessions: 0, todayMinutes: 0, bestDaySessions: 0, thisWeekSessions: 0, lastWeekSessions: 0, totalXp: 0, rankName: 'Novice', rankIndex: 1, rankXpFloor: 0, rankXpCeiling: 100 };
  premium: PremiumStatus = { isPremium: false, subscriptionStatus: 'inactive' };
  insights: FocusInsights | null = null;
  achievements: Achievement[] = [];

  weeklyLabels:    string[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  weeklyPomodoros: number[] = [0, 0, 0, 0, 0, 0, 0];
  weeklyGold:      number[] = [0, 0, 0, 0, 0, 0, 0];
  streakDates:     string[] = [];
  streakValues:    number[] = [];

  trendLabels: string[] = [];
  trendValues: number[] = [];

  heatmapGrid:   number[][] = [];
  heatmapMax = 1;
  readonly blockLabels = ['Night', 'Morning', 'Afternoon', 'Evening'];
  readonly dayLabels   = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Premium features
  focusScore = 0;
  subjectBreakdown: { subject: string; total_minutes: number; session_count: number }[] = [];
  studyGoals: { id: number; subject: string; weeklyHoursTarget: number; weeklyHoursCompleted: number }[] = [];
  newGoalSubject = '';
  newGoalHours: number | null = null;
  showGoalForm = false;

  weeklyTotalSessions = 0;
  weeklyTotalGold     = 0;
  bestDay             = '--';
  scoreDashOffset     = 0;
  weeklyGoalProgress  = 0;
  last14DaysList: { date: string; active: boolean }[] = [];

  subPaymentStatus: 'success' | 'cancelled' | 'processing' | null = null;
  private pollInterval: any = null;

  private trendChart:    Chart | null = null;
  private activityChart: Chart | null = null;
  private streakChart:   Chart | null = null;

  readonly RING_CIRCUMFERENCE = 2 * Math.PI * 50;

  get focusScoreColor(): string {
    const s = this.insights?.focusScore ?? 0;
    if (s >= 85) return '#4ade80';
    if (s >= 68) return '#5271ff';
    if (s >= 50) return '#facc15';
    if (s >= 30) return '#fb923c';
    return '#f87171';
  }

  constructor(
    private statsService: StatsService,
    private premiumService: PremiumService,
    private premiumModal: PremiumModalService,
    private tutorialService: TutorialService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  openUpgrade(): void { this.premiumModal.open(); }

  ngOnInit(): void {
    if (!this.tutorialService.hasSeenTutorial('stats')) {
      this.tutorialSteps = this.tutorialService.getTutorialSteps('stats');
      this.showTutorial = true;
    }

    this.route.queryParams.subscribe(params => {
      if (params['sub'] === 'success') {
        this.subPaymentStatus = 'processing';
        this.router.navigate([], { replaceUrl: true, queryParams: {} });
        this.pollForPremium();
      } else if (params['sub'] === 'cancel') {
        this.subPaymentStatus = 'cancelled';
        this.router.navigate([], { replaceUrl: true, queryParams: {} });
        setTimeout(() => { this.subPaymentStatus = null; }, 5000);
      }
    });

    this.loadAll();
  }

  private pollForPremium(): void {
    let attempts = 0;
    this.pollInterval = setInterval(() => {
      this.premiumService.getStatus().subscribe(s => {
        attempts++;
        if (s.isPremium) {
          clearInterval(this.pollInterval);
          this.premium = s;
          this.subPaymentStatus = 'success';
          setTimeout(() => { this.subPaymentStatus = null; }, 5000);
        } else if (attempts >= 12) {
          clearInterval(this.pollInterval);
          this.subPaymentStatus = 'success'; // show success anyway, webhook may still be processing
          setTimeout(() => { this.subPaymentStatus = null; }, 8000);
        }
      });
    }, 1500);
  }

  ngOnDestroy(): void {
    clearInterval(this.pollInterval);
    this.trendChart?.destroy();
    this.activityChart?.destroy();
    this.streakChart?.destroy();
  }

  onTutorialComplete(dontShowAgain: boolean): void {
    if (dontShowAgain) this.tutorialService.markTutorialAsSeen('stats');
    this.showTutorial = false;
  }
  onTutorialSkip(): void { this.showTutorial = false; }

  setSection(s: Section): void {
    this.activeSection = s;
    if (s === 'activity' && this.premium.isPremium) {
      setTimeout(() => {
        this.initActivityChart();
        this.initStreakChart();
      }, 150);
    } else if (s === 'overview') {
      setTimeout(() => this.initTrendChart(), 50);
    }
  }

  loadAll(): void {
    // Sync achievements first (grants anything earned from historical/seeded data),
    // then fetch all stats. Errors here are non-fatal.
    this.statsService.syncAchievements().pipe(catchError(() => of(null))).subscribe(() => {
      this.fetchAll();
    });
  }

  private fetchAll(): void {
    forkJoin({
      summary:      this.statsService.getUserStatsSummary().pipe(catchError(() => of(this.summary))),
      premium:      this.premiumService.getStatus().pipe(catchError(() => of(this.premium))),
      history:      this.statsService.getUserStatsHistory('week').pipe(catchError(() => of({}))),
      streak:       this.statsService.getStreakTimeline().pipe(catchError(() => of({}))),
      achievements: this.statsService.getUserAchievements().pipe(catchError(() => of([]))),
      trend:        this.statsService.getTrend(28).pipe(catchError(() => of({ labels: [], values: [] }))),
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

      const t = results.trend as any;
      if (t.labels) this.trendLabels = t.labels;
      if (t.values) this.trendValues = t.values;

      this.computeWeeklyStats();
      this.computeStreakCalendar();

      if (this.premium.isPremium) {
        forkJoin({
          insights:  this.statsService.getFocusInsights().pipe(catchError(() => of(null))),
          heatmap:   this.statsService.getHeatmap().pipe(catchError(() => of({ grid: [] }))),
          fscore:    this.statsService.getFocusScore().pipe(catchError(() => of({ score: 0 }))),
          subjects:  this.statsService.getSubjectBreakdown().pipe(catchError(() => of([]))),
          goals:     this.statsService.getStudyGoals().pipe(catchError(() => of([]))),
        }).subscribe(pr => {
          this.insights = pr.insights;
          this.computeInsightStats();
          this.focusScore = (pr.fscore as any)?.score ?? 0;
          this.subjectBreakdown = (pr.subjects as any[]) ?? [];
          this.studyGoals = (pr.goals as any[]) ?? [];
          const hm = pr.heatmap as any;
          if (hm.grid && hm.grid.length) {
            this.heatmapGrid = hm.grid;
            let max = 1;
            for (const row of this.heatmapGrid) {
              for (const v of row) { if (v > max) max = v; }
            }
            this.heatmapMax = max;
          }
          this.loading = false;
          setTimeout(() => this.initTrendChart(), 300);
        });
      } else {
        this.loading = false;
        setTimeout(() => this.initTrendChart(), 300);
      }
    });
  }

  private computeWeeklyStats(): void {
    this.weeklyTotalSessions = this.weeklyPomodoros.reduce((a, b) => a + b, 0);
    this.weeklyTotalGold     = this.weeklyGold.reduce((a, b) => a + b, 0);
    const max = Math.max(...this.weeklyPomodoros);
    this.bestDay = max === 0 ? '--' : (this.weeklyLabels[this.weeklyPomodoros.indexOf(max)] ?? '--');
  }

  private computeStreakCalendar(): void {
    if (this.streakDates.length === 0) {
      this.last14DaysList = Array.from({ length: 14 }, () => ({ date: '', active: false }));
      return;
    }
    const len = this.streakDates.length;
    const start = Math.max(0, len - 14);
    this.last14DaysList = this.streakDates.slice(start).map((d, i) => ({
      date: d,
      active: (this.streakValues[start + i] ?? 0) > 0
    }));
  }

  private computeInsightStats(): void {
    const score = this.insights?.focusScore ?? 0;
    this.scoreDashOffset  = this.RING_CIRCUMFERENCE * (1 - score / 100);
    const goal = this.insights?.weeklySessionGoal ?? 0;
    this.weeklyGoalProgress = goal ? Math.min(100, Math.round(this.weeklyTotalSessions / goal * 100)) : 0;
  }

  totalHoursDisplay(): string {
    return (this.summary.totalHours ?? 0).toFixed(1);
  }

  addGoal(): void {
    if (!this.newGoalSubject.trim() || !this.newGoalHours || this.newGoalHours <= 0) return;
    this.statsService.createStudyGoal(this.newGoalSubject.trim(), this.newGoalHours).subscribe({
      next: (goal) => {
        this.studyGoals = [...this.studyGoals.filter(g => g.subject.toLowerCase() !== goal.subject.toLowerCase()), goal];
        this.newGoalSubject = '';
        this.newGoalHours = null;
        this.showGoalForm = false;
      },
      error: () => {}
    });
  }

  deleteGoal(id: number): void {
    this.statsService.deleteStudyGoal(id).subscribe({
      next: () => { this.studyGoals = this.studyGoals.filter(g => g.id !== id); },
      error: () => {}
    });
  }

  goalProgress(goal: { weeklyHoursCompleted: number; weeklyHoursTarget: number }): number {
    if (!goal.weeklyHoursTarget) return 0;
    return Math.min(100, Math.round((goal.weeklyHoursCompleted / goal.weeklyHoursTarget) * 100));
  }

  subjectMinutesToDisplay(minutes: number): string {
    if (minutes < 60) return `${minutes}m`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }

  scoreColor(score: number): string {
    if (score >= 85) return '#4ade80';
    if (score >= 68) return '#5271ff';
    if (score >= 50) return '#facc15';
    if (score >= 30) return '#fb923c';
    return '#f87171';
  }

  scoreDashOffsetFor(score: number): number {
    return this.RING_CIRCUMFERENCE * (1 - score / 100);
  }

  get rankProgressPct(): number {
    const floor = this.summary.rankXpFloor;
    const ceil  = this.summary.rankXpCeiling;
    if (ceil === floor) return 100;
    return Math.min(100, Math.round((this.summary.totalXp - floor) / (ceil - floor) * 100));
  }

  get rankColor(): string {
    const i = this.summary.rankIndex;
    if (i <= 3)  return 'rgba(180,140,100,0.9)';   // bronze
    if (i <= 6)  return 'rgba(130,160,255,0.9)';   // blue/silver
    if (i <= 9)  return '#ffd700';                  // gold
    if (i === 10) return '#c084fc';                 // myth — purple
    return '#ff9500';                               // god — orange glow
  }

  get xpToNextRank(): number {
    return Math.max(0, this.summary.rankXpCeiling - this.summary.totalXp);
  }

  get unlockedAchievements(): Achievement[] {
    return this.achievements.filter(a => !a.locked);
  }

  get lockedAchievements(): Achievement[] {
    return this.achievements.filter(a => a.locked);
  }

  get weekDiff(): number {
    return (this.summary.thisWeekSessions ?? 0) - (this.summary.lastWeekSessions ?? 0);
  }

  get weekDiffLabel(): string {
    const d = this.weekDiff;
    if (d === 0) return 'same as last week';
    return `${d > 0 ? '+' : ''}${d} vs last week`;
  }

  todayTimeDisplay(): string {
    const m = this.summary.todayMinutes ?? 0;
    if (m === 0) return '0m';
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    const rem = m % 60;
    return rem > 0 ? `${h}h ${rem}m` : `${h}h`;
  }

  achProgressPct(a: Achievement): number {
    return a.target > 0 ? Math.min(100, Math.round((a.progress / a.target) * 100)) : 0;
  }

  get subjectMaxMinutes(): number {
    if (!this.subjectBreakdown.length) return 1;
    return Math.max(...this.subjectBreakdown.map(s => s.total_minutes)) || 1;
  }

  achievementTier(reward: number): 'bronze' | 'silver' | 'gold' | 'diamond' {
    if (reward >= 40) return 'diamond';
    if (reward >= 25) return 'gold';
    if (reward >= 15) return 'silver';
    return 'bronze';
  }

  getHeatmapOpacity(val: number): number {
    if (val === 0) return 0.07;
    return Math.max(0.2, val / this.heatmapMax);
  }

  private initTrendChart(): void {
    if (!this.trendChartRef) return;
    this.trendChart?.destroy();
    const ctx = this.trendChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    this.trendChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: this.trendLabels,
        datasets: [{
          label: 'Sessions',
          data: this.trendValues,
          fill: true,
          backgroundColor: 'rgba(82,113,255,0.08)',
          borderColor: 'rgba(82,113,255,0.7)',
          tension: 0.35,
          pointRadius: 2,
          pointBackgroundColor: 'rgba(82,113,255,0.9)',
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: (c) => `${c.raw} sessions` } }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(255,255,255,0.06)' },
            ticks: { color: 'rgba(255,255,255,0.35)', font: { family: 'Courier New', size: 10 }, stepSize: 1 }
          },
          x: {
            grid: { color: 'rgba(255,255,255,0.04)' },
            ticks: { color: 'rgba(255,255,255,0.35)', font: { family: 'Courier New', size: 10 }, maxTicksLimit: 7 }
          }
        }
      }
    });
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
            backgroundColor: 'rgba(82,113,255,0.65)',
            borderColor: 'rgba(82,113,255,0.9)',
            borderWidth: 1,
            borderRadius: 6,
          },
          {
            label: 'Gold',
            data: this.weeklyGold,
            backgroundColor: 'rgba(255,215,0,0.55)',
            borderColor: 'rgba(255,215,0,0.85)',
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
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(255,255,255,0.06)' },
            ticks: { color: 'rgba(255,255,255,0.35)', font: { family: 'Courier New', size: 10 } }
          },
          x: {
            grid: { color: 'rgba(255,255,255,0.04)' },
            ticks: { color: 'rgba(255,255,255,0.35)', font: { family: 'Courier New', size: 10 } }
          }
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
              label: (c) => {
                const v = c.raw as number;
                return v === 1 ? '1 day streak' : `${v} days streak`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(255,255,255,0.06)' },
            ticks: { color: 'rgba(255,255,255,0.35)', font: { family: 'Courier New', size: 10 }, stepSize: 1 }
          },
          x: {
            grid: { color: 'rgba(255,255,255,0.04)' },
            ticks: { color: 'rgba(255,255,255,0.35)', font: { family: 'Courier New', size: 10 }, maxRotation: 45 }
          }
        }
      }
    });
  }
}
