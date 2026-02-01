import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { GamificationService, Leaderboard, LeaderboardEntry, UserRank } from '@core/services/gamification.service';
import { AuthService } from '@core/services/auth.service';
import { MediaService } from '@core/services/media.service';

@Component({
  selector: 'app-leaderboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="leaderboard-page">
      <div class="page-header">
        <div class="header-content">
          <h1>🏆 Leaderboard</h1>
          <p>See how you rank against other learners</p>
        </div>
        <div class="period-selector">
          <button 
            class="period-btn" 
            [class.active]="selectedPeriod() === 'all'"
            (click)="changePeriod('all')"
          >All Time</button>
          <button 
            class="period-btn" 
            [class.active]="selectedPeriod() === 'monthly'"
            (click)="changePeriod('monthly')"
          >This Month</button>
          <button 
            class="period-btn" 
            [class.active]="selectedPeriod() === 'weekly'"
            (click)="changePeriod('weekly')"
          >This Week</button>
        </div>
      </div>

      <!-- My Rank Card -->
      @if (myRank()) {
        <div class="my-rank-card">
          <div class="rank-info">
            <div class="rank-badge">
              <span class="rank-number">#{{ myRank()!.rank }}</span>
            </div>
            <div class="rank-details">
              <h3>Your Ranking</h3>
              <p>Out of {{ myRank()!.totalParticipants }} learners</p>
            </div>
          </div>
          <div class="rank-stats">
            <div class="stat">
              <span class="value">{{ myRank()!.totalXp }}</span>
              <span class="label">Total XP</span>
            </div>
            <div class="stat">
              <span class="value">Level {{ myRank()!.level }}</span>
              <span class="label">Current Level</span>
            </div>
            @if (myRank()!.xpToNextRank > 0) {
              <div class="stat">
                <span class="value">{{ myRank()!.xpToNextRank }} XP</span>
                <span class="label">To Next Rank</span>
              </div>
            }
          </div>
        </div>
      }

      <!-- Top 3 Podium -->
      @if (leaderboard()?.topUsers && leaderboard()!.topUsers.length >= 3) {
        <div class="podium">
          <div class="podium-item second">
            <div class="avatar">
              <img [src]="mediaService.getAvatarUrl(leaderboard()!.topUsers[1].profileImageUrl)" alt="">
              <span class="medal">🥈</span>
            </div>
            <h4>{{ leaderboard()!.topUsers[1].userName }}</h4>
            <p>{{ leaderboard()!.topUsers[1].totalXp }} XP</p>
          </div>
          <div class="podium-item first">
            <div class="avatar">
              <img [src]="mediaService.getAvatarUrl(leaderboard()!.topUsers[0].profileImageUrl)" alt="">
              <span class="medal">🥇</span>
            </div>
            <h4>{{ leaderboard()!.topUsers[0].userName }}</h4>
            <p>{{ leaderboard()!.topUsers[0].totalXp }} XP</p>
          </div>
          <div class="podium-item third">
            <div class="avatar">
              <img [src]="mediaService.getAvatarUrl(leaderboard()!.topUsers[2].profileImageUrl)" alt="">
              <span class="medal">🥉</span>
            </div>
            <h4>{{ leaderboard()!.topUsers[2].userName }}</h4>
            <p>{{ leaderboard()!.topUsers[2].totalXp }} XP</p>
          </div>
        </div>
      }

      <!-- Leaderboard Table -->
      <div class="leaderboard-table">
        <div class="table-header">
          <span class="rank-col">Rank</span>
          <span class="user-col">Learner</span>
          <span class="level-col">Level</span>
          <span class="xp-col">XP Points</span>
          <span class="badges-col">Badges</span>
          <span class="courses-col">Courses</span>
        </div>
        
        @if (loading()) {
          <div class="loading-state">
            <div class="spinner"></div>
            <p>Loading leaderboard...</p>
          </div>
        } @else if (leaderboard()?.topUsers && leaderboard()!.topUsers.length > 0) {
          @for (user of leaderboard()!.topUsers; track user.userId) {
            <div class="table-row" [class.highlight]="user.userId === currentUserId()">
              <span class="rank-col">
                @if (user.rank === 1) {
                  <span class="top-rank gold">🥇</span>
                } @else if (user.rank === 2) {
                  <span class="top-rank silver">🥈</span>
                } @else if (user.rank === 3) {
                  <span class="top-rank bronze">🥉</span>
                } @else {
                  <span class="rank-num">#{{ user.rank }}</span>
                }
              </span>
              <span class="user-col">
                <img [src]="mediaService.getAvatarUrl(user.profileImageUrl)" alt="" class="user-avatar">
                <span class="user-name">{{ user.userName }}</span>
              </span>
              <span class="level-col">
                <span class="level-badge">Lvl {{ user.level }}</span>
              </span>
              <span class="xp-col">
                <span class="xp-value">{{ user.totalXp | number }}</span>
              </span>
              <span class="badges-col">
                <span class="badge-count">🏅 {{ user.badgeCount }}</span>
              </span>
              <span class="courses-col">
                <span class="course-count">📚 {{ user.completedCourses }}</span>
              </span>
            </div>
          }
        } @else {
          <div class="empty-state">
            <span class="icon">🏆</span>
            <h3>No rankings yet</h3>
            <p>Start learning to appear on the leaderboard!</p>
            <a routerLink="/courses" class="btn btn-primary">Browse Courses</a>
          </div>
        }
      </div>

      <!-- Stats Footer -->
      @if (leaderboard()) {
        <div class="stats-footer">
          <p>Total Participants: <strong>{{ leaderboard()!.totalParticipants }}</strong></p>
          <p>Last Updated: <strong>{{ leaderboard()!.generatedAt | date:'medium' }}</strong></p>
        </div>
      }
    </div>
  `,
  styles: [`
    .leaderboard-page {
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .header-content h1 {
      font-size: 2rem;
      font-weight: 700;
      color: var(--color-dark);
      margin-bottom: 0.25rem;
    }

    .header-content p {
      color: var(--color-gray-600);
    }

    .period-selector {
      display: flex;
      gap: 0.5rem;
      background: var(--color-gray-100);
      padding: 0.25rem;
      border-radius: 8px;
    }

    .period-btn {
      padding: 0.5rem 1rem;
      border: none;
      background: transparent;
      border-radius: 6px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }

    .period-btn.active {
      background: var(--color-primary);
      color: white;
    }

    .my-rank-card {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem 2rem;
      background: linear-gradient(135deg, var(--color-primary) 0%, #1a5570 100%);
      border-radius: 16px;
      color: white;
      margin-bottom: 2rem;
    }

    .rank-info {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .rank-badge {
      width: 60px;
      height: 60px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .rank-number {
      font-size: 1.5rem;
      font-weight: 700;
    }

    .rank-details h3 {
      font-size: 1.25rem;
      font-weight: 600;
      margin-bottom: 0.25rem;
    }

    .rank-details p {
      opacity: 0.8;
    }

    .rank-stats {
      display: flex;
      gap: 2rem;
    }

    .rank-stats .stat {
      text-align: center;
    }

    .rank-stats .value {
      display: block;
      font-size: 1.25rem;
      font-weight: 700;
    }

    .rank-stats .label {
      font-size: 0.8rem;
      opacity: 0.8;
    }

    /* Podium */
    .podium {
      display: flex;
      justify-content: center;
      align-items: flex-end;
      gap: 1rem;
      margin-bottom: 2rem;
      padding: 2rem;
    }

    .podium-item {
      text-align: center;
      padding: 1.5rem;
      background: white;
      border-radius: 16px;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
      transition: transform 0.3s;
    }

    .podium-item:hover {
      transform: translateY(-5px);
    }

    .podium-item.first {
      padding-bottom: 3rem;
      transform: scale(1.1);
    }

    .podium-item .avatar {
      position: relative;
      margin-bottom: 1rem;
    }

    .podium-item .avatar img {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      object-fit: cover;
      border: 3px solid var(--color-gray-200);
    }

    .podium-item.first .avatar img {
      width: 100px;
      height: 100px;
      border-color: gold;
    }

    .podium-item .medal {
      position: absolute;
      bottom: -10px;
      right: -5px;
      font-size: 2rem;
    }

    .podium-item h4 {
      font-weight: 600;
      margin-bottom: 0.25rem;
    }

    .podium-item p {
      color: var(--color-gray-600);
      font-size: 0.9rem;
    }

    /* Table */
    .leaderboard-table {
      background: white;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
    }

    .table-header, .table-row {
      display: grid;
      grid-template-columns: 80px 1fr 100px 120px 100px 100px;
      align-items: center;
      padding: 1rem 1.5rem;
    }

    .table-header {
      background: var(--color-gray-50);
      font-weight: 600;
      color: var(--color-gray-600);
      font-size: 0.85rem;
      text-transform: uppercase;
    }

    .table-row {
      border-bottom: 1px solid var(--color-gray-100);
      transition: background 0.2s;
    }

    .table-row:hover {
      background: var(--color-gray-50);
    }

    .table-row.highlight {
      background: rgba(36, 112, 144, 0.1);
      border-left: 3px solid var(--color-primary);
    }

    .rank-col {
      text-align: center;
    }

    .top-rank {
      font-size: 1.5rem;
    }

    .rank-num {
      font-weight: 600;
      color: var(--color-gray-600);
    }

    .user-col {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .user-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      object-fit: cover;
    }

    .user-name {
      font-weight: 500;
    }

    .level-badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      background: var(--color-primary);
      color: white;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 500;
    }

    .xp-value {
      font-weight: 600;
      color: var(--color-primary);
    }

    .badge-count, .course-count {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      color: var(--color-gray-600);
    }

    .loading-state, .empty-state {
      text-align: center;
      padding: 3rem;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid var(--color-gray-200);
      border-top-color: var(--color-primary);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 1rem;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .empty-state .icon {
      font-size: 4rem;
      display: block;
      margin-bottom: 1rem;
    }

    .empty-state h3 {
      font-size: 1.25rem;
      margin-bottom: 0.5rem;
    }

    .empty-state p {
      color: var(--color-gray-500);
      margin-bottom: 1rem;
    }

    .btn-primary {
      display: inline-block;
      padding: 0.75rem 1.5rem;
      background: var(--color-primary);
      color: white;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
    }

    .stats-footer {
      display: flex;
      justify-content: center;
      gap: 2rem;
      margin-top: 1.5rem;
      padding: 1rem;
      color: var(--color-gray-500);
      font-size: 0.9rem;
    }

    @media (max-width: 768px) {
      .leaderboard-page {
        padding: 1rem;
      }

      .page-header {
        flex-direction: column;
        align-items: stretch;
      }

      .my-rank-card {
        flex-direction: column;
        gap: 1.5rem;
        text-align: center;
      }

      .rank-stats {
        width: 100%;
        justify-content: space-around;
      }

      .podium {
        flex-direction: column;
        align-items: center;
      }

      .podium-item.first {
        transform: none;
        order: -1;
      }

      .table-header, .table-row {
        grid-template-columns: 60px 1fr 80px;
      }

      .level-col, .badges-col, .courses-col {
        display: none;
      }
    }
  `]
})
export class LeaderboardComponent implements OnInit {
  private gamificationService = inject(GamificationService);
  private authService = inject(AuthService);
  mediaService = inject(MediaService);

  leaderboard = signal<Leaderboard | null>(null);
  myRank = signal<UserRank | null>(null);
  loading = signal(true);
  selectedPeriod = signal('all');
  currentUserId = signal<string | null>(null);

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.currentUserId.set(user.id);
      this.loadMyRank();
    }
    this.loadLeaderboard();
  }

  loadLeaderboard(): void {
    this.loading.set(true);
    this.gamificationService.getLeaderboard(100, this.selectedPeriod()).subscribe({
      next: (data) => {
        this.leaderboard.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  loadMyRank(): void {
    this.gamificationService.getMyRank().subscribe({
      next: (data) => {
        this.myRank.set(data);
      }
    });
  }

  changePeriod(period: string): void {
    this.selectedPeriod.set(period);
    this.loadLeaderboard();
  }
}
