import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AdminSettingsService, SystemSetting, Category, Testimonial, Badge } from '../../../../core/services/admin-settings.service';

type ActiveTab = 'settings' | 'categories' | 'testimonials' | 'badges';

@Component({
  selector: 'app-settings-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TranslateModule],
  template: `
    <div class="container-fluid py-4">
      <!-- Page Header -->
      <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 class="mb-0">Settings Management</h2>
          <p class="text-muted mb-0">Manage system settings, categories, testimonials and badges</p>
        </div>
      </div>

      <!-- Tabs -->
      <ul class="nav nav-pills mb-4">
        <li class="nav-item">
          <button class="nav-link" [class.active]="activeTab() === 'settings'" (click)="activeTab.set('settings')">
            <i class="bi bi-gear me-2"></i>System Settings
          </button>
        </li>
        <li class="nav-item">
          <button class="nav-link" [class.active]="activeTab() === 'categories'" (click)="activeTab.set('categories')">
            <i class="bi bi-grid me-2"></i>Categories
          </button>
        </li>
        <li class="nav-item">
          <button class="nav-link" [class.active]="activeTab() === 'testimonials'" (click)="activeTab.set('testimonials')">
            <i class="bi bi-chat-quote me-2"></i>Testimonials
          </button>
        </li>
        <li class="nav-item">
          <button class="nav-link" [class.active]="activeTab() === 'badges'" (click)="activeTab.set('badges')">
            <i class="bi bi-award me-2"></i>Badges
          </button>
        </li>
      </ul>

      <!-- Loading State -->
      @if (isLoading()) {
        <div class="d-flex justify-content-center py-5">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
        </div>
      } @else {
        <!-- System Settings Tab -->
        @if (activeTab() === 'settings') {
          <div class="card">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h5 class="mb-0">System Settings</h5>
              <button class="btn btn-success btn-sm" (click)="saveAllSettings()">
                <i class="bi bi-save me-1"></i>Save All
              </button>
            </div>
            <div class="card-body">
              @for (category of settingCategories(); track category) {
                <div class="mb-4">
                  <h6 class="border-bottom pb-2 text-primary">{{ category }}</h6>
                  <div class="row">
                    @for (setting of getSettingsByCategory(category); track setting.key) {
                      <div class="col-md-6 mb-3">
                        <label class="form-label fw-semibold">{{ setting.key }}</label>
                        <div class="input-group">
                          <span class="input-group-text">EN</span>
                          <input type="text" class="form-control" [(ngModel)]="setting.value" 
                                 [placeholder]="setting.description || setting.key">
                        </div>
                        @if (setting.valueAr !== undefined) {
                          <div class="input-group mt-2">
                            <span class="input-group-text">AR</span>
                            <input type="text" class="form-control" [(ngModel)]="setting.valueAr" 
                                   dir="rtl" [placeholder]="'Arabic value'">
                          </div>
                        }
                        <small class="text-muted">{{ setting.description }}</small>
                      </div>
                    }
                  </div>
                </div>
              }
            </div>
          </div>
        }

        <!-- Categories Tab -->
        @if (activeTab() === 'categories') {
          <div class="card">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h5 class="mb-0">Categories</h5>
              <button class="btn btn-primary btn-sm" (click)="openCategoryModal()">
                <i class="bi bi-plus-lg me-1"></i>Add New
              </button>
            </div>
            <div class="card-body">
              <div class="table-responsive">
                <table class="table table-hover">
                  <thead>
                    <tr>
                      <th>Name (EN)</th>
                      <th>Name (AR)</th>
                      <th>Icon</th>
                      <th>Color</th>
                      <th>Course Count</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (category of categories(); track category.id) {
                      <tr>
                        <td>{{ category.nameEn }}</td>
                        <td dir="rtl">{{ category.nameAr }}</td>
                        <td><i [class]="'bi bi-' + category.iconName"></i> {{ category.iconName }}</td>
                        <td>
                          <span class="badge" [style.background-color]="category.color">{{ category.color }}</span>
                        </td>
                        <td>{{ category.courseCount }}</td>
                        <td>
                          <span class="badge" [class]="category.isActive ? 'bg-success' : 'bg-secondary'">
                            {{ category.isActive ? 'Active' : 'Inactive' }}
                          </span>
                        </td>
                        <td>
                          <button class="btn btn-sm btn-outline-primary me-1" (click)="editCategory(category)">
                            <i class="bi bi-pencil"></i>
                          </button>
                          <button class="btn btn-sm btn-outline-danger" (click)="deleteCategory(category.id)">
                            <i class="bi bi-trash"></i>
                          </button>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        }

        <!-- Testimonials Tab -->
        @if (activeTab() === 'testimonials') {
          <div class="card">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h5 class="mb-0">Testimonials</h5>
              <button class="btn btn-primary btn-sm" (click)="openTestimonialModal()">
                <i class="bi bi-plus-lg me-1"></i>Add New
              </button>
            </div>
            <div class="card-body">
              <div class="row">
                @for (testimonial of testimonials(); track testimonial.id) {
                  <div class="col-md-4 mb-3">
                    <div class="card h-100">
                      <div class="card-body">
                        <div class="d-flex align-items-center mb-3">
                          <img [src]="testimonial.authorImageUrl || '/assets/images/default-avatar.png'" 
                               class="rounded-circle me-3" width="50" height="50" alt="Author">
                          <div>
                            <h6 class="mb-0">{{ testimonial.authorName }}</h6>
                            <small class="text-muted">{{ testimonial.authorTitle }}</small>
                          </div>
                        </div>
                        <p class="card-text small">"{{ testimonial.contentEn }}"</p>
                        <div class="text-warning">
                          @for (star of [1,2,3,4,5]; track star) {
                            <i class="bi" [class.bi-star-fill]="star <= testimonial.rating" 
                               [class.bi-star]="star > testimonial.rating"></i>
                          }
                        </div>
                      </div>
                      <div class="card-footer d-flex justify-content-between">
                        <span class="badge" [class]="testimonial.isActive ? 'bg-success' : 'bg-secondary'">
                          {{ testimonial.isActive ? 'Active' : 'Inactive' }}
                        </span>
                        <div>
                          <button class="btn btn-sm btn-link p-0 me-2" (click)="editTestimonial(testimonial)">
                            <i class="bi bi-pencil"></i>
                          </button>
                          <button class="btn btn-sm btn-link p-0 text-danger" (click)="deleteTestimonial(testimonial.id)">
                            <i class="bi bi-trash"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                }
              </div>
            </div>
          </div>
        }

        <!-- Badges Tab -->
        @if (activeTab() === 'badges') {
          <div class="card">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h5 class="mb-0">Badges</h5>
              <button class="btn btn-primary btn-sm" (click)="openBadgeModal()">
                <i class="bi bi-plus-lg me-1"></i>Add New
              </button>
            </div>
            <div class="card-body">
              <div class="row">
                @for (badge of badges(); track badge.id) {
                  <div class="col-md-3 mb-3">
                    <div class="card h-100 text-center">
                      <div class="card-body">
                        <img [src]="badge.iconUrl" class="mb-3" width="64" height="64" alt="Badge">
                        <h6 class="mb-1">{{ badge.nameEn }}</h6>
                        <small class="text-muted d-block" dir="rtl">{{ badge.nameAr }}</small>
                        <span class="badge bg-primary mt-2">{{ badge.xpReward }} XP</span>
                        <p class="small text-muted mt-2 mb-0">{{ badge.earnedCount }} users earned</p>
                      </div>
                      <div class="card-footer">
                        <button class="btn btn-sm btn-outline-primary" (click)="editBadge(badge)">
                          <i class="bi bi-pencil me-1"></i>Edit
                        </button>
                      </div>
                    </div>
                  </div>
                }
              </div>
            </div>
          </div>
        }
      }

      <!-- Category Modal -->
      @if (showCategoryModal()) {
        <div class="modal show d-block" tabindex="-1" style="background: rgba(0,0,0,0.5)">
          <div class="modal-dialog">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title">{{ editingCategory() ? 'Edit' : 'Add' }} Category</h5>
                <button type="button" class="btn-close" (click)="showCategoryModal.set(false)"></button>
              </div>
              <div class="modal-body">
                <form [formGroup]="categoryForm">
                  <div class="mb-3">
                    <label class="form-label">Name (English)</label>
                    <input type="text" class="form-control" formControlName="nameEn">
                  </div>
                  <div class="mb-3">
                    <label class="form-label">Name (Arabic)</label>
                    <input type="text" class="form-control" formControlName="nameAr" dir="rtl">
                  </div>
                  <div class="mb-3">
                    <label class="form-label">Description (English)</label>
                    <textarea class="form-control" formControlName="descriptionEn" rows="2"></textarea>
                  </div>
                  <div class="mb-3">
                    <label class="form-label">Description (Arabic)</label>
                    <textarea class="form-control" formControlName="descriptionAr" rows="2" dir="rtl"></textarea>
                  </div>
                  <div class="row">
                    <div class="col-6 mb-3">
                      <label class="form-label">Icon (Bootstrap Icons)</label>
                      <input type="text" class="form-control" formControlName="iconName" placeholder="e.g., laptop">
                    </div>
                    <div class="col-6 mb-3">
                      <label class="form-label">Color</label>
                      <input type="color" class="form-control form-control-color" formControlName="color">
                    </div>
                  </div>
                  <div class="row">
                    <div class="col-6 mb-3">
                      <label class="form-label">Sort Order</label>
                      <input type="number" class="form-control" formControlName="sortOrder">
                    </div>
                    <div class="col-6 mb-3 d-flex align-items-end">
                      <div class="form-check">
                        <input type="checkbox" class="form-check-input" formControlName="isActive" id="categoryActive">
                        <label class="form-check-label" for="categoryActive">Active</label>
                      </div>
                    </div>
                  </div>
                </form>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" (click)="showCategoryModal.set(false)">Cancel</button>
                <button type="button" class="btn btn-primary" (click)="saveCategory()">Save</button>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- Testimonial Modal -->
      @if (showTestimonialModal()) {
        <div class="modal show d-block" tabindex="-1" style="background: rgba(0,0,0,0.5)">
          <div class="modal-dialog modal-lg">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title">{{ editingTestimonial() ? 'Edit' : 'Add' }} Testimonial</h5>
                <button type="button" class="btn-close" (click)="showTestimonialModal.set(false)"></button>
              </div>
              <div class="modal-body">
                <form [formGroup]="testimonialForm">
                  <div class="row">
                    <div class="col-md-6 mb-3">
                      <label class="form-label">Author Name (English)</label>
                      <input type="text" class="form-control" formControlName="authorName">
                    </div>
                    <div class="col-md-6 mb-3">
                      <label class="form-label">Author Name (Arabic)</label>
                      <input type="text" class="form-control" formControlName="authorNameAr" dir="rtl">
                    </div>
                  </div>
                  <div class="row">
                    <div class="col-md-6 mb-3">
                      <label class="form-label">Author Title (English)</label>
                      <input type="text" class="form-control" formControlName="authorTitle">
                    </div>
                    <div class="col-md-6 mb-3">
                      <label class="form-label">Author Title (Arabic)</label>
                      <input type="text" class="form-control" formControlName="authorTitleAr" dir="rtl">
                    </div>
                  </div>
                  <div class="mb-3">
                    <label class="form-label">Author Image URL</label>
                    <input type="text" class="form-control" formControlName="authorImageUrl">
                  </div>
                  <div class="mb-3">
                    <label class="form-label">Content (English)</label>
                    <textarea class="form-control" formControlName="contentEn" rows="3"></textarea>
                  </div>
                  <div class="mb-3">
                    <label class="form-label">Content (Arabic)</label>
                    <textarea class="form-control" formControlName="contentAr" rows="3" dir="rtl"></textarea>
                  </div>
                  <div class="row">
                    <div class="col-md-4 mb-3">
                      <label class="form-label">Rating</label>
                      <select class="form-select" formControlName="rating">
                        <option [value]="5">5 Stars</option>
                        <option [value]="4">4 Stars</option>
                        <option [value]="3">3 Stars</option>
                        <option [value]="2">2 Stars</option>
                        <option [value]="1">1 Star</option>
                      </select>
                    </div>
                    <div class="col-md-4 mb-3">
                      <label class="form-label">Sort Order</label>
                      <input type="number" class="form-control" formControlName="sortOrder">
                    </div>
                    <div class="col-md-4 mb-3 d-flex align-items-end">
                      <div class="form-check">
                        <input type="checkbox" class="form-check-input" formControlName="isActive" id="testimonialActive">
                        <label class="form-check-label" for="testimonialActive">Active</label>
                      </div>
                    </div>
                  </div>
                </form>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" (click)="showTestimonialModal.set(false)">Cancel</button>
                <button type="button" class="btn btn-primary" (click)="saveTestimonial()">Save</button>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- Badge Modal -->
      @if (showBadgeModal()) {
        <div class="modal show d-block" tabindex="-1" style="background: rgba(0,0,0,0.5)">
          <div class="modal-dialog">
            <div class="modal-content">
              <div class="modal-header">
                <h5 class="modal-title">{{ editingBadge() ? 'Edit' : 'Add' }} Badge</h5>
                <button type="button" class="btn-close" (click)="showBadgeModal.set(false)"></button>
              </div>
              <div class="modal-body">
                <form [formGroup]="badgeForm">
                  <div class="mb-3">
                    <label class="form-label">Name (English)</label>
                    <input type="text" class="form-control" formControlName="nameEn">
                  </div>
                  <div class="mb-3">
                    <label class="form-label">Name (Arabic)</label>
                    <input type="text" class="form-control" formControlName="nameAr" dir="rtl">
                  </div>
                  <div class="mb-3">
                    <label class="form-label">Description (English)</label>
                    <textarea class="form-control" formControlName="descriptionEn" rows="2"></textarea>
                  </div>
                  <div class="mb-3">
                    <label class="form-label">Description (Arabic)</label>
                    <textarea class="form-control" formControlName="descriptionAr" rows="2" dir="rtl"></textarea>
                  </div>
                  <div class="mb-3">
                    <label class="form-label">Icon URL</label>
                    <input type="text" class="form-control" formControlName="iconUrl">
                  </div>
                  <div class="row">
                    <div class="col-6 mb-3">
                      <label class="form-label">XP Reward</label>
                      <input type="number" class="form-control" formControlName="xpReward">
                    </div>
                    <div class="col-6 mb-3">
                      <label class="form-label">Type</label>
                      <select class="form-select" formControlName="type">
                        <option [value]="0">Achievement</option>
                        <option [value]="1">Completion</option>
                        <option [value]="2">Streak</option>
                        <option [value]="3">Special</option>
                      </select>
                    </div>
                  </div>
                </form>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" (click)="showBadgeModal.set(false)">Cancel</button>
                <button type="button" class="btn btn-primary" (click)="saveBadge()">Save</button>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class SettingsManagementComponent implements OnInit {
  private adminService = inject(AdminSettingsService);
  private fb = inject(FormBuilder);
  private translate = inject(TranslateService);

  activeTab = signal<ActiveTab>('settings');
  isLoading = signal(true);

  // Data
  settings = signal<SystemSetting[]>([]);
  categories = signal<Category[]>([]);
  testimonials = signal<Testimonial[]>([]);
  badges = signal<Badge[]>([]);

  // Modal states
  showCategoryModal = signal(false);
  showTestimonialModal = signal(false);
  showBadgeModal = signal(false);

  // Editing states
  editingCategory = signal<Category | null>(null);
  editingTestimonial = signal<Testimonial | null>(null);
  editingBadge = signal<Badge | null>(null);

  // Forms
  categoryForm: FormGroup;
  testimonialForm: FormGroup;
  badgeForm: FormGroup;

  settingCategories = computed(() => {
    const cats = new Set(this.settings().map(s => s.category));
    return Array.from(cats);
  });

  constructor() {
    this.categoryForm = this.fb.group({
      nameEn: ['', Validators.required],
      nameAr: ['', Validators.required],
      descriptionEn: [''],
      descriptionAr: [''],
      iconName: [''],
      color: ['#3b82f6'],
      sortOrder: [0],
      isActive: [true]
    });

    this.testimonialForm = this.fb.group({
      authorName: ['', Validators.required],
      authorNameAr: ['', Validators.required],
      authorTitle: [''],
      authorTitleAr: [''],
      authorImageUrl: [''],
      contentEn: ['', Validators.required],
      contentAr: ['', Validators.required],
      rating: [5],
      sortOrder: [0],
      isActive: [true]
    });

    this.badgeForm = this.fb.group({
      nameEn: ['', Validators.required],
      nameAr: ['', Validators.required],
      descriptionEn: [''],
      descriptionAr: [''],
      iconUrl: ['', Validators.required],
      xpReward: [100],
      type: [0]
    });
  }

  ngOnInit() {
    this.loadAllData();
  }

  loadAllData() {
    this.isLoading.set(true);
    
    this.adminService.getAllSettings().subscribe({
      next: (data) => this.settings.set(data),
      error: (err) => console.error('Failed to load settings', err)
    });

    this.adminService.getCategories().subscribe({
      next: (data) => this.categories.set(data),
      error: (err) => console.error('Failed to load categories', err)
    });

    this.adminService.getTestimonials().subscribe({
      next: (data) => this.testimonials.set(data),
      error: (err) => console.error('Failed to load testimonials', err)
    });

    this.adminService.getBadges().subscribe({
      next: (data) => {
        this.badges.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load badges', err);
        this.isLoading.set(false);
      }
    });
  }

  getSettingsByCategory(category: string): SystemSetting[] {
    return this.settings().filter(s => s.category === category);
  }

  saveAllSettings() {
    const settingsToUpdate = this.settings().map(s => ({
      key: s.key,
      value: s.value,
      valueAr: s.valueAr
    }));

    this.adminService.bulkUpdateSettings(settingsToUpdate).subscribe({
      next: () => alert('Settings saved successfully!'),
      error: (err) => console.error('Failed to save settings', err)
    });
  }

  // Category Methods
  openCategoryModal(category?: Category) {
    if (category) {
      this.editingCategory.set(category);
      this.categoryForm.patchValue(category);
    } else {
      this.editingCategory.set(null);
      this.categoryForm.reset({ color: '#3b82f6', sortOrder: 0, isActive: true });
    }
    this.showCategoryModal.set(true);
  }

  editCategory(category: Category) {
    this.openCategoryModal(category);
  }

  saveCategory() {
    if (this.categoryForm.valid) {
      const data = this.categoryForm.value;
      if (this.editingCategory()) {
        this.adminService.updateCategory(this.editingCategory()!.id, data).subscribe({
          next: () => {
            this.loadAllData();
            this.showCategoryModal.set(false);
          }
        });
      } else {
        this.adminService.createCategory(data).subscribe({
          next: () => {
            this.loadAllData();
            this.showCategoryModal.set(false);
          }
        });
      }
    }
  }

  deleteCategory(id: string) {
    if (confirm('Are you sure you want to delete this category?')) {
      this.adminService.deleteCategory(id).subscribe({
        next: () => this.loadAllData()
      });
    }
  }

  // Testimonial Methods
  openTestimonialModal(testimonial?: Testimonial) {
    if (testimonial) {
      this.editingTestimonial.set(testimonial);
      this.testimonialForm.patchValue(testimonial);
    } else {
      this.editingTestimonial.set(null);
      this.testimonialForm.reset({ rating: 5, sortOrder: 0, isActive: true });
    }
    this.showTestimonialModal.set(true);
  }

  editTestimonial(testimonial: Testimonial) {
    this.openTestimonialModal(testimonial);
  }

  saveTestimonial() {
    if (this.testimonialForm.valid) {
      const data = this.testimonialForm.value;
      if (this.editingTestimonial()) {
        this.adminService.updateTestimonial(this.editingTestimonial()!.id, data).subscribe({
          next: () => {
            this.loadAllData();
            this.showTestimonialModal.set(false);
          }
        });
      } else {
        this.adminService.createTestimonial(data).subscribe({
          next: () => {
            this.loadAllData();
            this.showTestimonialModal.set(false);
          }
        });
      }
    }
  }

  deleteTestimonial(id: string) {
    if (confirm('Are you sure you want to delete this testimonial?')) {
      this.adminService.deleteTestimonial(id).subscribe({
        next: () => this.loadAllData()
      });
    }
  }

  // Badge Methods
  openBadgeModal(badge?: Badge) {
    if (badge) {
      this.editingBadge.set(badge);
      this.badgeForm.patchValue(badge);
    } else {
      this.editingBadge.set(null);
      this.badgeForm.reset({ xpReward: 100, type: 0 });
    }
    this.showBadgeModal.set(true);
  }

  editBadge(badge: Badge) {
    this.openBadgeModal(badge);
  }

  saveBadge() {
    if (this.badgeForm.valid) {
      const data = this.badgeForm.value;
      if (this.editingBadge()) {
        this.adminService.updateBadge(this.editingBadge()!.id, data).subscribe({
          next: () => {
            this.loadAllData();
            this.showBadgeModal.set(false);
          }
        });
      } else {
        this.adminService.createBadge(data).subscribe({
          next: () => {
            this.loadAllData();
            this.showBadgeModal.set(false);
          }
        });
      }
    }
  }
}
