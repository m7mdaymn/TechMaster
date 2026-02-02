import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DashboardService, AdminRecentEnrollment, AdminRecentUser } from '@core/services/dashboard.service';

interface DashboardStats {
  totalUsers: number;
  totalCourses: number;
  totalEnrollments: number;
  totalRevenue: number;
  pendingEnrollments: number;
  activeUsers: number;
  userGrowthPercentage: number;
  courseGrowthPercentage: number;
  enrollmentGrowthPercentage: number;
  revenueGrowthPercentage: number;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="admin-dashboard">
      <!-- Header -->
      <div class="dashboard-header">
        <div class="header-content">
          <h1>Admin Dashboard</h1>
          <p>Welcome back! Here's what's happening with TechMaster today.</p>
        </div>
      </div>

      <!-- Stats Grid -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon users">
            <span class="material-icons">people</span>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ stats().totalUsers | number }}</span>
            <span class="stat-label">Total Users</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon courses">
            <span class="material-icons">school</span>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ stats().totalCourses | number }}</span>
            <span class="stat-label">Total Courses</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon enrollments">
            <span class="material-icons">assignment_turned_in</span>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ stats().totalEnrollments | number }}</span>
            <span class="stat-label">Total Enrollments</span>
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
      </div>

      <!-- Alert Cards -->
      @if (stats().pendingEnrollments > 0) {
        <div class="alert-card warning">
          <span class="material-icons">warning</span>
          <div class="alert-content">
            <strong>{{ stats().pendingEnrollments }} Pending Enrollments</strong>
            <span>Review and approve payment confirmations</span>
          </div>
          <a routerLink="/admin/enrollments" [queryParams]="{status: 'pending'}" class="btn btn-outline">
            Review Now
          </a>
        </div>
      }

      <!-- Main Content Grid -->
      <div class="content-grid">
        <!-- Recent Enrollments -->
        <div class="dashboard-card">
          <div class="card-header">
            <h2>Recent Enrollments</h2>
            <a routerLink="/admin/enrollments" class="view-all">View All</a>
          </div>
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Course</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (enrollment of recentEnrollments(); track enrollment.id) {
                  <tr>
                    <td>
                      <div class="user-cell">
                        <div class="user-avatar">{{ enrollment.userName.charAt(0) }}</div>
                        <div class="user-info">
                          <span class="user-name">{{ enrollment.userName }}</span>
                          <span class="user-email">{{ enrollment.userEmail }}</span>
                        </div>
                      </div>
                    </td>
                    <td>{{ enrollment.courseTitle }}</td>
                    <td>{{ enrollment.amount | currency:'EGP':'symbol':'1.0-0' }}</td>
                    <td>
                      <span class="status-badge" [class]="enrollment.status.toLowerCase()">
                        {{ enrollment.status }}
                      </span>
                    </td>
                    <td>{{ enrollment.enrolledAt | date:'shortDate' }}</td>
                    <td>
                      <div class="action-buttons">
                          <button class="action-btn" title="View Details" (click)="viewDetails(enrollment)">
                            <span class="material-icons">visibility</span>
                        </button>
                        @if (enrollment.status === 'Pending') {
                          <button class="icon-btn success" title="Approve" (click)="approveEnrollment(enrollment.id)">
                            <span class="material-icons">check</span>
                          </button>
                          <button class="icon-btn danger" title="Reject" (click)="rejectEnrollment(enrollment.id)">
                            <span class="material-icons">close</span>
                          </button>
                        }
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>

        <!-- Recent Users -->
        <div class="dashboard-card">
          <div class="card-header">
            <h2>Recent Users</h2>
            <a routerLink="/admin/users" class="view-all">View All</a>
          </div>
          <div class="users-list">
            @for (user of recentUsers(); track user.id) {
              <div class="user-item">
                <div class="user-avatar-lg">{{ user.fullName.charAt(0) }}</div>
                <div class="user-details">
                  <span class="user-name">{{ user.fullName }}</span>
                  <span class="user-email">{{ user.email }}</span>
                </div>
                <span class="role-badge" [class]="user.role.toLowerCase()">{{ user.role }}</span>
                <span class="user-date">{{ user.createdAt | date:'shortDate' }}</span>
              </div>
            }
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="quick-actions">
        <h2>Quick Actions</h2>
        <div class="actions-grid">
          <a routerLink="/admin/courses" class="action-card">
            <span class="material-icons">school</span>
            <span>Manage Courses</span>
          </a>
          <a routerLink="/admin/users" class="action-card">
            <span class="material-icons">people</span>
            <span>Manage Users</span>
          </a>
          <a routerLink="/admin/enrollments" class="action-card">
            <span class="material-icons">assignment</span>
            <span>Manage Enrollments</span>
          </a>
          <a routerLink="/admin/internships" class="action-card">
            <span class="material-icons">work</span>
            <span>Manage Internships</span>
          </a>
          <a routerLink="/admin/library" class="action-card">
            <span class="material-icons">library_books</span>
            <span>Manage Library</span>
          </a>
          <a routerLink="/admin/testimonials" class="action-card">
            <span class="material-icons">format_quote</span>
            <span>Manage Testimonials</span>
          </a>
          <a routerLink="/admin/settings" class="action-card">
            <span class="material-icons">settings</span>
            <span>Settings</span>
          </a>
          <a routerLink="/admin/reports" class="action-card">
            <span class="material-icons">analytics</span>
            <span>Reports</span>
          </a>
        </div>
      </div>
    </div>

    <!-- Enrollment Details Modal -->
    @if (showDetailsModal()) {
      <div class="modal-overlay" (click)="closeDetailsModal()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>Enrollment Details</h3>
            <button class="close-btn" (click)="closeDetailsModal()">
              <span class="material-icons">close</span>
            </button>
          </div>
          @if (selectedEnrollment()) {
            <div class="modal-body">
              <div class="detail-row">
                <span class="detail-label">Student:</span>
                <span class="detail-value">{{ selectedEnrollment()?.userName }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Email:</span>
                <span class="detail-value">{{ selectedEnrollment()?.userEmail }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Course:</span>
                <span class="detail-value">{{ selectedEnrollment()?.courseTitle }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Amount:</span>
                <span class="detail-value">{{ selectedEnrollment()?.amount | currency:'EGP' }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Status:</span>
                <span class="status-badge" [class]="selectedEnrollment()?.status?.toLowerCase()">
                  {{ selectedEnrollment()?.status }}
                </span>
              </div>

              <div class="detail-row">
                <span class="detail-label">Enrolled At:</span>
                <span class="detail-value">{{ selectedEnrollment()?.enrolledAt | date:'medium' }}</span>
              </div>
            </div>
            <div class="modal-footer">
              @if (selectedEnrollment()?.status === 'Pending') {
                <button class="btn btn-success" (click)="approveEnrollment(selectedEnrollment()!.id); closeDetailsModal()">
                  <span class="material-icons">check</span> Approve
                </button>
                <button class="btn btn-danger" (click)="rejectEnrollment(selectedEnrollment()!.id); closeDetailsModal()">
                  <span class="material-icons">close</span> Reject
                </button>
              }
              <button class="btn btn-secondary" (click)="closeDetailsModal()">Close</button>
            </div>
          }
        </div>
      </div>
    }
  `,
  styles: [`
    .admin-dashboard {
      padding: 2rem;
      max-width: 1600px;
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
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
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

    .stat-icon.users { background: linear-gradient(135deg, #3b82f6, #1d4ed8); }
    .stat-icon.courses { background: linear-gradient(135deg, #10b981, #059669); }
    .stat-icon.enrollments { background: linear-gradient(135deg, #f59e0b, #d97706); }
    .stat-icon.revenue { background: linear-gradient(135deg, #8b5cf6, #6d28d9); }

    .stat-content {
      flex: 1;
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

    .stat-trend {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.875rem;
      font-weight: 600;
    }

    .stat-trend.up {
      color: #10b981;
    }

    .stat-trend.down {
      color: #ef4444;
    }

    .stat-trend .material-icons {
      font-size: 1.25rem;
    }

    /* Alert Card */
    .alert-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem 1.5rem;
      border-radius: 12px;
      margin-bottom: 2rem;
    }

    .alert-card.warning {
      background: #fef3c7;
      border: 1px solid #f59e0b;
    }

    .alert-card.warning .material-icons {
      color: #d97706;
    }

    .alert-content {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .alert-content strong {
      color: var(--color-dark);
    }

    .alert-content span {
      font-size: 0.875rem;
      color: var(--color-gray-600);
    }

    .btn-outline {
      background: transparent;
      border: 1px solid var(--color-primary);
      color: var(--color-primary);
    }

    .btn-outline:hover {
      background: var(--color-primary);
      color: white;
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

    .view-all:hover {
      text-decoration: underline;
    }

    /* Data Table */
    .table-container {
      overflow-x: auto;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
    }

    .data-table th {
      text-align: left;
      padding: 0.75rem 1rem;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--color-gray-500);
      text-transform: uppercase;
      border-bottom: 1px solid var(--color-gray-200);
    }

    .data-table td {
      padding: 0.875rem 1rem;
      font-size: 0.875rem;
      border-bottom: 1px solid var(--color-gray-100);
    }

    .user-cell {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .user-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: var(--color-primary);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 0.875rem;
    }

    .user-info {
      display: flex;
      flex-direction: column;
    }

    .user-name {
      font-weight: 500;
      color: var(--color-dark);
    }

    .user-email {
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

    .status-badge.pending {
      background: #fef3c7;
      color: #92400e;
    }

    .status-badge.approved {
      background: #d1fae5;
      color: #065f46;
    }

    .status-badge.rejected {
      background: #fee2e2;
      color: #991b1b;
    }

    .action-buttons {
      display: flex;
      gap: 0.5rem;
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
      transition: all 0.2s ease;
    }

    .icon-btn .material-icons {
      font-size: 1.125rem;
      color: var(--color-gray-600);
    }

    .icon-btn:hover {
      background: var(--color-gray-200);
    }

    .icon-btn.success:hover {
      background: #d1fae5;
    }

    .icon-btn.success:hover .material-icons {
      color: #059669;
    }

    .icon-btn.danger:hover {
      background: #fee2e2;
    }

    .icon-btn.danger:hover .material-icons {
      color: #dc2626;
    }

    .action-btn {
      width: 32px;
      height: 32px;
      border: none;
      border-radius: 6px;
      background: var(--color-gray-100);
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
    }

    .action-btn .material-icons {
      font-size: 1.125rem;
      color: var(--color-gray-600);
    }

    .action-btn:hover {
      background: var(--color-primary);
    }

    .action-btn:hover .material-icons {
      color: white;
    }

    /* Users List */
    .users-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .user-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.75rem;
      border-radius: 10px;
      transition: background 0.2s ease;
    }

    .user-item:hover {
      background: var(--color-gray-50);
    }

    .user-avatar-lg {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--color-primary), #1d5a73);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
    }

    .user-details {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .role-badge {
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.625rem;
      font-weight: 600;
      text-transform: uppercase;
    }

    .role-badge.admin {
      background: #dbeafe;
      color: #1d4ed8;
    }

    .role-badge.instructor {
      background: #fce7f3;
      color: #be185d;
    }

    .role-badge.student {
      background: #d1fae5;
      color: #059669;
    }

    .user-date {
      font-size: 0.75rem;
      color: var(--color-gray-400);
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
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
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
      text-align: center;
    }

    /* Responsive */
    @media (max-width: 1024px) {
      .content-grid {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 768px) {
      .admin-dashboard {
        padding: 1rem;
      }

      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
      }
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
    }

    .modal-content {
      background: white;
      border-radius: 12px;
      width: 90%;
      max-width: 500px;
      max-height: 80vh;
      overflow-y: auto;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem;
      border-bottom: 1px solid #e0e0e0;
    }

    .modal-header h3 {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 600;
    }

    .close-btn {
      background: none;
      border: none;
      cursor: pointer;
      color: #666;
      padding: 0.25rem;
    }

    .close-btn:hover {
      color: #333;
    }

    .modal-body {
      padding: 1.5rem;
    }

    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 0.75rem 0;
      border-bottom: 1px solid #f0f0f0;
    }

    .detail-row:last-child {
      border-bottom: none;
    }

    .detail-label {
      font-weight: 500;
      color: #666;
    }

    .detail-value {
      font-weight: 600;
      color: #333;
    }

    .modal-footer {
      display: flex;
      gap: 0.75rem;
      padding: 1.5rem;
      border-top: 1px solid #e0e0e0;
      justify-content: flex-end;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      border-radius: 8px;
      font-weight: 500;
      cursor: pointer;
      border: none;
    }

    .btn .material-icons {
      font-size: 1rem;
    }

    .btn-success {
      background: #10b981;
      color: white;
    }

    .btn-success:hover {
      background: #059669;
    }

    .btn-danger {
      background: #ef4444;
      color: white;
    }

    .btn-danger:hover {
      background: #dc2626;
    }

    .btn-secondary {
      background: #f3f4f6;
      color: #333;
    }

    .btn-secondary:hover {
      background: #e5e7eb;
    }
  `]
})
export class AdminDashboardComponent implements OnInit {
  private dashboardService = inject(DashboardService);

  isLoading = signal(true);
  stats = signal<DashboardStats>({
    totalUsers: 0,
    totalCourses: 0,
    totalEnrollments: 0,
    totalRevenue: 0,
    pendingEnrollments: 0,
    activeUsers: 0,
    userGrowthPercentage: 0,
    courseGrowthPercentage: 0,
    enrollmentGrowthPercentage: 0,
    revenueGrowthPercentage: 0
  });

  recentEnrollments = signal<AdminRecentEnrollment[]>([]);
  recentUsers = signal<AdminRecentUser[]>([]);

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.isLoading.set(true);
    
    this.dashboardService.getAdminDashboard().subscribe({
      next: (dashboard) => {
        if (dashboard) {
          this.stats.set({
            totalUsers: dashboard.totalUsers || 0,
            totalCourses: dashboard.totalCourses || 0,
            totalEnrollments: dashboard.totalEnrollments || 0,
            totalRevenue: dashboard.totalRevenue || 0,
            pendingEnrollments: dashboard.pendingEnrollments || 0,
            activeUsers: dashboard.activeUsers || 0,
            userGrowthPercentage: dashboard.userGrowthPercentage || 0,
            courseGrowthPercentage: dashboard.courseGrowthPercentage || 0,
            enrollmentGrowthPercentage: dashboard.enrollmentGrowthPercentage || 0,
            revenueGrowthPercentage: dashboard.revenueGrowthPercentage || 0
          });
          this.recentEnrollments.set(dashboard.recentEnrollments || []);
          this.recentUsers.set(dashboard.recentUsers || []);
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }
  showDetailsModal = signal(false);
    selectedEnrollment = signal<AdminRecentEnrollment | null>(null);

    viewDetails(enrollment: AdminRecentEnrollment): void {
      this.selectedEnrollment.set(enrollment);
      this.showDetailsModal.set(true);
    }

    closeDetailsModal(): void {
      this.showDetailsModal.set(false);
      this.selectedEnrollment.set(null);
    }

  approveEnrollment(id: number | string): void {
    this.dashboardService.approveEnrollment(id.toString()).subscribe({
      next: (success) => {
        if (success) {
          this.recentEnrollments.update(enrollments => 
            enrollments.map(e => e.id === id ? { ...e, status: 'Approved' } : e)
          );
        }
      }
    });
  }

  rejectEnrollment(id: number | string): void {
    this.dashboardService.rejectEnrollment(id.toString()).subscribe({
      next: (success) => {
        if (success) {
          this.recentEnrollments.update(enrollments => 
            enrollments.map(e => e.id === id ? { ...e, status: 'Rejected' } : e)
          );
        }
      }
    });
  }
}
