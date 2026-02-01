import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';

export interface ProgressResponse {
  isSuccess: boolean;
  data?: any;
  messageEn?: string;
  messageAr?: string;
}

export interface SessionProgress {
  sessionId: string;
  percentage: number;
  isCompleted: boolean;
  completedAt?: string;
  lastAccessedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProgressService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/enrollments`;

  /**
   * Update the progress percentage for a specific session
   * @param sessionId The ID of the session
   * @param percentage The progress percentage (0-100)
   */
  updateProgress(sessionId: string, percentage: number): Observable<ProgressResponse> {
    return this.http.post<ProgressResponse>(`${this.API_URL}/sessions/${sessionId}/watch-progress`, {
      percentage: Math.min(100, Math.max(0, percentage))
    });
  }

  /**
   * Mark a session as completed
   * @param sessionId The ID of the session to complete
   */
  completeSession(sessionId: string): Observable<ProgressResponse> {
    return this.http.post<ProgressResponse>(`${this.API_URL}/sessions/${sessionId}/complete`, {});
  }

  /**
   * Get the current progress for a specific session
   * @param sessionId The ID of the session
   */
  getSessionProgress(sessionId: string): Observable<ProgressResponse> {
    return this.http.get<ProgressResponse>(`${this.API_URL}/sessions/${sessionId}/progress`);
  }

  /**
   * Get progress for all sessions in a course
   * @param courseId The ID of the course
   */
  getCourseProgress(courseId: string): Observable<ProgressResponse> {
    return this.http.get<ProgressResponse>(`${this.API_URL}/${courseId}/progress`);
  }

  /**
   * Get the next session to learn in a course
   * @param courseId The ID of the course
   */
  getNextSession(courseId: string): Observable<ProgressResponse> {
    return this.http.get<ProgressResponse>(`${this.API_URL}/${courseId}/next-session`);
  }

  /**
   * Mark session resources as accessed
   * @param sessionId The ID of the session
   */
  markResourcesAccessed(sessionId: string): Observable<ProgressResponse> {
    return this.http.post<ProgressResponse>(`${this.API_URL}/sessions/${sessionId}/mark-resources-accessed`, {});
  }
}
