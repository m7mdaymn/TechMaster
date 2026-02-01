import { Component, inject, signal, OnInit, ViewChild, ElementRef, AfterViewChecked, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ChatService, ChatRoom, ChatMessage } from '../../core/services/chat.service';
import { MediaService } from '../../core/services/media.service';

// Local interface for display purposes
interface DisplayMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  content: string;
  timestamp: Date;
  isOwn: boolean;
}

interface DisplayRoom {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
  isOnline: boolean;
  type: string;
}

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="chat-page">
      <!-- Sidebar -->
      <aside class="chat-sidebar" [class.active]="showSidebar()">
        <div class="sidebar-header">
          <h2>Messages</h2>
          <button class="new-chat-btn">
            <span>✏️</span>
          </button>
        </div>

        <div class="search-box">
          <span class="search-icon">🔍</span>
          <input 
            type="text" 
            [(ngModel)]="searchQuery"
            placeholder="Search conversations..."
          >
        </div>

        <div class="chat-list">
          @for (room of filteredRooms(); track room.id) {
            <div 
              class="chat-item" 
              [class.active]="selectedRoom()?.id === room.id"
              (click)="selectRoom(room)"
            >
              <div class="avatar-wrapper">
                <img [src]="room.avatar || 'assets/images/default-avatar.png'" [alt]="room.name">
                @if (room.isOnline) {
                  <span class="online-dot"></span>
                }
              </div>
              <div class="chat-info">
                <div class="chat-header">
                  <span class="chat-name">{{ room.name }}</span>
                  <span class="chat-time">{{ formatTime(room.lastMessageTime) }}</span>
                </div>
                <div class="chat-preview">
                  <span class="last-message">{{ room.lastMessage }}</span>
                  @if (room.unreadCount > 0) {
                    <span class="unread-badge">{{ room.unreadCount }}</span>
                  }
                </div>
              </div>
            </div>
          } @empty {
            <div class="empty-chats">
              <p>No conversations yet</p>
            </div>
          }
        </div>
      </aside>

      <!-- Chat Area -->
      <main class="chat-main">
        @if (selectedRoom()) {
          <div class="chat-header">
            <button class="mobile-back-btn" (click)="showSidebar.set(true)">
              <span>←</span>
            </button>
            <div class="chat-user">
              <div class="avatar-wrapper">
                <img [src]="selectedRoom()?.avatar || 'assets/images/default-avatar.png'" [alt]="selectedRoom()?.name">
                @if (selectedRoom()?.isOnline) {
                  <span class="online-dot"></span>
                }
              </div>
              <div class="user-info">
                <h3>{{ selectedRoom()?.name }}</h3>
                <span class="status">
                  {{ selectedRoom()?.isOnline ? 'Online' : 'Offline' }}
                </span>
              </div>
            </div>
            <div class="chat-actions">
              <button class="action-btn" title="Video Call">📹</button>
              <button class="action-btn" title="Voice Call">📞</button>
              <button class="action-btn" title="More">⋮</button>
            </div>
          </div>

          <div class="messages-container" #messagesContainer>
            @for (message of messages(); track message.id) {
              <div class="message" [class.own]="message.isOwn">
                @if (!message.isOwn) {
                  <img [src]="message.senderAvatar || 'assets/images/default-avatar.png'" class="message-avatar" [alt]="message.senderName">
                }
                <div class="message-content">
                  <div class="message-bubble">
                    {{ message.content }}
                  </div>
                  <span class="message-time">{{ formatMessageTime(message.timestamp) }}</span>
                </div>
              </div>
            }
          </div>

          <div class="message-input">
            <button class="attach-btn">📎</button>
            <div class="input-wrapper">
              <input 
                type="text" 
                [(ngModel)]="newMessage"
                placeholder="Type a message..."
                (keydown.enter)="sendMessage()"
              >
              <button class="emoji-btn">😊</button>
            </div>
            <button class="send-btn" (click)="sendMessage()" [disabled]="!newMessage.trim()">
              <span>➤</span>
            </button>
          </div>
        } @else {
          <div class="no-chat-selected">
            <div class="empty-icon">💬</div>
            <h3>Select a Conversation</h3>
            <p>Choose a conversation from the sidebar to start chatting</p>
          </div>
        }
      </main>
    </div>
  `,
  styles: [`
    .chat-page {
      display: grid;
      grid-template-columns: 350px 1fr;
      height: calc(100vh - 70px);
      background: #f8f9fa;
    }

    .chat-sidebar {
      background: #fff;
      border-right: 1px solid #e0e0e0;
      display: flex;
      flex-direction: column;
    }

    .sidebar-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.25rem;
      border-bottom: 1px solid #e0e0e0;
    }

    .sidebar-header h2 {
      font-size: 1.25rem;
      font-weight: 700;
    }

    .new-chat-btn {
      width: 36px;
      height: 36px;
      background: #247090;
      border: none;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .search-box {
      padding: 1rem;
      position: relative;
    }

    .search-icon {
      position: absolute;
      left: 1.75rem;
      top: 50%;
      transform: translateY(-50%);
    }

    .search-box input {
      width: 100%;
      padding: 0.75rem 1rem 0.75rem 2.75rem;
      border: 2px solid #e0e0e0;
      border-radius: 10px;
      font-size: 0.95rem;
    }

    .search-box input:focus {
      outline: none;
      border-color: #247090;
    }

    .chat-list {
      flex: 1;
      overflow-y: auto;
    }

    .chat-item {
      display: flex;
      gap: 0.75rem;
      padding: 1rem 1.25rem;
      cursor: pointer;
      transition: background 0.3s ease;
      border-bottom: 1px solid #f0f0f0;
    }

    .chat-item:hover {
      background: #f8f9fa;
    }

    .chat-item.active {
      background: #e8f4f8;
    }

    .avatar-wrapper {
      position: relative;
      flex-shrink: 0;
    }

    .chat-item .avatar-wrapper img {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      object-fit: cover;
    }

    .online-dot {
      position: absolute;
      bottom: 2px;
      right: 2px;
      width: 12px;
      height: 12px;
      background: #28a745;
      border: 2px solid #fff;
      border-radius: 50%;
    }

    .chat-info {
      flex: 1;
      min-width: 0;
    }

    .chat-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.25rem;
    }

    .chat-name {
      font-weight: 600;
      color: #000;
    }

    .chat-time {
      font-size: 0.75rem;
      color: #999;
    }

    .chat-preview {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .last-message {
      font-size: 0.85rem;
      color: #666;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 180px;
    }

    .unread-badge {
      background: #247090;
      color: #fff;
      font-size: 0.7rem;
      font-weight: 700;
      padding: 0.125rem 0.5rem;
      border-radius: 10px;
      min-width: 20px;
      text-align: center;
    }

    .empty-chats {
      padding: 2rem;
      text-align: center;
      color: #666;
    }

    .chat-main {
      display: flex;
      flex-direction: column;
      background: #fff;
    }

    .chat-main .chat-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem 1.5rem;
      border-bottom: 1px solid #e0e0e0;
      background: #fff;
    }

    .mobile-back-btn {
      display: none;
      width: 36px;
      height: 36px;
      background: #f8f9fa;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 1.25rem;
    }

    .chat-user {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex: 1;
    }

    .chat-user .avatar-wrapper img {
      width: 45px;
      height: 45px;
      border-radius: 50%;
      object-fit: cover;
    }

    .user-info h3 {
      font-size: 1rem;
      font-weight: 700;
      margin-bottom: 0.125rem;
    }

    .user-info .status {
      font-size: 0.8rem;
      color: #28a745;
    }

    .chat-actions {
      display: flex;
      gap: 0.5rem;
    }

    .action-btn {
      width: 36px;
      height: 36px;
      background: #f8f9fa;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 1rem;
      transition: all 0.3s ease;
    }

    .action-btn:hover {
      background: #e0e0e0;
    }

    .messages-container {
      flex: 1;
      overflow-y: auto;
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
      background: #f8f9fa;
    }

    .message {
      display: flex;
      gap: 0.75rem;
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
      object-fit: cover;
      flex-shrink: 0;
    }

    .message-content {
      display: flex;
      flex-direction: column;
    }

    .message.own .message-content {
      align-items: flex-end;
    }

    .message-bubble {
      padding: 0.75rem 1rem;
      background: #fff;
      border-radius: 16px;
      border-top-left-radius: 4px;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
      line-height: 1.5;
    }

    .message.own .message-bubble {
      background: #247090;
      color: #fff;
      border-radius: 16px;
      border-top-right-radius: 4px;
    }

    .message-time {
      font-size: 0.7rem;
      color: #999;
      margin-top: 0.25rem;
      padding: 0 0.5rem;
    }

    .message-input {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem 1.5rem;
      border-top: 1px solid #e0e0e0;
      background: #fff;
    }

    .attach-btn {
      width: 40px;
      height: 40px;
      background: #f8f9fa;
      border: none;
      border-radius: 50%;
      cursor: pointer;
      font-size: 1.1rem;
    }

    .input-wrapper {
      flex: 1;
      position: relative;
    }

    .input-wrapper input {
      width: 100%;
      padding: 0.875rem 3rem 0.875rem 1rem;
      border: 2px solid #e0e0e0;
      border-radius: 25px;
      font-size: 1rem;
    }

    .input-wrapper input:focus {
      outline: none;
      border-color: #247090;
    }

    .emoji-btn {
      position: absolute;
      right: 0.75rem;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      cursor: pointer;
      font-size: 1.25rem;
    }

    .send-btn {
      width: 45px;
      height: 45px;
      background: linear-gradient(135deg, #247090 0%, #1a5570 100%);
      border: none;
      border-radius: 50%;
      cursor: pointer;
      color: #fff;
      font-size: 1.25rem;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
    }

    .send-btn:hover:not(:disabled) {
      transform: scale(1.05);
    }

    .send-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .no-chat-selected {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 2rem;
      background: #f8f9fa;
    }

    .empty-icon {
      font-size: 4rem;
      margin-bottom: 1rem;
    }

    .no-chat-selected h3 {
      font-size: 1.5rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
    }

    .no-chat-selected p {
      color: #666;
    }

    @media (max-width: 768px) {
      .chat-page {
        grid-template-columns: 1fr;
      }

      .chat-sidebar {
        position: fixed;
        top: 70px;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 50;
        transform: translateX(-100%);
        transition: transform 0.3s ease;
      }

      .chat-sidebar.active {
        transform: translateX(0);
      }

      .mobile-back-btn {
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .message {
        max-width: 85%;
      }
    }

    :host-context([dir="rtl"]) {
      .chat-sidebar {
        border-right: none;
        border-left: 1px solid #e0e0e0;
      }

      .search-icon {
        left: auto;
        right: 1.75rem;
      }

      .search-box input {
        padding: 0.75rem 2.75rem 0.75rem 1rem;
      }

      .message.own {
        margin-left: 0;
        margin-right: auto;
      }

      .message-bubble {
        border-top-left-radius: 16px;
        border-top-right-radius: 4px;
      }

      .message.own .message-bubble {
        border-top-right-radius: 16px;
        border-top-left-radius: 4px;
      }

      @media (max-width: 768px) {
        .chat-sidebar {
          transform: translateX(100%);
        }

        .chat-sidebar.active {
          transform: translateX(0);
        }
      }
    }
  `]
})
export class ChatComponent implements OnInit, AfterViewChecked {
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;

  private authService = inject(AuthService);
  private chatService = inject(ChatService);
  private mediaService = inject(MediaService);
  private route = inject(ActivatedRoute);

  searchQuery = '';
  newMessage = '';
  showSidebar = signal(false);
  isLoading = signal(false);

  rooms = signal<DisplayRoom[]>([]);
  selectedRoom = signal<DisplayRoom | null>(null);
  messages = signal<DisplayMessage[]>([]);

  private shouldScroll = false;

  ngOnInit() {
    this.loadRooms();
    
    // Handle query params for starting a new chat with instructor
    this.route.queryParams.subscribe(params => {
      if (params['instructorId']) {
        this.startChatWithInstructor(params['instructorId'], params['courseId'], params['courseName']);
      }
    });
  }

  startChatWithInstructor(instructorId: string, courseId?: string, courseName?: string) {
    // Try to find existing room with this instructor for this course
    const existingRoom = this.rooms().find(r => 
      r.id.includes(instructorId) || (courseId && r.id.includes(courseId))
    );
    
    if (existingRoom) {
      this.selectRoom(existingRoom);
    } else if (courseId) {
      // Create a room for this course
      this.chatService.createCourseRoom(courseId).subscribe({
        next: (room) => {
          if (room) {
            const displayRoom: DisplayRoom = {
              id: room.id,
              name: courseName || room.name || 'Instructor Chat',
              avatar: 'assets/images/default-avatar.png',
              lastMessage: '',
              lastMessageTime: new Date(),
              unreadCount: 0,
              isOnline: false,
              type: 'course'
            };
            this.rooms.update(rooms => [displayRoom, ...rooms]);
            this.selectRoom(displayRoom);
          }
        },
        error: () => {
          // Room might already exist, try to reload rooms
          this.loadRooms();
        }
      });
    }
  }

  ngAfterViewChecked() {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  loadRooms() {
    this.isLoading.set(true);
    this.chatService.getRooms().subscribe({
      next: (apiRooms) => {
        const displayRooms: DisplayRoom[] = apiRooms.map(room => ({
          id: room.id,
          name: room.name || room.courseName || 'Chat Room',
          avatar: 'assets/images/default-avatar.png',
          lastMessage: room.lastMessage || '',
          lastMessageTime: room.lastMessageAt ? new Date(room.lastMessageAt) : new Date(),
          unreadCount: room.unreadCount || 0,
          isOnline: false,
          type: room.type?.toLowerCase() || 'course'
        }));
        this.rooms.set(displayRooms);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        // Show empty state on error
        this.rooms.set([]);
      }
    });
  }

  filteredRooms() {
    if (!this.searchQuery.trim()) return this.rooms();
    const query = this.searchQuery.toLowerCase();
    return this.rooms().filter(room => 
      room.name.toLowerCase().includes(query) ||
      room.lastMessage.toLowerCase().includes(query)
    );
  }

  selectRoom(room: DisplayRoom) {
    this.selectedRoom.set(room);
    this.showSidebar.set(false);
    room.unreadCount = 0;
    this.loadMessages(room.id);
    
    // Mark room as read
    this.chatService.markRoomAsRead(room.id).subscribe();
  }

  loadMessages(roomId: string) {
    const currentUser = this.authService.getCurrentUser();
    
    this.chatService.getMessages(roomId).subscribe({
      next: (result) => {
        const displayMessages: DisplayMessage[] = (result.items || []).map(msg => ({
          id: msg.id,
          senderId: msg.senderId,
          senderName: msg.senderName,
          senderAvatar: this.mediaService.getAvatarUrl(msg.senderAvatar),
          content: msg.content,
          timestamp: new Date(msg.createdAt),
          isOwn: msg.senderId === currentUser?.id
        }));
        this.messages.set(displayMessages);
        this.shouldScroll = true;
      },
      error: () => {
        this.messages.set([]);
      }
    });
  }

  sendMessage() {
    if (!this.newMessage.trim() || !this.selectedRoom()) return;

    const currentUser = this.authService.getCurrentUser();
    const roomId = this.selectedRoom()!.id;
    const content = this.newMessage;
    
    // Optimistically add message to UI
    const tempMessage: DisplayMessage = {
      id: 'temp-' + Date.now(),
      senderId: currentUser?.id || '',
      senderName: currentUser?.fullName || 'You',
      senderAvatar: this.mediaService.getAvatarUrl(currentUser?.profileImageUrl),
      content: content,
      timestamp: new Date(),
      isOwn: true
    };
    
    this.messages.update(msgs => [...msgs, tempMessage]);
    this.newMessage = '';
    this.shouldScroll = true;
    
    // Send to API
    this.chatService.sendMessage(roomId, { content }).subscribe({
      next: (savedMessage) => {
        // Update the temp message with the real one
        this.messages.update(msgs => 
          msgs.map(m => m.id === tempMessage.id ? {
            ...m,
            id: savedMessage.id
          } : m)
        );
      },
      error: () => {
        // Remove temp message on error
        this.messages.update(msgs => msgs.filter(m => m.id !== tempMessage.id));
      }
    });
  }

  scrollToBottom() {
    if (this.messagesContainer) {
      const container = this.messagesContainer.nativeElement;
      container.scrollTop = container.scrollHeight;
    }
  }

  formatTime(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d`;
    return new Date(date).toLocaleDateString();
  }

  formatMessageTime(date: Date): string {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}
