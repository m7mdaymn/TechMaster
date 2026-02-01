import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { environment } from '@environments/environment';
import { MediaService } from '@core/services/media.service';

interface LibraryItem {
  id: string;
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  type: number;  // 1=PDF, 2=Video, 3=Link, 4=Document
  fileUrl: string;
  thumbnailUrl: string;
  categoryId?: string;
  categoryName?: string;
  fileName?: string;
  fileSize?: number;
  isPublic: boolean;
  allowDownload: boolean;
  tags?: string;
  createdAt: string;
}

@Component({
  selector: 'app-admin-library',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="library-page">
      <div class="page-header">
        <div class="header-left">
          <h1>Library Management</h1>
          <p class="subtitle">Manage all library resources and materials</p>
        </div>
        <button class="add-btn" (click)="showAddModal = true">
          <span>+</span>
          Add Resource
        </button>
      </div>

      <!-- Stats -->
      <div class="stats-row">
        <div class="stat-card">
          <span class="stat-icon">📚</span>
          <div class="stat-info">
            <span class="stat-value">{{ totalItems }}</span>
            <span class="stat-label">Total Resources</span>
          </div>
        </div>
        <div class="stat-card">
          <span class="stat-icon">�</span>
          <div class="stat-info">
            <span class="stat-value">{{ pdfCount }}</span>
            <span class="stat-label">PDFs</span>
          </div>
        </div>
        <div class="stat-card">
          <span class="stat-icon">🎬</span>
          <div class="stat-info">
            <span class="stat-value">{{ videoCount }}</span>
            <span class="stat-label">Videos</span>
          </div>
        </div>
        <div class="stat-card">
          <span class="stat-icon">🔗</span>
          <div class="stat-info">
            <span class="stat-value">{{ linkCount }}</span>
            <span class="stat-label">Links</span>
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
            placeholder="Search resources..."
          >
        </div>

        <div class="filter-tabs">
          <button [class.active]="activeType === 'all'" (click)="setType('all')">All</button>
          <button [class.active]="activeType === 1" (click)="setType(1)">PDFs</button>
          <button [class.active]="activeType === 2" (click)="setType(2)">Videos</button>
          <button [class.active]="activeType === 3" (click)="setType(3)">Links</button>
          <button [class.active]="activeType === 4" (click)="setType(4)">Documents</button>
        </div>
      </div>

      <!-- Resources Table -->
      <div class="table-container">
        @if (isLoading()) {
          <div class="loading-state">
            <div class="spinner"></div>
            <p>Loading resources...</p>
          </div>
        } @else {
          <table>
            <thead>
              <tr>
                <th>Resource</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (item of filteredItems(); track item.id) {
                <tr>
                  <td>
                    <div class="resource-cell">
                      <div class="resource-thumbnail">
                        <img [src]="mediaService.getImageUrl(item.thumbnailUrl)" [alt]="item.nameEn">
                      </div>
                      <div class="resource-info">
                        <span class="resource-title">{{ item.nameEn }}</span>
                        <span class="resource-desc">{{ item.descriptionEn | slice:0:50 }}...</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span class="status-badge" [class]="item.isPublic ? 'active' : 'inactive'">
                      {{ item.isPublic ? 'Public' : 'Private' }}
                    </span>
                  </td>
                  <td>
                    <div class="actions-cell">
                      <button class="action-btn" title="View" (click)="viewItem(item)">👁️</button>
                      <button class="action-btn" title="Edit" (click)="editItem(item)">✏️</button>
                      <button class="action-btn" title="Download" (click)="downloadItem(item)">📥</button>
                      <button class="action-btn danger" title="Delete" (click)="deleteItem(item)">🗑️</button>
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="6" class="empty-state">
                    <span>📚</span>
                    <p>No resources found</p>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        }
      </div>

      <!-- Pagination -->
      <div class="pagination">
        <span class="page-info">
          Showing {{ filteredItems().length }} of {{ totalItems }} resources
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

    <!-- Add/Edit Modal -->
    @if (showAddModal || showEditModal) {
      <div class="modal-overlay" (click)="closeModals()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>{{ showEditModal ? 'Edit Resource' : 'Add Resource' }}</h2>
            <button class="close-btn" (click)="closeModals()">×</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>Name (English)</label>
              <input type="text" [(ngModel)]="modalItem.nameEn">
            </div>
            <div class="form-group">
              <label>Name (Arabic)</label>
              <input type="text" [(ngModel)]="modalItem.nameAr" dir="rtl">
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Type</label>
                <select [(ngModel)]="modalItem.type">
                  <option [ngValue]="1">PDF</option>
                  <option [ngValue]="2">Video</option>
                  <option [ngValue]="3">Link</option>
                  <option [ngValue]="4">Document</option>
                </select>
              </div>
              <div class="form-group">
                <label>Tags</label>
                <input type="text" [(ngModel)]="modalItem.tags" placeholder="Separate with commas">
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Is Public</label>
                <input type="checkbox" [(ngModel)]="modalItem.isPublic">
              </div>
              <div class="form-group">
                <label>Allow Download</label>
                <input type="checkbox" [(ngModel)]="modalItem.allowDownload">
              </div>
            </div>
            <div class="form-group">
              <label>Description (English)</label>
              <textarea [(ngModel)]="modalItem.descriptionEn" rows="3"></textarea>
            </div>
            <div class="form-group">
              <label>File URL</label>
              <input type="url" [(ngModel)]="modalItem.fileUrl">
            </div>
            <div class="form-group">
              <label>Thumbnail URL</label>
              <input type="url" [(ngModel)]="modalItem.thumbnailUrl">
            </div>
          </div>
          <div class="modal-footer">
            <button class="cancel-btn" (click)="closeModals()">Cancel</button>
            <button class="submit-btn" (click)="saveItem()">Save</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .library-page {
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

    .add-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      background: #247090;
      color: #fff;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
    }

    .add-btn:hover {
      background: #1a5570;
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

    .table-container {
      background: #fff;
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      overflow: hidden;
    }

    table {
      width: 100%;
      border-collapse: collapse;
    }

    th {
      text-align: left;
      padding: 1rem 1.5rem;
      background: #f8f9fa;
      font-weight: 600;
      font-size: 0.85rem;
      color: #666;
    }

    td {
      padding: 1rem 1.5rem;
      border-bottom: 1px solid #f0f0f0;
    }

    .resource-cell {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .resource-thumbnail {
      width: 50px;
      height: 50px;
      background: #f0f0f0;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }

    .resource-thumbnail img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .resource-thumbnail span {
      font-size: 1.5rem;
    }

    .resource-info {
      display: flex;
      flex-direction: column;
    }

    .resource-title {
      font-weight: 600;
    }

    .resource-desc {
      font-size: 0.85rem;
      color: #666;
    }

    .type-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 600;
    }

    .type-badge.book { background: #e3f2fd; color: #1565c0; }
    .type-badge.video { background: #fce4ec; color: #c62828; }
    .type-badge.article { background: #e8f5e9; color: #2e7d32; }
    .type-badge.document { background: #fff3e0; color: #ef6c00; }

    .status-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 600;
    }

    .status-badge.active { background: #e8f5e9; color: #2e7d32; }
    .status-badge.inactive { background: #f5f5f5; color: #666; }

    .actions-cell {
      display: flex;
      gap: 0.5rem;
    }

    .action-btn {
      width: 32px;
      height: 32px;
      border: none;
      background: #f5f5f5;
      border-radius: 8px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .action-btn:hover {
      background: #e0e0e0;
    }

    .action-btn.danger:hover {
      background: #ffebee;
    }

    .empty-state {
      text-align: center;
      padding: 3rem !important;
      color: #666;
    }

    .empty-state span {
      font-size: 3rem;
      display: block;
      margin-bottom: 1rem;
    }

    .loading-state {
      text-align: center;
      padding: 3rem;
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

    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal {
      background: #fff;
      border-radius: 16px;
      width: 100%;
      max-width: 600px;
      max-height: 90vh;
      overflow-y: auto;
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
    }

    .close-btn {
      width: 32px;
      height: 32px;
      border: none;
      background: #f5f5f5;
      border-radius: 8px;
      font-size: 1.25rem;
      cursor: pointer;
    }

    .modal-body {
      padding: 1.5rem;
    }

    .form-group {
      margin-bottom: 1rem;
    }

    .form-group label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
    }

    .form-group input,
    .form-group select,
    .form-group textarea {
      width: 100%;
      padding: 0.75rem;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      font-size: 0.95rem;
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

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      padding: 1.5rem;
      border-top: 1px solid #e0e0e0;
    }

    .cancel-btn {
      padding: 0.75rem 1.5rem;
      border: 2px solid #e0e0e0;
      background: #fff;
      border-radius: 8px;
      cursor: pointer;
    }

    .submit-btn {
      padding: 0.75rem 1.5rem;
      background: #247090;
      color: #fff;
      border: none;
      border-radius: 8px;
      cursor: pointer;
    }

    @media (max-width: 768px) {
      .stats-row {
        grid-template-columns: repeat(2, 1fr);
      }
    }
  `]
})
export class AdminLibraryComponent implements OnInit {
  private http = inject(HttpClient);
  private toastr = inject(ToastrService);
  mediaService = inject(MediaService);
  private apiUrl = environment.apiUrl;

  isLoading = signal(false);
  items = signal<LibraryItem[]>([]);
  filteredItems = signal<LibraryItem[]>([]);

  searchQuery = '';
  activeType: string | number = 'all';

  totalItems = 0;
  pdfCount = 0;
  videoCount = 0;
  linkCount = 0;

  currentPage = 1;
  pageSize = 10;
  totalPages = 1;

  showAddModal = false;
  showEditModal = false;
  modalItem: Partial<LibraryItem> = { type: 1, isPublic: true, allowDownload: true };

  ngOnInit() {
    this.loadItems();
    this.loadStats();
  }

  loadStats() {
    this.http.get<any>(`${this.apiUrl}/library/stats`).subscribe({
      next: (response) => {
        if (response.isSuccess && response.data) {
          this.totalItems = response.data.totalItems;
          this.pdfCount = response.data.pdfCount;
          this.videoCount = response.data.videoCount;
          this.linkCount = response.data.linkCount;
        }
      }
    });
  }

  loadItems() {
    this.isLoading.set(true);
    
    this.http.get<any>(`${this.apiUrl}/library?pageNumber=${this.currentPage}&pageSize=${this.pageSize}`).subscribe({
      next: (response) => {
        if (response.isSuccess && response.data) {
          const data = response.data.items || response.data;
          this.items.set(data);
          this.filteredItems.set(data);
          this.totalPages = response.data.totalPages || Math.ceil((response.data.totalCount || data.length) / this.pageSize);
        }
        this.isLoading.set(false);
      },
      error: () => {
        this.toastr.error('Failed to load library items');
        this.isLoading.set(false);
      }
    });
  }

  setType(type: string | number) {
    this.activeType = type;
    this.filterItems();
  }

  filterItems() {
    let filtered = this.items();

    if (this.activeType !== 'all') {
      filtered = filtered.filter(i => i.type === this.activeType);
    }

    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(i => 
        i.nameEn?.toLowerCase().includes(query) ||
        i.nameAr?.toLowerCase().includes(query) ||
        i.tags?.toLowerCase().includes(query)
      );
    }

    this.filteredItems.set(filtered);
  }

  getTypeIcon(type: string | number): string {
    const typeNum = typeof type === 'string' ? parseInt(type) : type;
    switch (typeNum) {
      case 1: return '📄';  // PDF
      case 2: return '🎬';  // Video
      case 3: return '🔗';  // Link
      case 4: return '📋';  // Document
      default: return '📚';
    }
  }

  getTypeName(type: string | number): string {
    const typeNum = typeof type === 'string' ? parseInt(type) : type;
    switch (typeNum) {
      case 1: return 'PDF';
      case 2: return 'Video';
      case 3: return 'Link';
      case 4: return 'Document';
      default: return 'Other';
    }
  }

  viewItem(item: LibraryItem) {
    if (item.fileUrl) {
      window.open(item.fileUrl, '_blank');
    }
  }

  editItem(item: LibraryItem) {
    this.modalItem = { ...item };
    this.showEditModal = true;
  }

  downloadItem(item: LibraryItem) {
    if (item.fileUrl) {
      window.open(item.fileUrl, '_blank');
    }
  }

  deleteItem(item: LibraryItem) {
    if (confirm('Are you sure you want to delete this resource?')) {
      this.http.delete(`${this.apiUrl}/library/${item.id}`).subscribe({
        next: () => {
          this.toastr.success('Resource deleted successfully');
          this.loadItems();
        },
        error: () => this.toastr.error('Failed to delete resource')
      });
    }
  }

  saveItem() {
    if (this.modalItem.id) {
      this.http.put(`${this.apiUrl}/library/${this.modalItem.id}`, this.modalItem).subscribe({
        next: () => {
          this.toastr.success('Resource updated successfully');
          this.loadItems();
          this.closeModals();
        },
        error: () => this.toastr.error('Failed to update resource')
      });
    } else {
      this.http.post(`${this.apiUrl}/library`, this.modalItem).subscribe({
        next: () => {
          this.toastr.success('Resource created successfully');
          this.loadItems();
          this.closeModals();
        },
        error: () => this.toastr.error('Failed to create resource')
      });
    }
  }

  closeModals() {
    this.showAddModal = false;
    this.showEditModal = false;
    this.modalItem = {};
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
      this.loadItems();
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadItems();
    }
  }

  goToPage(page: number) {
    this.currentPage = page;
    this.loadItems();
  }
}
