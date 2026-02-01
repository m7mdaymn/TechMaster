import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { environment } from '@environments/environment';

interface Testimonial {
  id: number;
  userId: number;
  userName: string;
  userImage: string;
  contentEn: string;
  contentAr: string;
  rating: number;
  courseId?: number;
  courseName?: string;
  isApproved: boolean;
  isFeatured: boolean;
  createdAt: string;
}

@Component({
  selector: 'app-admin-testimonials',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="testimonials-page">
      <div class="page-header">
        <div class="header-left">
          <h1>Testimonials Management</h1>
          <p class="subtitle">Manage and approve student testimonials</p>
        </div>
        <button class="add-btn" (click)="openAddModal()">
          <span>+</span>
          Add Testimonial
        </button>
      </div>

      <!-- Stats -->
      <div class="stats-row">
        <div class="stat-card">
          <span class="stat-icon">💬</span>
          <div class="stat-info">
            <span class="stat-value">{{ totalCount }}</span>
            <span class="stat-label">Total Testimonials</span>
          </div>
        </div>
        <div class="stat-card">
          <span class="stat-icon">✅</span>
          <div class="stat-info">
            <span class="stat-value">{{ approvedCount }}</span>
            <span class="stat-label">Approved</span>
          </div>
        </div>
        <div class="stat-card">
          <span class="stat-icon">⏳</span>
          <div class="stat-info">
            <span class="stat-value">{{ pendingCount }}</span>
            <span class="stat-label">Pending</span>
          </div>
        </div>
        <div class="stat-card">
          <span class="stat-icon">⭐</span>
          <div class="stat-info">
            <span class="stat-value">{{ featuredCount }}</span>
            <span class="stat-label">Featured</span>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="filters-bar">
        <div class="search-box">
          <span class="search-icon">🔍</span>
          <input 
            type="text" 
            [(ngModel)]="searchQuery" 
            (ngModelChange)="filterItems()"
            placeholder="Search testimonials..."
          >
        </div>

        <div class="filter-tabs">
          <button [class.active]="activeFilter === 'all'" (click)="setFilter('all')">All</button>
          <button [class.active]="activeFilter === 'pending'" (click)="setFilter('pending')">Pending</button>
          <button [class.active]="activeFilter === 'approved'" (click)="setFilter('approved')">Approved</button>
          <button [class.active]="activeFilter === 'featured'" (click)="setFilter('featured')">Featured</button>
        </div>
      </div>

      <!-- Testimonials Grid -->
      @if (isLoading()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Loading testimonials...</p>
        </div>
      } @else {
        <div class="testimonials-grid">
          @for (item of filteredItems(); track item.id) {
            <div class="testimonial-card" [class.pending]="!item.isApproved">
              <div class="card-header">
                <div class="user-info">
                  <div class="user-avatar">
                    @if (item.userImage) {
                      <img [src]="item.userImage" [alt]="item.userName">
                    } @else {
                      <span>{{ item.userName.charAt(0) }}</span>
                    }
                  </div>
                  <div class="user-details">
                    <span class="user-name">{{ item.userName }}</span>
                    @if (item.courseName) {
                      <span class="course-name">{{ item.courseName }}</span>
                    }
                  </div>
                </div>
                <div class="badges">
                  @if (!item.isApproved) {
                    <span class="badge pending">Pending</span>
                  }
                  @if (item.isFeatured) {
                    <span class="badge featured">Featured</span>
                  }
                </div>
              </div>

              <div class="rating">
                @for (star of [1,2,3,4,5]; track star) {
                  <span [class.filled]="star <= item.rating">★</span>
                }
              </div>

              <p class="content">{{ item.contentEn }}</p>
              
              <div class="card-footer">
                <span class="date">{{ item.createdAt | date:'mediumDate' }}</span>
                <div class="actions">
                  @if (!item.isApproved) {
                    <button class="action-btn approve" (click)="approveTestimonial(item)" title="Approve">
                      ✓
                    </button>
                  }
                  <button 
                    class="action-btn feature" 
                    [class.active]="item.isFeatured"
                    (click)="toggleFeatured(item)"
                    title="Toggle Featured"
                  >
                    ⭐
                  </button>
                  <button class="action-btn delete" (click)="deleteTestimonial(item)" title="Delete">
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          } @empty {
            <div class="empty-state">
              <span>💬</span>
              <p>No testimonials found</p>
            </div>
          }
        </div>
      }

      <!-- Pagination -->
      <div class="pagination">
        <span class="page-info">
          Showing {{ filteredItems().length }} of {{ totalCount }} testimonials
        </span>
        <div class="page-controls">
          <button [disabled]="currentPage === 1" (click)="previousPage()">←</button>
          @for (page of getPages(); track page) {
            <button [class.active]="page === currentPage" (click)="goToPage(page)">{{ page }}</button>
          }
          <button [disabled]="currentPage === totalPages" (click)="nextPage()">→</button>
        </div>
      </div>
    </div>

    <!-- Add/Edit Testimonial Modal -->
    @if (showAddModal) {
      <div class="modal-overlay" (click)="closeAddModal()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>Add Testimonial</h2>
            <button class="close-btn" (click)="closeAddModal()">×</button>
          </div>
          <div class="modal-body">
            <div class="form-row">
              <div class="form-group">
                <label>Author Name *</label>
                <input type="text" [(ngModel)]="newTestimonial.authorName">
              </div>
              <div class="form-group">
                <label>Author Name (Arabic)</label>
                <input type="text" [(ngModel)]="newTestimonial.authorNameAr" dir="rtl">
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Author Title</label>
                <input type="text" [(ngModel)]="newTestimonial.authorTitle" placeholder="e.g., Software Developer">
              </div>
              <div class="form-group">
                <label>Author Image URL</label>
                <input type="url" [(ngModel)]="newTestimonial.authorImageUrl">
              </div>
            </div>
            <div class="form-group">
              <label>Testimonial (English) *</label>
              <textarea [(ngModel)]="newTestimonial.contentEn" rows="3"></textarea>
            </div>
            <div class="form-group">
              <label>Testimonial (Arabic)</label>
              <textarea [(ngModel)]="newTestimonial.contentAr" rows="3" dir="rtl"></textarea>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Rating *</label>
                <select [(ngModel)]="newTestimonial.rating">
                  <option [ngValue]="5">⭐⭐⭐⭐⭐ (5)</option>
                  <option [ngValue]="4">⭐⭐⭐⭐ (4)</option>
                  <option [ngValue]="3">⭐⭐⭐ (3)</option>
                  <option [ngValue]="2">⭐⭐ (2)</option>
                  <option [ngValue]="1">⭐ (1)</option>
                </select>
              </div>
              <div class="form-group">
                <label>Sort Order</label>
                <input type="number" [(ngModel)]="newTestimonial.sortOrder" min="0">
              </div>
            </div>
            <div class="form-row">
              <div class="form-group toggle-group">
                <label>Active</label>
                <label class="toggle">
                  <input type="checkbox" [(ngModel)]="newTestimonial.isActive">
                  <span class="slider"></span>
                </label>
              </div>
              <div class="form-group toggle-group">
                <label>Featured</label>
                <label class="toggle">
                  <input type="checkbox" [(ngModel)]="newTestimonial.isFeatured">
                  <span class="slider"></span>
                </label>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="cancel-btn" (click)="closeAddModal()">Cancel</button>
            <button class="submit-btn" (click)="saveTestimonial()">Save</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .testimonials-page {
      padding: 2rem;
      max-width: 1400px;
      margin: 0 auto;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 2rem;
    }

    .page-header h1 {
      font-size: 1.75rem;
      font-weight: 700;
      margin-bottom: 0.25rem;
    }

    .subtitle {
      color: #666;
    }

    .stats-row {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .stat-card {
      background: #fff;
      border-radius: 12px;
      padding: 1.25rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
    }

    .stat-icon {
      font-size: 2rem;
    }

    .stat-info {
      display: flex;
      flex-direction: column;
    }

    .stat-value {
      font-size: 1.5rem;
      font-weight: 700;
    }

    .stat-label {
      font-size: 0.85rem;
      color: #666;
    }

    .filters-bar {
      display: flex;
      gap: 1rem;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
    }

    .search-box {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      background: #fff;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      flex: 1;
      max-width: 350px;
    }

    .search-box input {
      border: none;
      outline: none;
      width: 100%;
      font-size: 0.95rem;
    }

    .filter-tabs {
      display: flex;
      gap: 0.5rem;
      background: #f8f9fa;
      padding: 0.25rem;
      border-radius: 8px;
    }

    .filter-tabs button {
      padding: 0.625rem 1rem;
      border: none;
      background: transparent;
      border-radius: 6px;
      font-weight: 500;
      cursor: pointer;
    }

    .filter-tabs button.active {
      background: #fff;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    }

    .testimonials-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 1.5rem;
    }

    .testimonial-card {
      background: #fff;
      border-radius: 16px;
      padding: 1.5rem;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      border-left: 4px solid #247090;
      transition: all 0.3s;
    }

    .testimonial-card.pending {
      border-left-color: #f0ad4e;
    }

    .testimonial-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1rem;
    }

    .user-info {
      display: flex;
      gap: 0.75rem;
    }

    .user-avatar {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: linear-gradient(135deg, #247090, #1a5570);
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }

    .user-avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .user-avatar span {
      color: #fff;
      font-weight: 600;
      font-size: 1.25rem;
    }

    .user-details {
      display: flex;
      flex-direction: column;
    }

    .user-name {
      font-weight: 600;
    }

    .course-name {
      font-size: 0.85rem;
      color: #666;
    }

    .badges {
      display: flex;
      gap: 0.5rem;
    }

    .badge {
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .badge.pending {
      background: #fff3cd;
      color: #856404;
    }

    .badge.featured {
      background: #e8f5e9;
      color: #2e7d32;
    }

    .rating {
      margin-bottom: 0.75rem;
    }

    .rating span {
      color: #e0e0e0;
      font-size: 1.25rem;
    }

    .rating span.filled {
      color: #ffc107;
    }

    .content {
      color: #444;
      line-height: 1.6;
      margin-bottom: 1rem;
      font-style: italic;
    }

    .card-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 1rem;
      border-top: 1px solid #f0f0f0;
    }

    .date {
      color: #999;
      font-size: 0.85rem;
    }

    .actions {
      display: flex;
      gap: 0.5rem;
    }

    .action-btn {
      width: 32px;
      height: 32px;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.9rem;
    }

    .action-btn.approve {
      background: #e8f5e9;
      color: #2e7d32;
    }

    .action-btn.feature {
      background: #f5f5f5;
    }

    .action-btn.feature.active {
      background: #fff3cd;
    }

    .action-btn.delete {
      background: #f5f5f5;
    }

    .action-btn:hover {
      transform: scale(1.1);
    }

    .action-btn.delete:hover {
      background: #ffebee;
    }

    .empty-state {
      grid-column: 1 / -1;
      text-align: center;
      padding: 4rem;
      background: #fff;
      border-radius: 16px;
    }

    .empty-state span {
      font-size: 4rem;
      display: block;
      margin-bottom: 1rem;
    }

    .empty-state p {
      color: #666;
    }

    .loading-state {
      text-align: center;
      padding: 4rem;
      background: #fff;
      border-radius: 16px;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid #f0f0f0;
      border-top-color: #247090;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 1rem;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .pagination {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 0;
      margin-top: 1rem;
    }

    .page-info {
      color: #666;
    }

    .page-controls {
      display: flex;
      gap: 0.5rem;
    }

    .page-controls button {
      min-width: 36px;
      height: 36px;
      border: 1px solid #e0e0e0;
      background: #fff;
      border-radius: 8px;
      cursor: pointer;
    }

    .page-controls button.active {
      background: #247090;
      color: #fff;
      border-color: #247090;
    }

    .page-controls button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    @media (max-width: 768px) {
      .stats-row {
        grid-template-columns: repeat(2, 1fr);
      }

      .testimonials-grid {
        grid-template-columns: 1fr;
      }
    }

    /* Modal Styles */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    }

    .modal {
      background: #fff;
      border-radius: 12px;
      width: 90%;
      max-width: 600px;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem;
      border-bottom: 1px solid #e0e0e0;
    }

    .modal-header h2 {
      font-size: 1.25rem;
      font-weight: 600;
      margin: 0;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      color: #666;
      padding: 0;
      line-height: 1;
    }

    .close-btn:hover {
      color: #333;
    }

    .modal-body {
      padding: 1.5rem;
    }

    .form-group {
      margin-bottom: 1rem;
    }

    .form-group label {
      display: block;
      font-weight: 500;
      margin-bottom: 0.5rem;
      color: #333;
    }

    .form-group input,
    .form-group select,
    .form-group textarea {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      font-size: 0.9rem;
      transition: border-color 0.2s;
    }

    .form-group input:focus,
    .form-group select:focus,
    .form-group textarea:focus {
      outline: none;
      border-color: #247090;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .toggle-group {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .toggle-group label:first-child {
      margin-bottom: 0;
    }

    .toggle {
      position: relative;
      display: inline-block;
      width: 50px;
      height: 26px;
    }

    .toggle input {
      opacity: 0;
      width: 0;
      height: 0;
    }

    .slider {
      position: absolute;
      cursor: pointer;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: #ccc;
      transition: 0.3s;
      border-radius: 26px;
    }

    .slider:before {
      position: absolute;
      content: "";
      height: 20px;
      width: 20px;
      left: 3px;
      bottom: 3px;
      background-color: white;
      transition: 0.3s;
      border-radius: 50%;
    }

    .toggle input:checked + .slider {
      background-color: #247090;
    }

    .toggle input:checked + .slider:before {
      transform: translateX(24px);
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      padding: 1rem 1.5rem;
      border-top: 1px solid #e0e0e0;
    }

    .cancel-btn {
      padding: 0.75rem 1.5rem;
      border: 1px solid #e0e0e0;
      background: #fff;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 500;
    }

    .cancel-btn:hover {
      background: #f5f5f5;
    }

    .submit-btn {
      padding: 0.75rem 1.5rem;
      background: #247090;
      color: #fff;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 500;
    }

    .submit-btn:hover {
      background: #1d5a73;
    }

    .add-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.25rem;
      background: #247090;
      color: #fff;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 500;
    }

    .add-btn:hover {
      background: #1d5a73;
    }

    .add-btn span {
      font-size: 1.2rem;
    }
  `]
})
export class AdminTestimonialsComponent implements OnInit {
  private http = inject(HttpClient);
  private toastr = inject(ToastrService);
  private apiUrl = environment.apiUrl;

  isLoading = signal(false);
  items = signal<Testimonial[]>([]);
  filteredItems = signal<Testimonial[]>([]);

  searchQuery = '';
  activeFilter = 'all';

  totalCount = 0;
  approvedCount = 0;
  pendingCount = 0;
  featuredCount = 0;

  currentPage = 1;
  pageSize = 12;
  totalPages = 1;

  showAddModal = false;
  newTestimonial: any = {
    authorName: '',
    authorNameAr: '',
    authorTitle: '',
    authorTitleAr: '',
    authorImageUrl: '',
    contentEn: '',
    contentAr: '',
    rating: 5,
    isActive: true,
    isFeatured: false,
    sortOrder: 0
  };

  ngOnInit() {
    this.loadTestimonials();
  }

  loadTestimonials() {
    this.isLoading.set(true);
    
    this.http.get<any>(`${this.apiUrl}/admin-settings/testimonials`).subscribe({
      next: (response) => {
        if (response.isSuccess && response.data) {
          const data = response.data;
          // Map backend data to frontend format
          const mappedData = data.map((t: any) => ({
            id: t.id,
            userId: 0,
            userName: t.authorName || 'Unknown',
            userImage: t.authorImageUrl || '',
            contentEn: t.contentEn || '',
            contentAr: t.contentAr || '',
            rating: t.rating || 5,
            courseName: t.authorTitle || '',
            isApproved: t.isActive !== false,
            isFeatured: t.isFeatured || false,
            createdAt: t.createdAt || new Date().toISOString()
          }));
          this.items.set(mappedData);
          this.filteredItems.set(mappedData);
          this.totalCount = mappedData.length;
          this.calculateStats(mappedData);
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.toastr.error('Failed to load testimonials');
        this.isLoading.set(false);
        this.loadSampleData();
      }
    });
  }

  loadSampleData() {
    const sampleData: Testimonial[] = [
      {
        id: 1,
        userId: 1,
        userName: 'Ahmed Hassan',
        userImage: '',
        contentEn: 'This platform has transformed my learning experience. The courses are well-structured and the instructors are very knowledgeable.',
        contentAr: '',
        rating: 5,
        courseName: 'Web Development Bootcamp',
        isApproved: true,
        isFeatured: true,
        createdAt: new Date().toISOString()
      },
      {
        id: 2,
        userId: 2,
        userName: 'Sara Mohamed',
        userImage: '',
        contentEn: 'I got my dream job thanks to the skills I learned here. Highly recommend!',
        contentAr: '',
        rating: 5,
        courseName: 'Data Science Fundamentals',
        isApproved: true,
        isFeatured: false,
        createdAt: new Date().toISOString()
      },
      {
        id: 3,
        userId: 3,
        userName: 'Omar Ali',
        userImage: '',
        contentEn: 'Great courses and excellent support. The certificate helped me advance in my career.',
        contentAr: '',
        rating: 4,
        courseName: 'Cloud Computing',
        isApproved: false,
        isFeatured: false,
        createdAt: new Date().toISOString()
      }
    ];
    this.items.set(sampleData);
    this.filteredItems.set(sampleData);
    this.totalCount = sampleData.length;
    this.calculateStats(sampleData);
    this.isLoading.set(false);
  }

  calculateStats(items: Testimonial[]) {
    this.approvedCount = items.filter(i => i.isApproved).length;
    this.pendingCount = items.filter(i => !i.isApproved).length;
    this.featuredCount = items.filter(i => i.isFeatured).length;
  }

  setFilter(filter: string) {
    this.activeFilter = filter;
    this.filterItems();
  }

  filterItems() {
    let filtered = this.items();

    if (this.activeFilter === 'pending') {
      filtered = filtered.filter(i => !i.isApproved);
    } else if (this.activeFilter === 'approved') {
      filtered = filtered.filter(i => i.isApproved);
    } else if (this.activeFilter === 'featured') {
      filtered = filtered.filter(i => i.isFeatured);
    }

    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(i => 
        i.userName.toLowerCase().includes(query) ||
        i.contentEn.toLowerCase().includes(query) ||
        i.courseName?.toLowerCase().includes(query)
      );
    }

    this.filteredItems.set(filtered);
  }

  approveTestimonial(item: Testimonial) {
    this.http.put<any>(`${this.apiUrl}/admin-settings/testimonials/${item.id}`, {
      authorName: item.userName,
      contentEn: item.contentEn,
      rating: item.rating,
      isActive: true,
      isFeatured: item.isFeatured
    }).subscribe({
      next: (response) => {
        if (response.isSuccess) {
          item.isApproved = true;
          this.calculateStats(this.items());
          this.toastr.success('Testimonial approved');
        }
      },
      error: () => {
        this.toastr.error('Failed to approve testimonial');
      }
    });
  }

  toggleFeatured(item: Testimonial) {
    const newFeaturedState = !item.isFeatured;
    this.http.put<any>(`${this.apiUrl}/admin-settings/testimonials/${item.id}`, {
      authorName: item.userName,
      contentEn: item.contentEn,
      rating: item.rating,
      isActive: item.isApproved,
      isFeatured: newFeaturedState
    }).subscribe({
      next: (response) => {
        if (response.isSuccess) {
          item.isFeatured = newFeaturedState;
          this.calculateStats(this.items());
          this.toastr.success(newFeaturedState ? 'Added to featured' : 'Removed from featured');
        }
      },
      error: () => {
        this.toastr.error('Failed to update testimonial');
      }
    });
  }

  deleteTestimonial(item: Testimonial) {
    if (confirm('Are you sure you want to delete this testimonial?')) {
      this.http.delete(`${this.apiUrl}/admin-settings/testimonials/${item.id}`).subscribe({
        next: () => {
          const updated = this.items().filter(i => i.id !== item.id);
          this.items.set(updated);
          this.filterItems();
          this.calculateStats(updated);
          this.toastr.success('Testimonial deleted');
        },
        error: () => {
          this.toastr.error('Failed to delete testimonial');
        }
      });
    }
  }

  openAddModal() {
    this.newTestimonial = {
      authorName: '',
      authorNameAr: '',
      authorTitle: '',
      authorTitleAr: '',
      authorImageUrl: '',
      contentEn: '',
      contentAr: '',
      rating: 5,
      isActive: true,
      isFeatured: false,
      sortOrder: 0
    };
    this.showAddModal = true;
  }

  closeAddModal() {
    this.showAddModal = false;
  }

  saveTestimonial() {
    if (!this.newTestimonial.authorName || !this.newTestimonial.contentEn) {
      this.toastr.error('Please fill in required fields');
      return;
    }

    this.http.post<any>(`${this.apiUrl}/admin-settings/testimonials`, this.newTestimonial).subscribe({
      next: (response) => {
        if (response.isSuccess) {
          this.toastr.success('Testimonial created');
          this.loadTestimonials();
          this.closeAddModal();
        }
      },
      error: () => {
        this.toastr.error('Failed to create testimonial');
      }
    });
  }

  getPages(): number[] {
    const pages = [];
    for (let i = 1; i <= Math.min(this.totalPages, 5); i++) {
      pages.push(i);
    }
    return pages;
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadTestimonials();
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadTestimonials();
    }
  }

  goToPage(page: number) {
    this.currentPage = page;
    this.loadTestimonials();
  }
}
