import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InstructorService, CourseDto, CourseAnalytics } from '@core/services/instructor.service';
import { MediaService } from '@core/services/media.service';

@Component({
  selector: 'app-instructor-analytics',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="analytics-page">
      <div class="page-header">
        <div class="header-left">
          <h1>Analytics</h1>
          <p class="subtitle">Track your course performance and student engagement</p>
        </div>
        <select [(ngModel)]="selectedCourseId" (change)="loadCourseAnalytics()">
          <option value="">Select a course</option>
          @for (course of courses(); track course.id) {
            <option [value]="course.id">{{ course.nameEn }}</option>
          }
        </select>
      </div>

      @if (!selectedCourseId) {
        <div class="overview-section">
          <h2>Overall Performance</h2>
          <div class="stats-grid">
            <div class="stat-card primary">
              <div class="stat-icon">
                <span class="material-icons">school</span>
              </div>
              <div class="stat-info">
                <span class="stat-value">{{ totalStudents() }}</span>
                <span class="stat-label">Total Students</span>
              </div>
            </div>
            <div class="stat-card success">
              <div class="stat-icon">
                <span class="material-icons">play_circle</span>
              </div>
              <div class="stat-info">
                <span class="stat-value">{{ courses().length }}</span>
                <span class="stat-label">Active Courses</span>
              </div>
            </div>
            <div class="stat-card warning">
              <div class="stat-icon">
                <span class="material-icons">star</span>
              </div>
              <div class="stat-info">
                <span class="stat-value">{{ averageRating().toFixed(1) }}</span>
                <span class="stat-label">Average Rating</span>
              </div>
            </div>
            <div class="stat-card info">
              <div class="stat-icon">
                <span class="material-icons">trending_up</span>
              </div>
              <div class="stat-info">
                <span class="stat-value">{{ completionRate().toFixed(0) }}%</span>
                <span class="stat-label">Completion Rate</span>
              </div>
            </div>
          </div>

          <!-- Top Courses -->
          <h2 class="section-title">Top Performing Courses</h2>
          <div class="courses-list">
            @for (course of topCourses(); track course.id) {
              <div class="course-row">
                <div class="course-info">
                  <img [src]="mediaService.getCourseThumbnail(course.thumbnailUrl)" class="course-thumb" alt="">
                  <div class="course-details">
                    <span class="course-title">{{ course.nameEn }}</span>
                    <span class="course-students">{{ course.enrollmentCount }} students</span>
                  </div>
                </div>
                <div class="course-metrics">
                  <div class="metric">
                    <span class="metric-value">{{ course.averageRating.toFixed(1) || 'N/A' }}</span>
                    <span class="metric-label">Rating</span>
                  </div>
                  <div class="metric">
                    <span class="metric-value">{{ course.completionRate || 0 }}%</span>
                    <span class="metric-label">Completion</span>
                  </div>
                </div>
              </div>
            }
          </div>
        </div>
      } @else if (loading()) {
        <div class="loading-state">
          <div class="spinner"></div>
        </div>
      } @else if (analytics()) {
        <div class="course-analytics">
          <!-- Course Stats -->
          <div class="stats-grid">
            <div class="stat-card">
              <span class="material-icons">people</span>
              <div class="stat-info">
                <span class="stat-value">{{ analytics()!.totalEnrollments }}</span>
                <span class="stat-label">Total Enrollments</span>
              </div>
            </div>
            <div class="stat-card">
              <span class="material-icons">trending_up</span>
              <div class="stat-info">
                <span class="stat-value">{{ analytics()!.activeStudents }}</span>
                <span class="stat-label">Active Students</span>
              </div>
            </div>
            <div class="stat-card">
              <span class="material-icons">check_circle</span>
              <div class="stat-info">
                <span class="stat-value">{{ analytics()!.completionRate.toFixed(0) }}%</span>
                <span class="stat-label">Completion Rate</span>
              </div>
            </div>
            <div class="stat-card">
              <span class="material-icons">star</span>
              <div class="stat-info">
                <span class="stat-value">{{ analytics()!.averageRating.toFixed(1) }}</span>
                <span class="stat-label">Average Rating</span>
              </div>
            </div>
          </div>

          <!-- Engagement Chart -->
          <div class="chart-section">
            <h3>Student Engagement Over Time</h3>
            <div class="chart-placeholder">
              <div class="bar-chart">
                @for (data of analytics()!.enrollmentTrend; track $index) {
                  <div class="bar-group">
                    <div class="bar" [style.height.%]="getBarHeight(data.count)"></div>
                    <span class="bar-label">{{ data.month }}</span>
                  </div>
                }
              </div>
            </div>
          </div>

          <!-- Module Progress -->
          <div class="modules-section">
            <h3>Module Completion Progress</h3>
            <div class="module-list">
              @for (module of analytics()!.moduleProgress; track module.moduleId) {
                <div class="module-progress-item">
                  <div class="module-info">
                    <span class="module-name">{{ module.moduleName }}</span>
                    <span class="module-stats">{{ module.completedCount }}/{{ analytics()!.totalEnrollments }} students</span>
                  </div>
                  <div class="progress-bar">
                    <div class="progress-fill" [style.width.%]="module.completionRate"></div>
                  </div>
                  <span class="progress-percent">{{ module.completionRate.toFixed(0) }}%</span>
                </div>
              }
            </div>
          </div>

          <!-- Recent Activity -->
          <div class="activity-section">
            <h3>Recent Student Activity</h3>
            <div class="activity-list">
              @for (activity of analytics()!.recentActivity; track activity.id) {
                <div class="activity-item">
                  <div class="activity-icon" [class]="activity.type">
                    <span class="material-icons">{{ getActivityIcon(activity.type) }}</span>
                  </div>
                  <div class="activity-content">
                    <span class="activity-text">{{ activity.description }}</span>
                    <span class="activity-time">{{ formatTime(activity.timestamp) }}</span>
                  </div>
                </div>
              }
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .analytics-page {
      max-width: 1200px;
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

    .page-header select {
      padding: 12px 20px;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      background: white;
      font-size: 1rem;
      min-width: 250px;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
      margin-bottom: 2rem;
    }

    .stat-card {
      display: flex;
      align-items: center;
      gap: 16px;
      background: white;
      padding: 24px;
      border-radius: 16px;
      transition: transform 0.2s;
    }

    .stat-card:hover {
      transform: translateY(-4px);
    }

    .stat-card .material-icons, .stat-icon {
      font-size: 32px;
      color: #10b981;
    }

    .stat-icon {
      width: 56px;
      height: 56px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .stat-card.primary .stat-icon {
      background: #dbeafe;
      color: #2563eb;
    }

    .stat-card.success .stat-icon {
      background: #dcfce7;
      color: #16a34a;
    }

    .stat-card.warning .stat-icon {
      background: #fef3c7;
      color: #d97706;
    }

    .stat-card.info .stat-icon {
      background: #e0e7ff;
      color: #4f46e5;
    }

    .stat-value {
      display: block;
      font-size: 1.75rem;
      font-weight: 700;
      color: #1e293b;
    }

    .stat-label {
      font-size: 0.9rem;
      color: #64748b;
    }

    .section-title {
      font-size: 1.25rem;
      font-weight: 600;
      color: #1e293b;
      margin: 2rem 0 1rem;
    }

    .courses-list {
      background: white;
      border-radius: 16px;
      overflow: hidden;
    }

    .course-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 24px;
      border-bottom: 1px solid #f1f5f9;
      transition: background 0.2s;
    }

    .course-row:hover {
      background: #f8fafc;
    }

    .course-row:last-child {
      border-bottom: none;
    }

    .course-info {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .course-thumb {
      width: 64px;
      height: 48px;
      border-radius: 8px;
      object-fit: cover;
    }

    .course-thumb.placeholder {
      background: #e2e8f0;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #94a3b8;
    }

    .course-title {
      display: block;
      font-weight: 600;
      color: #1e293b;
      margin-bottom: 4px;
    }

    .course-students {
      font-size: 0.9rem;
      color: #64748b;
    }

    .course-metrics {
      display: flex;
      gap: 32px;
    }

    .metric {
      text-align: center;
    }

    .metric-value {
      display: block;
      font-size: 1.25rem;
      font-weight: 600;
      color: #1e293b;
    }

    .metric-label {
      font-size: 0.8rem;
      color: #94a3b8;
    }

    .loading-state {
      text-align: center;
      padding: 4rem;
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

    .chart-section, .modules-section, .activity-section {
      background: white;
      border-radius: 16px;
      padding: 24px;
      margin-bottom: 1.5rem;
    }

    .chart-section h3, .modules-section h3, .activity-section h3 {
      font-size: 1.1rem;
      font-weight: 600;
      margin-bottom: 20px;
    }

    .bar-chart {
      display: flex;
      align-items: flex-end;
      justify-content: space-around;
      height: 200px;
      padding: 20px 0;
      border-bottom: 1px solid #e2e8f0;
    }

    .bar-group {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }

    .bar {
      width: 40px;
      background: linear-gradient(180deg, #10b981 0%, #059669 100%);
      border-radius: 8px 8px 0 0;
      min-height: 10px;
    }

    .bar-label {
      font-size: 0.85rem;
      color: #64748b;
    }

    .module-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .module-progress-item {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .module-info {
      min-width: 200px;
    }

    .module-name {
      display: block;
      font-weight: 500;
      color: #1e293b;
      margin-bottom: 4px;
    }

    .module-stats {
      font-size: 0.85rem;
      color: #94a3b8;
    }

    .progress-bar {
      flex: 1;
      height: 8px;
      background: #e2e8f0;
      border-radius: 4px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #10b981 0%, #059669 100%);
      border-radius: 4px;
    }

    .progress-percent {
      min-width: 50px;
      text-align: right;
      font-weight: 600;
      color: #10b981;
    }

    .activity-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .activity-item {
      display: flex;
      gap: 16px;
      padding: 12px;
      background: #f8fafc;
      border-radius: 10px;
    }

    .activity-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .activity-icon.enrollment {
      background: #dcfce7;
      color: #16a34a;
    }

    .activity-icon.completion {
      background: #dbeafe;
      color: #2563eb;
    }

    .activity-icon.review {
      background: #fef3c7;
      color: #d97706;
    }

    .activity-text {
      display: block;
      color: #1e293b;
      margin-bottom: 4px;
    }

    .activity-time {
      font-size: 0.85rem;
      color: #94a3b8;
    }
  `]
})
export class InstructorAnalyticsComponent implements OnInit {
  private instructorService = inject(InstructorService);
  mediaService = inject(MediaService);

  courses = signal<CourseDto[]>([]);
  analytics = signal<CourseAnalytics | null>(null);
  loading = signal(false);
  selectedCourseId = '';

  ngOnInit() {
    this.loadCourses();
  }

  loadCourses() {
    this.instructorService.getMyCourses().subscribe(courses => {
      this.courses.set(courses);
    });
  }

  loadCourseAnalytics() {
    if (!this.selectedCourseId) {
      this.analytics.set(null);
      return;
    }

    this.loading.set(true);
    this.instructorService.getCourseAnalytics(this.selectedCourseId).subscribe({
      next: (data) => {
        this.analytics.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  totalStudents(): number {
    return this.courses().reduce((sum, c) => sum + (c.enrollmentCount || 0), 0);
  }

  averageRating(): number {
    const ratedCourses = this.courses().filter(c => c.averageRating);
    if (ratedCourses.length === 0) return 0;
    return ratedCourses.reduce((sum, c) => sum + (c.averageRating || 0), 0) / ratedCourses.length;
  }

  completionRate(): number {
    const coursesWithRate = this.courses().filter(c => c.completionRate !== undefined);
    if (coursesWithRate.length === 0) return 0;
    return coursesWithRate.reduce((sum, c) => sum + (c.completionRate || 0), 0) / coursesWithRate.length;
  }

  topCourses(): CourseDto[] {
    return [...this.courses()]
      .sort((a, b) => (b.enrollmentCount || 0) - (a.enrollmentCount || 0))
      .slice(0, 5);
  }

  getBarHeight(value: number): number {
    const trend = this.analytics()?.enrollmentTrend || [];
    const max = Math.max(...trend.map((t: { count: number }) => t.count), 1);
    return (value / max) * 100;
  }

  getActivityIcon(type: string): string {
    switch (type) {
      case 'enrollment': return 'person_add';
      case 'completion': return 'check_circle';
      case 'review': return 'star';
      default: return 'info';
    }
  }

  formatTime(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  }
}
