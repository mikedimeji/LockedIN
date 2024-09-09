import { Component, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, NgIf, NgClass } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-timer',
  standalone: true,
  templateUrl: './timer.component.html',
  styleUrls: ['./timer.component.css'],
  imports: [
    NgClass,
    NgIf
  ]
})
export class TimerComponent {

  minutes: number = 25;
  seconds: number = 0;
  hours: number = 0;
  private intervalId: any;
  isRunning: boolean = false;
  isExpanded: boolean = false;
  private audio: HTMLAudioElement | null = null;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    public dialog: MatDialog
  ) {
    // Only create the audio object if we're running in the browser
    if (isPlatformBrowser(this.platformId)) {
      this.audio = new Audio('/assets/sounds/soundbit.wav');
    }
  }

  startTimer(): void {
    if (!this.isRunning) {
      this.isRunning = true;
      this.isExpanded = true;
      if (this.audio) {
        this.audio.play();
      }
      this.intervalId = setInterval(() => {
        this.countDown();
      }, 1000);
    }
  }

  pauseTimer(): void {
    if (this.isRunning) {
      this.isRunning = false;
      clearInterval(this.intervalId);
    } else {
      this.startTimer();
    }
  }

  openConfirmDialog(): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent);

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.resetTimer();
      }
    });
  }

  resetTimer(): void {
    this.pauseTimer();
    this.hours = 0;
    this.minutes = 25;
    this.seconds = 0;
    this.isExpanded = false;  // Collapse the timer back to the original state
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
        this.pauseTimer();
      }
    }
  }

  handleInputChange(event: any, timeType: 'hours' | 'minutes' | 'seconds'): void {
    const value = parseInt(event.target.value, 10);
    if (!isNaN(value)) {
      this[timeType] = value;
    }
    event.target.value = this.formatTime(this[timeType]);
  }

  formatTime(time: number): string {
    return time < 10 ? '0' + time : time.toString();
  }
}





