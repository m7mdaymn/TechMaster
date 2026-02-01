import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { InternshipService } from '../../../core/services/internship.service';
import { MediaService } from '../../../core/services/media.service';
import { ToastrService } from 'ngx-toastr';

interface Internship {
  id: string;
  slug: string;
  title: string;
  company: string;
  companyLogo: string;
  location: string;
  type: 'Remote' | 'OnSite' | 'Hybrid';
  duration: string;
  description: string;
  requirements: string[];
  postedAt: Date;
  deadline: Date;
  applicants: number;
  isPaid?: boolean;
  stipend?: number;
  hasFee?: boolean;
  feeAmount?: number;
  currency?: string;
}

@Component({
  selector: 'app-internships-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="internships-page">
      <!-- Premium Hero Section -->
      <section class="hero">
        <div class="hero-bg">
          <div class="hero-pattern"></div>
          <div class="hero-gradient"></div>
          <div class="floating-shapes">
            <div class="shape shape-1"></div>
            <div class="shape shape-2"></div>
            <div class="shape shape-3"></div>
          </div>
        </div>
        <div class="hero-content">
          <div class="hero-badge">
            <span class="badge-icon">🚀</span>
            <span class="badge-text">Launch Your Career</span>
          </div>
          <h1>Find Your <span class="accent">Dream Internship</span></h1>
          <p class="hero-subtitle">Connect with top companies and gain real-world experience to accelerate your career</p>
          
          <div class="search-container">
            <div class="search-box">
              <span class="search-icon">🔍</span>
              <input 
                type="text" 
                [(ngModel)]="searchQuery" 
                (ngModelChange)="filterInternships()"
                placeholder="Search by job title, company, or skill..."
              >
              <button class="search-btn">Search</button>
            </div>
          </div>

          <div class="hero-stats">
            <div class="stat-item">
              <span class="stat-number">{{ internships().length }}+</span>
              <span class="stat-label">Opportunities</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Filters Section -->
      <section class="filters-section">
        <div class="container">
          <div class="filters-wrapper">
            <div class="filters-row">
              <div class="filter-group">
                <label><span class="filter-icon">💼</span> Work Type</label>
                <select [(ngModel)]="typeFilter" (ngModelChange)="filterInternships()">
                  <option value="all">All Types</option>
                  <option value="Remote">🏠 Remote</option>
                  <option value="OnSite">🏢 On-Site</option>
                  <option value="Hybrid">🔄 Hybrid</option>
                </select>
              </div>

              <div class="filter-group">
                <label><span class="filter-icon">📍</span> Location</label>
                <select [(ngModel)]="locationFilter" (ngModelChange)="filterInternships()">
                  <option value="all">All Locations</option>
                  <option value="Cairo">🇪🇬 Cairo, Egypt</option>
                  <option value="Dubai">🇦🇪 Dubai, UAE</option>
                  <option value="Riyadh">🇸🇦 Riyadh, KSA</option>
                  <option value="Amman">🇯🇴 Amman, Jordan</option>
                </select>
              </div>

              <div class="filter-group">
                <label><span class="filter-icon">⏱️</span> Duration</label>
                <select [(ngModel)]="durationFilter" (ngModelChange)="filterInternships()">
                  <option value="all">Any Duration</option>
                  <option value="1-3">1-3 months</option>
                  <option value="3-6">3-6 months</option>
                  <option value="6+">6+ months</option>
                </select>
              </div>

              <button class="clear-btn" (click)="clearFilters()">
                <span>✕</span> Clear All
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- Internships List -->
      <section class="internships-section">
        <div class="container">
          <div class="results-header">
            <div class="results-info">
              <span class="results-count">{{ filteredInternships().length }} opportunities found</span>
              <span class="results-hint" *ngIf="searchQuery">for "{{ searchQuery }}"</span>
            </div>
            <div class="sort-control">
              <span class="sort-label">Sort by:</span>
              <select [(ngModel)]="sortBy" (ngModelChange)="sortInternships()">
                <option value="newest">Newest First</option>
                <option value="deadline">Deadline</option>
                <option value="applicants">Most Applied</option>
              </select>
            </div>
          </div>

          @if (loading()) {
            <div class="loading-grid">
              @for (i of [1, 2, 3, 4]; track i) {
                <div class="skeleton-card">
                  <div class="skeleton-header">
                    <div class="skeleton-avatar"></div>
                    <div class="skeleton-text">
                      <div class="skeleton-line long"></div>
                      <div class="skeleton-line short"></div>
                    </div>
                  </div>
                  <div class="skeleton-body">
                    <div class="skeleton-line full"></div>
                    <div class="skeleton-line full"></div>
                    <div class="skeleton-line medium"></div>
                  </div>
                </div>
              }
            </div>
          } @else {
            <div class="internships-grid">
              @for (internship of filteredInternships(); track internship.id) {
                <div class="internship-card" [class.urgent]="isUrgent(internship.deadline)">
                  @if (isUrgent(internship.deadline)) {
                    <div class="urgent-ribbon"></div>
                  }
                  @if (internship.hasFee) {
                    <div class="fee-ribbon">💳 Fee Required</div>
                  }
                  @if (internship.isPaid && internship.stipend) {
                    <div class="paid-badge">💰 Paid</div>
                  }
                  <div class="card-header">
                    <div class="company-logo">
                      @if (internship.companyLogo) {
                        <img [src]="mediaService.getImageUrl(internship.companyLogo)" [alt]="internship.company">
                      } @else {
                        <span class="logo-placeholder">{{ internship.company.charAt(0) }}</span>
                      }
                    </div>
                    <div class="company-info">
                      <h3 class="job-title">{{ internship.title }}</h3>
                      <span class="company-name">{{ internship.company }}</span>
                    </div>
                    <span class="type-badge" [class]="internship.type.toLowerCase()">
                      <span class="type-icon">{{ getTypeIcon(internship.type) }}</span>
                      {{ internship.type }}
                    </span>
                  </div>

                  <div class="card-body">
                    <p class="description">{{ internship.description }}</p>
                    
                    <div class="meta-grid">
                      <div class="meta-item">
                        <span class="meta-icon">📍</span>
                        <span class="meta-text">{{ internship.location }}</span>
                      </div>
                      <div class="meta-item">
                        <span class="meta-icon">⏱️</span>
                        <span class="meta-text">{{ internship.duration }}</span>
                      </div>
                      <div class="meta-item">
                        <span class="meta-icon">👥</span>
                        <span class="meta-text">{{ internship.applicants }} applicants</span>
                      </div>
                      <div class="meta-item">
                        <span class="meta-icon">�</span>
                        <span class="meta-text">{{ internship.postedAt | date:'MMM d' }}</span>
                      </div>
                    </div>

                    <div class="skills-row">
                      @for (req of internship.requirements.slice(0, 3); track req) {
                        <span class="skill-tag">{{ req }}</span>
                      }
                      @if (internship.requirements.length > 3) {
                        <span class="skill-more">+{{ internship.requirements.length - 3 }}</span>
                      }
                    </div>
                  </div>

                  <div class="card-footer">
                    <div class="deadline-info" [class.urgent]="isUrgent(internship.deadline)">
                      <span class="deadline-icon">{{ isUrgent(internship.deadline) ? '⚠️' : '📅' }}</span>
                      <span class="deadline-text">Deadline: {{ internship.deadline | date:'MMM d, yyyy' }}</span>
                    </div>
                    <a [routerLink]="['/internships', internship.slug || internship.id]" class="view-btn">
                      View Details
                      <span class="btn-arrow">→</span>
                    </a>
                  </div>
                </div>
              } @empty {
                <div class="empty-state">
                  <div class="empty-illustration">
                    <span class="empty-icon">💼</span>
                  </div>
                  <h3>No Internships Found</h3>
                  <p>We couldn't find any internships matching your criteria. Try adjusting your filters.</p>
                  <button class="reset-btn" (click)="clearFilters()">
                    <span>🔄</span> Reset Filters
                  </button>
                </div>
              }
            </div>
          }
        </div>
      </section>

      <!-- Premium CTA Section -->
      <section class="cta-section">
        <div class="cta-background">
          <div class="cta-pattern"></div>
        </div>
        <div class="container">
          <div class="cta-content">
            <div class="cta-badge">🏢 For Companies</div>
            <h2>Partner With Us</h2>
            <p>Connect with talented students and graduates. Post your internship opportunities and find the perfect candidates.</p>
            <div class="cta-buttons">
              <button class="cta-btn primary">
                <span>🚀</span> Post Internship
              </button>
              <button class="cta-btn secondary">
                <span>💬</span> Contact Us
              </button>
            </div>
            <div class="cta-features">
              <div class="feature-item">
                <span>✓</span> Free posting
              </div>
              <div class="feature-item">
                <span>✓</span> Verified candidates
              </div>
              <div class="feature-item">
                <span>✓</span> Quick matching
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  `,
  styles: [`
    /* ===== Global Styles ===== */
    .internships-page {
      min-height: 100vh;
      background: #f8fafc;
    }

    .container {
      max-width: 1280px;
      margin: 0 auto;
      padding: 0 1.5rem;
    }

    /* ===== Hero Section ===== */
    .hero {
      position: relative;
      padding: 5rem 2rem 4rem;
      overflow: hidden;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
    }

    .hero-bg {
      position: absolute;
      inset: 0;
      z-index: 0;
    }

    .hero-pattern {
      position: absolute;
      inset: 0;
      background-image: radial-gradient(circle at 1px 1px, rgba(255,255,255,0.1) 1px, transparent 0);
      background-size: 40px 40px;
      opacity: 0.5;
    }

    .hero-gradient {
      position: absolute;
      inset: 0;
      background: radial-gradient(ellipse at 50% 0%, rgba(56, 189, 248, 0.15) 0%, transparent 60%);
    }

    .floating-shapes {
      position: absolute;
      inset: 0;
      overflow: hidden;
    }

    .shape {
      position: absolute;
      border-radius: 50%;
      filter: blur(80px);
      opacity: 0.4;
    }

    .shape-1 {
      width: 400px;
      height: 400px;
      background: linear-gradient(135deg, #3b82f6, #8b5cf6);
      top: -100px;
      right: -100px;
      animation: float 20s ease-in-out infinite;
    }

    .shape-2 {
      width: 300px;
      height: 300px;
      background: linear-gradient(135deg, #06b6d4, #3b82f6);
      bottom: -50px;
      left: -50px;
      animation: float 15s ease-in-out infinite reverse;
    }

    .shape-3 {
      width: 200px;
      height: 200px;
      background: linear-gradient(135deg, #8b5cf6, #ec4899);
      top: 50%;
      left: 50%;
      animation: float 25s ease-in-out infinite;
    }

    @keyframes float {
      0%, 100% { transform: translate(0, 0) rotate(0deg); }
      25% { transform: translate(10px, -20px) rotate(5deg); }
      50% { transform: translate(-10px, 10px) rotate(-5deg); }
      75% { transform: translate(20px, 10px) rotate(3deg); }
    }

    .hero-content {
      position: relative;
      z-index: 1;
      max-width: 800px;
      margin: 0 auto;
      text-align: center;
    }

    .hero-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: rgba(255,255,255,0.1);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255,255,255,0.2);
      padding: 0.5rem 1rem;
      border-radius: 50px;
      font-size: 0.875rem;
      color: #fff;
      margin-bottom: 1.5rem;
    }

    .hero h1 {
      font-size: 3rem;
      font-weight: 800;
      color: #fff;
      margin-bottom: 1rem;
      line-height: 1.2;
    }

    .hero h1 .accent {
      background: linear-gradient(135deg, #38bdf8 0%, #818cf8 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .hero-subtitle {
      font-size: 1.125rem;
      color: rgba(255,255,255,0.7);
      margin-bottom: 2rem;
      line-height: 1.6;
    }

    .search-container {
      max-width: 640px;
      margin: 0 auto 2.5rem;
    }

    .search-box {
      display: flex;
      align-items: center;
      background: #fff;
      border-radius: 16px;
      padding: 0.5rem;
      box-shadow: 0 20px 40px rgba(0,0,0,0.3);
    }

    .search-icon {
      padding: 0 1rem;
      font-size: 1.25rem;
    }

    .search-box input {
      flex: 1;
      border: none;
      padding: 1rem 0.5rem;
      font-size: 1rem;
      color: #1e293b;
    }

    .search-box input:focus {
      outline: none;
    }

    .search-box input::placeholder {
      color: #94a3b8;
    }

    .search-btn {
      padding: 1rem 2rem;
      background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
      color: #fff;
      border: none;
      border-radius: 12px;
      font-weight: 600;
      font-size: 1rem;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .search-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 20px rgba(59, 130, 246, 0.3);
    }

    .hero-stats {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 2rem;
    }

    .stat-item {
      text-align: center;
    }

    .stat-number {
      display: block;
      font-size: 2rem;
      font-weight: 800;
      color: #fff;
      margin-bottom: 0.25rem;
    }

    .stat-label {
      font-size: 0.875rem;
      color: rgba(255,255,255,0.6);
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .stat-divider {
      width: 1px;
      height: 40px;
      background: rgba(255,255,255,0.2);
    }

    /* ===== Filters Section ===== */
    .filters-section {
      background: #fff;
      border-bottom: 1px solid #e2e8f0;
      padding: 1.5rem 0;
      position: sticky;
      top: 0;
      z-index: 100;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);
    }

    .filters-wrapper {
      background: #f8fafc;
      border-radius: 16px;
      padding: 1rem 1.5rem;
    }

    .filters-row {
      display: flex;
      gap: 1.5rem;
      align-items: flex-end;
      flex-wrap: wrap;
    }

    .filter-group {
      flex: 1;
      min-width: 180px;
    }

    .filter-group label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      font-weight: 600;
      color: #475569;
      margin-bottom: 0.5rem;
    }

    .filter-icon {
      font-size: 1rem;
    }

    .filter-group select {
      width: 100%;
      padding: 0.75rem 1rem;
      border: 2px solid #e2e8f0;
      border-radius: 10px;
      font-size: 0.9rem;
      color: #1e293b;
      background: #fff;
      cursor: pointer;
      transition: all 0.2s;
    }

    .filter-group select:hover {
      border-color: #cbd5e1;
    }

    .filter-group select:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .clear-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.25rem;
      border: none;
      background: #fee2e2;
      color: #dc2626;
      border-radius: 10px;
      font-weight: 600;
      font-size: 0.9rem;
      cursor: pointer;
      transition: all 0.2s;
    }

    .clear-btn:hover {
      background: #fecaca;
    }

    /* ===== Internships Section ===== */
    .internships-section {
      padding: 3rem 0 4rem;
    }

    .results-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .results-info {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .results-count {
      font-size: 1.125rem;
      font-weight: 700;
      color: #1e293b;
    }

    .results-hint {
      color: #64748b;
      font-size: 0.9rem;
    }

    .sort-control {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .sort-label {
      color: #64748b;
      font-size: 0.9rem;
    }

    .sort-control select {
      padding: 0.625rem 1rem;
      border: 2px solid #e2e8f0;
      border-radius: 8px;
      font-size: 0.9rem;
      color: #1e293b;
      background: #fff;
      cursor: pointer;
    }

    /* Loading Skeletons */
    .loading-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.5rem;
    }

    .skeleton-card {
      background: #fff;
      border-radius: 16px;
      padding: 1.5rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    .skeleton-header {
      display: flex;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .skeleton-avatar {
      width: 56px;
      height: 56px;
      border-radius: 12px;
      background: linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
    }

    .skeleton-text {
      flex: 1;
    }

    .skeleton-line {
      height: 12px;
      border-radius: 6px;
      background: linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      margin-bottom: 0.75rem;
    }

    .skeleton-line.long { width: 80%; }
    .skeleton-line.short { width: 50%; }
    .skeleton-line.full { width: 100%; }
    .skeleton-line.medium { width: 70%; }

    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    /* Internships Grid */
    .internships-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.5rem;
    }

    .internship-card {
      position: relative;
      background: #fff;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03);
      border: 1px solid #e2e8f0;
      transition: all 0.3s ease;
    }

    .internship-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04);
      border-color: #cbd5e1;
    }

    .internship-card.urgent {
      border-color: #fecaca;
    }

    .urgent-ribbon {
      position: absolute;
      top: 1rem;
      right: -2rem;
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      color: #fff;
      padding: 0.25rem 2.5rem;
      font-size: 0.75rem;
      font-weight: 700;
      transform: rotate(45deg);
      z-index: 1;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    }

    .fee-ribbon {
      position: absolute;
      top: 0.75rem;
      left: 0.75rem;
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      color: #fff;
      padding: 0.25rem 0.75rem;
      font-size: 0.7rem;
      font-weight: 600;
      border-radius: 0.5rem;
      z-index: 1;
      box-shadow: 0 2px 4px rgba(0,0,0,0.15);
    }

    .paid-badge {
      position: absolute;
      top: 0.75rem;
      left: 0.75rem;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: #fff;
      padding: 0.25rem 0.75rem;
      font-size: 0.7rem;
      font-weight: 600;
      border-radius: 0.5rem;
      z-index: 1;
      box-shadow: 0 2px 4px rgba(0,0,0,0.15);
    }

    .internship-card:has(.fee-ribbon) .paid-badge {
      top: 2.25rem;
    }

    .card-header {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      padding: 1.5rem 1.5rem 1rem;
    }

    .company-logo {
      width: 60px;
      height: 60px;
      border-radius: 14px;
      background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      flex-shrink: 0;
      box-shadow: 0 4px 6px rgba(59, 130, 246, 0.2);
    }

    .company-logo img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .logo-placeholder {
      color: #fff;
      font-size: 1.5rem;
      font-weight: 700;
    }

    .company-info {
      flex: 1;
      min-width: 0;
    }

    .job-title {
      font-size: 1.125rem;
      font-weight: 700;
      color: #1e293b;
      margin-bottom: 0.25rem;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .company-name {
      color: #64748b;
      font-size: 0.9rem;
    }

    .type-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.375rem 0.75rem;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 600;
      white-space: nowrap;
    }

    .type-icon {
      font-size: 0.875rem;
    }

    .type-badge.remote {
      background: #dcfce7;
      color: #16a34a;
    }

    .type-badge.onsite {
      background: #dbeafe;
      color: #2563eb;
    }

    .type-badge.hybrid {
      background: #fef3c7;
      color: #d97706;
    }

    .card-body {
      padding: 0 1.5rem 1rem;
    }

    .description {
      color: #64748b;
      font-size: 0.9rem;
      line-height: 1.6;
      margin-bottom: 1rem;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .meta-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.75rem;
      margin-bottom: 1rem;
    }

    .meta-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.85rem;
      color: #475569;
    }

    .meta-icon {
      font-size: 1rem;
    }

    .skills-row {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .skill-tag {
      padding: 0.375rem 0.75rem;
      background: #f1f5f9;
      color: #475569;
      border-radius: 8px;
      font-size: 0.8rem;
      font-weight: 500;
    }

    .skill-more {
      padding: 0.375rem 0.75rem;
      background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
      color: #fff;
      border-radius: 8px;
      font-size: 0.8rem;
      font-weight: 600;
    }

    .card-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.5rem;
      background: #f8fafc;
      border-top: 1px solid #f1f5f9;
    }

    .deadline-info {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.85rem;
      color: #64748b;
    }

    .deadline-info.urgent {
      color: #dc2626;
      font-weight: 600;
    }

    .view-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.25rem;
      background: #1e293b;
      color: #fff;
      border: none;
      border-radius: 10px;
      font-weight: 600;
      font-size: 0.9rem;
      text-decoration: none;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .view-btn:hover {
      background: #3b82f6;
      transform: translateX(2px);
    }

    .btn-arrow {
      transition: transform 0.2s;
    }

    .view-btn:hover .btn-arrow {
      transform: translateX(4px);
    }

    /* Empty State */
    .empty-state {
      grid-column: 1 / -1;
      text-align: center;
      padding: 4rem 2rem;
      background: #fff;
      border-radius: 20px;
      border: 2px dashed #e2e8f0;
    }

    .empty-illustration {
      margin-bottom: 1.5rem;
    }

    .empty-icon {
      font-size: 5rem;
      filter: grayscale(50%);
    }

    .empty-state h3 {
      font-size: 1.5rem;
      font-weight: 700;
      color: #1e293b;
      margin-bottom: 0.5rem;
    }

    .empty-state p {
      color: #64748b;
      margin-bottom: 1.5rem;
      max-width: 400px;
      margin-left: auto;
      margin-right: auto;
    }

    .reset-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.875rem 1.75rem;
      background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
      color: #fff;
      border: none;
      border-radius: 12px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .reset-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 20px rgba(59, 130, 246, 0.3);
    }

    /* ===== CTA Section ===== */
    .cta-section {
      position: relative;
      padding: 5rem 0;
      overflow: hidden;
    }

    .cta-background {
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
    }

    .cta-pattern {
      position: absolute;
      inset: 0;
      background-image: radial-gradient(circle at 1px 1px, rgba(255,255,255,0.1) 1px, transparent 0);
      background-size: 40px 40px;
      opacity: 0.3;
    }

    .cta-content {
      position: relative;
      z-index: 1;
      text-align: center;
      max-width: 640px;
      margin: 0 auto;
    }

    .cta-badge {
      display: inline-block;
      background: rgba(255,255,255,0.1);
      color: #fff;
      padding: 0.5rem 1rem;
      border-radius: 20px;
      font-size: 0.875rem;
      font-weight: 600;
      margin-bottom: 1.5rem;
    }

    .cta-content h2 {
      font-size: 2.5rem;
      font-weight: 800;
      color: #fff;
      margin-bottom: 1rem;
    }

    .cta-content p {
      color: rgba(255,255,255,0.7);
      font-size: 1.1rem;
      line-height: 1.6;
      margin-bottom: 2rem;
    }

    .cta-buttons {
      display: flex;
      justify-content: center;
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .cta-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 1rem 2rem;
      border: none;
      border-radius: 12px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .cta-btn.primary {
      background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
      color: #fff;
    }

    .cta-btn.primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 20px rgba(59, 130, 246, 0.4);
    }

    .cta-btn.secondary {
      background: rgba(255,255,255,0.1);
      color: #fff;
      border: 1px solid rgba(255,255,255,0.2);
    }

    .cta-btn.secondary:hover {
      background: rgba(255,255,255,0.2);
    }

    .cta-features {
      display: flex;
      justify-content: center;
      gap: 2rem;
    }

    .feature-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: rgba(255,255,255,0.8);
      font-size: 0.9rem;
    }

    .feature-item span {
      color: #10b981;
      font-weight: 700;
    }

    /* ===== Responsive ===== */
    @media (max-width: 1024px) {
      .internships-grid,
      .loading-grid {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 768px) {
      .hero {
        padding: 3rem 1rem;
      }

      .hero h1 {
        font-size: 2rem;
      }

      .hero-stats {
        flex-wrap: wrap;
        gap: 1rem;
      }

      .stat-divider {
        display: none;
      }

      .filters-row {
        flex-direction: column;
      }

      .filter-group {
        width: 100%;
      }

      .cta-buttons {
        flex-direction: column;
      }

      .cta-features {
        flex-direction: column;
        gap: 0.75rem;
      }

      .results-header {
        flex-direction: column;
        align-items: flex-start;
      }

      .meta-grid {
        grid-template-columns: 1fr;
      }
    }

    /* RTL Support */
    :host-context([dir="rtl"]) {
      .search-box {
        flex-direction: row-reverse;
      }
      
      .btn-arrow {
        transform: scaleX(-1);
      }

      .view-btn:hover .btn-arrow {
        transform: scaleX(-1) translateX(4px);
      }
    }
  `]
})
export class InternshipsListComponent implements OnInit {
  private internshipService = inject(InternshipService);
  private toastr = inject(ToastrService);
  mediaService = inject(MediaService);

  internships = signal<Internship[]>([]);
  filteredInternships = signal<Internship[]>([]);
  loading = signal(true);

  searchQuery = '';
  typeFilter = 'all';
  locationFilter = 'all';
  durationFilter = 'all';
  sortBy = 'newest';

  ngOnInit() {
    this.loadInternships();
  }

  loadInternships() {
    this.loading.set(true);
    
    this.internshipService.getInternships({ pageSize: 50 }).subscribe({
      next: (result) => {
        const mappedInternships: Internship[] = (result.items || []).map((i: any) => ({
          id: i.id,
          slug: i.slug || i.id,
          title: i.nameEn || i.titleEn || i.titleAr || i.title || 'Untitled',
          company: i.companyName || i.company || 'Unknown Company',
          companyLogo: i.companyLogoUrl || i.companyLogo || '',
          location: i.location || 'Remote',
          type: i.isRemote ? 'Remote' : (i.type || i.workType || 'OnSite'),
          duration: i.duration || (i.durationInWeeks ? `${i.durationInWeeks} weeks` : '3 months'),
          description: i.descriptionEn || i.descriptionAr || i.description || '',
          requirements: (i.requirementsEn || '').split('\n').filter((r: string) => r.trim()) || [],
          postedAt: new Date(i.postedAt || i.createdAt),
          deadline: new Date(i.deadline || i.applicationDeadline),
          applicants: i.applicants || i.applicationCount || 0,
          isPaid: i.isPaid,
          stipend: i.stipend,
          hasFee: i.hasFee,
          feeAmount: i.feeAmount,
          currency: i.currency || 'EGP'
        }));

        this.internships.set(mappedInternships);
        this.filterInternships();
        this.loading.set(false);
      },
      error: () => {
        this.toastr.error('Failed to load internships');
        this.loading.set(false);
      }
    });
  }

  filterInternships() {
    let result = this.internships();

    if (this.typeFilter !== 'all') {
      result = result.filter(i => i.type === this.typeFilter);
    }

    if (this.locationFilter !== 'all') {
      result = result.filter(i => i.location.includes(this.locationFilter));
    }

    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      result = result.filter(i =>
        i.title.toLowerCase().includes(query) ||
        i.company.toLowerCase().includes(query) ||
        i.description.toLowerCase().includes(query) ||
        i.requirements.some(r => r.toLowerCase().includes(query))
      );
    }

    this.filteredInternships.set(result);
    this.sortInternships();
  }

  sortInternships() {
    const sorted = [...this.filteredInternships()];

    switch (this.sortBy) {
      case 'newest':
        sorted.sort((a, b) => b.postedAt.getTime() - a.postedAt.getTime());
        break;
      case 'deadline':
        sorted.sort((a, b) => a.deadline.getTime() - b.deadline.getTime());
        break;
      case 'applicants':
        sorted.sort((a, b) => b.applicants - a.applicants);
        break;
    }

    this.filteredInternships.set(sorted);
  }

  clearFilters() {
    this.searchQuery = '';
    this.typeFilter = 'all';
    this.locationFilter = 'all';
    this.durationFilter = 'all';
    this.filterInternships();
  }

  isUrgent(deadline: Date): boolean {
    const daysUntil = Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return daysUntil <= 7;
  }

  getTypeIcon(type: string): string {
    const icons: { [key: string]: string } = {
      'Remote': '🏠',
      'OnSite': '🏢',
      'Hybrid': '🔄'
    };
    return icons[type] || '💼';
  }
}
