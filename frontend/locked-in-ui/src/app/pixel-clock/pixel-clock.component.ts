import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pixel-clock',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pixel-clock.component.html',
  styleUrls: ['./pixel-clock.component.css']
})
export class PixelClockComponent implements OnInit, OnDestroy {
  currentTime: Date = new Date();
  formattedTime: any = {};
  is24Hour: boolean = false;
  isMinimized: boolean = false;
  
  currentDay: string = '';
  currentMonth: string = '';
  currentDate: number = 0;
  
  private intervalId: any;
  
  private dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  private monthNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

  ngOnInit(): void {
    this.updateTime();
    this.intervalId = setInterval(() => {
      this.updateTime();
    }, 1000);
  }

  ngOnDestroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  private updateTime(): void {
    this.currentTime = new Date();
    this.formattedTime = this.formatTime(this.currentTime);
    this.updateDateInfo();
  }

  private formatTime(date: Date): any {
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();
    let ampm = '';

    if (!this.is24Hour) {
      ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12; // the hour '0' should be '12'
    }

    return {
      hours: hours.toString().padStart(2, '0'),
      minutes: minutes.toString().padStart(2, '0'),
      seconds: seconds.toString().padStart(2, '0'),
      ampm: ampm
    };
  }

  private updateDateInfo(): void {
    this.currentDay = this.dayNames[this.currentTime.getDay()];
    this.currentMonth = this.monthNames[this.currentTime.getMonth()];
    this.currentDate = this.currentTime.getDate();
  }

  toggle24Hour(): void {
    this.is24Hour = !this.is24Hour;
    this.updateTime();
  }

  toggleMinimized(): void {
    this.isMinimized = !this.isMinimized;
  }
}
