import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';
import { environment } from '@environments/environment';

// Matches backend CertificateDto
export interface Certificate {
  id: string;
  certificateNumber: string;
  qrCodeUrl?: string;
  pdfUrl?: string;
  issuedAt: string;
  isValid: boolean;
  userId: string;
  userName: string;
  courseId: string;
  courseName: string;
  courseNameAr?: string;
  finalScore?: number;
  completedAt?: string;
  // UI helper properties
  userEmail?: string;
  issueDate?: string;
  grade?: string;
  completionPercentage?: number;
}

export interface CertificateVerification {
  isValid: boolean;
  message?: string;
  messageAr?: string;
  certificate?: Certificate;
}

export interface PaginatedResult<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

// Helper to map backend response to frontend model
function mapCertificate(data: any): Certificate {
  return {
    ...data,
    issueDate: data.issuedAt,
    grade: data.finalScore ? `${data.finalScore}%` : undefined,
    completionPercentage: data.finalScore || 100
  };
}

@Injectable({
  providedIn: 'root'
})
export class CertificateService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/certificates`;

  // Get my certificates
  getMyCertificates(): Observable<Certificate[]> {
    return this.http.get<any>(`${this.API_URL}/my-certificates`).pipe(
      map(response => response.isSuccess ? (response.data || []).map(mapCertificate) : []),
      catchError(() => of([]))
    );
  }

  // Get certificate by ID
  getCertificate(id: string): Observable<Certificate | null> {
    return this.http.get<any>(`${this.API_URL}/${id}`).pipe(
      map(response => response.isSuccess ? mapCertificate(response.data) : null),
      catchError(() => of(null))
    );
  }

  // Verify certificate by certificate number
  verifyCertificate(certificateNumber: string): Observable<CertificateVerification> {
    return this.http.get<any>(`${this.API_URL}/verify/${certificateNumber}`).pipe(
      map(response => ({
        isValid: response.isSuccess && response.data?.isValid,
        certificate: response.data?.certificate ? mapCertificate(response.data.certificate) : undefined,
        message: response.data?.message || response.message || 'Certificate verification completed',
        messageAr: response.data?.messageAr || response.messageAr
      })),
      catchError(() => of({
        isValid: false,
        message: 'Failed to verify certificate',
        messageAr: 'فشل التحقق من الشهادة'
      }))
    );
  }

  // Generate certificate for completed course
  generateCertificate(courseId: string): Observable<Certificate | null> {
    return this.http.post<any>(`${this.API_URL}/generate/${courseId}`, {}).pipe(
      map(response => response.isSuccess ? mapCertificate(response.data) : null),
      catchError(() => of(null))
    );
  }

  // Invalidate certificate (Admin only)
  invalidateCertificate(certificateId: string, reason: string): Observable<boolean> {
    return this.http.post<any>(`${this.API_URL}/${certificateId}/invalidate`, { reason }).pipe(
      map(response => response.isSuccess),
      catchError(() => of(false))
    );
  }

  // Get all certificates (Admin only)
  getAllCertificates(params?: {
    pageNumber?: number;
    pageSize?: number;
    search?: string;
    isValid?: boolean;
  }): Observable<PaginatedResult<Certificate>> {
    let httpParams = new HttpParams();
    if (params?.pageNumber) httpParams = httpParams.set('pageNumber', params.pageNumber.toString());
    if (params?.pageSize) httpParams = httpParams.set('pageSize', params.pageSize.toString());
    if (params?.search) httpParams = httpParams.set('search', params.search);
    if (params?.isValid !== undefined) httpParams = httpParams.set('isValid', params.isValid.toString());

    return this.http.get<any>(this.API_URL, { params: httpParams }).pipe(
      map(response => {
        if (response.isSuccess && response.data) {
          return {
            ...response.data,
            items: (response.data.items || []).map(mapCertificate)
          };
        }
        return { items: [], totalCount: 0, pageNumber: 1, pageSize: 10, totalPages: 0 };
      }),
      catchError(() => of({ items: [], totalCount: 0, pageNumber: 1, pageSize: 10, totalPages: 0 }))
    );
  }

  // Download certificate PDF
  downloadCertificate(certificateId: string): Observable<Blob | null> {
    return this.http.get(`${this.API_URL}/${certificateId}/download`, { 
      responseType: 'blob' 
    }).pipe(
      catchError(() => of(null))
    );
  }
}
