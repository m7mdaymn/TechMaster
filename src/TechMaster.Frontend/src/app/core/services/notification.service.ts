import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '@environments/environment';

export interface Notification {
  id: string;
  title: string;
  titleAr: string;
  message: string;
  messageAr: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  actionUrl?: string;
  metadata?: any;
}

export interface ApiResponse<T> {
  isSuccess: boolean;
  data: T;
  messageEn?: string;
  messageAr?: string;
}

export interface PaginatedList<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/notifications`;
  
  // Reactive state for unread count
  unreadCount = signal(0);

  getNotifications(page = 1, pageSize = 10): Observable<PaginatedList<Notification>> {
    const params = new HttpParams()
      .set('pageNumber', page.toString())
      .set('pageSize', pageSize.toString());
    
    return this.http.get<ApiResponse<PaginatedList<Notification>>>(this.API_URL, { params })
      .pipe(map(res => res.data));
  }

  getUnreadCount(): Observable<number> {
    return this.http.get<ApiResponse<{ count: number }>>(`${this.API_URL}/unread-count`)
      .pipe(
        map(res => res.data?.count || 0)
      );
  }

  refreshUnreadCount(): void {
    this.getUnreadCount().subscribe({
      next: (count) => this.unreadCount.set(count),
      error: () => {} // Silently fail
    });
  }

  markAsRead(notificationId: string): Observable<void> {
    return this.http.post<void>(`${this.API_URL}/${notificationId}/read`, {});
  }

  markAllAsRead(): Observable<void> {
    return this.http.post<void>(`${this.API_URL}/read-all`, {});
  }

  deleteNotification(notificationId: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${notificationId}`);
  }
}
