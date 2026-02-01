import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { EnrollmentService } from '../../../core/services/enrollment.service';
import { AuthService } from '../../../core/services/auth.service';
import { MediaService } from '../../../core/services/media.service';

interface EnrolledCourse {
  id: string;
  courseId: string;
  courseTitle: string;
  courseSlug: string;
  courseThumbnail: string;
  instructorName: string;
  progress: number;
  lastAccessed: Date;
  totalSessions: number;
  completedSessions: number;
  status: string;
}

@Component({
  selector: 'app-my-courses',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="my-courses-page">
      <div class="page-header">
        <div class="header-content">
          <h1>My Courses</h1>
          <p>Track your learning progress</p>
        </div>
        <div class="header-actions">
          <a routerLink="/courses" class="explore-btn">
            <span class="btn-icon">🔍</span>
            Explore Courses
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
            [class.active]="activeFilter() === 'in-progress'"
            (click)="activeFilter.set('in-progress')"
          >
            In Progress
            <span class="count">{{ inProgressCount() }}</span>
          </button>
          <button 
            class="filter-tab" 
            [class.active]="activeFilter() === 'completed'"
            (click)="activeFilter.set('completed')"
          >
            Completed
            <span class="count">{{ completedCount() }}</span>
          </button>
        </div>

        <div class="view-toggle">
          <button 
            class="view-btn" 
            [class.active]="viewMode() === 'grid'"
            (click)="viewMode.set('grid')"
          >
            <span>▦</span>
          </button>
          <button 
            class="view-btn" 
            [class.active]="viewMode() === 'list'"
            (click)="viewMode.set('list')"
          >
            <span>☰</span>
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
          <p>Start your learning journey by enrolling in a course</p>
          <a routerLink="/courses" class="cta-btn">
            Start Learning
          </a>
        </div>
      } @else {
        <div class="courses-container" [class.grid-view]="viewMode() === 'grid'" [class.list-view]="viewMode() === 'list'">
          @for (course of filteredCourses(); track course.id) {
            <div class="course-card">
              <div class="course-thumbnail">
                <img [src]="mediaService.getCourseThumbnail(course.courseThumbnail)" [alt]="course.courseTitle">
                <div class="progress-overlay">
                  <div class="progress-circle">
                    <svg viewBox="0 0 36 36">
                      <path class="bg"
                        d="M18 2.0845
                          a 15.9155 15.9155 0 0 1 0 31.831
                          a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path class="progress"
                        [style.strokeDasharray]="course.progress + ', 100'"
                        d="M18 2.0845
                          a 15.9155 15.9155 0 0 1 0 31.831
                          a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <span class="percentage">{{ course.progress }}%</span>
                  </div>
                </div>
              </div>

              <div class="course-content">
                <div class="course-meta">
                  <span class="instructor">{{ course.instructorName }}</span>
                  <span class="status-badge" [class]="course.status">
                    {{ course.status === 'Completed' ? 'Completed' : 'In Progress' }}
                  </span>
                </div>

                <h3 class="course-title">
                  <a [routerLink]="['/student/learn', course.courseId]">{{ course.courseTitle }}</a>
                </h3>

                <div class="course-stats">
                  <div class="stat">
                    <span class="stat-icon">📖</span>
                    <span>{{ course.completedSessions }}/{{ course.totalSessions }} sessions</span>
                  </div>
                  <div class="stat">
                    <span class="stat-icon">🕐</span>
                    <span>{{ formatDate(course.lastAccessed) }}</span>
                  </div>
                </div>

                <div class="progress-bar">
                  <div class="progress-fill" [style.width.%]="course.progress"></div>
                </div>

                <div class="course-actions">
                  <a [routerLink]="['/student/learn', course.courseId]" class="continue-btn">
                    {{ course.progress === 100 ? 'Review' : 'Continue' }}
                    <span class="arrow">→</span>
                  </a>
                </div>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .my-courses-page {
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

    .explore-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      background: linear-gradient(135deg, #247090 0%, #1a5570 100%);
      color: #fff;
      border-radius: 10px;
      text-decoration: none;
      font-weight: 600;
      transition: all 0.3s ease;
    }

    .explore-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(36, 112, 144, 0.3);
    }

    .filters-section {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      gap: 1rem;
      flex-wrap: wrap;
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

    .view-toggle {
      display: flex;
      background: #f8f9fa;
      border-radius: 8px;
      overflow: hidden;
    }

    .view-btn {
      padding: 0.5rem 0.75rem;
      background: none;
      border: none;
      cursor: pointer;
      font-size: 1.25rem;
      color: #666;
      transition: all 0.3s ease;
    }

    .view-btn.active {
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

    .courses-container {
      display: grid;
      gap: 1.5rem;
    }

    .courses-container.grid-view {
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    }

    .courses-container.list-view {
      grid-template-columns: 1fr;
    }

    .course-card {
      background: #fff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      transition: all 0.3s ease;
    }

    .list-view .course-card {
      display: grid;
      grid-template-columns: 280px 1fr;
    }

    .course-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 40px rgba(0, 0, 0, 0.12);
    }

    .course-thumbnail {
      position: relative;
      aspect-ratio: 16/9;
      overflow: hidden;
    }

    .list-view .course-thumbnail {
      aspect-ratio: auto;
      height: 100%;
    }

    .course-thumbnail img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .progress-overlay {
      position: absolute;
      bottom: 0.75rem;
      right: 0.75rem;
    }

    .progress-circle {
      width: 48px;
      height: 48px;
      background: rgba(0, 0, 0, 0.8);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    }

    .progress-circle svg {
      position: absolute;
      width: 100%;
      height: 100%;
      transform: rotate(-90deg);
    }

    .progress-circle .bg {
      fill: none;
      stroke: rgba(255, 255, 255, 0.2);
      stroke-width: 3;
    }

    .progress-circle .progress {
      fill: none;
      stroke: #247090;
      stroke-width: 3;
      stroke-linecap: round;
    }

    .progress-circle .percentage {
      font-size: 0.7rem;
      font-weight: 700;
      color: #fff;
      position: relative;
      z-index: 1;
    }

    .course-content {
      padding: 1.25rem;
    }

    .course-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.75rem;
    }

    .instructor {
      font-size: 0.85rem;
      color: #666;
    }

    .status-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .status-badge.Completed {
      background: #d4edda;
      color: #155724;
    }

    .status-badge.InProgress {
      background: #fff3cd;
      color: #856404;
    }

    .course-title {
      font-size: 1.1rem;
      font-weight: 700;
      margin-bottom: 0.75rem;
      line-height: 1.4;
    }

    .course-title a {
      color: #000;
      text-decoration: none;
    }

    .course-title a:hover {
      color: #247090;
    }

    .course-stats {
      display: flex;
      gap: 1rem;
      margin-bottom: 1rem;
      font-size: 0.85rem;
      color: #666;
    }

    .stat {
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    .progress-bar {
      height: 6px;
      background: #e0e0e0;
      border-radius: 3px;
      overflow: hidden;
      margin-bottom: 1rem;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #247090, #3a9bc5);
      border-radius: 3px;
      transition: width 0.3s ease;
    }

    .course-actions {
      display: flex;
      justify-content: flex-end;
    }

    .continue-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.625rem 1.25rem;
      background: #000;
      color: #fff;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      font-size: 0.9rem;
      transition: all 0.3s ease;
    }

    .continue-btn:hover {
      background: #247090;
    }

    .continue-btn .arrow {
      transition: transform 0.3s ease;
    }

    .continue-btn:hover .arrow {
      transform: translateX(4px);
    }

    @media (max-width: 768px) {
      .my-courses-page {
        padding: 1rem;
      }

      .page-header {
        flex-direction: column;
      }

      .list-view .course-card {
        grid-template-columns: 1fr;
      }

      .course-stats {
        flex-direction: column;
        gap: 0.5rem;
      }
    }

    :host-context([dir="rtl"]) {
      .continue-btn .arrow {
        transform: rotate(180deg);
      }

      .continue-btn:hover .arrow {
        transform: rotate(180deg) translateX(4px);
      }

      .progress-overlay {
        right: auto;
        left: 0.75rem;
      }
    }
  `]
})
export class MyCoursesComponent implements OnInit {
  private enrollmentService = inject(EnrollmentService);
  private authService = inject(AuthService);
  mediaService = inject(MediaService);

  loading = signal(true);
  courses = signal<EnrolledCourse[]>([]);
  activeFilter = signal<'all' | 'in-progress' | 'completed'>('all');
  viewMode = signal<'grid' | 'list'>('grid');

  ngOnInit() {
    this.loadCourses();
  }

  loadCourses() {
    this.loading.set(true);
    this.enrollmentService.getMyEnrollments().subscribe({
      next: (response) => {
        // Handle both paginated and direct array responses
        let enrollments: any[] = [];
        if (response.isSuccess && response.data) {
          enrollments = Array.isArray(response.data) ? response.data : 
                        (response.data.items || response.data);
        }
        const mappedCourses: EnrolledCourse[] = enrollments.map((e: any) => ({
          id: e.id,
          courseId: e.courseId || e.id,
          courseTitle: e.courseTitle || e.courseName || 'Unknown Course',
          courseSlug: e.courseSlug || '',
          courseThumbnail: e.courseThumbnail || 'assets/images/courses/default.jpg',
          instructorName: e.instructorName || 'Unknown Instructor',
          progress: e.progressPercentage || e.progress || 0,
          lastAccessed: e.lastAccessedAt ? new Date(e.lastAccessedAt) : new Date(),
          totalSessions: e.totalSessions || 0,
          completedSessions: e.completedSessions || 0,
          status: e.status || (e.progressPercentage === 100 ? 'Completed' : 'InProgress')
        }));
        this.courses.set(mappedCourses);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  filteredCourses() {
    const filter = this.activeFilter();
    if (filter === 'all') return this.courses();
    if (filter === 'completed') return this.courses().filter(c => c.status === 'Completed');
    return this.courses().filter(c => c.status === 'InProgress');
  }

  inProgressCount() {
    return this.courses().filter(c => c.status === 'InProgress').length;
  }

  completedCount() {
    return this.courses().filter(c => c.status === 'Completed').length;
  }

  formatDate(date: Date): string {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return new Date(date).toLocaleDateString();
  }
}
