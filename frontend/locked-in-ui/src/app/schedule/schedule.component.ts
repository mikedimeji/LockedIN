import { Component, OnInit } from '@angular/core';
import { NgFor, NgIf, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { catchError, of } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

import { ScheduleService, TimeBlock } from './schedule.service';
import { PremiumService, PremiumModalService } from '../premium.service';
import { GoogleCalendarService, GCalEvent } from './google-calendar.service';
import { TutorialModalComponent } from '../tutorial-modal/tutorial-modal.component';
import { TutorialService, TutorialStep } from '../tutorial-modal/tutorial.service';
import { AuthService } from '../auth.service';

const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];

// 5am – midnight in 30-min increments (38 slots)
const SLOTS = Array.from({ length: 38 }, (_, i) => {
  const total = 5 * 60 + i * 30;
  const h = Math.floor(total / 60);
  const m = total % 60;
  const ampm = h >= 12 ? 'pm' : 'am';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  const label = m === 0 ? `${h12}${ampm}` : `${h12}:${String(m).padStart(2, '0')}${ampm}`;
  return { minute: total, label };
});

const DURATIONS = [
  { label: '30m', mins: 30 },
  { label: '1h',  mins: 60 },
  { label: '1.5h',mins: 90 },
  { label: '2h',  mins: 120 },
  { label: '3h',  mins: 180 },
  { label: '4h',  mins: 240 },
];

@Component({
  selector: 'app-schedule',
  standalone: true,
  templateUrl: './schedule.component.html',
  styleUrls: ['./schedule.component.css'],
  imports: [NgFor, NgIf, NgClass, FormsModule, TutorialModalComponent],
})
export class ScheduleComponent implements OnInit {
  isPremium = false;
  private _errorMsg = '';
  private _errorTimer: any;

  get errorMsg(): string { return this._errorMsg; }
  set errorMsg(val: string) {
    this._errorMsg = val;
    clearTimeout(this._errorTimer);
    if (val) this._errorTimer = setTimeout(() => { this._errorMsg = ''; }, 4000);
  }

  // Calendar
  year  = new Date().getFullYear();
  month = new Date().getMonth();
  cells: { date: string; day: number; cur: boolean; today: boolean; blocks: TimeBlock[] }[] = [];
  readonly dayNames = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  readonly slots     = SLOTS;
  readonly durations = DURATIONS;

  // Day modal
  showDay         = false;
  dayDate         = '';
  dayBlocks: TimeBlock[] = [];
  activeSlot: number | null = null;
  activeDuration  = 60;
  activeBlockName = '';
  loadingDay      = false;
  nowMinute       = 0;

  // Start-day confirmation
  showStartConfirm      = false;
  confirmBlock: TimeBlock | null = null;
  confirmRemainingMins  = 0;
  confirmTotalMins      = 0;
  private pendingPlaylist: TimeBlock[] = [];

  readonly SLOT_HEIGHT    = 52;
  readonly FIRST_SLOT_MIN = 5 * 60;

  // Deep work launch modal
  showDW       = false;
  dwBlock: TimeBlock | null = null;
  dwPomodoros  = 2;
  dwPreset     = 0;
  readonly presets = [{ label: '25m' }, { label: '45m' }, { label: '1h' }];

  // Google Calendar
  gcalConnected = false;
  gcalEvents:   GCalEvent[] = [];
  gcalLoading  = false;

  // Tutorial
  showTutorial = false;
  tutorialSteps: TutorialStep[] = [];

  constructor(
    private svc: ScheduleService,
    private premSvc: PremiumService,
    private premiumModal: PremiumModalService,
    private router: Router,
    private route: ActivatedRoute,
    private gcalSvc: GoogleCalendarService,
    private tutorialService: TutorialService,
    private authService: AuthService,
  ) {}

  ngOnInit() {
    this.premSvc.getStatus().subscribe({
      next: s => { this.isPremium = s.isPremium; if (this.isPremium) this.build(); },
      error: () => {},
    });

    // Handle redirect back from Google OAuth
    this.route.queryParams.subscribe(params => {
      if (params['gcal'] === 'connected') {
        this.gcalConnected = true;
        this.router.navigate([], { replaceUrl: true, queryParams: {} });
      }
      if (params['gcal'] === 'error') {
        this.errorMsg = 'Google Calendar connection failed. Please try again.';
        this.router.navigate([], { replaceUrl: true, queryParams: {} });
      }
    });

    this.gcalSvc.getStatus().subscribe(s => {
      this.gcalConnected = s.connected;
      // Handle race condition: day already open when status resolves
      if (s.connected && this.showDay && this.gcalEvents.length === 0) {
        this.gcalSvc.getEvents(this.dayDate).subscribe({
          next: e => this.gcalEvents = e,
          error: () => this.handleGCalAuthError(),
        });
      }
    });

    if (this.authService.isLoggedIn() && !this.tutorialService.hasSeenTutorial('schedule')) {
      this.tutorialSteps = this.tutorialService.getTutorialSteps('schedule');
      this.showTutorial = true;
    }
  }

  onTutorialComplete(dontShow: boolean): void {
    if (dontShow) this.tutorialService.markTutorialAsSeen('schedule');
    this.showTutorial = false;
  }
  onTutorialSkip(): void { this.showTutorial = false; }
  openTutorial(): void {
    this.tutorialSteps = this.tutorialService.getTutorialSteps('schedule');
    this.showTutorial = true;
  }

  openUpgrade(): void { this.premiumModal.open(); }

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

    // Load dots for the whole month in one request
    this.svc.getMonthBlocks(this.year, this.month)
      .pipe(catchError(() => of({} as { [date: string]: TimeBlock[] })))
      .subscribe(map => {
        arr.filter(c => c.cur).forEach(c => { c.blocks = map[c.date] ?? []; });
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
    this.gcalEvents = [];
    // Snap now to the nearest slot hour for highlighting
    const now = new Date();
    this.nowMinute = cell.today ? now.getHours() * 60 : -1;
    this.svc.getBlocks(cell.date).pipe(catchError(() => of([]))).subscribe(b => {
      this.dayBlocks  = b.sort((a, b) => a.startMinute - b.startMinute);
      this.loadingDay = false;
    });

    if (this.gcalConnected) {
      this.gcalLoading = true;
      this.gcalSvc.getEvents(cell.date).subscribe({
        next: e => { this.gcalEvents = e; this.gcalLoading = false; },
        error: () => { this.gcalLoading = false; this.handleGCalAuthError(); },
      });
    } else {
      this.gcalEvents = [];
    }
  }

  // ── Day modal ─────────────────────────────────────────────────────────────

  get dayLabel() {
    const d = new Date(this.dayDate + 'T12:00:00');
    return `${d.getDate()} ${MONTHS[d.getMonth()]} ${this.year}`;
  }

  blocksAt(minute: number) {
    return this.dayBlocks.filter(b => b.startMinute >= minute && b.startMinute < minute + 30);
  }

  gcalEventsAt(minute: number) {
    return this.gcalEvents.filter(e => !e.allDay && e.startMinute >= minute && e.startMinute < minute + 30);
  }

  gcalBlockHeight(e: GCalEvent): number {
    return Math.max((e.endMinute - e.startMinute) / 30 * this.SLOT_HEIGHT - 4, 28);
  }

  get allDayGcalEvents() { return this.gcalEvents.filter(e => e.allDay); }

  cancelSlot() {
    this.activeSlot     = null;
    this.activeDuration = 60;
    this.activeBlockName = '';
  }

  blockHeight(b: TimeBlock): number {
    return Math.max((b.endMinute - b.startMinute) / 30 * this.SLOT_HEIGHT - 4, 28);
  }

  isSlotOccupied(minute: number): boolean {
    return this.dayBlocks.some(b => b.startMinute <= minute && minute < b.endMinute);
  }

  pickType(minute: number, type: 'DEEP_WORK' | 'BREAK' | 'SCHEDULE') {
    const duration = this.activeDuration;
    const label = this.activeBlockName.trim() ||
      (type === 'DEEP_WORK' ? 'Deep Work' : type === 'BREAK' ? 'Break' : 'Schedule');
    this.activeSlot      = null;
    this.activeDuration  = 60;
    this.activeBlockName = '';
    this.errorMsg        = '';
    const payload: Omit<TimeBlock, 'id'> = {
      date: this.dayDate, startMinute: minute, endMinute: minute + duration, type, title: label,
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

  startDay() {
    const now = new Date();
    const currentMin = this.dayDate === this.fmt(now) ? now.getHours() * 60 + now.getMinutes() : 0;

    // Merge user blocks + non-allDay GCal events into one playlist
    const gcalAsBlocks: TimeBlock[] = this.gcalEvents
      .filter(e => !e.allDay)
      .map(e => ({ date: this.dayDate, startMinute: e.startMinute, endMinute: e.endMinute, type: (e.type ?? 'SCHEDULE') as TimeBlock['type'], title: e.title }));

    const combined = [...this.dayBlocks, ...gcalAsBlocks]
      .sort((a, b) => a.startMinute - b.startMinute);

    if (!combined.length) {
      this.errorMsg = 'No blocks scheduled. Add blocks or sync Google Calendar first.';
      return;
    }

    const idx = combined.findIndex(b => b.endMinute > currentMin);
    const playlist = combined.slice(idx >= 0 ? idx : 0);

    if (!playlist.length) {
      this.errorMsg = 'All blocks for today have already passed.';
      return;
    }

    const first = playlist[0];
    const totalMins = first.endMinute - first.startMinute;
    const isToday = this.dayDate === this.fmt(now);
    const remainingMins = (isToday && first.startMinute < currentMin)
      ? Math.max(first.endMinute - currentMin, 5)
      : totalMins;

    this.confirmBlock         = first;
    this.confirmTotalMins     = totalMins;
    this.confirmRemainingMins = remainingMins;
    this.pendingPlaylist      = playlist;
    this.showStartConfirm     = true;
  }

  executeStartDay() {
    this.showStartConfirm = false;
    const first = this.confirmBlock!;
    const duration = this.confirmRemainingMins;

    sessionStorage.setItem('tokispirit_day_playlist', JSON.stringify(this.pendingPlaylist.slice(1)));
    this.showDay = false;

    if (first.type === 'DEEP_WORK') {
      const adjusted: TimeBlock = { ...first, startMinute: first.endMinute - duration };
      this.openDW(adjusted, new MouseEvent('click'));
    } else if (first.type === 'BREAK') {
      this.router.navigate(['/timer'], { queryParams: { break: 'true', duration } });
    } else {
      this.router.navigate(['/timer'], { queryParams: { duration } });
    }
  }

  private currentMinute(): number {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  }

  private blockIsFuture(startMinute: number): boolean {
    if (this.dayDate !== this.fmt(new Date())) return false; // past/future dates: always allow
    return startMinute > this.currentMinute();
  }

  launchBlock(block: TimeBlock, e: MouseEvent) {
    e.stopPropagation();
    if (this.blockIsFuture(block.startMinute)) {
      this.errorMsg = `This block starts at ${this.disp(block.startMinute)} — you can't start it yet.`;
      return;
    }
    this.showDay = false;
    if (block.type === 'DEEP_WORK') {
      this.openDW(block, e);
    } else if (block.type === 'BREAK') {
      this.router.navigate(['/timer'], { queryParams: { break: 'true', duration: block.endMinute - block.startMinute } });
    } else {
      this.router.navigate(['/timer'], { queryParams: { duration: block.endMinute - block.startMinute } });
    }
  }

  cycleGCalType(evt: GCalEvent, _e: MouseEvent) {
    const order: ('DEEP_WORK' | 'BREAK' | 'SCHEDULE')[] = ['DEEP_WORK', 'BREAK', 'SCHEDULE'];
    evt.type = evt.type ? order[(order.indexOf(evt.type) + 1) % order.length] : 'DEEP_WORK';
  }

  launchGCalBlock(evt: GCalEvent, e: MouseEvent) {
    e.stopPropagation();
    if (this.blockIsFuture(evt.startMinute)) {
      this.errorMsg = `This event starts at ${this.disp(evt.startMinute)} — you can't start it yet.`;
      return;
    }
    this.showDay = false;
    const type = evt.type ?? 'SCHEDULE';
    if (type === 'BREAK') {
      this.router.navigate(['/timer'], { queryParams: { break: 'true', duration: evt.endMinute - evt.startMinute } });
    } else {
      this.router.navigate(['/timer'], { queryParams: { duration: evt.endMinute - evt.startMinute } });
    }
  }

  cycleBlockType(block: TimeBlock, e: MouseEvent) {
    e.stopPropagation();
    if (!block.id) return;
    const order: TimeBlock['type'][] = ['DEEP_WORK', 'BREAK', 'SCHEDULE'];
    const nextType = order[(order.indexOf(block.type) + 1) % order.length];
    const updated = { ...block, type: nextType };
    this.svc.updateBlock(block.id, updated)
      .pipe(catchError(() => of(null)))
      .subscribe(saved => {
        if (saved) {
          this.dayBlocks = this.dayBlocks.map(b => b.id === block.id ? saved : b);
          const cell = this.cells.find(c => c.date === this.dayDate);
          if (cell) cell.blocks = cell.blocks.map(b => b.id === block.id ? saved : b);
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
    const dur = block.endMinute - block.startMinute;
    const maxPomos = Math.max(1, Math.floor((dur + 5) / 30));
    this.dwBlock     = block;
    this.dwPomodoros = maxPomos;
    this.dwPreset    = 0;
    this.showDW      = true;
  }

  // Returns 2–4 session-count options that fit within the block, capped at max 4
  get dwOptions(): { sessions: number; minutes: number }[] {
    if (!this.dwBlock) return [];
    const dur = this.dwBlock.endMinute - this.dwBlock.startMinute;
    const maxPomos = Math.max(1, Math.floor((dur + 5) / 30));
    const opts: { sessions: number; minutes: number }[] = [];
    const lo = Math.max(1, maxPomos - 2);
    for (let n = lo; n <= Math.min(maxPomos, 8); n++) {
      // total time = 25n + 5(n-1) = 30n - 5
      opts.push({ sessions: n, minutes: 30 * n - 5 });
    }
    return opts;
  }

  launchDW() {
    this.showDW = false;
    this.router.navigate(['/timer'], {
      queryParams: { deepWork: 'true', pomodoros: this.dwPomodoros, preset: this.dwPreset },
    });
  }

  // ── Google Calendar ───────────────────────────────────────────────────────

  refreshGCal() {
    if (!this.gcalConnected || !this.dayDate) return;
    this.gcalLoading = true;
    this.gcalSvc.getEvents(this.dayDate).subscribe({
      next: e => { this.gcalEvents = e; this.gcalLoading = false; },
      error: () => { this.gcalLoading = false; this.handleGCalAuthError(); },
    });
  }

  private handleGCalAuthError() {
    this.gcalConnected = false;
    this.gcalEvents = [];
    this.errorMsg = 'Google Calendar session expired. Please reconnect.';
  }

  connectGCal() {
    this.gcalSvc.getAuthUrl().subscribe(r => { window.location.href = r.url; });
  }

  disconnectGCal() {
    this.gcalSvc.disconnect().subscribe(() => {
      this.gcalConnected = false;
      this.gcalEvents = [];
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
