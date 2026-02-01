import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../../core/services/auth.service';
import { FileUploadService } from '../../../core/services/file-upload.service';
import { MediaService } from '../../../core/services/media.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="profile-page">
      <div class="page-header">
        <h1>My Profile</h1>
        <p>Manage your account information and preferences</p>
      </div>

      <div class="profile-content">
        <aside class="profile-sidebar">
          <div class="profile-avatar">
            <div class="avatar-wrapper">
              <img [src]="profileImageUrl() || 'assets/images/default-avatar.png'" alt="Profile">
              <input type="file" #avatarInput (change)="onAvatarSelected($event)" accept="image/*" style="display: none">
              <button class="change-avatar-btn" (click)="avatarInput.click()">
                <span>📷</span>
              </button>
            </div>
            <h3>{{ authService.getCurrentUser()?.fullName }}</h3>
            <span class="role-badge">{{ authService.getCurrentUser()?.role }}</span>
          </div>

          <nav class="profile-nav">
            <button 
              class="nav-item" 
              [class.active]="activeTab() === 'personal'"
              (click)="activeTab.set('personal')"
            >
              <span class="icon">👤</span>
              Personal Info
            </button>
            <button 
              class="nav-item" 
              [class.active]="activeTab() === 'security'"
              (click)="activeTab.set('security')"
            >
              <span class="icon">🔒</span>
              Security
            </button>
          </nav>
        </aside>

        <main class="profile-main">
          @if (activeTab() === 'personal') {
            <div class="tab-content">
              <h2>Personal Info</h2>
              
              <form [formGroup]="personalForm" (ngSubmit)="savePersonalInfo()">
                <div class="form-row">
                  <div class="form-group">
                    <label>First Name</label>
                    <input type="text" formControlName="firstName">
                  </div>
                  <div class="form-group">
                    <label>Last Name</label>
                    <input type="text" formControlName="lastName">
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label>Email</label>
                    <input type="email" formControlName="email" readonly>
                  </div>
                  <div class="form-group">
                    <label>Phone</label>
                    <input type="tel" formControlName="phone">
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label>Country</label>
                    <input type="text" formControlName="country">
                  </div>
                  <div class="form-group">
                    <label>City</label>
                    <input type="text" formControlName="city">
                  </div>
                </div>
                <div class="form-group full-width">
                  <label>Bio</label>
                  <textarea formControlName="bio" rows="4" placeholder="Tell us about yourself..."></textarea>
                </div>
                
                <!-- Social Links Section -->
                <h3 class="section-title">Social & Professional Links</h3>
                <div class="form-row">
                  <div class="form-group">
                    <label>
                      <span class="material-icons">link</span> LinkedIn
                    </label>
                    <input type="url" formControlName="linkedInUrl" placeholder="https://linkedin.com/in/username">
                  </div>
                  <div class="form-group">
                    <label>
                      <span class="material-icons">code</span> GitHub
                    </label>
                    <input type="url" formControlName="gitHubUrl" placeholder="https://github.com/username">
                  </div>
                </div>
                <div class="form-row">
                  <div class="form-group">
                    <label>
                      <span class="material-icons">work</span> Portfolio
                    </label>
                    <input type="url" formControlName="portfolioUrl" placeholder="https://yourportfolio.com">
                  </div>
                  <div class="form-group">
                    <label>
                      <span class="material-icons">language</span> Website
                    </label>
                    <input type="url" formControlName="websiteUrl" placeholder="https://yourwebsite.com">
                  </div>
                </div>
                
                <!-- CV Upload -->
                <div class="form-group full-width">
                  <label>
                    <span class="material-icons">description</span> CV / Resume
                  </label>
                  <div class="cv-upload-wrapper">
                    @if (cvUrl()) {
                      <div class="cv-preview">
                        <span class="material-icons">description</span>
                        <span>CV uploaded</span>
                        <a [href]="cvUrl()" target="_blank" class="view-cv-btn">View</a>
                        <button type="button" class="remove-cv-btn" (click)="removeCv()">Remove</button>
                      </div>
                    }
                    <input type="file" #cvInput (change)="onCvSelected($event)" accept=".pdf,.doc,.docx" style="display: none">
                    <button type="button" class="upload-cv-btn" (click)="cvInput.click()" [disabled]="uploadingCv()">
                      @if (uploadingCv()) {
                        <span class="spinner"></span>
                      }
                      {{ cvUrl() ? 'Replace CV' : 'Upload CV' }}
                    </button>
                    <span class="help-text">PDF, DOC or DOCX (max 5MB)</span>
                  </div>
                </div>
                
                <div class="form-actions">
                  <button type="submit" class="save-btn" [disabled]="savingPersonal()">
                    @if (savingPersonal()) {
                      <span class="spinner"></span>
                    }
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          }

          @if (activeTab() === 'security') {
            <div class="tab-content">
              <h2>Security</h2>

              <div class="security-section">
                <h3>Change Password</h3>
                <form [formGroup]="passwordForm" (ngSubmit)="changePassword()">
                  <div class="form-group">
                    <label>Current Password</label>
                    <input type="password" formControlName="currentPassword">
                  </div>
                  <div class="form-group">
                    <label>New Password</label>
                    <input type="password" formControlName="newPassword">
                  </div>
                  <div class="form-group">
                    <label>Confirm Password</label>
                    <input type="password" formControlName="confirmPassword">
                  </div>
                  <button type="submit" class="save-btn" [disabled]="savingPassword()">
                    Update Password
                  </button>
                </form>
              </div>

            </div>
          }

        </main>
      </div>
    </div>
  `,
  styles: [`
    .profile-page {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
    }

    .page-header {
      margin-bottom: 2rem;
    }

    .page-header h1 {
      font-size: 2rem;
      font-weight: 700;
      color: #000;
      margin-bottom: 0.5rem;
    }

    .page-header p {
      color: #666;
    }

    .profile-content {
      display: grid;
      grid-template-columns: 280px 1fr;
      gap: 2rem;
    }

    .profile-sidebar {
      background: #fff;
      border-radius: 16px;
      padding: 1.5rem;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      height: fit-content;
    }

    .profile-avatar {
      text-align: center;
      padding-bottom: 1.5rem;
      border-bottom: 1px solid #e0e0e0;
      margin-bottom: 1.5rem;
    }

    .avatar-wrapper {
      position: relative;
      display: inline-block;
      margin-bottom: 1rem;
    }

    .avatar-wrapper img {
      width: 100px;
      height: 100px;
      border-radius: 50%;
      object-fit: cover;
      border: 4px solid #247090;
    }

    .change-avatar-btn {
      position: absolute;
      bottom: 0;
      right: 0;
      width: 32px;
      height: 32px;
      background: #247090;
      border: 3px solid #fff;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.9rem;
    }

    .profile-avatar h3 {
      font-size: 1.1rem;
      font-weight: 700;
      color: #000;
      margin-bottom: 0.25rem;
    }

    .role-badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      background: #e8f4f8;
      color: #247090;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 600;
    }

    .profile-nav {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.875rem 1rem;
      background: none;
      border: none;
      border-radius: 10px;
      font-size: 0.95rem;
      color: #666;
      cursor: pointer;
      transition: all 0.3s ease;
      text-align: left;
    }

    .nav-item:hover {
      background: #f8f9fa;
      color: #000;
    }

    .nav-item.active {
      background: #e8f4f8;
      color: #247090;
      font-weight: 600;
    }

    .profile-main {
      background: #fff;
      border-radius: 16px;
      padding: 2rem;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    }

    .tab-content h2 {
      font-size: 1.5rem;
      font-weight: 700;
      color: #000;
      margin-bottom: 1.5rem;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .form-group {
      margin-bottom: 1.25rem;
    }

    .form-group.full-width {
      grid-column: 1 / -1;
    }

    .form-group label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
      font-weight: 500;
      color: #333;
    }

    .form-group label .material-icons {
      font-size: 18px;
      color: #666;
    }

    .form-group input,
    .form-group select,
    .form-group textarea {
      width: 100%;
      padding: 0.875rem 1rem;
      border: 2px solid #e0e0e0;
      border-radius: 10px;
      font-size: 1rem;
      transition: all 0.3s ease;
    }

    .form-group input:focus,
    .form-group select:focus,
    .form-group textarea:focus {
      outline: none;
      border-color: #247090;
    }

    .form-group input[readonly] {
      background: #f8f9fa;
      color: #666;
    }

    .section-title {
      font-size: 1.1rem;
      font-weight: 600;
      color: #333;
      margin: 2rem 0 1rem;
      padding-top: 1.5rem;
      border-top: 1px solid #e0e0e0;
    }

    .cv-upload-wrapper {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 1rem;
    }

    .cv-preview {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      background: #f8f9fa;
      border-radius: 8px;
    }

    .cv-preview .material-icons {
      color: #247090;
    }

    .view-cv-btn,
    .remove-cv-btn {
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.875rem;
      cursor: pointer;
      text-decoration: none;
    }

    .view-cv-btn {
      background: #247090;
      color: white;
      border: none;
    }

    .remove-cv-btn {
      background: transparent;
      color: #dc3545;
      border: 1px solid #dc3545;
    }

    .upload-cv-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      background: #f8f9fa;
      border: 2px dashed #ccc;
      border-radius: 8px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }

    .upload-cv-btn:hover:not(:disabled) {
      border-color: #247090;
      background: #e8f4f8;
    }

    .help-text {
      font-size: 0.85rem;
      color: #666;
    }

    .form-actions {
      margin-top: 1.5rem;
    }

    .save-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.875rem 2rem;
      background: linear-gradient(135deg, #247090 0%, #1a5570 100%);
      color: #fff;
      border: none;
      border-radius: 10px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .save-btn:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(36, 112, 144, 0.3);
    }

    .save-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .spinner {
      width: 18px;
      height: 18px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .security-section {
      padding: 1.5rem 0;
      border-bottom: 1px solid #e0e0e0;
    }

    .security-section:last-child {
      border-bottom: none;
    }

    .security-section h3 {
      font-size: 1.1rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
    }

    .section-desc {
      color: #666;
      margin-bottom: 1rem;
      font-size: 0.9rem;
    }

    .enable-2fa-btn {
      padding: 0.75rem 1.5rem;
      background: #000;
      color: #fff;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
    }

    .danger-zone {
      background: #fff5f5;
      margin: 1.5rem -2rem -2rem;
      padding: 1.5rem 2rem !important;
      border-radius: 0 0 16px 16px;
    }

    .danger-zone h3 {
      color: #dc3545;
    }

    .delete-btn {
      padding: 0.75rem 1.5rem;
      background: #dc3545;
      color: #fff;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
    }

    .notification-settings,
    .preference-settings {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .setting-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;
      background: #f8f9fa;
      border-radius: 10px;
    }

    .setting-info h4 {
      font-size: 1rem;
      font-weight: 600;
      margin-bottom: 0.25rem;
    }

    .setting-info p {
      font-size: 0.85rem;
      color: #666;
    }

    .toggle {
      position: relative;
      display: inline-block;
      width: 50px;
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
      transition: 0.4s;
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
      transition: 0.4s;
      border-radius: 50%;
    }

    input:checked + .slider {
      background-color: #247090;
    }

    input:checked + .slider:before {
      transform: translateX(22px);
    }

    .setting-item select {
      padding: 0.5rem 1rem;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      font-size: 0.95rem;
      background: #fff;
    }

    @media (max-width: 992px) {
      .profile-content {
        grid-template-columns: 1fr;
      }

      .profile-sidebar {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .profile-avatar {
        border-bottom: none;
        padding-bottom: 0;
        margin-bottom: 0;
      }

      .profile-nav {
        flex-direction: row;
        flex-wrap: wrap;
        justify-content: center;
      }
    }

    @media (max-width: 576px) {
      .profile-page {
        padding: 1rem;
      }

      .form-row {
        grid-template-columns: 1fr;
      }

      .profile-main {
        padding: 1.5rem;
      }
    }
  `]
})
export class ProfileComponent implements OnInit {
  authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private toastr = inject(ToastrService);
  private fileUploadService = inject(FileUploadService);
  private mediaService = inject(MediaService);

  activeTab = signal<'personal' | 'security' | 'notifications' | 'preferences'>('personal');
  savingPersonal = signal(false);
  savingPassword = signal(false);
  uploadingCv = signal(false);
  profileImageUrl = signal<string | null>(null);
  cvUrl = signal<string | null>(null);

  // Notification settings
  emailNotifications = true;
  courseUpdates = true;
  promotional = false;

  // Preferences
  selectedLanguage = 'en';
  selectedTheme = 'light';
  videoQuality = 'auto';

  personalForm: FormGroup = this.fb.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: [''],
    phone: [''],
    bio: [''],
    country: [''],
    city: [''],
    linkedInUrl: [''],
    gitHubUrl: [''],
    portfolioUrl: [''],
    websiteUrl: ['']
  });

  passwordForm: FormGroup = this.fb.group({
    currentPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required]
  });

  ngOnInit() {
    this.loadUserData();
  }

  loadUserData() {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.personalForm.patchValue({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        bio: user.bio || '',
        country: user.country || '',
        city: user.city || '',
        linkedInUrl: user.linkedInUrl || '',
        gitHubUrl: user.gitHubUrl || '',
        portfolioUrl: user.portfolioUrl || '',
        websiteUrl: user.websiteUrl || ''
      });
      // Use MediaService to resolve the profile image URL
      this.profileImageUrl.set(this.mediaService.getAvatarUrl(user.profileImageUrl) || null);
      this.cvUrl.set(user.cvUrl ? this.mediaService.getMediaUrl(user.cvUrl) : null);
    }
    this.selectedLanguage = 'en';
  }

  onAvatarSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.toastr.error('Photo must be less than 5MB');
        return;
      }

      // Upload file using the images endpoint
      this.fileUploadService.uploadImage(file).subscribe({
        next: (progress) => {
          if (progress.status === 'complete' && progress.response?.data?.url) {
            const uploadedUrl = progress.response.data.url;
            // Use MediaService to resolve the uploaded URL for display
            this.profileImageUrl.set(this.mediaService.getAvatarUrl(uploadedUrl));
            // Auto-save the profile image (save the relative URL to backend)
            this.authService.updateProfile({
              profileImageUrl: uploadedUrl
            } as any).subscribe({
              next: (response: any) => {
                if (response?.isSuccess) {
                  this.toastr.success('Photo updated successfully');
                  // Update the user in localStorage with the new image
                  const currentUser = this.authService.getCurrentUser();
                  if (currentUser) {
                    currentUser.profileImageUrl = uploadedUrl;
                    localStorage.setItem('user', JSON.stringify(currentUser));
                  }
                }
              }
            });
          }
        },
        error: () => {
          this.toastr.error('Failed to upload photo');
        }
      });
    }
  }

  savePersonalInfo() {
    if (this.personalForm.invalid) return;

    this.savingPersonal.set(true);
    
    const formData = this.personalForm.value;
    this.authService.updateProfile({
      firstName: formData.firstName,
      lastName: formData.lastName,
      phone: formData.phone,
      bio: formData.bio,
      country: formData.country,
      city: formData.city,
      linkedInUrl: formData.linkedInUrl,
      gitHubUrl: formData.gitHubUrl,
      portfolioUrl: formData.portfolioUrl,
      websiteUrl: formData.websiteUrl,
      cvUrl: this.cvUrl() || undefined
    }).subscribe({
      next: (response) => {
        this.savingPersonal.set(false);
        if (response.isSuccess) {
          this.toastr.success('Profile saved successfully', 'Success');
        } else {
          this.toastr.error(response.message || 'Failed to save profile', 'Error');
        }
      },
      error: () => {
        this.savingPersonal.set(false);
        this.toastr.error('Failed to save profile', 'Error');
      }
    });
  }

  onCvSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.toastr.error('CV must be less than 5MB');
        return;
      }

      // Validate file type
      const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!validTypes.includes(file.type)) {
        this.toastr.error('Please upload a PDF, DOC or DOCX file');
        return;
      }

      this.uploadingCv.set(true);

      this.fileUploadService.uploadDocument(file).subscribe({
        next: (progress) => {
          if (progress.status === 'complete' && progress.response?.data?.url) {
            this.cvUrl.set(progress.response.data.url);
            this.uploadingCv.set(false);
            this.toastr.success('CV uploaded successfully');
          } else if (progress.status === 'error') {
            this.uploadingCv.set(false);
            this.toastr.error(progress.error || 'Failed to upload CV');
          }
        },
        error: () => {
          this.uploadingCv.set(false);
          this.toastr.error('Failed to upload CV');
        }
      });
    }
  }

  removeCv() {
    this.cvUrl.set(null);
    this.toastr.info('CV removed. Click Save Changes to update.');
  }

  changePassword() {
    if (this.passwordForm.invalid) return;

    const { currentPassword, newPassword, confirmPassword } = this.passwordForm.value;
    if (newPassword !== confirmPassword) {
      this.toastr.error('Passwords do not match', 'Error');
      return;
    }

    this.savingPassword.set(true);
    
    this.authService.changePassword(currentPassword, newPassword).subscribe({
      next: (response) => {
        this.savingPassword.set(false);
        if (response.isSuccess) {
          this.passwordForm.reset();
          this.toastr.success('Password updated successfully', 'Success');
        } else {
          this.toastr.error(response.messageEn || 'Failed to update password', 'Error');
        }
      },
      error: () => {
        this.savingPassword.set(false);
        this.toastr.error('Failed to update password', 'Error');
      }
    });
  }

  changeLanguage() {
    document.documentElement.lang = this.selectedLanguage;
    document.documentElement.dir = this.selectedLanguage === 'ar' ? 'rtl' : 'ltr';
  }
}
