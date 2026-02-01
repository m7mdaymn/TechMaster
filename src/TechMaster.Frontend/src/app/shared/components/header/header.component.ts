import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { MediaService } from '@core/services/media.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <header class="header" [class.scrolled]="isScrolled()">
      <nav class="container nav">
        <!-- Logo -->
        <a routerLink="/" class="logo">
          <span class="logo-tech">Tech</span><span class="logo-master">Master</span>
        </a>

        <!-- Desktop Navigation -->
        <ul class="nav-links desktop-nav">
          <li><a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}">Home</a></li>
          <li><a routerLink="/courses" routerLinkActive="active">Courses</a></li>
          <li><a routerLink="/internships" routerLinkActive="active">Internships</a></li>
          <li><a routerLink="/library" routerLinkActive="active">Library</a></li>
          <li><a routerLink="/about" routerLinkActive="active">About</a></li>
          <li><a routerLink="/contact" routerLinkActive="active">Contact</a></li>
        </ul>

        <!-- Right Side -->
        <div class="nav-actions">
   

          <!-- Auth Buttons -->
          @if (!authService.isAuthenticated()) {
            <a routerLink="/auth/login" class="btn btn-secondary btn-sm">Login</a>
            <a routerLink="/auth/register" class="btn btn-primary btn-sm">Register</a>
          } @else {
            <div class="user-menu">
              <button class="user-button" (click)="toggleUserMenu()">
                @if (currentUser()?.profileImageUrl) {
                  <img [src]="mediaService.getAvatarUrl(currentUser()?.profileImageUrl)" alt="User" class="user-avatar">
                } @else {
                  <div class="user-avatar-placeholder">
                    {{ currentUser()?.fullName?.charAt(0) || 'U' }}
                  </div>
                }
                <span class="user-name">{{ currentUser()?.fullName }}</span>
                <span class="material-icons">expand_more</span>
              </button>

              @if (showUserMenu()) {
                <div class="user-dropdown">
                  @if (authService.isAdmin()) {
                    <a routerLink="/admin/dashboard" class="dropdown-item">
                      <span class="material-icons">dashboard</span>
                      Admin Dashboard
                    </a>
                  }
                  @if (authService.isInstructor()) {
                    <a routerLink="/instructor/dashboard" class="dropdown-item">
                      <span class="material-icons">school</span>
                      Instructor Dashboard
                    </a>
                  }
                   @if (authService.isStudent()) {
                    <a routerLink="/student/dashboard" class="dropdown-item">
                      <span class="material-icons">home</span>
                      My Dashboard
                    </a>
                  }
                  <hr class="dropdown-divider">
                  <button class="dropdown-item logout" (click)="logout()">
                    <span class="material-icons">logout</span>
                    Logout
                  </button>
                </div>
              }
            </div>
          }

          <!-- Mobile Menu Toggle -->
          <button class="mobile-menu-toggle" (click)="toggleMobileMenu()">
            <span class="material-icons">{{ showMobileMenu() ? 'close' : 'menu' }}</span>
          </button>
        </div>
      </nav>

      <!-- Mobile Navigation -->
      @if (showMobileMenu()) {
        <div class="mobile-nav">
          <ul class="mobile-nav-links">
            <li><a routerLink="/" (click)="closeMobileMenu()">Home</a></li>
            <li><a routerLink="/courses" (click)="closeMobileMenu()">Courses</a></li>
            <li><a routerLink="/internships" (click)="closeMobileMenu()">Internships</a></li>
            <li><a routerLink="/library" (click)="closeMobileMenu()">Library</a></li>
            <li><a routerLink="/about" (click)="closeMobileMenu()">About</a></li>
            <li><a routerLink="/contact" (click)="closeMobileMenu()">Contact</a></li>
          </ul>

          @if (!authService.isAuthenticated()) {
            <div class="mobile-auth">
              <a routerLink="/auth/login" class="btn btn-secondary" (click)="closeMobileMenu()">Login</a>
              <a routerLink="/auth/register" class="btn btn-primary" (click)="closeMobileMenu()">Register</a>
            </div>
          }
        </div>
      }
    </header>
  `,
  styles: [`
    .header {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 1000;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      border-bottom: 1px solid transparent;
      transition: all 0.3s ease;

      &.scrolled {
        border-bottom-color: #e5e7eb;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
      }
    }

    .nav {
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 72px;
    }

    .logo {
      font-size: 1.5rem;
      font-weight: 800;
      text-decoration: none;
      display: flex;

      .logo-tech {
        color: #247090;
      }

      .logo-master {
        color: #000;
      }
    }

    .nav-links {
      display: flex;
      gap: 2rem;
      list-style: none;

      a {
        text-decoration: none;
        color: #374151;
        font-weight: 500;
        transition: color 0.2s;
        position: relative;

        &:hover, &.active {
          color: #247090;
        }

        &.active::after {
          content: '';
          position: absolute;
          bottom: -4px;
          left: 0;
          right: 0;
          height: 2px;
          background: #247090;
          border-radius: 1px;
        }
      }
    }

    .nav-actions {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .lang-toggle {
      padding: 0.5rem 1rem;
      border: 1px solid #e5e7eb;
      border-radius: 0.375rem;
      background: transparent;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        border-color: #247090;
        color: #247090;
      }
    }

    .user-menu {
      position: relative;
    }

    .user-button {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem;
      background: transparent;
      border: none;
      cursor: pointer;
      border-radius: 0.5rem;
      transition: background 0.2s;

      &:hover {
        background: #f3f4f6;
      }
    }

    .user-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      object-fit: cover;
    }

    .user-avatar-placeholder {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: #247090;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
    }

    .user-name {
      font-weight: 500;
      max-width: 120px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;

      @media (max-width: 768px) {
        display: none;
      }
    }

    .user-dropdown {
      position: absolute;
      top: 100%;
      right: 0;
      min-width: 220px;
      background: white;
      border-radius: 0.75rem;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
      padding: 0.5rem;
      margin-top: 0.5rem;
      z-index: 100;

      [dir="rtl"] & {
        right: auto;
        left: 0;
      }
    }

    .dropdown-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      border-radius: 0.5rem;
      text-decoration: none;
      color: #374151;
      font-weight: 500;
      transition: background 0.2s;
      border: none;
      background: none;
      width: 100%;
      cursor: pointer;
      font-size: 0.9rem;

      .material-icons {
        font-size: 1.25rem;
        color: #6b7280;
      }

      &:hover {
        background: #f3f4f6;
      }

      &.logout {
        color: #ef4444;

        .material-icons {
          color: #ef4444;
        }
      }
    }

    .dropdown-divider {
      margin: 0.5rem 0;
      border: none;
      border-top: 1px solid #e5e7eb;
    }

    .mobile-menu-toggle {
      display: none;
      padding: 0.5rem;
      background: transparent;
      border: none;
      cursor: pointer;

      @media (max-width: 992px) {
        display: block;
      }
    }

    .desktop-nav {
      @media (max-width: 992px) {
        display: none;
      }
    }

    .mobile-nav {
      display: none;
      padding: 1rem;
      background: white;
      border-top: 1px solid #e5e7eb;

      @media (max-width: 992px) {
        display: block;
      }
    }

    .mobile-nav-links {
      list-style: none;

      a {
        display: block;
        padding: 1rem;
        text-decoration: none;
        color: #374151;
        font-weight: 500;
        border-radius: 0.5rem;
        transition: background 0.2s;

        &:hover {
          background: #f3f4f6;
        }
      }
    }

    .mobile-auth {
      display: flex;
      gap: 1rem;
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid #e5e7eb;

      .btn {
        flex: 1;
        text-align: center;
      }
    }
  `]
})
export class HeaderComponent {
  authService = inject(AuthService);
  mediaService = inject(MediaService);

  isScrolled = signal(false);
  showMobileMenu = signal(false);
  showUserMenu = signal(false);
  currentUser = signal(this.authService.getCurrentUser());

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('scroll', () => {
        this.isScrolled.set(window.scrollY > 20);
      });

      // Close dropdown when clicking outside
      window.addEventListener('click', (e) => {
        if (!(e.target as HTMLElement).closest('.user-menu')) {
          this.showUserMenu.set(false);
        }
      });
    }

    // Subscribe to user changes
    this.authService.currentUser$.subscribe(user => {
      this.currentUser.set(user);
    });
  }

  toggleMobileMenu(): void {
    this.showMobileMenu.update(v => !v);
  }

  closeMobileMenu(): void {
    this.showMobileMenu.set(false);
  }

  toggleUserMenu(): void {
    this.showUserMenu.update(v => !v);
  }

  logout(): void {
    this.authService.logout();
    this.showUserMenu.set(false);
  }
}
