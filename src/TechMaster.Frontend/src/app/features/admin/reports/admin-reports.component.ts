import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';

@Component({
  selector: 'app-admin-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="reports-page">
      <div class="page-header">
        <div class="header-left">
          <h1>Reports & Analytics</h1>
          <p class="subtitle">View platform statistics and performance metrics</p>
        </div>
        <div class="header-actions">
          <select [(ngModel)]="selectedPeriod" (ngModelChange)="loadReports()">
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 3 months</option>
            <option value="365">Last year</option>
          </select>
          <button class="export-btn" (click)="exportReport()">
            📊 Export Report
          </button>
        </div>
      </div>

      <!-- Quick Stats -->
      <div class="stats-row">
        <div class="stat-card growth">
          <div class="stat-header">
            <span class="stat-icon">👥</span>
            <span class="stat-trend positive">+{{ userGrowth }}%</span>
          </div>
          <div class="stat-body">
            <span class="stat-value">{{ totalUsers | number }}</span>
            <span class="stat-label">Total Users</span>
          </div>
        </div>
        <div class="stat-card revenue">
          <div class="stat-header">
            <span class="stat-icon">💰</span>
            <span class="stat-trend positive">+{{ revenueGrowth }}%</span>
          </div>
          <div class="stat-body">
            <span class="stat-value">\${{ totalRevenue | number }}</span>
            <span class="stat-label">Total Revenue</span>
          </div>
        </div>
        <div class="stat-card courses">
          <div class="stat-header">
            <span class="stat-icon">📚</span>
            <span class="stat-trend">{{ activeCourses }}</span>
          </div>
          <div class="stat-body">
            <span class="stat-value">{{ totalEnrollments | number }}</span>
            <span class="stat-label">Total Enrollments</span>
          </div>
        </div>
        <div class="stat-card completion">
          <div class="stat-header">
            <span class="stat-icon">🎓</span>
            <span class="stat-trend">{{ completionRate }}%</span>
          </div>
          <div class="stat-body">
            <span class="stat-value">{{ certificatesIssued | number }}</span>
            <span class="stat-label">Certificates Issued</span>
          </div>
        </div>
      </div>

      <!-- Charts Section -->
      <div class="charts-section">
        <div class="chart-card">
          <h3>User Registrations</h3>
          <div class="chart-placeholder">
            <div class="bar-chart">
              @for (data of userChartData; track data.label) {
                <div class="bar-item">
                  <div class="bar" [style.height.%]="data.value"></div>
                  <span class="bar-label">{{ data.label }}</span>
                </div>
              }
            </div>
          </div>
        </div>
        <div class="chart-card">
          <h3>Enrollment Trends</h3>
          <div class="chart-placeholder">
            <div class="bar-chart">
              @for (data of enrollmentChartData; track data.label) {
                <div class="bar-item">
                  <div class="bar enrollment-bar" [style.height.%]="data.value"></div>
                  <span class="bar-label">{{ data.label }}</span>
                </div>
              }
            </div>
          </div>
        </div>
      </div>

      <!-- Tables Section -->
      <div class="tables-section">
        <div class="table-card">
          <div class="table-header">
            <h3>Top Courses</h3>
            <button class="view-all-btn">View All</button>
          </div>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Course</th>
                <th>Enrollments</th>
                <th>Revenue</th>
                <th>Rating</th>
              </tr>
            </thead>
            <tbody>
              @for (course of topCourses; track course.id; let i = $index) {
                <tr>
                  <td>{{ i + 1 }}</td>
                  <td>
                    <div class="course-cell">
                      <span class="course-title">{{ course.title }}</span>
                      <span class="course-category">{{ course.category }}</span>
                    </div>
                  </td>
                  <td>{{ course.enrollments | number }}</td>
                  <td>\${{ course.revenue | number }}</td>
                  <td>
                    <span class="rating">
                      ⭐ {{ course.rating }}
                    </span>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <div class="table-card">
          <div class="table-header">
            <h3>Recent Activity</h3>
            <button class="view-all-btn">View All</button>
          </div>
          <div class="activity-list">
            @for (activity of recentActivities; track activity.id) {
              <div class="activity-item">
                <span class="activity-icon">{{ activity.icon }}</span>
                <div class="activity-info">
                  <span class="activity-text">{{ activity.text }}</span>
                  <span class="activity-time">{{ activity.time }}</span>
                </div>
              </div>
            }
          </div>
        </div>
      </div>

      <!-- Category Breakdown -->
      <div class="category-section">
        <h3>Enrollment by Category</h3>
        <div class="category-list">
          @for (cat of categoryBreakdown; track cat.name) {
            <div class="category-item">
              <div class="category-header">
                <span class="category-name">{{ cat.name }}</span>
                <span class="category-count">{{ cat.count | number }}</span>
              </div>
              <div class="category-bar-bg">
                <div class="category-bar" [style.width.%]="cat.percentage"></div>
              </div>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .reports-page {
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

    .header-actions {
      display: flex;
      gap: 1rem;
    }

    .header-actions select {
      padding: 0.75rem 1rem;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      font-size: 0.95rem;
      cursor: pointer;
    }

    .export-btn {
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

    .export-btn:hover {
      background: #1a5570;
    }

    .stats-row {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .stat-card {
      background: #fff;
      border-radius: 16px;
      padding: 1.5rem;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    }

    .stat-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .stat-icon {
      font-size: 1.5rem;
    }

    .stat-trend {
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.85rem;
      font-weight: 600;
      background: #f0f0f0;
    }

    .stat-trend.positive {
      background: #e8f5e9;
      color: #2e7d32;
    }

    .stat-body {
      display: flex;
      flex-direction: column;
    }

    .stat-value {
      font-size: 2rem;
      font-weight: 700;
      margin-bottom: 0.25rem;
    }

    .stat-label {
      color: #666;
    }

    .charts-section {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .chart-card {
      background: #fff;
      border-radius: 16px;
      padding: 1.5rem;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    }

    .chart-card h3 {
      font-size: 1.1rem;
      font-weight: 600;
      margin-bottom: 1rem;
    }

    .chart-placeholder {
      height: 200px;
      display: flex;
      align-items: flex-end;
      padding: 1rem 0;
    }

    .bar-chart {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: flex-end;
      justify-content: space-around;
      gap: 0.5rem;
    }

    .bar-item {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      height: 100%;
      justify-content: flex-end;
    }

    .bar {
      width: 100%;
      max-width: 40px;
      background: linear-gradient(180deg, #247090, #1a5570);
      border-radius: 4px 4px 0 0;
      transition: height 0.5s ease;
    }

    .bar.enrollment-bar {
      background: linear-gradient(180deg, #4caf50, #2e7d32);
    }

    .bar-label {
      font-size: 0.75rem;
      color: #666;
      margin-top: 0.5rem;
    }

    .tables-section {
      display: grid;
      grid-template-columns: 3fr 2fr;
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .table-card {
      background: #fff;
      border-radius: 16px;
      padding: 1.5rem;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    }

    .table-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .table-header h3 {
      font-size: 1.1rem;
      font-weight: 600;
    }

    .view-all-btn {
      color: #247090;
      background: none;
      border: none;
      font-weight: 600;
      cursor: pointer;
    }

    table {
      width: 100%;
      border-collapse: collapse;
    }

    th {
      text-align: left;
      padding: 0.75rem;
      font-weight: 600;
      font-size: 0.85rem;
      color: #666;
      border-bottom: 2px solid #f0f0f0;
    }

    td {
      padding: 0.75rem;
      border-bottom: 1px solid #f0f0f0;
    }

    .course-cell {
      display: flex;
      flex-direction: column;
    }

    .course-title {
      font-weight: 500;
    }

    .course-category {
      font-size: 0.8rem;
      color: #666;
    }

    .rating {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
    }

    .activity-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .activity-item {
      display: flex;
      gap: 1rem;
      padding: 0.75rem;
      background: #f8f9fa;
      border-radius: 8px;
    }

    .activity-icon {
      font-size: 1.25rem;
    }

    .activity-info {
      display: flex;
      flex-direction: column;
    }

    .activity-text {
      font-size: 0.9rem;
    }

    .activity-time {
      font-size: 0.8rem;
      color: #999;
    }

    .category-section {
      background: #fff;
      border-radius: 16px;
      padding: 1.5rem;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    }

    .category-section h3 {
      font-size: 1.1rem;
      font-weight: 600;
      margin-bottom: 1.5rem;
    }

    .category-list {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.5rem;
    }

    .category-item {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .category-header {
      display: flex;
      justify-content: space-between;
    }

    .category-name {
      font-weight: 500;
    }

    .category-count {
      color: #666;
    }

    .category-bar-bg {
      height: 8px;
      background: #f0f0f0;
      border-radius: 4px;
      overflow: hidden;
    }

    .category-bar {
      height: 100%;
      background: linear-gradient(90deg, #247090, #4caf50);
      border-radius: 4px;
      transition: width 0.5s ease;
    }

    @media (max-width: 1024px) {
      .stats-row {
        grid-template-columns: repeat(2, 1fr);
      }

      .charts-section,
      .tables-section {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 768px) {
      .page-header {
        flex-direction: column;
        gap: 1rem;
      }

      .header-actions {
        width: 100%;
        flex-wrap: wrap;
      }

      .category-list {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class AdminReportsComponent implements OnInit {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  selectedPeriod = '30';
  isLoading = false;

  // Stats
  totalUsers = 0;
  totalStudents = 0;
  totalInstructors = 0;
  userGrowth = 0;
  totalRevenue = 0;
  revenueGrowth = 8;
  activeCourses = 0;
  publishedCourses = 0;
  totalEnrollments = 0;
  completedEnrollments = 0;
  pendingEnrollments = 0;
  completionRate = 0;
  certificatesIssued = 0;
  totalInternships = 0;
  pendingApplications = 0;
  totalContactMessages = 0;
  unreadMessages = 0;

  // Chart data
  userChartData: { label: string; value: number }[] = [];
  enrollmentChartData: { label: string; value: number }[] = [];

  topCourses: any[] = [];
  recentActivities: any[] = [];
  categoryBreakdown: any[] = [];

  ngOnInit() {
    this.loadReports();
  }

  loadReports() {
    this.isLoading = true;
    this.http.get<any>(`${this.apiUrl}/dashboard/admin?period=${this.selectedPeriod}`).subscribe({
      next: (response) => {
        if (response.isSuccess && response.data) {
          const data = response.data;
          this.totalUsers = (data.totalStudents || 0) + (data.totalInstructors || 0);
          this.totalStudents = data.totalStudents || 0;
          this.totalInstructors = data.totalInstructors || 0;
          this.activeCourses = data.totalCourses || 0;
          this.publishedCourses = data.publishedCourses || 0;
          this.totalEnrollments = data.totalEnrollments || 0;
          this.completedEnrollments = data.completedEnrollments || 0;
          this.pendingEnrollments = data.pendingEnrollments || 0;
          this.certificatesIssued = data.totalCertificates || 0;
          this.totalRevenue = data.totalRevenue || 0;
          this.totalInternships = data.totalInternships || 0;
          this.pendingApplications = data.pendingApplications || 0;
          this.totalContactMessages = data.totalContactMessages || 0;
          this.unreadMessages = data.unreadMessages || 0;
          this.completionRate = this.totalEnrollments > 0 
            ? Math.round((this.completedEnrollments / this.totalEnrollments) * 100) 
            : 0;

          // Process user registration stats for chart
          if (data.userRegistrationStats && data.userRegistrationStats.length > 0) {
            const maxUsers = Math.max(...data.userRegistrationStats.map((s: any) => s.count));
            this.userChartData = data.userRegistrationStats.map((s: any) => ({
              label: s.period.split(' ')[0],
              value: maxUsers > 0 ? (s.count / maxUsers) * 100 : 0
            }));
          }

          // Use user growth from backend
          this.userGrowth = Math.round(data.userGrowthPercentage || 0);
          this.revenueGrowth = Math.round(data.revenueGrowthPercentage || 0);

          // Process enrollment stats for chart
          if (data.enrollmentStats && data.enrollmentStats.length > 0) {
            const maxEnrollment = Math.max(...data.enrollmentStats.map((s: any) => s.count));
            this.enrollmentChartData = data.enrollmentStats.map((s: any) => ({
              label: s.period.split(' ')[0],
              value: maxEnrollment > 0 ? (s.count / maxEnrollment) * 100 : 0
            }));
          }

          // Process category breakdown
          if (data.categoryBreakdown && data.categoryBreakdown.length > 0) {
            this.categoryBreakdown = data.categoryBreakdown.map((c: any) => ({
              name: c.name,
              count: c.count,
              percentage: c.percentage
            }));
          }

          // Process top courses
          if (data.topCourses && data.topCourses.length > 0) {
            this.topCourses = data.topCourses.map((c: any) => ({
              id: c.courseId,
              title: c.courseName,
              category: 'Course',
              enrollments: c.enrollmentCount,
              revenue: c.enrollmentCount * 50, // Estimated
              rating: 4.5
            }));
          }

          // Process recent activities
          if (data.recentActivities && data.recentActivities.length > 0) {
            this.recentActivities = data.recentActivities.map((a: any, i: number) => ({
              id: i + 1,
              icon: a.type === 'Enrollment' ? '📚' : '👤',
              text: a.description,
              time: this.getRelativeTime(a.timestamp)
            }));
          }
        }
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        // Use sample data as fallback
        this.loadSampleData();
      }
    });
  }

  getRelativeTime(timestamp: string): string {
    const now = new Date();
    const date = new Date(timestamp);
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes} minutes ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hours ago`;
    const days = Math.floor(hours / 24);
    return `${days} days ago`;
  }

  loadSampleData() {
    this.topCourses = [
      { id: 1, title: 'Web Development Bootcamp', category: 'Development', enrollments: 523, revenue: 12575, rating: 4.8 },
      { id: 2, title: 'Data Science Fundamentals', category: 'Data Science', enrollments: 412, revenue: 10300, rating: 4.7 },
      { id: 3, title: 'UI/UX Design Masterclass', category: 'Design', enrollments: 356, revenue: 8900, rating: 4.9 },
      { id: 4, title: 'Cloud Computing Essentials', category: 'Cloud', enrollments: 298, revenue: 7450, rating: 4.6 },
      { id: 5, title: 'Mobile App Development', category: 'Development', enrollments: 267, revenue: 6675, rating: 4.5 }
    ];

    this.recentActivities = [
      { id: 1, icon: '👤', text: 'New user registered: Ahmed H.', time: '5 minutes ago' },
      { id: 2, icon: '📚', text: 'Course enrolled: Web Development', time: '12 minutes ago' },
      { id: 3, icon: '🎓', text: 'Certificate issued to Sara M.', time: '25 minutes ago' },
      { id: 4, icon: '💬', text: 'New testimonial received', time: '1 hour ago' },
      { id: 5, icon: '⭐', text: 'Course rated 5 stars', time: '2 hours ago' }
    ];

    this.categoryBreakdown = [
      { name: 'Web Development', count: 1245, percentage: 85 },
      { name: 'Data Science', count: 892, percentage: 65 },
      { name: 'UI/UX Design', count: 654, percentage: 50 },
      { name: 'Cloud Computing', count: 523, percentage: 40 },
      { name: 'Mobile Development', count: 412, percentage: 32 },
      { name: 'Cybersecurity', count: 298, percentage: 25 }
    ];
  }

  exportReport() {
    // Generate comprehensive CSV report with all platform data
    const headers = ['Category', 'Metric', 'Value'];
    const data = [
      // User Statistics
      ['Users', 'Total Users', this.totalUsers],
      ['Users', 'Total Students', this.totalStudents],
      ['Users', 'Total Instructors', this.totalInstructors],
      ['Users', 'User Growth %', `${this.userGrowth}%`],
      
      // Course Statistics
      ['Courses', 'Total Courses', this.activeCourses],
      ['Courses', 'Published Courses', this.publishedCourses],
      
      // Enrollment Statistics
      ['Enrollments', 'Total Enrollments', this.totalEnrollments],
      ['Enrollments', 'Completed Enrollments', this.completedEnrollments],
      ['Enrollments', 'Pending Enrollments', this.pendingEnrollments],
      ['Enrollments', 'Completion Rate', `${this.completionRate}%`],
      
      // Revenue
      ['Revenue', 'Total Revenue', `$${this.totalRevenue}`],
      
      // Certificates
      ['Certificates', 'Certificates Issued', this.certificatesIssued],
      
      // Internships
      ['Internships', 'Total Internships', this.totalInternships],
      ['Internships', 'Pending Applications', this.pendingApplications],
      
      // Contact Messages
      ['Messages', 'Total Contact Messages', this.totalContactMessages],
      ['Messages', 'Unread Messages', this.unreadMessages],
    ];

    // Add top courses section
    if (this.topCourses.length > 0) {
      data.push(['', '', '']);
      data.push(['Top Courses', 'Course Name', 'Enrollments']);
      this.topCourses.forEach(course => {
        data.push(['', course.title, course.enrollments]);
      });
    }

    const csv = [
      headers.join(','),
      ...data.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `techmaster-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }
}
