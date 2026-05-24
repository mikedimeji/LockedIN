import { Component, OnInit } from '@angular/core';
import { NgFor, NgIf, NgClass } from '@angular/common';
import { Router } from '@angular/router';
import { catchError, of } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

import { ScheduleService, TimeBlock } from './schedule.service';
import { PremiumService } from '../premium.service';

const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];

// 7am – 10pm
const SLOTS = Array.from({ length: 16 }, (_, i) => {
  const h = i + 7;
  return { minute: h * 60, label: h > 12 ? `${h - 12}pm` : h === 12 ? '12pm' : `${h}am` };
});

@Component({
  selector: 'app-schedule',
  standalone: true,
  templateUrl: './schedule.component.html',
  styleUrls: ['./schedule.component.css'],
  imports: [NgFor, NgIf, NgClass],
})
export class ScheduleComponent implements OnInit {
  isPremium = false;
  errorMsg  = '';

  // Calendar
  year  = new Date().getFullYear();
  month = new Date().getMonth();
  cells: { date: string; day: number; cur: boolean; today: boolean; blocks: TimeBlock[] }[] = [];
  readonly dayNames = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  readonly slots    = SLOTS;

  // Day modal
  showDay   = false;
  dayDate   = '';
  dayBlocks: TimeBlock[] = [];
  activeSlot: number | null = null;  // slot being picked
  loadingDay = false;
  nowMinute = 0;  // current hour-slot minute, updated when modal opens

  // Deep work launch modal
  showDW       = false;
  dwBlock: TimeBlock | null = null;
  dwPomodoros  = 2;
  dwPreset     = 0;
  readonly presets = [{ label: '25m' }, { label: '45m' }, { label: '1h' }];

  constructor(
    private svc: ScheduleService,
    private premSvc: PremiumService,
    private router: Router,
  ) {}

  ngOnInit() {
    this.premSvc.getStatus().subscribe({
      next: s => { this.isPremium = s.isPremium; if (this.isPremium) this.build(); },
      error: () => {},
    });
  }

  // ── Calendar ──────────────────────────────────────────────────────────────

  get monthLabel() { return `${MONTHS[this.month]} ${this.year}`; }

  prev() { this.month--; if (this.month < 0) { this.month = 11; this.year--; } this.build(); }
  next() { this.month++; if (this.month > 11) { this.month = 0;  this.year++; } this.build(); }

  build() {
    const first  = new Date(this.year, this.month, 1);
    const last   = new Date(this.year, this.month + 1, 0);
    const offset = (first.getDay() + 6) % 7;
    const todayStr = this.fmt(new Date());
    const arr: typeof this.cells = [];

    for (let i = offset - 1; i >= 0; i--) {
      const d = new Date(this.year, this.month, -i);
      arr.push({ date: this.fmt(d), day: d.getDate(), cur: false, today: false, blocks: [] });
    }
    for (let n = 1; n <= last.getDate(); n++) {
      const d = new Date(this.year, this.month, n);
      const s = this.fmt(d);
      arr.push({ date: s, day: n, cur: true, today: s === todayStr, blocks: [] });
    }
    const rem = (7 - arr.length % 7) % 7;
    for (let i = 1; i <= rem; i++) {
      const d = new Date(this.year, this.month + 1, i);
      arr.push({ date: this.fmt(d), day: d.getDate(), cur: false, today: false, blocks: [] });
    }
    this.cells = arr;

    // Load dots for current month
    arr.filter(c => c.cur).forEach(c => {
      this.svc.getBlocks(c.date).pipe(catchError(() => of([]))).subscribe(b => c.blocks = b);
    });
  }

  clickDay(cell: typeof this.cells[0]) {
    if (!cell.cur) return;
    this.dayDate    = cell.date;
    this.dayBlocks  = [];
    this.activeSlot = null;
    this.errorMsg   = '';
    this.showDay    = true;
    this.loadingDay = true;
    // Snap now to the nearest slot hour for highlighting
    const now = new Date();
    this.nowMinute = cell.today ? now.getHours() * 60 : -1;
    this.svc.getBlocks(cell.date).pipe(catchError(() => of([]))).subscribe(b => {
      this.dayBlocks  = b.sort((a, b) => a.startMinute - b.startMinute);
      this.loadingDay = false;
    });
  }

  // ── Day modal ─────────────────────────────────────────────────────────────

  get dayLabel() {
    const d = new Date(this.dayDate + 'T12:00:00');
    return `${d.getDate()} ${MONTHS[d.getMonth()]} ${this.year}`;
  }

  blocksAt(minute: number) {
    return this.dayBlocks.filter(b => b.startMinute >= minute && b.startMinute < minute + 60);
  }

  pickType(minute: number, type: 'DEEP_WORK' | 'BREAK' | 'SCHEDULE') {
    this.activeSlot = null;
    this.errorMsg   = '';
    const label = type === 'DEEP_WORK' ? 'Deep Work' : type === 'BREAK' ? 'Break' : 'Schedule';
    const payload: Omit<TimeBlock, 'id'> = {
      date: this.dayDate, startMinute: minute, endMinute: minute + 60, type, title: label,
    };
    this.svc.createBlock(payload)
      .pipe(catchError((e: HttpErrorResponse) => {
        this.errorMsg = `Could not save block (${e.status || 'network error'})`;
        return of(null);
      }))
      .subscribe(b => {
        if (b) {
          this.dayBlocks = [...this.dayBlocks, b].sort((a, x) => a.startMinute - x.startMinute);
          // update dot on calendar cell
          const cell = this.cells.find(c => c.date === this.dayDate);
          if (cell) cell.blocks = [...cell.blocks, b];
        }
      });
  }

  deleteBlock(block: TimeBlock, e: MouseEvent) {
    e.stopPropagation();
    if (!block.id) return;
    this.svc.deleteBlock(block.id).pipe(catchError(() => of(null))).subscribe(() => {
      this.dayBlocks = this.dayBlocks.filter(b => b.id !== block.id);
      const cell = this.cells.find(c => c.date === this.dayDate);
      if (cell) cell.blocks = cell.blocks.filter(b => b.id !== block.id);
    });
  }

  // ── Deep work ─────────────────────────────────────────────────────────────

  openDW(block: TimeBlock, e: MouseEvent) {
    e.stopPropagation();
    this.dwBlock     = block;
    this.dwPomodoros = Math.max(1, Math.floor((block.endMinute - block.startMinute) / 25));
    this.dwPreset    = 0;
    this.showDW      = true;
  }

  launchDW() {
    this.showDW = false;
    this.router.navigate(['/timer'], {
      queryParams: { deepWork: 'true', pomodoros: this.dwPomodoros, preset: this.dwPreset },
    });
  }

  disp(m: number) { return this.svc.minutesToDisplay(m); }
  private fmt(d: Date) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
}
