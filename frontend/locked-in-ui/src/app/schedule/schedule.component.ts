import { Component, OnInit } from '@angular/core';
import { NgFor, NgIf, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { catchError, of } from 'rxjs';

import { ScheduleService, TimeBlock } from './schedule.service';
import { PremiumService } from '../premium.service';

interface CalendarDay {
  dateStr: string;      // yyyy-MM-dd
  day: number;
  inMonth: boolean;
  isToday: boolean;
  blocks: TimeBlock[];
}

interface BlockForm {
  title: string;
  type: 'DEEP_WORK' | 'BREAK' | 'SCHEDULE';
  startMinute: number;
  endMinute: number;
}

const MONTH_NAMES = ['January','February','March','April','May','June',
                     'July','August','September','October','November','December'];
const DAY_NAMES   = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

@Component({
  selector: 'app-schedule',
  standalone: true,
  templateUrl: './schedule.component.html',
  styleUrls: ['./schedule.component.css'],
  imports: [NgFor, NgIf, NgClass, FormsModule],
})
export class ScheduleComponent implements OnInit {

  isPremium = false;

  // Calendar state
  viewMode: 'month' | 'day' = 'month';
  calYear  = new Date().getFullYear();
  calMonth = new Date().getMonth(); // 0-indexed
  calDays: CalendarDay[] = [];
  dayNames = DAY_NAMES;

  // Day view
  selectedDateStr = '';
  selectedDateBlocks: TimeBlock[] = [];
  loadingDay = false;

  // Create/edit dialog
  showDialog = false;
  editingId: number | null = null;
  form: BlockForm = this.emptyForm();

  // Deep work launch dialog
  showDeepWorkDialog = false;
  deepWorkBlock: TimeBlock | null = null;
  deepWorkPomodoros = 2;
  deepWorkPreset = 0;

  readonly presets = [
    { label: '25m', minutes: 25 },
    { label: '45m', minutes: 45 },
    { label: '1h',  minutes: 60 },
  ];

  readonly blockTypes: { value: 'DEEP_WORK' | 'BREAK' | 'SCHEDULE'; label: string }[] = [
    { value: 'DEEP_WORK', label: 'Deep Work' },
    { value: 'BREAK',     label: 'Break'     },
    { value: 'SCHEDULE',  label: 'Schedule'  },
  ];

  constructor(
    private scheduleService: ScheduleService,
    private premiumService: PremiumService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.premiumService.getStatus().subscribe({
      next: s => { this.isPremium = s.isPremium; if (this.isPremium) this.buildCalendar(); },
      error: () => {},
    });
  }

  // ── Month navigation ──────────────────────────────────────────────────────

  get monthLabel(): string { return `${MONTH_NAMES[this.calMonth]} ${this.calYear}`; }

  prevMonth(): void {
    if (this.calMonth === 0) { this.calMonth = 11; this.calYear--; }
    else this.calMonth--;
    this.buildCalendar();
  }

  nextMonth(): void {
    if (this.calMonth === 11) { this.calMonth = 0; this.calYear++; }
    else this.calMonth++;
    this.buildCalendar();
  }

  goToday(): void {
    const now = new Date();
    this.calYear = now.getFullYear();
    this.calMonth = now.getMonth();
    this.buildCalendar();
  }

  buildCalendar(): void {
    const firstDay = new Date(this.calYear, this.calMonth, 1);
    const lastDay  = new Date(this.calYear, this.calMonth + 1, 0);

    // Monday-first: 0=Mon … 6=Sun
    let startOffset = (firstDay.getDay() + 6) % 7;
    const days: CalendarDay[] = [];

    // Pad from previous month
    for (let i = startOffset - 1; i >= 0; i--) {
      const d = new Date(this.calYear, this.calMonth, -i);
      days.push({ dateStr: this.fmt(d), day: d.getDate(), inMonth: false, isToday: false, blocks: [] });
    }

    const todayStr = this.fmt(new Date());
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const date = new Date(this.calYear, this.calMonth, d);
      const dateStr = this.fmt(date);
      days.push({ dateStr, day: d, inMonth: true, isToday: dateStr === todayStr, blocks: [] });
    }

    // Pad to complete last row
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(this.calYear, this.calMonth + 1, i);
      days.push({ dateStr: this.fmt(d), day: d.getDate(), inMonth: false, isToday: false, blocks: [] });
    }

    this.calDays = days;
    this.loadMonthBlocks();
  }

  private loadMonthBlocks(): void {
    // Load blocks for each day in the visible month concurrently
    const monthDays = this.calDays.filter(d => d.inMonth);
    monthDays.forEach(day => {
      this.scheduleService.getBlocks(day.dateStr).pipe(catchError(() => of([]))).subscribe(blocks => {
        day.blocks = blocks;
      });
    });
  }

  // ── Day view ──────────────────────────────────────────────────────────────

  selectDay(day: CalendarDay): void {
    this.selectedDateStr = day.dateStr;
    this.viewMode = 'day';
    this.loadDayBlocks();
  }

  backToMonth(): void {
    this.viewMode = 'month';
    this.buildCalendar();
  }

  loadDayBlocks(): void {
    this.loadingDay = true;
    this.scheduleService.getBlocks(this.selectedDateStr).pipe(catchError(() => of([]))).subscribe(blocks => {
      this.selectedDateBlocks = blocks.sort((a, b) => a.startMinute - b.startMinute);
      this.loadingDay = false;
    });
  }

  get selectedDateLabel(): string {
    const d = new Date(this.selectedDateStr + 'T00:00:00');
    return `${d.getDate()} ${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
  }

  prevDay(): void {
    const d = new Date(this.selectedDateStr + 'T00:00:00');
    d.setDate(d.getDate() - 1);
    this.selectedDateStr = this.fmt(d);
    this.loadDayBlocks();
  }

  nextDay(): void {
    const d = new Date(this.selectedDateStr + 'T00:00:00');
    d.setDate(d.getDate() + 1);
    this.selectedDateStr = this.fmt(d);
    this.loadDayBlocks();
  }

  // ── Block CRUD ────────────────────────────────────────────────────────────

  openCreate(): void {
    this.form = this.emptyForm();
    this.editingId = null;
    this.showDialog = true;
  }

  openEdit(block: TimeBlock, e: MouseEvent): void {
    e.stopPropagation();
    this.form = { title: block.title, type: block.type, startMinute: block.startMinute, endMinute: block.endMinute };
    this.editingId = block.id ?? null;
    this.showDialog = true;
  }

  deleteBlock(block: TimeBlock, e: MouseEvent): void {
    e.stopPropagation();
    if (block.id == null) return;
    this.scheduleService.deleteBlock(block.id).pipe(catchError(() => of(null))).subscribe(() => {
      this.selectedDateBlocks = this.selectedDateBlocks.filter(b => b.id !== block.id);
    });
  }

  saveBlock(): void {
    if (this.form.endMinute <= this.form.startMinute) this.form.endMinute = this.form.startMinute + 60;

    const payload: Omit<TimeBlock, 'id'> = {
      date: this.selectedDateStr,
      startMinute: Number(this.form.startMinute),
      endMinute:   Number(this.form.endMinute),
      type:  this.form.type,
      title: this.form.title.trim() || this.labelFor(this.form.type),
    };

    if (this.editingId != null) {
      this.scheduleService.updateBlock(this.editingId, payload)
        .pipe(catchError(() => of(null)))
        .subscribe(updated => {
          if (updated) this.selectedDateBlocks = this.selectedDateBlocks
            .map(b => b.id === this.editingId ? updated : b)
            .sort((a, b) => a.startMinute - b.startMinute);
          this.closeDialog();
        });
    } else {
      this.scheduleService.createBlock(payload)
        .pipe(catchError(err => { console.error('Create block failed:', err); return of(null); }))
        .subscribe(created => {
          if (created) {
            this.selectedDateBlocks = [...this.selectedDateBlocks, created]
              .sort((a, b) => a.startMinute - b.startMinute);
          }
          this.closeDialog();
        });
    }
  }

  closeDialog(): void { this.showDialog = false; this.editingId = null; }

  // ── Deep work ─────────────────────────────────────────────────────────────

  openDeepWork(block: TimeBlock, e: MouseEvent): void {
    e.stopPropagation();
    this.deepWorkBlock = block;
    this.deepWorkPomodoros = Math.max(1, Math.floor((block.endMinute - block.startMinute) / 25));
    this.deepWorkPreset = 0;
    this.showDeepWorkDialog = true;
  }

  launchDeepWork(): void {
    this.showDeepWorkDialog = false;
    this.router.navigate(['/timer'], {
      queryParams: { deepWork: 'true', pomodoros: this.deepWorkPomodoros, preset: this.deepWorkPreset },
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  labelFor(type: string): string {
    return type === 'DEEP_WORK' ? 'Deep Work' : type === 'BREAK' ? 'Break' : 'Schedule';
  }

  displayTime(min: number): string { return this.scheduleService.minutesToDisplay(min); }

  minuteOptions(): { value: number; label: string }[] {
    const opts = [];
    for (let m = 0; m < 24 * 60; m += 15)
      opts.push({ value: m, label: this.scheduleService.minutesToDisplay(m) });
    return opts;
  }

  private fmt(d: Date): string { return d.toISOString().split('T')[0]; }
  private emptyForm(): BlockForm { return { title: '', type: 'DEEP_WORK', startMinute: 9 * 60, endMinute: 11 * 60 }; }
}
