import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import { ApiResponse, PaginatedList, Enrollment } from './course.service';

export interface EnrollmentRequest {
  courseId: string;
  paymentScreenshotUrl?: string;
}

export interface SessionProgress {
  sessionId: string;
  isUnlocked: boolean;
  isCompleted: boolean;
  watchPercentage: number;
  resourcesAccessed: boolean;
  quizPassed: boolean;
  completedAt?: string;
}

export interface CourseProgress {
  courseId: string;
  overallProgress: number;
  completedSessions: number;
  totalSessions: number;
  sessionProgresses: SessionProgress[];
}

@Injectable({
  providedIn: 'root'
})
export class EnrollmentService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/enrollments`;

  enroll(request: EnrollmentRequest): Observable<ApiResponse<Enrollment>> {
    return this.http.post<ApiResponse<Enrollment>>(this.API_URL, request);
  }

  getMyEnrollments(page = 1, pageSize = 10, status?: string): Observable<ApiResponse<PaginatedList<Enrollment>>> {
    let params = new HttpParams()
      .set('pageNumber', page.toString())
      .set('pageSize', pageSize.toString());

    if (status) params = params.set('status', status);

    return this.http.get<ApiResponse<PaginatedList<Enrollment>>>(`${this.API_URL}/my-enrollments`, { params });
  }

  getEnrollmentByCourse(courseId: string): Observable<ApiResponse<Enrollment>> {
    return this.http.get<ApiResponse<Enrollment>>(`${this.API_URL}/course/${courseId}`);
  }

  checkEnrollmentStatus(courseId: string): Observable<{ isEnrolled: boolean }> {
    return this.http.get<{ isEnrolled: boolean }>(`${this.API_URL}/check/${courseId}`);
  }

  getCourseProgress(courseId: string): Observable<ApiResponse<CourseProgress>> {
    return this.http.get<ApiResponse<CourseProgress>>(`${this.API_URL}/${courseId}/progress`);
  }

  getSessionProgress(sessionId: string): Observable<ApiResponse<SessionProgress>> {
    return this.http.get<ApiResponse<SessionProgress>>(`${this.API_URL}/sessions/${sessionId}/progress`);
  }

  updateWatchProgress(sessionId: string, percentage: number): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.API_URL}/sessions/${sessionId}/watch-progress`, { percentage });
  }

  markResourcesAccessed(sessionId: string): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.API_URL}/sessions/${sessionId}/mark-resources-accessed`, {});
  }

  getNextSession(courseId: string): Observable<ApiResponse<{ sessionId: string; sessionName: string; moduleId: string }>> {
    return this.http.get<ApiResponse<any>>(`${this.API_URL}/${courseId}/next-session`);
  }

  // Admin methods
  getAllEnrollments(page = 1, pageSize = 20, status?: string, courseId?: string): Observable<ApiResponse<PaginatedList<Enrollment>>> {
    let params = new HttpParams()
      .set('pageNumber', page.toString())
      .set('pageSize', pageSize.toString());

    if (status) params = params.set('status', status);
    if (courseId) params = params.set('courseId', courseId);

    return this.http.get<ApiResponse<PaginatedList<Enrollment>>>(this.API_URL, { params });
  }

  getPendingEnrollments(page = 1, pageSize = 20): Observable<ApiResponse<PaginatedList<Enrollment>>> {
    const params = new HttpParams()
      .set('pageNumber', page.toString())
      .set('pageSize', pageSize.toString());

    return this.http.get<ApiResponse<PaginatedList<Enrollment>>>(`${this.API_URL}/pending`, { params });
  }

  approveEnrollment(enrollmentId: string, paidAmount: number): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.API_URL}/${enrollmentId}/approve`, { amountPaid: paidAmount });
  }

  rejectEnrollment(enrollmentId: string, reason?: string): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.API_URL}/${enrollmentId}/reject`, { reason });
  }

  checkEnrollment(courseId: number | string): Observable<Enrollment | null> {
    return this.http.get<Enrollment | null>(`${this.API_URL}/check/${courseId}`);
  }

  enrollFree(courseId: number | string): Observable<ApiResponse<Enrollment>> {
    return this.http.post<ApiResponse<Enrollment>>(`${this.API_URL}/free`, { courseId: courseId.toString() });
  }
}
