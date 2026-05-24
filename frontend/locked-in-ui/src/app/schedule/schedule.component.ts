import { Component, OnInit } from '@angular/core';
import { NgFor, NgIf, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { catchError, of } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

import { ScheduleService, TimeBlock } from './schedule.service';
import { PremiumService } from '../premium.service';

interface CalendarDay {
  dateStr: string;
  day: number;
  inMonth: boolean;
  isToday: boolean;
  blocks: TimeBlock[];
}

interface TimeSlot {
  minute: number; // minutes from midnight (e.g. 420 = 7am)
  label: string;  // e.g. "7am"
}

const MONTH_NAMES = ['January','February','March','April','May','June',
                     'July','August','September','October','November','December'];
const DAY_NAMES   = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

// 7am–11pm in 60-min slots
const TIME_SLOTS: TimeSlot[] = Array.from({ length: 17 }, (_, i) => {
  const m = (i + 7) * 60;
  const h = i + 7;
  const ampm = h >= 12 ? 'pm' : 'am';
  const display = h > 12 ? h - 12 : h;
  return { minute: m, label: `${display}${ampm}` };
});

@Component({
  selector: 'app-schedule',
  standalone: true,
  templateUrl: './schedule.component.html',
  styleUrls: ['./schedule.component.css'],
  imports: [NgFor, NgIf, NgClass, FormsModule],
})
export class ScheduleComponent implements OnInit {
  isPremium = false;
  errorMsg = '';

  // Calendar
  calYear  = new Date().getFullYear();
  calMonth = new Date().getMonth();
  calDays: CalendarDay[] = [];
  dayNames = DAY_NAMES;
  get monthLabel() { return `${MONTH_NAMES[this.calMonth]} ${this.calYear}`; }

  // Selected day
  selectedDay: CalendarDay | null = null;
  timeSlots = TIME_SLOTS;

  // Inline type picker
  activeSlot: number | null = null; // minute value of the open slot

  // Edit dialog
  showEditDialog = false;
  editingBlock: TimeBlock | null = null;
  editForm = { title: '', type: 'DEEP_WORK' as 'DEEP_WORK'|'BREAK'|'SCHEDULE', startMinute: 0, endMinute: 60 };

  // Deep work dialog
  showDeepWorkDialog = false;
  deepWorkBlock: TimeBlock | null = null;
  deepWorkPomodoros = 2;
  deepWorkPreset = 0;

  readonly presets = [
    { label: '25m', minutes: 25 },
    { label: '45m', minutes: 45 },
    { label: '1h',  minutes: 60 },
  ];

  readonly blockTypes: { value: 'DEEP_WORK'|'BREAK'|'SCHEDULE'; label: string }[] = [
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
      next: s => {
        this.isPremium = s.isPremium;
        if (this.isPremium) {
          this.buildCalendar();
          // Auto-select today
          const todayStr = this.fmt(new Date());
          const today = this.calDays.find(d => d.dateStr === todayStr) ?? null;
          if (today) this.selectDay(today);
        }
      },
      error: () => {},
    });
  }

  // ── Calendar ──────────────────────────────────────────────────────────────

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
    const todayStr = this.fmt(now);
    const today = this.calDays.find(d => d.dateStr === todayStr) ?? null;
    if (today) this.selectDay(today);
  }

  buildCalendar(): void {
    const firstDay = new Date(this.calYear, this.calMonth, 1);
    const lastDay  = new Date(this.calYear, this.calMonth + 1, 0);
    let startOffset = (firstDay.getDay() + 6) % 7;
    const days: CalendarDay[] = [];
    const todayStr = this.fmt(new Date());

    for (let i = startOffset - 1; i >= 0; i--) {
      const d = new Date(this.calYear, this.calMonth, -i);
      days.push({ dateStr: this.fmt(d), day: d.getDate(), inMonth: false, isToday: false, blocks: [] });
    }
    for (let n = 1; n <= lastDay.getDate(); n++) {
      const d   = new Date(this.calYear, this.calMonth, n);
      const str = this.fmt(d);
      days.push({ dateStr: str, day: n, inMonth: true, isToday: str === todayStr, blocks: [] });
    }
    const rem = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= rem; i++) {
      const d = new Date(this.calYear, this.calMonth + 1, i);
      days.push({ dateStr: this.fmt(d), day: d.getDate(), inMonth: false, isToday: false, blocks: [] });
    }
    this.calDays = days;
    this.loadMonthBlocks();
  }

  private loadMonthBlocks(): void {
    this.calDays.filter(d => d.inMonth).forEach(day => {
      this.scheduleService.getBlocks(day.dateStr)
        .pipe(catchError(() => of([])))
        .subscribe(blocks => { day.blocks = blocks; });
    });
  }

  selectDay(day: CalendarDay): void {
    if (!day.inMonth) return;
    this.selectedDay = day;
    this.activeSlot = null;
    this.scheduleService.getBlocks(day.dateStr)
      .pipe(catchError(() => of([])))
      .subscribe(blocks => {
        day.blocks = blocks.sort((a, b) => a.startMinute - b.startMinute);
      });
  }

  isSelected(day: CalendarDay): boolean {
    return this.selectedDay?.dateStr === day.dateStr;
  }

  // ── Time slots ────────────────────────────────────────────────────────────

  blocksInSlot(slotMinute: number): TimeBlock[] {
    if (!this.selectedDay) return [];
    return this.selectedDay.blocks.filter(
      b => b.startMinute >= slotMinute && b.startMinute < slotMinute + 60
    );
  }

  toggleSlot(slotMinute: number): void {
    this.activeSlot = this.activeSlot === slotMinute ? null : slotMinute;
  }

  quickAdd(slotMinute: number, type: 'DEEP_WORK'|'BREAK'|'SCHEDULE'): void {
    if (!this.selectedDay) return;
    this.activeSlot = null;
    this.errorMsg = '';

    const payload: Omit<TimeBlock, 'id'> = {
      date:        this.selectedDay.dateStr,
      startMinute: slotMinute,
      endMinute:   slotMinute + 60,
      type,
      title: type === 'DEEP_WORK' ? 'Deep Work' : type === 'BREAK' ? 'Break' : 'Schedule',
    };

    this.scheduleService.createBlock(payload)
      .pipe(catchError((err: HttpErrorResponse) => {
        this.errorMsg = `Failed to add block (${err.status})`;
        return of(null);
      }))
      .subscribe(created => {
        if (created && this.selectedDay) {
          this.selectedDay.blocks = [...this.selectedDay.blocks, created]
            .sort((a, b) => a.startMinute - b.startMinute);
        }
      });
  }

  // ── Edit dialog ───────────────────────────────────────────────────────────

  openEdit(block: TimeBlock, e: MouseEvent): void {
    e.stopPropagation();
    this.editingBlock = block;
    this.editForm = { title: block.title, type: block.type, startMinute: block.startMinute, endMinute: block.endMinute };
    this.showEditDialog = true;
  }

  saveEdit(): void {
    if (!this.editingBlock?.id || !this.selectedDay) return;
    const payload = { ...this.selectedDay && { date: this.selectedDay.dateStr }, ...this.editForm };
    this.scheduleService.updateBlock(this.editingBlock.id, {
      date: this.selectedDay.dateStr,
      startMinute: Number(this.editForm.startMinute),
      endMinute:   Number(this.editForm.endMinute),
      type:  this.editForm.type,
      title: this.editForm.title.trim() || this.labelFor(this.editForm.type),
    }).pipe(catchError(() => of(null))).subscribe(updated => {
      if (updated && this.selectedDay) {
        this.selectedDay.blocks = this.selectedDay.blocks
          .map(b => b.id === updated.id ? updated : b)
          .sort((a, b) => a.startMinute - b.startMinute);
      }
      this.showEditDialog = false;
      this.editingBlock = null;
    });
  }

  deleteBlock(block: TimeBlock, e: MouseEvent): void {
    e.stopPropagation();
    if (!block.id || !this.selectedDay) return;
    this.scheduleService.deleteBlock(block.id)
      .pipe(catchError(() => of(null)))
      .subscribe(() => {
        if (this.selectedDay)
          this.selectedDay.blocks = this.selectedDay.blocks.filter(b => b.id !== block.id);
      });
  }

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

  displayTime(m: number): string { return this.scheduleService.minutesToDisplay(m); }

  minuteOptions() {
    const opts = [];
    for (let m = 0; m < 24 * 60; m += 15)
      opts.push({ value: m, label: this.scheduleService.minutesToDisplay(m) });
    return opts;
  }

  get selectedDayLabel(): string {
    if (!this.selectedDay) return '';
    const d = new Date(this.selectedDay.dateStr + 'T00:00:00');
    return `${d.getDate()} ${MONTH_NAMES[d.getMonth()].toUpperCase()} ${d.getFullYear()}`;
  }

  private fmt(d: Date): string { return d.toISOString().split('T')[0]; }
}
