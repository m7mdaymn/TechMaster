import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpEvent, HttpEventType, HttpProgressEvent, HttpRequest } from '@angular/common/http';
import { Observable, map, filter } from 'rxjs';
import { environment } from '@environments/environment';

export interface UploadResponse {
  isSuccess: boolean;
  data?: {
    url: string;
    fileName: string;
    size: number;
  };
  messageEn?: string;
}

export interface MultiUploadResponse {
  isSuccess: boolean;
  data?: {
    uploadedUrls: string[];
    errors: string[];
    totalUploaded: number;
    totalFailed: number;
  };
}

export interface UploadProgress {
  status: 'progress' | 'complete' | 'error';
  percentage?: number;
  response?: UploadResponse;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class FileUploadService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/fileupload`;

  /**
   * Upload an image file (thumbnails, profile photos, etc.)
   */
  uploadImage(file: File): Observable<UploadProgress> {
    return this.uploadFile(file, 'images');
  }

  /**
   * Upload a video file
   */
  uploadVideo(file: File): Observable<UploadProgress> {
    return this.uploadFile(file, 'videos');
  }

  /**
   * Upload a document file
   */
  uploadDocument(file: File): Observable<UploadProgress> {
    return this.uploadFile(file, 'documents');
  }

  /**
   * Upload course material
   */
  uploadMaterial(file: File): Observable<UploadProgress> {
    return this.uploadFile(file, 'materials');
  }

  /**
   * Upload multiple files
   */
  uploadMultiple(files: File[], type: 'images' | 'videos' | 'documents' = 'documents'): Observable<MultiUploadResponse> {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    return this.http.post<MultiUploadResponse>(`${this.API_URL}/multiple?type=${type}`, formData);
  }

  /**
   * Delete a file by URL
   */
  deleteFile(url: string): Observable<{ isSuccess: boolean; messageEn?: string }> {
    return this.http.delete<{ isSuccess: boolean; messageEn?: string }>(
      this.API_URL, 
      { params: { url } }
    );
  }

  /**
   * Generic upload with progress tracking
   */
  private uploadFile(file: File, endpoint: string): Observable<UploadProgress> {
    const formData = new FormData();
    formData.append('file', file);

    const request = new HttpRequest('POST', `${this.API_URL}/${endpoint}`, formData, {
      reportProgress: true
    });

    return this.http.request<UploadResponse>(request).pipe(
      filter(event => {
        return event.type === HttpEventType.UploadProgress || 
               event.type === HttpEventType.Response;
      }),
      map(event => {
        if (event.type === HttpEventType.UploadProgress) {
          const progressEvent = event as HttpProgressEvent;
          const percentage = progressEvent.total 
            ? Math.round(100 * progressEvent.loaded / progressEvent.total)
            : 0;
          return {
            status: 'progress' as const,
            percentage
          };
        } else {
          // Response
          const body = (event as any).body as UploadResponse;
          if (body?.isSuccess) {
            return {
              status: 'complete' as const,
              percentage: 100,
              response: body
            };
          } else {
            return {
              status: 'error' as const,
              error: body?.messageEn || 'Upload failed'
            };
          }
        }
      })
    );
  }

  /**
   * Validate file before upload
   */
  validateFile(file: File, type: 'image' | 'video' | 'document' | 'material'): { valid: boolean; error?: string } {
    const maxSizes = {
      image: 10 * 1024 * 1024,      // 10MB
      video: 500 * 1024 * 1024,     // 500MB
      document: 50 * 1024 * 1024,   // 50MB
      material: 100 * 1024 * 1024   // 100MB
    };

    const allowedTypes = {
      image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      video: ['video/mp4', 'video/webm', 'video/quicktime'],
      document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      material: ['application/pdf', 'application/zip', 'application/x-rar-compressed']
    };

    if (file.size > maxSizes[type]) {
      return { 
        valid: false, 
        error: `File size exceeds maximum of ${Math.round(maxSizes[type] / (1024 * 1024))}MB` 
      };
    }

    if (!allowedTypes[type].includes(file.type)) {
      return { 
        valid: false, 
        error: `Invalid file type. Allowed: ${allowedTypes[type].join(', ')}` 
      };
    }

    return { valid: true };
  }
}
