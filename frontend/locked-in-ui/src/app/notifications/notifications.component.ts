import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.css']
})
export class NotificationsComponent {
  @Output() closePanel = new EventEmitter<void>();

  notifications: any[] = [];

  closeNotifications(): void {
    this.closePanel.emit();
  }
}
