import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CourseService, Course, ApiResponse, PaginatedList } from '@core/services/course.service';
import { MediaService } from '@core/services/media.service';

interface CategoryItem {
  id: string;
  nameEn: string;
  nameAr: string;
  slug: string;
  iconUrl?: string;
  courseCount: number;
}

@Component({
  selector: 'app-courses-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="courses-page">
      <!-- Hero Section -->
      <section class="hero">
        <div class="hero-bg">
          <div class="grid-pattern"></div>
          <div class="orb orb-1"></div>
          <div class="orb orb-2"></div>
          <div class="orb orb-3"></div>
        </div>
        <div class="hero-content">
          <div class="badge">
            <span>🎓</span>
            <span>Learn from the Best</span>
          </div>
          <h1>Discover Our <span class="accent">Courses</span></h1>
          <p>Master in-demand skills with expert-led courses designed for real-world success.</p>
          
          <!-- Search Box -->
          <div class="search-box">
            <div class="search-icon">🔍</div>
            <input 
              type="text" 
              [(ngModel)]="searchQuery" 
              (ngModelChange)="filterCourses()"
              placeholder="Search for courses..."
            >
            <button class="search-btn">Search</button>
          </div>

          <!-- Stats Row -->
          <div class="stats-row">
            <div class="stat">
              <span class="stat-value">{{ courses().length }}+</span>
              <span class="stat-label">Courses</span>
            </div>
            <div class="divider"></div>
          </div>
        </div>
      </section>

      <!-- Category Pills -->
      <section class="category-section">
        <div class="container">
          <div class="category-pills">
            <button 
              class="pill" 
              [class.active]="selectedCategory() === 'all'"
              (click)="selectCategory('all')">
              All Courses
            </button>
            @for (cat of categories(); track cat.id) {
              <button 
                class="pill" 
                [class.active]="selectedCategory() === cat.nameEn"
                (click)="selectCategory(cat.nameEn)">
                {{ cat.nameEn }}
              </button>
            }
          </div>
        </div>
      </section>

      <!-- Main Content -->
      <section class="main-section">
        <div class="container">
          <div class="content-layout">
            <!-- Sidebar Filters -->
            <aside class="sidebar">
              <div class="filter-card">
                <h3>Level</h3>
                <div class="filter-options">
                  @for (level of levels; track level) {
                    <label class="filter-option">
                      <input 
                        type="checkbox" 
                        [checked]="selectedLevels().includes(level)"
                        (change)="toggleLevel(level)">
                      <span class="checkmark"></span>
                      <span>{{ level }}</span>
                    </label>
                  }
                </div>
              </div>

              <div class="filter-card">
                <h3>Price</h3>
                <div class="filter-options">
                  <label class="filter-option">
                    <input 
                      type="radio" 
                      name="price"
                      [checked]="priceFilter() === 'all'"
                      (change)="setPriceFilter('all')">
                    <span class="radio"></span>
                    <span>All</span>
                  </label>
                  <label class="filter-option">
                    <input 
                      type="radio" 
                      name="price"
                      [checked]="priceFilter() === 'free'"
                      (change)="setPriceFilter('free')">
                    <span class="radio"></span>
                    <span>Free</span>
                  </label>
                  <label class="filter-option">
                    <input 
                      type="radio" 
                      name="price"
                      [checked]="priceFilter() === 'paid'"
                      (change)="setPriceFilter('paid')">
                    <span class="radio"></span>
                    <span>Paid</span>
                  </label>
                </div>
              </div>

              <div class="filter-card">
                <h3>Duration</h3>
                <div class="filter-options">
                  @for (dur of durations; track dur.value) {
                    <label class="filter-option">
                      <input 
                        type="checkbox" 
                        [checked]="selectedDurations().includes(dur.value)"
                        (change)="toggleDuration(dur.value)">
                      <span class="checkmark"></span>
                      <span>{{ dur.label }}</span>
                    </label>
                  }
                </div>
              </div>

              <div class="filter-card">
                <h3>Sort By</h3>
                <select [(ngModel)]="sortBy" (ngModelChange)="filterCourses()">
                  <option value="popular">Most Popular</option>
                  <option value="newest">Newest</option>
                  <option value="rating">Highest Rated</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                </select>
              </div>

              <button class="reset-btn" (click)="resetFilters()">
                Reset All Filters
              </button>
            </aside>

            <!-- Courses Grid -->
            <div class="courses-content">
              <div class="results-header">
                <p class="results-count">
                  <strong>{{ filteredCourses().length }}</strong> courses found
                </p>
                <div class="view-toggle">
                  <button [class.active]="viewMode === 'grid'" (click)="viewMode = 'grid'">⊞</button>
                  <button [class.active]="viewMode === 'list'" (click)="viewMode = 'list'">☰</button>
                </div>
              </div>

              @if (isLoading()) {
                <div class="loading-grid">
                  @for (i of [1,2,3,4,5,6]; track i) {
                    <div class="skeleton-card">
                      <div class="skeleton-img"></div>
                      <div class="skeleton-content">
                        <div class="skeleton-line"></div>
                        <div class="skeleton-line short"></div>
                      </div>
                    </div>
                  }
                </div>
              } @else if (filteredCourses().length === 0) {
                <div class="empty-state">
                  <div class="empty-icon">🔍</div>
                  <h3>No Courses Found</h3>
                  <p>Try adjusting your search or filters to find what you're looking for.</p>
                  <button class="reset-btn" (click)="resetFilters()">Reset Filters</button>
                </div>
              } @else {
                <div class="courses-grid" [class.list-view]="viewMode === 'list'">
                  @for (course of displayedCourses(); track course.id) {
                    <div class="course-card" [routerLink]="['/courses', course.slug]">
                      <div class="card-image">
                        <img [src]="mediaService.getCourseThumbnail(course.thumbnailUrl)" [alt]="course.nameEn">
                        <div class="card-badges">
                          @if (course.isFeatured) {
                            <span class="badge featured">⭐ Featured</span>
                          }
                          @if (course.price === 0) {
                            <span class="badge free">Free</span>
                          }
                        </div>
                        <div class="card-overlay">
                          <button class="preview-btn">Preview</button>
                        </div>
                      </div>
                      <div class="card-content">
                        <div class="card-meta">
                          <span class="category">{{ course.category?.nameEn }}</span>
                          <span class="level" [attr.data-level]="course.level">{{ course.level }}</span>
                        </div>
                        <h3>{{ course.nameEn }}</h3>
                        <p class="description">{{ course.descriptionEn }}</p>
                        <div class="instructor">
                          <div class="instructor-avatar">
                            {{ course.instructor?.fullName?.charAt(0) || 'I' }}
                          </div>
                          <span>{{ course.instructor?.fullName || 'Expert Instructor' }}</span>
                        </div>
                        <div class="card-footer">
                          <div class="stats">
                            <span class="students">👥 {{ course.enrollmentCount || 0 }}</span>
                            <span class="duration">🕐 {{ course.durationHours || 1 }}h</span>
                          </div>
                          <div class="price">
                            @if (course.price === 0) {
                              <span class="free-label">Free</span>
                            } @else {
                              <span class="amount">{{ course.price | currency:'EGP':'symbol':'1.0-0' }}</span>
                            }
                          </div>
                        </div>
                      </div>
                    </div>
                  }
                </div>

                @if (filteredCourses().length > displayedCount()) {
                  <div class="load-more">
                    <button class="load-more-btn" (click)="loadMore()">
                      Load More Courses <span>↓</span>
                    </button>
                    <p class="load-info">
                      Showing {{ displayedCount() }} of {{ filteredCourses().length }} courses
                    </p>
                  </div>
                }
              }
            </div>
          </div>
        </div>
      </section>

      <!-- CTA Section -->
      <section class="cta-section">
        <div class="container">
          <div class="cta-box">
            <div class="cta-bg">
              <div class="cta-orb"></div>
            </div>
            <div class="cta-content">
              <h2>Not sure where to start?</h2>
              <p>Take our quick assessment and get personalized course recommendations.</p>
            </div>
            <a routerLink="/contact" class="cta-btn">
              Get Recommendations <span>→</span>
            </a>
          </div>
        </div>
      </section>
    </div>
  `,
  styles: [`
    :host {
      --primary: #247090;
      --primary-dark: #1a5570;
      --dark: #0f172a;
      --dark-light: #1e293b;
      --gray-100: #f8fafc;
      --gray-200: #e2e8f0;
      --gray-400: #94a3b8;
      --gray-600: #475569;
      --white: #fff;
      --success: #10b981;
      --warning: #f59e0b;
      --radius: 16px;
      --shadow: 0 4px 20px rgba(0,0,0,0.1);
    }

    .courses-page {
      background: var(--gray-100);
      min-height: 100vh;
    }

    .container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 0 1.5rem;
    }

    .accent {
      background: linear-gradient(135deg, var(--primary), #3498db);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    /* Hero */
    .hero {
      position: relative;
      padding: 8rem 2rem 5rem;
      background: var(--dark);
      overflow: hidden;
    }

    .hero-bg {
      position: absolute;
      inset: 0;
    }

    .grid-pattern {
      position: absolute;
      inset: 0;
      background-image: linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
      background-size: 60px 60px;
    }

    .orb {
      position: absolute;
      border-radius: 50%;
      filter: blur(100px);
    }

    .orb-1 {
      width: 500px;
      height: 500px;
      background: var(--primary);
      opacity: 0.25;
      top: -150px;
      right: -100px;
    }

    .orb-2 {
      width: 350px;
      height: 350px;
      background: #8b5cf6;
      opacity: 0.2;
      bottom: -100px;
      left: 10%;
    }

    .orb-3 {
      width: 200px;
      height: 200px;
      background: #10b981;
      opacity: 0.15;
      top: 50%;
      left: 50%;
    }

    .hero-content {
      position: relative;
      z-index: 1;
      text-align: center;
      max-width: 800px;
      margin: 0 auto;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.625rem 1.25rem;
      background: rgba(255,255,255,0.1);
      border: 1px solid rgba(255,255,255,0.2);
      border-radius: 100px;
      color: var(--white);
      font-size: 0.875rem;
      margin-bottom: 1.5rem;
    }

    .hero h1 {
      font-size: 3.5rem;
      font-weight: 800;
      color: var(--white);
      margin-bottom: 1rem;
    }

    .hero p {
      font-size: 1.25rem;
      color: rgba(255,255,255,0.8);
      line-height: 1.7;
      margin-bottom: 2rem;
    }

    .search-box {
      display: flex;
      align-items: center;
      max-width: 600px;
      margin: 0 auto 2rem;
      background: var(--white);
      border-radius: 100px;
      padding: 0.5rem;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }

    .search-icon {
      padding: 0 1rem;
      font-size: 1.25rem;
    }

    .search-box input {
      flex: 1;
      padding: 1rem;
      border: none;
      background: transparent;
      font-size: 1rem;
      outline: none;
    }

    .search-btn {
      padding: 1rem 2rem;
      background: linear-gradient(135deg, var(--primary), var(--primary-dark));
      color: var(--white);
      border: none;
      border-radius: 100px;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.3s;
    }

    .search-btn:hover {
      transform: scale(1.05);
    }

    .stats-row {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 2rem;
      margin-top: 1rem;
    }

    .stat {
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .stat-value {
      font-size: 1.5rem;
      font-weight: 800;
      color: var(--white);
    }

    .stat-label {
      font-size: 0.875rem;
      color: rgba(255,255,255,0.6);
    }

    .divider {
      width: 1px;
      height: 40px;
      background: rgba(255,255,255,0.2);
    }

    /* Category Pills */
    .category-section {
      padding: 1.5rem 0;
      background: var(--white);
      border-bottom: 1px solid var(--gray-200);
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .category-pills {
      display: flex;
      gap: 0.75rem;
      overflow-x: auto;
      padding: 0.5rem 0;
      scrollbar-width: none;
    }

    .category-pills::-webkit-scrollbar { display: none; }

    .pill {
      padding: 0.75rem 1.5rem;
      border: 2px solid var(--gray-200);
      border-radius: 100px;
      background: var(--white);
      font-weight: 500;
      color: var(--gray-600);
      cursor: pointer;
      transition: all 0.3s;
      white-space: nowrap;
    }

    .pill:hover {
      border-color: var(--primary);
      color: var(--primary);
    }

    .pill.active {
      background: var(--primary);
      border-color: var(--primary);
      color: var(--white);
    }

    /* Main Content */
    .main-section {
      padding: 3rem 0;
    }

    .content-layout {
      display: grid;
      grid-template-columns: 280px 1fr;
      gap: 2rem;
    }

    /* Sidebar */
    .sidebar {
      position: sticky;
      top: 100px;
      height: fit-content;
    }

    .filter-card {
      background: var(--white);
      border-radius: var(--radius);
      padding: 1.5rem;
      margin-bottom: 1rem;
      box-shadow: var(--shadow);
    }

    .filter-card h3 {
      font-size: 1rem;
      font-weight: 700;
      color: var(--dark);
      margin-bottom: 1rem;
    }

    .filter-options {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .filter-option {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      cursor: pointer;
      color: var(--gray-600);
    }

    .filter-option input {
      display: none;
    }

    .checkmark, .radio {
      width: 20px;
      height: 20px;
      border: 2px solid var(--gray-200);
      position: relative;
      transition: all 0.3s;
    }

    .checkmark { border-radius: 4px; }
    .radio { border-radius: 50%; }

    .filter-option input:checked + .checkmark,
    .filter-option input:checked + .radio {
      background: var(--primary);
      border-color: var(--primary);
    }

    .filter-option input:checked + .checkmark::after,
    .filter-option input:checked + .radio::after {
      content: '';
      position: absolute;
    }

    .filter-option input:checked + .checkmark::after {
      content: '✓';
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--white);
      font-size: 0.75rem;
    }

    .filter-option input:checked + .radio::after {
      width: 8px;
      height: 8px;
      background: var(--white);
      border-radius: 50%;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    }

    .filter-card select {
      width: 100%;
      padding: 0.75rem;
      border: 2px solid var(--gray-200);
      border-radius: 8px;
      background: var(--white);
      font-size: 0.9rem;
      cursor: pointer;
    }

    .reset-btn {
      width: 100%;
      padding: 0.875rem;
      background: transparent;
      border: 2px solid var(--gray-200);
      border-radius: 8px;
      color: var(--gray-600);
      font-weight: 500;
      cursor: pointer;
      transition: all 0.3s;
    }

    .reset-btn:hover {
      border-color: var(--primary);
      color: var(--primary);
    }

    /* Courses Content */
    .courses-content {
      min-height: 400px;
    }

    .results-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }

    .results-count {
      color: var(--gray-600);
    }

    .view-toggle {
      display: flex;
      gap: 0.5rem;
    }

    .view-toggle button {
      width: 40px;
      height: 40px;
      border: 2px solid var(--gray-200);
      border-radius: 8px;
      background: var(--white);
      cursor: pointer;
      font-size: 1.25rem;
      transition: all 0.3s;
    }

    .view-toggle button.active {
      background: var(--primary);
      border-color: var(--primary);
      color: var(--white);
    }

    .courses-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 1.5rem;
    }

    .courses-grid.list-view {
      grid-template-columns: 1fr;
    }

    .courses-grid.list-view .course-card {
      display: grid;
      grid-template-columns: 280px 1fr;
    }

    .courses-grid.list-view .card-image {
      height: 100%;
    }

    .course-card {
      background: var(--white);
      border-radius: var(--radius);
      overflow: hidden;
      box-shadow: var(--shadow);
      cursor: pointer;
      transition: all 0.3s;
    }

    .course-card:hover {
      transform: translateY(-6px);
      box-shadow: 0 16px 50px rgba(0,0,0,0.15);
    }

    .card-image {
      position: relative;
      height: 180px;
      background: linear-gradient(135deg, var(--dark-light), var(--dark));
      overflow: hidden;
    }

    .card-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .placeholder-img {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 4rem;
      opacity: 0.3;
    }

    .card-badges {
      position: absolute;
      top: 1rem;
      left: 1rem;
      display: flex;
      gap: 0.5rem;
    }

    .card-badges .badge {
      padding: 0.375rem 0.75rem;
      border-radius: 100px;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .badge.featured {
      background: linear-gradient(135deg, #f59e0b, #d97706);
      color: var(--white);
    }

    .badge.free {
      background: var(--success);
      color: var(--white);
    }

    .card-overlay {
      position: absolute;
      inset: 0;
      background: rgba(0,0,0,0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.3s;
    }

    .course-card:hover .card-overlay {
      opacity: 1;
    }

    .preview-btn {
      padding: 0.75rem 2rem;
      background: var(--white);
      border: none;
      border-radius: 100px;
      font-weight: 600;
      color: var(--dark);
      cursor: pointer;
      transform: translateY(10px);
      transition: transform 0.3s;
    }

    .course-card:hover .preview-btn {
      transform: translateY(0);
    }

    .card-content {
      padding: 1.5rem;
    }

    .card-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.75rem;
    }

    .category {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--primary);
      text-transform: uppercase;
    }

    .level {
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.7rem;
      font-weight: 600;
    }

    .level[data-level="Beginner"] { background: #dcfce7; color: #166534; }
    .level[data-level="Intermediate"] { background: #fef9c3; color: #854d0e; }
    .level[data-level="Advanced"] { background: #fee2e2; color: #991b1b; }

    .card-content h3 {
      font-size: 1.125rem;
      font-weight: 700;
      color: var(--dark);
      margin-bottom: 0.5rem;
      line-height: 1.4;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .description {
      font-size: 0.875rem;
      color: var(--gray-600);
      line-height: 1.6;
      margin-bottom: 1rem;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .instructor {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 1rem;
    }

    .instructor-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: var(--primary);
      color: var(--white);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 0.875rem;
    }

    .instructor span {
      font-size: 0.875rem;
      color: var(--gray-600);
    }

    .card-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 1rem;
      border-top: 1px solid var(--gray-200);
    }

    .stats {
      display: flex;
      gap: 0.75rem;
      font-size: 0.8rem;
      color: var(--gray-400);
    }

    .price .free-label {
      font-size: 1.125rem;
      font-weight: 700;
      color: var(--success);
    }

    .price .amount {
      font-size: 1.25rem;
      font-weight: 800;
      color: var(--primary);
    }

    /* Loading & Empty */
    .loading-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 1.5rem;
    }

    .skeleton-card {
      background: var(--white);
      border-radius: var(--radius);
      overflow: hidden;
    }

    .skeleton-img {
      height: 180px;
      background: linear-gradient(90deg, var(--gray-200) 25%, var(--white) 50%, var(--gray-200) 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
    }

    .skeleton-content {
      padding: 1.5rem;
    }

    .skeleton-line {
      height: 16px;
      background: var(--gray-200);
      border-radius: 4px;
      margin-bottom: 0.75rem;
    }

    .skeleton-line.short { width: 60%; }

    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    .empty-state {
      text-align: center;
      padding: 4rem 2rem;
      background: var(--white);
      border-radius: var(--radius);
    }

    .empty-icon {
      font-size: 4rem;
      margin-bottom: 1rem;
    }

    .empty-state h3 {
      font-size: 1.5rem;
      color: var(--dark);
      margin-bottom: 0.5rem;
    }

    .empty-state p {
      color: var(--gray-600);
      margin-bottom: 1.5rem;
    }

    /* Load More */
    .load-more {
      text-align: center;
      margin-top: 2.5rem;
    }

    .load-more-btn {
      padding: 1rem 2.5rem;
      background: var(--white);
      border: 2px solid var(--primary);
      border-radius: var(--radius);
      color: var(--primary);
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      transition: all 0.3s;
    }

    .load-more-btn:hover {
      background: var(--primary);
      color: var(--white);
    }

    .load-info {
      color: var(--gray-400);
      font-size: 0.875rem;
      margin-top: 1rem;
    }

    /* CTA */
    .cta-section {
      padding: 4rem 0 6rem;
    }

    .cta-box {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 3rem 4rem;
      background: linear-gradient(135deg, var(--primary), var(--primary-dark));
      border-radius: 24px;
      gap: 2rem;
      overflow: hidden;
    }

    .cta-bg {
      position: absolute;
      inset: 0;
    }

    .cta-orb {
      position: absolute;
      width: 300px;
      height: 300px;
      border-radius: 50%;
      background: rgba(255,255,255,0.1);
      top: -100px;
      right: -50px;
    }

    .cta-content {
      position: relative;
      z-index: 1;
    }

    .cta-content h2 {
      font-size: 2rem;
      font-weight: 800;
      color: var(--white);
      margin-bottom: 0.5rem;
    }

    .cta-content p {
      color: rgba(255,255,255,0.9);
      font-size: 1.125rem;
    }

    .cta-btn {
      position: relative;
      z-index: 1;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 1rem 2rem;
      background: var(--white);
      color: var(--primary);
      border-radius: var(--radius);
      font-weight: 600;
      text-decoration: none;
      transition: all 0.3s;
      white-space: nowrap;
    }

    .cta-btn:hover {
      transform: scale(1.05);
      box-shadow: 0 10px 30px rgba(0,0,0,0.2);
    }

    /* Responsive */
    @media (max-width: 1200px) {
      .courses-grid { grid-template-columns: repeat(2, 1fr); }
    }

    @media (max-width: 992px) {
      .content-layout {
        grid-template-columns: 1fr;
      }
      .sidebar {
        position: static;
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 1rem;
      }
      .reset-btn {
        grid-column: span 2;
      }
      .courses-grid { grid-template-columns: repeat(2, 1fr); }
    }

    @media (max-width: 768px) {
      .hero { padding: 6rem 1.5rem 4rem; }
      .hero h1 { font-size: 2rem; }
      .search-box { flex-direction: column; border-radius: 16px; }
      .search-btn { width: 100%; margin-top: 0.5rem; border-radius: 12px; }
      .sidebar {
        grid-template-columns: 1fr;
      }
      .reset-btn {
        grid-column: span 1;
      }
      .courses-grid { grid-template-columns: 1fr; }
      .courses-grid.list-view .course-card { grid-template-columns: 1fr; }
      .cta-box { flex-direction: column; text-align: center; padding: 2rem; }
      .stats-row { gap: 1rem; }
      .stat-value { font-size: 1.25rem; }
    }
  `]
})
export class CoursesListComponent implements OnInit {
  private courseService = inject(CourseService);
  mediaService = inject(MediaService);

  isLoading = signal(true);
  courses = signal<Course[]>([]);
  categories = signal<CategoryItem[]>([]);
  selectedCategory = signal('all');
  selectedLevels = signal<string[]>([]);
  selectedDurations = signal<string[]>([]);
  priceFilter = signal<'all' | 'free' | 'paid'>('all');
  searchQuery = '';
  sortBy = 'popular';
  viewMode: 'grid' | 'list' = 'grid';
  displayedCount = signal(12);

  levels = ['Beginner', 'Intermediate', 'Advanced'];
  durations = [
    { value: 'short', label: '0-2 Hours' },
    { value: 'medium', label: '2-10 Hours' },
    { value: 'long', label: '10+ Hours' }
  ];

  filteredCourses = computed(() => {
    let result = [...this.courses()];

    // Category filter
    if (this.selectedCategory() !== 'all') {
      result = result.filter(c => c.category?.nameEn === this.selectedCategory());
    }

    // Level filter
    if (this.selectedLevels().length > 0) {
      result = result.filter(c => this.selectedLevels().includes(c.level || 'Beginner'));
    }

    // Price filter
    if (this.priceFilter() === 'free') {
      result = result.filter(c => c.price === 0);
    } else if (this.priceFilter() === 'paid') {
      result = result.filter(c => c.price > 0);
    }

    // Search
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      result = result.filter(c =>
        c.nameEn.toLowerCase().includes(query) ||
        (c.descriptionEn?.toLowerCase().includes(query)) ||
        (c.instructor?.fullName?.toLowerCase().includes(query))
      );
    }

    // Sort
    switch (this.sortBy) {
      case 'newest':
        // No createdAt field, use id or skip sorting
        break;
      case 'rating':
        result.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
        break;
      case 'price-low':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'popular':
      default:
        result.sort((a, b) => (b.enrollmentCount || 0) - (a.enrollmentCount || 0));
    }

    return result;
  });

  displayedCourses = computed(() => {
    return this.filteredCourses().slice(0, this.displayedCount());
  });

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.isLoading.set(true);

    this.courseService.getCategories().subscribe({
      next: (response) => {
        if (response.isSuccess && response.data) {
          this.categories.set(response.data);
        }
      },
      error: () => console.error('Failed to load categories')
    });

    this.courseService.getCourses().subscribe({
      next: (response) => {
        if (response.isSuccess && response.data) {
          this.courses.set(response.data.items);
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  selectCategory(category: string) {
    this.selectedCategory.set(category);
    this.displayedCount.set(12);
  }

  toggleLevel(level: string) {
    const current = this.selectedLevels();
    if (current.includes(level)) {
      this.selectedLevels.set(current.filter(l => l !== level));
    } else {
      this.selectedLevels.set([...current, level]);
    }
    this.displayedCount.set(12);
  }

  toggleDuration(duration: string) {
    const current = this.selectedDurations();
    if (current.includes(duration)) {
      this.selectedDurations.set(current.filter(d => d !== duration));
    } else {
      this.selectedDurations.set([...current, duration]);
    }
    this.displayedCount.set(12);
  }

  setPriceFilter(filter: 'all' | 'free' | 'paid') {
    this.priceFilter.set(filter);
    this.displayedCount.set(12);
  }

  filterCourses() {
    this.displayedCount.set(12);
  }

  resetFilters() {
    this.searchQuery = '';
    this.selectedCategory.set('all');
    this.selectedLevels.set([]);
    this.selectedDurations.set([]);
    this.priceFilter.set('all');
    this.sortBy = 'popular';
    this.displayedCount.set(12);
  }

  loadMore() {
    this.displayedCount.update(c => c + 12);
  }
}
