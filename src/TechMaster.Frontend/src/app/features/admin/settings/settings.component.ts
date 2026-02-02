import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AdminSettingsService } from '../../../core/services/admin-settings.service';
import { ToastrService } from 'ngx-toastr';

interface Settings {
  general: {
    siteName: string;
    siteDescription: string;
    contactEmail: string;
    supportPhone: string;
    defaultLanguage: string;
    timezone: string;
  };
  payment: {
    whatsappNumber: string;
    currency: string;
    enableManualPayment: boolean;
    paymentInstructions: string;
    bankName: string;
    bankAccountNumber: string;
    bankAccountName: string;
    walletNumber: string;
    walletType: string;
  };
  social: {
    linkedIn: string;
    facebook: string;
    instagram: string;
    tiktok: string;
    youtube: string;
    twitter: string;
  };
  email: {
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    smtpPassword: string;
    fromEmail: string;
    fromName: string;
  };
  notifications: {
    enableEmailNotifications: boolean;
    enablePushNotifications: boolean;
    newEnrollmentNotify: boolean;
    courseCompletionNotify: boolean;
    paymentNotify: boolean;
  };
  appearance: {
    primaryColor: string;
    logo: string;
    favicon: string;
    enableDarkMode: boolean;
  };
}

@Component({
  selector: 'app-admin-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  template: `
    <div class="settings-page">
      <div class="page-header">
        <div class="header-left">
          <h1>Settings</h1>
          <p class="subtitle">Configure platform settings and preferences</p>
        </div>
        <button class="save-btn" (click)="saveSettings()" [disabled]="saving()">
          @if (saving()) {
            <span class="spinner"></span>
          }
          Save Changes
        </button>
      </div>

      <div class="settings-layout">
        <!-- Sidebar Navigation -->
        <div class="settings-nav">
          <button 
            [class.active]="activeSection === 'general'" 
            (click)="activeSection = 'general'"
          >
            <span>⚙️</span>
            General
          </button>
          <button 
            [class.active]="activeSection === 'payment'" 
            (click)="activeSection = 'payment'"
          >
            <span>💳</span>
            Payment
          </button>
          <button 
            [class.active]="activeSection === 'social'" 
            (click)="activeSection = 'social'"
          >
            <span>🌐</span>
            Social Links
          </button>
          <button 
            [class.active]="activeSection === 'categories'" 
            (click)="activeSection = 'categories'; loadCategories()"
          >
            <span>📂</span>
            Categories
          </button>
        </div>

        <!-- Settings Content -->
        <div class="settings-content">
          <!-- General Settings -->
          @if (activeSection === 'general') {
            <div class="settings-section">
              <h2>General Settings</h2>
              <p class="section-desc">Configure basic platform information</p>

              <div class="form-group">
                <label>Site Name</label>
                <input disabled type="text" [(ngModel)]="settings.general.siteName">
              </div>

              <div class="form-group">
                <label>Site Description</label>
                <textarea disabled [(ngModel)]="settings.general.siteDescription" rows="3"></textarea>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>Contact Email</label>
                  <input disabled type="email" [(ngModel)]="settings.general.contactEmail">
                </div>
                <div class="form-group">
                  <label>Support Phone</label>
                  <input disabled type="tel" [(ngModel)]="settings.general.supportPhone">
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>Default Language</label>
                  <select disabled [(ngModel)]="settings.general.defaultLanguage">
                    <option value="en">English</option>
                    <option value="ar">العربية</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Timezone</label>
                  <select disabled [(ngModel)]="settings.general.timezone">
                    <option value="UTC">UTC</option>
                    <option value="Africa/Cairo">Cairo (UTC+2)</option>
                    <option value="Asia/Dubai">Dubai (UTC+4)</option>
                    <option value="Asia/Riyadh">Riyadh (UTC+3)</option>
                  </select>
                </div>
              </div>
            </div>
          }

          <!-- Payment Settings -->
          @if (activeSection === 'payment') {
            <div class="settings-section">
              <h2>Payment Settings</h2>
              <p class="section-desc">Configure payment options and instructions</p>

              <div class="form-group">
                <label>WhatsApp Number *</label>
                <input disabled type="tel" [(ngModel)]="settings.payment.whatsappNumber" placeholder="+201029907297">
                <span class="help-text">Students will contact this number for payment verification</span>
              </div>

              <div class="form-group">
                <label>Currency</label>
                <select disabled [(ngModel)]="settings.payment.currency">
                  <option value="EGP">EGP (ج.م)</option>
                  <option value="SAR">SAR (ر.س)</option>
                  <option value="AED">AED (د.إ)</option>
                  <option value="USD">USD ($)</option>
                </select>
              </div>

              <h3 class="subsection-title">Bank Transfer Details</h3>

              <div class="form-group">
                <label>Bank Name</label>
                <input type="text" [(ngModel)]="settings.payment.bankName" placeholder="e.g., National Bank of Egypt">
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>Account Number</label>
                  <input type="text" [(ngModel)]="settings.payment.bankAccountNumber" placeholder="Account number">
                </div>
                <div class="form-group">
                  <label>Account Holder Name</label>
                  <input type="text" [(ngModel)]="settings.payment.bankAccountName" placeholder="Account holder name">
                </div>
              </div>

              <h3 class="subsection-title">E-Wallet Details</h3>

              <div class="form-row">
                <div class="form-group">
                  <label>Wallet Type</label>
                  <select [(ngModel)]="settings.payment.walletType">
                    <option value="">Select wallet type...</option>
                    <option value="Vodafone Cash">Vodafone Cash</option>
                    <option value="Fawry">Fawry</option>
                    <option value="InstaPay">InstaPay</option>
                    <option value="Orange Cash">Orange Cash</option>
                    <option value="Etisalat Cash">Etisalat Cash</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Wallet Number</label>
                  <input type="tel" [(ngModel)]="settings.payment.walletNumber" placeholder="Wallet number">
                </div>
              </div>

              <div class="form-group">
                <label>Payment Instructions</label>
                <textarea [(ngModel)]="settings.payment.paymentInstructions" rows="4" 
                  placeholder="Enter detailed payment instructions for students..."></textarea>
                <span class="help-text">This text will be shown to students during the payment process</span>
              </div>

              <div class="form-group toggle-group">
                <div class="toggle-info">
                  <label>Enable Manual Payment</label>
                  <span class="help-text">Allow students to upload payment screenshots</span>
                </div>
                <label class="toggle">
                  <input type="checkbox" [(ngModel)]="settings.payment.enableManualPayment">
                  <span class="slider"></span>
                </label>
              </div>

            </div>
          }

          <!-- Social Links Settings -->
          @if (activeSection === 'social') {
            <div class="settings-section">
              <h2>Social Media Links</h2>
              <p class="section-desc">Configure academy social media profiles. These will appear in the footer and contact page.</p>

              <div class="form-group">
                <label>
                  <span class="social-icon">📘</span> Facebook
                </label>
                <input type="url" [(ngModel)]="settings.social.facebook" placeholder="https://facebook.com/yourpage">
              </div>

              <div class="form-group">
                <label>
                  <span class="social-icon">📸</span> Instagram
                </label>
                <input type="url" [(ngModel)]="settings.social.instagram" placeholder="https://instagram.com/yourpage">
              </div>

              <div class="form-group">
                <label>
                  <span class="social-icon">💼</span> LinkedIn
                </label>
                <input type="url" [(ngModel)]="settings.social.linkedIn" placeholder="https://linkedin.com/company/yourcompany">
              </div>

              <div class="form-group">
                <label>
                  <span class="social-icon">🐦</span> Twitter (X)
                </label>
                <input type="url" [(ngModel)]="settings.social.twitter" placeholder="https://twitter.com/yourhandle">
              </div>

              <div class="form-group">
                <label>
                  <span class="social-icon">🎵</span> TikTok
                </label>
                <input type="url" [(ngModel)]="settings.social.tiktok" placeholder="https://tiktok.com/@yourhandle">
              </div>

              <div class="form-group">
                <label>
                  <span class="social-icon">📺</span> YouTube
                </label>
                <input type="url" [(ngModel)]="settings.social.youtube" placeholder="https://youtube.com/@yourchannel">
              </div>
            </div>
          }


          <!-- Notification Settings -->
          @if (activeSection === 'notifications') {
            <div class="settings-section">
              <h2>Notification Settings</h2>
              <p class="section-desc">Configure how and when notifications are sent</p>

              <div class="form-group toggle-group">
                <div class="toggle-info">
                  <label>Email Notifications</label>
                  <span class="help-text">Send notifications via email</span>
                </div>
                <label class="toggle">
                  <input type="checkbox" [(ngModel)]="settings.notifications.enableEmailNotifications">
                  <span class="slider"></span>
                </label>
              </div>

              <div class="form-group toggle-group">
                <div class="toggle-info">
                  <label>Push Notifications</label>
                  <span class="help-text">Send browser push notifications</span>
                </div>
                <label class="toggle">
                  <input type="checkbox" [(ngModel)]="settings.notifications.enablePushNotifications">
                  <span class="slider"></span>
                </label>
              </div>

              <h3 class="subsection-title">Notification Triggers</h3>

              <div class="form-group toggle-group">
                <div class="toggle-info">
                  <label>New Enrollment</label>
                </div>
                <label class="toggle">
                  <input type="checkbox" [(ngModel)]="settings.notifications.newEnrollmentNotify">
                  <span class="slider"></span>
                </label>
              </div>

              <div class="form-group toggle-group">
                <div class="toggle-info">
                  <label>Course Completion</label>
                </div>
                <label class="toggle">
                  <input type="checkbox" [(ngModel)]="settings.notifications.courseCompletionNotify">
                  <span class="slider"></span>
                </label>
              </div>

              <div class="form-group toggle-group">
                <div class="toggle-info">
                  <label>Payment Received</label>
                </div>
                <label class="toggle">
                  <input type="checkbox" [(ngModel)]="settings.notifications.paymentNotify">
                  <span class="slider"></span>
                </label>
              </div>
            </div>
          }


          <!-- Categories Management -->
          @if (activeSection === 'categories') {
            <div class="settings-section">
              <div class="section-header">
                <div>
                  <h2>Categories Management</h2>
                  <p class="section-desc">Manage course and content categories</p>
                </div>
                <button class="add-btn" (click)="openCategoryModal()">
                  <span>+</span> Add Category
                </button>
              </div>

              @if (categoriesLoading()) {
                <div class="loading-state">
                  <div class="spinner"></div>
                  <p>Loading categories...</p>
                </div>
              } @else {
                <div class="categories-list">
                  @for (category of categories(); track category.id) {
                    <div class="category-card">
                      <div class="category-info">
                        @if (category.iconUrl) {
                          <span class="category-icon">{{ category.iconUrl }}</span>
                        } @else {
                          <span class="category-icon">📂</span>
                        }
                        <div class="category-details">
                          <span class="category-name">{{ category.nameEn }}</span>
                          <span class="category-name-ar">{{ category.nameAr }}</span>
                          <span class="category-stats">{{ category.courseCount || 0 }} courses</span>
                        </div>
                      </div>
                      <div class="category-actions">
                        <span class="status-badge" [class.active]="category.isActive">
                          {{ category.isActive ? 'Active' : 'Inactive' }}
                        </span>
                        <button class="action-btn" (click)="editCategory(category)">✏️</button>
                        <button class="action-btn danger" (click)="deleteCategory(category)">🗑️</button>
                      </div>
                    </div>
                  } @empty {
                    <div class="empty-state">
                      <span>📂</span>
                      <p>No categories found</p>
                    </div>
                  }
                </div>
              }
            </div>
          }
        </div>
      </div>
    </div>

    <!-- Category Modal -->
    @if (showCategoryModal) {
      <div class="modal-overlay" (click)="closeCategoryModal()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>{{ editingCategory ? 'Edit Category' : 'Add Category' }}</h2>
            <button class="close-btn" (click)="closeCategoryModal()">×</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>Name (English) *</label>
              <input type="text" [(ngModel)]="categoryForm.nameEn" placeholder="e.g., Web Development">
            </div>
            <div class="form-group">
              <label>Name (Arabic) *</label>
              <input type="text" [(ngModel)]="categoryForm.nameAr" dir="rtl" placeholder="مثال: تطوير الويب">
            </div>
            <div class="form-group">
              <label>Description (English)</label>
              <textarea [(ngModel)]="categoryForm.descriptionEn" rows="2"></textarea>
            </div>
            <div class="form-group">
              <label>Description (Arabic)</label>
              <textarea [(ngModel)]="categoryForm.descriptionAr" rows="2" dir="rtl"></textarea>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Icon (Emoji)</label>
                <input type="text" [(ngModel)]="categoryForm.iconUrl" placeholder="💻">
              </div>
              <div class="form-group">
                <label>Sort Order</label>
                <input type="number" [(ngModel)]="categoryForm.sortOrder" min="0">
              </div>
            </div>
            <div class="form-group toggle-group">
              <div class="toggle-info">
                <label>Active</label>
                <span class="help-text">Show this category on the website</span>
              </div>
              <label class="toggle">
                <input type="checkbox" [(ngModel)]="categoryForm.isActive">
                <span class="slider"></span>
              </label>
            </div>
          </div>
          <div class="modal-footer">
            <button class="cancel-btn" (click)="closeCategoryModal()">Cancel</button>
            <button class="submit-btn" (click)="saveCategory()">
              {{ editingCategory ? 'Update' : 'Create' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .settings-page {
      padding: 2rem;
      max-width: 1200px;
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

    .save-btn {
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

    .save-btn:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }

    .save-btn .spinner {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .settings-layout {
      display: grid;
      grid-template-columns: 240px 1fr;
      gap: 2rem;
    }

    .settings-nav {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .settings-nav button {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.875rem 1rem;
      border: none;
      background: transparent;
      border-radius: 8px;
      font-size: 0.95rem;
      font-weight: 500;
      cursor: pointer;
      text-align: left;
      transition: all 0.2s;
    }

    .settings-nav button:hover {
      background: #f0f0f0;
    }

    .settings-nav button.active {
      background: #247090;
      color: #fff;
    }

    .settings-content {
      background: #fff;
      border-radius: 16px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      padding: 2rem;
    }

    .settings-section h2 {
      font-size: 1.25rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
    }

    .section-desc {
      color: #666;
      margin-bottom: 2rem;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .form-group {
      margin-bottom: 1.5rem;
    }

    .form-group label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 600;
    }

    .form-group input,
    .form-group select,
    .form-group textarea {
      width: 100%;
      padding: 0.75rem 1rem;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      font-size: 0.95rem;
      transition: border-color 0.2s;
    }

    .form-group input:focus,
    .form-group select:focus,
    .form-group textarea:focus {
      outline: none;
      border-color: #247090;
    }

    .form-group textarea {
      resize: vertical;
    }

    .help-text {
      display: block;
      font-size: 0.85rem;
      color: #666;
      margin-top: 0.25rem;
    }

    .toggle-group {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;
      background: #f8f9fa;
      border-radius: 8px;
    }

    .toggle-info label {
      margin-bottom: 0;
    }

    .toggle-info .help-text {
      margin-top: 0.25rem;
    }

    .toggle {
      position: relative;
      width: 52px;
      height: 28px;
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
      border-radius: 28px;
    }

    .slider:before {
      position: absolute;
      content: "";
      height: 22px;
      width: 22px;
      left: 3px;
      bottom: 3px;
      background-color: white;
      transition: 0.3s;
      border-radius: 50%;
    }

    input:checked + .slider {
      background-color: #247090;
    }

    input:checked + .slider:before {
      transform: translateX(24px);
    }

    .subsection-title {
      font-size: 1rem;
      font-weight: 600;
      margin: 1.5rem 0 1rem;
      padding-top: 1rem;
      border-top: 1px solid #e0e0e0;
    }

    .test-btn {
      padding: 0.625rem 1.25rem;
      background: #f0f0f0;
      border: none;
      border-radius: 6px;
      font-weight: 600;
      cursor: pointer;
    }

    .test-btn:hover {
      background: #e0e0e0;
    }

    .social-icon {
      margin-right: 0.5rem;
    }

    .color-picker {
      display: flex;
      gap: 0.5rem;
    }

    .color-picker input[type="color"] {
      width: 50px;
      height: 44px;
      padding: 0;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      cursor: pointer;
    }

    .color-picker input[type="text"] {
      flex: 1;
    }

    .file-upload {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .upload-preview {
      width: 80px;
      height: 80px;
      background: #f0f0f0;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2rem;
      overflow: hidden;
    }

    .upload-preview.small {
      width: 48px;
      height: 48px;
      font-size: 1.25rem;
    }

    .upload-preview img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }

    .upload-btn {
      padding: 0.625rem 1.25rem;
      background: #f0f0f0;
      border: none;
      border-radius: 6px;
      font-weight: 600;
      cursor: pointer;
    }

    @media (max-width: 768px) {
      .settings-page {
        padding: 1rem;
      }

      .settings-layout {
        grid-template-columns: 1fr;
      }

      .settings-nav {
        flex-direction: row;
        overflow-x: auto;
        padding-bottom: 0.5rem;
      }

      .settings-nav button {
        white-space: nowrap;
      }

      .form-row {
        grid-template-columns: 1fr;
      }
    }

    /* Category Management Styles */
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1.5rem;
    }

    .add-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.625rem 1rem;
      background: #247090;
      color: #fff;
      border: none;
      border-radius: 6px;
      font-weight: 600;
      cursor: pointer;
    }

    .categories-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .category-card {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.25rem;
      background: #f8f9fa;
      border-radius: 8px;
      border: 1px solid #e9ecef;
    }

    .category-info {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .category-icon {
      font-size: 1.5rem;
    }

    .category-details {
      display: flex;
      flex-direction: column;
    }

    .category-name {
      font-weight: 600;
      color: #1a1a2e;
    }

    .category-name-ar {
      color: #666;
      font-size: 0.875rem;
    }

    .category-stats {
      color: #888;
      font-size: 0.75rem;
    }

    .category-actions {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .status-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 600;
      background: #e9ecef;
      color: #666;
    }

    .status-badge.active {
      background: #d4edda;
      color: #155724;
    }

    .action-btn {
      padding: 0.375rem;
      background: transparent;
      border: none;
      cursor: pointer;
      font-size: 1rem;
      opacity: 0.7;
      transition: opacity 0.2s;
    }

    .action-btn:hover {
      opacity: 1;
    }

    .action-btn.danger:hover {
      color: #dc3545;
    }

    .loading-state, .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem;
      color: #666;
    }

    .loading-state .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid #f0f0f0;
      border-top-color: #247090;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    .empty-state span {
      font-size: 3rem;
      margin-bottom: 1rem;
    }

    /* Modal Styles */
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
      border-radius: 12px;
      width: 90%;
      max-width: 500px;
      max-height: 90vh;
      overflow-y: auto;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.25rem;
      border-bottom: 1px solid #e9ecef;
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
    }

    .modal-body {
      padding: 1.25rem;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      padding: 1.25rem;
      border-top: 1px solid #e9ecef;
    }

    .cancel-btn {
      padding: 0.625rem 1.25rem;
      background: #f0f0f0;
      border: none;
      border-radius: 6px;
      font-weight: 600;
      cursor: pointer;
    }

    .submit-btn {
      padding: 0.625rem 1.25rem;
      background: #247090;
      color: #fff;
      border: none;
      border-radius: 6px;
      font-weight: 600;
      cursor: pointer;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class SettingsComponent implements OnInit {
  private translate = inject(TranslateService);
  private settingsService = inject(AdminSettingsService);
  private toastr = inject(ToastrService);

  activeSection = 'general';
  saving = signal(false);
  loading = signal(true);

  settings: Settings = {
    general: {
      siteName: 'TechMaster',
      siteDescription: 'The #1 tech education platform in the Arab world',
      contactEmail: 'support@techmaster.com',
      supportPhone: '+20 1029907297',
      defaultLanguage: 'en',
      timezone: 'Africa/Cairo'
    },
    payment: {
      whatsappNumber: '+201029907297',
      currency: 'EGP',
      enableManualPayment: true,
      paymentInstructions: 'Please send payment to the following account and upload a screenshot via WhatsApp to confirm your enrollment.',
      bankName: '',
      bankAccountNumber: '',
      bankAccountName: '',
      walletNumber: '',
      walletType: ''
    },
    social: {
      linkedIn: '',
      facebook: '',
      instagram: '',
      tiktok: '',
      youtube: '',
      twitter: ''
    },
    email: {
      smtpHost: 'smtp.example.com',
      smtpPort: 587,
      smtpUser: '',
      smtpPassword: '',
      fromEmail: 'noreply@techmaster.com',
      fromName: 'TechMaster'
    },
    notifications: {
      enableEmailNotifications: true,
      enablePushNotifications: true,
      newEnrollmentNotify: true,
      courseCompletionNotify: true,
      paymentNotify: true
    },
    appearance: {
      primaryColor: '#247090',
      logo: '',
      favicon: '',
      enableDarkMode: false
    }
  };

  ngOnInit() {
    this.loadSettings();
  }

  loadSettings() {
    this.loading.set(true);
    this.settingsService.getAllSettings().subscribe({
      next: (settingsData) => {
        if (settingsData) {
          // Map API settings to local format
          settingsData.forEach(setting => {
            const [category, key] = setting.key.split('.');
            if (category && key && (this.settings as any)[category]) {
              (this.settings as any)[category][key] = setting.value;
            }
          });
        }
        this.loading.set(false);
      },
      error: () => {
        this.toastr.error('Failed to load settings');
        this.loading.set(false);
      }
    });
  }

  saveSettings() {
    this.saving.set(true);
    
    // Convert settings to bulk update format
    const settingsToUpdate: { key: string; value: string }[] = [];
    
    Object.entries(this.settings).forEach(([category, values]) => {
      Object.entries(values).forEach(([key, value]) => {
        settingsToUpdate.push({
          key: `${category}.${key}`,
          value: String(value)
        });
      });
    });

    this.settingsService.bulkUpdateSettings(settingsToUpdate).subscribe({
      next: () => {
        this.saving.set(false);
        this.toastr.success('Settings saved successfully');
      },
      error: () => {
        this.saving.set(false);
        this.toastr.error('Failed to save settings');
      }
    });
  }

  testEmailConnection() {
    this.toastr.info('Testing email connection...');
  }

  // Category Management
  categories = signal<any[]>([]);
  categoriesLoading = signal(false);
  showCategoryModal = false;
  editingCategory: any = null;
  categoryForm: any = {
    nameEn: '',
    nameAr: '',
    descriptionEn: '',
    descriptionAr: '',
    iconUrl: '',
    sortOrder: 0,
    isActive: true
  };

  loadCategories() {
    this.categoriesLoading.set(true);
    this.settingsService.getCategories().subscribe({
      next: (data) => {
        this.categories.set(data || []);
        this.categoriesLoading.set(false);
      },
      error: () => {
        this.toastr.error('Failed to load categories');
        this.categoriesLoading.set(false);
      }
    });
  }

  openCategoryModal() {
    this.editingCategory = null;
    this.categoryForm = {
      nameEn: '',
      nameAr: '',
      descriptionEn: '',
      descriptionAr: '',
      iconUrl: '',
      sortOrder: this.categories().length,
      isActive: true
    };
    this.showCategoryModal = true;
  }

  editCategory(category: any) {
    this.editingCategory = category;
    this.categoryForm = { ...category };
    this.showCategoryModal = true;
  }

  closeCategoryModal() {
    this.showCategoryModal = false;
    this.editingCategory = null;
  }

  saveCategory() {
    if (!this.categoryForm.nameEn || !this.categoryForm.nameAr) {
      this.toastr.error('Name is required in both languages');
      return;
    }

    if (this.editingCategory) {
      this.settingsService.updateCategory(this.editingCategory.id, this.categoryForm).subscribe({
        next: () => {
          this.toastr.success('Category updated successfully');
          this.loadCategories();
          this.closeCategoryModal();
        },
        error: () => {
          this.toastr.error('Failed to update category');
        }
      });
    } else {
      this.settingsService.createCategory(this.categoryForm).subscribe({
        next: () => {
          this.toastr.success('Category created successfully');
          this.loadCategories();
          this.closeCategoryModal();
        },
        error: () => {
          this.toastr.error('Failed to create category');
        }
      });
    }
  }

  deleteCategory(category: any) {
    if (confirm(`Are you sure you want to delete "${category.nameEn}"?`)) {
      this.settingsService.deleteCategory(category.id).subscribe({
        next: () => {
          this.toastr.success('Category deleted successfully');
          this.loadCategories();
        },
        error: () => {
          this.toastr.error('Failed to delete category');
        }
      });
    }
  }
}
