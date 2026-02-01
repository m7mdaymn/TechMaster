import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';

export interface ApiResponse<T> {
  isSuccess: boolean;
  data?: T;
  messageEn?: string;
  messageAr?: string;
}

export interface PaginatedList<T> {
  items: T[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface Course {
  id: string;
  nameEn: string;
  nameAr: string;
  slug: string;
  descriptionEn?: string;
  descriptionAr?: string;
  thumbnailUrl?: string;
  previewVideoUrl?: string;
  trailerVideoUrl?: string;
  price: number;
  discountPrice?: number;
  durationHours: number;
  durationInHours?: number;
  level: string;
  status: string;
  type: string;
  isFeatured: boolean;
  averageRating: number;
  reviewCount: number;
  enrollmentCount: number;
  whatYouWillLearnEn?: string;
  whatYouWillLearnAr?: string;
  requirementsEn?: string;
  requirementsAr?: string;
  targetAudienceEn?: string;
  targetAudienceAr?: string;
  requireSequentialProgress?: boolean;
  requireFinalAssessment?: boolean;
  finalAssessmentPassingScore?: number;
  instructor?: {
    id: string;
    fullName: string;
    photoUrl?: string;
    profileImageUrl?: string;
    bio?: string;
  };
  category?: {
    id: string;
    nameEn: string;
    nameAr: string;
  };
  modules?: Module[];
}

export interface Module {
  id: string;
  nameEn: string;
  nameAr: string;
  descriptionEn?: string;
  order: number;
  sortOrder?: number;
  sessions: Session[];
}

export interface Session {
  id: string;
  nameEn: string;
  nameAr: string;
  order: number;
  sortOrder?: number;
  type: string;
  durationMinutes: number;
  isFree: boolean;
  isFreePreview?: boolean;
  videoUrl?: string;
  content?: string;
  isUnlocked?: boolean;
  isCompleted?: boolean;
}

export interface Enrollment {
  id: string;
  courseId: string;
  courseName: string;
  courseThumbnail?: string;
  status: string;
  progress: number;
  enrollmentDate: string;
  completedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CourseService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/courses`;

  getCourses(page = 1, pageSize = 12, categoryId?: string, search?: string, type?: string): Observable<ApiResponse<PaginatedList<Course>>> {
    let params = new HttpParams()
      .set('pageNumber', page.toString())
      .set('pageSize', pageSize.toString());

    if (categoryId) params = params.set('categoryId', categoryId);
    if (search) params = params.set('search', search);
    if (type) params = params.set('type', type);

    return this.http.get<ApiResponse<PaginatedList<Course>>>(this.API_URL, { params });
  }

  getFeaturedCourses(count = 6): Observable<ApiResponse<Course[]>> {
    return this.http.get<ApiResponse<Course[]>>(`${this.API_URL}/featured`, {
      params: { count: count.toString() }
    });
  }

  getCourseBySlug(slug: string): Observable<ApiResponse<Course>> {
    return this.http.get<ApiResponse<Course>>(`${this.API_URL}/slug/${slug}`);
  }

  getCourseById(id: string): Observable<ApiResponse<Course>> {
    return this.http.get<ApiResponse<Course>>(`${this.API_URL}/${id}`);
  }

  getCourseWithContent(id: string): Observable<ApiResponse<Course>> {
    return this.http.get<ApiResponse<Course>>(`${this.API_URL}/${id}/full`);
  }

  getCategories(): Observable<ApiResponse<{ id: string; nameEn: string; nameAr: string; slug: string; iconUrl?: string; courseCount: number }[]>> {
    return this.http.get<ApiResponse<any>>(`${this.API_URL}/categories`);
  }

  // Instructor methods
  createCourse(course: Partial<Course>): Observable<ApiResponse<Course>> {
    return this.http.post<ApiResponse<Course>>(this.API_URL, course);
  }

  updateCourse(id: string, course: Partial<Course>): Observable<ApiResponse<Course>> {
    return this.http.put<ApiResponse<Course>>(`${this.API_URL}/${id}`, course);
  }

  deleteCourse(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.API_URL}/${id}`);
  }

  publishCourse(id: string): Observable<ApiResponse<Course>> {
    return this.http.post<ApiResponse<Course>>(`${this.API_URL}/${id}/publish`, {});
  }

  archiveCourse(id: string): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.API_URL}/${id}/archive`, {});
  }

  unpublishCourse(id: string): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.API_URL}/${id}/unpublish`, {});
  }

  rejectCourse(id: string, reason?: string): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.API_URL}/${id}/reject`, { reason });
  }

  // Module and Session management
  addModule(courseId: string, module: { nameEn: string; nameAr: string; descriptionEn?: string; descriptionAr?: string; order: number }): Observable<ApiResponse<Module>> {
    return this.http.post<ApiResponse<Module>>(`${this.API_URL}/${courseId}/modules`, module);
  }

  addSession(moduleId: string, session: Partial<Session>): Observable<ApiResponse<Session>> {
    return this.http.post<ApiResponse<Session>>(`${this.API_URL}/modules/${moduleId}/sessions`, session);
  }

  // Rating methods
  submitCourseRating(courseId: string, data: { rating: number; comment?: string }): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.API_URL}/${courseId}/ratings`, data);
  }

  getCourseRatings(courseId: string, page = 1, pageSize = 10): Observable<ApiResponse<PaginatedList<{ id: string; rating: number; comment?: string; userId: string; userName: string; createdAt: string }>>> {
    return this.http.get<ApiResponse<PaginatedList<any>>>(`${this.API_URL}/${courseId}/ratings`, {
      params: { pageNumber: page.toString(), pageSize: pageSize.toString() }
    });
  }

  getMyRating(courseId: string): Observable<ApiResponse<{ id: string; rating: number; comment?: string } | null>> {
    return this.http.get<ApiResponse<any>>(`${this.API_URL}/${courseId}/ratings/my`);
  }
}
