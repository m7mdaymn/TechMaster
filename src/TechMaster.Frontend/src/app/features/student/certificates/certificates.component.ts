import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { CertificateService, Certificate as APICertificate } from '../../../core/services/certificate.service';
import { ToastrService } from 'ngx-toastr';

interface Certificate {
  id: string;
  certificateNumber: string;
  courseTitle: string;
  courseThumbnail: string;
  issuedDate: Date;
  instructorName: string;
  grade: string;
  downloadUrl: string;
}

@Component({
  selector: 'app-student-certificates',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="certificates-page">
      <div class="page-header">
        <div class="header-content">
          <h1>My Certificates</h1>
          <p>View and download your earned certificates</p>
        </div>
      </div>

      @if (loading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Loading...</p>
        </div>
      } @else if (certificates().length === 0) {
        <div class="empty-state">
          <div class="empty-icon">🏆</div>
          <h3>No Certificates Yet</h3>
          <p>Complete a course to earn your first certificate</p>
          <a routerLink="/courses" class="cta-btn">
            Start a Course
          </a>
        </div>
      } @else {
        <div class="certificates-grid">
          @for (certificate of certificates(); track certificate.id) {
            <div class="certificate-card">
              <div class="certificate-preview">
                <div class="certificate-frame">
                  <div class="certificate-content">
                    <div class="certificate-header">
                      <span class="logo-icon">🎓</span>
                      <span class="logo-text">TechMaster</span>
                    </div>
                    <h4 class="certificate-title">Certificate of</h4>
                    <h3 class="completion-text">Completion</h3>
                    <p class="recipient-name">{{ authService.getCurrentUser()?.fullName }}</p>
                    <p class="course-name">{{ certificate.courseTitle }}</p>
                    <div class="certificate-footer">
                      <span class="certificate-number">#{{ certificate.certificateNumber }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="certificate-details">
                <div class="course-info">
                  <img [src]="certificate.courseThumbnail || 'assets/images/course-placeholder.jpg'" [alt]="certificate.courseTitle">
                  <div class="info-text">
                    <h4>{{ certificate.courseTitle }}</h4>
                    <span class="instructor">{{ certificate.instructorName }}</span>
                  </div>
                </div>

                <div class="meta-info">
                  <div class="meta-item">
                    <span class="label">Issued Date</span>
                    <span class="value">{{ certificate.issuedDate | date:'mediumDate' }}</span>
                  </div>
                  <div class="meta-item">
                    <span class="label">Grade</span>
                    <span class="value grade">{{ certificate.grade }}</span>
                  </div>
                  <div class="meta-item">
                    <span class="label">Certificate ID</span>
                    <span class="value">{{ certificate.certificateNumber }}</span>
                  </div>
                </div>

                <div class="card-actions">
                  <a [href]="certificate.downloadUrl" download class="download-btn">
                    <span class="icon">📥</span>
                    Download
                  </a>
                  <button class="share-btn" (click)="shareCertificate(certificate)">
                    <span class="icon">🔗</span>
                    Share
                  </button>
                  <a [routerLink]="['/verify-certificate', certificate.certificateNumber]" class="verify-btn">
                    <span class="icon">✓</span>
                    Verify
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
    .certificates-page {
      max-width: 1400px;
      margin: 0 auto;
      padding: 2rem;
    }

    .page-header {
      margin-bottom: 2rem;
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

    .certificates-grid {
      display: grid;
      gap: 2rem;
    }

    .certificate-card {
      background: #fff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      display: grid;
      grid-template-columns: 400px 1fr;
    }

    .certificate-preview {
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      padding: 2rem;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .certificate-frame {
      background: linear-gradient(135deg, #fff9e6 0%, #fff5d6 100%);
      border: 8px solid #d4af37;
      border-radius: 8px;
      padding: 1.5rem;
      width: 100%;
      max-width: 300px;
      aspect-ratio: 4/3;
      display: flex;
      flex-direction: column;
      position: relative;
    }

    .certificate-frame::before {
      content: '';
      position: absolute;
      inset: 8px;
      border: 2px solid #d4af37;
      border-radius: 4px;
      pointer-events: none;
    }

    .certificate-content {
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
    }

    .certificate-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.75rem;
    }

    .logo-icon {
      font-size: 1.5rem;
    }

    .logo-text {
      font-size: 1rem;
      font-weight: 700;
      color: #333;
    }

    .certificate-title {
      font-size: 0.7rem;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 2px;
      margin-bottom: 0.25rem;
    }

    .completion-text {
      font-size: 1.25rem;
      font-weight: 700;
      color: #000;
      margin-bottom: 0.75rem;
    }

    .recipient-name {
      font-size: 0.9rem;
      font-weight: 600;
      color: #247090;
      margin-bottom: 0.25rem;
    }

    .course-name {
      font-size: 0.75rem;
      color: #666;
      line-height: 1.4;
    }

    .certificate-footer {
      margin-top: auto;
      padding-top: 0.5rem;
    }

    .certificate-number {
      font-size: 0.65rem;
      color: #999;
      font-family: monospace;
    }

    .certificate-details {
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .course-info {
      display: flex;
      gap: 1rem;
      align-items: center;
    }

    .course-info img {
      width: 80px;
      height: 60px;
      object-fit: cover;
      border-radius: 8px;
    }

    .info-text h4 {
      font-size: 1.1rem;
      font-weight: 700;
      color: #000;
      margin-bottom: 0.25rem;
    }

    .instructor {
      font-size: 0.9rem;
      color: #666;
    }

    .meta-info {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1rem;
    }

    .meta-item {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .meta-item .label {
      font-size: 0.8rem;
      color: #999;
    }

    .meta-item .value {
      font-size: 0.95rem;
      font-weight: 600;
      color: #333;
    }

    .meta-item .grade {
      color: #28a745;
    }

    .card-actions {
      display: flex;
      gap: 0.75rem;
      margin-top: auto;
      flex-wrap: wrap;
    }

    .download-btn, .share-btn, .verify-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.625rem 1rem;
      border-radius: 8px;
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      text-decoration: none;
      transition: all 0.3s ease;
    }

    .download-btn {
      background: linear-gradient(135deg, #247090 0%, #1a5570 100%);
      color: #fff;
      border: none;
    }

    .download-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 15px rgba(36, 112, 144, 0.3);
    }

    .share-btn {
      background: #f8f9fa;
      color: #333;
      border: none;
    }

    .share-btn:hover {
      background: #e0e0e0;
    }

    .verify-btn {
      background: transparent;
      color: #247090;
      border: 2px solid #247090;
    }

    .verify-btn:hover {
      background: #247090;
      color: #fff;
    }

    @media (max-width: 992px) {
      .certificate-card {
        grid-template-columns: 1fr;
      }

      .certificate-preview {
        padding: 1.5rem;
      }

      .certificate-frame {
        max-width: 280px;
      }
    }

    @media (max-width: 576px) {
      .certificates-page {
        padding: 1rem;
      }

      .meta-info {
        grid-template-columns: 1fr 1fr;
      }

      .card-actions {
        flex-direction: column;
      }

      .download-btn, .share-btn, .verify-btn {
        width: 100%;
        justify-content: center;
      }
    }
  `]
})
export class StudentCertificatesComponent implements OnInit {
  authService = inject(AuthService);
  private certificateService = inject(CertificateService);
  private toastr = inject(ToastrService);

  loading = signal(true);
  certificates = signal<Certificate[]>([]);

  ngOnInit() {
    this.loadCertificates();
  }

  loadCertificates() {
    this.loading.set(true);
    this.certificateService.getMyCertificates().subscribe({
      next: (certs) => {
        const mappedCerts: Certificate[] = certs.map(c => ({
          id: c.id,
          certificateNumber: c.certificateNumber,
          courseTitle: c.courseName,
          courseThumbnail: 'assets/images/courses/default.jpg',
          issuedDate: new Date(c.issueDate || new Date()),
          instructorName: 'TechMaster',
          grade: c.grade || 'A',
          downloadUrl: (c as any).downloadUrl || '#'
        }));
        this.certificates.set(mappedCerts);
        this.loading.set(false);
      },
      error: () => {
        this.toastr.error('Failed to load certificates');
        this.loading.set(false);
      }
    });
  }

  shareCertificate(certificate: Certificate) {
    const shareUrl = `${window.location.origin}/verify-certificate/${certificate.certificateNumber}`;
    
    if (navigator.share) {
      navigator.share({
        title: 'TechMaster Certificate',
        text: `Check out my certificate for ${certificate.courseTitle}!`,
        url: shareUrl
      });
    } else {
      navigator.clipboard.writeText(shareUrl);
      this.toastr.success('Link copied to clipboard!');
    }
  }

  downloadCertificate(certificate: Certificate) {
    this.certificateService.downloadCertificate(certificate.id).subscribe({
      next: (blob) => {
        if (blob) {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `certificate-${certificate.certificateNumber}.pdf`;
          a.click();
          window.URL.revokeObjectURL(url);
        } else {
          this.toastr.error('Failed to download certificate');
        }
      }
    });
  }
}
