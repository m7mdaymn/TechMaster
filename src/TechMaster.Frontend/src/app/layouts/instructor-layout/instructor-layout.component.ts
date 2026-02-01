import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { InstructorService } from '../../core/services/instructor.service';

@Component({
  selector: 'app-instructor-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="dashboard-layout">
      <!-- Sidebar -->
      <aside class="sidebar" [class.collapsed]="sidebarCollapsed()">
        <div class="sidebar-header">
          <a routerLink="/" class="logo">
            <span class="logo-icon">👨‍🏫</span>
            @if (!sidebarCollapsed()) {
              <span class="logo-text">Instructor</span>
            }
          </a>
          <button class="collapse-btn" (click)="toggleSidebar()">
            <span class="material-icons">{{ sidebarCollapsed() ? 'chevron_right' : 'chevron_left' }}</span>
          </button>
        </div>

        <nav class="sidebar-nav">
          <!-- Main Section -->
          <div class="nav-section">
            @if (!sidebarCollapsed()) {
              <span class="nav-section-title">Main</span>
            }
            <a routerLink="/instructor/dashboard" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" class="nav-item">
              <span class="material-icons">dashboard</span>
              @if (!sidebarCollapsed()) {
                <span>Dashboard</span>
              }
            </a>
            <a routerLink="/instructor/notifications" routerLinkActive="active" class="nav-item">
              <span class="material-icons">notifications</span>
              @if (!sidebarCollapsed()) {
                <span>Notifications</span>
              }
              @if (unreadNotifications() > 0) {
                <span class="badge">{{ unreadNotifications() }}</span>
              }
            </a>
            <a routerLink="/instructor/chat" routerLinkActive="active" class="nav-item">
              <span class="material-icons">chat</span>
              @if (!sidebarCollapsed()) {
                <span>Messages</span>
              }
            </a>
          </div>

          <!-- Course Management -->
          <div class="nav-section">
            @if (!sidebarCollapsed()) {
              <span class="nav-section-title">Courses</span>
            }
            <a routerLink="/instructor/courses" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" class="nav-item">
              <span class="material-icons">school</span>
              @if (!sidebarCollapsed()) {
                <span>My Courses</span>
              }
            </a>
            <a routerLink="/instructor/courses/create" routerLinkActive="active" class="nav-item">
              <span class="material-icons">add_circle</span>
              @if (!sidebarCollapsed()) {
                <span>Create Course</span>
              }
            </a>
          </div>

          <!-- Student Management -->
          <div class="nav-section">
            @if (!sidebarCollapsed()) {
              <span class="nav-section-title">Students</span>
            }
            <a routerLink="/instructor/students" routerLinkActive="active" class="nav-item">
              <span class="material-icons">people</span>
              @if (!sidebarCollapsed()) {
                <span>My Students</span>
              }
            </a>
          </div>
          <div class="nav-section">
            <a routerLink="/instructor/live-sessions" routerLinkActive="active" class="nav-item">
              <span class="material-icons">videocam</span>
              @if (!sidebarCollapsed()) {
                <span>Live Sessions</span>
              }
            </a>
          </div>
 

          <!-- Analytics & Earnings -->
          <div class="nav-section">
            @if (!sidebarCollapsed()) {
              <span class="nav-section-title">Analytics</span>
            }
            <a routerLink="/instructor/analytics" routerLinkActive="active" class="nav-item">
              <span class="material-icons">analytics</span>
              @if (!sidebarCollapsed()) {
                <span>Analytics</span>
              }
            </a>
            <a routerLink="/instructor/earnings" routerLinkActive="active" class="nav-item">
              <span class="material-icons">payments</span>
              @if (!sidebarCollapsed()) {
                <span>Earnings</span>
              }
            </a>
          </div>

          <!-- Settings -->
          <div class="nav-section">
            @if (!sidebarCollapsed()) {
              <span class="nav-section-title">Account</span>
            }
            <a routerLink="/instructor/settings" routerLinkActive="active" class="nav-item">
              <span class="material-icons">settings</span>
              @if (!sidebarCollapsed()) {
                <span>Settings</span>
              }
            </a>
          </div>
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
      <div class="main-wrapper" [class.expanded]="sidebarCollapsed()">
        <header class="top-header">
          <div class="header-left">
            <h1 class="page-title">Instructor Portal</h1>
          </div>
          <div class="header-right">
            <div class="header-actions">
              <button class="header-btn" routerLink="/instructor/notifications" title="Notifications">
                <span class="material-icons">notifications</span>
                @if (unreadNotifications() > 0) {
                  <span class="header-badge">{{ unreadNotifications() }}</span>
                }
              </button>
              <button class="header-btn" routerLink="/instructor/chat" title="Messages">
                <span class="material-icons">chat</span>
              </button>
            </div>
            <div class="user-info">
              <span class="user-role">Instructor</span>
              <span class="user-name">{{ currentUser()?.firstName }} {{ currentUser()?.lastName }}</span>
              <div class="user-avatar">
                @if (currentUser()?.profileImageUrl) {
                  <img [src]="currentUser()?.profileImageUrl" alt="Profile">
                } @else {
                  <span>{{ currentUser()?.firstName?.charAt(0) || 'I' }}</span>
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
      background: #f8f9fc;
    }

    .sidebar {
      width: 260px;
      background: linear-gradient(180deg, #1e3a5f 0%, #0d2137 100%);
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
      font-size: 1.15rem;
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
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 4px;
      overflow-y: auto;
    }

    .nav-section {
      margin-bottom: 12px;
    }

    .nav-section-title {
      display: block;
      font-size: 0.7rem;
      text-transform: uppercase;
      color: rgba(255,255,255,0.4);
      padding: 8px 16px 4px;
      letter-spacing: 0.5px;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 16px;
      color: rgba(255,255,255,0.7);
      text-decoration: none;
      border-radius: 10px;
      transition: all 0.2s ease;
      border: none;
      background: none;
      cursor: pointer;
      width: 100%;
      font-size: 0.9rem;
      position: relative;
    }

    .nav-item .badge {
      position: absolute;
      right: 12px;
      background: #ef4444;
      color: white;
      font-size: 0.7rem;
      padding: 2px 6px;
      border-radius: 10px;
      min-width: 18px;
      text-align: center;
    }

    .nav-item:hover {
      background: rgba(255,255,255,0.1);
      color: white;
    }

    .nav-item.active {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
    }

    .nav-item .material-icons {
      font-size: 20px;
    }

    .sidebar-footer {
      padding: 16px 12px;
      border-top: 1px solid rgba(255,255,255,0.1);
      display: flex;
      flex-direction: column;
      gap: 4px;
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

    .main-wrapper.expanded {
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
      color: #1e3a5f;
      margin: 0;
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 24px;
    }

    .header-actions {
      display: flex;
      gap: 8px;
    }

    .header-btn {
      background: #f1f5f9;
      border: none;
      width: 40px;
      height: 40px;
      border-radius: 10px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      transition: all 0.2s;
    }

    .header-btn:hover {
      background: #e2e8f0;
    }

    .header-btn .material-icons {
      font-size: 22px;
      color: #64748b;
    }

    .header-badge {
      position: absolute;
      top: 4px;
      right: 4px;
      background: #ef4444;
      color: white;
      font-size: 0.65rem;
      padding: 1px 5px;
      border-radius: 8px;
      min-width: 16px;
      text-align: center;
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .user-role {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .user-name {
      font-weight: 500;
      color: #333;
    }

    .user-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
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

      .logo-text, .nav-item span:not(.material-icons), .nav-section-title {
        display: none;
      }
    }
  `]
})
export class InstructorLayoutComponent implements OnInit {
  private authService = inject(AuthService);
  private instructorService = inject(InstructorService);
  private router = inject(Router);

  sidebarCollapsed = signal(false);
  currentUser = signal(this.authService.getCurrentUser());
  unreadNotifications = signal(0);

  ngOnInit(): void {
    this.loadUnreadCount();
  }

  loadUnreadCount(): void {
    this.instructorService.getUnreadNotificationCount().subscribe(count => {
      this.unreadNotifications.set(count);
    });
  }

  toggleSidebar(): void {
    this.sidebarCollapsed.update(v => !v);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}
