import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { InstructorService, NotificationDto } from '@core/services/instructor.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-instructor-notifications',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="notifications-page">
      <div class="page-header">
        <div class="header-left">
          <h1>Notifications</h1>
          <p class="subtitle">Stay updated with your course activities</p>
        </div>
        <div class="header-actions">
          @if (notifications().length > 0) {
            <button class="mark-all-btn" (click)="markAllAsRead()">
              <span class="material-icons">done_all</span>
              Mark All as Read
            </button>
          }
        </div>
      </div>

      @if (loading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Loading notifications...</p>
        </div>
      } @else if (notifications().length === 0) {
        <div class="empty-state">
          <span class="empty-icon">🔔</span>
          <h3>No Notifications</h3>
          <p>You're all caught up! Check back later for updates.</p>
        </div>
      } @else {
        <div class="notifications-list">
          @for (notification of notifications(); track notification.id) {
            <div class="notification-item" [class.unread]="!notification.isRead" (click)="markAsRead(notification)">
              <div class="notification-icon" [class]="getNotificationIconClass(notification.type)">
                <span class="material-icons">{{ getNotificationIcon(notification.type) }}</span>
              </div>
              <div class="notification-content">
                <h4>{{ notification.title }}</h4>
                <p>{{ notification.message }}</p>
                <span class="notification-time">{{ formatTime(notification.createdAt) }}</span>
              </div>
              @if (notification.link) {
                <a [routerLink]="notification.link" class="notification-action">
                  <span class="material-icons">arrow_forward</span>
                </a>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .notifications-page {
      max-width: 800px;
      margin: 0 auto;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 2rem;
    }

    .page-header h1 {
      font-size: 1.75rem;
      font-weight: 700;
      color: #1e293b;
      margin-bottom: 0.5rem;
    }

    .subtitle {
      color: #64748b;
      font-size: 0.95rem;
    }

    .mark-all-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 16px;
      background: #3b82f6;
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 500;
      transition: background 0.2s;
    }

    .mark-all-btn:hover {
      background: #2563eb;
    }

    .loading-state, .empty-state {
      text-align: center;
      padding: 4rem 2rem;
      background: white;
      border-radius: 12px;
    }

    .empty-icon {
      font-size: 4rem;
      display: block;
      margin-bottom: 1rem;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid #e2e8f0;
      border-top-color: #3b82f6;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 1rem;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .notifications-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .notification-item {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      padding: 16px 20px;
      background: white;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.2s;
      border-left: 4px solid transparent;
    }

    .notification-item:hover {
      transform: translateX(4px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    }

    .notification-item.unread {
      border-left-color: #3b82f6;
      background: linear-gradient(135deg, #eff6ff 0%, white 50%);
    }

    .notification-icon {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .notification-icon.enrollment {
      background: #dcfce7;
      color: #16a34a;
    }

    .notification-icon.review {
      background: #fef3c7;
      color: #d97706;
    }

    .notification-icon.message {
      background: #dbeafe;
      color: #2563eb;
    }

    .notification-icon.system {
      background: #f1f5f9;
      color: #64748b;
    }

    .notification-content {
      flex: 1;
      min-width: 0;
    }

    .notification-content h4 {
      font-size: 1rem;
      font-weight: 600;
      color: #1e293b;
      margin-bottom: 4px;
    }

    .notification-content p {
      color: #64748b;
      font-size: 0.9rem;
      margin-bottom: 8px;
      line-height: 1.4;
    }

    .notification-time {
      font-size: 0.8rem;
      color: #94a3b8;
    }

    .notification-action {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: #f1f5f9;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #64748b;
      transition: all 0.2s;
    }

    .notification-action:hover {
      background: #3b82f6;
      color: white;
    }
  `]
})
export class InstructorNotificationsComponent implements OnInit {
  private instructorService = inject(InstructorService);
  private toastr = inject(ToastrService);

  notifications = signal<NotificationDto[]>([]);
  loading = signal(true);

  ngOnInit() {
    this.loadNotifications();
  }

  loadNotifications() {
    this.loading.set(true);
    this.instructorService.getNotifications(50).subscribe({
      next: (notifications) => {
        this.notifications.set(notifications);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  markAsRead(notification: NotificationDto) {
    if (!notification.isRead) {
      this.instructorService.markNotificationAsRead(notification.id).subscribe({
        next: (success) => {
          if (success) {
            this.notifications.update(list =>
              list.map(n => n.id === notification.id ? { ...n, isRead: true } : n)
            );
          }
        }
      });
    }
  }

  markAllAsRead() {
    this.instructorService.markAllNotificationsAsRead().subscribe({
      next: (success) => {
        if (success) {
          this.notifications.update(list =>
            list.map(n => ({ ...n, isRead: true }))
          );
          this.toastr.success('All notifications marked as read');
        }
      }
    });
  }

  getNotificationIcon(type: string): string {
    switch (type?.toLowerCase()) {
      case 'enrollment': return 'person_add';
      case 'review': return 'star';
      case 'message': return 'chat';
      case 'payment': return 'payments';
      default: return 'notifications';
    }
  }

  getNotificationIconClass(type: string): string {
    switch (type?.toLowerCase()) {
      case 'enrollment': return 'enrollment';
      case 'review': return 'review';
      case 'message': return 'message';
      default: return 'system';
    }
  }

  formatTime(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  }
}
