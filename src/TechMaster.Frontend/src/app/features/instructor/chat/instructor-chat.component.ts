import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InstructorService, ChatRoom, ChatMessage } from '@core/services/instructor.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-instructor-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="chat-page">
      <div class="chat-container">
        <!-- Rooms Sidebar -->
        <aside class="rooms-sidebar">
          <div class="sidebar-header">
            <h2>Messages</h2>
          </div>
          <div class="rooms-list">
            @for (room of chatRooms(); track room.id) {
              <div class="room-item" [class.active]="selectedRoom()?.id === room.id" (click)="selectRoom(room)">
                <div class="room-avatar">
                  <span class="material-icons">groups</span>
                </div>
                <div class="room-info">
                  <span class="room-name">{{ room.name }}</span>
                  @if (room.lastMessage) {
                    <span class="last-message">{{ room.lastMessage.content | slice:0:40 }}...</span>
                  }
                </div>
                @if (room.unreadCount > 0) {
                  <span class="unread-badge">{{ room.unreadCount }}</span>
                }
              </div>
            } @empty {
              <div class="empty-rooms">
                <span class="material-icons">forum</span>
                <p>No chat rooms yet</p>
              </div>
            }
          </div>
        </aside>

        <!-- Chat Area -->
        <main class="chat-main">
          @if (selectedRoom()) {
            <div class="chat-header">
              <div class="chat-title">
                <h3>{{ selectedRoom()?.name }}</h3>
                @if (selectedRoom()?.courseName) {
                  <span class="course-name">{{ selectedRoom()?.courseName }}</span>
                }
              </div>
              <div class="chat-actions">
                <span class="participant-count">
                  <span class="material-icons">people</span>
                  {{ selectedRoom()?.participantCount }} participants
                </span>
              </div>
            </div>

            <div class="messages-container" #messagesContainer>
              @for (message of messages(); track message.id) {
                <div class="message" [class.own]="isOwnMessage(message)">
                  @if (!isOwnMessage(message)) {
                    <div class="message-avatar">
                      @if (message.senderPhotoUrl) {
                        <img [src]="message.senderPhotoUrl" alt="">
                      } @else {
                        <span>{{ message.senderName.charAt(0) }}</span>
                      }
                    </div>
                  }
                  <div class="message-content">
                    @if (!isOwnMessage(message)) {
                      <span class="sender-name">{{ message.senderName }}</span>
                    }
                    <div class="message-bubble">{{ message.content }}</div>
                    <span class="message-time">{{ formatTime(message.createdAt) }}</span>
                  </div>
                </div>
              } @empty {
                <div class="no-messages">
                  <span class="material-icons">chat_bubble_outline</span>
                  <p>No messages yet. Start the conversation!</p>
                </div>
              }
            </div>

            <div class="message-input">
              <input
                type="text"
                [(ngModel)]="newMessage"
                placeholder="Type a message..."
                (keyup.enter)="sendMessage()"
              >
              <button class="send-btn" (click)="sendMessage()" [disabled]="!newMessage.trim()">
                <span class="material-icons">send</span>
              </button>
            </div>
          } @else {
            <div class="no-room-selected">
              <span class="material-icons">chat</span>
              <h3>Select a conversation</h3>
              <p>Choose a chat room from the sidebar to start messaging</p>
            </div>
          }
        </main>
      </div>
    </div>
  `,
  styles: [`
    .chat-page {
      height: calc(100vh - 140px);
      margin: -32px;
    }

    .chat-container {
      display: flex;
      height: 100%;
      background: white;
    }

    .rooms-sidebar {
      width: 320px;
      border-right: 1px solid #e2e8f0;
      display: flex;
      flex-direction: column;
    }

    .sidebar-header {
      padding: 20px;
      border-bottom: 1px solid #e2e8f0;
    }

    .sidebar-header h2 {
      font-size: 1.25rem;
      font-weight: 600;
      margin: 0;
    }

    .rooms-list {
      flex: 1;
      overflow-y: auto;
    }

    .room-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px 20px;
      cursor: pointer;
      transition: background 0.2s;
      border-bottom: 1px solid #f1f5f9;
    }

    .room-item:hover {
      background: #f8fafc;
    }

    .room-item.active {
      background: #eff6ff;
      border-left: 3px solid #3b82f6;
    }

    .room-avatar {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    }

    .room-info {
      flex: 1;
      min-width: 0;
    }

    .room-name {
      display: block;
      font-weight: 600;
      color: #1e293b;
      margin-bottom: 4px;
    }

    .last-message {
      display: block;
      font-size: 0.85rem;
      color: #64748b;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .unread-badge {
      background: #ef4444;
      color: white;
      font-size: 0.75rem;
      padding: 2px 8px;
      border-radius: 10px;
      font-weight: 600;
    }

    .empty-rooms {
      text-align: center;
      padding: 3rem;
      color: #64748b;
    }

    .empty-rooms .material-icons {
      font-size: 48px;
      opacity: 0.5;
    }

    .chat-main {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .chat-header {
      padding: 16px 24px;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .chat-title h3 {
      font-size: 1.1rem;
      font-weight: 600;
      margin: 0 0 4px 0;
    }

    .course-name {
      font-size: 0.85rem;
      color: #64748b;
    }

    .participant-count {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.9rem;
      color: #64748b;
    }

    .participant-count .material-icons {
      font-size: 18px;
    }

    .messages-container {
      flex: 1;
      overflow-y: auto;
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .message {
      display: flex;
      gap: 12px;
      max-width: 70%;
    }

    .message.own {
      margin-left: auto;
      flex-direction: row-reverse;
    }

    .message-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: #e2e8f0;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 0.9rem;
      color: #64748b;
      flex-shrink: 0;
      overflow: hidden;
    }

    .message-avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .message-content {
      display: flex;
      flex-direction: column;
    }

    .sender-name {
      font-size: 0.8rem;
      font-weight: 600;
      color: #64748b;
      margin-bottom: 4px;
    }

    .message-bubble {
      background: #f1f5f9;
      padding: 12px 16px;
      border-radius: 16px;
      border-top-left-radius: 4px;
      color: #1e293b;
      line-height: 1.4;
    }

    .message.own .message-bubble {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
      border-radius: 16px;
      border-top-right-radius: 4px;
    }

    .message-time {
      font-size: 0.75rem;
      color: #94a3b8;
      margin-top: 4px;
    }

    .message.own .message-time {
      text-align: right;
    }

    .no-messages {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: #94a3b8;
    }

    .no-messages .material-icons {
      font-size: 64px;
      opacity: 0.5;
      margin-bottom: 16px;
    }

    .message-input {
      padding: 16px 24px;
      border-top: 1px solid #e2e8f0;
      display: flex;
      gap: 12px;
    }

    .message-input input {
      flex: 1;
      padding: 12px 16px;
      border: 1px solid #e2e8f0;
      border-radius: 24px;
      font-size: 1rem;
      outline: none;
      transition: border-color 0.2s;
    }

    .message-input input:focus {
      border-color: #10b981;
    }

    .send-btn {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      border: none;
      color: white;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.2s;
    }

    .send-btn:hover:not(:disabled) {
      transform: scale(1.05);
    }

    .send-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .no-room-selected {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: #94a3b8;
    }

    .no-room-selected .material-icons {
      font-size: 80px;
      opacity: 0.3;
      margin-bottom: 16px;
    }

    .no-room-selected h3 {
      color: #64748b;
      margin-bottom: 8px;
    }
  `]
})
export class InstructorChatComponent implements OnInit {
  private instructorService = inject(InstructorService);
  private toastr = inject(ToastrService);

  chatRooms = signal<ChatRoom[]>([]);
  selectedRoom = signal<ChatRoom | null>(null);
  messages = signal<ChatMessage[]>([]);
  newMessage = '';
  currentUserId = '';

  ngOnInit() {
    this.loadChatRooms();
    // Get current user ID from auth
    const user = localStorage.getItem('currentUser');
    if (user) {
      this.currentUserId = JSON.parse(user).id;
    }
  }

  loadChatRooms() {
    this.instructorService.getChatRooms().subscribe(rooms => {
      this.chatRooms.set(rooms);
    });
  }

  selectRoom(room: ChatRoom) {
    this.selectedRoom.set(room);
    this.loadMessages(room.id);
  }

  loadMessages(roomId: string) {
    this.instructorService.getChatMessages(roomId).subscribe(messages => {
      this.messages.set(messages);
    });
  }

  sendMessage() {
    if (!this.newMessage.trim() || !this.selectedRoom()) return;

    const roomId = this.selectedRoom()!.id;
    this.instructorService.sendMessage(roomId, this.newMessage).subscribe(message => {
      if (message) {
        this.messages.update(list => [...list, message]);
        this.newMessage = '';
      }
    });
  }

  isOwnMessage(message: ChatMessage): boolean {
    return message.senderId === this.currentUserId;
  }

  formatTime(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}
