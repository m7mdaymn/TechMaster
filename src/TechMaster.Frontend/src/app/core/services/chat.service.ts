import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '@environments/environment';

export interface ChatRoom {
  id: string;
  name: string;
  nameAr: string;
  type: 'Course' | 'Support' | 'Private';
  courseId?: string;
  courseName?: string;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount: number;
  participantCount: number;
  participants?: ChatParticipant[];
}

export interface ChatParticipant {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  role: string;
  isOnline: boolean;
  joinedAt: string;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  type: 'Text' | 'Image' | 'File' | 'System';
  createdAt: string;
  isRead: boolean;
  metadata?: any;
}

export interface SendMessageRequest {
  content: string;
  type?: 'Text' | 'Image' | 'File';
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
export class ChatService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/chat`;
  
  // Reactive state
  activeRoom = signal<ChatRoom | null>(null);
  rooms = signal<ChatRoom[]>([]);
  messages = signal<ChatMessage[]>([]);
  totalUnread = signal(0);

  getRooms(): Observable<ChatRoom[]> {
    return this.http.get<ApiResponse<ChatRoom[]>>(`${this.API_URL}/rooms`)
      .pipe(map(res => res.data || []));
  }

  getRoom(roomId: string): Observable<ChatRoom> {
    return this.http.get<ApiResponse<ChatRoom>>(`${this.API_URL}/rooms/${roomId}`)
      .pipe(map(res => res.data));
  }

  joinRoom(roomId: string): Observable<void> {
    return this.http.post<void>(`${this.API_URL}/rooms/${roomId}/join`, {});
  }

  leaveRoom(roomId: string): Observable<void> {
    return this.http.post<void>(`${this.API_URL}/rooms/${roomId}/leave`, {});
  }

  getMessages(roomId: string, page = 1, pageSize = 50): Observable<PaginatedList<ChatMessage>> {
    const params = new HttpParams()
      .set('pageNumber', page.toString())
      .set('pageSize', pageSize.toString());
    
    return this.http.get<ApiResponse<PaginatedList<ChatMessage>>>(`${this.API_URL}/rooms/${roomId}/messages`, { params })
      .pipe(map(res => res.data));
  }

  sendMessage(roomId: string, request: SendMessageRequest): Observable<ChatMessage> {
    return this.http.post<ApiResponse<ChatMessage>>(`${this.API_URL}/rooms/${roomId}/messages`, request)
      .pipe(map(res => res.data));
  }

  markRoomAsRead(roomId: string): Observable<void> {
    return this.http.post<void>(`${this.API_URL}/rooms/${roomId}/read`, {});
  }

  createCourseRoom(courseId: string): Observable<ChatRoom> {
    return this.http.post<ApiResponse<ChatRoom>>(`${this.API_URL}/rooms/course`, { courseId })
      .pipe(map(res => res.data));
  }

  refreshRooms(): void {
    this.getRooms().subscribe({
      next: (rooms) => {
        this.rooms.set(rooms);
        this.totalUnread.set(rooms.reduce((sum, r) => sum + (r.unreadCount || 0), 0));
      },
      error: () => {} // Silently fail
    });
  }
}
