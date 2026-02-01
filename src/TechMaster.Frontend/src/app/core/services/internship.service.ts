import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';
import { environment } from '@environments/environment';

// Matches backend InternshipDto
export interface Internship {
  id: string;
  nameEn: string;
  nameAr: string;
  descriptionEn?: string;
  descriptionAr?: string;
  slug: string;
  thumbnailUrl?: string;
  companyName?: string;
  companyNameAr?: string;
  companyLogoUrl?: string;
  location?: string;
  locationAr?: string;
  isRemote: boolean;
  durationInWeeks: number;
  requirementsEn?: string;
  requirementsAr?: string;
  responsibilitiesEn?: string;
  responsibilitiesAr?: string;
  benefitsEn?: string;
  benefitsAr?: string;
  status: 'Open' | 'Closed' | 'Draft';
  applicationDeadline?: string;
  startDate?: string;
  endDate?: string;
  maxApplicants: number;
  isPaid: boolean;
  stipend?: number;
  hasFee: boolean;
  feeAmount?: number;
  currency?: string;
  isFeatured: boolean;
  applicationCount: number;
  createdAt: string;
  // Computed helper properties for UI compatibility
  title?: string;
  company?: string;
  workType?: string;
  duration?: string;
  isActive?: boolean;
  applicationsCount?: number;
  companyLogo?: string;
}

export interface InternshipApplication {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  internshipId: string;
  internshipName: string;
  status: 'Pending' | 'UnderReview' | 'Accepted' | 'Rejected';
  coverLetter?: string;
  resumeUrl?: string;
  portfolioUrl?: string;
  linkedInUrl?: string;
  gitHubUrl?: string;
  adminNotes?: string;
  reviewedAt?: string;
  createdAt: string;
}

// Matches backend CreateInternshipDto
export interface CreateInternshipDto {
  nameEn: string;
  nameAr?: string;
  descriptionEn?: string;
  descriptionAr?: string;
  thumbnailUrl?: string;
  companyName?: string;
  companyNameAr?: string;
  companyLogoUrl?: string;
  location?: string;
  locationAr?: string;
  isRemote: boolean;
  durationInWeeks: number;
  requirementsEn?: string;
  requirementsAr?: string;
  responsibilitiesEn?: string;
  responsibilitiesAr?: string;
  benefitsEn?: string;
  benefitsAr?: string;
  applicationDeadline?: string;
  startDate?: string;
  endDate?: string;
  maxApplicants: number;
  isPaid: boolean;
  stipend?: number;
  hasFee?: boolean;
  feeAmount?: number;
  currency?: string;
  status?: 'Open' | 'Closed' | 'Draft';
}

export interface ApplyInternshipDto {
  coverLetter?: string;
  resumeUrl?: string;
  portfolioUrl?: string;
  linkedInUrl?: string;
  gitHubUrl?: string;
  paymentScreenshotUrl?: string;
}

// Matches backend ReviewApplicationDto
export interface ReviewApplicationDto {
  status: 'Pending' | 'UnderReview' | 'Accepted' | 'Rejected';
  adminNotes?: string;
}

// Task interfaces
export interface TaskAttachment {
  id?: string;
  fileName: string;
  fileUrl: string;
  fileType?: string;
  fileSize?: number;
}

export interface SubmissionAttachment {
  id?: string;
  fileName: string;
  fileUrl: string;
  fileType?: string;
  fileSize?: number;
}

export interface InternshipTask {
  id: string;
  nameEn: string;
  nameAr?: string;
  instructions: string;
  instructionsAr?: string;
  sortOrder: number;
  maxPoints: number;
  dueDate?: string;
  isRequired: boolean;
  isActive: boolean;
  taskType: string;
  internshipId: string;
  submissionCount: number;
  createdAt: string;
  attachments?: TaskAttachment[];
}

export interface CreateTaskDto {
  nameEn: string;
  nameAr?: string;
  instructions: string;
  instructionsAr?: string;
  sortOrder?: number;
  maxPoints?: number;
  dueDate?: string;
  isRequired?: boolean;
  taskType?: number;
  attachments?: TaskAttachment[];
}

export interface UpdateTaskDto {
  nameEn: string;
  nameAr?: string;
  instructions: string;
  instructionsAr?: string;
  sortOrder: number;
  maxPoints: number;
  dueDate?: string;
  isRequired: boolean;
  isActive: boolean;
  taskType: number;
  attachments?: TaskAttachment[];
}

export interface TaskSubmission {
  id: string;
  taskId: string;
  taskName: string;
  userId: string;
  userName: string;
  userEmail: string;
  submissionText?: string;
  submissionUrl?: string;
  submittedAt: string;
  status: string;
  score?: number;
  maxPoints: number;
  feedback?: string;
  gradedAt?: string;
  isLate: boolean;
  attachments?: SubmissionAttachment[];
}

export interface CreateSubmissionDto {
  submissionText?: string;
  submissionUrl?: string;
  attachments?: SubmissionAttachment[];
}

export interface GradeSubmissionDto {
  score: number;
  feedback?: string;
  feedbackAr?: string;
}

export interface PaginatedResult<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

// Helper function to map backend response to UI-friendly format
function mapInternship(data: any): Internship {
  return {
    ...data,
    // Add computed UI helper properties
    title: data.nameEn || data.title,
    company: data.companyName || data.company,
    workType: data.isRemote ? 'Remote' : 'OnSite',
    duration: data.durationInWeeks ? `${data.durationInWeeks} weeks` : data.duration,
    isActive: data.status === 'Open',
    applicationsCount: data.applicationCount || 0,
    companyLogo: data.companyLogoUrl || data.companyLogo
  };
}

@Injectable({
  providedIn: 'root'
})
export class InternshipService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/internships`;

  // Get all internships with filtering
  getInternships(params?: {
    pageNumber?: number;
    pageSize?: number;
    status?: string;
    search?: string;
  }): Observable<PaginatedResult<Internship>> {
    let httpParams = new HttpParams();
    if (params?.pageNumber) httpParams = httpParams.set('pageNumber', params.pageNumber.toString());
    if (params?.pageSize) httpParams = httpParams.set('pageSize', params.pageSize.toString());
    if (params?.status) httpParams = httpParams.set('status', params.status);
    if (params?.search) httpParams = httpParams.set('search', params.search);

    return this.http.get<any>(this.API_URL, { params: httpParams }).pipe(
      map(response => {
        if (response.isSuccess && response.data) {
          return {
            ...response.data,
            items: (response.data.items || []).map(mapInternship)
          };
        }
        return { items: [], totalCount: 0, pageNumber: 1, pageSize: 10, totalPages: 0 };
      }),
      catchError(() => of({ items: [], totalCount: 0, pageNumber: 1, pageSize: 10, totalPages: 0 }))
    );
  }

  // Get internship by ID
  getInternship(id: string): Observable<Internship | null> {
    return this.http.get<any>(`${this.API_URL}/${id}`).pipe(
      map(response => response.isSuccess ? mapInternship(response.data) : null),
      catchError(() => of(null))
    );
  }

  // Get internship by slug
  getInternshipBySlug(slug: string): Observable<Internship | null> {
    return this.http.get<any>(`${this.API_URL}/slug/${slug}`).pipe(
      map(response => response.isSuccess ? mapInternship(response.data) : null),
      catchError(() => of(null))
    );
  }

  // Create internship (Admin only)
  createInternship(data: CreateInternshipDto): Observable<Internship | null> {
    return this.http.post<any>(this.API_URL, data).pipe(
      map(response => response.isSuccess ? response.data : null),
      catchError(() => of(null))
    );
  }

  // Update internship (Admin only)
  updateInternship(id: string, data: Partial<CreateInternshipDto>): Observable<boolean> {
    return this.http.put<any>(`${this.API_URL}/${id}`, data).pipe(
      map(response => response.isSuccess),
      catchError(() => of(false))
    );
  }

  // Delete internship (Admin only)
  deleteInternship(id: string): Observable<boolean> {
    return this.http.delete<any>(`${this.API_URL}/${id}`).pipe(
      map(response => response.isSuccess),
      catchError(() => of(false))
    );
  }

  // Apply for internship
  applyForInternship(internshipId: string, data: ApplyInternshipDto): Observable<InternshipApplication | null> {
    return this.http.post<any>(`${this.API_URL}/${internshipId}/apply`, data).pipe(
      map(response => response.isSuccess ? response.data : null),
      catchError(() => of(null))
    );
  }

  // Get my applications
  getMyApplications(): Observable<InternshipApplication[]> {
    return this.http.get<any>(`${this.API_URL}/my-applications`).pipe(
      map(response => response.isSuccess ? response.data : []),
      catchError(() => of([]))
    );
  }

  // Get applications for an internship (Admin only)
  getInternshipApplications(internshipId: string, params?: {
    pageNumber?: number;
    pageSize?: number;
    status?: string;
  }): Observable<PaginatedResult<InternshipApplication>> {
    let httpParams = new HttpParams();
    if (params?.pageNumber) httpParams = httpParams.set('pageNumber', params.pageNumber.toString());
    if (params?.pageSize) httpParams = httpParams.set('pageSize', params.pageSize.toString());
    if (params?.status) httpParams = httpParams.set('status', params.status);

    return this.http.get<any>(`${this.API_URL}/${internshipId}/applications`, { params: httpParams }).pipe(
      map(response => response.isSuccess ? response.data : { items: [], totalCount: 0, pageNumber: 1, pageSize: 10, totalPages: 0 }),
      catchError(() => of({ items: [], totalCount: 0, pageNumber: 1, pageSize: 10, totalPages: 0 }))
    );
  }

  // Review application (Admin only)
  reviewApplication(applicationId: string, data: ReviewApplicationDto): Observable<boolean> {
    return this.http.post<any>(`${this.API_URL}/applications/${applicationId}/review`, data).pipe(
      map(response => response.isSuccess),
      catchError(() => of(false))
    );
  }

  // Task management
  getInternshipTasks(internshipId: string): Observable<InternshipTask[]> {
    return this.http.get<any>(`${this.API_URL}/${internshipId}/tasks`).pipe(
      map(response => response.isSuccess ? response.data : []),
      catchError(() => of([]))
    );
  }

  getTask(taskId: string): Observable<InternshipTask | null> {
    return this.http.get<any>(`${this.API_URL}/tasks/${taskId}`).pipe(
      map(response => response.isSuccess ? response.data : null),
      catchError(() => of(null))
    );
  }

  createTask(internshipId: string, data: CreateTaskDto): Observable<InternshipTask | null> {
    return this.http.post<any>(`${this.API_URL}/${internshipId}/tasks`, data).pipe(
      map(response => response.isSuccess ? response.data : null),
      catchError(() => of(null))
    );
  }

  updateTask(taskId: string, data: UpdateTaskDto): Observable<InternshipTask | null> {
    return this.http.put<any>(`${this.API_URL}/tasks/${taskId}`, data).pipe(
      map(response => response.isSuccess ? response.data : null),
      catchError(() => of(null))
    );
  }

  deleteTask(taskId: string): Observable<boolean> {
    return this.http.delete<any>(`${this.API_URL}/tasks/${taskId}`).pipe(
      map(response => response.isSuccess),
      catchError(() => of(false))
    );
  }

  // Task submissions
  submitTask(taskId: string, data: CreateSubmissionDto): Observable<TaskSubmission | null> {
    return this.http.post<any>(`${this.API_URL}/tasks/${taskId}/submit`, data).pipe(
      map(response => response.isSuccess ? response.data : null),
      catchError(() => of(null))
    );
  }

  getTaskSubmissions(taskId: string): Observable<TaskSubmission[]> {
    return this.http.get<any>(`${this.API_URL}/tasks/${taskId}/submissions`).pipe(
      map(response => response.isSuccess ? response.data : []),
      catchError(() => of([]))
    );
  }

  getMySubmissions(internshipId: string): Observable<TaskSubmission[]> {
    return this.http.get<any>(`${this.API_URL}/${internshipId}/my-submissions`).pipe(
      map(response => response.isSuccess ? response.data : []),
      catchError(() => of([]))
    );
  }

  gradeSubmission(submissionId: string, data: GradeSubmissionDto): Observable<TaskSubmission | null> {
    return this.http.post<any>(`${this.API_URL}/submissions/${submissionId}/grade`, data).pipe(
      map(response => response.isSuccess ? response.data : null),
      catchError(() => of(null))
    );
  }
}
