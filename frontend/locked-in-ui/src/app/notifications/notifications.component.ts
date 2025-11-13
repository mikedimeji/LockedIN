// notifications.component.ts
import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Notification {
  id: number;
  title: string;
  message: string;
  date: string;
  type: 'update' | 'feature' | 'maintenance' | 'event';
  isNew: boolean;
  icon: string;
}

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.css']
})
export class NotificationsComponent {
  @Output() closePanel = new EventEmitter<void>();

  notifications: Notification[] = [
    {
      id: 1,
      title: 'New Theme Pack Released!',
      message: 'Check out our latest cyberpunk theme collection with animated backgrounds.',
      date: '2025-06-30',
      type: 'feature',
      isNew: true,
      icon: '🎨'
    },
    {
      id: 2,
      title: 'Gold Coin Animation Updated',
      message: 'Your gold coins now have smoother animations and better visual effects.',
      date: '2025-06-29',
      type: 'update',
      isNew: true,
      icon: '🪙'
    },
    {
      id: 3,
      title: 'Maintenance Scheduled',
      message: 'Planned maintenance window: July 1st, 2:00 AM - 4:00 AM EST.',
      date: '2025-06-28',
      type: 'maintenance',
      isNew: false,
      icon: '🔧'
    }
  ];

  getNotificationIcon(type: string): string {
    switch(type) {
      case 'update': return '⚡';
      case 'feature': return '✨';
      case 'maintenance': return '🔧';
      case 'event': return '🎉';
      default: return '📢';
    }
  }

  markAsRead(notification: Notification): void {
    notification.isNew = false;
  }

  clearAll(): void {
    this.notifications.forEach(n => n.isNew = false);
  }

  closeNotifications(): void {
    this.closePanel.emit();
  }
}
