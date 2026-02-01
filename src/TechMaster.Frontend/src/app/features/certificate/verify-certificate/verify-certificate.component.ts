import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

interface CertificateVerification {
  isValid: boolean;
  certificateNumber: string;
  studentName: string;
  courseName: string;
  instructorName: string;
  issueDate: Date;
  completionDate: Date;
  grade: string;
}

@Component({
  selector: 'app-verify-certificate',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  template: `
    <div class="verify-page">
      <div class="container">
        <!-- Header -->
        <div class="header">
          <h1>{{ 'VERIFY.TITLE' | translate }}</h1>
          <p>{{ 'VERIFY.SUBTITLE' | translate }}</p>
        </div>

        <!-- Search Form -->
        <div class="search-card">
          <form (ngSubmit)="verifyCertificate()">
            <label>{{ 'VERIFY.CERTIFICATE_NUMBER' | translate }}</label>
            <div class="search-input">
              <input 
                type="text" 
                [(ngModel)]="certificateNumber" 
                name="certificateNumber"
                [placeholder]="'VERIFY.PLACEHOLDER' | translate"
                required
              >
              <button type="submit" [disabled]="isVerifying()">
                @if (isVerifying()) {
                  <span class="spinner"></span>
                } @else {
                  {{ 'VERIFY.VERIFY_BTN' | translate }}
                }
              </button>
            </div>
            <p class="hint">{{ 'VERIFY.HINT' | translate }}</p>
          </form>
        </div>

        <!-- Result -->
        @if (result()) {
          <div class="result-card" [class.valid]="result()?.isValid" [class.invalid]="!result()?.isValid">
            @if (result()?.isValid) {
              <!-- Valid Certificate -->
              <div class="result-header valid">
                <span class="icon">✓</span>
                <h2>{{ 'VERIFY.VALID_TITLE' | translate }}</h2>
              </div>

              <div class="certificate-preview">
                <div class="certificate-frame">
                  <div class="certificate-content">
                    <div class="logo">TM</div>
                    <h3>{{ 'VERIFY.CERTIFICATE_OF_COMPLETION' | translate }}</h3>
                    <p class="presented">{{ 'VERIFY.PRESENTED_TO' | translate }}</p>
                    <h2 class="student-name">{{ result()?.studentName }}</h2>
                    <p class="completion-text">{{ 'VERIFY.COMPLETION_TEXT' | translate }}</p>
                    <h4 class="course-name">{{ result()?.courseName }}</h4>
                    <div class="certificate-details">
                      <div class="detail">
                        <span class="label">{{ 'VERIFY.INSTRUCTOR' | translate }}</span>
                        <span class="value">{{ result()?.instructorName }}</span>
                      </div>
                      <div class="detail">
                        <span class="label">{{ 'VERIFY.GRADE' | translate }}</span>
                        <span class="value">{{ result()?.grade }}</span>
                      </div>
                      <div class="detail">
                        <span class="label">{{ 'VERIFY.ISSUE_DATE' | translate }}</span>
                        <span class="value">{{ result()?.issueDate | date:'longDate' }}</span>
                      </div>
                    </div>
                    <div class="certificate-number">
                      {{ 'VERIFY.CERT_NO' | translate }}: {{ result()?.certificateNumber }}
                    </div>
                  </div>
                </div>
              </div>

              <div class="result-info">
                <div class="info-grid">
                  <div class="info-item">
                    <span class="label">{{ 'VERIFY.STUDENT_NAME' | translate }}</span>
                    <span class="value">{{ result()?.studentName }}</span>
                  </div>
                  <div class="info-item">
                    <span class="label">{{ 'VERIFY.COURSE_NAME' | translate }}</span>
                    <span class="value">{{ result()?.courseName }}</span>
                  </div>
                  <div class="info-item">
                    <span class="label">{{ 'VERIFY.INSTRUCTOR' | translate }}</span>
                    <span class="value">{{ result()?.instructorName }}</span>
                  </div>
                  <div class="info-item">
                    <span class="label">{{ 'VERIFY.COMPLETION_DATE' | translate }}</span>
                    <span class="value">{{ result()?.completionDate | date:'mediumDate' }}</span>
                  </div>
                  <div class="info-item">
                    <span class="label">{{ 'VERIFY.ISSUE_DATE' | translate }}</span>
                    <span class="value">{{ result()?.issueDate | date:'mediumDate' }}</span>
                  </div>
                  <div class="info-item">
                    <span class="label">{{ 'VERIFY.GRADE' | translate }}</span>
                    <span class="value grade">{{ result()?.grade }}</span>
                  </div>
                </div>
              </div>
            } @else {
              <!-- Invalid Certificate -->
              <div class="result-header invalid">
                <span class="icon">✕</span>
                <h2>{{ 'VERIFY.INVALID_TITLE' | translate }}</h2>
              </div>
              <p class="invalid-message">{{ 'VERIFY.INVALID_MESSAGE' | translate }}</p>
              <div class="invalid-reasons">
                <h4>{{ 'VERIFY.POSSIBLE_REASONS' | translate }}</h4>
                <ul>
                  <li>{{ 'VERIFY.REASON1' | translate }}</li>
                  <li>{{ 'VERIFY.REASON2' | translate }}</li>
                  <li>{{ 'VERIFY.REASON3' | translate }}</li>
                </ul>
              </div>
              <p class="contact-help">
                {{ 'VERIFY.CONTACT_HELP' | translate }}
                <a href="mailto:support@techmaster.com">support&#64;techmaster.com</a>
              </p>
            }
          </div>
        }

        <!-- How It Works -->
        <div class="how-it-works">
          <h3>{{ 'VERIFY.HOW_TITLE' | translate }}</h3>
          <div class="steps">
            <div class="step">
              <span class="step-number">1</span>
              <h4>{{ 'VERIFY.STEP1_TITLE' | translate }}</h4>
              <p>{{ 'VERIFY.STEP1_DESC' | translate }}</p>
            </div>
            <div class="step">
              <span class="step-number">2</span>
              <h4>{{ 'VERIFY.STEP2_TITLE' | translate }}</h4>
              <p>{{ 'VERIFY.STEP2_DESC' | translate }}</p>
            </div>
            <div class="step">
              <span class="step-number">3</span>
              <h4>{{ 'VERIFY.STEP3_TITLE' | translate }}</h4>
              <p>{{ 'VERIFY.STEP3_DESC' | translate }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .verify-page {
      min-height: 100vh;
      background: #f8f9fa;
      padding: 3rem 1.5rem;
    }

    .container {
      max-width: 800px;
      margin: 0 auto;
    }

    .header {
      text-align: center;
      margin-bottom: 2rem;
    }

    .header h1 {
      font-size: 2rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
    }

    .header p {
      color: #666;
    }

    .search-card {
      background: #fff;
      border-radius: 16px;
      padding: 2rem;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      margin-bottom: 2rem;
    }

    .search-card label {
      display: block;
      font-weight: 600;
      margin-bottom: 0.75rem;
    }

    .search-input {
      display: flex;
      gap: 0.5rem;
    }

    .search-input input {
      flex: 1;
      padding: 0.875rem 1rem;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      font-size: 1rem;
      transition: border-color 0.2s;
    }

    .search-input input:focus {
      outline: none;
      border-color: #247090;
    }

    .search-input button {
      padding: 0.875rem 1.5rem;
      background: #247090;
      color: #fff;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      transition: background 0.2s;
    }

    .search-input button:hover:not(:disabled) {
      background: #1a5570;
    }

    .search-input button:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }

    .spinner {
      width: 18px;
      height: 18px;
      border: 2px solid #fff;
      border-top-color: transparent;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .hint {
      font-size: 0.85rem;
      color: #666;
      margin-top: 0.75rem;
    }

    .result-card {
      background: #fff;
      border-radius: 16px;
      padding: 2rem;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      margin-bottom: 2rem;
    }

    .result-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1.5rem;
      padding-bottom: 1.5rem;
      border-bottom: 1px solid #e0e0e0;
    }

    .result-header.valid .icon {
      width: 48px;
      height: 48px;
      background: #28a745;
      color: #fff;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      font-weight: 700;
    }

    .result-header.invalid .icon {
      width: 48px;
      height: 48px;
      background: #dc3545;
      color: #fff;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      font-weight: 700;
    }

    .result-header h2 {
      font-size: 1.25rem;
      font-weight: 600;
    }

    .result-header.valid h2 {
      color: #28a745;
    }

    .result-header.invalid h2 {
      color: #dc3545;
    }

    .certificate-preview {
      margin-bottom: 2rem;
    }

    .certificate-frame {
      background: linear-gradient(135deg, #f7e7ce 0%, #fff8e7 50%, #f7e7ce 100%);
      border: 3px solid #d4af37;
      border-radius: 12px;
      padding: 2rem;
      position: relative;
    }

    .certificate-frame::before {
      content: '';
      position: absolute;
      inset: 8px;
      border: 1px solid #d4af37;
      border-radius: 8px;
      pointer-events: none;
    }

    .certificate-content {
      text-align: center;
    }

    .certificate-content .logo {
      font-size: 1.5rem;
      font-weight: 700;
      color: #247090;
      margin-bottom: 0.5rem;
    }

    .certificate-content h3 {
      font-size: 0.9rem;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: #666;
      margin-bottom: 1rem;
    }

    .certificate-content .presented {
      font-size: 0.85rem;
      color: #666;
      margin-bottom: 0.5rem;
    }

    .certificate-content .student-name {
      font-size: 1.75rem;
      font-weight: 700;
      color: #000;
      margin-bottom: 0.5rem;
      font-family: 'Georgia', serif;
    }

    .certificate-content .completion-text {
      font-size: 0.9rem;
      color: #666;
      margin-bottom: 0.5rem;
    }

    .certificate-content .course-name {
      font-size: 1.25rem;
      font-weight: 600;
      color: #247090;
      margin-bottom: 1.5rem;
    }

    .certificate-details {
      display: flex;
      justify-content: center;
      gap: 2rem;
      margin-bottom: 1rem;
    }

    .certificate-details .detail {
      text-align: center;
    }

    .certificate-details .label {
      display: block;
      font-size: 0.75rem;
      color: #666;
      text-transform: uppercase;
    }

    .certificate-details .value {
      font-weight: 600;
      font-size: 0.9rem;
    }

    .certificate-number {
      font-size: 0.8rem;
      color: #666;
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px dashed #d4af37;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
    }

    .info-item {
      padding: 1rem;
      background: #f8f9fa;
      border-radius: 8px;
    }

    .info-item .label {
      display: block;
      font-size: 0.8rem;
      color: #666;
      margin-bottom: 0.25rem;
    }

    .info-item .value {
      font-weight: 600;
    }

    .info-item .value.grade {
      color: #28a745;
    }

    .invalid-message {
      color: #666;
      margin-bottom: 1.5rem;
    }

    .invalid-reasons {
      background: #fff5f5;
      padding: 1.5rem;
      border-radius: 8px;
      margin-bottom: 1.5rem;
    }

    .invalid-reasons h4 {
      font-size: 0.9rem;
      font-weight: 600;
      margin-bottom: 0.75rem;
    }

    .invalid-reasons ul {
      margin: 0;
      padding-left: 1.25rem;
    }

    .invalid-reasons li {
      color: #666;
      font-size: 0.9rem;
      margin-bottom: 0.5rem;
    }

    .contact-help {
      font-size: 0.9rem;
      color: #666;
    }

    .contact-help a {
      color: #247090;
      font-weight: 600;
    }

    .how-it-works {
      background: #fff;
      border-radius: 16px;
      padding: 2rem;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    }

    .how-it-works h3 {
      font-size: 1.25rem;
      font-weight: 600;
      text-align: center;
      margin-bottom: 2rem;
    }

    .steps {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 2rem;
    }

    .step {
      text-align: center;
    }

    .step-number {
      width: 40px;
      height: 40px;
      background: #247090;
      color: #fff;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      margin: 0 auto 1rem;
    }

    .step h4 {
      font-size: 1rem;
      font-weight: 600;
      margin-bottom: 0.5rem;
    }

    .step p {
      font-size: 0.9rem;
      color: #666;
    }

    @media (max-width: 768px) {
      .search-input {
        flex-direction: column;
      }

      .info-grid {
        grid-template-columns: 1fr;
      }

      .certificate-details {
        flex-direction: column;
        gap: 1rem;
      }

      .steps {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class VerifyCertificateComponent {
  private route = inject(ActivatedRoute);
  private translate = inject(TranslateService);

  certificateNumber = '';
  isVerifying = signal(false);
  result = signal<CertificateVerification | null>(null);

  ngOnInit() {
    const certNum = this.route.snapshot.queryParams['cert'];
    if (certNum) {
      this.certificateNumber = certNum;
      this.verifyCertificate();
    }
  }

  verifyCertificate() {
    if (!this.certificateNumber.trim()) return;

    this.isVerifying.set(true);
    this.result.set(null);

    // Simulate API call
    setTimeout(() => {
      // Mock response - in real app, call API
      if (this.certificateNumber.startsWith('TECH')) {
        this.result.set({
          isValid: true,
          certificateNumber: this.certificateNumber,
          studentName: 'Ahmed Mohamed Hassan',
          courseName: 'Full Stack Web Development Bootcamp',
          instructorName: 'Dr. Fatima Ali',
          issueDate: new Date('2024-01-15'),
          completionDate: new Date('2024-01-10'),
          grade: 'A+ (95%)'
        });
      } else {
        this.result.set({
          isValid: false,
          certificateNumber: this.certificateNumber,
          studentName: '',
          courseName: '',
          instructorName: '',
          issueDate: new Date(),
          completionDate: new Date(),
          grade: ''
        });
      }
      this.isVerifying.set(false);
    }, 1500);
  }
}
