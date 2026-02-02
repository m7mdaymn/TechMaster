import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CourseService } from '../../../core/services/course.service';
import { DashboardService } from '../../../core/services/dashboard.service';
import { MediaService } from '../../../core/services/media.service';
import { ToastrService } from 'ngx-toastr';

interface InstructorCourse {
  id: string;
  title: string;
  slug: string;
  thumbnail: string;
  status: 'Draft' | 'Published' | 'UnderReview';
  enrollments: number;
  rating: number;
  revenue: number;
  createdDate: Date;
  lastUpdated: Date;
}

@Component({
  selector: 'app-instructor-courses',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="instructor-courses-page">
      <div class="page-header">
        <div class="header-content">
          <h1>My Courses</h1>
          <p>Manage and create your courses</p>
        </div>
        <div class="header-actions">
          <a routerLink="/instructor/courses/create" class="create-btn">
            <span class="icon">➕</span>
            Create Course
          </a>
        </div>
      </div>

      <div class="filters-section">
        <div class="filter-tabs">
          <button 
            class="filter-tab" 
            [class.active]="activeFilter() === 'all'"
            (click)="activeFilter.set('all')"
          >
            All
            <span class="count">{{ courses().length }}</span>
          </button>
          <button 
            class="filter-tab" 
            [class.active]="activeFilter() === 'published'"
            (click)="activeFilter.set('published')"
          >
            Published
            <span class="count">{{ publishedCount() }}</span>
          </button>
          <button 
            class="filter-tab" 
            [class.active]="activeFilter() === 'draft'"
            (click)="activeFilter.set('draft')"
          >
            Draft
            <span class="count">{{ draftCount() }}</span>
          </button>
          <button 
            class="filter-tab" 
            [class.active]="activeFilter() === 'review'"
            (click)="activeFilter.set('review')"
          >
            Under Review
            <span class="count">{{ reviewCount() }}</span>
          </button>
        </div>
      </div>

      @if (loading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Loading...</p>
        </div>
      } @else if (filteredCourses().length === 0) {
        <div class="empty-state">
          <div class="empty-icon">📚</div>
          <h3>No Courses Yet</h3>
          <p>Create your first course and start teaching</p>
          <a routerLink="/instructor/courses/create" class="cta-btn">
            Create Your First Course
          </a>
        </div>
      } @else {
        <div class="courses-table">
          <table>
            <thead>
              <tr>
                <th>Course</th>
                <th>Status</th>
                <th>Enrollments</th>
                <th>Last Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (course of filteredCourses(); track course.id) {
                <tr>
                  <td class="course-cell">
                    <div class="course-info">
                      <img [src]="mediaService.getCourseThumbnail(course.thumbnail)" [alt]="course.title">
                      <div class="course-text">
                        <h4>{{ course.title }}</h4>
                        <span class="course-date">Created: {{ course.createdDate | date:'mediumDate' }}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span class="status-badge" [class]="course.status.toLowerCase()">
                      {{ getStatusLabel(course.status) }}
                    </span>
                  </td>
                  <td>
                    <span class="stat-value">{{ course.enrollments }}</span>
                  </td>
                  <td>
                    <span class="date-value">{{ course.lastUpdated | date:'mediumDate' }}</span>
                  </td>
                  <td>
                    <div class="actions-cell">
                      <a [routerLink]="['/instructor/courses', course.id, 'edit']" class="action-btn edit" title="Edit">
                        ✏️
                      </a>
                      <a [routerLink]="['/instructor/analytics', course.id]" class="action-btn analytics" title="Analytics">
                        📊
                      </a>
                      <a [routerLink]="['/courses', course.slug]" class="action-btn view" title="View" target="_blank">
                        👁️
                      </a>
                      <button class="action-btn delete" title="Delete" (click)="deleteCourse(course)">
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
  styles: [`
    .instructor-courses-page {
      max-width: 1400px;
      margin: 0 auto;
      padding: 2rem;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 2rem;
      gap: 1rem;
    }

    .header-content h1 {
      font-size: 2rem;
      font-weight: 700;
      color: #000;
      margin-bottom: 0.5rem;
    }

    .header-content p {
      color: #666;
    }

    .create-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.875rem 1.5rem;
      background: linear-gradient(135deg, #247090 0%, #1a5570 100%);
      color: #fff;
      border-radius: 10px;
      text-decoration: none;
      font-weight: 600;
      transition: all 0.3s ease;
    }

    .create-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(36, 112, 144, 0.3);
    }

    .filters-section {
      margin-bottom: 2rem;
    }

    .filter-tabs {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .filter-tab {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.25rem;
      background: #f8f9fa;
      border: 2px solid transparent;
      border-radius: 10px;
      font-weight: 500;
      color: #666;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .filter-tab:hover {
      background: #f0f0f0;
    }

    .filter-tab.active {
      background: #fff;
      border-color: #247090;
      color: #247090;
    }

    .filter-tab .count {
      background: #e0e0e0;
      padding: 0.125rem 0.5rem;
      border-radius: 20px;
      font-size: 0.85rem;
    }

    .filter-tab.active .count {
      background: #247090;
      color: #fff;
    }

    .loading-state {
      text-align: center;
      padding: 4rem 2rem;
    }

    .spinner {
      width: 50px;
      height: 50px;
      border: 3px solid #f0f0f0;
      border-top-color: #247090;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 1rem;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .empty-state {
      text-align: center;
      padding: 4rem 2rem;
      background: #f8f9fa;
      border-radius: 20px;
    }

    .empty-icon {
      font-size: 4rem;
      margin-bottom: 1rem;
    }

    .empty-state h3 {
      font-size: 1.5rem;
      font-weight: 700;
      color: #000;
      margin-bottom: 0.5rem;
    }

    .empty-state p {
      color: #666;
      margin-bottom: 1.5rem;
    }

    .cta-btn {
      display: inline-block;
      padding: 0.875rem 2rem;
      background: linear-gradient(135deg, #247090 0%, #1a5570 100%);
      color: #fff;
      border-radius: 10px;
      text-decoration: none;
      font-weight: 600;
    }

    .courses-table {
      background: #fff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
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
      color: #666;
      font-size: 0.85rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    td {
      padding: 1rem 1.25rem;
      border-bottom: 1px solid #f0f0f0;
      vertical-align: middle;
    }

    tr:last-child td {
      border-bottom: none;
    }

    .course-cell {
      min-width: 300px;
    }

    .course-info {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .course-info img {
      width: 80px;
      height: 50px;
      object-fit: cover;
      border-radius: 8px;
    }

    .course-text h4 {
      font-size: 0.95rem;
      font-weight: 600;
      color: #000;
      margin-bottom: 0.25rem;
    }

    .course-date {
      font-size: 0.8rem;
      color: #999;
    }

    .status-badge {
      display: inline-block;
      padding: 0.375rem 0.75rem;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 600;
    }

    .status-badge.published {
      background: #d4edda;
      color: #155724;
    }

    .status-badge.draft {
      background: #f8f9fa;
      color: #666;
    }

    .status-badge.underreview {
      background: #fff3cd;
      color: #856404;
    }

    .stat-value {
      font-weight: 600;
      color: #000;
    }

    .rating-cell {
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    .revenue-value {
      font-weight: 700;
      color: #28a745;
    }

    .date-value {
      color: #666;
    }

    .actions-cell {
      display: flex;
      gap: 0.5rem;
    }

    .action-btn {
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      background: #f8f9fa;
      text-decoration: none;
      font-size: 0.9rem;
      transition: all 0.3s ease;
    }

    .action-btn:hover {
      background: #e0e0e0;
    }

    .action-btn.delete:hover {
      background: #fee2e2;
    }

    @media (max-width: 992px) {
      .instructor-courses-page {
        padding: 1rem;
      }

      .page-header {
        flex-direction: column;
      }

      .courses-table {
        overflow-x: auto;
      }

      table {
        min-width: 800px;
      }
    }

    :host-context([dir="rtl"]) {
      th {
        text-align: right;
      }
    }
  `]
})
export class InstructorCoursesComponent implements OnInit {
  private courseService = inject(CourseService);
  private dashboardService = inject(DashboardService);
  private toastr = inject(ToastrService);
  mediaService = inject(MediaService);

  loading = signal(true);
  courses = signal<InstructorCourse[]>([]);
  activeFilter = signal<'all' | 'published' | 'draft' | 'review'>('all');

  ngOnInit() {
    this.loadCourses();
  }

  loadCourses() {
    this.loading.set(true);
    this.dashboardService.getInstructorCourses().subscribe({
      next: (data) => {
        const mappedCourses: InstructorCourse[] = (data || []).map((c: any) => ({
          id: c.id,
          title: c.nameEn || c.title || 'Untitled Course',
          slug: c.slug,
          thumbnail: c.thumbnailUrl || 'assets/images/courses/default.jpg',
          status: c.status || 'Draft',
          enrollments: c.enrollmentCount || 0,
          rating: c.averageRating || 0,
          revenue: c.revenue || 0,
          createdDate: new Date(c.createdAt),
          lastUpdated: new Date(c.publishedAt || c.createdAt)
        }));
        this.courses.set(mappedCourses);
        this.loading.set(false);
      },
      error: () => {
        this.toastr.error('Failed to load courses');
        this.loading.set(false);
      }
    });
  }

  filteredCourses() {
    const filter = this.activeFilter();
    if (filter === 'all') return this.courses();
    if (filter === 'published') return this.courses().filter(c => c.status === 'Published');
    if (filter === 'draft') return this.courses().filter(c => c.status === 'Draft');
    return this.courses().filter(c => c.status === 'UnderReview');
  }

  publishedCount() {
    return this.courses().filter(c => c.status === 'Published').length;
  }

  draftCount() {
    return this.courses().filter(c => c.status === 'Draft').length;
  }

  reviewCount() {
    return this.courses().filter(c => c.status === 'UnderReview').length;
  }

  getStatusLabel(status: string): string {
    const statusMap: { [key: string]: string } = {
      'Published': 'Published',
      'Draft': 'Draft',
      'UnderReview': 'Under Review'
    };
    return statusMap[status] || status;
  }

  deleteCourse(course: InstructorCourse) {
    if (confirm(`Are you sure you want to delete "${course.title}"?`)) {
      this.courseService.deleteCourse(course.id).subscribe({
        next: (success) => {
          if (success) {
            this.toastr.success('Course deleted');
            this.loadCourses();
          } else {
            this.toastr.error('Failed to delete course');
          }
        }
      });
    }
  }
}
