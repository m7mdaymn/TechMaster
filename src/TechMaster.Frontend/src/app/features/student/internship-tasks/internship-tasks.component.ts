import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { InternshipService, Internship, InternshipTask, TaskSubmission, CreateSubmissionDto } from '@core/services/internship.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-internship-tasks',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="internship-tasks-page">
      <a routerLink="/student/my-internships" class="back-link">
        ← Back to My Internships
      </a>

      @if (loading()) {
        <div class="loading">
          <div class="spinner"></div>
        </div>
      } @else {
        <div class="page-header">
          <h1>{{ internship()?.nameEn || 'Internship Tasks' }}</h1>
          <p class="subtitle">Complete your tasks and submit your work on time</p>
        </div>

        <!-- Progress Summary -->
        <div class="progress-summary">
          <div class="progress-card">
            <span class="icon">📋</span>
            <div class="info">
              <span class="value">{{ tasks().length }}</span>
              <span class="label">Total Tasks</span>
            </div>
          </div>
          <div class="progress-card">
            <span class="icon">✅</span>
            <div class="info">
              <span class="value">{{ submittedCount }}</span>
              <span class="label">Submitted</span>
            </div>
          </div>
          <div class="progress-card">
            <span class="icon">⏳</span>
            <div class="info">
              <span class="value">{{ pendingCount }}</span>
              <span class="label">Pending</span>
            </div>
          </div>
          <div class="progress-card">
            <span class="icon">⭐</span>
            <div class="info">
              <span class="value">{{ totalScore }}/{{ totalMaxPoints }}</span>
              <span class="label">Points Earned</span>
            </div>
          </div>
        </div>

        <!-- Tasks List -->
        <div class="tasks-list">
          @for (task of tasks(); track task.id) {
            <div class="task-card" [class.submitted]="isTaskSubmitted(task.id)" [class.overdue]="isOverdue(task)">
              <div class="task-header">
                <div class="task-info">
                  <h3>{{ task.nameEn }}</h3>
                  <div class="task-meta">
                    <span class="type-badge">{{ task.taskType }}</span>
                    <span class="points">{{ task.maxPoints }} points</span>
                    @if (task.isRequired) {
                      <span class="required-badge">Required</span>
                    }
                  </div>
                </div>
                <div class="task-status">
                  @if (isTaskSubmitted(task.id)) {
                    @if (getSubmission(task.id)?.score !== null && getSubmission(task.id)?.score !== undefined) {
                      <span class="status-badge graded">
                        Graded: {{ getSubmission(task.id)?.score }}/{{ task.maxPoints }}
                      </span>
                    } @else {
                      <span class="status-badge submitted">Submitted</span>
                    }
                  } @else if (isOverdue(task)) {
                    <span class="status-badge overdue">Overdue</span>
                  } @else {
                    <span class="status-badge pending">Pending</span>
                  }
                </div>
              </div>

              <div class="task-body">
                <div class="instructions">
                  <h4>Instructions</h4>
                  <p>{{ task.instructions }}</p>
                </div>

                @if (task.dueDate) {
                  <div class="due-date" [class.overdue]="isOverdue(task)">
                    <span class="icon">📅</span>
                    <span>Due: {{ task.dueDate | date:'medium' }}</span>
                    @if (isOverdue(task)) {
                      <span class="overdue-text">(Overdue)</span>
                    }
                  </div>
                }
              </div>

              <div class="task-footer">
                @if (isTaskSubmitted(task.id)) {
                  <div class="submission-info">
                    <p><strong>Submitted:</strong> {{ getSubmission(task.id)?.submittedAt | date:'medium' }}</p>
                    @if (getSubmission(task.id)?.isLate) {
                      <span class="late-badge">Late Submission</span>
                    }
                    @if (getSubmission(task.id)?.feedback) {
                      <div class="feedback-section">
                        <h5>Instructor Feedback:</h5>
                        <p>{{ getSubmission(task.id)?.feedback }}</p>
                      </div>
                    }
                  </div>
                } @else {
                  <button class="submit-btn" (click)="openSubmitModal(task)">
                    Submit Work
                  </button>
                }
              </div>
            </div>
          } @empty {
            <div class="empty-state">
              <span class="icon">📋</span>
              <h3>No Tasks Yet</h3>
              <p>Tasks will appear here when your instructor assigns them.</p>
            </div>
          }
        </div>
      }
    </div>

    <!-- Submit Modal -->
    @if (showSubmitModal && selectedTask) {
      <div class="modal-overlay" (click)="closeSubmitModal()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>Submit: {{ selectedTask.nameEn }}</h2>
            <button class="close-btn" (click)="closeSubmitModal()">×</button>
          </div>
          <div class="modal-body">
            <div class="task-details">
              <p><strong>Max Points:</strong> {{ selectedTask.maxPoints }}</p>
              @if (selectedTask.dueDate) {
                <p [class.overdue]="isOverdue(selectedTask)">
                  <strong>Due:</strong> {{ selectedTask.dueDate | date:'medium' }}
                  @if (isOverdue(selectedTask)) {
                    <span class="late-warning">⚠️ This submission will be marked as late</span>
                  }
                </p>
              }
            </div>

            <div class="form-group">
              <label>Submission Text</label>
              <textarea 
                [(ngModel)]="submission.submissionText" 
                rows="6" 
                placeholder="Enter your submission text, answer, or description of your work..."
              ></textarea>
            </div>

            <div class="form-group">
              <label>Submission URL (Optional)</label>
              <input 
                type="url" 
                [(ngModel)]="submission.submissionUrl" 
                placeholder="https://drive.google.com/... or link to your work"
              >
              <small>Link to Google Drive, GitHub, or any file hosting service</small>
            </div>
          </div>
          <div class="modal-footer">
            <button class="cancel-btn" (click)="closeSubmitModal()">Cancel</button>
            <button class="submit-btn" (click)="submitTask()" [disabled]="!canSubmit()">
              Submit Work
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .internship-tasks-page {
      padding: 2rem;
      max-width: 1000px;
      margin: 0 auto;
    }

    .back-link {
      display: inline-block;
      color: #667eea;
      text-decoration: none;
      margin-bottom: 1.5rem;
      font-weight: 500;
    }

    .back-link:hover {
      text-decoration: underline;
    }

    .page-header {
      margin-bottom: 2rem;
    }

    .page-header h1 {
      font-size: 1.75rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
    }

    .subtitle {
      color: #666;
    }

    .loading {
      display: flex;
      justify-content: center;
      padding: 4rem;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid #f3f3f3;
      border-top: 3px solid #247090;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .progress-summary {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .progress-card {
      background: #fff;
      border-radius: 12px;
      padding: 1.25rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
    }

    .progress-card .icon {
      font-size: 2rem;
    }

    .progress-card .value {
      font-size: 1.5rem;
      font-weight: 700;
      display: block;
    }

    .progress-card .label {
      font-size: 0.85rem;
      color: #666;
    }

    .tasks-list {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .task-card {
      background: #fff;
      border-radius: 16px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
      overflow: hidden;
      border-left: 4px solid #667eea;
    }

    .task-card.submitted {
      border-left-color: #28a745;
    }

    .task-card.overdue {
      border-left-color: #dc3545;
    }

    .task-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 1.25rem;
      border-bottom: 1px solid #f0f0f0;
    }

    .task-info h3 {
      font-size: 1.1rem;
      font-weight: 600;
      margin: 0 0 0.5rem 0;
    }

    .task-meta {
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;
    }

    .type-badge {
      background: #e3f2fd;
      color: #1565c0;
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.8rem;
      font-weight: 500;
    }

    .points {
      color: #666;
      font-size: 0.85rem;
    }

    .required-badge {
      background: #fff3cd;
      color: #856404;
      padding: 0.25rem 0.5rem;
      border-radius: 8px;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .status-badge {
      padding: 0.375rem 1rem;
      border-radius: 12px;
      font-size: 0.85rem;
      font-weight: 600;
    }

    .status-badge.pending {
      background: #e2e3e5;
      color: #383d41;
    }

    .status-badge.submitted {
      background: #d1ecf1;
      color: #0c5460;
    }

    .status-badge.graded {
      background: #d4edda;
      color: #155724;
    }

    .status-badge.overdue {
      background: #f8d7da;
      color: #721c24;
    }

    .task-body {
      padding: 1.25rem;
    }

    .instructions h4 {
      font-size: 0.9rem;
      font-weight: 600;
      margin-bottom: 0.5rem;
      color: #333;
    }

    .instructions p {
      color: #555;
      line-height: 1.6;
      white-space: pre-wrap;
    }

    .due-date {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-top: 1rem;
      padding: 0.75rem;
      background: #f8f9fa;
      border-radius: 8px;
      font-size: 0.9rem;
    }

    .due-date.overdue {
      background: #fff5f5;
      color: #dc3545;
    }

    .overdue-text {
      font-weight: 600;
    }

    .task-footer {
      padding: 1rem 1.25rem;
      background: #f8f9fa;
    }

    .submit-btn {
      display: inline-block;
      padding: 0.75rem 2rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .submit-btn:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }

    .submit-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .submission-info p {
      margin: 0.25rem 0;
      font-size: 0.9rem;
    }

    .late-badge {
      display: inline-block;
      margin-top: 0.5rem;
      padding: 0.25rem 0.5rem;
      background: #f8d7da;
      color: #721c24;
      border-radius: 8px;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .feedback-section {
      margin-top: 1rem;
      padding: 1rem;
      background: #e8f5e9;
      border-radius: 8px;
    }

    .feedback-section h5 {
      margin: 0 0 0.5rem 0;
      font-size: 0.9rem;
      color: #2e7d32;
    }

    .feedback-section p {
      margin: 0;
      color: #1b5e20;
    }

    .empty-state {
      text-align: center;
      padding: 4rem 2rem;
      background: #fff;
      border-radius: 16px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
    }

    .empty-state .icon {
      font-size: 4rem;
      display: block;
      margin-bottom: 1rem;
    }

    .empty-state h3 {
      font-size: 1.5rem;
      margin-bottom: 0.5rem;
    }

    .empty-state p {
      color: #666;
    }

    /* Modal styles */
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
    }

    .modal {
      background: #fff;
      border-radius: 16px;
      width: 90%;
      max-width: 600px;
      max-height: 90vh;
      overflow-y: auto;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem;
      border-bottom: 1px solid #e0e0e0;
    }

    .modal-header h2 {
      font-size: 1.25rem;
      margin: 0;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      color: #666;
    }

    .modal-body {
      padding: 1.5rem;
    }

    .task-details {
      background: #f8f9fa;
      padding: 1rem;
      border-radius: 8px;
      margin-bottom: 1.5rem;
    }

    .task-details p {
      margin: 0.25rem 0;
    }

    .task-details .overdue {
      color: #dc3545;
    }

    .late-warning {
      display: block;
      margin-top: 0.25rem;
      font-size: 0.85rem;
    }

    .form-group {
      margin-bottom: 1.25rem;
    }

    .form-group label {
      display: block;
      font-weight: 600;
      margin-bottom: 0.5rem;
    }

    .form-group input,
    .form-group textarea {
      width: 100%;
      padding: 0.75rem;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      font-size: 0.95rem;
      transition: border-color 0.2s;
    }

    .form-group input:focus,
    .form-group textarea:focus {
      outline: none;
      border-color: #667eea;
    }

    .form-group small {
      display: block;
      margin-top: 0.5rem;
      color: #666;
      font-size: 0.8rem;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      padding: 1.5rem;
      border-top: 1px solid #e0e0e0;
    }

    .cancel-btn {
      padding: 0.75rem 1.5rem;
      border: 2px solid #e0e0e0;
      background: #fff;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
    }

    @media (max-width: 768px) {
      .internship-tasks-page {
        padding: 1rem;
      }

      .progress-summary {
        grid-template-columns: repeat(2, 1fr);
      }

      .task-header {
        flex-direction: column;
        gap: 0.75rem;
      }
    }

    @media (max-width: 480px) {
      .progress-summary {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class InternshipTasksComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private internshipService = inject(InternshipService);
  private toastr = inject(ToastrService);

  internship = signal<Internship | null>(null);
  tasks = signal<InternshipTask[]>([]);
  submissions = signal<TaskSubmission[]>([]);
  loading = signal(false);

  showSubmitModal = false;
  selectedTask: InternshipTask | null = null;
  submission: CreateSubmissionDto = {
    submissionText: '',
    submissionUrl: ''
  };

  get submittedCount(): number {
    return this.submissions().length;
  }

  get pendingCount(): number {
    return this.tasks().length - this.submittedCount;
  }

  get totalScore(): number {
    return this.submissions().reduce((sum, s) => sum + (s.score || 0), 0);
  }

  get totalMaxPoints(): number {
    return this.tasks().reduce((sum, t) => sum + t.maxPoints, 0);
  }

  ngOnInit() {
    const internshipId = this.route.snapshot.paramMap.get('internshipId');
    if (internshipId) {
      this.loadData(internshipId);
    }
  }

  loadData(internshipId: string) {
    this.loading.set(true);

    // Load internship details
    this.internshipService.getInternship(internshipId).subscribe(internship => {
      this.internship.set(internship);
    });

    // Load tasks
    this.internshipService.getInternshipTasks(internshipId).subscribe(tasks => {
      this.tasks.set(tasks);
    });

    // Load user's submissions
    this.internshipService.getMySubmissions(internshipId).subscribe({
      next: (subs) => {
        this.submissions.set(subs);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  isTaskSubmitted(taskId: string): boolean {
    return this.submissions().some(s => s.taskId === taskId);
  }

  getSubmission(taskId: string): TaskSubmission | undefined {
    return this.submissions().find(s => s.taskId === taskId);
  }

  isOverdue(task: InternshipTask): boolean {
    if (!task.dueDate) return false;
    return new Date(task.dueDate) < new Date() && !this.isTaskSubmitted(task.id);
  }

  openSubmitModal(task: InternshipTask) {
    this.selectedTask = task;
    this.submission = { submissionText: '', submissionUrl: '' };
    this.showSubmitModal = true;
  }

  closeSubmitModal() {
    this.showSubmitModal = false;
    this.selectedTask = null;
    this.submission = { submissionText: '', submissionUrl: '' };
  }

  canSubmit(): boolean {
    return !!(this.submission.submissionText || this.submission.submissionUrl);
  }

  submitTask() {
    if (!this.selectedTask || !this.canSubmit()) return;

    this.internshipService.submitTask(this.selectedTask.id, this.submission).subscribe({
      next: (result) => {
        if (result) {
          this.toastr.success('Task submitted successfully!');
          // Reload submissions
          const internshipId = this.route.snapshot.paramMap.get('internshipId');
          if (internshipId) {
            this.internshipService.getMySubmissions(internshipId).subscribe(subs => {
              this.submissions.set(subs);
            });
          }
          this.closeSubmitModal();
        } else {
          this.toastr.error('Failed to submit task');
        }
      },
      error: () => {
        this.toastr.error('Failed to submit task');
      }
    });
  }
}
