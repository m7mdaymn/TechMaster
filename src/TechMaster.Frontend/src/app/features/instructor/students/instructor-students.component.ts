import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DashboardService, InstructorStudent, InstructorStudentDetail } from '../../../core/services/dashboard.service';
import { MediaService } from '../../../core/services/media.service';
import { ToastrService } from 'ngx-toastr';

interface Student {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar: string;
  courseName: string;
  courseId: string;
  enrollmentId: string;
  enrolledCourses: number;
  completedCourses: number;
  lastActive: Date | null;
  progress: number;
}

@Component({
  selector: 'app-instructor-students',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="students-page">
      <div class="page-header">
        <h1>My Students</h1>
        <p>View and manage students enrolled in your courses</p>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon blue">
            <span class="material-icons">people</span>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ totalStudents() }}</span>
            <span class="stat-label">Total Students</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon green">
            <span class="material-icons">trending_up</span>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ activeStudents() }}</span>
            <span class="stat-label">Active This Week</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon purple">
            <span class="material-icons">school</span>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ averageProgress() }}%</span>
            <span class="stat-label">Avg. Progress</span>
          </div>
        </div>
      </div>

      <!-- Search and Filter -->
      <div class="filters-section">
        <div class="search-box">
          <span class="material-icons">search</span>
          <input type="text" placeholder="Search students..." [(ngModel)]="searchTerm" (input)="filterStudents()" />
        </div>
      </div>

      <div class="students-table-container">
        @if (loading()) {
          <div class="loading-state">
            <span class="material-icons spin">sync</span>
            <p>Loading students...</p>
          </div>
        } @else if (filteredStudents().length === 0) {
          <div class="empty-state">
            <span class="material-icons">people_outline</span>
            <p>No students found</p>
          </div>
        } @else {
          <table class="students-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Course</th>
                <th>Progress</th>
                <th>Last Active</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (student of filteredStudents(); track student.enrollmentId) {
                <tr>
                  <td>
                    <div class="student-info">
                      <div class="avatar">{{ student.name.charAt(0) }}</div>
                      <div class="student-details">
                        <span class="student-name">{{ student.name }}</span>
                        <span class="student-email">{{ student.email }}</span>
                      </div>
                    </div>
                  </td>
                  <td>{{ student.courseName }}</td>
                  <td>
                    <div class="progress-cell">
                      <div class="progress-bar">
                        <div class="progress-fill" [style.width.%]="student.progress"></div>
                      </div>
                      <span class="progress-text">{{ student.progress | number:'1.0-0' }}%</span>
                    </div>
                  </td>
                  <td>{{ student.lastActive | date:'mediumDate' }}</td>
                  <td>
                    <div class="action-buttons">
                      <button class="action-btn view" title="View Details" (click)="viewStudentDetails(student)">
                        <span class="material-icons">visibility</span>
                      </button>
                      @if (student.phone) {
                        <a [href]="getWhatsAppLink(student.phone, student.name)" target="_blank" class="action-btn whatsapp" title="Contact via WhatsApp">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                          </svg>
                        </a>
                      }
                      <a [href]="'mailto:' + student.email" class="action-btn email" title="Send Email">
                        <span class="material-icons">email</span>
                      </a>
                      <button class="action-btn remove" title="Remove from Course" (click)="confirmRemoveStudent(student)">
                        <span class="material-icons">person_remove</span>
                      </button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        }
      </div>
    </div>

    <!-- Student Detail Modal -->
    @if (showDetailModal()) {
      <div class="modal-overlay" (click)="closeDetailModal()">
        <div class="modal-content detail-modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>Student Progress Details</h2>
            <button class="close-btn" (click)="closeDetailModal()">
              <span class="material-icons">close</span>
            </button>
          </div>
          @if (loadingDetail()) {
            <div class="modal-body loading-state">
              <span class="material-icons spin">sync</span>
              <p>Loading student details...</p>
            </div>
          } @else if (studentDetail()) {
            <div class="modal-body">
              <div class="student-header">
                <div class="avatar large">{{ studentDetail()!.studentName.charAt(0) }}</div>
                <div class="student-info-header">
                  <h3>{{ studentDetail()!.studentName }}</h3>
                  <p>{{ studentDetail()!.studentEmail }}</p>
                  @if (studentDetail()!.studentPhone) {
                    <p>{{ studentDetail()!.studentPhone }}</p>
                  }
                </div>
              </div>
              
              <div class="course-info">
                <h4>{{ studentDetail()!.courseName }}</h4>
                <div class="enrollment-meta">
                  <span><strong>Enrolled:</strong> {{ studentDetail()!.enrolledAt | date:'mediumDate' }}</span>
                  <span><strong>Status:</strong> {{ studentDetail()!.enrollmentStatus }}</span>
                  <span><strong>Last Active:</strong> {{ studentDetail()!.lastActiveAt | date:'medium' }}</span>
                </div>
                <div class="overall-progress">
                  <span>Overall Progress: {{ studentDetail()!.overallProgress | number:'1.0-0' }}%</span>
                  <div class="progress-bar large">
                    <div class="progress-fill" [style.width.%]="studentDetail()!.overallProgress"></div>
                  </div>
                </div>
              </div>

              <div class="chapters-progress">
                <h4>Chapter Progress</h4>
                @for (chapter of studentDetail()!.chapterProgress; track chapter.chapterId) {
                  <div class="chapter-item">
                    <div class="chapter-header">
                      <span class="chapter-title">{{ chapter.order }}. {{ chapter.chapterTitle }}</span>
                      <span class="chapter-percentage">{{ chapter.completionPercentage | number:'1.0-0' }}%</span>
                    </div>
                    <div class="progress-bar">
                      <div class="progress-fill" [style.width.%]="chapter.completionPercentage"></div>
                    </div>
                    <div class="sessions-list">
                      @for (session of chapter.sessions; track session.sessionId) {
                        <div class="session-item" [class.completed]="session.isCompleted">
                          <span class="material-icons">{{ session.isCompleted ? 'check_circle' : 'radio_button_unchecked' }}</span>
                          <span class="session-title">{{ session.sessionTitle }}</span>
                          <span class="session-progress">{{ session.watchPercentage }}%</span>
                        </div>
                      }
                    </div>
                  </div>
                }
              </div>
            </div>
          }
        </div>
      </div>
    }

    <!-- Remove Confirmation Modal -->
    @if (showRemoveModal()) {
      <div class="modal-overlay" (click)="closeRemoveModal()">
        <div class="modal-content remove-modal" (click)="$event.stopPropagation()">
          <div class="modal-header warning">
            <span class="material-icons">warning</span>
            <h2>Remove Student</h2>
          </div>
          <div class="modal-body">
            <p>Are you sure you want to remove <strong>{{ studentToRemove()?.name }}</strong> from <strong>{{ studentToRemove()?.courseName }}</strong>?</p>
            <p class="warning-text">This action will cancel their enrollment and they will lose access to the course.</p>
            
            <div class="form-group">
              <label>Reason (optional):</label>
              <textarea [(ngModel)]="removeReason" placeholder="Enter reason for removal..."></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn-cancel" (click)="closeRemoveModal()">Cancel</button>
            <button class="btn-danger" (click)="removeStudent()" [disabled]="removing()">
              @if (removing()) {
                <span class="material-icons spin">sync</span>
              } @else {
                Remove Student
              }
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .students-page {
      max-width: 1400px;
    }

    .page-header {
      margin-bottom: 32px;
    }

    .page-header h1 {
      font-size: 1.75rem;
      font-weight: 700;
      color: #1a1a2e;
      margin: 0 0 8px 0;
    }

    .page-header p {
      color: #666;
      margin: 0;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 24px;
      margin-bottom: 32px;
    }

    .stat-card {
      background: white;
      border-radius: 16px;
      padding: 24px;
      display: flex;
      align-items: center;
      gap: 16px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.05);
    }

    .stat-icon {
      width: 56px;
      height: 56px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .stat-icon.blue {
      background: rgba(59, 130, 246, 0.1);
      color: #3b82f6;
    }

    .stat-icon.green {
      background: rgba(16, 185, 129, 0.1);
      color: #10b981;
    }

    .stat-icon.purple {
      background: rgba(139, 92, 246, 0.1);
      color: #8b5cf6;
    }

    .stat-info {
      display: flex;
      flex-direction: column;
    }

    .stat-value {
      font-size: 1.75rem;
      font-weight: 700;
      color: #1a1a2e;
    }

    .stat-label {
      color: #666;
      font-size: 0.9rem;
    }

    .students-table-container {
      background: white;
      border-radius: 16px;
      padding: 24px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.05);
      overflow-x: auto;
    }

    .students-table {
      width: 100%;
      border-collapse: collapse;
    }

    .students-table th,
    .students-table td {
      padding: 16px;
      text-align: left;
      border-bottom: 1px solid #eee;
    }

    .students-table th {
      font-weight: 600;
      color: #666;
      font-size: 0.85rem;
      text-transform: uppercase;
    }

    .student-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
    }

    .progress-bar {
      width: 100px;
      height: 8px;
      background: #e5e7eb;
      border-radius: 4px;
      overflow: hidden;
      display: inline-block;
      margin-right: 8px;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      border-radius: 4px;
    }

    .progress-text {
      font-size: 0.85rem;
      color: #666;
    }

    .action-buttons {
      display: flex;
      gap: 8px;
    }

    .whatsapp-btn,
    .email-btn {
      width: 32px;
      height: 32px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      text-decoration: none;
      transition: all 0.2s;
    }

    .whatsapp-btn {
      background: rgba(37, 211, 102, 0.1);
      color: #25D366;
    }

    .whatsapp-btn:hover {
      background: #25D366;
      color: white;
    }

    .email-btn {
      background: rgba(59, 130, 246, 0.1);
      color: #3b82f6;
    }

    .email-btn:hover {
      background: #3b82f6;
      color: white;
    }

    .email-btn .material-icons {
      font-size: 18px;
    }

    /* New styles */
    .filters-section {
      margin-bottom: 24px;
    }

    .search-box {
      display: flex;
      align-items: center;
      gap: 12px;
      background: white;
      border-radius: 12px;
      padding: 12px 16px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.05);
      max-width: 400px;
    }

    .search-box input {
      border: none;
      outline: none;
      flex: 1;
      font-size: 1rem;
    }

    .search-box .material-icons {
      color: #666;
    }

    .student-details {
      display: flex;
      flex-direction: column;
    }

    .student-name {
      font-weight: 600;
      color: #1a1a2e;
    }

    .student-email {
      font-size: 0.85rem;
      color: #666;
    }

    .progress-cell {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .action-btn {
      width: 32px;
      height: 32px;
      border-radius: 6px;
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s;
      text-decoration: none;
    }

    .action-btn .material-icons {
      font-size: 18px;
    }

    .action-btn.view {
      background: rgba(59, 130, 246, 0.1);
      color: #3b82f6;
    }

    .action-btn.view:hover {
      background: #3b82f6;
      color: white;
    }

    .action-btn.whatsapp {
      background: rgba(37, 211, 102, 0.1);
      color: #25D366;
    }

    .action-btn.whatsapp:hover {
      background: #25D366;
      color: white;
    }

    .action-btn.email {
      background: rgba(59, 130, 246, 0.1);
      color: #3b82f6;
    }

    .action-btn.email:hover {
      background: #3b82f6;
      color: white;
    }

    .action-btn.remove {
      background: rgba(239, 68, 68, 0.1);
      color: #ef4444;
    }

    .action-btn.remove:hover {
      background: #ef4444;
      color: white;
    }

    .loading-state,
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px;
      color: #666;
    }

    .loading-state .material-icons,
    .empty-state .material-icons {
      font-size: 48px;
      margin-bottom: 16px;
    }

    .spin {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
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
      max-width: 800px;
      width: 100%;
      max-height: 90vh;
      overflow-y: auto;
    }

    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 20px 24px;
      border-bottom: 1px solid #eee;
    }

    .modal-header h2 {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 600;
    }

    .modal-header.warning {
      background: #fef3c7;
      color: #92400e;
    }

    .modal-header.warning .material-icons {
      margin-right: 12px;
    }

    .close-btn {
      background: none;
      border: none;
      cursor: pointer;
      color: #666;
      padding: 4px;
    }

    .modal-body {
      padding: 24px;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding: 16px 24px;
      border-top: 1px solid #eee;
    }

    .student-header {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 24px;
    }

    .avatar.large {
      width: 64px;
      height: 64px;
      font-size: 1.5rem;
    }

    .student-info-header h3 {
      margin: 0 0 4px 0;
    }

    .student-info-header p {
      margin: 0;
      color: #666;
      font-size: 0.9rem;
    }

    .course-info {
      background: #f8fafc;
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 24px;
    }

    .course-info h4 {
      margin: 0 0 12px 0;
    }

    .enrollment-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      margin-bottom: 16px;
      font-size: 0.9rem;
      color: #666;
    }

    .overall-progress {
      margin-top: 12px;
    }

    .progress-bar.large {
      width: 100%;
      height: 12px;
      margin-top: 8px;
    }

    .chapters-progress h4 {
      margin: 0 0 16px 0;
    }

    .chapter-item {
      margin-bottom: 20px;
      padding: 16px;
      background: #f8fafc;
      border-radius: 12px;
    }

    .chapter-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
    }

    .chapter-title {
      font-weight: 600;
    }

    .chapter-percentage {
      color: #10b981;
      font-weight: 600;
    }

    .sessions-list {
      margin-top: 12px;
    }

    .session-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 0;
      border-bottom: 1px solid #e5e7eb;
      font-size: 0.9rem;
    }

    .session-item:last-child {
      border-bottom: none;
    }

    .session-item .material-icons {
      font-size: 18px;
      color: #9ca3af;
    }

    .session-item.completed .material-icons {
      color: #10b981;
    }

    .session-title {
      flex: 1;
    }

    .session-progress {
      color: #666;
    }

    .remove-modal {
      max-width: 500px;
    }

    .warning-text {
      color: #dc2626;
      font-size: 0.9rem;
    }

    .form-group {
      margin-top: 16px;
    }

    .form-group label {
      display: block;
      margin-bottom: 8px;
      font-weight: 500;
    }

    .form-group textarea {
      width: 100%;
      min-height: 80px;
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 12px;
      font-family: inherit;
      resize: vertical;
    }

    .btn-cancel {
      background: #f3f4f6;
      border: none;
      padding: 10px 20px;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 500;
    }

    .btn-danger {
      background: #ef4444;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .btn-danger:hover {
      background: #dc2626;
    }

    .btn-danger:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  `]
})
export class InstructorStudentsComponent implements OnInit {
  private dashboardService = inject(DashboardService);
  private toastr = inject(ToastrService);
  mediaService = inject(MediaService);

  // Data signals
  students = signal<Student[]>([]);
  filteredStudents = signal<Student[]>([]);
  totalStudents = signal(0);
  activeStudents = signal(0);
  averageProgress = signal(0);
  loading = signal(true);

  // Detail modal signals
  showDetailModal = signal(false);
  loadingDetail = signal(false);
  studentDetail = signal<InstructorStudentDetail | null>(null);

  // Remove modal signals
  showRemoveModal = signal(false);
  studentToRemove = signal<Student | null>(null);
  removing = signal(false);
  removeReason = '';

  // Search
  searchTerm = '';

  ngOnInit(): void {
    this.loadStudents();
  }

  loadStudents(): void {
    this.loading.set(true);
    this.dashboardService.getInstructorStudents(1, 100).subscribe({
      next: (data) => {
        if (data && data.students) {
          const studentsArray = data.students.map(s => ({
            id: s.id,
            name: s.name,
            email: s.email,
            phone: s.phone,
            avatar: s.profileImageUrl || '',
            courseName: s.courseName,
            courseId: s.courseId,
            enrollmentId: s.enrollmentId,
            enrolledCourses: 1,
            completedCourses: s.progress >= 100 ? 1 : 0,
            lastActive: s.lastActiveAt ? new Date(s.lastActiveAt) : null,
            progress: s.progress
          }));

          this.students.set(studentsArray);
          this.filteredStudents.set(studentsArray);
          this.totalStudents.set(data.totalCount || studentsArray.length);
          this.activeStudents.set(studentsArray.filter(s => 
            s.lastActive && s.lastActive > new Date(Date.now() - 604800000)
          ).length);
          this.averageProgress.set(
            studentsArray.length > 0 
              ? Math.round(studentsArray.reduce((acc, s) => acc + s.progress, 0) / studentsArray.length)
              : 0
          );
        }
        this.loading.set(false);
      },
      error: () => {
        this.toastr.error('Failed to load students');
        this.loading.set(false);
      }
    });
  }

  filterStudents(): void {
    const term = this.searchTerm.toLowerCase();
    if (!term) {
      this.filteredStudents.set(this.students());
      return;
    }
    this.filteredStudents.set(
      this.students().filter(s => 
        s.name.toLowerCase().includes(term) || 
        s.email.toLowerCase().includes(term) ||
        s.courseName.toLowerCase().includes(term)
      )
    );
  }

  viewStudentDetails(student: Student): void {
    this.showDetailModal.set(true);
    this.loadingDetail.set(true);
    this.studentDetail.set(null);

    this.dashboardService.getStudentDetail(student.enrollmentId).subscribe({
      next: (detail) => {
        this.studentDetail.set(detail);
        this.loadingDetail.set(false);
      },
      error: () => {
        this.toastr.error('Failed to load student details');
        this.loadingDetail.set(false);
        this.showDetailModal.set(false);
      }
    });
  }

  closeDetailModal(): void {
    this.showDetailModal.set(false);
    this.studentDetail.set(null);
  }

  confirmRemoveStudent(student: Student): void {
    this.studentToRemove.set(student);
    this.removeReason = '';
    this.showRemoveModal.set(true);
  }

  closeRemoveModal(): void {
    this.showRemoveModal.set(false);
    this.studentToRemove.set(null);
    this.removeReason = '';
  }

  removeStudent(): void {
    const student = this.studentToRemove();
    if (!student) return;

    this.removing.set(true);
    this.dashboardService.removeStudentFromCourse(student.enrollmentId, this.removeReason || undefined).subscribe({
      next: (success) => {
        if (success) {
          this.toastr.success(`${student.name} has been removed from ${student.courseName}`);
          this.closeRemoveModal();
          this.loadStudents(); // Refresh list
        } else {
          this.toastr.error('Failed to remove student');
        }
        this.removing.set(false);
      },
      error: () => {
        this.toastr.error('Failed to remove student');
        this.removing.set(false);
      }
    });
  }

  getWhatsAppLink(phone: string, studentName: string): string {
    const cleanPhone = phone.replace(/[^\d+]/g, '');
    const message = encodeURIComponent(`Hello ${studentName}, I'm your instructor from TechMaster. `);
    return `https://wa.me/${cleanPhone}?text=${message}`;
  }
}
