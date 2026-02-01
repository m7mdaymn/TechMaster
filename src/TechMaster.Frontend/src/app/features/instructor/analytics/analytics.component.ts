import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DashboardService } from '../../../core/services/dashboard.service';
import { ToastrService } from 'ngx-toastr';

interface AnalyticsData {
  courseId: number;
  courseTitle: string;
  totalEnrollments: number;
  activeStudents: number;
  completionRate: number;
  averageRating: number;
  totalRevenue: number;
  monthlyEnrollments: { month: string; count: number }[];
  topPerformingSessions: { title: string; completionRate: number; averageScore: number }[];
  studentProgress: { range: string; count: number }[];
  recentReviews: { studentName: string; rating: number; comment: string; date: Date }[];
}

@Component({
  selector: 'app-course-analytics',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="analytics-page">
      <div class="page-header">
        <div class="header-left">
          <a routerLink="/instructor/courses" class="back-link">
            <span>←</span>
            Back
          </a>
          <div class="header-info">
            <h1>{{ data()?.courseTitle }}</h1>
            <span class="subtitle">Course Analytics</span>
          </div>
        </div>
        <div class="header-actions">
          <select [(ngModel)]="selectedPeriod" [ngModelOptions]="{standalone: true}" (change)="loadData()">
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="90">Last 90 Days</option>
            <option value="365">Last Year</option>
          </select>
          <button class="export-btn">
            <span>📊</span>
            Export
          </button>
        </div>
      </div>

      @if (loading()) {
        <div class="loading-state">
          <div class="spinner"></div>
        </div>
      } @else if (data()) {
        <!-- Stats Overview -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon enrollments">👥</div>
            <div class="stat-content">
              <span class="stat-value">{{ data()?.totalEnrollments | number }}</span>
              <span class="stat-label">Total Enrollments</span>
            </div>
            <div class="stat-trend positive">+12%</div>
          </div>

          <div class="stat-card">
            <div class="stat-icon active">🎯</div>
            <div class="stat-content">
              <span class="stat-value">{{ data()?.activeStudents | number }}</span>
              <span class="stat-label">Active Students</span>
            </div>
            <div class="stat-trend positive">+8%</div>
          </div>

          <div class="stat-card">
            <div class="stat-icon completion">✅</div>
            <div class="stat-content">
              <span class="stat-value">{{ data()?.completionRate }}%</span>
              <span class="stat-label">Completion Rate</span>
            </div>
            <div class="stat-trend positive">+5%</div>
          </div>

          <div class="stat-card">
            <div class="stat-icon rating">⭐</div>
            <div class="stat-content">
              <span class="stat-value">{{ data()?.averageRating?.toFixed(1) }}</span>
              <span class="stat-label">Average Rating</span>
            </div>
            <div class="stat-trend neutral">0%</div>
          </div>

          <div class="stat-card">
            <div class="stat-icon revenue">💰</div>
            <div class="stat-content">
              <span class="stat-value">{{ '$' + (data()?.totalRevenue | number) }}</span>
              <span class="stat-label">Total Revenue</span>
            </div>
            <div class="stat-trend positive">+15%</div>
          </div>
        </div>

        <!-- Charts Section -->
        <div class="charts-section">
          <!-- Enrollment Chart -->
          <div class="chart-card">
            <div class="chart-header">
              <h3>Enrollment Trend</h3>
            </div>
            <div class="chart-body">
              <div class="bar-chart">
                @for (item of data()?.monthlyEnrollments; track item.month) {
                  <div class="bar-item">
                    <div class="bar" [style.height.%]="getBarHeight(item.count)">
                      <span class="bar-value">{{ item.count }}</span>
                    </div>
                    <span class="bar-label">{{ item.month }}</span>
                  </div>
                }
              </div>
            </div>
          </div>

          <!-- Progress Distribution -->
          <div class="chart-card">
            <div class="chart-header">
              <h3>Progress Distribution</h3>
            </div>
            <div class="chart-body">
              <div class="progress-chart">
                @for (item of data()?.studentProgress; track item.range) {
                  <div class="progress-item">
                    <div class="progress-info">
                      <span class="progress-range">{{ item.range }}</span>
                      <span class="progress-count">{{ item.count }} students</span>
                    </div>
                    <div class="progress-bar">
                      <div class="progress-fill" [style.width.%]="getProgressWidth(item.count)"></div>
                    </div>
                  </div>
                }
              </div>
            </div>
          </div>
        </div>

        <!-- Tables Section -->
        <div class="tables-section">
          <!-- Top Sessions -->
          <div class="table-card">
            <div class="table-header">
              <h3>Top Sessions</h3>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Session</th>
                  <th>Completion</th>
                  <th>Avg Score</th>
                </tr>
              </thead>
              <tbody>
                @for (session of data()?.topPerformingSessions; track session.title) {
                  <tr>
                    <td>{{ session.title }}</td>
                    <td>
                      <div class="completion-cell">
                        <div class="mini-progress">
                          <div class="mini-fill" [style.width.%]="session.completionRate"></div>
                        </div>
                        <span>{{ session.completionRate }}%</span>
                      </div>
                    </td>
                    <td>
                      <span class="score-badge" [class.high]="session.averageScore >= 80">
                        {{ session.averageScore }}%
                      </span>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Recent Reviews -->
          <div class="table-card">
            <div class="table-header">
              <h3>Recent Reviews</h3>
              <a routerLink="#" class="view-all">View All</a>
            </div>
            <div class="reviews-list">
              @for (review of data()?.recentReviews; track review) {
                <div class="review-item">
                  <div class="review-header">
                    <span class="reviewer-name">{{ review.studentName }}</span>
                    <div class="review-rating">
                      @for (star of [1,2,3,4,5]; track star) {
                        <span [class.filled]="star <= review.rating">★</span>
                      }
                    </div>
                  </div>
                  <p class="review-comment">{{ review.comment }}</p>
                  <span class="review-date">{{ review.date | date:'mediumDate' }}</span>
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

    .header-left {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .back-link {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      color: #666;
      text-decoration: none;
      font-size: 0.9rem;
    }

    .back-link:hover {
      color: #247090;
    }

    .header-info h1 {
      font-size: 1.75rem;
      font-weight: 700;
      margin-bottom: 0.25rem;
    }

    .subtitle {
      color: #666;
    }

    .header-actions {
      display: flex;
      gap: 0.75rem;
    }

    .header-actions select {
      padding: 0.625rem 1rem;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      font-size: 0.95rem;
      background: #fff;
    }

    .export-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.625rem 1rem;
      background: #000;
      color: #fff;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
    }

    .loading-state {
      text-align: center;
      padding: 4rem;
    }

    .spinner {
      width: 50px;
      height: 50px;
      border: 3px solid #f0f0f0;
      border-top-color: #247090;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 1.25rem;
      margin-bottom: 2rem;
    }

    .stat-card {
      background: #fff;
      border-radius: 16px;
      padding: 1.5rem;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .stat-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
    }

    .stat-icon.enrollments { background: #e3f2fd; }
    .stat-icon.active { background: #f3e5f5; }
    .stat-icon.completion { background: #e8f5e9; }
    .stat-icon.rating { background: #fff3e0; }
    .stat-icon.revenue { background: #e0f2f1; }

    .stat-value {
      font-size: 1.75rem;
      font-weight: 700;
      display: block;
    }

    .stat-label {
      font-size: 0.85rem;
      color: #666;
    }

    .stat-trend {
      font-size: 0.85rem;
      font-weight: 600;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      align-self: flex-start;
    }

    .stat-trend.positive {
      background: #d4edda;
      color: #155724;
    }

    .stat-trend.negative {
      background: #f8d7da;
      color: #721c24;
    }

    .stat-trend.neutral {
      background: #f8f9fa;
      color: #666;
    }

    .charts-section {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .chart-card, .table-card {
      background: #fff;
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      overflow: hidden;
    }

    .chart-header, .table-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid #f0f0f0;
    }

    .chart-header h3, .table-header h3 {
      font-size: 1.1rem;
      font-weight: 700;
    }

    .view-all {
      color: #247090;
      text-decoration: none;
      font-size: 0.9rem;
      font-weight: 600;
    }

    .chart-body {
      padding: 1.5rem;
    }

    .bar-chart {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      height: 200px;
      gap: 0.5rem;
    }

    .bar-item {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
    }

    .bar {
      width: 100%;
      max-width: 40px;
      background: linear-gradient(180deg, #247090 0%, #1a5570 100%);
      border-radius: 4px 4px 0 0;
      position: relative;
      min-height: 20px;
      transition: height 0.5s ease;
    }

    .bar-value {
      position: absolute;
      top: -24px;
      left: 50%;
      transform: translateX(-50%);
      font-size: 0.75rem;
      font-weight: 600;
    }

    .bar-label {
      font-size: 0.75rem;
      color: #666;
    }

    .progress-chart {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .progress-item {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .progress-info {
      display: flex;
      justify-content: space-between;
    }

    .progress-range {
      font-weight: 600;
      font-size: 0.9rem;
    }

    .progress-count {
      font-size: 0.85rem;
      color: #666;
    }

    .progress-bar {
      height: 8px;
      background: #e0e0e0;
      border-radius: 4px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #247090, #3a9bc5);
      border-radius: 4px;
    }

    .tables-section {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
    }

    table {
      width: 100%;
      border-collapse: collapse;
    }

    th {
      text-align: left;
      padding: 0.875rem 1.5rem;
      background: #f8f9fa;
      font-weight: 600;
      font-size: 0.85rem;
      color: #666;
    }

    td {
      padding: 0.875rem 1.5rem;
      border-bottom: 1px solid #f0f0f0;
    }

    .completion-cell {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .mini-progress {
      width: 60px;
      height: 6px;
      background: #e0e0e0;
      border-radius: 3px;
      overflow: hidden;
    }

    .mini-fill {
      height: 100%;
      background: #247090;
    }

    .score-badge {
      padding: 0.25rem 0.5rem;
      background: #f8f9fa;
      border-radius: 4px;
      font-weight: 600;
      font-size: 0.85rem;
    }

    .score-badge.high {
      background: #d4edda;
      color: #155724;
    }

    .reviews-list {
      padding: 1rem 1.5rem;
    }

    .review-item {
      padding: 1rem 0;
      border-bottom: 1px solid #f0f0f0;
    }

    .review-item:last-child {
      border-bottom: none;
    }

    .review-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }

    .reviewer-name {
      font-weight: 600;
    }

    .review-rating {
      color: #e0e0e0;
    }

    .review-rating .filled {
      color: #ffc107;
    }

    .review-comment {
      font-size: 0.9rem;
      color: #666;
      line-height: 1.5;
      margin-bottom: 0.5rem;
    }

    .review-date {
      font-size: 0.8rem;
      color: #999;
    }

    @media (max-width: 1200px) {
      .stats-grid {
        grid-template-columns: repeat(3, 1fr);
      }

      .charts-section, .tables-section {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 768px) {
      .analytics-page {
        padding: 1rem;
      }

      .page-header {
        flex-direction: column;
      }

      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 480px) {
      .stats-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class CourseAnalyticsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private dashboardService = inject(DashboardService);
  private toastr = inject(ToastrService);

  loading = signal(true);
  data = signal<AnalyticsData | null>(null);
  selectedPeriod = '30';
  courseId = '';

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.courseId = params['id'] || params['slug'];
      this.loadData();
    });
  }

  loadData() {
    this.loading.set(true);
    
    if (!this.courseId) {
      this.toastr.error('Course ID not found');
      this.loading.set(false);
      return;
    }

    this.dashboardService.getCourseAnalytics(this.courseId).subscribe({
      next: (analytics) => {
        if (analytics) {
          const mappedData: AnalyticsData = {
            courseId: parseInt(this.courseId) || 0,
            courseTitle: analytics.courseTitle || 'Course Analytics',
            totalEnrollments: analytics.totalEnrollments || 0,
            activeStudents: analytics.activeStudents || 0,
            completionRate: analytics.completionRate || 0,
            averageRating: analytics.averageRating || 0,
            totalRevenue: analytics.totalRevenue || 0,
            monthlyEnrollments: analytics.monthlyEnrollments || [],
            studentProgress: analytics.studentProgress || [
              { range: '0-25%', count: 0 },
              { range: '26-50%', count: 0 },
              { range: '51-75%', count: 0 },
              { range: '76-100%', count: 0 }
            ],
            topPerformingSessions: analytics.topPerformingSessions || [],
            recentReviews: (analytics.recentReviews || []).map((r: any) => ({
              studentName: r.studentName || 'Anonymous',
              rating: r.rating || 0,
              comment: r.comment || '',
              date: new Date(r.date || r.createdAt)
            }))
          };
          this.data.set(mappedData);
        }
        this.loading.set(false);
      },
      error: () => {
        this.toastr.error('Failed to load analytics');
        this.loading.set(false);
      }
    });
  }

  getBarHeight(count: number): number {
    const max = Math.max(...(this.data()?.monthlyEnrollments.map(i => i.count) || [1]));
    return (count / max) * 100;
  }

  getProgressWidth(count: number): number {
    const total = this.data()?.studentProgress.reduce((acc, item) => acc + item.count, 0) || 1;
    return (count / total) * 100;
  }
}
