import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '@environments/environment';

export interface ApiResponse<T> {
  isSuccess: boolean;
  data: T;
  messageEn?: string;
  messageAr?: string;
}

export interface SystemSettings {
  [key: string]: { Value: string; ValueAr: string };
}

export interface Category {
  id: string;
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  iconName: string;
  color: string;
  courseCount: number;
}

export interface FeaturedCourse {
  id: string;
  slug: string;
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  thumbnailUrl: string;
  price: number;
  level: string;
  levelAr: string;
  categoryName: string;
  categoryNameAr: string;
  instructorName: string;
  instructorNameAr: string;
  instructorAvatarUrl: string;
  totalDurationMinutes: number;
  enrollmentCount: number;
  isFeatured: boolean;
}

export interface Testimonial {
  id: string;
  authorName: string;
  authorNameAr: string;
  authorTitle: string;
  authorTitleAr: string;
  authorImageUrl: string;
  content: string;
  contentAr: string;
  rating: number;
}

export interface PlatformStats {
  students: string;
  courses: string;
  instructors: string;
  rating: string;
}

export interface Internship {
  id: string;
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  companyName: string;
  companyLogoUrl: string;
  location: string;
  locationAr: string;
  isRemote: boolean;
  isPaid: boolean;
  salary: number;
  currency: string;
  durationWeeks: number;
  startDate: string;
  applicationDeadline: string;
  applicationCount: number;
}

export interface Instructor {
  id: string;
  name: string;
  nameAr: string;
  profileImageUrl: string;
  bio: string;
  bioAr: string;
  specialty: string;
  specialtyAr: string;
  courseCount: number;
  studentCount: number;
  rating: number;
}

export interface FAQ {
  id: string;
  questionEn: string;
  questionAr: string;
  answerEn: string;
  answerAr: string;
  category?: string;
  sortOrder?: number;
}

export interface ContactSubmission {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class LandingService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/public`;

  getSettings(): Observable<SystemSettings> {
    return this.http.get<ApiResponse<SystemSettings>>(`${this.API_URL}/settings`)
      .pipe(map(res => res.data));
  }

  getCategories(): Observable<Category[]> {
    return this.http.get<ApiResponse<Category[]>>(`${this.API_URL}/categories`)
      .pipe(map(res => res.data));
  }

  getFeaturedCourses(limit: number = 6): Observable<FeaturedCourse[]> {
    return this.http.get<ApiResponse<FeaturedCourse[]>>(`${this.API_URL}/featured-courses?limit=${limit}`)
      .pipe(map(res => res.data));
  }

  getTestimonials(limit: number = 6): Observable<Testimonial[]> {
    return this.http.get<ApiResponse<Testimonial[]>>(`${this.API_URL}/testimonials?limit=${limit}`)
      .pipe(map(res => res.data));
  }

  getStats(): Observable<PlatformStats> {
    return this.http.get<ApiResponse<PlatformStats>>(`${this.API_URL}/stats`)
      .pipe(map(res => res.data));
  }

  getInternships(limit: number = 4): Observable<Internship[]> {
    return this.http.get<ApiResponse<Internship[]>>(`${this.API_URL}/internships?limit=${limit}`)
      .pipe(map(res => res.data));
  }

  getInstructors(limit: number = 6): Observable<Instructor[]> {
    return this.http.get<ApiResponse<Instructor[]>>(`${this.API_URL}/instructors?limit=${limit}`)
      .pipe(map(res => res.data));
  }

  getFaqs(category?: string): Observable<FAQ[]> {
    let url = `${this.API_URL}/faqs`;
    if (category) {
      url += `?category=${encodeURIComponent(category)}`;
    }
    return this.http.get<ApiResponse<FAQ[]>>(url)
      .pipe(map(res => res.data || []));
  }

  submitContact(data: ContactSubmission): Observable<{ isSuccess: boolean; message: string }> {
    return this.http.post<{ isSuccess: boolean; message: string }>(`${this.API_URL}/contact`, data);
  }
}
