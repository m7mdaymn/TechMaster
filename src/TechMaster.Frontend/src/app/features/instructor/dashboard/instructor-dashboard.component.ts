import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { DashboardService, InstructorCourse, InstructorRecentEnrollment } from '@core/services/dashboard.service';
import { User } from '@core/services/user.service';
import { MediaService } from '@app/core/services/media.service';

interface InstructorStats {
  totalCourses: number;
  totalStudents: number;
  totalRevenue: number;
  averageRating: number;
}

@Component({
  selector: 'app-instructor-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="instructor-dashboard">
      <!-- Header -->
      <div class="dashboard-header">
        <div class="header-content">
          <h1>Instructor Dashboard</h1>
          <p>Welcome back, {{ user?.fullName }}! Here's your teaching overview.</p>
        </div>
        <div class="header-actions">
          <a routerLink="/instructor/courses/create" class="btn btn-primary">
            <span class="material-icons">add</span>
            Create Course
          </a>
        </div>
      </div>

      <!-- Stats Grid -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon courses">
            <span class="material-icons">school</span>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ stats().totalCourses }}</span>
            <span class="stat-label">My Courses</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon students">
            <span class="material-icons">people</span>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ stats().totalStudents | number }}</span>
            <span class="stat-label">Total Students</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon revenue">
            <span class="material-icons">payments</span>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ stats().totalRevenue | currency:'EGP':'symbol':'1.0-0' }}</span>
            <span class="stat-label">Total Revenue</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon rating">
            <span class="material-icons">star</span>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ stats().averageRating | number:'1.1-1' }}</span>
            <span class="stat-label">Average Rating</span>
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <div class="content-grid">
        <!-- Course Performance -->
        <div class="dashboard-card large">
          <div class="card-header">
            <h2>Course Performance</h2>
            <a routerLink="/instructor/courses" class="view-all">View All Courses</a>
          </div>
          
          @if (courses().length === 0) {
            <div class="empty-state">
              <span class="material-icons">school</span>
              <h3>No Courses Yet</h3>
              <p>Create your first course and start teaching</p>
              <a routerLink="/instructor/courses/create" class="btn btn-primary">Create Course</a>
            </div>
          } @else {
            <div class="courses-table">
              <table>
                <thead>
                  <tr>
                    <th>Course</th>
                    <th>Students</th>
                    <th>Completion</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  @for (course of courses(); track course.id) {
                    <tr>
                      <td>
                        <div class="course-cell">
                          <span>{{ course.title }}</span>
                        </div>
                      </td>
                      <td>{{ course.enrollments | number }}</td>
                      <td>
                        <div class="completion-bar">
                          <div class="bar-fill" [style.width.%]="course.completionRate"></div>
                          <span>{{ course.completionRate }}%</span>
                        </div>
                      </td>
                      <td>
                        <span class="status-badge" [class]="course.status.toLowerCase()">
                          {{ course.status }}
                        </span>
                      </td>
                      <td>
                        <a [routerLink]="['/instructor/courses', course.id ,'edit']" class="icon-btn" title="Edit">

                          <span class="material-icons">edit</span>
                        </a>
                        <a [routerLink]="['/instructor/analytics']" class="icon-btn" title="Analytics">
                          <span class="material-icons">analytics</span>
                        </a>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>

        <!-- Recent Enrollments -->
        <div class="dashboard-card">
          <div class="card-header">
            <h2>Recent Enrollments</h2>
          </div>
          
          @if (recentEnrollments().length === 0) {
            <div class="empty-state small">
              <span class="material-icons">people</span>
              <p>No enrollments yet</p>
            </div>
          } @else {
            <div class="enrollments-list">
              @for (enrollment of recentEnrollments(); track enrollment.id) {
                <div class="enrollment-item">
                  <div class="student-avatar">
                    {{ enrollment.studentName.charAt(0) }}
                  </div>
                  <div class="enrollment-info">
                    <span class="student-name">{{ enrollment.studentName }}</span>
                    <span class="course-name">{{ enrollment.courseTitle }}</span>
                  </div>
                  <span class="enrollment-date">{{ enrollment.enrolledAt | date:'shortDate' }}</span>
                </div>
              }
            </div>
          }
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="quick-actions">
        <h2>Quick Actions</h2>
        <div class="actions-grid">
          <a routerLink="/instructor/courses" class="action-card">
            <span class="material-icons">school</span>
            <span>My Courses</span>
          </a>
          <a routerLink="/instructor/students" class="action-card">
            <span class="material-icons">people</span>
            <span>My Students</span>
          </a>
          <a routerLink="/instructor/analytics" class="action-card">
            <span class="material-icons">analytics</span>
            <span>Analytics</span>
          </a>
          <a routerLink="/instructor/chat" class="action-card">
            <span class="material-icons">chat</span>
            <span>Messages</span>
          </a>
          <a routerLink="/instructor/earnings" class="action-card">
            <span class="material-icons">account_balance_wallet</span>
            <span>Earnings</span>
          </a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .instructor-dashboard {
      padding: 2rem;
      max-width: 1400px;
      margin: 0 auto;
    }

    /* Header */
    .dashboard-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .header-content h1 {
      font-size: 1.75rem;
      font-weight: 700;
      color: var(--color-dark);
      margin-bottom: 0.25rem;
    }

    .header-content p {
      color: var(--color-gray-600);
    }

    .header-actions .btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    /* Stats Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .stat-card {
      background: white;
      border-radius: 16px;
      padding: 1.5rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
    }

    .stat-icon {
      width: 56px;
      height: 56px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .stat-icon .material-icons {
      font-size: 1.75rem;
      color: white;
    }

    .stat-icon.courses { background: linear-gradient(135deg, #3b82f6, #1d4ed8); }
    .stat-icon.students { background: linear-gradient(135deg, #10b981, #059669); }
    .stat-icon.revenue { background: linear-gradient(135deg, #8b5cf6, #6d28d9); }
    .stat-icon.rating { background: linear-gradient(135deg, #f59e0b, #d97706); }

    .stat-content {
      display: flex;
      flex-direction: column;
    }

    .stat-value {
      font-size: 1.75rem;
      font-weight: 700;
      color: var(--color-dark);
    }

    .stat-label {
      font-size: 0.875rem;
      color: var(--color-gray-500);
    }

    /* Content Grid */
    .content-grid {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .dashboard-card {
      background: white;
      border-radius: 16px;
      padding: 1.5rem;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }

    .card-header h2 {
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--color-dark);
    }

    .view-all {
      color: var(--color-primary);
      font-weight: 500;
      text-decoration: none;
      font-size: 0.875rem;
    }

    /* Courses Table */
    .courses-table {
      overflow-x: auto;
    }

    .courses-table table {
      width: 100%;
      border-collapse: collapse;
    }

    .courses-table th {
      text-align: left;
      padding: 0.75rem 1rem;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--color-gray-500);
      text-transform: uppercase;
      border-bottom: 1px solid var(--color-gray-200);
    }

    .courses-table td {
      padding: 1rem;
      font-size: 0.875rem;
      border-bottom: 1px solid var(--color-gray-100);
    }

    .course-cell {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .course-cell img {
      width: 48px;
      height: 32px;
      border-radius: 4px;
      object-fit: cover;
    }

    .rating-cell {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      color: #f59e0b;
    }

    .rating-cell .material-icons {
      font-size: 1rem;
    }

    .completion-bar {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .bar-fill {
      height: 6px;
      width: 60px;
      background: var(--color-gray-200);
      border-radius: 3px;
      position: relative;
    }

    .bar-fill::after {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      height: 100%;
      width: inherit;
      background: var(--color-primary);
      border-radius: 3px;
    }

    .completion-bar span {
      font-size: 0.75rem;
      color: var(--color-gray-500);
    }

    .status-badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .status-badge.published {
      background: #d1fae5;
      color: #065f46;
    }

    .status-badge.draft {
      background: #fef3c7;
      color: #92400e;
    }

    .status-badge.pending {
      background: #dbeafe;
      color: #1e40af;
    }

    .icon-btn {
      width: 32px;
      height: 32px;
      border: none;
      border-radius: 6px;
      background: var(--color-gray-100);
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      text-decoration: none;
      transition: all 0.2s ease;
    }

    .icon-btn .material-icons {
      font-size: 1rem;
      color: var(--color-gray-600);
    }

    .icon-btn:hover {
      background: var(--color-gray-200);
    }

    /* Enrollments List */
    .enrollments-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .enrollment-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem;
      border-radius: 8px;
      transition: background 0.2s ease;
    }

    .enrollment-item:hover {
      background: var(--color-gray-50);
    }

    .student-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: var(--color-primary);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
    }

    .enrollment-info {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .student-name {
      font-weight: 500;
      color: var(--color-dark);
      font-size: 0.875rem;
    }

    .course-name {
      font-size: 0.75rem;
      color: var(--color-gray-500);
    }

    .enrollment-date {
      font-size: 0.75rem;
      color: var(--color-gray-400);
    }

    /* Empty State */
    .empty-state {
      text-align: center;
      padding: 3rem 2rem;
    }

    .empty-state.small {
      padding: 2rem 1rem;
    }

    .empty-state .material-icons {
      font-size: 3rem;
      color: var(--color-gray-300);
      margin-bottom: 1rem;
    }

    .empty-state h3 {
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--color-dark);
      margin-bottom: 0.5rem;
    }

    .empty-state p {
      color: var(--color-gray-500);
      margin-bottom: 1rem;
    }

    /* Quick Actions */
    .quick-actions h2 {
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--color-dark);
      margin-bottom: 1rem;
    }

    .actions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
      gap: 1rem;
    }

    .action-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;
      padding: 1.5rem;
      background: white;
      border-radius: 12px;
      text-decoration: none;
      color: var(--color-dark);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
      transition: all 0.3s ease;
    }

    .action-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.1);
    }

    .action-card .material-icons {
      font-size: 2rem;
      color: var(--color-primary);
    }

    .action-card span:last-child {
      font-size: 0.875rem;
      font-weight: 500;
    }

    /* Responsive */
    @media (max-width: 1024px) {
      .content-grid {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 768px) {
      .instructor-dashboard {
        padding: 1rem;
      }

      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }
  `]
})
export class InstructorDashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private dashboardService = inject(DashboardService);

  user = this.authService.getCurrentUser();
  isLoading = signal(true);

  stats = signal<InstructorStats>({
    totalCourses: 0,
    totalStudents: 0,
    totalRevenue: 0,
    averageRating: 0
  });

  courses = signal<InstructorCourse[]>([]);
  recentEnrollments = signal<InstructorRecentEnrollment[]>([]);

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.isLoading.set(true);
    
    this.dashboardService.getInstructorDashboard().subscribe({
      next: (dashboard) => {
        if (dashboard) {
          this.stats.set({
            totalCourses: dashboard.totalCourses || 0,
            totalStudents: dashboard.totalStudents || 0,
            totalRevenue: dashboard.totalRevenue || 0,
            averageRating: dashboard.averageRating || 0
          });
          this.courses.set(dashboard.courses || []);
          this.recentEnrollments.set(dashboard.recentEnrollments || []);
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }
}
