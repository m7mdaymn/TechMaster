import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { EnrollmentService } from '../../../core/services/enrollment.service';
import { DashboardService } from '../../../core/services/dashboard.service';
import { ToastrService } from 'ngx-toastr';
import { environment } from '@environments/environment';

interface Enrollment {
  id: string;
  student: { name: string; email: string; avatar: string; phone?: string };
  course: { title: string; instructor: string; courseId?: string; price?: number };
  enrolledAt: Date;
  progress: number;
  status: 'Active' | 'Completed' | 'Expired' | 'Refunded' | 'Pending' | 'UnderReview' | 'Approved' | 'Rejected';
  paymentStatus: 'Paid' | 'PaymentPending' | 'Free' | 'pending';
  amount: number;
  paymentScreenshotUrl?: string;
}

@Component({
  selector: 'app-admin-enrollments',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  template: `
    <div class="enrollments-page">
      <div class="page-header">
        <div class="header-left">
          <h1>Enrollment Management</h1>
          <p class="subtitle">Manage all course enrollments</p>
        </div>
        <button class="export-btn" (click)="exportEnrollments()">
          <span>📊</span>
          Export
        </button>
      </div>

      <!-- Stats -->
      <div class="stats-row">
        <div class="stat-card">
          <span class="stat-icon">📝</span>
          <div class="stat-info">
            <span class="stat-value">{{ totalEnrollments | number }}</span>
            <span class="stat-label">Total Enrollments</span>
          </div>
        </div>
        <div class="stat-card">
          <span class="stat-icon">⏳</span>
          <div class="stat-info">
            <span class="stat-value">{{ pendingEnrollments | number }}</span>
            <span class="stat-label">Pending Review</span>
          </div>
        </div>
        <div class="stat-card">
          <span class="stat-icon">🎯</span>
          <div class="stat-info">
            <span class="stat-value">{{ activeEnrollments | number }}</span>
            <span class="stat-label">Active</span>
          </div>
        </div>
        <div class="stat-card revenue">
          <span class="stat-icon">💰</span>
          <div class="stat-info">
            <span class="stat-value">\{{ totalRevenue | number }} EGP</span>
            <span class="stat-label">Total Revenue</span>
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
            (ngModelChange)="filterEnrollments()"
            placeholder="Search enrollments..."
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
          (ngModelChange)="filterEnrollments()"
        >
      </div>

      <!-- Enrollments Table -->
      <div class="table-container">
        <table>
          <thead>
            <tr>
              <th>Student</th>
              <th>Course</th>
              <th>Enrolled Date</th>
              <th>Progress</th>
              <th>Status</th>
              <th>Amount</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (enrollment of filteredEnrollments(); track enrollment.id) {
              <tr>
                <td>
                  <div class="student-cell">
   
                    <div class="student-info">
                      <span class="student-email">{{ enrollment.student.email }}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <div class="course-cell">
                    <span class="course-title">{{ enrollment.course.title }}</span>
                    <span class="course-instructor">{{ enrollment.course.instructor }}</span>
                  </div>
                </td>
                <td>{{ enrollment.enrolledAt | date:'mediumDate' }}</td>
                <td>
                </td>
                <td>
                  <span class="status-badge" [class]="enrollment.status.toLowerCase()">
                    {{ enrollment.status }}
                  </span>
                </td>
                <td>
                  @if (enrollment.amount === 0) {
                    <span class="free-text"></span>
                  } @else {
                    <span>{{ enrollment.amount }} EGP</span>
                  }
                </td>
                <td>
                  <div class="actions-cell">
                    <button class="action-btn" title="View Details" (click)="viewDetails(enrollment)">👁️</button>
                    
                      <button class="action-btn success" title="Approve Enrollment" (click)="approveEnrollment(enrollment)">✅ Approve</button>
                      <button class="action-btn danger" title="Reject Enrollment" (click)="rejectEnrollment(enrollment)">❌ Reject</button>
                    
              
                    @if (enrollment.paymentStatus === 'PaymentPending' && enrollment.status !== 'Pending' && enrollment.status !== 'UnderReview') {
                      <button class="action-btn success" title="Confirm Payment" (click)="confirmPayment(enrollment)">💰 Confirm</button>
                    }
                    
                    @if (enrollment.status === 'Active' && enrollment.paymentStatus === 'Paid') {
                      <button class="action-btn warning" title="Refund" (click)="refund(enrollment)">💸 Refund</button>
                    }
                    
                    @if (enrollment.status !== 'Pending' && enrollment.status !== 'UnderReview') {
                      <button class="action-btn danger" title="Cancel" (click)="cancel(enrollment)">🗑️ Cancel</button>
                    }
                  </div>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="8" class="empty-state">
                  <span>📝</span>
                  <p>No enrollments found</p>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="pagination">
        <span class="page-info">
          Showing 1-{{ filteredEnrollments().length }} 
          of {{ filteredEnrollments().length }}
        </span>
        <div class="page-controls">
          <button disabled>←</button>
          <button class="active">1</button>
          <button disabled>→</button>
        </div>
      </div>
    </div>

    <!-- Details Modal -->
    @if (showDetailsModal && selectedEnrollment) {
      <div class="modal-overlay" (click)="closeModal()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>Enrollment Details</h2>
            <button class="close-btn" (click)="closeModal()">×</button>
          </div>
          <div class="modal-body">
            <div class="detail-section">
              <h3>Student Info</h3>
              <div class="detail-row">
                <span class="label">Name:</span>
                <span class="value">{{ selectedEnrollment.student.name }}</span>
              </div>
              <div class="detail-row">
                <span class="label">Email:</span>
                <span class="value">{{ selectedEnrollment.student.email }}</span>
              </div>
              <div class="detail-row">
                <span class="label">Phone:</span>
                <span class="value">
                  @if (selectedEnrollment.student.phone) {
                    {{ selectedEnrollment.student.phone }}
                    <a [href]="getWhatsAppLink(selectedEnrollment.student.phone)" target="_blank" class="whatsapp-btn" title="Chat on WhatsApp">
                      💬 WhatsApp
                    </a>
                  } @else {
                    N/A
                  }
                </span>
              </div>
            </div>
            <div class="detail-section">
              <h3>Course Info</h3>
              <div class="detail-row">
                <span class="label">Course:</span>
                <span class="value">{{ selectedEnrollment.course.title }}</span>
              </div>
              <div class="detail-row">
                <span class="label">Instructor:</span>
                <span class="value">{{ selectedEnrollment.course.instructor }}</span>
              </div>
            </div>
            <div class="detail-section">
              <h3>Enrollment Info</h3>
              <div class="detail-row">
                <span class="label">Enrolled Date:</span>
                <span class="value">{{ selectedEnrollment.enrolledAt | date:'medium' }}</span>
              </div>
              <div class="detail-row">
                <span class="label">Progress:</span>
                <span class="value">{{ selectedEnrollment.progress }}%</span>
              </div>
              <div class="detail-row">
                <span class="label">Status:</span>
                <span class="value">{{ selectedEnrollment.status }}</span>
              </div>
              <div class="detail-row">
                <span class="label">Payment:</span>
                <span class="value">{{ selectedEnrollment.paymentStatus }} - \{{ selectedEnrollment.amount }} EGP</span>
              </div>
            </div>
            @if (selectedEnrollment.paymentScreenshotUrl) {
              <div class="detail-section">
                <h3>Payment Screenshot</h3>
                <div class="payment-screenshot">
                  <img [src]="getMediaUrl(selectedEnrollment.paymentScreenshotUrl)" alt="Payment Screenshot" (click)="openImageInNewTab(selectedEnrollment.paymentScreenshotUrl)">
                </div>
              </div>
            }
          </div>
          <div class="modal-footer">
            @if (selectedEnrollment.status === 'Pending' || selectedEnrollment.status === 'UnderReview') {
              <button class="approve-btn" (click)="approveEnrollment(selectedEnrollment); closeModal()">✅ Approve</button>
              <button class="reject-btn" (click)="rejectEnrollment(selectedEnrollment); closeModal()">❌ Reject</button>
            }
            @if (selectedEnrollment.status === 'Active' || selectedEnrollment.status === 'Approved') {
              <button class="receipt-btn" (click)="generateReceipt(selectedEnrollment)">🧾 Generate Receipt</button>
            }
            <button class="close-modal-btn" (click)="closeModal()">Close</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .enrollments-page {
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

    .stat-card.revenue {
      background: linear-gradient(135deg, #247090 0%, #1a5570 100%);
      color: #fff;
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
      opacity: 0.8;
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

    select, input[type="date"] {
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

    .student-cell, .course-cell {
      display: flex;
      flex-direction: column;
    }

    .student-cell {
      flex-direction: row;
      align-items: center;
      gap: 0.75rem;
    }

    .student-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: #247090;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-weight: 600;
      overflow: hidden;
    }

    .student-avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
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

    .progress-cell {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .progress-bar {
      width: 80px;
      height: 8px;
      background: #e0e0e0;
      border-radius: 4px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: #247090;
      border-radius: 4px;
    }

    .status-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.8rem;
      font-weight: 600;
    }

    .status-badge.active, .status-badge.approved {
      background: #d4edda;
      color: #155724;
    }

    .status-badge.completed {
      background: #cce5ff;
      color: #004085;
    }

    .status-badge.expired {
      background: #f8d7da;
      color: #721c24;
    }

    .status-badge.refunded, .status-badge.rejected {
      background: #f8d7da;
      color: #721c24;
    }

    .status-badge.pending, .status-badge.underreview {
      background: #fff3cd;
      color: #856404;
    }

    .payment-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.8rem;
      font-weight: 600;
    }

    .payment-badge.paid {
      background: #d4edda;
      color: #155724;
    }

    .payment-badge.pending {
      background: #fff3cd;
      color: #856404;
    }

    .payment-badge.free {
      background: #e2e3e5;
      color: #383d41;
    }

    .free-text {
      color: #666;
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

    .action-btn.warning:hover {
      background: #fef3c7;
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
      font-weight: 500;
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
      max-width: 500px;
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

    .detail-section {
      margin-bottom: 1.5rem;
    }

    .detail-section:last-child {
      margin-bottom: 0;
    }

    .detail-section h3 {
      font-size: 0.9rem;
      color: #666;
      margin-bottom: 0.75rem;
      text-transform: uppercase;
    }

    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 0.5rem 0;
      border-bottom: 1px solid #f0f0f0;
    }

    .detail-row .label {
      color: #666;
    }

    .detail-row .value {
      font-weight: 600;
    }

    .modal-footer {
      padding: 1.5rem;
      border-top: 1px solid #e0e0e0;
      display: flex;
      gap: 0.75rem;
      justify-content: flex-end;
    }

    .close-modal-btn {
      padding: 0.75rem 1.5rem;
      border: 2px solid #e0e0e0;
      background: #fff;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
    }

    .approve-btn {
      padding: 0.75rem 1.5rem;
      border: none;
      background: #22c55e;
      color: #fff;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
    }

    .approve-btn:hover {
      background: #16a34a;
    }

    .reject-btn {
      padding: 0.75rem 1.5rem;
      border: none;
      background: #ef4444;
      color: #fff;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
    }

    .reject-btn:hover {
      background: #dc2626;
    }

    .receipt-btn {
      padding: 0.75rem 1.5rem;
      border: none;
      background: #3b82f6;
      color: #fff;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
    }

    .receipt-btn:hover {
      background: #2563eb;
    }

    .whatsapp-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      margin-left: 0.5rem;
      padding: 0.25rem 0.75rem;
      background: #25d366;
      color: white;
      text-decoration: none;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 600;
      transition: background 0.2s;
    }

    .whatsapp-btn:hover {
      background: #128c7e;
    }

    .payment-screenshot {
      margin-top: 0.5rem;
    }

    .payment-screenshot img {
      max-width: 100%;
      max-height: 300px;
      border-radius: 8px;
      border: 1px solid #e0e0e0;
      cursor: pointer;
      transition: transform 0.2s;
    }

    .payment-screenshot img:hover {
      transform: scale(1.02);
    }

    @media (max-width: 1200px) {
      .stats-row {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 768px) {
      .enrollments-page {
        padding: 1rem;
      }

      .page-header {
        flex-direction: column;
        gap: 1rem;
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
    }
  `]
})
export class EnrollmentsComponent implements OnInit {
  private translate = inject(TranslateService);
  private enrollmentService = inject(EnrollmentService);
  private dashboardService = inject(DashboardService);
  private toastr = inject(ToastrService);

  enrollments = signal<Enrollment[]>([]);
  filteredEnrollments = signal<Enrollment[]>([]);
  loading = signal(true);

  searchQuery = '';
  activeStatus = 'all';
  paymentFilter = 'all';
  dateFilter = '';

  totalEnrollments = 0;
  activeEnrollments = 0;
  completedEnrollments = 0;
  totalRevenue = 0;

  showDetailsModal = false;
  selectedEnrollment: Enrollment | null = null;

  statusTabs = [
    { value: 'all', label: '📋 All' },
    { value: 'Pending,UnderReview', label: '⏳ Needs Review' },
    { value: 'Active', label: '✅ Active' },
    { value: 'Completed', label: '🎓 Completed' },
    { value: 'Rejected', label: '❌ Rejected' }
  ];

  pendingEnrollments = 0;

  ngOnInit() {
    this.loadEnrollments();
  }

  loadEnrollments() {
    this.loading.set(true);
    
    this.enrollmentService.getAllEnrollments(1, 100).subscribe({
      next: (response) => {
        if (response.isSuccess && response.data) {
          const mappedEnrollments: Enrollment[] = response.data.items.map((e: any) => ({
            id: e.id,
            student: { 
              name: e.userName || e.studentName || 'Unknown', 
              email: e.userEmail || e.studentEmail || '', 
              avatar: e.userAvatar || '',
              phone: e.userPhone || e.studentPhone || ''
            },
            course: { 
              title: e.courseName || e.courseTitle || '', 
              instructor: e.instructorName || '',
              courseId: e.courseId,
              price: e.coursePrice || 0
            },
            enrolledAt: new Date(e.createdAt || e.enrolledAt || e.enrollmentDate),
            progress: e.progressPercentage || e.progress || 0,
            status: e.status || 'Active',
            paymentStatus: e.amountPaid && e.amountPaid > 0 ? 'Paid' : (e.paymentStatus || 'Free'),
            amount: e.amountPaid || e.coursePrice || e.amount || e.paidAmount || 0,
            paymentScreenshotUrl: e.paymentScreenshotUrl || e.paymentProofUrl || ''
          }));
          

          this.enrollments.set(mappedEnrollments);
          this.calculateStats();
          this.filterEnrollments();
        }
        this.loading.set(false);
      },
      error: () => {
        this.toastr.error('Failed to load enrollments');
        this.loading.set(false);
      }
    });
  }

  calculateStats() {
    const all = this.enrollments();
    this.totalEnrollments = all.length;
    this.activeEnrollments = all.filter(e => e.status === 'Active').length;
    this.completedEnrollments = all.filter(e => e.status === 'Completed').length;
    this.pendingEnrollments = all.filter(e => e.status === 'Pending' || e.status === 'UnderReview').length;
    this.totalRevenue = all.filter(e => e.paymentStatus === 'Paid').reduce((sum, e) => sum + e.amount, 0);
  }

  setStatus(status: string) {
    this.activeStatus = status;
    this.filterEnrollments();
  }

  filterEnrollments() {
    let result = this.enrollments();

    if (this.activeStatus !== 'all') {
      // Handle multiple statuses separated by comma (e.g., 'Pending,UnderReview')
      const statuses = this.activeStatus.split(',');
      result = result.filter(e => statuses.includes(e.status));
    }

    if (this.paymentFilter !== 'all') {
      result = result.filter(e => e.paymentStatus === this.paymentFilter);
    }

    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      result = result.filter(e =>
        e.student.name.toLowerCase().includes(query) ||
        e.student.email.toLowerCase().includes(query) ||
        e.course.title.toLowerCase().includes(query)
      );
    }

    this.filteredEnrollments.set(result);
  }

  private apiUrl = environment.apiUrl;

  getMediaUrl(url: string | null): string {
    if (!url) return '';
    if (url.startsWith('http') || url.startsWith('data:')) return url;
    return `${this.apiUrl.replace('/api', '')}${url.startsWith('/') ? '' : '/'}${url}`;
  }

  openImageInNewTab(url: string) {
    window.open(this.getMediaUrl(url), '_blank');
  }

  getWhatsAppLink(phone: string | undefined): string {
    if (!phone) return '#';
    // Remove any non-numeric characters and ensure it starts with country code
    const cleanPhone = phone.replace(/[^0-9+]/g, '').replace(/^\+/, '');
    return `https://wa.me/${cleanPhone}`;
  }

  generateReceipt(enrollment: Enrollment) {
    // Create a receipt in a new window
    const receiptDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const enrollmentDate = new Date(enrollment.enrolledAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const receiptNumber = `TM-${enrollment.id.substring(0, 8).toUpperCase()}`;
    
    const receiptHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt - ${receiptNumber}</title>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 40px; background: #f5f5f5; }
          .receipt { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { text-align: center; border-bottom: 2px solid #247090; padding-bottom: 20px; margin-bottom: 30px; }
          .logo { font-size: 28px; font-weight: bold; color: #247090; }
          .logo span { color: #333; }
          .receipt-title { font-size: 24px; color: #333; margin: 10px 0; }
          .receipt-number { color: #666; font-size: 14px; }
          .section { margin-bottom: 25px; }
          .section-title { font-weight: 600; color: #247090; margin-bottom: 10px; font-size: 14px; text-transform: uppercase; }
          .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
          .row:last-child { border-bottom: none; }
          .label { color: #666; }
          .value { font-weight: 500; color: #333; }
          .total-section { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-top: 30px; }
          .total-row { display: flex; justify-content: space-between; font-size: 20px; font-weight: bold; }
          .total-label { color: #333; }
          .total-value { color: #10b981; }
          .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #888; font-size: 12px; }
          .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; background: #d1fae5; color: #059669; }
          @media print { body { background: white; padding: 20px; } .receipt { box-shadow: none; } }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="header">
            <div class="logo">Tech<span>Master</span></div>
            <div class="receipt-title">Payment Receipt</div>
            <div class="receipt-number">Receipt #: ${receiptNumber}</div>
            <div class="receipt-number">Date: ${receiptDate}</div>
          </div>
          
          <div class="section">
            <div class="section-title">Student Information</div>
            <div class="row">
              <span class="label">Name</span>
              <span class="value">${enrollment.student.name}</span>
            </div>
            <div class="row">
              <span class="label">Email</span>
              <span class="value">${enrollment.student.email}</span>
            </div>
            ${enrollment.student.phone ? `<div class="row"><span class="label">Phone</span><span class="value">${enrollment.student.phone}</span></div>` : ''}
          </div>
          
          <div class="section">
            <div class="section-title">Course Details</div>
            <div class="row">
              <span class="label">Course</span>
              <span class="value">${enrollment.course.title}</span>
            </div>
            <div class="row">
              <span class="label">Instructor</span>
              <span class="value">${enrollment.course.instructor}</span>
            </div>
            <div class="row">
              <span class="label">Enrollment Date</span>
              <span class="value">${enrollmentDate}</span>
            </div>
            <div class="row">
              <span class="label">Status</span>
              <span class="value"><span class="status-badge">${enrollment.status}</span></span>
            </div>
          </div>
          
          <div class="total-section">
            <div class="total-row">
              <span class="total-label">Amount Paid</span>
              <span class="total-value">${enrollment.amount.toFixed(2)} EGP</span>
            </div>
          </div>
          
          <div class="footer">
            <p>Thank you for choosing TechMaster!</p>
            <p>This is an official receipt for your enrollment payment.</p>
            <p>For any questions, contact support&#64;techmaster.com</p>
          </div>
        </div>
        <script>window.print();</script>
      </body>
      </html>
    `;
    
    const receiptWindow = window.open('', '_blank');
    if (receiptWindow) {
      receiptWindow.document.write(receiptHtml);
      receiptWindow.document.close();
    }
  }

  viewDetails(enrollment: Enrollment) {
    this.selectedEnrollment = enrollment;
    this.showDetailsModal = true;
  }

  confirmPayment(enrollment: Enrollment) {
    this.enrollmentService.approveEnrollment(enrollment.id, enrollment.amount).subscribe({
      next: (response) => {
        if (response.isSuccess) {
          this.toastr.success('Payment confirmed');
          this.loadEnrollments();
        } else {
          this.toastr.error('Failed to confirm payment');
        }
      },
      error: () => {
        this.toastr.error('Failed to confirm payment');
      }
    });
  }

  approveEnrollment(enrollment: Enrollment) {
    const paidAmount = enrollment.amount || enrollment.course.price || 0;
    this.enrollmentService.approveEnrollment(enrollment.id, paidAmount).subscribe({
      next: (response) => {
        if (response.isSuccess) {
          this.toastr.success('Enrollment approved successfully');
          this.loadEnrollments();
        } else {
          this.toastr.error('Failed to approve enrollment');
        }
      },
      error: () => {
        this.toastr.error('Failed to approve enrollment');
      }
    });
  }

  rejectEnrollment(enrollment: Enrollment) {
    const reason = prompt('Enter rejection reason (optional):');
    this.enrollmentService.rejectEnrollment(enrollment.id, reason || 'Rejected by admin').subscribe({
      next: (response) => {
        if (response.isSuccess) {
          this.toastr.success('Enrollment rejected');
          this.loadEnrollments();
        } else {
          this.toastr.error('Failed to reject enrollment');
        }
      },
      error: () => {
        this.toastr.error('Failed to reject enrollment');
      }
    });
  }

  refund(enrollment: Enrollment) {
    if (confirm('Are you sure you want to refund this enrollment?')) {
      this.enrollmentService.rejectEnrollment(enrollment.id.toString(), 'Refund requested').subscribe({
        next: (response) => {
          if (response.isSuccess) {
            this.toastr.success('Enrollment refunded');
            this.loadEnrollments();
          } else {
            this.toastr.error('Failed to refund enrollment');
          }
        },
        error: () => {
          this.toastr.error('Failed to refund enrollment');
        }
      });
    }
  }

  cancel(enrollment: Enrollment) {
    if (confirm('Are you sure you want to cancel this enrollment?')) {
      this.dashboardService.rejectEnrollment(enrollment.id).subscribe({
        next: (success) => {
          if (success) {
            this.toastr.success('Enrollment cancelled');
            this.loadEnrollments();
          } else {
            this.toastr.error('Failed to cancel enrollment');
          }
        },
        error: () => {
          this.toastr.error('Failed to cancel enrollment');
        }
      });
    }
  }

  closeModal() {
    this.showDetailsModal = false;
    this.selectedEnrollment = null;
  }

  exportEnrollments() {
    const enrollmentsToExport = this.filteredEnrollments();
    
    // Create CSV content
    const headers = ['Student Name', 'Student Email', 'Course', 'Enrolled Date', 'Progress', 'Status', 'Payment Status', 'Amount'];
    const rows = enrollmentsToExport.map(e => [
      e.student.name,
      e.student.email,
      e.course.title,
      new Date(e.enrolledAt).toLocaleDateString(),
      `${e.progress}%`,
      e.status,
      e.paymentStatus,
      e.amount.toString()
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `enrollments_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    this.toastr.success('Enrollments exported successfully');
  }
}
