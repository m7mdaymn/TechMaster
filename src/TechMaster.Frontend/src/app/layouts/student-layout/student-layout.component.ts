import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { MediaService } from '../../core/services/media.service';

@Component({
  selector: 'app-student-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="dashboard-layout">
      <!-- Sidebar -->
      <aside class="sidebar" [class.collapsed]="sidebarCollapsed()">
        <div class="sidebar-header">
          <a routerLink="/" class="logo">
            <span class="logo-icon">🎓</span>
            @if (!sidebarCollapsed()) {
              <span class="logo-text">TechMaster</span>
            }
          </a>
          <button class="collapse-btn" (click)="toggleSidebar()">
            <span class="material-icons">{{ sidebarCollapsed() ? 'chevron_right' : 'chevron_left' }}</span>
          </button>
        </div>

        <nav class="sidebar-nav">
          <a routerLink="/student/dashboard" routerLinkActive="active" class="nav-item">
            <span class="material-icons">dashboard</span>
            @if (!sidebarCollapsed()) {
              <span>Dashboard</span>
            }
          </a>
          <a routerLink="/student/my-courses" routerLinkActive="active" class="nav-item">
            <span class="material-icons">school</span>
            @if (!sidebarCollapsed()) {
              <span>My Courses</span>
            }
          </a>
          <a routerLink="/student/certificates" routerLinkActive="active" class="nav-item">
            <span class="material-icons">workspace_premium</span>
            @if (!sidebarCollapsed()) {
              <span>Certificates</span>
            }
          </a>
          <a routerLink="/student/profile" routerLinkActive="active" class="nav-item">
            <span class="material-icons">person</span>
            @if (!sidebarCollapsed()) {
              <span>Profile</span>
            }
          </a>
          <a routerLink="/student/chat" routerLinkActive="active" class="nav-item">
            <span class="material-icons">chat</span>
            @if (!sidebarCollapsed()) {
              <span>Messages</span>
            }
          </a>
          <a routerLink="/student/leaderboard" routerLinkActive="active" class="nav-item">
            <span class="material-icons">leaderboard</span>
            @if (!sidebarCollapsed()) {
              <span>Leaderboard</span>
            }
          </a>
          <a routerLink="/student/my-internships" routerLinkActive="active" class="nav-item">
            <span class="material-icons">work</span>
            @if (!sidebarCollapsed()) {
              <span>Internships</span>
            }
          </a>
        </nav>

        <div class="sidebar-footer">
          <a routerLink="/" class="nav-item">
            <span class="material-icons">home</span>
            @if (!sidebarCollapsed()) {
              <span>Back to Home</span>
            }
          </a>
          <button class="nav-item logout-btn" (click)="logout()">
            <span class="material-icons">logout</span>
            @if (!sidebarCollapsed()) {
              <span>Logout</span>
            }
          </button>
        </div>
      </aside>

      <!-- Main Content -->
      <div class="main-wrapper">
        <header class="top-header">
          <div class="header-left">
            <h1 class="page-title">Student Portal</h1>
          </div>
          <div class="header-right">
            <div class="user-info">
              <span class="user-name">{{ currentUser()?.firstName }} {{ currentUser()?.lastName }}</span>
              <div class="user-avatar">
                @if (currentUser()?.profileImageUrl) {
                  <img [src]="mediaService.getAvatarUrl(currentUser()?.profileImageUrl)" alt="Profile">
                } @else {
                  <span>{{ currentUser()?.firstName?.charAt(0) || 'S' }}</span>
                }
              </div>
            </div>
          </div>
        </header>

        <main class="main-content">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-layout {
      display: flex;
      min-height: 100vh;
      background: #f5f7fa;
    }

    .sidebar {
      width: 260px;
      background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
      color: white;
      display: flex;
      flex-direction: column;
      transition: width 0.3s ease;
      position: fixed;
      height: 100vh;
      z-index: 1000;
    }

    .sidebar.collapsed {
      width: 70px;
    }

    .sidebar-header {
      padding: 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid rgba(255,255,255,0.1);
    }

    .logo {
      display: flex;
      align-items: center;
      gap: 12px;
      text-decoration: none;
      color: white;
    }

    .logo-icon {
      font-size: 28px;
    }

    .logo-text {
      font-size: 1.25rem;
      font-weight: 700;
    }

    .collapse-btn {
      background: rgba(255,255,255,0.1);
      border: none;
      color: white;
      width: 32px;
      height: 32px;
      border-radius: 8px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .sidebar-nav {
      flex: 1;
      padding: 20px 12px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      color: rgba(255,255,255,0.7);
      text-decoration: none;
      border-radius: 10px;
      transition: all 0.2s ease;
      border: none;
      background: none;
      cursor: pointer;
      width: 100%;
      font-size: 0.95rem;
    }

    .nav-item:hover {
      background: rgba(255,255,255,0.1);
      color: white;
    }

    .nav-item.active {
      background: linear-gradient(135deg, #247090 0%, #1a5570 100%);
      color: white;
    }

    .nav-item .material-icons {
      font-size: 22px;
    }

    .sidebar-footer {
      padding: 20px 12px;
      border-top: 1px solid rgba(255,255,255,0.1);
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .logout-btn {
      color: #ff6b6b !important;
    }

    .logout-btn:hover {
      background: rgba(255,107,107,0.2) !important;
    }

    .main-wrapper {
      flex: 1;
      margin-left: 260px;
      transition: margin-left 0.3s ease;
      display: flex;
      flex-direction: column;
    }

    .sidebar.collapsed + .main-wrapper {
      margin-left: 70px;
    }

    .top-header {
      background: white;
      padding: 16px 32px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: 0 2px 10px rgba(0,0,0,0.05);
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .page-title {
      font-size: 1.5rem;
      font-weight: 600;
      color: #1a1a2e;
      margin: 0;
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .user-name {
      font-weight: 500;
      color: #333;
    }

    .user-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: linear-gradient(135deg, #247090 0%, #1a5570 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 600;
      overflow: hidden;
    }

    .user-avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .main-content {
      flex: 1;
      padding: 32px;
    }

    @media (max-width: 768px) {
      .sidebar {
        width: 70px;
      }

      .main-wrapper {
        margin-left: 70px;
      }

      .logo-text, .nav-item span:not(.material-icons) {
        display: none;
      }
    }
  `]
})
export class StudentLayoutComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  mediaService = inject(MediaService);

  sidebarCollapsed = signal(false);
  currentUser = signal(this.authService.getCurrentUser());

  toggleSidebar(): void {
    this.sidebarCollapsed.update(v => !v);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}
