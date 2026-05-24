import { Component, OnInit } from '@angular/core';
import { NgFor, NgIf, NgClass, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { catchError, of } from 'rxjs';

import { ScheduleService, TimeBlock } from './schedule.service';
import { PremiumService } from '../premium.service';

const GRID_START = 6 * 60;  // 6:00am in minutes
const GRID_END   = 24 * 60; // midnight
const GRID_SPAN  = GRID_END - GRID_START;

interface BlockForm {
  title: string;
  type: 'DEEP_WORK' | 'BREAK' | 'SCHEDULE';
  startMinute: number;
  endMinute: number;
  pomodoroCount: number;
}

@Component({
  selector: 'app-schedule',
  standalone: true,
  templateUrl: './schedule.component.html',
  styleUrls: ['./schedule.component.css'],
  imports: [NgFor, NgIf, NgClass, FormsModule, DatePipe],
})
export class ScheduleComponent implements OnInit {

  isPremium = false;
  selectedDate: string = this.todayStr();
  blocks: TimeBlock[] = [];
  loading = false;

  // Create/edit dialog
  showDialog = false;
  editingId: number | null = null;
  form: BlockForm = this.emptyForm(GRID_START);

  // Deep work launch dialog
  showDeepWorkDialog = false;
  deepWorkBlock: TimeBlock | null = null;
  deepWorkPomodoros = 2;
  deepWorkPreset = 0; // index into presets
  readonly presets = [
    { label: '25m', minutes: 25 },
    { label: '45m', minutes: 45 },
    { label: '1h',  minutes: 60 },
  ];

  readonly hours = Array.from({ length: 18 }, (_, i) => i + 6); // 6–23

  readonly blockTypes: { value: 'DEEP_WORK' | 'BREAK' | 'SCHEDULE'; label: string }[] = [
    { value: 'DEEP_WORK', label: 'Deep Work' },
    { value: 'BREAK',     label: 'Break' },
    { value: 'SCHEDULE',  label: 'Schedule' },
  ];

  constructor(
    private scheduleService: ScheduleService,
    private premiumService: PremiumService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.premiumService.getStatus().subscribe({
      next: s => { this.isPremium = s.isPremium; if (this.isPremium) this.loadBlocks(); },
      error: () => {},
    });
  }

  loadBlocks(): void {
    this.loading = true;
    this.scheduleService.getBlocks(this.selectedDate).pipe(catchError(() => of([]))).subscribe(blocks => {
      this.blocks = blocks;
      this.loading = false;
    });
  }

  onDateChange(): void {
    this.loadBlocks();
  }

  prevDay(): void {
    const d = new Date(this.selectedDate);
    d.setDate(d.getDate() - 1);
    this.selectedDate = this.formatDate(d);
    this.loadBlocks();
  }

  nextDay(): void {
    const d = new Date(this.selectedDate);
    d.setDate(d.getDate() + 1);
    this.selectedDate = this.formatDate(d);
    this.loadBlocks();
  }

  goToday(): void {
    this.selectedDate = this.todayStr();
    this.loadBlocks();
  }

  // ── Grid interaction ──────────────────────────────────────────────────────

  onHourClick(hour: number): void {
    const startMinute = hour * 60;
    this.form = this.emptyForm(startMinute);
    this.editingId = null;
    this.showDialog = true;
  }

  editBlock(block: TimeBlock, event: MouseEvent): void {
    event.stopPropagation();
    this.form = {
      title: block.title,
      type: block.type,
      startMinute: block.startMinute,
      endMinute: block.endMinute,
      pomodoroCount: 2,
    };
    this.editingId = block.id ?? null;
    this.showDialog = true;
  }

  deleteBlock(block: TimeBlock, event: MouseEvent): void {
    event.stopPropagation();
    if (block.id == null) return;
    this.scheduleService.deleteBlock(block.id).pipe(catchError(() => of(null))).subscribe(() => {
      this.blocks = this.blocks.filter(b => b.id !== block.id);
    });
  }

  saveBlock(): void {
    if (this.form.endMinute <= this.form.startMinute) {
      this.form.endMinute = this.form.startMinute + 60;
    }

    const payload: Omit<TimeBlock, 'id'> = {
      date: this.selectedDate,
      startMinute: this.form.startMinute,
      endMinute: this.form.endMinute,
      type: this.form.type,
      title: this.form.title.trim() || this.labelForType(this.form.type),
    };

    if (this.editingId != null) {
      this.scheduleService.updateBlock(this.editingId, payload).pipe(catchError(() => of(null))).subscribe(updated => {
        if (updated) {
          this.blocks = this.blocks.map(b => b.id === this.editingId ? updated : b);
        }
        this.closeDialog();
      });
    } else {
      this.scheduleService.createBlock(payload).pipe(catchError(() => of(null))).subscribe(created => {
        if (created) this.blocks = [...this.blocks, created];
        this.closeDialog();
      });
    }
  }

  closeDialog(): void {
    this.showDialog = false;
    this.editingId = null;
  }

  // ── Deep work launch ──────────────────────────────────────────────────────

  openDeepWork(block: TimeBlock, event: MouseEvent): void {
    event.stopPropagation();
    this.deepWorkBlock = block;
    const durationMins = block.endMinute - block.startMinute;
    this.deepWorkPomodoros = Math.max(1, Math.floor(durationMins / 25));
    this.deepWorkPreset = 0;
    this.showDeepWorkDialog = true;
  }

  launchDeepWork(): void {
    this.showDeepWorkDialog = false;
    this.router.navigate(['/timer'], {
      queryParams: {
        deepWork: 'true',
        pomodoros: this.deepWorkPomodoros,
        preset: this.deepWorkPreset,
      },
    });
  }

  // ── Block layout helpers ──────────────────────────────────────────────────

  blockTop(block: TimeBlock): number {
    return ((block.startMinute - GRID_START) / GRID_SPAN) * 100;
  }

  blockHeight(block: TimeBlock): number {
    return ((block.endMinute - block.startMinute) / GRID_SPAN) * 100;
  }

  labelForType(type: string): string {
    return type === 'DEEP_WORK' ? 'Deep Work' : type === 'BREAK' ? 'Break' : 'Schedule';
  }

  minuteOptions(): { value: number; label: string }[] {
    const opts = [];
    for (let m = GRID_START; m < GRID_END; m += 15) {
      opts.push({ value: m, label: this.scheduleService.minutesToDisplay(m) });
    }
    return opts;
  }

  displayTime(minutes: number): string {
    return this.scheduleService.minutesToDisplay(minutes);
  }

  isToday(): boolean {
    return this.selectedDate === this.todayStr();
  }

  private todayStr(): string {
    return this.formatDate(new Date());
  }

  private formatDate(d: Date): string {
    return d.toISOString().split('T')[0];
  }

  private emptyForm(startMinute: number): BlockForm {
    return { title: '', type: 'DEEP_WORK', startMinute, endMinute: startMinute + 60, pomodoroCount: 2 };
  }
}
