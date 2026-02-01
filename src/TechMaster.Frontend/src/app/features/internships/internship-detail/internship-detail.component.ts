import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { InternshipService, Internship, ApplyInternshipDto } from '@core/services/internship.service';
import { AuthService } from '@core/services/auth.service';
import { MediaService } from '@core/services/media.service';
import { AdminSettingsService } from '@core/services/admin-settings.service';
import { FileUploadService } from '@core/services/file-upload.service';
import { ToastrService } from 'ngx-toastr';

interface InternshipDetail {
  id: number | string;
  title: string;
  company: string;
  companyLogo: string;
  companyDescription: string;
  location: string;
  type: 'Remote' | 'OnSite' | 'Hybrid';
  duration: string;
  description: string;
  responsibilities: string[];
  requirements: string[];
  benefits: string[];
  skills: string[];
  postedAt: Date;
  deadline: Date;
  applicants: number;
  isPaid?: boolean;
  stipend?: number;
  hasFee?: boolean;
  feeAmount?: number;
  currency?: string;
}

@Component({
  selector: 'app-internship-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="internship-detail-page">
      @if (loading()) {
        <div class="loading-state">
          <div class="spinner"></div>
        </div>
      } @else if (internship()) {
        <!-- Header -->
        <section class="detail-header">
          <div class="container">
            <a routerLink="/internships" class="back-link">
              <span>←</span>
              Back
            </a>

            <div class="header-content">
              <div class="company-logo">
                @if (internship()?.companyLogo) {
                  <img [src]="mediaService.getImageUrl(internship()?.companyLogo)" [alt]="internship()?.company">
                } @else {
                  <span>{{ internship()?.company?.charAt(0) }}</span>
                }
              </div>
              <div class="header-info">
                <h1>{{ internship()?.title }}</h1>
                <div class="meta">
                  <span class="company">{{ internship()?.company }}</span>
                  <span class="separator">•</span>
                  <span class="location">📍 {{ internship()?.location }}</span>
                  <span class="separator">•</span>
                  <span class="type-badge" [class]="internship()?.type?.toLowerCase()">
                    {{ internship()?.type }}
                  </span>
                </div>
              </div>
              <button class="apply-btn" (click)="openApplyModal()" [disabled]="hasApplied()">
                @if (hasApplied()) {
                  Already Applied
                } @else {
                  Apply Now
                }
              </button>
            </div>
          </div>
        </section>

        <!-- Content -->
        <section class="detail-content">
          <div class="container">
            <div class="content-grid">
              <!-- Main Content -->
              <div class="main-content">
                <div class="content-card">
                  <h2>Description</h2>
                  <p>{{ internship()?.description }}</p>
                </div>

                <div class="content-card">
                  <h2>Responsibilities</h2>
                  <ul>
                    @for (item of internship()?.responsibilities; track item) {
                      <li>{{ item }}</li>
                    }
                  </ul>
                </div>

                <div class="content-card">
                  <h2>Requirements</h2>
                  <ul>
                    @for (item of internship()?.requirements; track item) {
                      <li>{{ item }}</li>
                    }
                  </ul>
                </div>

                <div class="content-card">
                  <h2>Benefits</h2>
                  <ul class="benefits-list">
                    @for (item of internship()?.benefits; track item) {
                      <li>
                        <span class="check">✓</span>
                        {{ item }}
                      </li>
                    }
                  </ul>
                </div>

                <div class="content-card">
                  <h2>Skills</h2>
                  <div class="skills-list">
                    @for (skill of internship()?.skills; track skill) {
                      <span class="skill-tag">{{ skill }}</span>
                    }
                  </div>
                </div>
              </div>

              <!-- Sidebar -->
              <div class="sidebar">
                <div class="sidebar-card">
                  <h3>Overview</h3>
                  <div class="overview-item">
                    <span class="label">Duration</span>
                    <span class="value">{{ internship()?.duration }}</span>
                  </div>
                  <div class="overview-item">
                    <span class="label">Type</span>
                    <span class="value">{{ internship()?.type }}</span>
                  </div>
                  <div class="overview-item">
                    <span class="label">Location</span>
                    <span class="value">{{ internship()?.location }}</span>
                  </div>
                  <div class="overview-item">
                    <span class="label">Posted</span>
                    <span class="value">{{ internship()?.postedAt | date:'mediumDate' }}</span>
                  </div>
                  <div class="overview-item deadline">
                    <span class="label">Deadline</span>
                    <span class="value">{{ internship()?.deadline | date:'mediumDate' }}</span>
                  </div>
                  <div class="overview-item">
                    <span class="label">Applicants</span>
                    <span class="value">{{ internship()?.applicants }}</span>
                  </div>
                  @if (internship()?.isPaid) {
                    <div class="overview-item stipend">
                      <span class="label">💰 Stipend</span>
                      <span class="value paid">{{ internship()?.currency }} {{ internship()?.stipend | number }}</span>
                    </div>
                  }
                  @if (internship()?.hasFee) {
                    <div class="overview-item fee">
                      <span class="label">📋 Application Fee</span>
                      <span class="value fee-amount">{{ internship()?.currency }} {{ internship()?.feeAmount | number }}</span>
                    </div>
                  }
                </div>

                <div class="sidebar-card company-card">
                  <h3>About the Company</h3>
                  <div class="company-header">
                    <div class="company-logo small">
                      <span>{{ internship()?.company?.charAt(0) }}</span>
                    </div>
                    <span class="company-name">{{ internship()?.company }}</span>
                  </div>
                  <p>{{ internship()?.companyDescription }}</p>
                </div>

                <button class="apply-btn-sidebar" (click)="openApplyModal()" [disabled]="hasApplied()">
                  @if (hasApplied()) {
                    Already Applied ✓
                  } @else {
                    Apply Now
                  }
                </button>

                <div class="share-section">
                  <span>Share:</span>
                  <div class="share-buttons">
                    <button title="LinkedIn">💼</button>
                    <button title="Twitter">🐦</button>
                    <button title="WhatsApp">💬</button>
                    <button title="Copy Link">🔗</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      }
    </div>

    <!-- Premium Multi-Phase Application Modal -->
    @if (showApplyModal) {
      <div class="modal-overlay" (click)="showApplyModal = false">
        <div class="application-wizard" (click)="$event.stopPropagation()">
          <div class="wizard-header">
            <h2>Apply for {{ internship()?.title }}</h2>
            <p class="company-name">at {{ internship()?.company }}</p>
            <button class="close-btn" (click)="showApplyModal = false">×</button>
          </div>
          
          <!-- Progress Steps -->
          <div class="wizard-progress">
            <div class="progress-steps">
              <div class="step" [class.active]="applicationStep >= 1" [class.completed]="applicationStep > 1">
                <div class="step-number">
                  @if (applicationStep > 1) { ✓ } @else { 1 }
                </div>
                <span class="step-label">Personal Info</span>
              </div>
              <div class="step-connector" [class.active]="applicationStep > 1"></div>
              <div class="step" [class.active]="applicationStep >= 2" [class.completed]="applicationStep > 2">
                <div class="step-number">
                  @if (applicationStep > 2) { ✓ } @else { 2 }
                </div>
                <span class="step-label">Documents</span>
              </div>
              <div class="step-connector" [class.active]="applicationStep > 2"></div>
              <div class="step" [class.active]="applicationStep >= 3" [class.completed]="applicationStep > 3">
                <div class="step-number">
                  @if (applicationStep > 3) { ✓ } @else { 3 }
                </div>
                <span class="step-label">Profile Links</span>
              </div>
              <div class="step-connector" [class.active]="applicationStep > 3"></div>
              @if (internship()?.hasFee) {
                <div class="step" [class.active]="applicationStep >= 4" [class.completed]="applicationStep > 4">
                  <div class="step-number">
                    @if (applicationStep > 4) { ✓ } @else { 4 }
                  </div>
                  <span class="step-label">Payment</span>
                </div>
                <div class="step-connector" [class.active]="applicationStep > 4"></div>
                <div class="step" [class.active]="applicationStep >= 5">
                  <div class="step-number">5</div>
                  <span class="step-label">Review</span>
                </div>
              } @else {
                <div class="step" [class.active]="applicationStep >= 4">
                  <div class="step-number">4</div>
                  <span class="step-label">Review</span>
                </div>
              }
            </div>
          </div>

          <div class="wizard-body">
            <!-- Step 1: Personal Information -->
            @if (applicationStep === 1) {
              <div class="step-content">
                <h3>📋 Personal Information</h3>
                <p class="step-description">Let's start with your basic information</p>
                <div class="form-grid">
                  <div class="form-group">
                    <label>Full Name *</label>
                    <input type="text" [(ngModel)]="application.name" placeholder="Enter your full name">
                    <span class="input-icon">👤</span>
                  </div>
                  <div class="form-group">
                    <label>Email Address *</label>
                    <input type="email" [(ngModel)]="application.email" placeholder="your.email@example.com">
                    <span class="input-icon">✉️</span>
                  </div>
                  <div class="form-group">
                    <label>Phone Number *</label>
                    <input type="tel" [(ngModel)]="application.phone" placeholder="+20 xxx xxx xxxx">
                    <span class="input-icon">📱</span>
                  </div>
                </div>
              </div>
            }

            <!-- Step 2: Documents -->
            @if (applicationStep === 2) {
              <div class="step-content">
                <h3>📄 Documents</h3>
                <p class="step-description">Upload your resume and write a cover letter</p>
                <div class="form-group">
                  <label>Resume / CV *</label>
                  <div class="premium-file-upload" [class.has-file]="application.resumeUrl">
                    <input type="file" id="resume-upload" accept=".pdf,.doc,.docx" (change)="onResumeSelect($event)">
                    <label for="resume-upload">
                      <div class="upload-icon">📎</div>
                      <div class="upload-text">
                        @if (application.resumeUrl) {
                          <span class="file-name">Resume uploaded ✓</span>
                        } @else {
                          <span class="primary-text">Click to upload your resume</span>
                          <span class="secondary-text">PDF, DOC, DOCX (Max 5MB)</span>
                        }
                      </div>
                    </label>
                  </div>
                </div>
                <div class="form-group full-width">
                  <label>Cover Letter</label>
                  <textarea [(ngModel)]="application.coverLetter" rows="6" 
                    placeholder="Tell us why you're interested in this internship and what makes you a great candidate..."></textarea>
                  <span class="char-count">{{ application.coverLetter.length }} / 1000</span>
                </div>
              </div>
            }

            <!-- Step 3: Profile Links -->
            @if (applicationStep === 3) {
              <div class="step-content">
                <h3>🔗 Online Profiles</h3>
                <p class="step-description">Share your professional profiles and portfolio (optional)</p>
                <div class="form-grid">
                  <div class="form-group">
                    <label>LinkedIn Profile</label>
                    <div class="input-with-icon">
                      <span class="prefix-icon">💼</span>
                      <input type="url" [(ngModel)]="application.linkedIn" placeholder="linkedin.com/in/yourprofile">
                    </div>
                  </div>
                  <div class="form-group">
                    <label>GitHub Profile</label>
                    <div class="input-with-icon">
                      <span class="prefix-icon">🐱</span>
                      <input type="url" [(ngModel)]="application.github" placeholder="github.com/yourusername">
                    </div>
                  </div>
                  <div class="form-group full-width">
                    <label>Portfolio / Personal Website</label>
                    <div class="input-with-icon">
                      <span class="prefix-icon">🌐</span>
                      <input type="url" [(ngModel)]="application.portfolio" placeholder="yourportfolio.com">
                    </div>
                  </div>
                </div>
              </div>
            }

            <!-- Step 4: Payment (only if hasFee) or Review (if no fee) -->
            @if (applicationStep === 4) {
              @if (internship()?.hasFee) {
                <div class="step-content payment-step">
                  <h3>💳 Complete Payment</h3>
                  <p class="step-description">Please complete the payment to proceed with your application</p>

                  <div class="payment-summary">
                    <div class="fee-display">
                      <span class="fee-label">Application Fee:</span>
                      <span class="fee-amount">{{ internship()?.currency || 'EGP' }} {{ internship()?.feeAmount | number }}</span>
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
                    <h4>Upload Payment Screenshot</h4>
                    <p class="upload-hint">Upload a screenshot of your payment receipt for verification</p>
                    <input type="file" #paymentScreenshotInput (change)="onPaymentScreenshotSelected($event)" accept="image/*" style="display: none">
                    <button class="upload-btn" (click)="paymentScreenshotInput.click()" [disabled]="uploadingScreenshot()">
                      @if (uploadingScreenshot()) {
                        <span class="spinner-small"></span> Uploading...
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
              } @else {
                <!-- Review step for non-fee internships -->
                <div class="step-content review-step">
                  <h3>✅ Review Your Application</h3>
                  <p class="step-description">Please review your information before submitting</p>
                  
                  <div class="review-sections">
                    <div class="review-section">
                      <h4>Personal Information</h4>
                      <div class="review-item">
                        <span class="label">Name:</span>
                        <span class="value">{{ application.name }}</span>
                      </div>
                      <div class="review-item">
                        <span class="label">Email:</span>
                        <span class="value">{{ application.email }}</span>
                      </div>
                      <div class="review-item">
                        <span class="label">Phone:</span>
                        <span class="value">{{ application.phone || 'Not provided' }}</span>
                      </div>
                    </div>

                    <div class="review-section">
                      <h4>Documents</h4>
                      <div class="review-item">
                        <span class="label">Resume:</span>
                        <span class="value" [class.success]="application.resumeUrl">
                          {{ application.resumeUrl ? '✓ Uploaded' : '✗ Not uploaded' }}
                        </span>
                      </div>
                      <div class="review-item">
                        <span class="label">Cover Letter:</span>
                        <span class="value" [class.success]="application.coverLetter">
                          {{ application.coverLetter ? '✓ Provided (' + application.coverLetter.length + ' chars)' : '✗ Not provided' }}
                        </span>
                      </div>
                    </div>

                    <div class="review-section">
                      <h4>Profile Links</h4>
                      <div class="review-item">
                        <span class="label">LinkedIn:</span>
                        <span class="value">{{ application.linkedIn || 'Not provided' }}</span>
                      </div>
                      <div class="review-item">
                        <span class="label">GitHub:</span>
                        <span class="value">{{ application.github || 'Not provided' }}</span>
                      </div>
                      <div class="review-item">
                        <span class="label">Portfolio:</span>
                        <span class="value">{{ application.portfolio || 'Not provided' }}</span>
                      </div>
                    </div>
                  </div>

                  <div class="application-note">
                    <span class="note-icon">ℹ️</span>
                    <p>By submitting this application, you confirm that all information provided is accurate and complete.</p>
                  </div>
                </div>
              }
            }

            <!-- Step 5: Review (only if hasFee) -->
            @if (applicationStep === 5 && internship()?.hasFee) {
              <div class="step-content review-step">
                <h3>✅ Review Your Application</h3>
                <p class="step-description">Please review your information before submitting</p>
                
                <div class="review-sections">
                  <div class="review-section">
                    <h4>Personal Information</h4>
                    <div class="review-item">
                      <span class="label">Name:</span>
                      <span class="value">{{ application.name }}</span>
                    </div>
                    <div class="review-item">
                      <span class="label">Email:</span>
                      <span class="value">{{ application.email }}</span>
                    </div>
                    <div class="review-item">
                      <span class="label">Phone:</span>
                      <span class="value">{{ application.phone || 'Not provided' }}</span>
                    </div>
                  </div>

                  <div class="review-section">
                    <h4>Documents</h4>
                    <div class="review-item">
                      <span class="label">Resume:</span>
                      <span class="value" [class.success]="application.resumeUrl">
                        {{ application.resumeUrl ? '✓ Uploaded' : '✗ Not uploaded' }}
                      </span>
                    </div>
                    <div class="review-item">
                      <span class="label">Cover Letter:</span>
                      <span class="value" [class.success]="application.coverLetter">
                        {{ application.coverLetter ? '✓ Provided (' + application.coverLetter.length + ' chars)' : '✗ Not provided' }}
                      </span>
                    </div>
                  </div>

                  <div class="review-section">
                    <h4>Profile Links</h4>
                    <div class="review-item">
                      <span class="label">LinkedIn:</span>
                      <span class="value">{{ application.linkedIn || 'Not provided' }}</span>
                    </div>
                    <div class="review-item">
                      <span class="label">GitHub:</span>
                      <span class="value">{{ application.github || 'Not provided' }}</span>
                    </div>
                    <div class="review-item">
                      <span class="label">Portfolio:</span>
                      <span class="value">{{ application.portfolio || 'Not provided' }}</span>
                    </div>
                  </div>

                  <div class="review-section">
                    <h4>Payment</h4>
                    <div class="review-item">
                      <span class="label">Fee Amount:</span>
                      <span class="value">{{ internship()?.currency || 'EGP' }} {{ internship()?.feeAmount | number }}</span>
                    </div>
                    <div class="review-item">
                      <span class="label">Payment Screenshot:</span>
                      <span class="value" [class.success]="paymentScreenshotUrl()">
                        {{ paymentScreenshotUrl() ? '✓ Uploaded' : '✗ Not uploaded' }}
                      </span>
                    </div>
                  </div>
                </div>

                <div class="application-note">
                  <span class="note-icon">ℹ️</span>
                  <p>By submitting this application, you confirm that all information provided is accurate and complete.</p>
                </div>
              </div>
            }
          </div>

          <div class="wizard-footer">
            @if (applicationStep > 1) {
              <button class="back-btn" (click)="previousStep()">
                ← Back
              </button>
            }
            <div class="footer-spacer"></div>
            @if (applicationStep < getTotalSteps()) {
              <button class="next-btn" (click)="nextStep()" [disabled]="!canProceed()">
                Next →
              </button>
            } @else {
              <button class="submit-btn" (click)="submitApplication()" [disabled]="submitting()">
                @if (submitting()) {
                  <span class="spinner-small"></span>
                  Submitting...
                } @else {
                  Submit Application 🚀
                }
              </button>
            }
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .internship-detail-page {
      min-height: 100vh;
      background: #f8f9fa;
    }

    .loading-state {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 50vh;
    }

    .spinner {
      width: 50px;
      height: 50px;
      border: 3px solid #f0f0f0;
      border-top-color: #247090;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 1.5rem;
    }

    .detail-header {
      background: #fff;
      padding: 2rem 0;
      border-bottom: 1px solid #e0e0e0;
    }

    .back-link {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      color: #666;
      text-decoration: none;
      margin-bottom: 1.5rem;
    }

    .back-link:hover {
      color: #247090;
    }

    .header-content {
      display: flex;
      align-items: flex-start;
      gap: 1.5rem;
    }

    .company-logo {
      width: 80px;
      height: 80px;
      border-radius: 16px;
      background: #247090;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-size: 2rem;
      font-weight: 700;
      overflow: hidden;
    }

    .company-logo img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .header-info {
      flex: 1;
    }

    .header-info h1 {
      font-size: 1.75rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
    }

    .meta {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      color: #666;
    }

    .separator {
      color: #ccc;
    }

    .type-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.8rem;
      font-weight: 600;
    }

    .type-badge.remote {
      background: #e8f5e9;
      color: #388e3c;
    }

    .type-badge.onsite {
      background: #e3f2fd;
      color: #1976d2;
    }

    .type-badge.hybrid {
      background: #fff3e0;
      color: #f57c00;
    }

    .apply-btn {
      padding: 0.875rem 2rem;
      background: #247090;
      color: #fff;
      border: none;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s;
    }

    .apply-btn:hover {
      background: #1a5570;
    }

    .detail-content {
      padding: 2rem 0;
    }

    .content-grid {
      display: grid;
      grid-template-columns: 1fr 350px;
      gap: 2rem;
    }

    .content-card {
      background: #fff;
      border-radius: 16px;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
    }

    .content-card h2 {
      font-size: 1.25rem;
      font-weight: 700;
      margin-bottom: 1rem;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid #f0f0f0;
    }

    .content-card p {
      color: #666;
      line-height: 1.7;
    }

    .content-card ul {
      list-style: none;
      padding: 0;
    }

    .content-card ul li {
      padding: 0.5rem 0;
      padding-left: 1.5rem;
      position: relative;
      color: #666;
    }

    .content-card ul li::before {
      content: '•';
      position: absolute;
      left: 0;
      color: #247090;
      font-weight: bold;
    }

    .benefits-list li::before {
      content: none;
    }

    .benefits-list .check {
      color: #28a745;
      margin-right: 0.5rem;
    }

    .skills-list {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .skill-tag {
      padding: 0.375rem 0.875rem;
      background: #f0f0f0;
      border-radius: 20px;
      font-size: 0.9rem;
    }

    .sidebar-card {
      background: #fff;
      border-radius: 16px;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
    }

    .sidebar-card h3 {
      font-size: 1.1rem;
      font-weight: 700;
      margin-bottom: 1rem;
    }

    .overview-item {
      display: flex;
      justify-content: space-between;
      padding: 0.75rem 0;
      border-bottom: 1px solid #f0f0f0;
    }

    .overview-item:last-child {
      border-bottom: none;
    }

    .overview-item .label {
      color: #666;
    }

    .overview-item .value {
      font-weight: 600;
    }

    .overview-item.deadline .value {
      color: #dc3545;
    }

    .overview-item.stipend .value.paid {
      color: #10b981;
      font-weight: 700;
    }

    .overview-item.fee .value.fee-amount {
      color: #f59e0b;
      font-weight: 700;
    }

    .overview-item.stipend,
    .overview-item.fee {
      background: #f8fafc;
      margin: 0 -1rem;
      padding: 0.75rem 1rem;
      border-radius: 0.5rem;
    }

    .company-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 1rem;
    }

    .company-logo.small {
      width: 40px;
      height: 40px;
      font-size: 1.25rem;
    }

    .company-name {
      font-weight: 600;
    }

    .company-card p {
      color: #666;
      font-size: 0.9rem;
      line-height: 1.6;
    }

    .apply-btn-sidebar {
      width: 100%;
      padding: 1rem;
      background: #247090;
      color: #fff;
      border: none;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      margin-bottom: 1.5rem;
    }

    .share-section {
      display: flex;
      align-items: center;
      gap: 1rem;
      color: #666;
    }

    .share-buttons {
      display: flex;
      gap: 0.5rem;
    }

    .share-buttons button {
      width: 36px;
      height: 36px;
      border: 1px solid #e0e0e0;
      background: #fff;
      border-radius: 50%;
      cursor: pointer;
      font-size: 1rem;
    }

    .share-buttons button:hover {
      background: #f0f0f0;
    }

    /* Modal */
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
      padding: 1rem;
    }

    .modal {
      background: #fff;
      border-radius: 16px;
      width: 100%;
      max-width: 500px;
      max-height: 90vh;
      overflow: auto;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem;
      border-bottom: 1px solid #e0e0e0;
    }

    .modal-header h2 {
      font-size: 1.25rem;
      font-weight: 700;
    }

    .close-btn {
      width: 36px;
      height: 36px;
      border: none;
      background: #f0f0f0;
      border-radius: 50%;
      font-size: 1.25rem;
      cursor: pointer;
    }

    .modal-body {
      padding: 1.5rem;
    }

    .form-group {
      margin-bottom: 1.25rem;
    }

    .form-group label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 600;
    }

    .form-group input,
    .form-group textarea {
      width: 100%;
      padding: 0.75rem 1rem;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      font-size: 0.95rem;
    }

    .file-upload {
      position: relative;
    }

    .file-upload input {
      position: absolute;
      opacity: 0;
      width: 100%;
      height: 100%;
      cursor: pointer;
    }

    .file-upload label {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 1rem;
      border: 2px dashed #e0e0e0;
      border-radius: 8px;
      cursor: pointer;
      transition: border-color 0.2s;
    }

    .file-upload:hover label {
      border-color: #247090;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      padding: 1.5rem;
      border-top: 1px solid #e0e0e0;
    }

    .cancel-btn {
      padding: 0.75rem 1.5rem;
      border: 2px solid #e0e0e0;
      background: #fff;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
    }

    .submit-btn {
      padding: 0.75rem 1.5rem;
      border: none;
      background: #247090;
      color: #fff;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
    }

    @media (max-width: 992px) {
      .content-grid {
        grid-template-columns: 1fr;
      }

      .header-content {
        flex-direction: column;
      }

      .apply-btn {
        width: 100%;
      }
    }

    @media (max-width: 768px) {
      .header-info h1 {
        font-size: 1.5rem;
      }

      .meta {
        flex-wrap: wrap;
      }
    }

    /* Premium Application Wizard Styles */
    .application-wizard {
      background: #fff;
      border-radius: 20px;
      width: 90%;
      max-width: 700px;
      max-height: 90vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
    }

    .wizard-header {
      padding: 2rem;
      background: linear-gradient(135deg, #247090 0%, #1a5570 100%);
      color: #fff;
      position: relative;
    }

    .wizard-header h2 {
      font-size: 1.5rem;
      font-weight: 700;
      margin: 0;
    }

    .wizard-header .company-name {
      opacity: 0.9;
      margin-top: 0.25rem;
      font-size: 0.95rem;
    }

    .wizard-header .close-btn {
      position: absolute;
      top: 1rem;
      right: 1rem;
      background: rgba(255, 255, 255, 0.2);
      color: #fff;
      border: none;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      font-size: 1.25rem;
      cursor: pointer;
    }

    .wizard-progress {
      padding: 1.5rem 2rem;
      background: #f8f9fa;
      border-bottom: 1px solid #e0e0e0;
    }

    .progress-steps {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .step {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
    }

    .step-number {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: #e0e0e0;
      color: #666;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      transition: all 0.3s;
    }

    .step.active .step-number {
      background: #247090;
      color: #fff;
    }

    .step.completed .step-number {
      background: #10b981;
      color: #fff;
    }

    .step-label {
      font-size: 0.75rem;
      color: #666;
      font-weight: 500;
    }

    .step.active .step-label {
      color: #247090;
      font-weight: 600;
    }

    .step-connector {
      width: 60px;
      height: 3px;
      background: #e0e0e0;
      margin: 0 0.5rem;
      margin-bottom: 1.5rem;
      transition: background 0.3s;
    }

    .step-connector.active {
      background: #10b981;
    }

    .wizard-body {
      padding: 2rem;
      overflow-y: auto;
      flex: 1;
    }

    .step-content h3 {
      font-size: 1.25rem;
      margin-bottom: 0.5rem;
      color: #1a1a1a;
    }

    .step-description {
      color: #666;
      margin-bottom: 1.5rem;
    }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1rem;
    }

    .form-group.full-width {
      grid-column: 1 / -1;
    }

    .form-group {
      position: relative;
    }

    .form-group label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 600;
      color: #333;
      font-size: 0.9rem;
    }

    .form-group input,
    .form-group textarea {
      width: 100%;
      padding: 0.875rem 1rem;
      border: 2px solid #e0e0e0;
      border-radius: 10px;
      font-size: 0.95rem;
      transition: border-color 0.2s, box-shadow 0.2s;
    }

    .form-group input:focus,
    .form-group textarea:focus {
      outline: none;
      border-color: #247090;
      box-shadow: 0 0 0 4px rgba(36, 112, 144, 0.1);
    }

    .input-icon {
      position: absolute;
      right: 1rem;
      top: 50%;
      font-size: 1.25rem;
      opacity: 0.5;
    }

    .input-with-icon {
      position: relative;
    }

    .input-with-icon .prefix-icon {
      position: absolute;
      left: 1rem;
      top: 50%;
      transform: translateY(-50%);
      font-size: 1.25rem;
    }

    .input-with-icon input {
      padding-left: 3rem;
    }

    .premium-file-upload {
      position: relative;
    }

    .premium-file-upload input[type="file"] {
      position: absolute;
      opacity: 0;
      width: 100%;
      height: 100%;
      cursor: pointer;
      z-index: 2;
    }

    .premium-file-upload label {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.5rem;
      border: 2px dashed #e0e0e0;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.2s;
      background: #f8f9fa;
    }

    .premium-file-upload:hover label {
      border-color: #247090;
      background: rgba(36, 112, 144, 0.05);
    }

    .premium-file-upload.has-file label {
      border-color: #10b981;
      background: rgba(16, 185, 129, 0.05);
    }

    .upload-icon {
      font-size: 2rem;
    }

    .upload-text {
      display: flex;
      flex-direction: column;
    }

    .upload-text .primary-text {
      font-weight: 600;
      color: #333;
    }

    .upload-text .secondary-text {
      font-size: 0.85rem;
      color: #666;
    }

    .upload-text .file-name {
      color: #10b981;
      font-weight: 600;
    }

    .char-count {
      position: absolute;
      right: 0.75rem;
      bottom: 0.75rem;
      font-size: 0.8rem;
      color: #999;
    }

    /* Review Step */
    .review-sections {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .review-section {
      background: #f8f9fa;
      border-radius: 12px;
      padding: 1.25rem;
    }

    .review-section h4 {
      font-size: 0.9rem;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 1rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid #e0e0e0;
    }

    .review-item {
      display: flex;
      justify-content: space-between;
      padding: 0.5rem 0;
    }

    .review-item .label {
      color: #666;
    }

    .review-item .value {
      font-weight: 500;
      color: #333;
    }

    .review-item .value.success {
      color: #10b981;
    }

    .application-note {
      display: flex;
      gap: 0.75rem;
      padding: 1rem;
      background: #e3f2fd;
      border-radius: 10px;
      margin-top: 1.5rem;
    }

    .application-note .note-icon {
      font-size: 1.25rem;
    }

    .application-note p {
      font-size: 0.9rem;
      color: #1976d2;
      margin: 0;
    }

    /* Payment Step Styles */
    .payment-step {
      padding: 1rem;
    }

    .payment-summary {
      background: linear-gradient(135deg, #247090 0%, #1a5570 100%);
      border-radius: 12px;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
    }

    .fee-display {
      display: flex;
      justify-content: space-between;
      align-items: center;
      color: white;
    }

    .fee-label {
      font-size: 1rem;
      opacity: 0.9;
    }

    .fee-amount {
      font-size: 1.5rem;
      font-weight: 700;
    }

    .payment-instructions {
      background: #fff3cd;
      border-radius: 10px;
      padding: 1rem 1.25rem;
      margin-bottom: 1.5rem;
    }

    .payment-instructions h4 {
      font-size: 0.95rem;
      font-weight: 600;
      color: #856404;
      margin-bottom: 0.5rem;
    }

    .payment-instructions p {
      font-size: 0.9rem;
      color: #856404;
      margin: 0;
      line-height: 1.5;
    }

    .payment-details {
      background: #f8f9fa;
      border-radius: 12px;
      padding: 1.25rem;
      margin-bottom: 1rem;
    }

    .payment-details h4 {
      font-size: 0.9rem;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 1rem;
    }

    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 0.5rem 0;
      border-bottom: 1px solid #eee;
    }

    .detail-row:last-child {
      border-bottom: none;
    }

    .detail-row span {
      color: #666;
    }

    .detail-row strong {
      color: #333;
      font-weight: 600;
    }

    .payment-actions {
      display: flex;
      justify-content: center;
      margin: 1.5rem 0;
    }

    .whatsapp-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.875rem 1.5rem;
      background: #25d366;
      color: white;
      border-radius: 10px;
      font-weight: 600;
      text-decoration: none;
      transition: all 0.3s ease;
    }

    .whatsapp-btn:hover {
      background: #128c7e;
      transform: translateY(-2px);
    }

    .screenshot-upload {
      background: #f8f9fa;
      border-radius: 12px;
      padding: 1.25rem;
    }

    .screenshot-upload h4 {
      font-size: 0.95rem;
      font-weight: 600;
      margin-bottom: 0.5rem;
    }

    .upload-hint {
      font-size: 0.85rem;
      color: #666;
      margin-bottom: 1rem;
    }

    .upload-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.25rem;
      background: linear-gradient(135deg, #247090 0%, #1a5570 100%);
      color: white;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .upload-btn:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 4px 15px rgba(36, 112, 144, 0.3);
    }

    .upload-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .screenshot-preview {
      margin-top: 1rem;
      border-radius: 8px;
      overflow: hidden;
      border: 2px solid #e0e0e0;
    }

    .screenshot-preview img {
      width: 100%;
      max-height: 200px;
      object-fit: contain;
    }

    .spinner-small {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255,255,255,0.3);
      border-radius: 50%;
      border-top-color: white;
      animation: spin 1s ease-in-out infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .wizard-footer {
      display: flex;
      align-items: center;
      padding: 1.5rem 2rem;
      border-top: 1px solid #e0e0e0;
      background: #f8f9fa;
    }

    .footer-spacer {
      flex: 1;
    }

    .back-btn {
      padding: 0.875rem 1.5rem;
      border: 2px solid #e0e0e0;
      background: #fff;
      border-radius: 10px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    .back-btn:hover {
      border-color: #247090;
      color: #247090;
    }

    .next-btn {
      padding: 0.875rem 2rem;
      border: none;
      background: #247090;
      color: #fff;
      border-radius: 10px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    .next-btn:disabled {
      background: #ccc;
      cursor: not-allowed;
    }

    .next-btn:not(:disabled):hover {
      background: #1a5570;
    }

    .submit-btn {
      padding: 0.875rem 2rem;
      border: none;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: #fff;
      border-radius: 10px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .submit-btn:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }

    .spinner-small {
      width: 18px;
      height: 18px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @media (max-width: 600px) {
      .step-label {
        display: none;
      }
      
      .step-connector {
        width: 30px;
        margin-bottom: 0;
      }

      .form-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class InternshipDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private internshipService = inject(InternshipService);
  private authService = inject(AuthService);
  private toastr = inject(ToastrService);
  private settingsService = inject(AdminSettingsService);
  private fileUploadService = inject(FileUploadService);
  mediaService = inject(MediaService);

  loading = signal(true);
  submitting = signal(false);
  internship = signal<InternshipDetail | null>(null);
  showApplyModal = false;
  isLoggedIn = signal(false);
  hasApplied = signal(false);
  applicationStep = 1;

  // Payment-related signals
  paymentSettings = signal<any>(null);
  paymentScreenshotUrl = signal('');
  uploadingScreenshot = signal(false);

  application = {
    name: '',
    email: '',
    phone: '',
    coverLetter: '',
    portfolio: '',
    linkedIn: '',
    github: '',
    resumeUrl: ''
  };

  ngOnInit() {
    this.isLoggedIn.set(!!this.authService.getCurrentUser());
    this.loadInternship();
  }

  loadInternship() {
    this.loading.set(true);
    const slug = this.route.snapshot.paramMap.get('slug');
    
    if (!slug) {
      this.router.navigate(['/internships']);
      return;
    }

    // Try loading by slug first, then by ID
    this.internshipService.getInternshipBySlug(slug).subscribe({
      next: (internship) => {
        if (internship) {
          this.setInternshipData(internship);
        } else {
          // Try as ID
          this.internshipService.getInternship(slug).subscribe({
            next: (internshipById) => {
              if (internshipById) {
                this.setInternshipData(internshipById);
              } else {
                this.toastr.error('Internship not found');
                this.loading.set(false);
              }
            },
            error: () => {
              this.toastr.error('Failed to load internship');
              this.loading.set(false);
            }
          });
        }
      },
      error: () => {
        // Try as ID
        this.internshipService.getInternship(slug).subscribe({
          next: (internshipById) => {
            if (internshipById) {
              this.setInternshipData(internshipById);
            } else {
              this.toastr.error('Internship not found');
              this.loading.set(false);
            }
          },
          error: () => {
            this.toastr.error('Failed to load internship');
            this.loading.set(false);
          }
        });
      }
    });
  }

  setInternshipData(internship: any) {
    this.internship.set({
      id: internship.id,
      title: internship.nameEn || internship.title || '',
      company: internship.companyName || internship.company || '',
      companyLogo: internship.companyLogoUrl || internship.companyLogo || '',
      companyDescription: internship.descriptionEn || '',
      location: internship.location || '',
      type: internship.isRemote ? 'Remote' : 'OnSite',
      duration: `${internship.durationInWeeks || 4} weeks`,
      description: internship.descriptionEn || '',
      responsibilities: internship.responsibilitiesEn?.split('\n').filter((r: string) => r.trim()) || [],
      requirements: internship.requirementsEn?.split('\n').filter((r: string) => r.trim()) || [],
      benefits: internship.benefitsEn?.split('\n').filter((b: string) => b.trim()) || [],
      skills: [],
      postedAt: new Date(internship.createdAt),
      deadline: internship.applicationDeadline ? new Date(internship.applicationDeadline) : new Date(),
      applicants: internship.applicationCount || 0,
      isPaid: internship.isPaid,
      stipend: internship.stipend,
      hasFee: internship.hasFee,
      feeAmount: internship.feeAmount,
      currency: internship.currency || 'EGP'
    });

    // Check if user has already applied
    if (this.isLoggedIn()) {
      this.checkApplicationStatus(internship.id);
    }
    this.loading.set(false);
  }

  checkApplicationStatus(internshipId: string) {
    this.internshipService.getMyApplications().subscribe({
      next: (applications) => {
        this.hasApplied.set(applications.some(a => a.internshipId === internshipId));
      }
    });
  }

  openApplyModal() {
    if (!this.isLoggedIn()) {
      this.toastr.info('Please login to apply for internships');
      this.router.navigate(['/auth/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }
    
    // Pre-fill with user data
    const user = this.authService.getCurrentUser();
    if (user) {
      this.application.name = `${user.firstName} ${user.lastName}`;
      this.application.email = user.email || '';
    }
    
    // Load payment settings if internship has fee
    if (this.internship()?.hasFee) {
      this.loadPaymentSettings();
    }
    
    this.showApplyModal = true;
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
            this.toastr.success('Payment screenshot uploaded successfully');
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

  getWhatsAppPaymentLink(): string {
    const whatsappNumber = this.paymentSettings()?.['payment.whatsappNumber']?.value || '201029907297';
    const message = encodeURIComponent(`Hi, I want to apply for the internship: ${this.internship()?.title}\nFee: ${this.internship()?.currency || 'EGP'} ${this.internship()?.feeAmount}`);
    return `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=${message}`;
  }

  getTotalSteps(): number {
    return this.internship()?.hasFee ? 5 : 4;
  }

  // Wizard step navigation
  nextStep() {
    if (this.canProceed() && this.applicationStep < this.getTotalSteps()) {
      this.applicationStep++;
    }
  }

  previousStep() {
    if (this.applicationStep > 1) {
      this.applicationStep--;
    }
  }

  canProceed(): boolean {
    switch (this.applicationStep) {
      case 1:
        // Step 1: Personal info - name, email, phone required
        return !!(this.application.name.trim() && 
                  this.application.email.trim() && 
                  this.application.phone.trim());
      case 2:
        // Step 2: Resume required, cover letter optional
        return !!this.application.resumeUrl;
      case 3:
        // Step 3: Profile links - all optional
        return true;
      case 4:
        // Step 4: Review - all good
        return true;
      default:
        return false;
    }
  }

  onResumeSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      
      // Validate file type
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        this.toastr.error('Please upload a PDF or Word document');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.toastr.error('File size must be less than 5MB');
        return;
      }
      
      // For now, create a local URL. In production, you'd upload to server
      // You can integrate with FileUploadService if available
      this.application.resumeUrl = URL.createObjectURL(file);
      this.toastr.success(`Resume "${file.name}" selected`);
    }
  }

  submitApplication() {
    if (!this.internship()) return;
    
    this.submitting.set(true);
    
    const applicationDto: ApplyInternshipDto = {
      coverLetter: this.application.coverLetter,
      resumeUrl: this.application.resumeUrl,
      portfolioUrl: this.application.portfolio,
      linkedInUrl: this.application.linkedIn,
      gitHubUrl: this.application.github,
      paymentScreenshotUrl: this.paymentScreenshotUrl() || undefined
    };

    this.internshipService.applyForInternship(this.internship()!.id.toString(), applicationDto).subscribe({
      next: (response: any) => {
        if (response) {
          this.toastr.success('Application submitted successfully!');
          this.showApplyModal = false;
          this.hasApplied.set(true);
          this.applicationStep = 1; // Reset wizard
          this.paymentScreenshotUrl.set(''); // Reset payment screenshot
          this.application = {
            name: '',
            email: '',
            phone: '',
            coverLetter: '',
            portfolio: '',
            linkedIn: '',
            github: '',
            resumeUrl: ''
          };
        } else {
          this.toastr.error('Failed to submit application');
        }
        this.submitting.set(false);
      },
      error: () => {
        this.toastr.error('Failed to submit application');
        this.submitting.set(false);
      }
    });
  }
}
