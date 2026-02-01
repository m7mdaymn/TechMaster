import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DashboardService } from '../../../core/services/dashboard.service';
import { ToastrService } from 'ngx-toastr';

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
}

@Component({
  selector: 'app-admin-messages',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="messages-page">
      <div class="page-header">
        <div class="header-left">
          <h1>Contact Messages</h1>
          <p class="subtitle">Manage messages from the contact form</p>
        </div>
        <div class="header-stats">
          <div class="stat">
            <span class="stat-value">{{ totalMessages() }}</span>
            <span class="stat-label">Total</span>
          </div>
          <div class="stat unread">
            <span class="stat-value">{{ unreadCount() }}</span>
            <span class="stat-label">Unread</span>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="filters-bar">
        <div class="filter-tabs">
          <button 
            class="filter-tab" 
            [class.active]="activeFilter() === 'all'"
            (click)="activeFilter.set('all'); loadMessages()"
          >
            All Messages
          </button>
          <button 
            class="filter-tab" 
            [class.active]="activeFilter() === 'unread'"
            (click)="activeFilter.set('unread'); loadMessages()"
          >
            Unread
          </button>
          <button 
            class="filter-tab" 
            [class.active]="activeFilter() === 'read'"
            (click)="activeFilter.set('read'); loadMessages()"
          >
            Read
          </button>
        </div>

        <div class="search-box">
          <span class="search-icon">🔍</span>
          <input 
            type="text" 
            [(ngModel)]="searchQuery" 
            (ngModelChange)="filterMessages()"
            placeholder="Search messages..."
          >
        </div>
      </div>

      @if (loading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Loading messages...</p>
        </div>
      } @else if (filteredMessages().length === 0) {
        <div class="empty-state">
          <span class="empty-icon">📭</span>
          <h3>No Messages</h3>
          <p>No contact messages found</p>
        </div>
      } @else {
        <div class="messages-list">
          @for (message of filteredMessages(); track message.id) {
            <div class="message-card" [class.unread]="!message.isRead" (click)="viewMessage(message)">
              <div class="message-header">
                <div class="sender-info">
                  <div class="sender-avatar" [class.unread]="!message.isRead">
                    {{ message.name.charAt(0).toUpperCase() }}
                  </div>
                  <div class="sender-details">
                    <h4>{{ message.name }}</h4>
                    <span class="email">{{ message.email }}</span>
                  </div>
                </div>
                <div class="message-meta">
                  <span class="date">{{ formatDate(message.createdAt) }}</span>
                  @if (!message.isRead) {
                    <span class="unread-badge">New</span>
                  }
                </div>
              </div>
              <div class="message-subject">
                <strong>{{ message.subject }}</strong>
              </div>
              <div class="message-preview">
                {{ message.message.substring(0, 150) }}{{ message.message.length > 150 ? '...' : '' }}
              </div>
              <div class="message-actions">
                @if (!message.isRead) {
                  <button class="action-btn" title="Mark as read" (click)="markAsRead(message, $event)">
                    ✓ Mark Read
                  </button>
                }
                <button class="action-btn danger" title="Delete" (click)="deleteMessage(message, $event)">
                  🗑️ Delete
                </button>
              </div>
            </div>
          }
        </div>
      }

      <!-- Message Detail Modal -->
      @if (selectedMessage()) {
        <div class="modal-overlay" (click)="selectedMessage.set(null)">
          <div class="modal-content" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>Message Details</h2>
              <button class="close-btn" (click)="selectedMessage.set(null)">✕</button>
            </div>
            <div class="modal-body">
              <div class="detail-row">
                <label>From:</label>
                <span>{{ selectedMessage()?.name }}</span>
              </div>
              <div class="detail-row">
                <label>Email:</label>
                <a [href]="'mailto:' + selectedMessage()?.email">{{ selectedMessage()?.email }}</a>
              </div>
              @if (selectedMessage()?.phone) {
                <div class="detail-row">
                  <label>Phone:</label>
                  <a [href]="'tel:' + selectedMessage()?.phone">{{ selectedMessage()?.phone }}</a>
                </div>
              }
              <div class="detail-row">
                <label>Subject:</label>
                <span>{{ selectedMessage()?.subject }}</span>
              </div>
              <div class="detail-row">
                <label>Date:</label>
                <span>{{ selectedMessage()?.createdAt | date:'medium' }}</span>
              </div>
              <div class="detail-row full">
                <label>Message:</label>
                <div class="message-body">{{ selectedMessage()?.message }}</div>
              </div>
            </div>
            <div class="modal-footer">
              <a [href]="'mailto:' + selectedMessage()?.email + '?subject=Re: ' + selectedMessage()?.subject" class="reply-btn">
                ✉️ Reply via Email
              </a>
              <button class="close-modal-btn" (click)="selectedMessage.set(null)">Close</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .messages-page {
      padding: 24px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 24px;
    }

    .page-header h1 {
      font-size: 1.75rem;
      font-weight: 700;
      color: #1f2937;
      margin: 0 0 4px 0;
    }

    .subtitle {
      color: #6b7280;
      margin: 0;
    }

    .header-stats {
      display: flex;
      gap: 24px;
    }

    .stat {
      text-align: center;
      padding: 12px 24px;
      background: #f9fafb;
      border-radius: 12px;
    }

    .stat.unread {
      background: #fef2f2;
    }

    .stat-value {
      display: block;
      font-size: 1.5rem;
      font-weight: 700;
      color: #247090;
    }

    .stat.unread .stat-value {
      color: #dc2626;
    }

    .stat-label {
      font-size: 0.875rem;
      color: #6b7280;
    }

    .filters-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      margin-bottom: 24px;
      flex-wrap: wrap;
    }

    .filter-tabs {
      display: flex;
      gap: 8px;
    }

    .filter-tab {
      padding: 8px 16px;
      border: none;
      background: #f3f4f6;
      border-radius: 8px;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }

    .filter-tab:hover {
      background: #e5e7eb;
    }

    .filter-tab.active {
      background: #247090;
      color: white;
    }

    .search-box {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      min-width: 250px;
    }

    .search-box input {
      border: none;
      outline: none;
      flex: 1;
      font-size: 0.875rem;
    }

    .loading-state, .empty-state {
      text-align: center;
      padding: 60px 20px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid #e5e7eb;
      border-top-color: #247090;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 16px;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .empty-icon {
      font-size: 3rem;
      display: block;
      margin-bottom: 16px;
    }

    .empty-state h3 {
      margin: 0 0 8px;
      color: #1f2937;
    }

    .empty-state p {
      color: #6b7280;
      margin: 0;
    }

    .messages-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .message-card {
      background: white;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      cursor: pointer;
      transition: all 0.2s;
      border-left: 4px solid transparent;
    }

    .message-card:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      transform: translateY(-2px);
    }

    .message-card.unread {
      border-left-color: #247090;
      background: #f0f9ff;
    }

    .message-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 12px;
    }

    .sender-info {
      display: flex;
      gap: 12px;
      align-items: center;
    }

    .sender-avatar {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: #e5e7eb;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
      font-weight: 600;
      color: #6b7280;
    }

    .sender-avatar.unread {
      background: #247090;
      color: white;
    }

    .sender-details h4 {
      margin: 0 0 4px;
      font-size: 1rem;
      color: #1f2937;
    }

    .email {
      color: #6b7280;
      font-size: 0.875rem;
    }

    .message-meta {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 4px;
    }

    .date {
      color: #9ca3af;
      font-size: 0.75rem;
    }

    .unread-badge {
      background: #dc2626;
      color: white;
      padding: 2px 8px;
      border-radius: 10px;
      font-size: 0.7rem;
      font-weight: 600;
    }

    .message-subject {
      margin-bottom: 8px;
      color: #1f2937;
    }

    .message-preview {
      color: #6b7280;
      font-size: 0.875rem;
      line-height: 1.5;
      margin-bottom: 16px;
    }

    .message-actions {
      display: flex;
      gap: 8px;
      border-top: 1px solid #f3f4f6;
      padding-top: 12px;
    }

    .action-btn {
      padding: 6px 12px;
      border: 1px solid #e5e7eb;
      background: white;
      border-radius: 6px;
      font-size: 0.8rem;
      cursor: pointer;
      transition: all 0.2s;
    }

    .action-btn:hover {
      background: #f9fafb;
    }

    .action-btn.danger:hover {
      background: #fef2f2;
      border-color: #fecaca;
      color: #dc2626;
    }

    /* Modal Styles */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 20px;
    }

    .modal-content {
      background: white;
      border-radius: 16px;
      max-width: 600px;
      width: 100%;
      max-height: 90vh;
      overflow: auto;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 24px;
      border-bottom: 1px solid #e5e7eb;
    }

    .modal-header h2 {
      margin: 0;
      font-size: 1.25rem;
    }

    .close-btn {
      width: 32px;
      height: 32px;
      border: none;
      background: #f3f4f6;
      border-radius: 50%;
      cursor: pointer;
      font-size: 1rem;
    }

    .close-btn:hover {
      background: #e5e7eb;
    }

    .modal-body {
      padding: 24px;
    }

    .detail-row {
      display: flex;
      gap: 12px;
      margin-bottom: 16px;
    }

    .detail-row label {
      font-weight: 600;
      color: #6b7280;
      min-width: 80px;
    }

    .detail-row a {
      color: #247090;
      text-decoration: none;
    }

    .detail-row a:hover {
      text-decoration: underline;
    }

    .detail-row.full {
      flex-direction: column;
    }

    .message-body {
      margin-top: 8px;
      padding: 16px;
      background: #f9fafb;
      border-radius: 8px;
      line-height: 1.6;
      white-space: pre-wrap;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding: 16px 24px;
      border-top: 1px solid #e5e7eb;
    }

    .reply-btn {
      padding: 10px 20px;
      background: #247090;
      color: white;
      border: none;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 500;
      cursor: pointer;
    }

    .reply-btn:hover {
      background: #1a5570;
    }

    .close-modal-btn {
      padding: 10px 20px;
      background: #f3f4f6;
      border: none;
      border-radius: 8px;
      cursor: pointer;
    }

    .close-modal-btn:hover {
      background: #e5e7eb;
    }
  `]
})
export class AdminMessagesComponent implements OnInit {
  private dashboardService = inject(DashboardService);
  private toastr = inject(ToastrService);

  messages = signal<ContactMessage[]>([]);
  filteredMessages = signal<ContactMessage[]>([]);
  loading = signal(true);
  selectedMessage = signal<ContactMessage | null>(null);
  activeFilter = signal<'all' | 'unread' | 'read'>('all');
  searchQuery = '';

  ngOnInit() {
    this.loadMessages();
  }

  loadMessages() {
    this.loading.set(true);
    const isRead = this.activeFilter() === 'all' ? undefined : this.activeFilter() === 'read';
    
    this.dashboardService.getContactMessages(1, 100, isRead).subscribe({
      next: (response) => {
        if (response.isSuccess && response.data) {
          const messages: ContactMessage[] = response.data.map((m: any) => ({
            id: m.id,
            name: m.name,
            email: m.email,
            phone: m.phone,
            subject: m.subject,
            message: m.message,
            isRead: m.isRead,
            createdAt: new Date(m.createdAt)
          }));
          this.messages.set(messages);
          this.filterMessages();
        }
        this.loading.set(false);
      },
      error: () => {
        this.toastr.error('Failed to load messages');
        this.loading.set(false);
      }
    });
  }

  filterMessages() {
    let result = this.messages();
    
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      result = result.filter(m =>
        m.name.toLowerCase().includes(query) ||
        m.email.toLowerCase().includes(query) ||
        m.subject.toLowerCase().includes(query) ||
        m.message.toLowerCase().includes(query)
      );
    }
    
    this.filteredMessages.set(result);
  }

  totalMessages() {
    return this.messages().length;
  }

  unreadCount() {
    return this.messages().filter(m => !m.isRead).length;
  }

  viewMessage(message: ContactMessage) {
    this.selectedMessage.set(message);
    if (!message.isRead) {
      this.markAsRead(message);
    }
  }

  markAsRead(message: ContactMessage, event?: Event) {
    event?.stopPropagation();
    
    this.dashboardService.markMessageAsRead(message.id).subscribe({
      next: (response) => {
        if (response.isSuccess) {
          message.isRead = true;
          this.toastr.success('Marked as read');
          this.filterMessages();
        }
      },
      error: () => {
        this.toastr.error('Failed to update message');
      }
    });
  }

  deleteMessage(message: ContactMessage, event: Event) {
    event.stopPropagation();
    
    if (!confirm('Are you sure you want to delete this message?')) {
      return;
    }
    
    this.dashboardService.deleteContactMessage(message.id).subscribe({
      next: (response) => {
        if (response.isSuccess) {
          this.messages.update(msgs => msgs.filter(m => m.id !== message.id));
          this.filterMessages();
          this.toastr.success('Message deleted');
        }
      },
      error: () => {
        this.toastr.error('Failed to delete message');
      }
    });
  }

  formatDate(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return new Date(date).toLocaleDateString();
  }
}
