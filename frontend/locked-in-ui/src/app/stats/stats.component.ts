// stats.component.ts
import { Component, OnInit, AfterViewInit, ElementRef, ViewChild, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import Chart from 'chart.js/auto';
import { trigger, transition, style, animate } from '@angular/animations';
import { StatsService } from './stats.service';
import { TutorialService, TutorialStep } from '../tutorial-modal/tutorial.service';
import { TutorialModalComponent } from '../tutorial-modal/tutorial-modal.component';

// Define interfaces for type safety
interface SummaryStats {
  currentGold: number;
  totalPomodoros: number;
  currentStreak: number;
  longestStreak: number;
  totalHours: number;
}

interface WeeklyData {
  labels: string[];
  pomodoros: number[];
  hours: number[];
  gold: number[];
}

interface StreakData {
  dates: string[];
  values: number[];
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
  styleUrls: ['./stats.component.css'],
  animations: [
    trigger('slideAnimation', [
      transition(':increment', [
        style({ transform: 'translateX(100%)', opacity: 0 }),
        animate('300ms ease-out', style({ transform: 'translateX(0)', opacity: 1 }))
      ]),
      transition(':decrement', [
        style({ transform: 'translateX(-100%)', opacity: 0 }),
        animate('300ms ease-out', style({ transform: 'translateX(0)', opacity: 1 }))
      ])
    ])
  ]
})
export class StatsComponent implements OnInit, AfterViewInit {
  @ViewChild('weeklyChart') weeklyChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('goldChart') goldChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('streakChart') streakChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('chartCarousel') chartCarouselRef!: ElementRef;
  
  // Tutorial
  showTutorial: boolean = false;
  tutorialSteps: TutorialStep[] = [];
  
  loading = true;
  
  // Summary stats
  summary: SummaryStats = {
    currentGold: 0,
    totalPomodoros: 0,
    currentStreak: 0,
    longestStreak: 0,
    totalHours: 0
  };

  // Weekly activity data
  weeklyData: WeeklyData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    pomodoros: [0, 0, 0, 0, 0, 0, 0],
    hours: [0, 0, 0, 0, 0, 0, 0],
    gold: [0, 0, 0, 0, 0, 0, 0]
  };

  // Streak data
  streakData: StreakData = {
    dates: [],
    values: []
  };

  // Achievements
  achievements: Achievement[] = [];
  
  // Chart instances
  private weeklyChart: Chart | null = null;
  private goldChart: Chart | null = null;
  private streakChart: Chart | null = null;

  // Carousel related properties
  currentSlideIndex = 0;
  slides = [
    { title: 'Weekly Activity', id: 'weekly' },
    { title: 'Gold Earned', id: 'gold' },
    { title: 'Streak Timeline', id: 'streak' },
    { title: 'Achievements', id: 'achievements' }
  ];
  touchStartX: number = 0;
  touchEndX: number = 0;
  isDragging: boolean = false;
  dragStartX: number = 0;
  dragAmount: number = 0;

  constructor(
    private http: HttpClient, 
    private statsService: StatsService,
    private tutorialService: TutorialService
  ) { }

  ngOnInit(): void {
    // Check if tutorial should show
    if (!this.tutorialService.hasSeenTutorial('stats')) {
      this.tutorialSteps = this.tutorialService.getTutorialSteps('stats');
      this.showTutorial = true;
    }

    this.loadStats();
  }
  
  ngAfterViewInit(): void {
    // Charts will be initialized after data is loaded
  }

  onTutorialComplete(dontShowAgain: boolean): void {
    if (dontShowAgain) {
      this.tutorialService.markTutorialAsSeen('stats');
    }
    this.showTutorial = false;
  }

  onTutorialSkip(): void {
    this.showTutorial = false;
  }

  @HostListener('touchstart', ['$event'])
  onTouchStart(event: TouchEvent): void {
    this.touchStartX = event.touches[0].clientX;
  }

  @HostListener('touchmove', ['$event'])
  onTouchMove(event: TouchEvent): void {
    this.touchEndX = event.touches[0].clientX;
  }

  @HostListener('touchend')
  onTouchEnd(): void {
    if (this.touchStartX - this.touchEndX > 70) {
      // Swipe left, go to next slide
      this.nextSlide();
    } else if (this.touchEndX - this.touchStartX > 70) {
      // Swipe right, go to previous slide
      this.prevSlide();
    }
    // Reset values
    this.touchStartX = 0;
    this.touchEndX = 0;
  }

  @HostListener('mousedown', ['$event'])
  onMouseDown(event: MouseEvent): void {
    this.isDragging = true;
    this.dragStartX = event.clientX;
  }

  @HostListener('mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    if (this.isDragging) {
      this.dragAmount = event.clientX - this.dragStartX;
      if (this.chartCarouselRef) {
        const carousel = this.chartCarouselRef.nativeElement;
        const transform = `translateX(${this.dragAmount}px)`;
        carousel.style.transform = transform;
      }
    }
  }

  @HostListener('mouseup')
  @HostListener('mouseleave')
  onMouseUp(): void {
    if (this.isDragging) {
      if (this.dragAmount < -70) {
        this.nextSlide();
      } else if (this.dragAmount > 70) {
        this.prevSlide();
      }
      
      // Reset carousel position
      if (this.chartCarouselRef) {
        const carousel = this.chartCarouselRef.nativeElement;
        carousel.style.transform = 'translateX(0)';
      }
      
      this.isDragging = false;
      this.dragAmount = 0;
    }
  }

  prevSlide(): void {
    this.currentSlideIndex = (this.currentSlideIndex === 0) 
      ? this.slides.length - 1 
      : this.currentSlideIndex - 1;
    
    // Make sure charts are properly rendered when switching slides
    setTimeout(() => {
      this.updateChartsForCurrentSlide();
    }, 100);
  }

  nextSlide(): void {
    this.currentSlideIndex = (this.currentSlideIndex === this.slides.length - 1) 
      ? 0 
      : this.currentSlideIndex + 1;
    
    // Make sure charts are properly rendered when switching slides
    setTimeout(() => {
      this.updateChartsForCurrentSlide();
    }, 100);
  }

  goToSlide(index: number): void {
    this.currentSlideIndex = index;
    setTimeout(() => {
      this.updateChartsForCurrentSlide();
    }, 100);
  }

  isCurrentSlide(index: number): boolean {
    return this.currentSlideIndex === index;
  }

  loadStats(): void {
    // Use Promise.all to load multiple API calls in parallel
    Promise.all([
      this.fetchSummary(),
      this.fetchWeeklyActivity(),
      this.fetchStreakTimeline(),
      this.fetchAchievements()
    ]).then(() => {
      this.loading = false;
      
      // Initialize charts after data is loaded
      setTimeout(() => {
        this.initCharts();
      }, 0);
    }).catch(error => {
      console.error('Error loading stats:', error);
      this.loading = false;
      
      // Initialize charts with whatever data we have
      setTimeout(() => {
        this.initCharts();
      }, 0);
    });
  }

  fetchSummary(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.statsService.getUserStatsSummary()
        .subscribe({
          next: (data) => {
            this.summary = data;
            resolve();
          },
          error: (err) => reject(err)
        });
    });
  }

  fetchWeeklyActivity(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.statsService.getUserStatsHistory('week')
        .subscribe({
          next: (data) => {
            if (data.labels) this.weeklyData.labels = data.labels;
            if (data.pomodoros) this.weeklyData.pomodoros = data.pomodoros;
            if (data.hours) this.weeklyData.hours = data.hours;
            if (data.gold) this.weeklyData.gold = data.gold;
            resolve();
          },
          error: (err) => reject(err)
        });
    });
  }

  fetchStreakTimeline(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.statsService.getStreakTimeline()
        .subscribe({
          next: (data) => {
            if (data.dates) this.streakData.dates = data.dates;
            if (data.streaks) this.streakData.values = data.streaks;
            resolve();
          },
          error: (err) => reject(err)
        });
    });
  }

  fetchAchievements(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.statsService.getUserAchievements()
        .subscribe({
          next: (data) => {
            this.achievements = data;
            resolve();
          },
          error: (err) => reject(err)
        });
    });
  }

  updateChartsForCurrentSlide(): void {
    const currentSlide = this.slides[this.currentSlideIndex];
    
    // Reinitialize the chart for the current slide
    if (currentSlide.id === 'weekly' && this.weeklyChartRef) {
      this.initWeeklyChart();
    } else if (currentSlide.id === 'gold' && this.goldChartRef) {
      this.initGoldChart();
    } else if (currentSlide.id === 'streak' && this.streakChartRef) {
      this.initStreakChart();
    }
    // No need to reinitialize for achievements as it's just a list
  }

  initCharts(): void {
    if (this.weeklyChartRef && this.goldChartRef && this.streakChartRef) {
      // Initialize only the first slide's chart initially
      this.updateChartsForCurrentSlide();
    } else {
      console.warn('Chart references not yet available. Charts will not be initialized.');
    }
  }
  
  initWeeklyChart(): void {
    if (!this.weeklyChartRef) return;
    
    const ctx = this.weeklyChartRef.nativeElement.getContext('2d');
    if (!ctx) return;
    
    // Destroy previous chart if it exists
    if (this.weeklyChart) {
      this.weeklyChart.destroy();
    }
    
    this.weeklyChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: this.weeklyData.labels,
        datasets: [
          {
            label: 'Pomodoros',
            data: this.weeklyData.pomodoros,
            backgroundColor: '#3b82f6',
            borderColor: '#2563eb',
            borderWidth: 1
          },
          {
            label: 'Hours',
            data: this.weeklyData.hours,
            backgroundColor: '#10b981',
            borderColor: '#059669',
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'top',
            labels: {
              color: '#ffffff'
            }
          },
          tooltip: {
            mode: 'index',
            intersect: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            },
            ticks: {
              color: '#aaaaaa'
            }
          },
          x: {
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            },
            ticks: {
              color: '#aaaaaa'
            }
          }
        }
      }
    });
  }
  
  initGoldChart(): void {
    if (!this.goldChartRef) return;
    
    const ctx = this.goldChartRef.nativeElement.getContext('2d');
    if (!ctx) return;
    
    // Destroy previous chart if it exists
    if (this.goldChart) {
      this.goldChart.destroy();
    }
    
    this.goldChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: this.weeklyData.labels,
        datasets: [
          {
            label: 'Gold Earned',
            data: this.weeklyData.gold,
            backgroundColor: 'rgba(255, 215, 0, 0.7)',
            borderColor: 'rgba(255, 215, 0, 1)',
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'top',
            labels: {
              color: '#ffffff'
            }
          },
          tooltip: {
            mode: 'index',
            intersect: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            },
            ticks: {
              color: '#aaaaaa'
            }
          },
          x: {
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            },
            ticks: {
              color: '#aaaaaa'
            }
          }
        }
      }
    });
  }
  
  initStreakChart(): void {
    if (!this.streakChartRef) return;
    
    const ctx = this.streakChartRef.nativeElement.getContext('2d');
    if (!ctx) return;
    
    // Destroy previous chart if it exists
    if (this.streakChart) {
      this.streakChart.destroy();
    }
    
    // Create point colors based on streak values
    const pointBackgroundColors = this.streakData.values.map(value => 
      value === 0 ? '#888888' : '#ef4444'
    );
    
    // Create point sizes based on streak values
    const pointRadii = this.streakData.values.map(value => 
      5 + value * 1.5
    );
    
    this.streakChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: this.streakData.dates,
        datasets: [
          {
            label: 'Daily Streak',
            data: this.streakData.values,
            fill: false,
            borderColor: '#5271ff',
            tension: 0.1,
            pointBackgroundColor: pointBackgroundColors,
            pointBorderColor: pointBackgroundColors,
            pointRadius: pointRadii,
            pointHoverRadius: (context) => {
              if (context.dataIndex !== undefined) {
                return pointRadii[context.dataIndex] + 2;
              }
              return 7; // Default value
            }
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'top',
            labels: {
              color: '#ffffff'
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const value = context.raw as number;
                return value === 1 ? '1 day streak' : `${value} days streak`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            },
            ticks: {
              color: '#aaaaaa',
              stepSize: 1
            }
          },
          x: {
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            },
            ticks: {
              color: '#aaaaaa',
              maxRotation: 45,
              minRotation: 45
            }
          }
        }
      }
    });
  }
}
