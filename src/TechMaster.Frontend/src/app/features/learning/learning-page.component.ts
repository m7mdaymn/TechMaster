import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { CourseService, Course, Module as CourseModule, Session as CourseSession } from '@core/services/course.service';
import { EnrollmentService, CourseProgress, SessionProgress } from '@core/services/enrollment.service';
import { ToastrService } from 'ngx-toastr';
import { forkJoin } from 'rxjs';

interface CourseContent {
  id: string;
  title: string;
  instructorId?: string;
  instructorName?: string;
  modules: Module[];
}

interface Module {
  id: string;
  title: string;
  order: number;
  sessions: Session[];
}

interface Session {
  id: string;
  title: string;
  type: string;
  content: string;
  videoUrl: string;
  pdfUrl?: string;
  externalLink?: string;
  durationMinutes: number;
  order: number;
  isUnlocked: boolean;
  isCompleted: boolean;
  watchPercentage: number;
  hasQuiz: boolean;
  quizPassed: boolean;
  resources: Resource[];
}

interface Resource {
  id: string;
  title: string;
  type: string;
  url: string;
}

interface Progress {
  courseProgress: number;
  completedSessions: number;
  totalSessions: number;
}

@Component({
  selector: 'app-learning-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="learning-page">
      @if (loading()) {
        <div class="loading-state">
          <div class="spinner-large"></div>
          <p>Loading course content...</p>
        </div>
      } @else if (error()) {
        <div class="error-state">
          <span class="material-icons">error_outline</span>
          <h2>Unable to Load Course</h2>
          <p>{{ error() }}</p>
          <a routerLink="/dashboard" class="btn btn-primary">Back to Dashboard</a>
        </div>
      } @else {
        <!-- Header -->
        <header class="learning-header">
          <a routerLink="/dashboard" class="back-btn">
            <span class="material-icons">arrow_back</span>
          </a>
          <div class="course-info">
            <h1>{{ course()?.title }}</h1>
            <div class="progress-info">
              <div class="progress-bar">
                <div class="progress-fill" [style.width.%]="progress().courseProgress"></div>
              </div>
              <span>{{ progress().courseProgress }}% complete</span>
            </div>
          </div>
          <button class="menu-btn" (click)="toggleSidebar()">
            <span class="material-icons">menu</span>
          </button>
        </header>

        <div class="learning-content">
          <!-- Sidebar -->
          <aside class="course-sidebar" [class.open]="sidebarOpen()">
            <div class="sidebar-header">
              <h2>Course Content</h2>
              <button class="close-btn" (click)="toggleSidebar()">
                <span class="material-icons">close</span>
              </button>
            </div>
            <div class="modules-list">
              @for (module of course()?.modules; track module.id; let mi = $index) {
                <div class="module-section" [class.expanded]="expandedModules().has(module.id)">
                  <button class="module-header" (click)="toggleModule(module.id)">
                    <span class="material-icons expand-icon">expand_more</span>
                    <div class="module-info">
                      <span class="module-number">Module {{ mi + 1 }}</span>
                      <span class="module-title">{{ module.title }}</span>
                    </div>
                    <span class="module-progress">{{ getModuleProgress(module) }}/{{ module.sessions.length }}</span>
                  </button>
                  <div class="sessions-list">
                    @for (session of module.sessions; track session.id; let si = $index) {
                      <button 
                        class="session-item" 
                        [class.active]="currentSession()?.id === session.id"
                        [class.completed]="session.isCompleted"
                        [class.locked]="!session.isUnlocked"
                        [disabled]="!session.isUnlocked"
                        (click)="selectSession(session)"
                      >
                        <span class="session-status">
                          @if (session.isCompleted) {
                            <span class="material-icons completed">check_circle</span>
                          } @else if (!session.isUnlocked) {
                            <span class="material-icons locked">lock</span>
                          } @else {
                            <span class="material-icons">
                              @switch (session.type) {
                                @case ('Video') { play_circle }
                                @case ('Article') { article }
                                @case ('Quiz') { quiz }
                                @case ('PDF') { picture_as_pdf }
                                @default { play_circle }
                              }
                            </span>
                          }
                        </span>
                        <div class="session-info">
                          <span class="session-title">{{ session.title }}</span>
                          <span class="session-meta">{{ session.durationMinutes }} min</span>
                        </div>
                      </button>
                    }
                  </div>
                </div>
              }
            </div>
          </aside>

          <!-- Main Content -->
          <main class="session-content">
            @if (currentSession()) {
              @switch (currentSession()!.type) {
                @case ('Video') {
                  <div class="video-container">
                    @if (getVideoUrl()) {
                      <iframe 
                        [src]="getVideoUrl()" 
                        frameborder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowfullscreen
                      ></iframe>
                    } @else {
                      <div class="video-placeholder">
                        <span class="material-icons">play_circle</span>
                        <p>Video content will appear here</p>
                      </div>
                    }
                  </div>
                }
                @case ('Article') {
                  <div class="article-content" [innerHTML]="currentSession()!.content"></div>
                }
                @case ('PDF') {
                  <div class="pdf-container">
                    @if (currentSession()!.pdfUrl) {
                      <iframe [src]="getPdfUrl()" frameborder="0" class="pdf-viewer"></iframe>
                    } @else {
                      <div class="content-placeholder">
                        <span class="material-icons">picture_as_pdf</span>
                        <p>PDF content will appear here</p>
                      </div>
                    }
                  </div>
                }
                @case ('Quiz') {
                  <div class="quiz-container">
                    <div class="quiz-header">
                      <span class="material-icons">quiz</span>
                      <h2>{{ currentSession()!.title }}</h2>
                    </div>
                    <p>Complete this quiz to test your knowledge and unlock the next session.</p>
                    @if (currentSession()!.quizPassed) {
                      <div class="quiz-passed">
                        <span class="material-icons">check_circle</span>
                        <p>You have passed this quiz!</p>
                      </div>
                    } @else {
                      <a [routerLink]="['/quiz', currentSession()!.id]" class="btn btn-primary">
                        Start Quiz
                      </a>
                    }
                  </div>
                }
                @default {
                  <div class="article-content" [innerHTML]="currentSession()!.content"></div>
                }
              }

              <!-- Session Details -->
              <div class="session-details">
                <div class="session-header">
                  <h2>{{ currentSession()!.title }}</h2>
                  <div class="session-actions">
                    @if (!currentSession()!.isCompleted && currentSession()!.type !== 'Quiz') {
                      <button class="btn btn-primary" (click)="markComplete()" [disabled]="marking()">
                        @if (marking()) {
                          <span class="spinner"></span>
                        } @else {
                          <span class="material-icons">check</span>
                          Mark as Complete
                        }
                      </button>
                    }
                    @if (nextSession()) {
                      <button class="btn btn-outline" (click)="goToNext()" [disabled]="!nextSession()?.isUnlocked">
                        Next
                        <span class="material-icons">arrow_forward</span>
                      </button>
                    }
                  </div>
                </div>

                <!-- Resources -->
                @if (currentSession()!.resources && currentSession()!.resources.length) {
                  <div class="resources-section">
                    <h3>Resources</h3>
                  <div class="resources-list">
                    @for (resource of currentSession()!.resources; track resource.id) {
                      <a [href]="resource.url" target="_blank" class="resource-item">
                        <span class="material-icons">
                          @switch (resource.type) {
                            @case ('PDF') { picture_as_pdf }
                            @case ('Code') { code }
                            @case ('Link') { link }
                            @default { attach_file }
                          }
                        </span>
                        <span>{{ resource.title }}</span>
                        <span class="material-icons download">download</span>
                      </a>
                    }
                  </div>
                </div>
              }
            </div>
          } @else {
            <div class="no-session">
              <span class="material-icons">school</span>
              <h2>Select a session to start learning</h2>
              <p>Choose a session from the sidebar to begin</p>
            </div>
          }
        </main>
      </div>
      }
    </div>
  `,
  styles: [`
    .learning-page {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      background: var(--color-gray-100);
    }

    /* Loading & Error States */
    .loading-state,
    .error-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 2rem;
      text-align: center;
    }

    .spinner-large {
      width: 48px;
      height: 48px;
      border: 3px solid var(--color-gray-300);
      border-top-color: var(--color-primary);
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 1rem;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .error-state .material-icons {
      font-size: 64px;
      color: var(--color-error);
      margin-bottom: 1rem;
    }

    .error-state h2 {
      font-size: 1.5rem;
      color: var(--color-dark);
      margin-bottom: 0.5rem;
    }

    .error-state p {
      color: var(--color-gray-600);
      margin-bottom: 1.5rem;
    }

    /* PDF & Content Styles */
    .pdf-container {
      width: 100%;
      height: 600px;
      background: var(--color-gray-200);
    }

    .pdf-viewer {
      width: 100%;
      height: 100%;
    }

    .content-placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: var(--color-gray-600);
    }

    .content-placeholder .material-icons {
      font-size: 64px;
      margin-bottom: 1rem;
    }

    .quiz-passed {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 1rem;
      background: var(--color-success-light, #d4edda);
      border-radius: 8px;
      color: var(--color-success, #155724);
    }

    .quiz-passed .material-icons {
      color: var(--color-success, #155724);
    }

    /* Header */
    .learning-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem 1.5rem;
      background: var(--color-dark);
      color: white;
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .back-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border-radius: 8px;
      color: white;
      text-decoration: none;
      transition: background 0.2s ease;
    }

    .back-btn:hover {
      background: rgba(255, 255, 255, 0.1);
    }

    .course-info {
      flex: 1;
    }

    .course-info h1 {
      font-size: 1rem;
      font-weight: 600;
      margin-bottom: 0.5rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .progress-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .progress-bar {
      flex: 1;
      max-width: 300px;
      height: 6px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 3px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: var(--color-primary);
      border-radius: 3px;
      transition: width 0.3s ease;
    }

    .progress-info span {
      font-size: 0.75rem;
      opacity: 0.8;
    }

    .menu-btn {
      display: none;
      width: 40px;
      height: 40px;
      border: none;
      background: none;
      color: white;
      cursor: pointer;
    }

    /* Learning Content */
    .learning-content {
      flex: 1;
      display: flex;
    }

    /* Sidebar */
    .course-sidebar {
      width: 360px;
      background: white;
      border-right: 1px solid var(--color-gray-200);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .sidebar-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.5rem;
      border-bottom: 1px solid var(--color-gray-200);
    }

    .sidebar-header h2 {
      font-size: 1rem;
      font-weight: 600;
      color: var(--color-dark);
    }

    .close-btn {
      display: none;
      width: 32px;
      height: 32px;
      border: none;
      background: none;
      cursor: pointer;
    }

    .modules-list {
      flex: 1;
      overflow-y: auto;
    }

    .module-section {
      border-bottom: 1px solid var(--color-gray-100);
    }

    .module-header {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem 1.5rem;
      background: var(--color-gray-50);
      border: none;
      cursor: pointer;
      text-align: left;
    }

    .expand-icon {
      color: var(--color-gray-400);
      transition: transform 0.3s ease;
    }

    .module-section.expanded .expand-icon {
      transform: rotate(180deg);
    }

    .module-info {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .module-number {
      font-size: 0.625rem;
      font-weight: 600;
      color: var(--color-primary);
      text-transform: uppercase;
    }

    .module-title {
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--color-dark);
    }

    .module-progress {
      font-size: 0.75rem;
      color: var(--color-gray-500);
    }

    .sessions-list {
      display: none;
    }

    .module-section.expanded .sessions-list {
      display: block;
    }

    .session-item {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.875rem 1.5rem 0.875rem 2.5rem;
      background: none;
      border: none;
      border-top: 1px solid var(--color-gray-100);
      cursor: pointer;
      text-align: left;
      transition: background 0.2s ease;
    }

    .session-item:hover:not(:disabled) {
      background: var(--color-gray-50);
    }

    .session-item.active {
      background: rgba(36, 112, 144, 0.1);
      border-left: 3px solid var(--color-primary);
    }

    .session-item.locked {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .session-status .material-icons {
      font-size: 1.25rem;
      color: var(--color-gray-400);
    }

    .session-status .material-icons.completed {
      color: #10b981;
    }

    .session-status .material-icons.locked {
      color: var(--color-gray-400);
    }

    .session-info {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .session-title {
      font-size: 0.875rem;
      color: var(--color-dark);
    }

    .session-meta {
      font-size: 0.75rem;
      color: var(--color-gray-500);
    }

    /* Main Content */
    .session-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow-y: auto;
    }

    .video-container {
      position: relative;
      width: 100%;
      aspect-ratio: 16/9;
      background: black;
    }

    .video-container iframe {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
    }

    .video-placeholder {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: white;
    }

    .video-placeholder .material-icons {
      font-size: 4rem;
      opacity: 0.5;
    }

    .video-placeholder p {
      margin-top: 1rem;
      opacity: 0.7;
    }

    .article-content {
      padding: 2rem;
      max-width: 800px;
      margin: 0 auto;
      line-height: 1.8;
    }

    .quiz-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem 2rem;
      text-align: center;
    }

    .quiz-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 1rem;
    }

    .quiz-header .material-icons {
      font-size: 2rem;
      color: var(--color-primary);
    }

    .quiz-container p {
      color: var(--color-gray-600);
      margin-bottom: 1.5rem;
    }

    /* Session Details */
    .session-details {
      padding: 1.5rem 2rem;
      background: white;
      border-top: 1px solid var(--color-gray-200);
    }

    .session-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .session-header h2 {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--color-dark);
    }

    .session-actions {
      display: flex;
      gap: 0.75rem;
    }

    .btn-outline {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: transparent;
      border: 1px solid var(--color-primary);
      color: var(--color-primary);
    }

    .btn-outline:hover:not(:disabled) {
      background: var(--color-primary);
      color: white;
    }

    .spinner {
      width: 18px;
      height: 18px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* Resources */
    .resources-section h3 {
      font-size: 1rem;
      font-weight: 600;
      color: var(--color-dark);
      margin-bottom: 1rem;
    }

    .resources-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .resource-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      background: var(--color-gray-50);
      border-radius: 8px;
      text-decoration: none;
      color: var(--color-dark);
      transition: background 0.2s ease;
    }

    .resource-item:hover {
      background: var(--color-gray-100);
    }

    .resource-item .material-icons {
      color: var(--color-primary);
    }

    .resource-item span:nth-child(2) {
      flex: 1;
      font-size: 0.875rem;
    }

    .resource-item .download {
      color: var(--color-gray-400);
    }

    /* No Session */
    .no-session {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 4rem 2rem;
    }

    .no-session .material-icons {
      font-size: 4rem;
      color: var(--color-gray-300);
      margin-bottom: 1rem;
    }

    .no-session h2 {
      font-size: 1.25rem;
      color: var(--color-dark);
      margin-bottom: 0.5rem;
    }

    .no-session p {
      color: var(--color-gray-500);
    }

    /* Responsive */
    @media (max-width: 1024px) {
      .menu-btn {
        display: flex;
      }

      .course-sidebar {
        position: fixed;
        top: 0;
        left: -100%;
        width: 100%;
        max-width: 360px;
        height: 100vh;
        z-index: 200;
        transition: left 0.3s ease;
      }

      .course-sidebar.open {
        left: 0;
      }

      .close-btn {
        display: flex;
      }
    }

    @media (max-width: 640px) {
      .course-info h1 {
        font-size: 0.875rem;
      }

      .session-details {
        padding: 1rem;
      }
    }

    /* RTL Support */
    :host-context([dir="rtl"]) {
      .course-sidebar {
        left: auto;
        right: -100%;
        border-right: none;
        border-left: 1px solid var(--color-gray-200);
      }

      .course-sidebar.open {
        left: auto;
        right: 0;
      }

      .session-item.active {
        border-left: none;
        border-right: 3px solid var(--color-primary);
      }
    }
  `]
})
export class LearningPageComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private courseService = inject(CourseService);
  private enrollmentService = inject(EnrollmentService);
  private sanitizer = inject(DomSanitizer);
  private toastr = inject(ToastrService);

  course = signal<CourseContent | null>(null);
  courseId = signal<string>('');
  currentSession = signal<Session | null>(null);
  expandedModules = signal<Set<string>>(new Set());
  sidebarOpen = signal(false);
  marking = signal(false);
  loading = signal(true);
  error = signal<string | null>(null);

  progress = computed<Progress>(() => {
    const c = this.course();
    if (!c) return { courseProgress: 0, completedSessions: 0, totalSessions: 0 };
    
    let completed = 0;
    let total = 0;
    c.modules.forEach(m => {
      m.sessions.forEach(s => {
        total++;
        if (s.isCompleted) completed++;
      });
    });
    
    return {
      courseProgress: total > 0 ? Math.round((completed / total) * 100) : 0,
      completedSessions: completed,
      totalSessions: total
    };
  });

  nextSession = computed<Session | null>(() => {
    const c = this.course();
    const current = this.currentSession();
    if (!c || !current) return null;

    let found = false;
    for (const module of c.modules) {
      for (const session of module.sessions) {
        if (found && session.isUnlocked) return session;
        if (session.id === current.id) found = true;
      }
    }
    return null;
  });

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug');
    if (slug) {
      this.loadCourse(slug);
    }
  }

  loadCourse(slug: string): void {
    this.loading.set(true);
    this.error.set(null);
    
    // First get the course by slug
    this.courseService.getCourseBySlug(slug).subscribe({
      next: (response) => {
        if (response.isSuccess && response.data) {
          const courseData = response.data;
          this.courseId.set(courseData.id);
          
          // Now get the full course content and progress
          forkJoin({
            fullCourse: this.courseService.getCourseWithContent(courseData.id),
            progress: this.enrollmentService.getCourseProgress(courseData.id)
          }).subscribe({
            next: ({ fullCourse, progress }) => {
              if (fullCourse.isSuccess && fullCourse.data) {
                const course = fullCourse.data;
                const progressData = progress.data;
                
                // Map the course data to our interface
                const courseContent: CourseContent = {
                  id: course.id,
                  title: course.nameEn || '',
                  instructorId: course.instructor?.id,
                  instructorName: course.instructor?.fullName,
                  modules: (course.modules || []).map((m: CourseModule, mi: number) => ({
                    id: m.id,
                    title: m.nameEn || '',
                    order: m.sortOrder ?? m.order ?? mi + 1,
                    sessions: (m.sessions || []).map((s: CourseSession, si: number) => {
                      const sessionProgress = progressData?.sessionProgresses?.find(
                        (sp: SessionProgress) => sp.sessionId === s.id
                      );
                      return {
                        id: s.id,
                        title: s.nameEn || '',
                        type: s.type || 'Video',
                        content: s.content || '',
                        videoUrl: s.videoUrl || '',
                        pdfUrl: (s as any).pdfUrl || '',
                        externalLink: (s as any).externalLink || '',
                        durationMinutes: s.durationMinutes ?? (s as any).durationInMinutes ?? 0,
                        order: s.sortOrder ?? s.order ?? si + 1,
                        isUnlocked: sessionProgress?.isUnlocked ?? s.isUnlocked ?? (si === 0 && mi === 0),
                        isCompleted: sessionProgress?.isCompleted ?? s.isCompleted ?? false,
                        watchPercentage: sessionProgress?.watchPercentage ?? 0,
                        hasQuiz: (s as any).hasQuiz ?? false,
                        quizPassed: sessionProgress?.quizPassed ?? false,
                        resources: ((s as any).materials || []).map((mat: any) => ({
                          id: mat.id,
                          title: mat.nameEn || mat.title || 'Resource',
                          type: mat.type || 'PDF',
                          url: mat.fileUrl || mat.url || ''
                        }))
                      };
                    })
                  }))
                };
                
                this.course.set(courseContent);
                
                // Expand first module and select first uncompleted session
                if (courseContent.modules.length > 0) {
                  this.expandedModules.set(new Set([courseContent.modules[0].id]));
                  
                  // Find first unlocked but not completed session
                  for (const module of courseContent.modules) {
                    const uncompleted = module.sessions.find(s => s.isUnlocked && !s.isCompleted);
                    if (uncompleted) {
                      this.currentSession.set(uncompleted);
                      break;
                    }
                  }
                  
                  // If all completed, select first session
                  if (!this.currentSession()) {
                    const firstSession = courseContent.modules[0]?.sessions[0];
                    if (firstSession) {
                      this.currentSession.set(firstSession);
                    }
                  }
                }
                
                this.loading.set(false);
              } else {
                this.error.set('Failed to load course content');
                this.loading.set(false);
              }
            },
            error: (err) => {
              console.error('Error loading course content:', err);
              this.error.set('Failed to load course. Please try again.');
              this.loading.set(false);
            }
          });
        } else {
          this.error.set(response.messageEn || 'Course not found');
          this.loading.set(false);
        }
      },
      error: (err) => {
        console.error('Error loading course:', err);
        this.error.set('Failed to load course. Please try again.');
        this.loading.set(false);
      }
    });
  }

  toggleSidebar(): void {
    this.sidebarOpen.update(v => !v);
  }

  toggleModule(moduleId: string): void {
    this.expandedModules.update(set => {
      const newSet = new Set(set);
      if (newSet.has(moduleId)) {
        newSet.delete(moduleId);
      } else {
        newSet.add(moduleId);
      }
      return newSet;
    });
  }

  selectSession(session: Session): void {
    if (!session.isUnlocked) return;
    this.currentSession.set(session);
    this.sidebarOpen.set(false);
  }

  getModuleProgress(module: Module): number {
    return module.sessions.filter(s => s.isCompleted).length;
  }

  getVideoUrl(): SafeResourceUrl | null {
    const session = this.currentSession();
    if (!session?.videoUrl) return null;
    return this.sanitizer.bypassSecurityTrustResourceUrl(session.videoUrl);
  }

  getPdfUrl(): SafeResourceUrl | null {
    const session = this.currentSession();
    if (!session?.pdfUrl) return null;
    return this.sanitizer.bypassSecurityTrustResourceUrl(session.pdfUrl);
  }

  markComplete(): void {
    const session = this.currentSession();
    if (!session) return;

    this.marking.set(true);
    
    // Call the API to update watch progress to 100% (marks as complete)
    this.enrollmentService.updateWatchProgress(session.id, 100).subscribe({
      next: (response) => {
        // Update session as completed locally
        this.course.update(c => {
          if (!c) return c;
          return {
            ...c,
            modules: c.modules.map(m => ({
              ...m,
              sessions: m.sessions.map(s => {
                if (s.id === session.id) {
                  return { ...s, isCompleted: true, watchPercentage: 100 };
                }
                return s;
              })
            }))
          };
        });

        // Unlock next session
        const next = this.nextSession();
        if (next) {
          this.course.update(c => {
            if (!c) return c;
            return {
              ...c,
              modules: c.modules.map(m => ({
                ...m,
                sessions: m.sessions.map(s => {
                  if (s.id === next.id) {
                    return { ...s, isUnlocked: true };
                  }
                  return s;
                })
              }))
            };
          });
        }

        this.currentSession.set({ ...session, isCompleted: true, watchPercentage: 100 });
        this.marking.set(false);
        this.toastr.success('Session completed!');
      },
      error: (err) => {
        console.error('Error marking session complete:', err);
        this.marking.set(false);
        this.toastr.error('Failed to mark session as complete');
      }
    });
  }

  goToNext(): void {
    const next = this.nextSession();
    if (next) {
      this.selectSession(next);
    }
  }
}
