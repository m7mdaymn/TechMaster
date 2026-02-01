import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InstructorService } from '../../../core/services/instructor.service';
import { ToastrService } from 'ngx-toastr';

interface EarningRecord {
  id: number;
  courseName: string;
  studentName: string;
  amount: number;
  date: Date;
  status: 'completed' | 'pending' | 'processing';
}

@Component({
  selector: 'app-instructor-earnings',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="earnings-page">
      <div class="page-header">
        <h1>Earnings</h1>
        <p>Track your revenue and payment history</p>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon green">
            <span class="material-icons">account_balance_wallet</span>
          </div>
          <div class="stat-info">
            <span class="stat-value">\${{ totalEarnings().toLocaleString() }}</span>
            <span class="stat-label">Total Earnings</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon blue">
            <span class="material-icons">trending_up</span>
          </div>
          <div class="stat-info">
            <span class="stat-value">\${{ monthlyEarnings().toLocaleString() }}</span>
            <span class="stat-label">This Month</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon orange">
            <span class="material-icons">hourglass_empty</span>
          </div>
          <div class="stat-info">
            <span class="stat-value">\${{ pendingPayouts().toLocaleString() }}</span>
            <span class="stat-label">Pending Payout</span>
          </div>
        </div>
      </div>

      <div class="earnings-table-container">
        <h2>Recent Transactions</h2>
        <table class="earnings-table">
          <thead>
            <tr>
              <th>Course</th>
              <th>Student</th>
              <th>Amount</th>
              <th>Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            @for (record of earnings(); track record.id) {
              <tr>
                <td>{{ record.courseName }}</td>
                <td>{{ record.studentName }}</td>
                <td class="amount">{{ record.amount.toFixed(2) }} EGP</td>
                <td>{{ record.date | date:'mediumDate' }}</td>
                <td>
                  <span class="status-badge" [class]="record.status">
                    {{ record.status }}
                  </span>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .earnings-page {
      max-width: 1400px;
    }

    .page-header {
      margin-bottom: 32px;
    }

    .page-header h1 {
      font-size: 1.75rem;
      font-weight: 700;
      color: #1a1a2e;
      margin: 0 0 8px 0;
    }

    .page-header p {
      color: #666;
      margin: 0;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 24px;
      margin-bottom: 32px;
    }

    .stat-card {
      background: white;
      border-radius: 16px;
      padding: 24px;
      display: flex;
      align-items: center;
      gap: 16px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.05);
    }

    .stat-icon {
      width: 56px;
      height: 56px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .stat-icon.green {
      background: rgba(16, 185, 129, 0.1);
      color: #10b981;
    }

    .stat-icon.blue {
      background: rgba(59, 130, 246, 0.1);
      color: #3b82f6;
    }

    .stat-icon.orange {
      background: rgba(249, 115, 22, 0.1);
      color: #f97316;
    }

    .stat-info {
      display: flex;
      flex-direction: column;
    }

    .stat-value {
      font-size: 1.75rem;
      font-weight: 700;
      color: #1a1a2e;
    }

    .stat-label {
      color: #666;
      font-size: 0.9rem;
    }

    .earnings-table-container {
      background: white;
      border-radius: 16px;
      padding: 24px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.05);
    }

    .earnings-table-container h2 {
      font-size: 1.25rem;
      margin: 0 0 20px 0;
      color: #1a1a2e;
    }

    .earnings-table {
      width: 100%;
      border-collapse: collapse;
    }

    .earnings-table th,
    .earnings-table td {
      padding: 16px;
      text-align: left;
      border-bottom: 1px solid #eee;
    }

    .earnings-table th {
      font-weight: 600;
      color: #666;
      font-size: 0.85rem;
      text-transform: uppercase;
    }

    .amount {
      font-weight: 600;
      color: #10b981;
    }

    .status-badge {
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 500;
      text-transform: capitalize;
    }

    .status-badge.completed {
      background: rgba(16, 185, 129, 0.1);
      color: #10b981;
    }

    .status-badge.pending {
      background: rgba(249, 115, 22, 0.1);
      color: #f97316;
    }

    .status-badge.processing {
      background: rgba(59, 130, 246, 0.1);
      color: #3b82f6;
    }
  `]
})
export class InstructorEarningsComponent implements OnInit {
  private instructorService = inject(InstructorService);
  private toastr = inject(ToastrService);

  earnings = signal<EarningRecord[]>([]);
  totalEarnings = signal(0);
  monthlyEarnings = signal(0);
  pendingPayouts = signal(0);
  loading = signal(true);

  ngOnInit(): void {
    this.loadEarnings();
  }

  loadEarnings(): void {
    this.loading.set(true);
    this.instructorService.getEarnings().subscribe({
      next: (data) => {
        if (data) {
          // Map transactions to earnings records
          const earningsData: EarningRecord[] = (data.recentTransactions || []).map((tx: any, index: number) => ({
            id: tx.id || index + 1,
            courseName: tx.courseName || tx.courseTitle || 'Unknown Course',
            studentName: tx.studentName || tx.userName || 'Unknown Student',
            amount: tx.amount || tx.amountPaid || 0,
            date: new Date(tx.createdAt || tx.date),
            status: (tx.status?.toLowerCase() || 'completed') as 'completed' | 'pending' | 'processing'
          }));

          this.earnings.set(earningsData);
          this.totalEarnings.set(data.totalEarnings || 0);
          this.monthlyEarnings.set(data.thisMonthEarnings || 0);
          this.pendingPayouts.set(data.pendingPayouts || 0);
        }
        this.loading.set(false);
      },
      error: () => {
        this.toastr.error('Failed to load earnings');
        this.loading.set(false);
      }
    });
  }
}
