import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { InternshipService, InternshipApplication } from '@core/services/internship.service';

@Component({
  selector: 'app-my-internships',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="my-internships-page">
      <div class="page-header">
        <h1>My Internship Applications</h1>
        <p class="subtitle">Track your internship applications and access accepted programs</p>
      </div>

      @if (loading()) {
        <div class="loading">
          <div class="spinner"></div>
        </div>
      } @else if (applications().length === 0) {
        <div class="empty-state">
          <span class="icon">💼</span>
          <h3>No Applications Yet</h3>
          <p>You haven't applied to any internships yet.</p>
          <a routerLink="/internships" class="browse-btn">Browse Internships</a>
        </div>
      } @else {
        <div class="applications-grid">
          @for (app of applications(); track app.id) {
            <div class="application-card" [class]="app.status.toLowerCase()">
              <div class="card-header">
                <h3>{{ app.internshipName }}</h3>
                <span class="status-badge" [class]="app.status.toLowerCase()">{{ app.status }}</span>
              </div>
              <div class="card-body">
                <p class="date">Applied: {{ app.createdAt | date:'mediumDate' }}</p>
                @if (app.reviewedAt) {
                  <p class="reviewed">Reviewed: {{ app.reviewedAt | date:'mediumDate' }}</p>
                }
              </div>
              <div class="card-footer">
                @if (app.status === 'Accepted') {
                  <a [routerLink]="['/student/internship-tasks', app.internshipId]" class="tasks-btn">
                    View Tasks & Submit Work
                  </a>
                } @else {
                  <span class="pending-text">
                    @switch (app.status) {
                      @case ('Pending') { Your application is under review }
                      @case ('UnderReview') { Being reviewed by the team }
                      @case ('Rejected') { Unfortunately, your application was not selected }
                    }
                  </span>
                }
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .my-internships-page {
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;
    }

    .page-header {
      margin-bottom: 2rem;
    }

    .page-header h1 {
      font-size: 1.75rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
    }

    .subtitle {
      color: #666;
    }

    .loading {
      display: flex;
      justify-content: center;
      padding: 4rem;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid #f3f3f3;
      border-top: 3px solid #247090;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .empty-state {
      text-align: center;
      padding: 4rem 2rem;
      background: #fff;
      border-radius: 16px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
    }

    .empty-state .icon {
      font-size: 4rem;
      display: block;
      margin-bottom: 1rem;
    }

    .empty-state h3 {
      font-size: 1.5rem;
      margin-bottom: 0.5rem;
    }

    .empty-state p {
      color: #666;
      margin-bottom: 1.5rem;
    }

    .browse-btn {
      display: inline-block;
      padding: 0.75rem 2rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
    }

    .applications-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 1.5rem;
    }

    .application-card {
      background: #fff;
      border-radius: 16px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
      overflow: hidden;
      border-left: 4px solid #666;
    }

    .application-card.pending {
      border-left-color: #ffc107;
    }

    .application-card.underreview {
      border-left-color: #17a2b8;
    }

    .application-card.accepted {
      border-left-color: #28a745;
    }

    .application-card.rejected {
      border-left-color: #dc3545;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 1.25rem;
      border-bottom: 1px solid #f0f0f0;
    }

    .card-header h3 {
      font-size: 1.1rem;
      font-weight: 600;
      margin: 0;
      flex: 1;
      padding-right: 1rem;
    }

    .status-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.8rem;
      font-weight: 600;
      white-space: nowrap;
    }

    .status-badge.pending {
      background: #fff3cd;
      color: #856404;
    }

    .status-badge.underreview {
      background: #d1ecf1;
      color: #0c5460;
    }

    .status-badge.accepted {
      background: #d4edda;
      color: #155724;
    }

    .status-badge.rejected {
      background: #f8d7da;
      color: #721c24;
    }

    .card-body {
      padding: 1rem 1.25rem;
    }

    .card-body p {
      margin: 0.25rem 0;
      font-size: 0.9rem;
      color: #666;
    }

    .card-footer {
      padding: 1rem 1.25rem;
      background: #f8f9fa;
    }

    .tasks-btn {
      display: block;
      width: 100%;
      padding: 0.75rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      text-align: center;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .tasks-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }

    .pending-text {
      display: block;
      text-align: center;
      font-size: 0.9rem;
      color: #666;
    }

    @media (max-width: 768px) {
      .my-internships-page {
        padding: 1rem;
      }

      .applications-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class MyInternshipsComponent implements OnInit {
  private internshipService = inject(InternshipService);

  applications = signal<InternshipApplication[]>([]);
  loading = signal(false);

  ngOnInit() {
    this.loadApplications();
  }

  loadApplications() {
    this.loading.set(true);
    this.internshipService.getMyApplications().subscribe({
      next: (apps) => {
        this.applications.set(apps);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }
}
