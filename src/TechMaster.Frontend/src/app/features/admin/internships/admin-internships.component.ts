import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { InternshipService, Internship, CreateInternshipDto, InternshipTask, CreateTaskDto, UpdateTaskDto, TaskSubmission, GradeSubmissionDto } from '@core/services/internship.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-admin-internships',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  template: `
    <div class="internships-page">
      <div class="page-header">
        <div class="header-left">
          <h1>Internship Management</h1>
          <p class="subtitle">Manage internship listings and applications</p>
        </div>
        <button class="add-btn" (click)="openAddModal()">
          <span>+</span>
          Add Internship
        </button>
      </div>

      <!-- Stats -->
      <div class="stats-row">
        <div class="stat-card">
          <span class="stat-icon">💼</span>
          <div class="stat-info">
            <span class="stat-value">{{ totalInternships }}</span>
            <span class="stat-label">Total Internships</span>
          </div>
        </div>
        <div class="stat-card">
          <span class="stat-icon">✅</span>
          <div class="stat-info">
            <span class="stat-value">{{ activeInternships }}</span>
            <span class="stat-label">Active</span>
          </div>
        </div>
        <div class="stat-card">
          <span class="stat-icon">👥</span>
          <div class="stat-info">
            <span class="stat-value">{{ totalApplicants }}</span>
            <span class="stat-label">Total Applicants</span>
          </div>
        </div>
        <div class="stat-card">
          <span class="stat-icon">🏢</span>
          <div class="stat-info">
            <span class="stat-value">{{ partnerCompanies }}</span>
            <span class="stat-label">Partner Companies</span>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="filters-bar">
        <div class="search-box">
          <span class="search-icon">🔍</span>
          <input 
            type="text" 
            [(ngModel)]="searchQuery" 
            (ngModelChange)="onSearchChange()"
            placeholder="Search internships..."
          >
        </div>

        <div class="filter-tabs">
          @for (tab of statusTabs; track tab.value) {
            <button 
              [class.active]="activeStatus === tab.value" 
              (click)="setStatus(tab.value)"
            >
              {{ tab.label }}
            </button>
          }
        </div>

        <select [(ngModel)]="typeFilter" (ngModelChange)="filterInternships()">
          <option value="all">All Types</option>
          <option value="Remote">Remote</option>
          <option value="OnSite">On-Site</option>
        </select>
      </div>

      <!-- Internships Table -->
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Internship</th>
              <th>Company</th>
              <th>Type</th>
              <th>Duration</th>
              <th>Applicants</th>
              <th>Deadline</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (internship of filteredInternships(); track internship.id) {
              <tr>
                <td>
                  <div class="internship-cell">
                    <span class="internship-title">{{ internship.nameEn || internship.title }}</span>
                    <span class="internship-location">📍 {{ internship.location }}</span>
                  </div>
                </td>
                <td>
                  <div class="company-cell">
                    <div class="company-logo">
                      @if (internship.companyLogoUrl) {
                        <img [src]="internship.companyLogoUrl" [alt]="internship.companyName">
                      } @else {
                        <span>{{ (internship.companyName || 'C').charAt(0) }}</span>
                      }
                    </div>
                    <span>{{ internship.companyName || internship.company }}</span>
                  </div>
                </td>
                <td>
                  <span class="type-badge" [class]="internship.isRemote ? 'remote' : 'onsite'">
                    {{ internship.isRemote ? 'Remote' : 'On-Site' }}
                  </span>
                </td>
                <td>{{ internship.durationInWeeks }} weeks</td>
                <td>
                  <span class="applicants-count">{{ internship.applicationCount || 0 }}</span>
                </td>
                <td>
                  <span [class.expired]="isExpired(internship.applicationDeadline)">
                    {{ internship.applicationDeadline | date:'mediumDate' }}
                  </span>
                </td>
                <td>
                  <span class="status-badge" [class]="internship.status.toLowerCase()">
                    {{ internship.status }}
                  </span>
                </td>
                <td>
                  <div class="actions-cell">
                    <button class="action-btn" title="Manage Tasks" (click)="manageTasks(internship)">📋</button>
                    <button class="action-btn" title="View Applicants" (click)="viewApplicants(internship)">👥</button>
                    <button class="action-btn" title="Edit" (click)="editInternship(internship)">✏️</button>
                    @if (internship.status === 'Open') {
                      <button class="action-btn warning" title="Close" (click)="closeInternship(internship)">⏸️</button>
                    } @else {
                      <button class="action-btn success" title="Open" (click)="reopenInternship(internship)">▶️</button>
                    }
                    <button class="action-btn danger" title="Delete" (click)="deleteInternship(internship)">🗑️</button>
                  </div>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="8" class="empty-state">
                  <span>💼</span>
                  <p>No internships found</p>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="pagination">
        <span class="page-info">
          Showing {{ (currentPage - 1) * pageSize + 1 }}-{{ Math.min(currentPage * pageSize, totalCount) }} 
          of {{ totalCount }}
        </span>
        <div class="page-controls">
          <button [disabled]="currentPage === 1" (click)="previousPage()">←</button>
          @for (page of getPages(); track page) {
            <button [class.active]="page === currentPage" (click)="goToPage(page)">{{ page }}</button>
          }
          <button [disabled]="currentPage === totalPages" (click)="nextPage()">→</button>
        </div>
      </div>
    </div>

    <!-- Add/Edit Modal -->
    @if (showAddModal || showEditModal) {
      <div class="modal-overlay" (click)="closeModal()">
        <div class="modal large-modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>{{ showEditModal ? 'Edit Internship' : 'Add Internship' }}</h2>
            <button class="close-btn" (click)="closeModal()">×</button>
          </div>
          <div class="modal-body">
            <div class="form-row">
              <div class="form-group">
                <label>Title (English) *</label>
                <input type="text" [(ngModel)]="modalInternship.nameEn" required>
              </div>
              <div class="form-group">
                <label>Title (Arabic)</label>
                <input type="text" [(ngModel)]="modalInternship.nameAr" dir="rtl">
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Company Name *</label>
                <input type="text" [(ngModel)]="modalInternship.companyName">
              </div>
              <div class="form-group">
                <label>Company Name (Arabic)</label>
                <input type="text" [(ngModel)]="modalInternship.companyNameAr" dir="rtl">
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Location</label>
                <input type="text" [(ngModel)]="modalInternship.location" placeholder="Cairo, Egypt">
              </div>
              <div class="form-group">
                <label>Remote Work</label>
                <select [(ngModel)]="modalInternship.isRemote">
                  <option [ngValue]="false">On-Site</option>
                  <option [ngValue]="true">Remote</option>
                </select>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Duration (Weeks) *</label>
                <input type="number" [(ngModel)]="modalInternship.durationInWeeks" min="1">
              </div>
              <div class="form-group">
                <label>Max Applicants</label>
                <input type="number" [(ngModel)]="modalInternship.maxApplicants" min="1">
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Application Deadline</label>
                <input type="date" [(ngModel)]="modalInternship.applicationDeadline">
              </div>
              <div class="form-group">
                <label>Start Date</label>
                <input type="date" [(ngModel)]="modalInternship.startDate">
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>End Date</label>
                <input type="date" [(ngModel)]="modalInternship.endDate">
              </div>
              <div class="form-group">
                <label>Featured Internship</label>
                <select [(ngModel)]="modalInternship.isFeatured">
                  <option [ngValue]="false">No</option>
                  <option [ngValue]="true">Yes</option>
                </select>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Paid Internship</label>
                <select [(ngModel)]="modalInternship.isPaid">
                  <option [ngValue]="false">Unpaid</option>
                  <option [ngValue]="true">Paid</option>
                </select>
              </div>
              <div class="form-group">
                <label>Stipend (if paid)</label>
                <input type="number" [(ngModel)]="modalInternship.stipend" [disabled]="!modalInternship.isPaid" placeholder="Monthly stipend amount">
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Requires Fee</label>
                <select [(ngModel)]="modalInternship.hasFee">
                  <option [ngValue]="false">No Fee Required</option>
                  <option [ngValue]="true">Fee Required</option>
                </select>
              </div>
              <div class="form-group">
                <label>Fee Amount</label>
                <input type="number" [(ngModel)]="modalInternship.feeAmount" [disabled]="!modalInternship.hasFee" placeholder="Entry fee amount">
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Currency</label>
                <select [(ngModel)]="modalInternship.currency">
                  <option value="EGP">EGP (ج.م)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="SAR">SAR (ر.س)</option>
                  <option value="AED">AED (د.إ)</option>
                </select>
              </div>
              <div class="form-group">
                <label>Status</label>
                <select [(ngModel)]="modalInternship.status">
                  <option value="Open">Open</option>
                  <option value="Closed">Closed</option>
                  <option value="Draft">Draft</option>
                </select>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Location (Arabic)</label>
                <input type="text" [(ngModel)]="modalInternship.locationAr" dir="rtl" placeholder="الموقع">
              </div>
              <div class="form-group">
                <label>Thumbnail URL</label>
                <input type="text" [(ngModel)]="modalInternship.thumbnailUrl" placeholder="https://...">
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Company Logo URL</label>
                <input type="text" [(ngModel)]="modalInternship.companyLogoUrl" placeholder="https://...">
              </div>
              <div class="form-group">
                <label>Featured</label>
                <select [(ngModel)]="modalInternship.isFeatured">
                  <option [ngValue]="false">No</option>
                  <option [ngValue]="true">Yes - Featured</option>
                </select>
              </div>
            </div>
            <div class="form-group">
              <label>Description (English)</label>
              <textarea [(ngModel)]="modalInternship.descriptionEn" rows="3"></textarea>
            </div>
            <div class="form-group">
              <label>Description (Arabic)</label>
              <textarea [(ngModel)]="modalInternship.descriptionAr" rows="3" dir="rtl" placeholder="الوصف بالعربية"></textarea>
            </div>
            <div class="form-group">
              <label>Requirements (English)</label>
              <textarea [(ngModel)]="modalInternship.requirementsEn" rows="3" placeholder="List the requirements..."></textarea>
            </div>
            <div class="form-group">
              <label>Requirements (Arabic)</label>
              <textarea [(ngModel)]="modalInternship.requirementsAr" rows="3" dir="rtl" placeholder="المتطلبات بالعربية"></textarea>
            </div>
            <div class="form-group">
              <label>Responsibilities (English)</label>
              <textarea [(ngModel)]="modalInternship.responsibilitiesEn" rows="3" placeholder="List the responsibilities..."></textarea>
            </div>
            <div class="form-group">
              <label>Responsibilities (Arabic)</label>
              <textarea [(ngModel)]="modalInternship.responsibilitiesAr" rows="3" dir="rtl" placeholder="المسؤوليات بالعربية"></textarea>
            </div>
            <div class="form-group">
              <label>Benefits (English)</label>
              <textarea [(ngModel)]="modalInternship.benefitsEn" rows="3" placeholder="List the benefits..."></textarea>
            </div>
            <div class="form-group">
              <label>Benefits (Arabic)</label>
              <textarea [(ngModel)]="modalInternship.benefitsAr" rows="3" dir="rtl" placeholder="المميزات بالعربية"></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="cancel-btn" (click)="closeModal()">Cancel</button>
            <button class="submit-btn" (click)="saveInternship()" [disabled]="!isValidForm()">Save</button>
          </div>
        </div>
      </div>
    }

    <!-- Applicants Modal -->
    @if (showApplicantsModal && selectedInternship) {
      <div class="modal-overlay" (click)="closeApplicantsModal()">
        <div class="modal large-modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>Applicants - {{ selectedInternship.nameEn }}</h2>
            <button class="close-btn" (click)="closeApplicantsModal()">×</button>
          </div>
          <div class="modal-body">
            @if (applicants().length > 0) {
              <table class="applicants-table">
                <thead>
                  <tr>
                    <th>Applicant</th>
                    <th>Applied</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  @for (app of applicants(); track app.id) {
                    <tr>
                      <td>
                        <div class="applicant-info">
                          <span class="name">{{ app.userName }}</span>
                          <span class="email">{{ app.userEmail }}</span>
                        </div>
                      </td>
                      <td>{{ app.createdAt | date:'mediumDate' }}</td>
                      <td>
                        <span class="status-badge" [class]="app.status.toLowerCase()">{{ app.status }}</span>
                      </td>
                      <td>
                        <div class="actions-cell">
                          @if (app.resumeUrl) {
                            <a [href]="app.resumeUrl" target="_blank" class="action-btn" title="View Resume">📄</a>
                          }
                          <button class="action-btn success" title="Accept" (click)="reviewApplication(app.id, 'Accepted')">✅</button>
                          <button class="action-btn danger" title="Reject" (click)="reviewApplication(app.id, 'Rejected')">❌</button>
                        </div>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            } @else {
              <div class="empty-state">
                <span>👥</span>
                <p>No applicants yet</p>
              </div>
            }
          </div>
        </div>
      </div>
    }

    <!-- Tasks Modal -->
    @if (showTasksModal && selectedInternship) {
      <div class="modal-overlay" (click)="closeTasksModal()">
        <div class="modal large-modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>Tasks - {{ selectedInternship.nameEn }}</h2>
            <button class="close-btn" (click)="closeTasksModal()">×</button>
          </div>
          <div class="modal-body">
            <div class="tasks-header">
              <button class="add-btn small" (click)="openAddTaskModal()">
                <span>+</span> Add Task
              </button>
            </div>
            @if (tasks().length > 0) {
              <table class="tasks-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Task Name</th>
                    <th>Due Date</th>
                    <th>Max Points</th>
                    <th>Submissions</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  @for (task of tasks(); track task.id; let i = $index) {
                    <tr>
                      <td>{{ i + 1 }}</td>
                      <td>
                        <div class="task-info">
                          <span class="task-name">{{ task.nameEn }}</span>
                          <span class="task-type">{{ task.taskType }}</span>
                        </div>
                      </td>
                      <td>
                        @if (task.dueDate) {
                          <span [class.expired]="isTaskExpired(task.dueDate)">
                            {{ task.dueDate | date:'mediumDate' }}
                          </span>
                        } @else {
                          <span class="no-deadline">No deadline</span>
                        }
                      </td>
                      <td>{{ task.maxPoints }} pts</td>
                      <td>
                        <button class="submissions-btn" (click)="viewSubmissions(task)">
                          {{ task.submissionCount }} submissions
                        </button>
                      </td>
                      <td>
                        <span class="status-badge" [class]="task.isActive ? 'active' : 'inactive'">
                          {{ task.isActive ? 'Active' : 'Inactive' }}
                        </span>
                      </td>
                      <td>
                        <div class="actions-cell">
                          <button class="action-btn" title="Edit" (click)="editTask(task)">✏️</button>
                          <button class="action-btn danger" title="Delete" (click)="deleteTask(task)">🗑️</button>
                        </div>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            } @else {
              <div class="empty-state">
                <span>📋</span>
                <p>No tasks yet. Add your first task!</p>
              </div>
            }
          </div>
        </div>
      </div>
    }

    <!-- Add/Edit Task Modal -->
    @if (showAddTaskModal || showEditTaskModal) {
      <div class="modal-overlay" (click)="closeTaskModal()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>{{ showEditTaskModal ? 'Edit Task' : 'Add Task' }}</h2>
            <button class="close-btn" (click)="closeTaskModal()">×</button>
          </div>
          <div class="modal-body">
            <div class="form-row">
              <div class="form-group">
                <label>Task Name (English) *</label>
                <input type="text" [(ngModel)]="modalTask.nameEn" required>
              </div>
              <div class="form-group">
                <label>Task Name (Arabic)</label>
                <input type="text" [(ngModel)]="modalTask.nameAr" dir="rtl">
              </div>
            </div>
            <div class="form-group">
              <label>Instructions (English) *</label>
              <textarea [(ngModel)]="modalTask.instructions" rows="4" placeholder="Enter task instructions..."></textarea>
            </div>
            <div class="form-group">
              <label>Instructions (Arabic)</label>
              <textarea [(ngModel)]="modalTask.instructionsAr" rows="4" dir="rtl" placeholder="أدخل تعليمات المهمة..."></textarea>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Due Date</label>
                <input type="datetime-local" [(ngModel)]="modalTask.dueDate">
              </div>
              <div class="form-group">
                <label>Max Points</label>
                <input type="number" [(ngModel)]="modalTask.maxPoints" min="1">
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Task Type</label>
                <select [(ngModel)]="modalTask.taskType">
                  <option [ngValue]="0">Assignment</option>
                  <option [ngValue]="1">Quiz</option>
                  <option [ngValue]="2">Project</option>
                  <option [ngValue]="3">Presentation</option>
                </select>
              </div>
              <div class="form-group">
                <label>Order</label>
                <input type="number" [(ngModel)]="modalTask.sortOrder" min="0">
              </div>
            </div>
            <div class="form-row">
              <div class="form-group checkbox-group">
                <label>
                  <input type="checkbox" [(ngModel)]="modalTask.isRequired">
                  Required Task
                </label>
              </div>
              @if (showEditTaskModal) {
                <div class="form-group checkbox-group">
                  <label>
                    <input type="checkbox" [(ngModel)]="modalTask.isActive">
                    Active
                  </label>
                </div>
              }
            </div>
          </div>
          <div class="modal-footer">
            <button class="cancel-btn" (click)="closeTaskModal()">Cancel</button>
            <button class="submit-btn" (click)="saveTask()" [disabled]="!isValidTaskForm()">Save</button>
          </div>
        </div>
      </div>
    }

    <!-- Submissions Modal -->
    @if (showSubmissionsModal && selectedTask) {
      <div class="modal-overlay" (click)="closeSubmissionsModal()">
        <div class="modal large-modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>Submissions - {{ selectedTask.nameEn }}</h2>
            <button class="close-btn" (click)="closeSubmissionsModal()">×</button>
          </div>
          <div class="modal-body">
            @if (submissions().length > 0) {
              <table class="submissions-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Submitted</th>
                    <th>Status</th>
                    <th>Score</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  @for (sub of submissions(); track sub.id) {
                    <tr [class.late]="sub.isLate">
                      <td>
                        <div class="student-info">
                          <span class="name">{{ sub.userName }}</span>
                          <span class="email">{{ sub.userEmail }}</span>
                        </div>
                      </td>
                      <td>
                        <span>{{ sub.submittedAt | date:'medium' }}</span>
                        @if (sub.isLate) {
                          <span class="late-badge">Late</span>
                        }
                      </td>
                      <td>
                        <span class="status-badge" [class]="sub.status.toLowerCase()">{{ sub.status }}</span>
                      </td>
                      <td>
                        @if (sub.score !== null && sub.score !== undefined) {
                          <span class="score">{{ sub.score }}/{{ sub.maxPoints }}</span>
                        } @else {
                          <span class="not-graded">Not graded</span>
                        }
                      </td>
                      <td>
                        <div class="actions-cell">
                          @if (sub.submissionUrl) {
                            <a [href]="sub.submissionUrl" target="_blank" class="action-btn" title="View Submission">📄</a>
                          }
                          <button class="action-btn" title="Grade" (click)="openGradeModal(sub)">📝</button>
                        </div>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            } @else {
              <div class="empty-state">
                <span>📝</span>
                <p>No submissions yet</p>
              </div>
            }
          </div>
        </div>
      </div>
    }

    <!-- Grade Modal -->
    @if (showGradeModal && selectedSubmission) {
      <div class="modal-overlay" (click)="closeGradeModal()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>Grade Submission</h2>
            <button class="close-btn" (click)="closeGradeModal()">×</button>
          </div>
          <div class="modal-body">
            <div class="grade-info">
              <p><strong>Student:</strong> {{ selectedSubmission.userName }}</p>
              <p><strong>Task:</strong> {{ selectedSubmission.taskName }}</p>
              @if (selectedSubmission.submissionText) {
                <div class="submission-content">
                  <label>Submission:</label>
                  <p>{{ selectedSubmission.submissionText }}</p>
                </div>
              }
            </div>
            <div class="form-group">
              <label>Score (Max: {{ selectedSubmission.maxPoints }})</label>
              <input type="number" [(ngModel)]="gradeData.score" [max]="selectedSubmission.maxPoints" min="0">
            </div>
            <div class="form-group">
              <label>Feedback</label>
              <textarea [(ngModel)]="gradeData.feedback" rows="3" placeholder="Enter feedback..."></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="cancel-btn" (click)="closeGradeModal()">Cancel</button>
            <button class="submit-btn" (click)="submitGrade()">Submit Grade</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .internships-page {
      padding: 2rem;
      max-width: 1400px;
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
      margin-bottom: 0.25rem;
    }

    .subtitle {
      color: #666;
    }

    .add-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      background: #247090;
      color: #fff;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
    }

    .stats-row {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .stat-card {
      background: #fff;
      border-radius: 12px;
      padding: 1.25rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
    }

    .stat-icon {
      font-size: 2rem;
    }

    .stat-value {
      font-size: 1.5rem;
      font-weight: 700;
      display: block;
    }

    .stat-label {
      font-size: 0.85rem;
      color: #666;
    }

    .filters-bar {
      display: flex;
      gap: 1rem;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
    }

    .search-box {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      background: #fff;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      flex: 1;
      min-width: 250px;
      max-width: 350px;
    }

    .search-box input {
      border: none;
      outline: none;
      width: 100%;
      font-size: 0.95rem;
    }

    .filter-tabs {
      display: flex;
      gap: 0.5rem;
      background: #f8f9fa;
      padding: 0.25rem;
      border-radius: 8px;
    }

    .filter-tabs button {
      padding: 0.625rem 1rem;
      border: none;
      background: transparent;
      border-radius: 6px;
      font-weight: 500;
      cursor: pointer;
    }

    .filter-tabs button.active {
      background: #fff;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    }

    select {
      padding: 0.75rem 1rem;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      font-size: 0.95rem;
      background: #fff;
    }

    .table-container {
      background: #fff;
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      overflow: hidden;
    }

    table {
      width: 100%;
      border-collapse: collapse;
    }

    th {
      text-align: left;
      padding: 1rem 1.25rem;
      background: #f8f9fa;
      font-weight: 600;
      font-size: 0.85rem;
      color: #666;
    }

    td {
      padding: 1rem 1.25rem;
      border-bottom: 1px solid #f0f0f0;
      vertical-align: middle;
    }

    tr:hover {
      background: #f8f9fa;
    }

    .internship-cell {
      display: flex;
      flex-direction: column;
    }

    .internship-title {
      font-weight: 600;
    }

    .internship-location {
      font-size: 0.85rem;
      color: #666;
    }

    .company-cell {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .company-logo {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      background: #f0f0f0;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      color: #666;
      overflow: hidden;
    }

    .company-logo img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .type-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.8rem;
      font-weight: 600;
    }

    .type-badge.remote {
      background: #e8f5e9;
      color: #388e3c;
    }

    .type-badge.onsite {
      background: #e3f2fd;
      color: #1976d2;
    }

    .type-badge.hybrid {
      background: #fff3e0;
      color: #f57c00;
    }

    .applicants-count {
      font-weight: 600;
    }

    .expired {
      color: #dc3545;
    }

    .status-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.8rem;
      font-weight: 600;
    }

    .status-badge.active {
      background: #d4edda;
      color: #155724;
    }

    .status-badge.closed {
      background: #e2e3e5;
      color: #383d41;
    }

    .status-badge.draft {
      background: #fff3cd;
      color: #856404;
    }

    .actions-cell {
      display: flex;
      gap: 0.25rem;
    }

    .action-btn {
      width: 32px;
      height: 32px;
      border: none;
      background: transparent;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.9rem;
      transition: background 0.2s;
    }

    .action-btn:hover {
      background: #f0f0f0;
    }

    .action-btn.success:hover {
      background: #d1fae5;
    }

    .action-btn.warning:hover {
      background: #fef3c7;
    }

    .action-btn.danger:hover {
      background: #fee2e2;
    }

    .empty-state {
      text-align: center;
      padding: 3rem !important;
      color: #666;
    }

    .empty-state span {
      font-size: 3rem;
      display: block;
      margin-bottom: 1rem;
    }

    .pagination {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 1.5rem;
    }

    .page-info {
      color: #666;
    }

    .page-controls {
      display: flex;
      gap: 0.25rem;
    }

    .page-controls button {
      width: 36px;
      height: 36px;
      border: 1px solid #e0e0e0;
      background: #fff;
      border-radius: 6px;
      cursor: pointer;
    }

    .page-controls button.active {
      background: #247090;
      color: #fff;
      border-color: #247090;
    }

    .page-controls button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* Modal */
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
      width: 100%;
      max-width: 600px;
      max-height: 90vh;
      overflow: auto;
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
      font-weight: 700;
    }

    .close-btn {
      width: 36px;
      height: 36px;
      border: none;
      background: #f0f0f0;
      border-radius: 50%;
      font-size: 1.25rem;
      cursor: pointer;
    }

    .modal-body {
      padding: 1.5rem;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .form-group {
      margin-bottom: 1rem;
    }

    .form-group label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 600;
    }

    .form-group input,
    .form-group select,
    .form-group textarea {
      width: 100%;
      padding: 0.75rem 1rem;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      font-size: 0.95rem;
    }

    .form-group textarea {
      resize: vertical;
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

    .submit-btn {
      padding: 0.75rem 1.5rem;
      border: none;
      background: #247090;
      color: #fff;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
    }

    @media (max-width: 1200px) {
      .stats-row {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 768px) {
      .internships-page {
        padding: 1rem;
      }

      .stats-row {
        grid-template-columns: 1fr;
      }

      .filters-bar {
        flex-direction: column;
      }

      .search-box {
        max-width: none;
      }

      .table-container {
        overflow-x: auto;
      }

      .form-row {
        grid-template-columns: 1fr;
      }
    }

    .large-modal {
      max-width: 800px;
      max-height: 90vh;
      overflow-y: auto;
    }

    .applicants-table {
      width: 100%;
      border-collapse: collapse;
    }

    .applicants-table th,
    .applicants-table td {
      padding: 0.75rem;
      text-align: left;
      border-bottom: 1px solid #eee;
    }

    .applicant-info {
      display: flex;
      flex-direction: column;
    }

    .applicant-info .name {
      font-weight: 600;
    }

    .applicant-info .email {
      font-size: 0.85rem;
      color: #666;
    }

    .status-badge.pending {
      background: #fff3cd;
      color: #856404;
    }

    .status-badge.accepted {
      background: #d4edda;
      color: #155724;
    }

    .status-badge.rejected {
      background: #f8d7da;
      color: #721c24;
    }

    .status-badge.underreview {
      background: #e3f2fd;
      color: #1565c0;
    }

    /* Task management styles */
    .tasks-header {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 1rem;
    }

    .add-btn.small {
      padding: 0.5rem 1rem;
      font-size: 0.9rem;
    }

    .tasks-table, .submissions-table {
      width: 100%;
      border-collapse: collapse;
    }

    .tasks-table th,
    .tasks-table td,
    .submissions-table th,
    .submissions-table td {
      padding: 0.75rem;
      text-align: left;
      border-bottom: 1px solid #eee;
    }

    .task-info {
      display: flex;
      flex-direction: column;
    }

    .task-name {
      font-weight: 600;
    }

    .task-type {
      font-size: 0.8rem;
      color: #666;
    }

    .no-deadline {
      color: #999;
      font-style: italic;
    }

    .submissions-btn {
      background: #e3f2fd;
      color: #1565c0;
      border: none;
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.8rem;
      cursor: pointer;
    }

    .submissions-btn:hover {
      background: #bbdefb;
    }

    .status-badge.active {
      background: #d4edda;
      color: #155724;
    }

    .status-badge.inactive {
      background: #e2e3e5;
      color: #383d41;
    }

    .student-info {
      display: flex;
      flex-direction: column;
    }

    .student-info .name {
      font-weight: 600;
    }

    .student-info .email {
      font-size: 0.85rem;
      color: #666;
    }

    .late-badge {
      display: inline-block;
      margin-left: 0.5rem;
      padding: 0.125rem 0.5rem;
      background: #f8d7da;
      color: #721c24;
      border-radius: 8px;
      font-size: 0.7rem;
      font-weight: 600;
    }

    tr.late {
      background: #fff5f5;
    }

    .score {
      font-weight: 600;
      color: #155724;
    }

    .not-graded {
      color: #999;
      font-style: italic;
    }

    .status-badge.submitted {
      background: #fff3cd;
      color: #856404;
    }

    .status-badge.graded {
      background: #d4edda;
      color: #155724;
    }

    .grade-info {
      background: #f8f9fa;
      padding: 1rem;
      border-radius: 8px;
      margin-bottom: 1rem;
    }

    .grade-info p {
      margin: 0.25rem 0;
    }

    .submission-content {
      margin-top: 0.75rem;
      padding-top: 0.75rem;
      border-top: 1px solid #dee2e6;
    }

    .submission-content label {
      font-weight: 600;
      display: block;
      margin-bottom: 0.25rem;
    }

    .checkbox-group {
      display: flex;
      align-items: center;
    }

    .checkbox-group label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
    }

    .checkbox-group input[type="checkbox"] {
      width: 18px;
      height: 18px;
    }
  `]
})
export class AdminInternshipsComponent implements OnInit {
  private translate = inject(TranslateService);
  private internshipService = inject(InternshipService);
  private toastr = inject(ToastrService);

  internships = signal<Internship[]>([]);
  filteredInternships = signal<Internship[]>([]);
  applicants = signal<any[]>([]);
  isLoading = signal(false);

  searchQuery = '';
  activeStatus = 'all';
  typeFilter = 'all';
  currentPage = 1;
  pageSize = 10;
  totalCount = 0;
  totalPages = 1;

  totalInternships = 0;
  activeInternships = 0;
  totalApplicants = 0;
  partnerCompanies = 0;

  showAddModal = false;
  showEditModal = false;
  showApplicantsModal = false;
  selectedInternship: Internship | null = null;
  editingId: string | null = null;

  // Task management state
  showTasksModal = false;
  showAddTaskModal = false;
  showEditTaskModal = false;
  showSubmissionsModal = false;
  showGradeModal = false;
  tasks = signal<InternshipTask[]>([]);
  submissions = signal<TaskSubmission[]>([]);
  selectedTask: InternshipTask | null = null;
  selectedSubmission: TaskSubmission | null = null;
  editingTaskId: string | null = null;

  modalTask: any = {
    nameEn: '',
    nameAr: '',
    instructions: '',
    instructionsAr: '',
    dueDate: '',
    maxPoints: 100,
    taskType: 0,
    sortOrder: 0,
    isRequired: true,
    isActive: true
  };

  gradeData: any = {
    score: 0,
    feedback: ''
  };

  Math = Math;

  modalInternship: any = {
    nameEn: '',
    nameAr: '',
    companyName: '',
    companyNameAr: '',
    location: '',
    locationAr: '',
    isRemote: false,
    durationInWeeks: 8,
    maxApplicants: 10,
    applicationDeadline: '',
    startDate: '',
    endDate: '',
    isPaid: false,
    stipend: 0,
    descriptionEn: '',
    descriptionAr: '',
    requirementsEn: '',
    requirementsAr: '',
    responsibilitiesEn: '',
    responsibilitiesAr: '',
    benefitsEn: '',
    benefitsAr: ''
  };

  statusTabs = [
    { value: 'all', label: 'All' },
    { value: 'Open', label: 'Open' },
    { value: 'Closed', label: 'Closed' },
    { value: 'Draft', label: 'Draft' }
  ];

  ngOnInit() {
    this.loadInternships();
  }

  loadInternships() {
    this.isLoading.set(true);
    const params: any = {
      pageNumber: this.currentPage,
      pageSize: this.pageSize
    };

    if (this.activeStatus !== 'all') {
      params.status = this.activeStatus;
    }

    if (this.searchQuery) {
      params.search = this.searchQuery;
    }

    this.internshipService.getInternships(params).subscribe({
      next: (result) => {
        this.internships.set(result.items);
        this.totalCount = result.totalCount;
        this.totalPages = result.totalPages || Math.ceil(result.totalCount / this.pageSize);
        this.calculateStats();
        this.filterInternships();
        this.isLoading.set(false);
      },
      error: () => {
        this.toastr.error('Failed to load internships');
        this.isLoading.set(false);
      }
    });
  }

  calculateStats() {
    const all = this.internships();
    this.totalInternships = this.totalCount || all.length;
    this.activeInternships = all.filter(i => i.status === 'Open').length;
    this.totalApplicants = all.reduce((sum, i) => sum + (i.applicationCount || 0), 0);
    this.partnerCompanies = new Set(all.map(i => i.companyName).filter(Boolean)).size;
  }

  setStatus(status: string) {
    this.activeStatus = status;
    this.currentPage = 1;
    this.loadInternships();
  }

  onSearchChange() {
    this.currentPage = 1;
    this.loadInternships();
  }

  filterInternships() {
    let result = this.internships();

    if (this.typeFilter !== 'all') {
      if (this.typeFilter === 'Remote') {
        result = result.filter(i => i.isRemote);
      } else {
        result = result.filter(i => !i.isRemote);
      }
    }

    this.filteredInternships.set(result);
  }

  isExpired(deadline?: string): boolean {
    if (!deadline) return false;
    return new Date(deadline) < new Date();
  }

  viewApplicants(internship: Internship) {
    this.selectedInternship = internship;
    this.showApplicantsModal = true;
    
    this.internshipService.getInternshipApplications(internship.id).subscribe({
      next: (result) => {
        this.applicants.set(result.items);
      },
      error: () => {
        this.toastr.error('Failed to load applicants');
      }
    });
  }

  closeApplicantsModal() {
    this.showApplicantsModal = false;
    this.selectedInternship = null;
    this.applicants.set([]);
  }

  reviewApplication(applicationId: string, status: 'Accepted' | 'Rejected') {
    this.internshipService.reviewApplication(applicationId, { status }).subscribe({
      next: (success) => {
        if (success) {
          this.toastr.success(`Application ${status.toLowerCase()}`);
          if (this.selectedInternship) {
            this.viewApplicants(this.selectedInternship);
          }
        } else {
          this.toastr.error('Failed to update application');
        }
      }
    });
  }

  openAddModal() {
    this.resetModalInternship();
    this.editingId = null;
    this.showAddModal = true;
  }

  editInternship(internship: Internship) {
    this.editingId = internship.id;
    this.modalInternship = { 
      nameEn: internship.nameEn,
      nameAr: internship.nameAr || '',
      companyName: internship.companyName || '',
      companyNameAr: internship.companyNameAr || '',
      companyLogoUrl: internship.companyLogoUrl || '',
      thumbnailUrl: internship.thumbnailUrl || '',
      location: internship.location || '',
      locationAr: internship.locationAr || '',
      isRemote: internship.isRemote,
      durationInWeeks: internship.durationInWeeks,
      maxApplicants: internship.maxApplicants,
      applicationDeadline: internship.applicationDeadline?.split('T')[0] || '',
      startDate: internship.startDate?.split('T')[0] || '',
      endDate: internship.endDate?.split('T')[0] || '',
      isPaid: internship.isPaid,
      stipend: internship.stipend || 0,
      hasFee: internship.hasFee || false,
      feeAmount: internship.feeAmount || 0,
      currency: internship.currency || 'EGP',
      isFeatured: internship.isFeatured || false,
      status: internship.status || 'Open',
      descriptionEn: internship.descriptionEn || '',
      descriptionAr: internship.descriptionAr || '',
      requirementsEn: internship.requirementsEn || '',
      requirementsAr: internship.requirementsAr || '',
      responsibilitiesEn: internship.responsibilitiesEn || '',
      responsibilitiesAr: internship.responsibilitiesAr || '',
      benefitsEn: internship.benefitsEn || '',
      benefitsAr: internship.benefitsAr || ''
    };
    this.showEditModal = true;
  }

  closeInternship(internship: Internship) {
    if (confirm('Are you sure you want to close this internship?')) {
      const updateData: Partial<CreateInternshipDto> = {
        nameEn: internship.nameEn,
        nameAr: internship.nameAr,
        companyName: internship.companyName,
        durationInWeeks: internship.durationInWeeks,
        isRemote: internship.isRemote,
        maxApplicants: internship.maxApplicants,
        isPaid: internship.isPaid,
        status: 'Closed'
      };
      this.internshipService.updateInternship(internship.id, updateData).subscribe({
        next: (success) => {
          if (success) {
            this.toastr.success('Internship closed');
            this.loadInternships();
          } else {
            this.toastr.error('Failed to close internship');
          }
        }
      });
    }
  }

  reopenInternship(internship: Internship) {
    if (confirm('Are you sure you want to reopen this internship?')) {
      const updateData: Partial<CreateInternshipDto> = {
        nameEn: internship.nameEn,
        nameAr: internship.nameAr,
        companyName: internship.companyName,
        durationInWeeks: internship.durationInWeeks,
        isRemote: internship.isRemote,
        maxApplicants: internship.maxApplicants,
        isPaid: internship.isPaid,
        status: 'Open'
      };
      this.internshipService.updateInternship(internship.id, updateData).subscribe({
        next: (success) => {
          if (success) {
            this.toastr.success('Internship reopened');
            this.loadInternships();
          } else {
            this.toastr.error('Failed to reopen internship');
          }
        }
      });
    }
  }

  deleteInternship(internship: Internship) {
    if (confirm('Are you sure you want to delete this internship?')) {
      this.internshipService.deleteInternship(internship.id).subscribe({
        next: (success) => {
          if (success) {
            this.toastr.success('Internship deleted');
            this.loadInternships();
          } else {
            this.toastr.error('Failed to delete internship');
          }
        }
      });
    }
  }

  isValidForm(): boolean {
    return !!(this.modalInternship.nameEn && this.modalInternship.companyName && this.modalInternship.durationInWeeks > 0);
  }

  saveInternship() {
    if (!this.isValidForm()) {
      this.toastr.error('Please fill in required fields');
      return;
    }

    const data: CreateInternshipDto = {
      nameEn: this.modalInternship.nameEn,
      nameAr: this.modalInternship.nameAr,
      companyName: this.modalInternship.companyName,
      companyNameAr: this.modalInternship.companyNameAr,
      companyLogoUrl: this.modalInternship.companyLogoUrl || undefined,
      thumbnailUrl: this.modalInternship.thumbnailUrl || undefined,
      location: this.modalInternship.location,
      locationAr: this.modalInternship.locationAr,
      isRemote: this.modalInternship.isRemote,
      durationInWeeks: this.modalInternship.durationInWeeks,
      maxApplicants: this.modalInternship.maxApplicants,
      applicationDeadline: this.modalInternship.applicationDeadline || undefined,
      startDate: this.modalInternship.startDate || undefined,
      endDate: this.modalInternship.endDate || undefined,
      isPaid: this.modalInternship.isPaid,
      stipend: this.modalInternship.isPaid ? this.modalInternship.stipend : undefined,
      hasFee: this.modalInternship.hasFee,
      feeAmount: this.modalInternship.hasFee ? this.modalInternship.feeAmount : undefined,
      currency: this.modalInternship.currency || 'EGP',
      status: this.modalInternship.status as 'Open' | 'Closed' | 'Draft',
      descriptionEn: this.modalInternship.descriptionEn,
      descriptionAr: this.modalInternship.descriptionAr,
      requirementsEn: this.modalInternship.requirementsEn,
      requirementsAr: this.modalInternship.requirementsAr,
      responsibilitiesEn: this.modalInternship.responsibilitiesEn,
      responsibilitiesAr: this.modalInternship.responsibilitiesAr,
      benefitsEn: this.modalInternship.benefitsEn,
      benefitsAr: this.modalInternship.benefitsAr
    };

    if (this.editingId) {
      this.internshipService.updateInternship(this.editingId, data).subscribe({
        next: (success) => {
          if (success) {
            this.toastr.success('Internship updated');
            this.loadInternships();
            this.closeModal();
          } else {
            this.toastr.error('Failed to update internship');
          }
        }
      });
    } else {
      this.internshipService.createInternship(data).subscribe({
        next: (result) => {
          if (result) {
            this.toastr.success('Internship created');
            this.loadInternships();
            this.closeModal();
          } else {
            this.toastr.error('Failed to create internship');
          }
        }
      });
    }
  }

  resetModalInternship() {
    this.modalInternship = {
      nameEn: '',
      nameAr: '',
      companyName: '',
      companyNameAr: '',
      companyLogoUrl: '',
      thumbnailUrl: '',
      location: '',
      locationAr: '',
      isRemote: false,
      durationInWeeks: 8,
      maxApplicants: 10,
      applicationDeadline: '',
      startDate: '',
      endDate: '',
      isPaid: false,
      stipend: 0,
      hasFee: false,
      feeAmount: 0,
      currency: 'EGP',
      isFeatured: false,
      status: 'Open',
      descriptionEn: '',
      descriptionAr: '',
      requirementsEn: '',
      requirementsAr: '',
      responsibilitiesEn: '',
      responsibilitiesAr: '',
      benefitsEn: '',
      benefitsAr: ''
    };
  }

  closeModal() {
    this.showAddModal = false;
    this.showEditModal = false;
    this.editingId = null;
    this.resetModalInternship();
  }

  getPages(): number[] {
    const pages = [];
    const maxPages = Math.min(this.totalPages, 5);
    for (let i = 1; i <= maxPages; i++) {
      pages.push(i);
    }
    return pages;
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadInternships();
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadInternships();
    }
  }

  goToPage(page: number) {
    this.currentPage = page;
    this.loadInternships();
  }

  // Task management methods
  manageTasks(internship: Internship) {
    this.selectedInternship = internship;
    this.loadTasks(internship.id);
    this.showTasksModal = true;
  }

  loadTasks(internshipId: string) {
    this.internshipService.getInternshipTasks(internshipId).subscribe({
      next: (tasks) => {
        this.tasks.set(tasks);
      },
      error: () => {
        this.toastr.error('Failed to load tasks');
      }
    });
  }

  closeTasksModal() {
    this.showTasksModal = false;
    this.selectedInternship = null;
    this.tasks.set([]);
  }

  openAddTaskModal() {
    this.resetModalTask();
    this.editingTaskId = null;
    this.showAddTaskModal = true;
  }

  editTask(task: InternshipTask) {
    this.editingTaskId = task.id;
    this.modalTask = {
      nameEn: task.nameEn,
      nameAr: task.nameAr || '',
      instructions: task.instructions,
      instructionsAr: task.instructionsAr || '',
      dueDate: task.dueDate ? task.dueDate.slice(0, 16) : '',
      maxPoints: task.maxPoints,
      taskType: this.getTaskTypeValue(task.taskType),
      sortOrder: task.sortOrder,
      isRequired: task.isRequired,
      isActive: task.isActive
    };
    this.showEditTaskModal = true;
  }

  getTaskTypeValue(taskType: string): number {
    switch (taskType) {
      case 'Assignment': return 0;
      case 'Quiz': return 1;
      case 'Project': return 2;
      case 'Presentation': return 3;
      default: return 0;
    }
  }

  deleteTask(task: InternshipTask) {
    if (confirm('Are you sure you want to delete this task?')) {
      this.internshipService.deleteTask(task.id).subscribe({
        next: (success) => {
          if (success) {
            this.toastr.success('Task deleted');
            if (this.selectedInternship) {
              this.loadTasks(this.selectedInternship.id);
            }
          } else {
            this.toastr.error('Failed to delete task');
          }
        }
      });
    }
  }

  isValidTaskForm(): boolean {
    return !!(this.modalTask.nameEn && this.modalTask.instructions);
  }

  saveTask() {
    if (!this.isValidTaskForm() || !this.selectedInternship) {
      this.toastr.error('Please fill in required fields');
      return;
    }

    if (this.editingTaskId) {
      const updateData: UpdateTaskDto = {
        nameEn: this.modalTask.nameEn,
        nameAr: this.modalTask.nameAr,
        instructions: this.modalTask.instructions,
        instructionsAr: this.modalTask.instructionsAr,
        dueDate: this.modalTask.dueDate || undefined,
        maxPoints: this.modalTask.maxPoints,
        taskType: this.modalTask.taskType,
        sortOrder: this.modalTask.sortOrder,
        isRequired: this.modalTask.isRequired,
        isActive: this.modalTask.isActive
      };

      this.internshipService.updateTask(this.editingTaskId, updateData).subscribe({
        next: (result) => {
          if (result) {
            this.toastr.success('Task updated');
            this.loadTasks(this.selectedInternship!.id);
            this.closeTaskModal();
          } else {
            this.toastr.error('Failed to update task');
          }
        }
      });
    } else {
      const createData: CreateTaskDto = {
        nameEn: this.modalTask.nameEn,
        nameAr: this.modalTask.nameAr,
        instructions: this.modalTask.instructions,
        instructionsAr: this.modalTask.instructionsAr,
        dueDate: this.modalTask.dueDate || undefined,
        maxPoints: this.modalTask.maxPoints,
        taskType: this.modalTask.taskType,
        sortOrder: this.modalTask.sortOrder,
        isRequired: this.modalTask.isRequired
      };

      this.internshipService.createTask(this.selectedInternship.id, createData).subscribe({
        next: (result) => {
          if (result) {
            this.toastr.success('Task created');
            this.loadTasks(this.selectedInternship!.id);
            this.closeTaskModal();
          } else {
            this.toastr.error('Failed to create task');
          }
        }
      });
    }
  }

  resetModalTask() {
    this.modalTask = {
      nameEn: '',
      nameAr: '',
      instructions: '',
      instructionsAr: '',
      dueDate: '',
      maxPoints: 100,
      taskType: 0,
      sortOrder: 0,
      isRequired: true,
      isActive: true
    };
  }

  closeTaskModal() {
    this.showAddTaskModal = false;
    this.showEditTaskModal = false;
    this.editingTaskId = null;
    this.resetModalTask();
  }

  isTaskExpired(dueDate: string): boolean {
    return new Date(dueDate) < new Date();
  }

  // Submission management methods
  viewSubmissions(task: InternshipTask) {
    this.selectedTask = task;
    this.loadSubmissions(task.id);
    this.showSubmissionsModal = true;
  }

  loadSubmissions(taskId: string) {
    this.internshipService.getTaskSubmissions(taskId).subscribe({
      next: (subs) => {
        this.submissions.set(subs);
      },
      error: () => {
        this.toastr.error('Failed to load submissions');
      }
    });
  }

  closeSubmissionsModal() {
    this.showSubmissionsModal = false;
    this.selectedTask = null;
    this.submissions.set([]);
  }

  openGradeModal(submission: TaskSubmission) {
    this.selectedSubmission = submission;
    this.gradeData = {
      score: submission.score || 0,
      feedback: submission.feedback || ''
    };
    this.showGradeModal = true;
  }

  closeGradeModal() {
    this.showGradeModal = false;
    this.selectedSubmission = null;
    this.gradeData = { score: 0, feedback: '' };
  }

  submitGrade() {
    if (!this.selectedSubmission) return;

    const gradeDto: GradeSubmissionDto = {
      score: this.gradeData.score,
      feedback: this.gradeData.feedback
    };

    this.internshipService.gradeSubmission(this.selectedSubmission.id, gradeDto).subscribe({
      next: (result) => {
        if (result) {
          this.toastr.success('Submission graded');
          if (this.selectedTask) {
            this.loadSubmissions(this.selectedTask.id);
          }
          this.closeGradeModal();
        } else {
          this.toastr.error('Failed to grade submission');
        }
      }
    });
  }
}
