import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { CourseService } from '@core/services/course.service';
import { EnrollmentService } from '@core/services/enrollment.service';
import { AuthService } from '@core/services/auth.service';
import { MediaService } from '@core/services/media.service';
import { AdminSettingsService } from '@core/services/admin-settings.service';
import { FileUploadService } from '@core/services/file-upload.service';
import { ToastrService } from 'ngx-toastr';
import { environment } from '@environments/environment';

interface CourseDetail {
  id: number;
  title: string;
  slug: string;
  description: string;
  shortDescription: string;
  thumbnailUrl: string;
  previewVideoUrl: string;
  price: number;
  discountPrice: number;
  level: string;
  language: string;
  categoryId: number;
  categoryName: string;
  instructorId: number;
  instructorName: string;
  instructorBio: string;
  instructorAvatarUrl: string;
  totalDurationMinutes: number;
  enrollmentCount: number;
  averageRating: number;
  reviewCount: number;
  requirements: string[];
  whatYouWillLearn: string[];
  modules: Module[];
}

interface Module {
  id: number;
  title: string;
  order: number;
  sessions: Session[];
}

interface Session {
  id: number;
  title: string;
  type: string;
  durationMinutes: number;
  order: number;
  isFree: boolean;
  videoUrl?: string;
}

@Component({
  selector: 'app-course-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="course-detail-page">
      @if (isLoading()) {
        <div class="loading-container">
          <div class="spinner-lg"></div>
        </div>
      } @else if (course()) {
        <!-- Course Header -->
        <section class="course-header">
          <div class="container">
            <div class="header-content">
              <div class="header-text">
                <div class="breadcrumb">
                  <a routerLink="/courses">Courses</a>
                  <span class="material-icons">chevron_right</span>
                  <a [routerLink]="['/courses']" [queryParams]="{category: course()!.categoryName}">{{ course()!.categoryName }}</a>
                </div>
                <h1>{{ course()!.title }}</h1>
                <p class="course-description">{{ course()!.shortDescription }}</p>
                
                <div class="course-meta">
 
                  <div class="meta-item">
                    <span class="material-icons">people</span>
                    {{ course()!.enrollmentCount }} students
                  </div>
                  <div class="meta-item">
                    <span class="material-icons">access_time</span>
                    {{ course()!.totalDurationMinutes / 60 | number:'1.0-0' }} hours
                  </div>
                  <div class="meta-item">
                    <span class="material-icons">signal_cellular_alt</span>
                    {{ course()!.level }}
                  </div>
                </div>

                <div class="instructor-info">
                  <img [src]="mediaService.getAvatarUrl(course()!.instructorAvatarUrl)" [alt]="course()!.instructorName">
                  <span>Created by <strong>{{ course()!.instructorName }}</strong></span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Main Content -->
        <section class="course-content">
          <div class="container">
            <div class="content-layout">
              <!-- Left Column -->
              <div class="main-content">
                <!-- What You'll Learn -->
                <div class="content-card">
                  <h2>What You'll Learn</h2>
                  <div class="learning-grid">
                    @for (item of course()!.whatYouWillLearn; track $index) {
                      <div class="learning-item">
                        <span class="material-icons">check_circle</span>
                        <span>{{ item }}</span>
                      </div>
                    }
                  </div>
                </div>

                <!-- Course Content -->
                <div class="content-card">
                  <h2>Course Content</h2>
                  <div class="content-summary">
                    <span>{{ course()!.modules.length }} modules</span>
                    <span>•</span>
                    <span>{{ getTotalSessions() }} sessions</span>
                    <span>•</span>
                    <span>{{ course()!.totalDurationMinutes / 60 | number:'1.0-0' }} hours total</span>
                  </div>
                  <div class="modules-accordion">
                    @for (module of course()!.modules; track module.id) {
                      <div class="module-item" [class.expanded]="expandedModules().has(module.id)">
                        <button class="module-header" (click)="toggleModule(module.id)">
                          <span class="material-icons expand-icon">expand_more</span>
                          <span class="module-title">{{ module.title }}</span>
                          <span class="module-info">{{ module.sessions.length }} sessions</span>
                        </button>
                        <div class="module-content">
                          @for (session of module.sessions; track session.id) {
                            <div class="session-item" [class.clickable]="session.isFree && session.type === 'Video'" 
                                 (click)="session.isFree && session.type === 'Video' ? playFreeSession(session) : null">
                              <span class="material-icons session-icon">
                                @switch (session.type) {
                                  @case ('Video') { play_circle }
                                  @case ('Article') { article }
                                  @case ('Quiz') { quiz }
                                  @default { play_circle }
                                }
                              </span>
                              <span class="session-title">{{ session.title }}</span>
                              @if (session.isFree) {
                                <button class="free-badge preview-btn-small" (click)="$event.stopPropagation(); playFreeSession(session)">
                                  Preview
                                </button>
                              }
                              <span class="session-duration">{{ session.durationMinutes }} min</span>
                            </div>
                          }
                        </div>
                      </div>
                    }
                  </div>
                </div>

                <!-- Requirements -->
                <div class="content-card">
                  <h2>Requirements</h2>
                  <ul class="requirements-list">
                    @for (req of course()!.requirements; track $index) {
                      <li>{{ req }}</li>
                    }
                  </ul>
                </div>

                <!-- Description -->
                <div class="content-card">
                  <h2>Description</h2>
                  <div class="course-full-description" [innerHTML]="course()!.description"></div>
                </div>

                <!-- Instructor -->
                <div class="content-card">
                  <h2>Instructor</h2>
                  <div class="instructor-card">
                    <img [src]="mediaService.getAvatarUrl(course()!.instructorAvatarUrl)" [alt]="course()!.instructorName">
                    <div class="instructor-details">
                      <h3>{{ course()!.instructorName }}</h3>
                      <p class="instructor-bio">{{ course()!.instructorBio }}</p>
                      @if (isEnrolled()) {
                        <button class="contact-instructor-btn" (click)="contactInstructor()">
                          <span class="material-icons">chat</span>
                          Contact Instructor
                        </button>
                      }
                    </div>
                  </div>
                </div>
              </div>

              <!-- Right Column - Sticky Card -->
              <div class="sidebar">
                <div class="enrollment-card">
                  @if (course()!.previewVideoUrl) {
                    <div class="preview-video">
                      <img [src]="mediaService.getCourseThumbnail(course()!.thumbnailUrl)" [alt]="course()!.title">
                      <button class="play-btn" (click)="playPreview()">
                        <span class="material-icons">play_arrow</span>
                      </button>
                    </div>
                  } @else {
                    <div class="preview-image">
                      <img [src]="mediaService.getCourseThumbnail(course()!.thumbnailUrl)" [alt]="course()!.title">
                    </div>
                  }
                  
                  <div class="card-content">
                    <div class="price-section">
                      @if (course()!.price === 0) {
                        <span class="price free">Free</span>
                      } @else {
                        @if (course()!.discountPrice && course()!.discountPrice < course()!.price) {
                          <span class="price">{{ course()!.discountPrice | currency:'EGP':'symbol':'1.0-0' }}</span>
                          <span class="original-price">{{ course()!.price | currency:'EGP':'symbol':'1.0-0' }}</span>
                        } @else {
                          <span class="price">{{ course()!.price | currency:'EGP':'symbol':'1.0-0' }}</span>
                        }
                      }
                    </div>

                    @if (isEnrolled()) {
                      <a [routerLink]="['/learn', course()!.slug]" class="btn btn-primary btn-lg btn-block">
                        Continue Learning
                      </a>
                    } @else if (enrollmentPending()) {
                      <button class="btn btn-secondary btn-lg btn-block" disabled>
                        Enrollment Pending
                      </button>
                    } @else {
                      @if (course()!.price === 0) {
                        <button class="btn btn-primary btn-lg btn-block" (click)="enrollFree()" [disabled]="enrolling()">
                          @if (enrolling()) {
                            <span class="spinner"></span>
                          } @else {
                            Enroll Now - Free
                          }
                        </button>
                      } @else {
                        <button class="btn btn-primary btn-lg btn-block" (click)="startEnrollment()" [disabled]="enrolling()">
                          @if (enrolling()) {
                            <span class="spinner"></span>
                          } @else {
                            Enroll Now - {{ course()!.price | currency:'EGP':'symbol':'1.0-0' }}
                          }
                        </button>
                      }
                    }

                    <div class="course-includes">
                      <h4>This course includes:</h4>
                      <ul>
                        <li>
                          <span class="material-icons">play_circle</span>
                          {{ course()!.totalDurationMinutes / 60 | number:'1.0-0' }} hours on-demand video
                        </li>
                        <li>
                          <span class="material-icons">article</span>
                          Downloadable resources
                        </li>
                        <li>
                          <span class="material-icons">all_inclusive</span>
                          Full lifetime access
                        </li>
                        <li>
                          <span class="material-icons">smartphone</span>
                          Access on mobile and TV
                        </li>
                        <li>
                          <span class="material-icons">workspace_premium</span>
                          Certificate of completion
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Video Preview Modal -->
        @if (showVideoModal()) {
          <div class="video-modal-overlay" (click)="closeVideoModal()">
            <div class="video-modal-content" (click)="$event.stopPropagation()">
              <div class="video-modal-header">
                <h3>{{ currentVideoTitle() }}</h3>
                <button class="close-btn" (click)="closeVideoModal()">
                  <span class="material-icons">close</span>
                </button>
              </div>
              @if (isExternalVideo(currentVideoUrl())) {
                <iframe 
                  [src]="getSafeEmbedUrl()" 
                  frameborder="0" 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                  allowfullscreen
                  class="video-player-iframe">
                </iframe>
              } @else {
                <video 
                  [src]="getVideoUrl()" 
                  controls 
                  autoplay
                  class="video-player">
                  Your browser does not support the video tag.
                </video>
              }
            </div>
          </div>
        }

        <!-- Payment Modal -->
        @if (showPaymentModal()) {
          <div class="payment-modal-overlay" (click)="closePaymentModal()">
            <div class="payment-modal" (click)="$event.stopPropagation()">
              <div class="payment-modal-header">
                <h2>Complete Your Enrollment</h2>
                <button class="close-btn" (click)="closePaymentModal()">
                  <span class="material-icons">close</span>
                </button>
              </div>
              <div class="payment-modal-body">
                <div class="course-summary">
                  <img [src]="mediaService.getCourseThumbnail(course()!.thumbnailUrl)" [alt]="course()!.title">
                  <div>
                    <h3>{{ course()!.title }}</h3>
                    <p class="price-summary">
                      @if (course()!.discountPrice && course()!.discountPrice < course()!.price) {
                        <strong>{{ course()!.discountPrice | currency:'EGP':'symbol':'1.0-0' }}</strong>
                        <span class="original">{{ course()!.price | currency:'EGP':'symbol':'1.0-0' }}</span>
                      } @else {
                        <strong>{{ course()!.price | currency:'EGP':'symbol':'1.0-0' }}</strong>
                      }
                    </p>
                  </div>
                </div>

                <div class="payment-instructions">
                  <h4>Payment Instructions</h4>
                  <p>{{ paymentSettings()?.['payment.paymentInstructions']?.value || 'Please complete payment and upload your receipt below.' }}</p>
                </div>

                @if (paymentSettings()?.['payment.bankName']?.value) {
                  <div class="payment-details">
                    <h4>Bank Transfer Details</h4>
                    <div class="detail-row">
                      <span>Bank:</span>
                      <strong>{{ paymentSettings()?.['payment.bankName']?.value }}</strong>
                    </div>
                    <div class="detail-row">
                      <span>Account Number:</span>
                      <strong>{{ paymentSettings()?.['payment.bankAccountNumber']?.value }}</strong>
                    </div>
                    <div class="detail-row">
                      <span>Account Name:</span>
                      <strong>{{ paymentSettings()?.['payment.bankAccountName']?.value }}</strong>
                    </div>
                  </div>
                }

                @if (paymentSettings()?.['payment.walletNumber']?.value) {
                  <div class="payment-details">
                    <h4>E-Wallet Payment</h4>
                    <div class="detail-row">
                      <span>{{ paymentSettings()?.['payment.walletType']?.value || 'Wallet' }}:</span>
                      <strong>{{ paymentSettings()?.['payment.walletNumber']?.value }}</strong>
                    </div>
                  </div>
                }

                <div class="payment-actions">
                  <a [href]="getWhatsAppPaymentLink()" target="_blank" class="whatsapp-btn">
                    <span>📱</span> Contact via WhatsApp
                  </a>
                </div>

                <div class="screenshot-upload">
                  <h4>Upload Payment Screenshot (Optional)</h4>
                  <p class="upload-hint">Upload a screenshot of your payment receipt for faster verification</p>
                  <input type="file" #screenshotInput (change)="onPaymentScreenshotSelected($event)" accept="image/*" style="display: none">
                  <button class="upload-btn" (click)="screenshotInput.click()" [disabled]="uploadingScreenshot()">
                    @if (uploadingScreenshot()) {
                      <span class="spinner"></span>
                    } @else if (paymentScreenshotUrl()) {
                      ✓ Screenshot Uploaded
                    } @else {
                      📷 Upload Screenshot
                    }
                  </button>
                  @if (paymentScreenshotUrl()) {
                    <div class="screenshot-preview">
                      <img [src]="mediaService.getMediaUrl(paymentScreenshotUrl())" alt="Payment Screenshot">
                    </div>
                  }
                </div>
              </div>
              <div class="payment-modal-footer">
                <button class="cancel-btn" (click)="closePaymentModal()">Cancel</button>
                <button class="submit-btn" (click)="submitEnrollment()" [disabled]="enrolling()">
                  @if (enrolling()) {
                    <span class="spinner"></span>
                  }
                  Submit Enrollment Request
                </button>
              </div>
            </div>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .course-detail-page {
      min-height: 100vh;
    }

    .video-modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.9);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .video-modal-content {
      position: relative;
      width: 90%;
      max-width: 900px;
      background: #000;
      border-radius: 12px;
      overflow: hidden;
    }

    .video-modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;
      background: rgba(0, 0, 0, 0.8);
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .video-modal-header h3 {
      color: white;
      font-size: 1rem;
      font-weight: 600;
      margin: 0;
    }

    .video-modal-content .close-btn {
      background: transparent;
      border: none;
      color: white;
      cursor: pointer;
      padding: 8px;
      border-radius: 50%;
      transition: background 0.2s;
    }

    .video-modal-content .close-btn:hover {
      background: rgba(255, 255, 255, 0.1);
    }

    .video-player {
      width: 100%;
      max-height: 70vh;
      display: block;
    }

    .video-player-iframe {
      width: 100%;
      aspect-ratio: 16/9;
      display: block;
    }

    .loading-container {
      min-height: 60vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .spinner-lg {
      width: 48px;
      height: 48px;
      border: 4px solid var(--color-gray-200);
      border-top-color: var(--color-primary);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* Course Header */
    .course-header {
      background: linear-gradient(135deg, var(--color-dark) 0%, #1a1a1a 100%);
      padding: 100px 0 60px;
      color: white;
    }

    .breadcrumb {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 1rem;
      font-size: 0.875rem;
    }

    .breadcrumb a {
      color: var(--color-primary);
      text-decoration: none;
    }

    .breadcrumb a:hover {
      text-decoration: underline;
    }

    .breadcrumb .material-icons {
      font-size: 1rem;
      color: var(--color-gray-400);
    }

    .course-header h1 {
      font-size: 2rem;
      font-weight: 700;
      margin-bottom: 1rem;
      max-width: 700px;
    }

    .course-description {
      font-size: 1.125rem;
      opacity: 0.9;
      margin-bottom: 1.5rem;
      max-width: 700px;
    }

    .course-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 1.5rem;
      margin-bottom: 1.5rem;
    }

    .meta-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
    }

    .meta-item .material-icons {
      font-size: 1.25rem;
    }

    .meta-item.rating .material-icons {
      color: #f59e0b;
    }

    .rating-value {
      font-weight: 600;
      color: #f59e0b;
    }

    .rating-count {
      opacity: 0.7;
    }

    .instructor-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .instructor-info img {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      object-fit: cover;
    }

    /* Content Layout */
    .course-content {
      padding: 3rem 0;
      background: var(--color-gray-100);
    }

    .content-layout {
      display: grid;
      grid-template-columns: 1fr 380px;
      gap: 2rem;
      align-items: start;
    }

    .content-card {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
    }

    .content-card h2 {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--color-dark);
      margin-bottom: 1.25rem;
    }

    /* What You'll Learn */
    .learning-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
    }

    .learning-item {
      display: flex;
      gap: 0.75rem;
    }

    .learning-item .material-icons {
      color: var(--color-primary);
      font-size: 1.25rem;
      flex-shrink: 0;
    }

    /* Course Content Accordion */
    .content-summary {
      display: flex;
      gap: 0.75rem;
      font-size: 0.875rem;
      color: var(--color-gray-600);
      margin-bottom: 1rem;
    }

    .modules-accordion {
      border: 1px solid var(--color-gray-200);
      border-radius: 8px;
      overflow: hidden;
    }

    .module-item {
      border-bottom: 1px solid var(--color-gray-200);
    }

    .module-item:last-child {
      border-bottom: none;
    }

    .module-header {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem;
      background: var(--color-gray-50);
      border: none;
      cursor: pointer;
      text-align: left;
    }

    .expand-icon {
      transition: transform 0.3s ease;
    }

    .module-item.expanded .expand-icon {
      transform: rotate(180deg);
    }

    .module-title {
      flex: 1;
      font-weight: 500;
    }

    .module-info {
      font-size: 0.75rem;
      color: var(--color-gray-500);
    }

    .module-content {
      display: none;
      padding: 0;
    }

    .module-item.expanded .module-content {
      display: block;
    }

    .session-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.875rem 1rem 0.875rem 2.5rem;
      border-top: 1px solid var(--color-gray-100);
    }

    .session-icon {
      color: var(--color-gray-400);
      font-size: 1.25rem;
    }

    .session-title {
      flex: 1;
      font-size: 0.875rem;
    }

    .free-badge {
      font-size: 0.625rem;
      font-weight: 600;
      text-transform: uppercase;
      padding: 0.25rem 0.5rem;
      background: var(--color-primary);
      color: white;
      border-radius: 4px;
    }

    .free-badge.preview-btn-small {
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .free-badge.preview-btn-small:hover {
      background: var(--color-dark);
      transform: scale(1.05);
    }

    .session-item.clickable {
      cursor: pointer;
      transition: background-color 0.2s ease;
    }

    .session-item.clickable:hover {
      background-color: rgba(36, 112, 144, 0.1);
    }

    .session-duration {
      font-size: 0.75rem;
      color: var(--color-gray-500);
    }

    /* Requirements */
    .requirements-list {
      padding-left: 1.5rem;
    }

    .requirements-list li {
      margin-bottom: 0.5rem;
      color: var(--color-gray-600);
    }

    /* Description */
    .course-full-description {
      line-height: 1.8;
      color: var(--color-gray-700);
    }

    /* Instructor Card */
    .instructor-card {
      display: flex;
      gap: 1.5rem;
    }

    .instructor-card img {
      width: 100px;
      height: 100px;
      border-radius: 50%;
      object-fit: cover;
    }

    .instructor-details h3 {
      font-size: 1.125rem;
      font-weight: 600;
      margin-bottom: 0.5rem;
    }

    .instructor-bio {
      color: var(--color-gray-600);
      line-height: 1.7;
    }

    .contact-instructor-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      margin-top: 1rem;
      padding: 0.75rem 1.25rem;
      background: var(--color-primary);
      color: white;
      border: none;
      border-radius: 8px;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.2s ease;
    }

    .contact-instructor-btn:hover {
      background: var(--color-primary-dark);
    }

    .contact-instructor-btn .material-icons {
      font-size: 1.25rem;
    }

    /* Enrollment Card */
    .sidebar {
      position: sticky;
      top: 100px;
    }

    .enrollment-card {
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    }

    .preview-video, .preview-image {
      position: relative;
      aspect-ratio: 16/9;
    }

    .preview-video img, .preview-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .play-btn {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: rgba(0, 0, 0, 0.7);
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
    }

    .play-btn:hover {
      background: var(--color-primary);
      transform: translate(-50%, -50%) scale(1.1);
    }

    .play-btn .material-icons {
      font-size: 2rem;
      color: white;
    }

    .card-content {
      padding: 1.5rem;
    }

    .price-section {
      margin-bottom: 1rem;
    }

    .price {
      font-size: 2rem;
      font-weight: 700;
      color: var(--color-dark);
    }

    .price.free {
      color: #10b981;
    }

    .original-price {
      font-size: 1rem;
      color: var(--color-gray-400);
      text-decoration: line-through;
      margin-left: 0.75rem;
    }

    .btn-block {
      width: 100%;
      margin-bottom: 0.75rem;
    }

    .btn-secondary {
      background: var(--color-gray-200);
      color: var(--color-gray-600);
    }

    .btn-whatsapp {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      background: #25D366;
      color: white;
      text-decoration: none;
    }

    .btn-whatsapp:hover {
      background: #1da851;
    }

    .course-includes {
      margin-top: 1.5rem;
      padding-top: 1.5rem;
      border-top: 1px solid var(--color-gray-200);
    }

    .course-includes h4 {
      font-size: 0.875rem;
      font-weight: 600;
      margin-bottom: 1rem;
    }

    .course-includes ul {
      list-style: none;
      padding: 0;
    }

    .course-includes li {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.5rem 0;
      font-size: 0.875rem;
      color: var(--color-gray-600);
    }

    .course-includes .material-icons {
      font-size: 1.25rem;
      color: var(--color-gray-400);
    }

    .spinner {
      width: 20px;
      height: 20px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    /* Responsive */
    @media (max-width: 1024px) {
      .content-layout {
        grid-template-columns: 1fr;
      }

      .sidebar {
        position: static;
        order: -1;
      }

      .learning-grid {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 640px) {
      .course-header h1 {
        font-size: 1.5rem;
      }

      .instructor-card {
        flex-direction: column;
        align-items: center;
        text-align: center;
      }
    }

    /* Payment Modal Styles */
    .payment-modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.7);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
    }

    .payment-modal {
      background: white;
      border-radius: 16px;
      width: 100%;
      max-width: 500px;
      max-height: 90vh;
      overflow-y: auto;
    }

    .payment-modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.25rem;
      border-bottom: 1px solid var(--color-gray-200);
    }

    .payment-modal-header h2 {
      font-size: 1.25rem;
      font-weight: 700;
      margin: 0;
    }

    .payment-modal-body {
      padding: 1.25rem;
    }

    .course-summary {
      display: flex;
      gap: 1rem;
      padding: 1rem;
      background: var(--color-gray-100);
      border-radius: 8px;
      margin-bottom: 1.5rem;
    }

    .course-summary img {
      width: 80px;
      height: 50px;
      object-fit: cover;
      border-radius: 6px;
    }

    .course-summary h3 {
      font-size: 0.95rem;
      margin-bottom: 0.25rem;
    }

    .price-summary {
      font-size: 0.9rem;
    }

    .price-summary .original {
      text-decoration: line-through;
      color: var(--color-gray-400);
      margin-left: 0.5rem;
    }

    .payment-instructions {
      margin-bottom: 1.5rem;
    }

    .payment-instructions h4 {
      font-size: 0.9rem;
      font-weight: 600;
      margin-bottom: 0.5rem;
    }

    .payment-instructions p {
      font-size: 0.9rem;
      color: var(--color-gray-600);
    }

    .payment-details {
      background: var(--color-gray-100);
      padding: 1rem;
      border-radius: 8px;
      margin-bottom: 1rem;
    }

    .payment-details h4 {
      font-size: 0.85rem;
      font-weight: 600;
      margin-bottom: 0.75rem;
      color: var(--color-primary);
    }

    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 0.5rem 0;
      font-size: 0.9rem;
      border-bottom: 1px dashed var(--color-gray-300);
    }

    .detail-row:last-child {
      border-bottom: none;
    }

    .payment-actions {
      margin: 1.5rem 0;
      text-align: center;
    }

    .whatsapp-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.875rem 1.5rem;
      background: #25D366;
      color: white;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      transition: background 0.2s;
    }

    .whatsapp-btn:hover {
      background: #128C7E;
    }

    .screenshot-upload {
      padding: 1rem;
      border: 2px dashed var(--color-gray-300);
      border-radius: 8px;
      text-align: center;
    }

    .screenshot-upload h4 {
      font-size: 0.9rem;
      margin-bottom: 0.25rem;
    }

    .upload-hint {
      font-size: 0.8rem;
      color: var(--color-gray-500);
      margin-bottom: 1rem;
    }

    .upload-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.625rem 1.25rem;
      background: var(--color-gray-100);
      border: 1px solid var(--color-gray-300);
      border-radius: 6px;
      cursor: pointer;
      font-weight: 500;
    }

    .upload-btn:hover {
      background: var(--color-gray-200);
    }

    .screenshot-preview {
      margin-top: 1rem;
    }

    .screenshot-preview img {
      max-width: 100%;
      max-height: 150px;
      border-radius: 8px;
      border: 1px solid var(--color-gray-200);
    }

    .payment-modal-footer {
      display: flex;
      gap: 0.75rem;
      padding: 1.25rem;
      border-top: 1px solid var(--color-gray-200);
    }

    .cancel-btn {
      flex: 1;
      padding: 0.75rem;
      background: var(--color-gray-100);
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
    }

    .submit-btn {
      flex: 2;
      padding: 0.75rem;
      background: var(--color-primary);
      color: white;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
    }

    .submit-btn:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }
  `]
})
export class CourseDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private courseService = inject(CourseService);
  private enrollmentService = inject(EnrollmentService);
  private authService = inject(AuthService);
  private toastr = inject(ToastrService);
  private sanitizer = inject(DomSanitizer);
  private settingsService = inject(AdminSettingsService);
  private fileUploadService = inject(FileUploadService);
  mediaService = inject(MediaService);

  course = signal<CourseDetail | null>(null);
  isLoading = signal(true);
  expandedModules = signal<Set<number>>(new Set());
  isEnrolled = signal(false);
  enrollmentPending = signal(false);
  enrolling = signal(false);
  showVideoModal = signal(false);
  currentVideoUrl = signal<string>('');
  currentVideoTitle = signal<string>('');
  
  // Payment modal
  showPaymentModal = signal(false);
  paymentScreenshotUrl = signal<string>('');
  uploadingScreenshot = signal(false);
  paymentSettings = signal<any>(null);

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('slug');
    if (slug) {
      this.loadCourse(slug);
    }
  }

  loadCourse(slug: string): void {
    this.isLoading.set(true);
    this.courseService.getCourseBySlug(slug).subscribe({
      next: (response) => {
        if (response.isSuccess && response.data) {
          const apiCourse = response.data as any;
          // Map backend response to component interface
          const course: CourseDetail = {
            id: apiCourse.id,
            title: apiCourse.nameEn || apiCourse.title || '',
            slug: apiCourse.slug || '',
            description: apiCourse.descriptionEn || apiCourse.description || '',
            shortDescription: apiCourse.descriptionEn?.substring(0, 200) || '',
            thumbnailUrl: apiCourse.thumbnailUrl || '',
            previewVideoUrl: apiCourse.trailerVideoUrl || apiCourse.previewVideoUrl || '',
            price: apiCourse.price || 0,
            discountPrice: apiCourse.discountPrice || apiCourse.price || 0,
            level: apiCourse.level || 'Beginner',
            language: 'English',
            categoryId: apiCourse.category?.id || 0,
            categoryName: apiCourse.category?.nameEn || 'General',
            instructorId: apiCourse.instructor?.id || 0,
            instructorName: apiCourse.instructor?.fullName || 'Instructor',
            instructorBio: apiCourse.instructor?.bio || '',
            instructorAvatarUrl: apiCourse.instructor?.profileImageUrl || '',
            totalDurationMinutes: (apiCourse.durationInHours || 0) * 60,
            enrollmentCount: apiCourse.enrollmentCount || 0,
            averageRating: apiCourse.averageRating || 0,
            reviewCount: apiCourse.reviewCount || 0,
            requirements: apiCourse.requirementsEn?.split('\n').filter((r: string) => r.trim()) || [],
            whatYouWillLearn: apiCourse.whatYouWillLearnEn?.split('\n').filter((r: string) => r.trim()) || [],
            modules: (apiCourse.modules || []).map((m: any) => ({
              id: m.id,
              title: m.nameEn || m.title || 'Module',
              order: m.sortOrder || m.order || 0,
              sessions: (m.sessions || []).map((s: any) => ({
                id: s.id,
                title: s.nameEn || s.title || 'Session',
                type: this.mapSessionType(s.type),
                durationMinutes: s.durationInMinutes || s.durationMinutes || 10,
                order: s.sortOrder || s.order || 0,
                isFree: s.isFree || s.isFreePreview || false,
                videoUrl: s.videoUrl || ''
              }))
            }))
          };
          this.course.set(course);
          this.isLoading.set(false);
          if (course.modules?.length > 0) {
            this.expandedModules.set(new Set([course.modules[0].id]));
          }
          this.checkEnrollment(course.id);
        } else {
          this.isLoading.set(false);
          this.toastr.error('Course not found');
        }
      },
      error: () => {
        this.isLoading.set(false);
        this.toastr.error('Failed to load course');
      }
    });
  }

  checkEnrollment(courseId: number): void {
    if (!this.authService.isAuthenticated()) return;
    
    this.enrollmentService.checkEnrollment(courseId).subscribe({
      next: (enrollment: any) => {
        if (enrollment) {
          this.isEnrolled.set(enrollment.status === 'Approved' || enrollment.status === 'Completed');
          this.enrollmentPending.set(enrollment.status === 'Pending' || enrollment.status === 'PaymentPending');
        }
      }
    });
  }

  getTotalSessions(): number {
    if (!this.course()) return 0;
    return this.course()!.modules.reduce((total, m) => total + m.sessions.length, 0);
  }

  toggleModule(moduleId: number): void {
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

  playPreview(): void {
    // Open preview video modal
    if (this.course()?.previewVideoUrl) {
      this.currentVideoUrl.set(this.course()!.previewVideoUrl);
      this.currentVideoTitle.set('Course Preview');
      this.showVideoModal.set(true);
    }
  }

  playFreeSession(session: Session): void {
    // Play a free session's video
    if (session.videoUrl) {
      this.currentVideoUrl.set(session.videoUrl);
      this.currentVideoTitle.set(session.title);
      this.showVideoModal.set(true);
    } else {
      this.toastr.info('No video available for this session');
    }
  }

  closeVideoModal(): void {
    this.showVideoModal.set(false);
    this.currentVideoUrl.set('');
    this.currentVideoTitle.set('');
  }

  getVideoUrl(): string {
    const url = this.currentVideoUrl() || this.course()?.previewVideoUrl || '';
    return this.mediaService.getVideoUrl(url);
  }

  isExternalVideo(url: string): boolean {
    return url.includes('youtube') || url.includes('vimeo') || url.includes('youtu.be');
  }

  getEmbedUrl(): string {
    const url = this.currentVideoUrl();
    if (url.includes('youtube.com/watch')) {
      const videoId = url.split('v=')[1]?.split('&')[0];
      return `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    }
    if (url.includes('youtu.be')) {
      const videoId = url.split('youtu.be/')[1]?.split('?')[0];
      return `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    }
    if (url.includes('vimeo.com')) {
      const videoId = url.split('vimeo.com/')[1]?.split('?')[0];
      return `https://player.vimeo.com/video/${videoId}?autoplay=1`;
    }
    return url;
  }

  getSafeEmbedUrl(): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(this.getEmbedUrl());
  }

  enrollFree(): void {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/auth/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }

    this.enrolling.set(true);
    this.enrollmentService.enrollFree(this.course()!.id).subscribe({
      next: () => {
        this.enrolling.set(false);
        this.isEnrolled.set(true);
        this.toastr.success('Successfully enrolled!');
      },
      error: (error: any) => {
        this.enrolling.set(false);
        this.toastr.error(error.error?.message || 'Enrollment failed');
      }
    });
  }

  startEnrollment(): void {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/auth/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }
    
    // Load payment settings and show payment modal
    this.loadPaymentSettings();
    this.showPaymentModal.set(true);
  }

  loadPaymentSettings(): void {
    this.settingsService.getPublicSettings().subscribe({
      next: (settings: any) => {
        this.paymentSettings.set(settings);
      }
    });
  }

  onPaymentScreenshotSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      if (file.size > 5 * 1024 * 1024) {
        this.toastr.error('File size must be less than 5MB');
        return;
      }

      this.uploadingScreenshot.set(true);
      this.fileUploadService.uploadImage(file).subscribe({
        next: (progress) => {
          if (progress.status === 'complete' && progress.response?.data?.url) {
            this.paymentScreenshotUrl.set(progress.response.data.url);
            this.uploadingScreenshot.set(false);
            this.toastr.success('Screenshot uploaded successfully');
          } else if (progress.status === 'error') {
            this.uploadingScreenshot.set(false);
            this.toastr.error(progress.error || 'Upload failed');
          }
        },
        error: () => {
          this.uploadingScreenshot.set(false);
          this.toastr.error('Failed to upload screenshot');
        }
      });
    }
  }

  submitEnrollment(): void {
    this.enrolling.set(true);
    this.enrollmentService.enroll({ 
      courseId: this.course()!.id.toString(),
      paymentScreenshotUrl: this.paymentScreenshotUrl() || undefined
    }).subscribe({
      next: () => {
        this.enrolling.set(false);
        this.enrollmentPending.set(true);
        this.showPaymentModal.set(false);
        this.toastr.success('Enrollment request submitted! Please wait for admin approval.');
      },
      error: (error: any) => {
        this.enrolling.set(false);
        this.toastr.error(error.error?.message || 'Enrollment request failed');
      }
    });
  }

  closePaymentModal(): void {
    this.showPaymentModal.set(false);
    this.paymentScreenshotUrl.set('');
  }

  getWhatsAppPaymentLink(): string {
    const whatsappNumber = this.paymentSettings()?.['payment.whatsappNumber']?.value || environment.whatsappNumber || '201029907297';
    const message = encodeURIComponent(`Hi, I want to enroll in: ${this.course()!.title}\nPrice: ${this.course()!.price} EGP`);
    return `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=${message}`;
  }

  private mapSessionType(type: number | string | undefined): 'Video' | 'Article' | 'Quiz' {
    // Backend SessionType: Video=0, Live=1, Recorded=2, Article=3, Quiz=4, Assignment=5
    if (typeof type === 'string') {
      const t = type.toLowerCase();
      if (t === 'article') return 'Article';
      if (t === 'quiz') return 'Quiz';
      return 'Video';
    }
    if (typeof type === 'number') {
      if (type === 3) return 'Article';
      if (type === 4) return 'Quiz';
      return 'Video'; // 0, 1, 2, 5 are all video types
    }
    return 'Video';
  }

  contactInstructor(): void {
    const course = this.course();
    if (!course?.instructorId) {
      this.toastr.error('Instructor information not available');
      return;
    }
    // Navigate to chat with instructor
    this.router.navigate(['/chat'], { 
      queryParams: { 
        instructorId: course.instructorId,
        courseId: course.id,
        courseName: course.title
      } 
    });
  }
}
