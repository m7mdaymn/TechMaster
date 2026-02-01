import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InstructorService, LiveSessionDto, CourseDto } from '@core/services/instructor.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-instructor-live-sessions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="live-sessions-page">
      <div class="page-header">
        <div class="header-left">
          <h1>Live Sessions</h1>
          <p class="subtitle">Schedule and manage your live classes</p>
        </div>
        <button class="create-btn" (click)="showCreateModal()">
          <span class="material-icons">add</span>
          Schedule Session
        </button>
      </div>

      <!-- Quick Stats -->
      <div class="stats-grid">
        <div class="stat-card">
          <span class="material-icons">today</span>
          <div class="stat-info">
            <span class="stat-value">{{ upcomingSessions().length }}</span>
            <span class="stat-label">Upcoming</span>
          </div>
        </div>
        <div class="stat-card">
          <span class="material-icons">event_busy</span>
          <div class="stat-info">
            <span class="stat-value">{{ pastSessions().length }}</span>
            <span class="stat-label">Completed</span>
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="tabs">
        <button [class.active]="activeTab === 'upcoming'" (click)="activeTab = 'upcoming'">
          Upcoming Sessions
        </button>
        <button [class.active]="activeTab === 'past'" (click)="activeTab = 'past'">
          Past Sessions
        </button>
      </div>

      @if (loading()) {
        <div class="loading-state">
          <div class="spinner"></div>
        </div>
      } @else {
        <div class="sessions-list">
          @for (session of (activeTab === 'upcoming' ? upcomingSessions() : pastSessions()); track session.id) {
            <div class="session-card">
              <div class="session-header">
                <div class="platform-badge" [class]="session.platform">
                  <span class="material-icons">{{ getPlatformIcon(session.platform) }}</span>
                  {{ getPlatformName(session.platform) }}
                </div>
                <span class="session-status" [class]="getSessionStatus(session)">
                  {{ getSessionStatus(session) }}
                </span>
              </div>

              <h3 class="session-title">{{ session.title }}</h3>
              <p class="session-course">{{ session.courseName }}</p>

              <div class="session-details">
                <div class="detail-item">
                  <span class="material-icons">calendar_today</span>
                  {{ session.scheduledAt | date:'MMM d, y' }}
                </div>
                <div class="detail-item">
                  <span class="material-icons">schedule</span>
                  {{ session.scheduledAt | date:'h:mm a' }}
                </div>
                <div class="detail-item">
                  <span class="material-icons">timer</span>
                  {{ session.durationMinutes }} min
                </div>
              </div>

              @if (session.description) {
                <p class="session-description">{{ session.description }}</p>
              }

              <div class="session-actions">
                @if (activeTab === 'upcoming') {
                  <a [href]="session.streamUrl" target="_blank" class="action-btn primary">
                    <span class="material-icons">play_circle</span>
                    Join Session
                  </a>
                  <button class="action-btn" (click)="copyLink(session.streamUrl)">
                    <span class="material-icons">link</span>
                    Copy Link
                  </button>
                  <button class="action-btn" (click)="editSession(session)">
                    <span class="material-icons">edit</span>
                  </button>
                  <button class="action-btn danger" (click)="deleteSession(session)">
                    <span class="material-icons">delete</span>
                  </button>
                } @else {
                  @if (session.recordingUrl) {
                    <a [href]="session.recordingUrl" target="_blank" class="action-btn">
                      <span class="material-icons">play_circle</span>
                      View Recording
                    </a>
                  }
                }
              </div>
            </div>
          } @empty {
            <div class="empty-state">
              <span class="empty-icon">📅</span>
              <h3>No {{ activeTab === 'upcoming' ? 'upcoming' : 'past' }} sessions</h3>
              <p>{{ activeTab === 'upcoming' ? 'Schedule a live session to get started' : 'Completed sessions will appear here' }}</p>
            </div>
          }
        </div>
      }

      <!-- Create/Edit Modal -->
      @if (showModal()) {
        <div class="modal-overlay" (click)="closeModal()">
          <div class="modal-content" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>{{ editingSession() ? 'Edit' : 'Schedule' }} Live Session</h2>
              <button class="close-btn" (click)="closeModal()">
                <span class="material-icons">close</span>
              </button>
            </div>

            <form class="session-form" (ngSubmit)="saveSession()">
              <div class="form-group">
                <label>Session Title *</label>
                <input type="text" [(ngModel)]="formData.title" name="title" required placeholder="e.g., Introduction to JavaScript">
              </div>

              <div class="form-group">
                <label>Course *</label>
                <select [(ngModel)]="formData.courseId" name="courseId" required>
                  <option value="">Select a course</option>
                  @for (course of courses(); track course.id) {
                    <option [value]="course.id">{{ course.nameEn }}</option>
                  }
                </select>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>Date *</label>
                  <input type="date" [(ngModel)]="formData.date" name="date" required>
                </div>
                <div class="form-group">
                  <label>Time *</label>
                  <input type="time" [(ngModel)]="formData.time" name="time" required>
                </div>
                <div class="form-group">
                  <label>Duration (min) *</label>
                  <input type="number" [(ngModel)]="formData.durationMinutes" name="duration" required min="15" max="480">
                </div>
              </div>

              <div class="form-group">
                <label>Platform *</label>
                <div class="platform-options">
                  @for (platform of platforms; track platform.value) {
                    <label class="platform-option" [class.selected]="formData.platform === platform.value">
                      <input type="radio" [(ngModel)]="formData.platform" name="platform" [value]="platform.value">
                      <span class="material-icons">{{ platform.icon }}</span>
                      {{ platform.label }}
                    </label>
                  }
                </div>
              </div>

              <div class="form-group">
                <label>Stream URL *</label>
                <input type="url" [(ngModel)]="formData.streamUrl" name="streamUrl" required
                  placeholder="https://zoom.us/j/... or https://youtube.com/live/...">
                <span class="help-text">Paste the link to your {{ getPlatformName(formData.platform) }} session</span>
              </div>

              <div class="form-group">
                <label>Description</label>
                <textarea [(ngModel)]="formData.description" name="description" rows="3"
                  placeholder="What will be covered in this session?"></textarea>
              </div>

              <div class="form-actions">
                <button type="button" class="cancel-btn" (click)="closeModal()">Cancel</button>
                <button type="submit" class="submit-btn" [disabled]="saving()">
                  {{ saving() ? 'Saving...' : (editingSession() ? 'Update Session' : 'Schedule Session') }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .live-sessions-page {
      max-width: 1000px;
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
    }

    .create-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 24px;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
      border: none;
      border-radius: 10px;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.2s;
    }

    .create-btn:hover {
      transform: translateY(-2px);
    }

    .stats-grid {
      display: flex;
      gap: 16px;
      margin-bottom: 2rem;
    }

    .stat-card {
      display: flex;
      align-items: center;
      gap: 16px;
      background: white;
      padding: 20px 24px;
      border-radius: 12px;
      flex: 1;
    }

    .stat-card .material-icons {
      font-size: 32px;
      color: #10b981;
    }

    .stat-value {
      display: block;
      font-size: 1.5rem;
      font-weight: 700;
      color: #1e293b;
    }

    .stat-label {
      font-size: 0.9rem;
      color: #64748b;
    }

    .tabs {
      display: flex;
      gap: 4px;
      background: white;
      padding: 4px;
      border-radius: 10px;
      margin-bottom: 1.5rem;
      width: fit-content;
    }

    .tabs button {
      padding: 10px 24px;
      border: none;
      background: transparent;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 500;
      color: #64748b;
      transition: all 0.2s;
    }

    .tabs button.active {
      background: #10b981;
      color: white;
    }

    .loading-state, .empty-state {
      text-align: center;
      padding: 4rem;
      background: white;
      border-radius: 12px;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid #e2e8f0;
      border-top-color: #10b981;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .empty-icon {
      font-size: 4rem;
      display: block;
      margin-bottom: 1rem;
    }

    .sessions-list {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 20px;
    }

    .session-card {
      background: white;
      border-radius: 16px;
      padding: 24px;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .session-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 24px rgba(0,0,0,0.1);
    }

    .session-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .platform-badge {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 0.85rem;
      font-weight: 600;
    }

    .platform-badge.youtube {
      background: #fee2e2;
      color: #dc2626;
    }

    .platform-badge.zoom {
      background: #dbeafe;
      color: #2563eb;
    }

    .platform-badge.teams {
      background: #ede9fe;
      color: #7c3aed;
    }

    .platform-badge.meet {
      background: #dcfce7;
      color: #16a34a;
    }

    .platform-badge.other {
      background: #f1f5f9;
      color: #64748b;
    }

    .session-status {
      font-size: 0.8rem;
      padding: 4px 10px;
      border-radius: 12px;
      font-weight: 500;
    }

    .session-status.live {
      background: #dcfce7;
      color: #16a34a;
    }

    .session-status.upcoming {
      background: #dbeafe;
      color: #2563eb;
    }

    .session-status.completed {
      background: #f1f5f9;
      color: #64748b;
    }

    .session-title {
      font-size: 1.15rem;
      font-weight: 600;
      color: #1e293b;
      margin-bottom: 4px;
    }

    .session-course {
      font-size: 0.9rem;
      color: #64748b;
      margin-bottom: 16px;
    }

    .session-details {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      margin-bottom: 12px;
    }

    .detail-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.9rem;
      color: #64748b;
    }

    .detail-item .material-icons {
      font-size: 18px;
    }

    .session-description {
      font-size: 0.9rem;
      color: #64748b;
      margin-bottom: 16px;
      line-height: 1.5;
    }

    .session-actions {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .action-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 14px;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      background: white;
      color: #64748b;
      font-size: 0.9rem;
      cursor: pointer;
      text-decoration: none;
      transition: all 0.2s;
    }

    .action-btn:hover {
      background: #f8fafc;
    }

    .action-btn.primary {
      background: #10b981;
      color: white;
      border-color: #10b981;
    }

    .action-btn.danger:hover {
      background: #fef2f2;
      color: #dc2626;
      border-color: #fecaca;
    }

    /* Modal */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 20px;
    }

    .modal-content {
      background: white;
      border-radius: 16px;
      width: 100%;
      max-width: 600px;
      max-height: 90vh;
      overflow-y: auto;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 24px;
      border-bottom: 1px solid #e2e8f0;
    }

    .modal-header h2 {
      font-size: 1.25rem;
      font-weight: 600;
    }

    .close-btn {
      background: none;
      border: none;
      cursor: pointer;
      color: #64748b;
    }

    .session-form {
      padding: 24px;
    }

    .form-group {
      margin-bottom: 20px;
    }

    .form-group label {
      display: block;
      font-weight: 500;
      margin-bottom: 8px;
      color: #374151;
    }

    .form-group input, .form-group select, .form-group textarea {
      width: 100%;
      padding: 12px;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      font-size: 1rem;
    }

    .form-row {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
    }

    .help-text {
      font-size: 0.85rem;
      color: #64748b;
      margin-top: 6px;
      display: block;
    }

    .platform-options {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
    }

    .platform-option {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      padding: 14px 12px;
      border: 2px solid #e2e8f0;
      border-radius: 10px;
      cursor: pointer;
      transition: all 0.2s;
      font-size: 0.85rem;
      color: #64748b;
    }

    .platform-option input {
      display: none;
    }

    .platform-option.selected {
      border-color: #10b981;
      background: #dcfce7;
      color: #059669;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 24px;
    }

    .cancel-btn, .submit-btn {
      padding: 12px 24px;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      border: none;
    }

    .cancel-btn {
      background: #f1f5f9;
      color: #64748b;
    }

    .submit-btn {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
    }

    .submit-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  `]
})
export class InstructorLiveSessionsComponent implements OnInit {
  private instructorService = inject(InstructorService);
  private toastr = inject(ToastrService);

  sessions = signal<LiveSessionDto[]>([]);
  courses = signal<CourseDto[]>([]);
  loading = signal(true);
  showModal = signal(false);
  editingSession = signal<LiveSessionDto | null>(null);
  saving = signal(false);

  activeTab: 'upcoming' | 'past' = 'upcoming';

  platforms = [
    { value: 'youtube', label: 'YouTube', icon: 'smart_display' },
    { value: 'zoom', label: 'Zoom', icon: 'videocam' },
    { value: 'teams', label: 'Teams', icon: 'groups' },
    { value: 'meet', label: 'Google Meet', icon: 'video_call' },
    { value: 'other', label: 'Other', icon: 'link' }
  ];

  formData = {
    title: '',
    courseId: '',
    date: '',
    time: '',
    durationMinutes: 60,
    platform: 'zoom',
    streamUrl: '',
    description: ''
  };

  ngOnInit() {
    this.loadSessions();
    this.loadCourses();
  }

  loadSessions() {
    this.loading.set(true);
    this.instructorService.getLiveSessions().subscribe({
      next: (sessions) => {
        this.sessions.set(sessions);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  loadCourses() {
    this.instructorService.getMyCourses().subscribe(courses => {
      this.courses.set(courses);
    });
  }

  upcomingSessions(): LiveSessionDto[] {
    const now = new Date();
    return this.sessions().filter(s => new Date(s.scheduledAt) > now);
  }

  pastSessions(): LiveSessionDto[] {
    const now = new Date();
    return this.sessions().filter(s => new Date(s.scheduledAt) <= now);
  }

  getSessionStatus(session: LiveSessionDto): string {
    const now = new Date();
    const sessionTime = new Date(session.scheduledAt);
    const endTime = new Date(sessionTime.getTime() + session.durationMinutes * 60000);

    if (now >= sessionTime && now <= endTime) return 'live';
    if (now < sessionTime) return 'upcoming';
    return 'completed';
  }

  getPlatformIcon(platform: string): string {
    return this.platforms.find(p => p.value === platform)?.icon || 'link';
  }

  getPlatformName(platform: string): string {
    return this.platforms.find(p => p.value === platform)?.label || 'Other';
  }

  showCreateModal() {
    this.editingSession.set(null);
    this.formData = {
      title: '',
      courseId: '',
      date: '',
      time: '',
      durationMinutes: 60,
      platform: 'zoom',
      streamUrl: '',
      description: ''
    };
    this.showModal.set(true);
  }

  editSession(session: LiveSessionDto) {
    this.editingSession.set(session);
    const date = new Date(session.scheduledAt);
    this.formData = {
      title: session.title,
      courseId: session.courseId,
      date: date.toISOString().split('T')[0],
      time: date.toTimeString().slice(0, 5),
      durationMinutes: session.durationMinutes,
      platform: session.platform,
      streamUrl: session.streamUrl,
      description: session.description || ''
    };
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
  }

  saveSession() {
    const scheduledAt = new Date(`${this.formData.date}T${this.formData.time}`).toISOString();
    
    const payload = {
      title: this.formData.title,
      courseId: this.formData.courseId,
      scheduledAt,
      durationMinutes: this.formData.durationMinutes,
      platform: this.formData.platform as 'youtube' | 'zoom' | 'teams' | 'meet' | 'other',
      streamUrl: this.formData.streamUrl,
      description: this.formData.description
    };

    this.saving.set(true);

    const request = this.editingSession()
      ? this.instructorService.updateLiveSession(this.editingSession()!.id, payload)
      : this.instructorService.createLiveSession(payload);

    request.subscribe({
      next: (session) => {
        this.toastr.success(`Session ${this.editingSession() ? 'updated' : 'scheduled'} successfully`);
        if (this.editingSession()) {
          this.sessions.update(list => list.map(s => s.id === session.id ? session : s));
        } else {
          this.sessions.update(list => [...list, session]);
        }
        this.closeModal();
        this.saving.set(false);
      },
      error: () => {
        this.toastr.error('Failed to save session');
        this.saving.set(false);
      }
    });
  }

  deleteSession(session: LiveSessionDto) {
    if (confirm('Are you sure you want to delete this session?')) {
      this.instructorService.deleteLiveSession(session.id).subscribe({
        next: (success) => {
          if (success) {
            this.sessions.update(list => list.filter(s => s.id !== session.id));
            this.toastr.success('Session deleted');
          }
        }
      });
    }
  }

  copyLink(url: string) {
    navigator.clipboard.writeText(url);
    this.toastr.success('Link copied to clipboard');
  }
}
