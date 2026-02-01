import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '@environments/environment';

export interface SystemSetting {
  id: string;
  key: string;
  value: string;
  valueAr?: string;
  category: string;
  description?: string;
  isPublic: boolean;
}

export interface Category {
  id: string;
  nameEn: string;
  nameAr: string;
  descriptionEn?: string;
  descriptionAr?: string;
  iconName?: string;
  color?: string;
  sortOrder: number;
  isActive: boolean;
  courseCount?: number;
}

export interface Testimonial {
  id: string;
  authorName: string;
  authorNameAr: string;
  authorTitle?: string;
  authorTitleAr?: string;
  authorImageUrl?: string;
  contentEn: string;
  contentAr: string;
  rating: number;
  isActive: boolean;
  sortOrder: number;
}

export interface Badge {
  id: string;
  nameEn: string;
  nameAr: string;
  descriptionEn?: string;
  descriptionAr?: string;
  iconUrl: string;
  xpReward: number;
  type: number;
  earnedCount?: number;
}

@Injectable({
  providedIn: 'root'
})
export class AdminSettingsService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/admin-settings`;
  private publicUrl = `${environment.apiUrl}/public`;

  // ==================== System Settings ====================
  
  getAllSettings(): Observable<SystemSetting[]> {
    return this.http.get<{ isSuccess: boolean; data: SystemSetting[] }>(`${this.baseUrl}/settings`)
      .pipe(map(res => res.data));
  }

  /**
   * Get public settings (no auth required - for instructors and public pages)
   */
  getPublicSettings(): Observable<Record<string, { value: string; valueAr?: string }>> {
    return this.http.get<{ isSuccess: boolean; data: Record<string, { value: string; valueAr?: string }> }>(`${this.publicUrl}/settings`)
      .pipe(map(res => res.data));
  }

  getSettingsByCategory(category: string): Observable<SystemSetting[]> {
    return this.http.get<{ isSuccess: boolean; data: SystemSetting[] }>(`${this.baseUrl}/settings/category/${category}`)
      .pipe(map(res => res.data));
  }

  updateSetting(key: string, setting: Partial<SystemSetting>): Observable<SystemSetting> {
    return this.http.put<{ isSuccess: boolean; data: SystemSetting }>(`${this.baseUrl}/settings/${key}`, setting)
      .pipe(map(res => res.data));
  }

  bulkUpdateSettings(settings: Partial<SystemSetting>[]): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/settings/bulk`, settings);
  }

  // ==================== Categories ====================

  /**
   * Get categories from admin endpoint (requires Admin role)
   */
  getCategories(): Observable<Category[]> {
    return this.http.get<{ isSuccess: boolean; data: Category[] }>(`${this.baseUrl}/categories`)
      .pipe(map(res => res.data));
  }

  /**
   * Get categories from public endpoint (no auth required - for instructors)
   */
  getPublicCategories(): Observable<Category[]> {
    return this.http.get<{ isSuccess: boolean; data: Category[] }>(`${environment.apiUrl}/public/categories`)
      .pipe(map(res => res.data));
  }

  createCategory(category: Partial<Category>): Observable<Category> {
    return this.http.post<{ isSuccess: boolean; data: Category }>(`${this.baseUrl}/categories`, category)
      .pipe(map(res => res.data));
  }

  updateCategory(id: string, category: Partial<Category>): Observable<Category> {
    return this.http.put<{ isSuccess: boolean; data: Category }>(`${this.baseUrl}/categories/${id}`, category)
      .pipe(map(res => res.data));
  }

  deleteCategory(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/categories/${id}`);
  }

  // ==================== Testimonials ====================

  getTestimonials(): Observable<Testimonial[]> {
    return this.http.get<{ isSuccess: boolean; data: Testimonial[] }>(`${this.baseUrl}/testimonials`)
      .pipe(map(res => res.data));
  }

  createTestimonial(testimonial: Partial<Testimonial>): Observable<Testimonial> {
    return this.http.post<{ isSuccess: boolean; data: Testimonial }>(`${this.baseUrl}/testimonials`, testimonial)
      .pipe(map(res => res.data));
  }

  updateTestimonial(id: string, testimonial: Partial<Testimonial>): Observable<Testimonial> {
    return this.http.put<{ isSuccess: boolean; data: Testimonial }>(`${this.baseUrl}/testimonials/${id}`, testimonial)
      .pipe(map(res => res.data));
  }

  deleteTestimonial(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/testimonials/${id}`);
  }

  // ==================== Badges ====================

  getBadges(): Observable<Badge[]> {
    return this.http.get<{ isSuccess: boolean; data: Badge[] }>(`${this.baseUrl}/badges`)
      .pipe(map(res => res.data));
  }

  createBadge(badge: Partial<Badge>): Observable<Badge> {
    return this.http.post<{ isSuccess: boolean; data: Badge }>(`${this.baseUrl}/badges`, badge)
      .pipe(map(res => res.data));
  }

  updateBadge(id: string, badge: Partial<Badge>): Observable<Badge> {
    return this.http.put<{ isSuccess: boolean; data: Badge }>(`${this.baseUrl}/badges/${id}`, badge)
      .pipe(map(res => res.data));
  }
}
