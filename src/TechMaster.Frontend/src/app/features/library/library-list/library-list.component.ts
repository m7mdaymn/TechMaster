import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LibraryService, LibraryItem, LibraryCategory } from '@core/services/library.service';
import { MediaService } from '@core/services/media.service';

@Component({
  selector: 'app-library-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="library-page">
      <!-- Hero Section -->
      <section class="hero">
        <div class="hero-bg">
          <div class="grid-pattern"></div>
          <div class="orb orb-1"></div>
          <div class="orb orb-2"></div>
        </div>
        <div class="hero-content">
          <div class="badge">
            <span>📚</span>
            <span>Learning Resources</span>
          </div>
          <h1>Resource <span class="accent">Library</span></h1>
          <p>Explore our extensive collection of learning materials, articles, tutorials, and tools to boost your skills.</p>
          
          <!-- Search Box -->
          <div class="search-box">
            <div class="search-icon">🔍</div>
            <input 
              type="text" 
              [(ngModel)]="searchQuery" 
              (ngModelChange)="filterResources()"
              placeholder="Search resources..."
            >
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
              All
            </button>
            @for (cat of categories(); track cat.id) {
              <button 
                class="pill" 
                [class.active]="selectedCategory() === cat.name"
                (click)="selectCategory(cat.name)">
                {{ cat.name }}
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
                <h3>Type</h3>
                <div class="filter-options">
                  @for (type of resourceTypes; track type) {
                    <label class="filter-option">
                      <input 
                        type="checkbox" 
                        [checked]="selectedTypes().includes(type)"
                        (change)="toggleType(type)">
                      <span class="checkmark"></span>
                      <span>{{ type }}</span>
                    </label>
                  }
                </div>
              </div>

              <div class="filter-card">
                <h3>Sort By</h3>
                <select [(ngModel)]="sortBy" (ngModelChange)="filterResources()">
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="title">Title A-Z</option>
                  <option value="downloads">Most Downloads</option>
                </select>
              </div>

              <button class="reset-btn" (click)="resetFilters()">
                Reset Filters
              </button>
            </aside>

            <!-- Resources Grid -->
            <div class="resources-content">
              <div class="results-header">
                <p class="results-count">
                  Showing <strong>{{ filteredResources().length }}</strong> resources
                </p>
                <div class="view-toggle">
                  <button [class.active]="viewMode === 'grid'" (click)="viewMode = 'grid'">⊞</button>
                  <button [class.active]="viewMode === 'list'" (click)="viewMode = 'list'">☰</button>
                </div>
              </div>

              @if (isLoading()) {
                <div class="loading-grid">
                  @for (i of [1,2,3,4,5,6]; track i) {
                    <div class="skeleton-card"></div>
                  }
                </div>
              } @else if (filteredResources().length === 0) {
                <div class="empty-state">
                  <div class="empty-icon">📭</div>
                  <h3>No Resources Found</h3>
                  <p>Try adjusting your search or filters</p>
                  <button class="reset-btn" (click)="resetFilters()">Reset Filters</button>
                </div>
              } @else {
                <div class="resources-grid" [class.list-view]="viewMode === 'list'">
                  @for (resource of displayedResources(); track resource.id) {
                    <div class="resource-card">
                      <div class="card-thumbnail" [style.background-image]="'url(' + mediaService.getLibraryThumbnail(resource.thumbnailUrl) + ')'">
                        <div class="card-type-badge" [attr.data-type]="resource.type">
                          {{ getTypeIcon(resource.type) }}
                        </div>
                      </div>
                      <div class="card-content">
                        <span class="category-tag">{{ resource.category }}</span>
                        <h3>{{ resource.title }}</h3>
                        <p>{{ resource.description }}</p>
                        <div class="card-meta">
                          <span class="type-badge">{{ resource.type }}</span>
                          <span class="date">{{ resource.createdAt | date:'mediumDate' }}</span>
                        </div>
                      </div>
                      <div class="card-actions">
                        <a [href]="resource.fileUrl || resource.externalUrl" target="_blank" class="download-btn">
                          {{ resource.externalUrl ? 'Visit' : 'Download' }} <span>↗</span>
                        </a>
                      </div>
                    </div>
                  }
                </div>

                @if (filteredResources().length > displayedCount()) {
                  <div class="load-more">
                    <button class="load-more-btn" (click)="loadMore()">
                      Load More <span>↓</span>
                    </button>
                    <p class="load-info">
                      Showing {{ displayedCount() }} of {{ filteredResources().length }}
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
            <div class="cta-content">
              <h2>Can't find what you need?</h2>
              <p>Contact us and we'll help you find the right resources for your learning journey.</p>
            </div>
            <a routerLink="/contact" class="cta-btn">
              Contact Us <span>→</span>
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
      --radius: 16px;
      --shadow: 0 4px 20px rgba(0,0,0,0.1);
    }

    .library-page {
      background: var(--gray-100);
      min-height: 100vh;
    }

    .container {
      max-width: 1280px;
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
      background-image: linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
      background-size: 50px 50px;
    }

    .orb {
      position: absolute;
      border-radius: 50%;
      filter: blur(80px);
    }

    .orb-1 {
      width: 400px;
      height: 400px;
      background: var(--primary);
      opacity: 0.3;
      top: -100px;
      right: -100px;
    }

    .orb-2 {
      width: 300px;
      height: 300px;
      background: #8b5cf6;
      opacity: 0.2;
      bottom: -50px;
      left: 20%;
    }

    .hero-content {
      position: relative;
      z-index: 1;
      text-align: center;
      max-width: 700px;
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
      margin-bottom: 2rem;
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
      max-width: 500px;
      margin: 0 auto;
      background: var(--white);
      border-radius: 100px;
      padding: 0.5rem;
      box-shadow: 0 20px 60px rgba(0,0,0,0.2);
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

    /* Category Pills */
    .category-section {
      padding: 2rem 0;
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

    .checkmark {
      width: 20px;
      height: 20px;
      border: 2px solid var(--gray-200);
      border-radius: 4px;
      position: relative;
      transition: all 0.3s;
    }

    .filter-option input:checked + .checkmark {
      background: var(--primary);
      border-color: var(--primary);
    }

    .filter-option input:checked + .checkmark::after {
      content: '✓';
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--white);
      font-size: 0.75rem;
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

    /* Resources Content */
    .resources-content {
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

    .resources-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.5rem;
    }

    .resources-grid.list-view {
      grid-template-columns: 1fr;
    }

    .resources-grid.list-view .resource-card {
      flex-direction: row;
      align-items: center;
    }

    .resources-grid.list-view .card-type {
      width: 80px;
      height: 80px;
      font-size: 2rem;
    }

    .resources-grid.list-view .card-actions {
      margin-top: 0;
    }

    .resource-card {
      background: var(--white);
      border-radius: var(--radius);
      padding: 1.5rem;
      box-shadow: var(--shadow);
      display: flex;
      flex-direction: column;
      transition: all 0.3s;
    }

    .resource-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 40px rgba(0,0,0,0.15);
    }

    .card-type {
      width: 60px;
      height: 60px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.75rem;
      margin-bottom: 1rem;
      background: rgba(36,112,144,0.1);
    }

    .card-type[data-type="PDF"] { background: rgba(239,68,68,0.1); }
    .card-type[data-type="Video"] { background: rgba(168,85,247,0.1); }
    .card-type[data-type="Link"] { background: rgba(34,197,94,0.1); }
    .card-type[data-type="Code"] { background: rgba(59,130,246,0.1); }

    .card-thumbnail {
      width: 100%;
      height: 160px;
      border-radius: 12px;
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
      background-color: rgba(36,112,144,0.1);
      margin-bottom: 1rem;
    }

    .card-content {
      flex: 1;
    }

    .category-tag {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      background: rgba(36,112,144,0.1);
      color: var(--primary);
      border-radius: 100px;
      font-size: 0.75rem;
      font-weight: 600;
      margin-bottom: 0.75rem;
    }

    .card-content h3 {
      font-size: 1.125rem;
      font-weight: 700;
      color: var(--dark);
      margin-bottom: 0.5rem;
      line-height: 1.4;
    }

    .card-content p {
      font-size: 0.9rem;
      color: var(--gray-600);
      line-height: 1.6;
      margin-bottom: 1rem;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .card-meta {
      display: flex;
      align-items: center;
      gap: 1rem;
      font-size: 0.8rem;
      color: var(--gray-400);
    }

    .type-badge {
      padding: 0.25rem 0.5rem;
      background: var(--gray-100);
      border-radius: 4px;
      font-weight: 500;
    }

    .card-actions {
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid var(--gray-200);
    }

    .download-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      background: linear-gradient(135deg, var(--primary), var(--primary-dark));
      color: var(--white);
      border-radius: 8px;
      font-weight: 600;
      text-decoration: none;
      transition: all 0.3s;
    }

    .download-btn:hover {
      transform: scale(1.02);
      box-shadow: 0 4px 15px rgba(36,112,144,0.4);
    }

    /* Loading & Empty */
    .loading-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.5rem;
    }

    .skeleton-card {
      height: 280px;
      background: linear-gradient(90deg, var(--gray-200) 25%, var(--white) 50%, var(--gray-200) 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: var(--radius);
    }

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
      margin-top: 2rem;
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
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 3rem 4rem;
      background: linear-gradient(135deg, var(--dark), var(--dark-light));
      border-radius: 24px;
      gap: 2rem;
    }

    .cta-content h2 {
      font-size: 2rem;
      font-weight: 800;
      color: var(--white);
      margin-bottom: 0.5rem;
    }

    .cta-content p {
      color: rgba(255,255,255,0.8);
      font-size: 1.125rem;
    }

    .cta-btn {
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
    }

    /* Responsive */
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
    }

    @media (max-width: 768px) {
      .hero { padding: 6rem 1.5rem 4rem; }
      .hero h1 { font-size: 2rem; }
      .sidebar {
        grid-template-columns: 1fr;
      }
      .reset-btn {
        grid-column: span 1;
      }
      .resources-grid { grid-template-columns: 1fr; }
      .cta-box { flex-direction: column; text-align: center; padding: 2rem; }
    }
  `]
})
export class LibraryListComponent implements OnInit {
  private libraryService = inject(LibraryService);
  mediaService = inject(MediaService);

  isLoading = signal(true);
  resources = signal<LibraryItem[]>([]);
  categories = signal<LibraryCategory[]>([]);
  selectedCategory = signal('all');
  selectedTypes = signal<string[]>([]);
  searchQuery = '';
  sortBy = 'newest';
  viewMode: 'grid' | 'list' = 'grid';
  displayedCount = signal(12);

  resourceTypes = ['PDF', 'Video', 'Link', 'Code', 'Article'];

  filteredResources = computed(() => {
    let result = [...this.resources()];

    // Filter by category
    if (this.selectedCategory() !== 'all') {
      result = result.filter(r => r.category === this.selectedCategory());
    }

    // Filter by type
    if (this.selectedTypes().length > 0) {
      result = result.filter(r => this.selectedTypes().includes(r.type));
    }

    // Search
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      result = result.filter(r => 
        r.title.toLowerCase().includes(query) || 
        r.description.toLowerCase().includes(query)
      );
    }

    // Sort
    switch(this.sortBy) {
      case 'newest':
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'oldest':
        result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case 'title':
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'downloads':
        result.sort((a, b) => (b.downloads || 0) - (a.downloads || 0));
        break;
    }

    return result;
  });

  displayedResources = computed(() => {
    return this.filteredResources().slice(0, this.displayedCount());
  });

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.isLoading.set(true);
    
    this.libraryService.getCategories().subscribe({
      next: (data) => this.categories.set(data),
      error: () => console.error('Failed to load categories')
    });

    this.libraryService.getItems().subscribe({
      next: (data) => {
        this.resources.set(data);
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

  toggleType(type: string) {
    const current = this.selectedTypes();
    if (current.includes(type)) {
      this.selectedTypes.set(current.filter(t => t !== type));
    } else {
      this.selectedTypes.set([...current, type]);
    }
    this.displayedCount.set(12);
  }

  filterResources() {
    this.displayedCount.set(12);
  }

  resetFilters() {
    this.searchQuery = '';
    this.selectedCategory.set('all');
    this.selectedTypes.set([]);
    this.sortBy = 'newest';
    this.displayedCount.set(12);
  }

  loadMore() {
    this.displayedCount.update(c => c + 12);
  }

  getTypeIcon(type: string): string {
    const icons: Record<string, string> = {
      'PDF': '📄',
      'Video': '🎬',
      'Link': '🔗',
      'Code': '💻',
      'Article': '📰'
    };
    return icons[type] || '📁';
  }
}
