import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CertificateService, Certificate } from '@core/services/certificate.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-admin-certificates',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  template: `
    <div class="certificates-page">
      <div class="page-header">
        <div class="header-left">
          <h1>Certificate Management</h1>
          <p class="subtitle">Manage and verify student certificates</p>
        </div>
        <div class="header-actions">
          <button class="export-btn" (click)="exportCertificates()">
            <span>📊</span>
            Export
          </button>
        </div>
      </div>

      <!-- Stats -->
      <div class="stats-row">
        <div class="stat-card">
          <span class="stat-icon">🏆</span>
          <div class="stat-info">
            <span class="stat-value">{{ totalCertificates | number }}</span>
            <span class="stat-label">Total Certificates</span>
          </div>
        </div>
        <div class="stat-card">
          <span class="stat-icon">✅</span>
          <div class="stat-info">
            <span class="stat-value">{{ validCertificates | number }}</span>
            <span class="stat-label">Valid</span>
          </div>
        </div>
        <div class="stat-card">
          <span class="stat-icon">📅</span>
          <div class="stat-info">
            <span class="stat-value">{{ thisMonthCertificates | number }}</span>
            <span class="stat-label">This Month</span>
          </div>
        </div>
        <div class="stat-card">
          <span class="stat-icon">🚫</span>
          <div class="stat-info">
            <span class="stat-value">{{ revokedCertificates | number }}</span>
            <span class="stat-label">Revoked</span>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="filters-bar">
        <div class="search-box">
          <span class="search-icon">🔍</span>
          <input 
            type="text" 
            [(ngModel)]="searchQuery" 
            (ngModelChange)="onSearchChange()"
            placeholder="Search certificates..."
          >
        </div>

        <div class="filter-tabs">
          @for (tab of statusTabs; track tab.value) {
            <button 
              [class.active]="activeStatus === tab.value" 
              (click)="setStatus(tab.value)"
            >
              {{ tab.label }}
            </button>
          }
        </div>

        <input 
          type="date" 
          [(ngModel)]="dateFilter" 
          (ngModelChange)="filterCertificates()"
        >
      </div>

      <!-- Certificates Table -->
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Certificate Number</th>
              <th>Student</th>
              <th>Course</th>
              <th>Issued Date</th>
              <th>Score</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (certificate of filteredCertificates(); track certificate.id) {
              <tr>
                <td>
                  <span class="cert-number">{{ certificate.certificateNumber }}</span>
                </td>
                <td>
                  <div class="student-cell">
                    <span class="student-name">{{ certificate.userName }}</span>
                  </div>
                </td>
                <td>
                  <div class="course-cell">
                    <span class="course-title">{{ certificate.courseName }}</span>
                    <span class="course-score" *ngIf="certificate.finalScore">Score: {{ certificate.finalScore }}%</span>
                  </div>
                </td>
                <td>{{ certificate.issuedAt | date:'mediumDate' }}</td>
                <td>{{ certificate.finalScore || 'N/A' }}{{ certificate.finalScore ? '%' : '' }}</td>
                <td>
                  <span class="status-badge" [class]="certificate.isValid ? 'valid' : 'revoked'">
                    {{ certificate.isValid ? 'Valid' : 'Revoked' }}
                  </span>
                </td>
                <td>
                  <div class="actions-cell">
                    <button class="action-btn" title="View" (click)="viewCertificate(certificate)">👁️</button>
                    <button class="action-btn" title="Verify" (click)="verifyCertificate(certificate)">🔍</button>
                    @if (certificate.isValid) {
                      <button class="action-btn danger" title="Revoke" (click)="revokeCertificate(certificate)">🚫</button>
                    }
                  </div>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="7" class="empty-state">
                  <span>🏆</span>
                  <p>No certificates found</p>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="pagination">
        <span class="page-info">
          Showing {{ (currentPage - 1) * pageSize + 1 }}-{{ Math.min(currentPage * pageSize, totalCount) }} 
          of {{ totalCount }}
        </span>
        <div class="page-controls">
          <button [disabled]="currentPage === 1" (click)="previousPage()">←</button>
          @for (page of getPages(); track page) {
            <button [class.active]="page === currentPage" (click)="goToPage(page)">{{ page }}</button>
          }
          <button [disabled]="currentPage === totalPages" (click)="nextPage()">→</button>
        </div>
      </div>
    </div>

    <!-- Certificate Preview Modal -->
    @if (showPreviewModal && selectedCertificate) {
      <div class="modal-overlay" (click)="closeModal()">
        <div class="modal preview-modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>Certificate Preview</h2>
            <button class="close-btn" (click)="closeModal()">×</button>
          </div>
          <div class="modal-body">
            <div class="certificate-preview">
              <div class="certificate-frame">
                <div class="cert-header">
                  <h3>TechMaster</h3>
                  <p>Certificate of Completion</p>
                </div>
                <div class="cert-body">
                  <p class="cert-text">This is to certify that</p>
                  <h2 class="cert-name">{{ selectedCertificate.userName }}</h2>
                  <p class="cert-text">has successfully completed</p>
                  <h3 class="cert-course">{{ selectedCertificate.courseName }}</h3>
                </div>
                <div class="cert-footer">
                  <div class="cert-info">
                    <span>Issued Date: {{ selectedCertificate.issueDate | date:'mediumDate' }}</span>
                    <span>Certificate Number: {{ selectedCertificate.certificateNumber }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="download-btn" (click)="downloadCertificate(selectedCertificate)">
              <span>📥</span>
              Download Certificate
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .certificates-page {
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

    .export-btn {
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
    }

    .stats-row {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .stat-card {
      background: #fff;
      border-radius: 12px;
      padding: 1.25rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
    }

    .stat-icon {
      font-size: 2rem;
    }

    .stat-value {
      font-size: 1.5rem;
      font-weight: 700;
      display: block;
    }

    .stat-label {
      font-size: 0.85rem;
      color: #666;
    }

    .filters-bar {
      display: flex;
      gap: 1rem;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
    }

    .search-box {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      background: #fff;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      flex: 1;
      min-width: 250px;
      max-width: 350px;
    }

    .search-box input {
      border: none;
      outline: none;
      width: 100%;
      font-size: 0.95rem;
    }

    .filter-tabs {
      display: flex;
      gap: 0.5rem;
      background: #f8f9fa;
      padding: 0.25rem;
      border-radius: 8px;
    }

    .filter-tabs button {
      padding: 0.625rem 1rem;
      border: none;
      background: transparent;
      border-radius: 6px;
      font-weight: 500;
      cursor: pointer;
    }

    .filter-tabs button.active {
      background: #fff;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    }

    input[type="date"] {
      padding: 0.75rem 1rem;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      font-size: 0.95rem;
      background: #fff;
    }

    .table-container {
      background: #fff;
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      overflow: hidden;
    }

    table {
      width: 100%;
      border-collapse: collapse;
    }

    th {
      text-align: left;
      padding: 1rem 1.25rem;
      background: #f8f9fa;
      font-weight: 600;
      font-size: 0.85rem;
      color: #666;
    }

    td {
      padding: 1rem 1.25rem;
      border-bottom: 1px solid #f0f0f0;
      vertical-align: middle;
    }

    tr:hover {
      background: #f8f9fa;
    }

    .cert-number {
      font-family: monospace;
      font-weight: 600;
      background: #f0f0f0;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
    }

    .student-cell, .course-cell {
      display: flex;
      flex-direction: column;
    }

    .student-name, .course-title {
      font-weight: 600;
    }

    .student-email, .course-instructor {
      font-size: 0.85rem;
      color: #666;
    }

    .course-title {
      max-width: 200px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .status-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.8rem;
      font-weight: 600;
    }

    .status-badge.valid {
      background: #d4edda;
      color: #155724;
    }

    .status-badge.revoked {
      background: #f8d7da;
      color: #721c24;
    }

    .status-badge.expired {
      background: #fff3cd;
      color: #856404;
    }

    .actions-cell {
      display: flex;
      gap: 0.25rem;
    }

    .action-btn {
      width: 32px;
      height: 32px;
      border: none;
      background: transparent;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.9rem;
      transition: background 0.2s;
    }

    .action-btn:hover {
      background: #f0f0f0;
    }

    .action-btn.success:hover {
      background: #d1fae5;
    }

    .action-btn.danger:hover {
      background: #fee2e2;
    }

    .empty-state {
      text-align: center;
      padding: 3rem !important;
      color: #666;
    }

    .empty-state span {
      font-size: 3rem;
      display: block;
      margin-bottom: 1rem;
    }

    .pagination {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 1.5rem;
    }

    .page-info {
      color: #666;
    }

    .page-controls {
      display: flex;
      gap: 0.25rem;
    }

    .page-controls button {
      width: 36px;
      height: 36px;
      border: 1px solid #e0e0e0;
      background: #fff;
      border-radius: 6px;
      cursor: pointer;
    }

    .page-controls button.active {
      background: #247090;
      color: #fff;
      border-color: #247090;
    }

    .page-controls button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
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
    }

    .modal {
      background: #fff;
      border-radius: 16px;
      width: 100%;
      max-width: 600px;
    }

    .preview-modal {
      max-width: 700px;
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

    .certificate-preview {
      display: flex;
      justify-content: center;
    }

    .certificate-frame {
      width: 100%;
      max-width: 500px;
      background: linear-gradient(135deg, #f8f4e6 0%, #fff9e6 100%);
      border: 8px solid;
      border-image: linear-gradient(135deg, #d4af37, #f4d03f, #d4af37) 1;
      padding: 2rem;
      text-align: center;
    }

    .cert-header h3 {
      font-size: 1.5rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
    }

    .cert-header p {
      font-size: 1rem;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 2px;
    }

    .cert-body {
      padding: 1.5rem 0;
    }

    .cert-text {
      color: #666;
      margin-bottom: 0.5rem;
    }

    .cert-name {
      font-size: 1.75rem;
      font-weight: 700;
      color: #247090;
      margin: 0.5rem 0;
    }

    .cert-course {
      font-size: 1.25rem;
      font-weight: 600;
      margin-top: 0.5rem;
    }

    .cert-footer {
      margin-top: 1.5rem;
      padding-top: 1rem;
      border-top: 1px solid #d4af37;
    }

    .cert-info {
      display: flex;
      justify-content: space-between;
      font-size: 0.8rem;
      color: #666;
    }

    .modal-footer {
      padding: 1.5rem;
      border-top: 1px solid #e0e0e0;
      text-align: center;
    }

    .download-btn {
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

    @media (max-width: 1200px) {
      .stats-row {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 768px) {
      .certificates-page {
        padding: 1rem;
      }

      .stats-row {
        grid-template-columns: 1fr;
      }

      .filters-bar {
        flex-direction: column;
      }

      .search-box {
        max-width: none;
      }

      .table-container {
        overflow-x: auto;
      }

      .cert-info {
        flex-direction: column;
        gap: 0.5rem;
      }

      .course-score {
        font-size: 0.85rem;
        color: #666;
      }
    }
  `]
})
export class AdminCertificatesComponent implements OnInit {
  private translate = inject(TranslateService);
  private certificateService = inject(CertificateService);
  private toastr = inject(ToastrService);

  certificates = signal<Certificate[]>([]);
  filteredCertificates = signal<Certificate[]>([]);
  isLoading = signal(false);

  searchQuery = '';
  activeStatus = 'all';
  dateFilter = '';
  currentPage = 1;
  pageSize = 20;
  totalCount = 0;
  totalPages = 1;

  totalCertificates = 0;
  validCertificates = 0;
  thisMonthCertificates = 0;
  revokedCertificates = 0;

  showPreviewModal = false;
  selectedCertificate: Certificate | null = null;

  Math = Math;

  statusTabs = [
    { value: 'all', label: 'All' },
    { value: 'Valid', label: 'Valid' },
    { value: 'Revoked', label: 'Revoked' }
  ];

  ngOnInit() {
    this.loadCertificates();
  }

  loadCertificates() {
    this.isLoading.set(true);
    const params: any = {
      pageNumber: this.currentPage,
      pageSize: this.pageSize
    };

    if (this.searchQuery) {
      params.search = this.searchQuery;
    }

    if (this.activeStatus === 'Valid') {
      params.isValid = true;
    } else if (this.activeStatus === 'Revoked') {
      params.isValid = false;
    }

    this.certificateService.getAllCertificates(params).subscribe({
      next: (result) => {
        this.certificates.set(result.items);
        this.totalCount = result.totalCount;
        this.totalPages = result.totalPages || Math.ceil(result.totalCount / this.pageSize);
        this.calculateStats();
        this.filterCertificates();
        this.isLoading.set(false);
      },
      error: () => {
        this.toastr.error('Failed to load certificates');
        this.isLoading.set(false);
      }
    });
  }

  calculateStats() {
    const all = this.certificates();
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    this.totalCertificates = this.totalCount || all.length;
    this.validCertificates = all.filter(c => c.isValid).length;
    this.revokedCertificates = all.filter(c => !c.isValid).length;
    this.thisMonthCertificates = all.filter(c => new Date(c.issuedAt) >= startOfMonth).length;
  }

  setStatus(status: string) {
    this.activeStatus = status;
    this.currentPage = 1;
    this.loadCertificates();
  }

  onSearchChange() {
    this.currentPage = 1;
    this.loadCertificates();
  }

  filterCertificates() {
    let result = this.certificates();

    if (this.dateFilter) {
      const filterDate = new Date(this.dateFilter);
      result = result.filter(c => {
        const issuedDate = new Date(c.issuedAt);
        return issuedDate >= filterDate;
      });
    }

    this.filteredCertificates.set(result);
  }

  viewCertificate(certificate: Certificate) {
    this.selectedCertificate = certificate;
    this.showPreviewModal = true;
  }

  verifyCertificate(certificate: Certificate) {
    this.certificateService.verifyCertificate(certificate.certificateNumber).subscribe({
      next: (result) => {
        if (result.isValid) {
          this.toastr.success('Certificate is valid');
        } else {
          this.toastr.warning(result.message || 'Certificate is not valid');
        }
      }
    });
  }

  revokeCertificate(certificate: Certificate) {
    const reason = prompt('Enter reason for revoking this certificate:');
    if (reason) {
      this.certificateService.invalidateCertificate(certificate.id, reason).subscribe({
        next: (success) => {
          if (success) {
            this.toastr.success('Certificate revoked');
            this.loadCertificates();
          } else {
            this.toastr.error('Failed to revoke certificate');
          }
        }
      });
    }
  }

  exportCertificates() {
    // Export all loaded certificates as CSV
    const certs = this.certificates();
    if (certs.length === 0) {
      this.toastr.warning('No certificates to export');
      return;
    }

    const headers = ['Certificate Number', 'Student Name', 'Course Name', 'Issued Date', 'Score', 'Status'];
    const rows = certs.map(c => [
      c.certificateNumber,
      c.userName,
      c.courseName,
      new Date(c.issuedAt).toLocaleDateString(),
      c.finalScore ? `${c.finalScore}%` : 'N/A',
      c.isValid ? 'Valid' : 'Revoked'
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `certificates-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    this.toastr.success('Certificates exported successfully');
  }

  downloadCertificate(certificate: Certificate) {
    if (certificate.pdfUrl) {
      window.open(certificate.pdfUrl, '_blank');
    } else {
      // Generate and download a simple certificate
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
            this.toastr.info('Certificate PDF not available. Contact admin for generation.');
          }
        },
        error: () => {
          this.toastr.info('Certificate PDF not available');
        }
      });
    }
  }

  closeModal() {
    this.showPreviewModal = false;
    this.selectedCertificate = null;
  }

  getPages(): number[] {
    const pages = [];
    const maxPages = Math.min(this.totalPages, 5);
    for (let i = 1; i <= maxPages; i++) {
      pages.push(i);
    }
    return pages;
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadCertificates();
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadCertificates();
    }
  }

  goToPage(page: number) {
    this.currentPage = page;
    this.loadCertificates();
  }
}
