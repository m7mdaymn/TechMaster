import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { DashboardService, StudentEnrollment, StudentCertificate, StudentBadge } from '@core/services/dashboard.service';
import { MediaService } from '@core/services/media.service';

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="dashboard">
      <!-- Welcome Header -->
      <div class="dashboard-header">
        <div class="welcome-section">
          <h1>Welcome back, {{ userName() }}! 👋</h1>
          <p>Continue your learning journey</p>
        </div>
        <div class="header-actions">
          <a routerLink="/courses" class="btn btn-primary">
            <span class="material-icons">add</span>
            Browse Courses
          </a>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon courses">
            <span class="material-icons">school</span>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ enrollments().length }}</span>
            <span class="stat-label">My Courses</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon certificates">
            <span class="material-icons">verified</span>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ certificates().length }}</span>
            <span class="stat-label">Certificates</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon badges">
            <span class="material-icons">military_tech</span>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ badges().length }}</span>
            <span class="stat-label">Badges</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon xp">
            <span class="material-icons">stars</span>
          </div>
          <div class="stat-info">
            <span class="stat-value">{{ totalXP() }}</span>
            <span class="stat-label">XP Points</span>
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <div class="dashboard-content">
        <!-- Continue Learning -->
        <section class="dashboard-section">
          <div class="section-header">
            <h2>Continue Learning</h2>
            <a routerLink="/student/my-courses" class="view-all">View All</a>
          </div>
          
          @if (enrollments().length === 0) {
            <div class="empty-state">
              <span class="material-icons">school</span>
              <h3>No enrollments yet</h3>
              <p>Start your learning journey by enrolling in a course</p>
              <a routerLink="/courses" class="btn btn-primary">Browse Courses</a>
            </div>
          } @else {
            <div class="courses-grid">
              @for (enrollment of enrollments().slice(0, 3); track enrollment.id) {
                <div class="course-progress-card">
                  <div class="course-image">
                    <img [src]="mediaService.getCourseThumbnail(enrollment.courseThumbnail)" [alt]="enrollment.courseTitle">
                    <div class="progress-overlay">
                      <div class="progress-circle" [style.--progress]="enrollment.progress + '%'">
                        <span>{{ enrollment.progress }}%</span>
                      </div>
                    </div>
                  </div>
                  <div class="course-info">
                    <h3>{{ enrollment.courseTitle }}</h3>
                    <p>{{ enrollment.instructorName }}</p>
                    <div class="progress-bar">
                      <div class="progress-fill" [style.width.%]="enrollment.progress"></div>
                    </div>
                    <div class="course-actions">
                      <a [routerLink]="['/student/learn', enrollment.courseId]" class="btn btn-primary btn-sm">
                        Continue
                      </a>
                    </div>
                  </div>
                </div>
              }
            </div>
          }
        </section>

        <!-- Certificates & Badges Row -->
        <div class="two-column">
          <!-- Recent Certificates -->
          <section class="dashboard-section">
            <div class="section-header">
              <h2>Certificates</h2>
              <a routerLink="/student/certificates" class="view-all">View All</a>
            </div>
            
            @if (certificates().length === 0) {
              <div class="empty-state small">
                <span class="material-icons">verified</span>
                <p>Complete courses to earn certificates</p>
              </div>
            } @else {
              <div class="certificates-list">
                @for (cert of certificates().slice(0, 3); track cert.id) {
                  <div class="certificate-item">
                    <div class="cert-icon">
                      <span class="material-icons">workspace_premium</span>
                    </div>
                    <div class="cert-info">
                      <h4>{{ cert.courseTitle }}</h4>
                      <span>Issued {{ cert.issuedAt | date:'mediumDate' }}</span>
                    </div>
                    <a [href]="cert.certificateUrl" target="_blank" class="btn btn-outline btn-sm">
                      View
                    </a>
                  </div>
                }
              </div>
            }
          </section>

          <!-- Badges -->
          <section class="dashboard-section">
            <div class="section-header">
              <h2>Badges</h2>
            </div>
            
            @if (badges().length === 0) {
              <div class="empty-state small">
                <span class="material-icons">military_tech</span>
                <p>Keep learning to earn badges</p>
              </div>
            } @else {
              <div class="badges-grid">
                @for (badge of badges(); track badge.id) {
                  <div class="badge-item" [title]="badge.description">
                    <img [src]="badge.iconUrl || 'assets/images/badge-placeholder.png'" [alt]="badge.name">
                    <span>{{ badge.name }}</span>
                  </div>
                }
              </div>
            }
          </section>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard {
      padding: 2rem;
      max-width: 1400px;
      margin: 0 auto;
    }

    .dashboard-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .welcome-section h1 {
      font-size: 1.75rem;
      font-weight: 700;
      color: var(--color-dark);
      margin-bottom: 0.25rem;
    }

    .welcome-section p {
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
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .stat-card {
      background: var(--color-white);
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
      color: var(--color-white);
    }

    .stat-icon.courses { background: linear-gradient(135deg, #3b82f6, #1d4ed8); }
    .stat-icon.certificates { background: linear-gradient(135deg, #10b981, #059669); }
    .stat-icon.badges { background: linear-gradient(135deg, #f59e0b, #d97706); }
    .stat-icon.xp { background: linear-gradient(135deg, #8b5cf6, #6d28d9); }

    .stat-info {
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

    /* Dashboard Sections */
    .dashboard-section {
      background: var(--color-white);
      border-radius: 16px;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }

    .section-header h2 {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--color-dark);
    }

    .view-all {
      color: var(--color-primary);
      font-weight: 500;
      text-decoration: none;
    }

    .view-all:hover {
      text-decoration: underline;
    }

    /* Courses Grid */
    .courses-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.5rem;
    }

    .course-progress-card {
      background: var(--color-gray-50);
      border-radius: 12px;
      overflow: hidden;
    }

    .course-image {
      position: relative;
      aspect-ratio: 16/9;
    }

    .course-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .progress-overlay {
      position: absolute;
      inset: 0;
      background: rgba(0, 0, 0, 0.4);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .progress-circle {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: conic-gradient(var(--color-primary) var(--progress), rgba(255,255,255,0.2) 0);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .progress-circle::before {
      content: '';
      position: absolute;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: rgba(0, 0, 0, 0.8);
    }

    .progress-circle span {
      position: relative;
      z-index: 1;
      color: white;
      font-weight: 700;
      font-size: 1rem;
    }

    .course-info {
      padding: 1rem;
    }

    .course-info h3 {
      font-size: 1rem;
      font-weight: 600;
      color: var(--color-dark);
      margin-bottom: 0.25rem;
      display: -webkit-box;
      -webkit-line-clamp: 1;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .course-info p {
      font-size: 0.875rem;
      color: var(--color-gray-500);
      margin-bottom: 0.75rem;
    }

    .progress-bar {
      height: 6px;
      background: var(--color-gray-200);
      border-radius: 3px;
      overflow: hidden;
      margin-bottom: 1rem;
    }

    .progress-fill {
      height: 100%;
      background: var(--color-primary);
      border-radius: 3px;
      transition: width 0.3s ease;
    }

    .course-actions {
      display: flex;
      justify-content: flex-end;
    }

    /* Two Column Layout */
    .two-column {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: 1.5rem;
    }

    /* Certificates List */
    .certificates-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .certificate-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: var(--color-gray-50);
      border-radius: 10px;
    }

    .cert-icon {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: linear-gradient(135deg, #10b981, #059669);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .cert-icon .material-icons {
      color: white;
      font-size: 1.5rem;
    }

    .cert-info {
      flex: 1;
    }

    .cert-info h4 {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--color-dark);
      margin-bottom: 0.25rem;
    }

    .cert-info span {
      font-size: 0.75rem;
      color: var(--color-gray-500);
    }

    /* Badges Grid */
    .badges-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
      gap: 1rem;
    }

    .badge-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      padding: 1rem;
      background: var(--color-gray-50);
      border-radius: 10px;
      text-align: center;
      cursor: pointer;
      transition: transform 0.2s ease;
    }

    .badge-item:hover {
      transform: scale(1.05);
    }

    .badge-item img {
      width: 48px;
      height: 48px;
      object-fit: contain;
    }

    .badge-item span {
      font-size: 0.75rem;
      color: var(--color-gray-600);
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
      font-size: 4rem;
      color: var(--color-gray-300);
      margin-bottom: 1rem;
    }

    .empty-state h3 {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--color-dark);
      margin-bottom: 0.5rem;
    }

    .empty-state p {
      color: var(--color-gray-500);
      margin-bottom: 1.5rem;
    }

    .btn-sm {
      padding: 0.5rem 1rem;
      font-size: 0.875rem;
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

    @media (max-width: 768px) {
      .dashboard {
        padding: 1rem;
      }

      .two-column {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class StudentDashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private dashboardService = inject(DashboardService);
  mediaService = inject(MediaService);

  userName = signal('Student');
  enrollments = signal<StudentEnrollment[]>([]);
  certificates = signal<StudentCertificate[]>([]);
  badges = signal<StudentBadge[]>([]);
  totalXP = signal(0);
  isLoading = signal(true);

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.userName.set(user.firstName || 'Student');
    }
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.isLoading.set(true);
    
    this.dashboardService.getStudentDashboard().subscribe({
      next: (dashboard) => {
        if (dashboard) {
          // Map enrollments with proper field names
          const mappedEnrollments = (dashboard.enrollments || dashboard.recentEnrollments || []).map(e => ({
            ...e,
            courseTitle: e.courseTitle || e.courseName || '',
            progress: e.progress || e.progressPercentage || 0
          }));
          
          this.enrollments.set(mappedEnrollments);
          this.certificates.set(dashboard.certificates || []);
          this.badges.set(dashboard.badges || dashboard.recentBadges || []);
          this.totalXP.set(dashboard.totalXp || 0);
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }
}
