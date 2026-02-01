import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { ProgressService } from '../../../core/services/progress.service';
import { CourseService } from '../../../core/services/course.service';
import { CertificateService } from '../../../core/services/certificate.service';
import { ToastrService } from 'ngx-toastr';
import { MediaService } from '../../../core/services/media.service';

interface Module {
  id: string;
  title: string;
  order: number;
  sessions: Session[];
  isExpanded: boolean;
}

interface Session {
  id: string;
  title: string;
  type: 'Video' | 'Live' | 'Recorded' | 'Article' | 'Quiz' | 'Assignment' | 'PDF';
  duration: number;
  isCompleted: boolean;
  isUnlocked: boolean;
  videoUrl?: string;
  pdfUrl?: string;
  content?: string;
  quizQuestions?: any[];  // Add quiz questions property
}

interface CourseProgress {
  courseId: string;
  courseTitle: string;
  progress: number;
  modules: Module[];
  currentSessionId: string;
}

@Component({
  selector: 'app-learning',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="learning-page" [class.sidebar-collapsed]="sidebarCollapsed()">
      <!-- Header -->
      <header class="learning-header">
        <div class="header-left">
          <button class="back-btn" (click)="goBack()">
            <span class="icon">←</span>
          </button>
          <h1 class="course-title">{{ courseData()?.courseTitle }}</h1>
        </div>
        <div class="header-center">
          <div class="progress-indicator">
            <div class="progress-bar">
              <div class="progress-fill" [style.width.%]="courseData()?.progress || 0"></div>
            </div>
            <span class="progress-text">{{ courseData()?.progress || 0 }}% Complete</span>
          </div>
        </div>
        <div class="header-right">
          <button class="toggle-sidebar-btn" (click)="sidebarCollapsed.set(!sidebarCollapsed())">
            <span>{{ sidebarCollapsed() ? '☰' : '✕' }}</span>
          </button>
        </div>
      </header>

      <div class="learning-content">
        <!-- Main Content Area -->
        <main class="content-area">
          @if (currentSession()) {
            <div class="session-container">
              @if (isVideoType()) {
                <div class="video-container">
                  <div class="video-wrapper">
                    @if (isExternalVideo()) {
                      <iframe 
                        [src]="getSafeVideoUrl()"
                        frameborder="0"
                        allowfullscreen
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      ></iframe>
                    } @else if (currentSession()?.videoUrl) {
                      <video controls [src]="getUploadedVideoUrl()" style="width: 100%; height: 100%;">
                        Your browser does not support the video tag.
                      </video>
                    } @else {
                      <div class="no-video-placeholder">
                        <span class="icon">🎬</span>
                        <p>No video available for this session</p>
                      </div>
                    }
                  </div>
                </div>
              } @else if (currentSession()?.type === 'PDF') {
                <div class="pdf-container">
                  <div class="pdf-wrapper">
                    @if (currentSession()?.pdfUrl) {
                      <iframe 
                        [src]="getSafePdfUrl()"
                        type="application/pdf"
                        style="width: 100%; height: 100%; border: none;"
                      ></iframe>
                    } @else {
                      <div class="no-pdf-placeholder">
                        <span class="icon">📄</span>
                        <p>No PDF available for this session</p>
                      </div>
                    }
                  </div>
                  @if (currentSession()?.pdfUrl) {
                    <div class="pdf-actions">
                      <a [href]="getPdfDownloadUrl()" target="_blank" class="download-pdf-btn">
                        <span class="icon">⬇️</span>
                        Download PDF
                      </a>
                    </div>
                  }
                </div>
              } @else if (currentSession()?.type === 'Article') {
                <div class="article-container">
                  <div class="article-content" [innerHTML]="currentSession()?.content"></div>
                </div>
              } @else if (currentSession()?.type === 'Quiz') {
                <div class="quiz-container">
                  <div class="quiz-intro">
                    <div class="quiz-icon">📝</div>
                    <h2>{{ currentSession()?.title }}</h2>
                    <p>Test your knowledge with this quiz</p>
                    <button class="start-quiz-btn" (click)="startQuiz()">
                      Start Quiz
                    </button>
                  </div>
                </div>
              } @else if (currentSession()?.type === 'Assignment') {
                <div class="assignment-container">
                  <div class="assignment-intro">
                    <div class="assignment-icon">📋</div>
                    <h2>{{ currentSession()?.title }}</h2>
                    <div class="assignment-content" [innerHTML]="currentSession()?.content"></div>
                  </div>
                </div>
              }

              <!-- Session Details -->
              <div class="session-details">
                <div class="session-header">
                  <h2>{{ currentSession()?.title }}</h2>
                  <span class="session-type" [class]="currentSession()?.type">
                    {{ currentSession()?.type }}
                  </span>
                </div>

                <div class="session-actions">
                  <button class="mark-complete-btn" (click)="markComplete()" [disabled]="currentSession()?.isCompleted">
                    <span class="icon">✓</span>
                    {{ currentSession()?.isCompleted ? 'Completed' : 'Mark as Complete' }}
                  </button>

                  @if (hasNextSession()) {
                    <button class="next-btn" (click)="goToNextSession()">
                      Next Session
                      <span class="icon">→</span>
                    </button>
                  }
                </div>

                <!-- Resources -->
                @if (isVideoType() || currentSession()?.type === 'Article') {
                  <div class="resources-section">
                    <h3>Resources</h3>
                    <div class="resources-list">
                      <a href="#" class="resource-item">
                        <span class="resource-icon">📄</span>
                        <span>Download Notes</span>
                      </a>
                      <a href="#" class="resource-item">
                        <span class="resource-icon">💻</span>
                        <span>Source Code</span>
                      </a>
                    </div>
                  </div>
                }
              </div>
            </div>
          } @else {
            <div class="no-session">
              <div class="empty-icon">📚</div>
              <h2>Select a Session</h2>
              <p>Choose a session from the sidebar to start learning</p>
            </div>
          }

          <!-- Course Completion Section -->
          @if (isCourseComplete()) {
            <div class="course-completion-section">
              <div class="completion-banner">
                <div class="completion-icon">🎉</div>
                <h2>Congratulations!</h2>
                <p>You have completed all sessions in this course</p>
                
                @if (!hasSubmittedRating()) {
                  <div class="rating-form">
                    <h3>Rate this course</h3>
                    <div class="star-rating">
                      @for (star of [1, 2, 3, 4, 5]; track star) {
                        <span 
                          class="star" 
                          [class.filled]="star <= selectedRating()"
                          (click)="setRating(star)"
                        >★</span>
                      }
                    </div>
                    <textarea 
                      [(ngModel)]="reviewComment"
                      placeholder="Share your experience with this course (optional)..."
                      rows="4"
                      class="review-textarea"
                    ></textarea>
                    <button 
                      class="submit-rating-btn" 
                      (click)="submitRating()"
                      [disabled]="selectedRating() === 0 || submittingRating()"
                    >
                      {{ submittingRating() ? 'Submitting...' : 'Submit Rating' }}
                    </button>
                  </div>
                } @else {
                  <div class="rating-submitted">
                    <span class="check-icon">✓</span>
                    <p>Thank you for your feedback!</p>
                  </div>
                }

                <div class="completion-actions">
                  @if (hasCertificate()) {
                    <button class="certificate-btn" (click)="viewCertificate()">
                      <span class="icon">🏆</span>
                      View Certificate
                    </button>
                    <button class="download-cert-btn" (click)="downloadCertificate()">
                      <span class="icon">📥</span>
                      Download Certificate
                    </button>
                  }
                  <button class="message-instructor-btn" (click)="messageInstructor()">
                    <span class="icon">💬</span>
                    Message Instructor
                  </button>
                </div>
              </div>
            </div>
          }
        </main>

        <!-- Sidebar -->
        <aside class="sidebar">
          <div class="sidebar-header">
            <h3>Course Content</h3>
          </div>

          <div class="modules-list">
            @for (module of courseData()?.modules; track module.id) {
              <div class="module-item" [class.expanded]="module.isExpanded">
                <div class="module-header" (click)="toggleModule(module)">
                  <div class="module-info">
                    <span class="module-number">{{ module.order }}</span>
                    <span class="module-title">{{ module.title }}</span>
                  </div>
                  <div class="module-meta">
                    <span class="session-count">{{ getCompletedCount(module) }}/{{ module.sessions.length }}</span>
                    <span class="expand-icon">{{ module.isExpanded ? '▼' : '▶' }}</span>
                  </div>
                </div>

                @if (module.isExpanded) {
                  <div class="sessions-list">
                    @for (session of module.sessions; track session.id) {
                      <div 
                        class="session-item" 
                        [class.active]="currentSession()?.id === session.id"
                        [class.completed]="session.isCompleted"
                        [class.locked]="!session.isUnlocked"
                        (click)="selectSession(session)"
                      >
                        <div class="session-icon">
                          @if (session.isCompleted) {
                            <span class="check">✓</span>
                          } @else if (!session.isUnlocked) {
                            <span class="lock">🔒</span>
                          } @else if (session.type === 'Video') {
                            <span>▶</span>
                          } @else if (session.type === 'Article') {
                            <span>📄</span>
                          } @else {
                            <span>📝</span>
                          }
                        </div>
                        <div class="session-info">
                          <span class="session-title">{{ session.title }}</span>
                          <span class="session-duration">{{ formatDuration(session.duration) }}</span>
                        </div>
                      </div>
                    }
                  </div>
                }
              </div>
            }
          </div>
        </aside>
      </div>
    </div>
  `,
  styles: [`
    .learning-page {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      background: #f8f9fa;
    }

    .learning-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.75rem 1.5rem;
      background: #000;
      color: #fff;
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .back-btn {
      background: rgba(255, 255, 255, 0.1);
      border: none;
      color: #fff;
      width: 36px;
      height: 36px;
      border-radius: 8px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
      transition: background 0.3s ease;
    }

    .back-btn:hover {
      background: rgba(255, 255, 255, 0.2);
    }

    .course-title {
      font-size: 1rem;
      font-weight: 600;
      max-width: 300px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .header-center {
      flex: 1;
      max-width: 400px;
      margin: 0 2rem;
    }

    .progress-indicator {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .progress-bar {
      flex: 1;
      height: 6px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 3px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: #247090;
      border-radius: 3px;
      transition: width 0.3s ease;
    }

    .progress-text {
      font-size: 0.85rem;
      color: rgba(255, 255, 255, 0.8);
      white-space: nowrap;
    }

    .toggle-sidebar-btn {
      background: rgba(255, 255, 255, 0.1);
      border: none;
      color: #fff;
      width: 36px;
      height: 36px;
      border-radius: 8px;
      cursor: pointer;
      display: none;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
    }

    .learning-content {
      display: flex;
      flex: 1;
    }

    .content-area {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .sidebar {
      width: 350px;
      background: #fff;
      border-left: 1px solid #e0e0e0;
      overflow-y: auto;
      max-height: calc(100vh - 60px);
      position: sticky;
      top: 60px;
    }

    .sidebar-collapsed .sidebar {
      display: none;
    }

    .sidebar-header {
      padding: 1rem 1.25rem;
      border-bottom: 1px solid #e0e0e0;
    }

    .sidebar-header h3 {
      font-size: 1rem;
      font-weight: 700;
      color: #000;
    }

    .module-item {
      border-bottom: 1px solid #e0e0e0;
    }

    .module-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.25rem;
      cursor: pointer;
      transition: background 0.3s ease;
    }

    .module-header:hover {
      background: #f8f9fa;
    }

    .module-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .module-number {
      width: 28px;
      height: 28px;
      background: #f0f0f0;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.85rem;
      font-weight: 600;
      color: #666;
    }

    .module-title {
      font-weight: 600;
      font-size: 0.95rem;
      color: #000;
    }

    .module-meta {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .session-count {
      font-size: 0.85rem;
      color: #666;
    }

    .expand-icon {
      font-size: 0.75rem;
      color: #666;
    }

    .sessions-list {
      background: #f8f9fa;
    }

    .session-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.875rem 1.25rem 0.875rem 3rem;
      cursor: pointer;
      transition: all 0.3s ease;
      border-left: 3px solid transparent;
    }

    .session-item:hover:not(.locked) {
      background: #f0f0f0;
    }

    .session-item.active {
      background: #e8f4f8;
      border-left-color: #247090;
    }

    .session-item.completed .session-icon .check {
      color: #28a745;
    }

    .session-item.locked {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .session-icon {
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.85rem;
    }

    .session-info {
      flex: 1;
    }

    .session-title {
      display: block;
      font-size: 0.9rem;
      color: #333;
      margin-bottom: 0.125rem;
    }

    .session-duration {
      font-size: 0.8rem;
      color: #999;
    }

    .video-container {
      background: #000;
    }

    .video-wrapper {
      position: relative;
      padding-bottom: 56.25%;
      height: 0;
      overflow: hidden;
    }

    .video-wrapper iframe {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
    }

    .article-container {
      padding: 2rem;
      max-width: 800px;
      margin: 0 auto;
    }

    .article-content {
      line-height: 1.8;
      color: #333;
    }

    .quiz-container {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
    }

    .quiz-intro {
      text-align: center;
      max-width: 400px;
    }

    .quiz-icon {
      font-size: 4rem;
      margin-bottom: 1rem;
    }

    .quiz-intro h2 {
      font-size: 1.5rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
    }

    .quiz-intro p {
      color: #666;
      margin-bottom: 1.5rem;
    }

    .start-quiz-btn {
      padding: 0.875rem 2rem;
      background: linear-gradient(135deg, #247090 0%, #1a5570 100%);
      color: #fff;
      border: none;
      border-radius: 10px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .start-quiz-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(36, 112, 144, 0.3);
    }

    /* PDF Container Styles */
    .pdf-container {
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    .pdf-wrapper {
      flex: 1;
      min-height: 600px;
      background: #f5f5f5;
    }

    .pdf-actions {
      padding: 1rem;
      background: #fff;
      border-top: 1px solid #eee;
      display: flex;
      justify-content: center;
    }

    .download-pdf-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      background: linear-gradient(135deg, #247090 0%, #1a5570 100%);
      color: #fff;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      text-decoration: none;
      transition: all 0.3s ease;
    }

    .download-pdf-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 15px rgba(36, 112, 144, 0.3);
    }

    .no-pdf-placeholder,
    .no-video-placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      min-height: 400px;
      color: #666;
    }

    .no-pdf-placeholder .icon,
    .no-video-placeholder .icon {
      font-size: 4rem;
      margin-bottom: 1rem;
    }

    /* Assignment Container Styles */
    .assignment-container {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
    }

    .assignment-intro {
      text-align: center;
      max-width: 600px;
    }

    .assignment-icon {
      font-size: 4rem;
      margin-bottom: 1rem;
    }

    .assignment-intro h2 {
      font-size: 1.5rem;
      font-weight: 700;
      margin-bottom: 1rem;
    }

    .assignment-content {
      text-align: left;
      line-height: 1.8;
      color: #333;
      background: #f9f9f9;
      padding: 1.5rem;
      border-radius: 10px;
      margin-top: 1rem;
    }

    .session-details {
      padding: 1.5rem 2rem;
      background: #fff;
      border-top: 1px solid #e0e0e0;
    }

    .session-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .session-header h2 {
      font-size: 1.25rem;
      font-weight: 700;
    }

    .session-type {
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .session-type.Video {
      background: #e3f2fd;
      color: #1565c0;
    }

    .session-type.Article {
      background: #f3e5f5;
      color: #7b1fa2;
    }

    .session-type.Quiz {
      background: #fff3e0;
      color: #e65100;
    }

    .session-actions {
      display: flex;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .mark-complete-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      background: #28a745;
      color: #fff;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .mark-complete-btn:hover {
      background: #218838;
    }

    .completed-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      background: #d4edda;
      color: #155724;
      border-radius: 8px;
      font-weight: 600;
    }

    .next-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      background: #000;
      color: #fff;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .next-btn:hover {
      background: #247090;
    }

    .resources-section h3 {
      font-size: 1rem;
      font-weight: 600;
      margin-bottom: 0.75rem;
    }

    .resources-list {
      display: flex;
      gap: 1rem;
    }

    .resource-item {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      background: #f8f9fa;
      border-radius: 8px;
      color: #333;
      text-decoration: none;
      font-size: 0.9rem;
      transition: all 0.3s ease;
    }

    .resource-item:hover {
      background: #e0e0e0;
    }

    .no-session {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 2rem;
    }

    .empty-icon {
      font-size: 4rem;
      margin-bottom: 1rem;
    }

    .no-session h2 {
      font-size: 1.5rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
    }

    .no-session p {
      color: #666;
    }

    @media (max-width: 992px) {
      .toggle-sidebar-btn {
        display: flex;
      }

      .sidebar {
        position: fixed;
        top: 60px;
        right: 0;
        bottom: 0;
        width: 320px;
        z-index: 90;
        transform: translateX(100%);
        transition: transform 0.3s ease;
      }

      .learning-page:not(.sidebar-collapsed) .sidebar {
        transform: translateX(0);
      }

      .header-center {
        display: none;
      }
    }

    @media (max-width: 576px) {
      .sidebar {
        width: 100%;
      }

      .course-title {
        max-width: 150px;
      }
    }

    :host-context([dir="rtl"]) {
      .sidebar {
        border-left: none;
        border-right: 1px solid #e0e0e0;
      }

      .session-item {
        padding: 0.875rem 3rem 0.875rem 1.25rem;
        border-left: none;
        border-right: 3px solid transparent;
      }

      .session-item.active {
        border-right-color: #247090;
      }

      .back-btn .icon {
        transform: rotate(180deg);
      }

      .next-btn .icon {
        transform: rotate(180deg);
      }

      @media (max-width: 992px) {
        .sidebar {
          right: auto;
          left: 0;
          transform: translateX(-100%);
        }

        .learning-page:not(.sidebar-collapsed) .sidebar {
          transform: translateX(0);
        }
      }
    }

    /* Course Completion Section */
    .course-completion-section {
      padding: 2rem;
      background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
      border-top: 1px solid #e0e0e0;
    }

    .completion-banner {
      max-width: 600px;
      margin: 0 auto;
      text-align: center;
      background: #fff;
      padding: 2rem;
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    }

    .completion-icon {
      font-size: 4rem;
      margin-bottom: 1rem;
    }

    .completion-banner h2 {
      font-size: 1.75rem;
      font-weight: 700;
      color: #000;
      margin-bottom: 0.5rem;
    }

    .completion-banner > p {
      color: #666;
      margin-bottom: 1.5rem;
    }

    .rating-form {
      margin: 1.5rem 0;
      padding: 1.5rem;
      background: #f8f9fa;
      border-radius: 12px;
    }

    .rating-form h3 {
      font-size: 1.1rem;
      font-weight: 600;
      margin-bottom: 1rem;
    }

    .star-rating {
      display: flex;
      justify-content: center;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }

    .star {
      font-size: 2rem;
      color: #ddd;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .star:hover,
    .star.filled {
      color: #ffc107;
      transform: scale(1.1);
    }

    .review-textarea {
      width: 100%;
      padding: 1rem;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      font-size: 0.95rem;
      resize: vertical;
      margin-bottom: 1rem;
    }

    .review-textarea:focus {
      outline: none;
      border-color: #247090;
    }

    .submit-rating-btn {
      padding: 0.875rem 2rem;
      background: linear-gradient(135deg, #247090 0%, #1a5570 100%);
      color: #fff;
      border: none;
      border-radius: 10px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .submit-rating-btn:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(36, 112, 144, 0.3);
    }

    .submit-rating-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .rating-submitted {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 1rem;
      background: #d4edda;
      border-radius: 8px;
      color: #155724;
      margin: 1rem 0;
    }

    .rating-submitted .check-icon {
      font-size: 1.25rem;
    }

    .completion-actions {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 1rem;
      margin-top: 1.5rem;
    }

    .certificate-btn,
    .download-cert-btn,
    .message-instructor-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.875rem 1.5rem;
      border: none;
      border-radius: 10px;
      font-size: 0.95rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .certificate-btn {
      background: linear-gradient(135deg, #ffc107 0%, #ff9800 100%);
      color: #000;
    }

    .certificate-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(255, 193, 7, 0.3);
    }

    .download-cert-btn {
      background: #28a745;
      color: #fff;
    }

    .download-cert-btn:hover {
      background: #218838;
      transform: translateY(-2px);
    }

    .message-instructor-btn {
      background: #000;
      color: #fff;
    }

    .message-instructor-btn:hover {
      background: #247090;
      transform: translateY(-2px);
    }
  `]
})
export class LearningComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private progressService = inject(ProgressService);
  private courseService = inject(CourseService);
  private certificateService = inject(CertificateService);
  private toastr = inject(ToastrService);
  private sanitizer = inject(DomSanitizer);
  private mediaService = inject(MediaService);

  courseData = signal<CourseProgress | null>(null);
  currentSession = signal<Session | null>(null);
  sidebarCollapsed = signal(false);
  loading = signal(true);
  
  // Rating & Completion
  selectedRating = signal(0);
  submittingRating = signal(false);
  hasSubmittedRating = signal(false);
  hasCertificate = signal(false);
  certificateId = signal<string | null>(null);
  reviewComment = '';
  instructorId = signal<string | null>(null);

  ngOnInit() {
    const courseId = this.route.snapshot.paramMap.get('courseId');
    if (courseId) {
      this.loadCourseData(courseId);
    }
  }

  loadCourseData(courseId: string) {
    this.loading.set(true);
    
    this.courseService.getCourseWithContent(courseId).subscribe({
      next: (response) => {
        if (response.isSuccess && response.data) {
          const course = response.data;
          
          // Map API response to local format - use string IDs (GUIDs from backend)
          const modules: Module[] = (course.modules || []).map((m, mIndex) => ({
            id: m.id,
            title: m.nameEn || m.nameAr,
            order: m.sortOrder ?? mIndex,
            isExpanded: mIndex === 0,
            sessions: (m.sessions || []).map((s, sIndex) => ({
              id: s.id,
              title: s.nameEn || s.nameAr,
              type: this.mapSessionType(s.type, s),
              duration: (s as any).durationInMinutes || (s as any).durationMinutes || 0,
              isCompleted: (s as any).isCompleted || false,
              isUnlocked: (s as any).isUnlocked ?? (mIndex === 0 || s.isFree),
              videoUrl: s.videoUrl,
              pdfUrl: (s as any).pdfUrl,
              content: (s as any).content || (s as any).descriptionEn || '',
              quizQuestions: (s as any).quizQuestions || []  // Include quiz questions
            }))
          }));

          // Calculate progress
          const totalSessions = modules.reduce((acc, m) => acc + m.sessions.length, 0);
          const completedSessions = modules.reduce((acc, m) => acc + m.sessions.filter(s => s.isCompleted).length, 0);
          const progress = totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0;

          // Find first incomplete unlocked session or first session
          let currentSessionId: string = '';
          for (const module of modules) {
            const incomplete = module.sessions.find(s => s.isUnlocked && !s.isCompleted);
            if (incomplete) {
              currentSessionId = incomplete.id;
              break;
            }
          }
          // If all complete or none found, use first session
          if (!currentSessionId && modules.length > 0 && modules[0].sessions.length > 0) {
            currentSessionId = modules[0].sessions[0].id;
          }

          const data: CourseProgress = {
            courseId: courseId,
            courseTitle: course.nameEn || course.nameAr || 'Course',
            progress,
            currentSessionId,
            modules
          };

          this.courseData.set(data);
          
          // Store instructor ID for messaging
          if (course.instructor?.id) {
            this.instructorId.set(course.instructor.id);
          }
          
          // Check if user has already rated this course
          this.checkExistingRating(courseId);
          
          // Check for certificate
          this.checkForCertificate(courseId);
          
          // Set current session
          for (const module of data.modules) {
            const session = module.sessions.find(s => s.id === currentSessionId);
            if (session) {
              this.currentSession.set(session);
              break;
            }
          }
        } else {
          this.toastr.error('Failed to load course content');
        }
        this.loading.set(false);
      },
      error: () => {
        this.toastr.error('Failed to load course');
        this.loading.set(false);
      }
    });
  }

  mapSessionType(type: any, session?: any): 'Video' | 'Live' | 'Recorded' | 'Article' | 'Quiz' | 'Assignment' | 'PDF' {
    // First check if this is a PDF session based on pdfUrl presence
    if (session?.pdfUrl) return 'PDF';
    // Check for quiz based on quizQuestions
    if (session?.quizQuestions && session?.quizQuestions.length > 0) return 'Quiz';
    // Check for article based on content without video
    if (session?.content && !session?.videoUrl && type !== 5) return 'Article';
    
    // Backend SessionType enum: Video=0, Live=1, Recorded=2, Article=3, Quiz=4, Assignment=5
    if (typeof type === 'number') {
      switch (type) {
        case 0: return 'Video';
        case 1: return 'Live';
        case 2: return 'Recorded';
        case 3: return 'Article';
        case 4: return 'Quiz';
        case 5: return 'Assignment';
        default: return 'Video';
      }
    }
    if (typeof type === 'string') {
      const t = type.toLowerCase();
      if (t === 'video') return 'Video';
      if (t === 'live') return 'Live';
      if (t === 'recorded') return 'Recorded';
      if (t === 'article') return 'Article';
      if (t === 'quiz') return 'Quiz';
      if (t === 'assignment') return 'Assignment';
      if (t === 'pdf') return 'PDF';
    }
    return 'Video';
  }

  toggleModule(module: Module) {
    module.isExpanded = !module.isExpanded;
  }

  selectSession(session: Session) {
    if (!session.isUnlocked) return;
    this.currentSession.set(session);
    
    const data = this.courseData();
    if (data) {
      data.currentSessionId = session.id;
      this.courseData.set({ ...data });
    }
  }

  getCompletedCount(module: Module): number {
    return module.sessions.filter(s => s.isCompleted).length;
  }

  formatDuration(minutes: number): string {
    if (minutes < 60) return `${minutes} min`;
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hrs}h ${mins}m`;
  }

  isExternalVideo(): boolean {
    const url = this.currentSession()?.videoUrl || '';
    return url.includes('youtube.com') || url.includes('youtu.be') || url.includes('vimeo.com');
  }

  getUploadedVideoUrl(): string {
    const url = this.currentSession()?.videoUrl || '';
    return this.mediaService.getVideoUrl(url);
  }

  getSafeVideoUrl(): SafeResourceUrl {
    const url = this.currentSession()?.videoUrl || '';
    // Convert YouTube watch URLs to embed URLs
    let embedUrl = url;
    if (url.includes('youtube.com/watch')) {
      const videoId = url.split('v=')[1]?.split('&')[0];
      embedUrl = `https://www.youtube.com/embed/${videoId}`;
    } else if (url.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1]?.split('?')[0];
      embedUrl = `https://www.youtube.com/embed/${videoId}`;
    } else if (url.includes('vimeo.com/')) {
      const videoId = url.split('vimeo.com/')[1]?.split('?')[0];
      embedUrl = `https://player.vimeo.com/video/${videoId}`;
    }
    return this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
  }

  // Check if session type is video-related (Video, Live, Recorded)
  isVideoType(): boolean {
    const type = this.currentSession()?.type;
    return type === 'Video' || type === 'Live' || type === 'Recorded';
  }

  // Get safe PDF URL for iframe display
  getSafePdfUrl(): SafeResourceUrl {
    const url = this.currentSession()?.pdfUrl || '';
    const fullUrl = this.mediaService.getMediaUrl(url);
    return this.sanitizer.bypassSecurityTrustResourceUrl(fullUrl);
  }

  // Get PDF download URL
  getPdfDownloadUrl(): string {
    const url = this.currentSession()?.pdfUrl || '';
    return this.mediaService.getMediaUrl(url);
  }

  markComplete() {
    const session = this.currentSession();
    const data = this.courseData();
    
    if (!session || !data) return;
    
    // If already completed, just show message
    if (session.isCompleted) {
      this.toastr.info('This session is already marked as complete');
      return;
    }

    // Call API to mark session complete
    this.progressService.completeSession(session.id.toString()).subscribe({
      next: (response) => {
        if (response.isSuccess) {
          // Mark current session complete locally
          session.isCompleted = true;
          this.currentSession.set({ ...session });

          // Unlock next session
          let foundCurrent = false;
          for (const module of data.modules) {
            for (const s of module.sessions) {
              if (foundCurrent && !s.isUnlocked) {
                s.isUnlocked = true;
                break;
              }
              if (s.id === session.id) {
                foundCurrent = true;
              }
            }
          }

          // Update progress
          const totalSessions = data.modules.reduce((acc, m) => acc + m.sessions.length, 0);
          const completedSessions = data.modules.reduce((acc, m) => acc + m.sessions.filter(s => s.isCompleted).length, 0);
          data.progress = Math.round((completedSessions / totalSessions) * 100);

          this.courseData.set({ ...data });
          this.toastr.success('Session marked as complete');
        } else {
          this.toastr.error('Failed to mark session as complete');
        }
      },
      error: () => {
        this.toastr.error('Failed to update progress');
      }
    });
  }

  hasNextSession(): boolean {
    const session = this.currentSession();
    const data = this.courseData();
    if (!session || !data) return false;

    let foundCurrent = false;
    for (const module of data.modules) {
      for (const s of module.sessions) {
        if (foundCurrent && s.isUnlocked) return true;
        if (s.id === session.id) foundCurrent = true;
      }
    }
    return false;
  }

  goToNextSession() {
    const session = this.currentSession();
    const data = this.courseData();
    if (!session || !data) return;

    let foundCurrent = false;
    for (const module of data.modules) {
      for (const s of module.sessions) {
        if (foundCurrent && s.isUnlocked) {
          this.selectSession(s);
          module.isExpanded = true;
          return;
        }
        if (s.id === session.id) foundCurrent = true;
      }
    }
  }

  startQuiz() {
    const session = this.currentSession();
    const data = this.courseData();
    if (session) {
      console.log('Starting quiz for session:', session.id, 'courseId:', data?.courseId);
      this.router.navigate(['/student/quiz', session.id], { 
        queryParams: { courseId: data?.courseId } 
      });
    } else {
      this.toastr.error('Could not start quiz - session not found');
    }
  }

  goBack() {
    this.router.navigate(['/student/my-courses']);
  }

  // Course completion methods
  isCourseComplete(): boolean {
    const data = this.courseData();
    return data?.progress === 100;
  }

  setRating(rating: number) {
    this.selectedRating.set(rating);
  }

  submitRating() {
    const data = this.courseData();
    if (!data || this.selectedRating() === 0) return;

    this.submittingRating.set(true);

    this.courseService.submitCourseRating(data.courseId, {
      rating: this.selectedRating(),
      comment: this.reviewComment || undefined
    }).subscribe({
      next: (response) => {
        if (response.isSuccess) {
          this.hasSubmittedRating.set(true);
          this.toastr.success('Thank you for your feedback!');
          // Check for certificate
          this.checkForCertificate(data.courseId);
        } else {
          this.toastr.error(response.messageEn || 'Failed to submit rating');
        }
        this.submittingRating.set(false);
      },
      error: () => {
        this.toastr.error('Failed to submit rating');
        this.submittingRating.set(false);
      }
    });
  }

  checkExistingRating(courseId: string) {
    this.courseService.getMyRating(courseId).subscribe({
      next: (response) => {
        if (response.isSuccess && response.data) {
          this.hasSubmittedRating.set(true);
          this.selectedRating.set(response.data.rating);
          this.reviewComment = response.data.comment || '';
        }
      }
    });
  }

  checkForCertificate(courseId: string) {
    this.certificateService.getMyCertificates().subscribe({
      next: (certificates) => {
        const cert = certificates.find((c: any) => c.courseId === courseId);
        if (cert) {
          this.hasCertificate.set(true);
          this.certificateId.set(cert.id);
        }
      }
    });
  }

  viewCertificate() {
    const certId = this.certificateId();
    if (certId) {
      this.router.navigate(['/student/certificates', certId]);
    }
  }

  downloadCertificate() {
    const certId = this.certificateId();
    if (certId) {
      this.certificateService.downloadCertificate(certId).subscribe({
        next: (blob) => {
          if (blob) {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `certificate-${certId}.pdf`;
            a.click();
            window.URL.revokeObjectURL(url);
          } else {
            this.toastr.error('Failed to download certificate');
          }
        },
        error: () => {
          this.toastr.error('Failed to download certificate');
        }
      });
    }
  }

  messageInstructor() {
    const instructorId = this.instructorId();
    if (instructorId) {
      this.router.navigate(['/student/chat'], { queryParams: { userId: instructorId } });
    } else {
      this.router.navigate(['/student/chat']);
    }
  }
}
