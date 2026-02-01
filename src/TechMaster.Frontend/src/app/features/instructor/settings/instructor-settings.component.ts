import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '@core/services/auth.service';
import { FileUploadService } from '@core/services/file-upload.service';
import { MediaService } from '@core/services/media.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '@environments/environment';

interface InstructorProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  bio?: string;
  expertise?: string;
  linkedInUrl?: string;
  twitterUrl?: string;
  websiteUrl?: string;
  profilePhotoUrl?: string;
  timezone?: string;
  language?: string;
  notificationsEnabled: boolean;
  emailNotifications: boolean;
}

@Component({
  selector: 'app-instructor-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="settings-page">
      <div class="page-header">
        <h1>Settings</h1>
        <p class="subtitle">Manage your profile and preferences</p>
      </div>

      @if (loading()) {
        <div class="loading-container">
          <div class="spinner-lg"></div>
          <p>Loading profile...</p>
        </div>
      } @else {
      <div class="settings-container">
        <!-- Profile Section -->
        <section class="settings-section">
          <h2>Profile Information</h2>
          
          <div class="profile-photo-section">
            <div class="photo-preview" [class.uploading]="uploadingPhoto()">
              @if (uploadingPhoto()) {
                <div class="upload-spinner"></div>
              } @else if (profile().profilePhotoUrl) {
                <img [src]="mediaService.getAvatarUrl(profile().profilePhotoUrl)" alt="Profile photo">
              } @else {
                <span class="initials"></span>
              }
            </div>
            <div class="photo-actions">
              <input type="file" #fileInput (change)="onPhotoSelected($event)" accept="image/*" style="display: none">
              <button class="upload-btn" (click)="fileInput.click()" [disabled]="uploadingPhoto()">
                <span class="material-icons">upload</span>
                {{ uploadingPhoto() ? 'Uploading...' : 'Upload Photo' }}
              </button>
              @if (profile().profilePhotoUrl) {
                <button class="remove-btn" (click)="removePhoto()" [disabled]="uploadingPhoto()">Remove</button>
              }
            </div>
          </div>

          <div class="form-grid">
            <div class="form-group">
              <label>First Name *</label>
              <input type="text" [(ngModel)]="profile().firstName" placeholder="Enter first name">
            </div>
            <div class="form-group">
              <label>Last Name *</label>
              <input type="text" [(ngModel)]="profile().lastName" placeholder="Enter last name">
            </div>
            <div class="form-group">
              <label>Email *</label>
              <input type="email" [(ngModel)]="profile().email" placeholder="Enter email" disabled>
            </div>
            <div class="form-group">
              <label>Phone Number</label>
              <input type="tel" [(ngModel)]="profile().phoneNumber" placeholder="Enter phone number">
            </div>
            <div class="form-group full-width">
              <label>Bio</label>
              <textarea [(ngModel)]="profile().bio" placeholder="Tell students about yourself..." rows="4"></textarea>
            </div>
            <div class="form-group full-width">
              <label>Expertise / Specialization</label>
              <input type="text" [(ngModel)]="profile().expertise" placeholder="e.g., Web Development, Data Science">
            </div>
          </div>
        </section>

        <!-- Social Links Section -->
        <section class="settings-section">
          <h2>Social Links</h2>
          <div class="form-grid">
            <div class="form-group">
              <label>
                <span class="material-icons">link</span> LinkedIn
              </label>
              <input type="url" [(ngModel)]="profile().linkedInUrl" placeholder="https://linkedin.com/in/username">
            </div>
            <div class="form-group">
              <label>
                <span class="material-icons">alternate_email</span> Twitter/X
              </label>
              <input type="url" [(ngModel)]="profile().twitterUrl" placeholder="https://twitter.com/username">
            </div>
            <div class="form-group full-width">
              <label>
                <span class="material-icons">language</span> Website
              </label>
              <input type="url" [(ngModel)]="profile().websiteUrl" placeholder="https://yourwebsite.com">
            </div>
          </div>
        </section>

        <!-- Preferences Section -->
        <section class="settings-section">
          <h2>Preferences</h2>
          <div class="form-grid">
            <div class="form-group">
              <label>Timezone</label>
              <select [(ngModel)]="profile().timezone">
                <option value="UTC">UTC</option>
                <option value="America/New_York">Eastern Time (US)</option>
                <option value="America/Los_Angeles">Pacific Time (US)</option>
                <option value="Europe/London">London</option>
                <option value="Europe/Paris">Paris</option>
                <option value="Asia/Dubai">Dubai</option>
                <option value="Asia/Riyadh">Riyadh</option>
                <option value="Asia/Tokyo">Tokyo</option>
              </select>
            </div>
            <div class="form-group">
              <label>Language</label>
              <select [(ngModel)]="profile().language">
                <option value="en">English</option>
                <option value="ar">العربية</option>
              </select>
            </div>
          </div>

          <div class="toggle-options">
            <div class="toggle-option">
              <div class="toggle-info">
                <span class="toggle-label">Push Notifications</span>
                <span class="toggle-description">Receive in-app notifications</span>
              </div>
              <label class="toggle">
                <input type="checkbox" [(ngModel)]="profile().notificationsEnabled">
                <span class="slider"></span>
              </label>
            </div>
            <div class="toggle-option">
              <div class="toggle-info">
                <span class="toggle-label">Email Notifications</span>
                <span class="toggle-description">Receive notifications via email</span>
              </div>
              <label class="toggle">
                <input type="checkbox" [(ngModel)]="profile().emailNotifications">
                <span class="slider"></span>
              </label>
            </div>
          </div>
        </section>

        <!-- Save Button -->
        <div class="actions-bar">
          <button class="save-btn" (click)="saveSettings()" [disabled]="saving()">
            @if (saving()) {
              <span class="spinner"></span>
              Saving...
            } @else {
              <span class="material-icons">save</span>
              Save Changes
            }
          </button>
        </div>
      </div>
      }
    </div>
  `,
  styles: [`
    .settings-page {
      max-width: 900px;
      margin: 0 auto;
    }

    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem;
      gap: 1rem;
    }

    .spinner-lg {
      width: 48px;
      height: 48px;
      border: 4px solid #e2e8f0;
      border-top-color: #3b82f6;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    .page-header {
      margin-bottom: 2rem;
    }

    .page-header h1 {
      font-size: 1.75rem;
      font-weight: 700;
      color: #1e293b;
      margin-bottom: 0.5rem;
    }

    .subtitle {
      color: #64748b;
    }

    .settings-container {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .settings-section {
      background: white;
      border-radius: 16px;
      padding: 24px;
    }

    .settings-section h2 {
      font-size: 1.25rem;
      font-weight: 600;
      color: #1e293b;
      margin-bottom: 20px;
      padding-bottom: 12px;
      border-bottom: 1px solid #e2e8f0;
    }

    .profile-photo-section {
      display: flex;
      align-items: center;
      gap: 24px;
      margin-bottom: 24px;
    }

    .photo-preview {
      width: 100px;
      height: 100px;
      border-radius: 50%;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }

    .photo-preview img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .photo-preview .initials {
      color: white;
      font-size: 2rem;
      font-weight: 600;
    }

    .photo-actions {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .upload-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 16px;
      background: #3b82f6;
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 500;
    }

    .upload-btn:hover:not(:disabled) {
      background: #2563eb;
    }

    .upload-btn:disabled {
      background: #94a3b8;
      cursor: not-allowed;
    }

    .upload-spinner {
      width: 16px;
      height: 16px;
      border: 2px solid #ffffff40;
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .remove-btn {
      padding: 8px 16px;
      background: none;
      color: #ef4444;
      border: 1px solid #ef4444;
      border-radius: 8px;
      cursor: pointer;
    }

    .remove-btn:hover {
      background: #fef2f2;
    }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .form-group.full-width {
      grid-column: span 2;
    }

    .form-group label {
      font-weight: 500;
      color: #374151;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .form-group label .material-icons {
      font-size: 18px;
      color: #64748b;
    }

    .form-group input,
    .form-group select,
    .form-group textarea {
      padding: 12px 16px;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      font-size: 1rem;
      transition: all 0.2s;
    }

    .form-group input:focus,
    .form-group select:focus,
    .form-group textarea:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .form-group input:disabled {
      background: #f1f5f9;
      color: #64748b;
    }

    .toggle-options {
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin-top: 20px;
    }

    .toggle-option {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px;
      background: #f8fafc;
      border-radius: 12px;
    }

    .toggle-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .toggle-label {
      font-weight: 500;
      color: #1e293b;
    }

    .toggle-description {
      font-size: 0.875rem;
      color: #64748b;
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
      background-color: #cbd5e1;
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
      background-color: #10b981;
    }

    input:checked + .slider:before {
      transform: translateX(24px);
    }

    .actions-bar {
      display: flex;
      justify-content: flex-end;
      padding: 20px 0;
    }

    .save-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 24px;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
      border: none;
      border-radius: 10px;
      font-weight: 600;
      font-size: 1rem;
      cursor: pointer;
      transition: all 0.2s;
    }

    .save-btn:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
    }

    .save-btn:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }

    .spinner {
      width: 18px;
      height: 18px;
      border: 2px solid transparent;
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    @media (max-width: 768px) {
      .form-grid {
        grid-template-columns: 1fr;
      }

      .form-group.full-width {
        grid-column: span 1;
      }

      .profile-photo-section {
        flex-direction: column;
        text-align: center;
      }
    }
  `]
})
export class InstructorSettingsComponent implements OnInit {
  private authService = inject(AuthService);
  private fileUploadService = inject(FileUploadService);
  private toastr = inject(ToastrService);
  private http = inject(HttpClient);
  mediaService = inject(MediaService);
  private apiUrl = environment.apiUrl;

  profile = signal<InstructorProfile>({
    id: '',
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    bio: '',
    expertise: '',
    linkedInUrl: '',
    twitterUrl: '',
    websiteUrl: '',
    profilePhotoUrl: '',
    timezone: 'UTC',
    language: 'en',
    notificationsEnabled: true,
    emailNotifications: true
  });

  saving = signal(false);
  loading = signal(true);
  uploadingPhoto = signal(false);

  ngOnInit() {
    this.loadProfileFromApi();
  }

  loadProfileFromApi() {
    this.loading.set(true);
    // Load fresh profile from API
    this.http.get<any>(`${this.apiUrl}/auth/me`).subscribe({
      next: (response) => {
        if (response.isSuccess && response.data) {
          const user = response.data;
          
          // Update local storage and auth service with fresh data
          const currentUser = this.authService.getCurrentUser();
          if (currentUser) {
            const updatedUser = { ...currentUser, ...user };
            localStorage.setItem('techmaster_user', JSON.stringify(updatedUser));
          }
          
          this.profile.set({
            id: user.id || '',
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            email: user.email || '',
            phoneNumber: user.phoneNumber || user.phone || '',
            bio: user.bio || '',
            expertise: user.expertise || '',
            linkedInUrl: user.linkedInUrl || '',
            twitterUrl: user.twitterUrl || '',
            websiteUrl: user.websiteUrl || '',
            profilePhotoUrl: user.profileImageUrl || user.profilePhotoUrl || '',
            timezone: user.timezone || 'UTC',
            language: user.preferredLanguage || user.language || 'en',
            notificationsEnabled: user.notificationsEnabled !== false,
            emailNotifications: user.emailNotifications !== false
          });
        } else {
          // Fallback to local stored user
          this.loadProfile();
        }
        this.loading.set(false);
      },
      error: () => {
        this.loadProfile();
        this.loading.set(false);
      }
    });
  }

  loadProfile() {
    const user = this.authService.getCurrentUser();
    if (user) {
      this.profile.set({
        id: user.id || '',
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phoneNumber: user.phoneNumber || user.phone || '',
        bio: user.bio || '',
        expertise: user.expertise || '',
        linkedInUrl: user.linkedInUrl || '',
        twitterUrl: user.twitterUrl || '',
        websiteUrl: user.websiteUrl || '',
        profilePhotoUrl: user.profileImageUrl || '',
        timezone: user.timezone || 'UTC',
        language: user.language || user.preferredLanguage || 'en',
        notificationsEnabled: user.notificationsEnabled !== false,
        emailNotifications: user.emailNotifications !== false
      });
    }
  }

  getInitials(): string {
    const p = this.profile();
    return (p.firstName.charAt(0) + p.lastName.charAt(0)).toUpperCase() || 'U';
  }

  onPhotoSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.toastr.error('Photo must be less than 5MB');
        return;
      }

      this.uploadingPhoto.set(true);

      // Upload file using the images endpoint
      this.fileUploadService.uploadImage(file).subscribe({
        next: (progress) => {
          if (progress.status === 'complete' && progress.response?.data?.url) {
            const photoUrl = progress.response!.data!.url;
            this.profile.update(p => ({ ...p, profilePhotoUrl: photoUrl }));
            this.uploadingPhoto.set(false);
            
            // Auto-save the photo to the database
            this.savePhotoToDatabase(photoUrl);
          } else if (progress.status === 'error') {
            this.uploadingPhoto.set(false);
            this.toastr.error(progress.error || 'Failed to upload photo');
          }
        },
        error: () => {
          this.uploadingPhoto.set(false);
          this.toastr.error('Failed to upload photo');
        }
      });
    }
  }

  private savePhotoToDatabase(photoUrl: string) {
    // Immediately save the photo URL to the user profile
    this.http.put<any>(`${this.apiUrl}/auth/profile`, { 
      profileImageUrl: photoUrl 
    }).subscribe({
      next: (response) => {
        if (response?.isSuccess) {
          // Update localStorage with new photo URL
          const currentUser = this.authService.getCurrentUser();
          if (currentUser) {
            currentUser.profileImageUrl = photoUrl;
            localStorage.setItem('techmaster_user', JSON.stringify(currentUser));
          }
          this.toastr.success('Photo saved successfully');
        } else {
          this.toastr.warning('Photo uploaded but failed to save. Please click Save Settings.');
        }
      },
      error: () => {
        this.toastr.warning('Photo uploaded but failed to save. Please click Save Settings.');
      }
    });
  }

  removePhoto() {
    this.profile.update(p => ({ ...p, profilePhotoUrl: '' }));
    // Also remove from database
    this.savePhotoToDatabase('');
  }

  saveSettings() {
    const p = this.profile();
    
    if (!p.firstName.trim() || !p.lastName.trim()) {
      this.toastr.error('First name and last name are required');
      return;
    }

    this.saving.set(true);

    const profileData = {
      firstName: p.firstName,
      lastName: p.lastName,
      phone: p.phoneNumber, // Backend expects 'phone' not 'phoneNumber'
      bio: p.bio,
      expertise: p.expertise,
      linkedInUrl: p.linkedInUrl,
      twitterUrl: p.twitterUrl,
      websiteUrl: p.websiteUrl,
      profileImageUrl: p.profilePhotoUrl, // Backend field name
      timezone: p.timezone,
      preferredLanguage: p.language,
      notificationsEnabled: p.notificationsEnabled,
      emailNotifications: p.emailNotifications
    };

    this.authService.updateProfile(profileData as any).subscribe({
      next: (response: any) => {
        this.saving.set(false);
        if (response?.isSuccess) {
          // Also update the local user storage with the correct field
          const currentUser = this.authService.getCurrentUser();
          if (currentUser) {
            currentUser.profileImageUrl = p.profilePhotoUrl;
            localStorage.setItem('techmaster_user', JSON.stringify(currentUser));
          }
          this.toastr.success('Settings saved successfully');
          // Reload profile to get latest data from server
          this.loadProfileFromApi();
        } else {
          this.toastr.error(response?.message || 'Failed to save settings');
        }
      },
      error: (err) => {
        this.saving.set(false);
        const msg = err?.error?.message || err?.error?.messageEn || 'Failed to save settings';
        this.toastr.error(msg);
      }
    });
  }
}
