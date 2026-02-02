import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CourseService } from '../../../core/services/course.service';
import { ToastrService } from 'ngx-toastr';

interface Course {
  id: string;
  slug: string;
  title: string;
  thumbnail: string;
  instructor: string;
  category: string;
  status: 'Published' | 'Draft' | 'UnderReview' | 'Rejected' | 'Archived';
  price: number;
  enrollments: number;
  rating: number;
  createdAt: Date;
}

@Component({
  selector: 'app-admin-courses',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  template: `
    <div class="courses-page">
      <div class="page-header">
        <div class="header-left">
          <h1>Course Management</h1>
          <p class="subtitle">Manage all courses</p>
        </div>
        <button class="add-btn" (click)="addCourse()">
          <span>+</span>
          Add Course
        </button>
      </div>

      <!-- Stats Cards -->
      <div class="stats-row">
        <div class="stat-card">
          <span class="stat-icon">📚</span>
          <div class="stat-info">
            <span class="stat-value">{{ totalCourses }}</span>
            <span class="stat-label">Total Courses</span>
          </div>
        </div>
        <div class="stat-card">
          <span class="stat-icon">✅</span>
          <div class="stat-info">
            <span class="stat-value">{{ publishedCourses }}</span>
            <span class="stat-label">Published</span>
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
            (ngModelChange)="filterCourses()"
            placeholder="Search courses..."
          >
        </div>



      </div>

      <!-- Courses Table -->
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Course</th>
              <th>Instructor</th>
              <th>Category</th>
              <th>Status</th>
              <th>Price</th>
              <th>Enrollments</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (course of filteredCourses(); track course.id) {
              <tr>
                <td>
                  <div class="course-cell">
                    <div class="course-info">
                      <span class="course-title">{{ course.title }}</span>
                      <span class="course-date">{{ course.createdAt | date:'mediumDate' }}</span>
                    </div>
                  </div>
                </td>
                <td>{{ course.instructor }}</td>
                <td>
                  <span class="category-badge">{{ course.category }}</span>
                </td>
                <td>
                  <span class="status-badge" [class]="course.status.toLowerCase()">
                    {{ course.status }}
                  </span>
                </td>
                <td>
                  @if (course.price === 0) {
                    <span class="free-badge">Free</span>
                  } @else {
                    <span>\{{ course.price }} EGP</span>
                  }
                </td>
                <td>{{ course.enrollments | number }}</td>

                <td>
                  <div class="actions-cell">
                    <button class="action-btn" title="View" (click)="viewCourse(course)">👁️</button>
                    @if (course.status === 'UnderReview') {
                      <button class="action-btn success" title="Approve" (click)="approveCourse(course)">✅</button>
                      <button class="action-btn danger" title="Reject" (click)="rejectCourse(course)">❌</button>
                    }
                    <button class="action-btn" title="Edit" (click)="editCourse(course)">✏️</button>
                    <button class="action-btn danger" title="Delete" (click)="deleteCourse(course)">🗑️</button>
                  </div>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="8" class="empty-state">
                  <span>📚</span>
                  <p>No courses found</p>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="pagination">
        <span class="page-info">
          Showing 1-{{ filteredCourses().length }} 
          of {{ filteredCourses().length }}
        </span>
        <div class="page-controls">
          <button disabled>←</button>
          <button class="active">1</button>
          <button disabled>→</button>
        </div>
      </div>
    </div>

    <!-- Review Modal -->
    @if (showReviewModal) {
      <div class="modal-overlay" (click)="closeModal()">
        <div class="modal review-modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>Review Course</h2>
            <button class="close-btn" (click)="closeModal()">×</button>
          </div>
          <div class="modal-body">
            <div class="course-preview">
              <h3>{{ selectedCourse?.title }}</h3>
              <p>By: {{ selectedCourse?.instructor }}</p>
            </div>
            <div class="form-group">
              <label>Feedback</label>
              <textarea [(ngModel)]="reviewFeedback" rows="4" placeholder="Enter your feedback..."></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="reject-btn" (click)="confirmReject()">
              Reject
            </button>
            <button class="approve-btn" (click)="confirmApprove()">
              Approve
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .courses-page {
      padding: 2rem;
      max-width: 1400px;
      margin: 0 auto;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
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
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .add-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }

    .add-btn span {
      font-size: 1.25rem;
      font-weight: bold;
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

    .course-cell {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .course-thumbnail {
      width: 60px;
      height: 40px;
      border-radius: 6px;
      background: #f0f0f0;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }

    .course-thumbnail img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .course-info {
      display: flex;
      flex-direction: column;
    }

    .course-title {
      font-weight: 600;
      max-width: 200px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .course-date {
      font-size: 0.8rem;
      color: #666;
    }

    .category-badge {
      padding: 0.25rem 0.75rem;
      background: #f0f0f0;
      border-radius: 12px;
      font-size: 0.8rem;
    }

    .status-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.8rem;
      font-weight: 600;
    }

    .status-badge.published {
      background: #d4edda;
      color: #155724;
    }

    .status-badge.draft {
      background: #e2e3e5;
      color: #383d41;
    }

    .status-badge.underreview {
      background: #fff3cd;
      color: #856404;
    }

    .status-badge.rejected {
      background: #f8d7da;
      color: #721c24;
    }

    .free-badge {
      background: #e8f5e9;
      color: #388e3c;
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.8rem;
      font-weight: 600;
    }

    .rating-cell {
      display: flex;
      align-items: center;
      gap: 0.25rem;
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

    .action-btn.danger:hover {
      background: #fee2e2;
    }

    .action-btn.warning:hover {
      background: #fef3c7;
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
      font-weight: 500;
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
      max-width: 500px;
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

    .course-preview {
      background: #f8f9fa;
      padding: 1rem;
      border-radius: 8px;
      margin-bottom: 1.5rem;
    }

    .course-preview h3 {
      font-size: 1rem;
      margin-bottom: 0.25rem;
    }

    .course-preview p {
      font-size: 0.9rem;
      color: #666;
    }

    .form-group label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 600;
    }

    .form-group textarea {
      width: 100%;
      padding: 0.75rem 1rem;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      font-size: 0.95rem;
      resize: vertical;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      padding: 1.5rem;
      border-top: 1px solid #e0e0e0;
    }

    .reject-btn {
      padding: 0.75rem 1.5rem;
      border: none;
      background: #dc3545;
      color: #fff;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
    }

    .approve-btn {
      padding: 0.75rem 1.5rem;
      border: none;
      background: #28a745;
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
      .courses-page {
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
    }
  `]
})
export class AdminCoursesComponent implements OnInit {
  private translate = inject(TranslateService);
  private courseService = inject(CourseService);
  private toastr = inject(ToastrService);

  courses = signal<Course[]>([]);
  filteredCourses = signal<Course[]>([]);
  loading = signal(true);

  searchQuery = '';
  activeStatus = 'all';
  categoryFilter = 'all';

  totalCourses = 0;
  publishedCourses = 0;
  pendingCourses = 0;
  draftCourses = 0;

  showReviewModal = false;
  selectedCourse: Course | null = null;
  reviewFeedback = '';

  ngOnInit() {
    this.loadCourses();
  }

  loadCourses() {
    this.loading.set(true);
    
    this.courseService.getCourses(1, 100).subscribe({
      next: (response) => {
        if (response.isSuccess && response.data) {
          const mappedCourses: Course[] = response.data.items.map((c: any) => ({
            id: c.id,
            slug: c.slug || c.id,
            title: c.nameEn || c.nameAr || c.title,
            thumbnail: c.thumbnailUrl || '',
            instructor: c.instructor?.fullName || 'Unknown',
            category: c.category?.nameEn || c.category?.nameAr || 'Uncategorized',
            status: c.status || 'Draft',
            price: c.discountPrice || c.price || 0,
            enrollments: c.enrollmentCount || 0,
            rating: c.averageRating || 0,
            createdAt: new Date(c.createdAt)
          }));
          
          this.courses.set(mappedCourses);
          this.calculateStats();
          this.filterCourses();
        }
        this.loading.set(false);
      },
      error: () => {
        this.toastr.error('Failed to load courses');
        this.loading.set(false);
      }
    });
  }

  calculateStats() {
    const all = this.courses();
    this.totalCourses = all.length;
    this.publishedCourses = all.filter(c => c.status === 'Published').length;
    this.pendingCourses = all.filter(c => c.status === 'UnderReview').length;
    this.draftCourses = all.filter(c => c.status === 'Draft').length;
  }

  setStatus(status: string) {
    this.activeStatus = status;
    this.filterCourses();
  }

  filterCourses() {
    let result = this.courses();

    if (this.activeStatus !== 'all') {
      result = result.filter(c => c.status === this.activeStatus);
    }

    if (this.categoryFilter !== 'all') {
      result = result.filter(c => c.category === this.categoryFilter);
    }

    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      result = result.filter(c => 
        c.title.toLowerCase().includes(query) || 
        c.instructor.toLowerCase().includes(query)
      );
    }

    this.filteredCourses.set(result);
  }

  addCourse() {
    window.location.href = '/admin/create-course';
  }

  viewCourse(course: Course) {
    window.open(`/courses/${course.slug}`, '_blank');
  }

  editCourse(course: Course) {
    window.location.href = `/admin/create-course?id=${course.id}`;
  }

  approveCourse(course: Course) {
    this.selectedCourse = course;
    this.showReviewModal = true;
  }

  rejectCourse(course: Course) {
    this.selectedCourse = course;
    this.showReviewModal = true;
  }

  archiveCourse(course: Course) {
    if (confirm('Are you sure you want to archive this course?')) {
      this.courseService.archiveCourse(course.id).subscribe({
        next: (response) => {
          if (response.isSuccess) {
            this.toastr.success('Course archived');
            this.loadCourses();
          } else {
            this.toastr.error('Failed to archive course');
          }
        },
        error: () => {
          this.toastr.error('Failed to archive course');
        }
      });
    }
  }

  republishCourse(course: Course) {
    if (confirm('Are you sure you want to publish this course?')) {
      this.courseService.publishCourse(course.id).subscribe({
        next: (response) => {
          if (response.isSuccess) {
            this.toastr.success('Course published');
            this.loadCourses();
          } else {
            this.toastr.error(response.messageEn || 'Failed to publish course');
          }
        },
        error: () => {
          this.toastr.error('Failed to publish course');
        }
      });
    }
  }

  deleteCourse(course: Course) {
    if (confirm('Are you sure you want to delete this course?')) {
      this.courseService.deleteCourse(course.id).subscribe({
        next: (response) => {
          if (response.isSuccess) {
            this.toastr.success('Course deleted');
            this.loadCourses();
          } else {
            this.toastr.error('Failed to delete course');
          }
        },
        error: () => {
          this.toastr.error('Failed to delete course');
        }
      });
    }
  }

  confirmApprove() {
    if (this.selectedCourse) {
      this.courseService.publishCourse(this.selectedCourse.id).subscribe({
        next: (response) => {
          if (response.isSuccess) {
            this.toastr.success('Course approved and published');
            this.loadCourses();
          } else {
            this.toastr.error('Failed to approve course');
          }
        },
        error: () => {
          this.toastr.error('Failed to approve course');
        }
      });
    }
    this.closeModal();
  }

  confirmReject() {
    if (this.selectedCourse) {
      this.courseService.rejectCourse(this.selectedCourse.id, this.reviewFeedback).subscribe({
        next: (response) => {
          if (response.isSuccess) {
            this.toastr.success('Course rejected');
            this.loadCourses();
          } else {
            this.toastr.error('Failed to reject course');
          }
        },
        error: () => {
          this.toastr.error('Failed to reject course');
        }
      });
    }
    this.closeModal();
  }

  closeModal() {
    this.showReviewModal = false;
    this.selectedCourse = null;
    this.reviewFeedback = '';
  }
}
