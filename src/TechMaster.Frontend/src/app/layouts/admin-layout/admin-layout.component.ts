import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { MediaService } from '../../core/services/media.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="dashboard-layout">
      <!-- Sidebar -->
      <aside class="sidebar" [class.collapsed]="sidebarCollapsed()">
        <div class="sidebar-header">
          <a routerLink="/" class="logo">
            <span class="logo-icon">⚙️</span>
            @if (!sidebarCollapsed()) {
              <span class="logo-text">Admin Panel</span>
            }
          </a>
          <button class="collapse-btn" (click)="toggleSidebar()">
            <span class="material-icons">{{ sidebarCollapsed() ? 'chevron_right' : 'chevron_left' }}</span>
          </button>
        </div>

        <nav class="sidebar-nav">
          <a routerLink="/admin/dashboard" routerLinkActive="active" class="nav-item">
            <span class="material-icons">dashboard</span>
            @if (!sidebarCollapsed()) {
              <span>Dashboard</span>
            }
          </a>
          <a routerLink="/admin/users" routerLinkActive="active" class="nav-item">
            <span class="material-icons">people</span>
            @if (!sidebarCollapsed()) {
              <span>Users</span>
            }
          </a>
          <a routerLink="/admin/courses" routerLinkActive="active" class="nav-item">
            <span class="material-icons">school</span>
            @if (!sidebarCollapsed()) {
              <span>Courses</span>
            }
          </a>
            <a routerLink="/admin/create-course" routerLinkActive="active" class="nav-item">
            <span class="material-icons">school</span>
            @if (!sidebarCollapsed()) {
              <span>Add Courses</span>
            }
          </a>
          <a routerLink="/admin/enrollments" routerLinkActive="active" class="nav-item">
            <span class="material-icons">how_to_reg</span>
            @if (!sidebarCollapsed()) {
              <span>Enrollments</span>
            }
          </a>
          <a routerLink="/admin/messages" routerLinkActive="active" class="nav-item">
            <span class="material-icons">mail</span>
            @if (!sidebarCollapsed()) {
              <span>Messages</span>
            }
          </a>
          <a routerLink="/admin/internships" routerLinkActive="active" class="nav-item">
            <span class="material-icons">work</span>
            @if (!sidebarCollapsed()) {
              <span>Internships</span>
            }
          </a>
          <a routerLink="/admin/certificates" routerLinkActive="active" class="nav-item">
            <span class="material-icons">workspace_premium</span>
            @if (!sidebarCollapsed()) {
              <span>Certificates</span>
            }
          </a>
          <a routerLink="/admin/library" routerLinkActive="active" class="nav-item">
            <span class="material-icons">library_books</span>
            @if (!sidebarCollapsed()) {
              <span>Library</span>
            }
          </a>
          <a routerLink="/admin/testimonials" routerLinkActive="active" class="nav-item">
            <span class="material-icons">format_quote</span>
            @if (!sidebarCollapsed()) {
              <span>Testimonials</span>
            }
          </a>
          <a routerLink="/admin/reports" routerLinkActive="active" class="nav-item">
            <span class="material-icons">analytics</span>
            @if (!sidebarCollapsed()) {
              <span>Reports</span>
            }
          </a>
          <a routerLink="/admin/settings" routerLinkActive="active" class="nav-item">
            <span class="material-icons">settings</span>
            @if (!sidebarCollapsed()) {
              <span>Settings</span>
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
      <div class="main-wrapper" [class.expanded]="sidebarCollapsed()">
        <header class="top-header">
          <div class="header-left">
            <h1 class="page-title">Admin Dashboard</h1>
          </div>
          <div class="header-right">
            <div class="user-info">
              <span class="user-role">Administrator</span>
              <span class="user-name">{{ currentUser()?.firstName }} {{ currentUser()?.lastName }}</span>
              <div class="user-avatar admin">
                @if (currentUser()?.profileImageUrl) {
                  <img [src]="mediaService.getAvatarUrl(currentUser()?.profileImageUrl)" alt="Profile">
                } @else {
                  <span>{{ currentUser()?.firstName?.charAt(0) || 'A' }}</span>
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
      background: #f0f2f5;
    }

    .sidebar {
      width: 260px;
      background: linear-gradient(180deg, #0f0f23 0%, #1a1a3e 100%);
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
      font-size: 1.1rem;
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
      gap: 6px;
      overflow-y: auto;
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
      background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
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
      color: #1a1a2e;
      margin: 0;
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .user-role {
      background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
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
      background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
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
export class AdminLayoutComponent {
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
