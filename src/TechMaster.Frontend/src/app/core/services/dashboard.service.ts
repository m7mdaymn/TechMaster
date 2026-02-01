import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';
import { environment } from '@environments/environment';

// ===== Student Dashboard Types =====
export interface StudentDashboardResponse {
  isSuccess: boolean;
  data: StudentDashboard;
  message?: string;
}

export interface StudentDashboard {
  enrolledCourses: number;
  totalEnrollments: number;
  completedCourses: number;
  inProgressCourses: number;
  activeCourses: number;
  totalCertificates: number;
  certificatesEarned: number;
  totalBadges: number;
  badgesEarned: number;
  totalXp: number;
  currentStreak: number;
  currentLevel: number;
  xpToNextLevel: number;
  overallProgress: number;
  enrollments: StudentEnrollment[];
  recentEnrollments: StudentEnrollment[];
  certificates: StudentCertificate[];
  badges: StudentBadge[];
  recentBadges: StudentBadge[];
  recentActivity: RecentActivity[];
}

export interface StudentEnrollment {
  id: number | string;
  courseId: string;
  courseTitle: string;
  courseName: string;
  courseThumbnail: string;
  courseSlug: string;
  instructorName: string;
  progress: number;
  progressPercentage: number;
  totalSessions: number;
  completedSessions: number;
  status: string;
  enrolledAt: string;
  createdAt: string;
  lastAccessedAt?: string;
}

export interface StudentCertificate {
  id: number;
  courseTitle: string;
  courseThumbnail: string;
  issuedAt: string;
  certificateUrl: string;
  verificationCode: string;
}

export interface StudentBadge {
  id: number;
  name: string;
  description: string;
  iconUrl: string;
  earnedAt: string;
}

export interface RecentActivity {
  id: number;
  activityType: string;
  description: string;
  courseTitle?: string;
  xpEarned: number;
  createdAt: string;
}

// ===== Admin Dashboard Types =====
export interface AdminDashboardResponse {
  isSuccess: boolean;
  data: AdminDashboard;
  message?: string;
}

export interface AdminDashboard {
  totalUsers: number;
  totalStudents: number;
  totalInstructors: number;
  totalCourses: number;
  publishedCourses: number;
  pendingCourses: number;
  draftCourses: number;
  totalEnrollments: number;
  pendingEnrollments: number;
  approvedEnrollments: number;
  rejectedEnrollments: number;
  completedEnrollments: number;
  totalRevenue: number;
  monthlyRevenue: number;
  totalCertificates: number;
  totalInternships: number;
  pendingApplications: number;
  totalContactMessages: number;
  unreadMessages: number;
  activeUsers: number;
  newUsersThisMonth: number;
  
  // Growth percentages
  userGrowthPercentage: number;
  courseGrowthPercentage: number;
  enrollmentGrowthPercentage: number;
  revenueGrowthPercentage: number;
  
  recentEnrollments: AdminRecentEnrollment[];
  recentUsers: AdminRecentUser[];
  coursesByCategory: CategoryStats[];
  monthlyEnrollmentStats: MonthlyStats[];
  enrollmentStats: EnrollmentStatsItem[];
  topCourses: TopCourseStats[];
  recentActivities: RecentActivityItem[];
}

export interface EnrollmentStatsItem {
  period: string;
  count: number;
}

export interface TopCourseStats {
  courseId: string;
  courseName: string;
  enrollmentCount: number;
  completionCount: number;
  averageProgress: number;
}

export interface RecentActivityItem {
  type: string;
  description: string;
  descriptionAr?: string;
  timestamp: string;
  userName?: string;
  actionUrl?: string;
}

export interface AdminRecentEnrollment {
  id: number;
  userName: string;
  userEmail: string;
  userAvatar: string;
  courseTitle: string;
  courseThumbnail: string;
  amount: number;
  status: string;
  paymentMethod: string;
  enrolledAt: string;
}

export interface AdminRecentUser {
  id: string;
  fullName: string;
  email: string;
  avatar: string;
  role: string;
  createdAt: string;
  isActive: boolean;
  lastLoginAt?: string;
}

export interface CategoryStats {
  categoryName: string;
  courseCount: number;
  enrollmentCount: number;
}

export interface MonthlyStats {
  month: string;
  enrollments: number;
  revenue: number;
}

// ===== Instructor Dashboard Types =====
export interface InstructorDashboardResponse {
  isSuccess: boolean;
  data: InstructorDashboard;
  message?: string;
}

export interface InstructorDashboard {
  totalCourses: number;
  publishedCourses: number;
  draftCourses: number;
  pendingCourses?: number;
  totalStudents?: number;
  totalEnrollments?: number;
  activeEnrollments?: number;
  completedEnrollments?: number;
  totalRevenue: number;
  monthlyRevenue?: number;
  thisMonthRevenue?: number;
  averageRating: number;
  totalReviews: number;
  courses: InstructorCourse[];
  recentCourses?: any[];
  recentEnrollments: InstructorRecentEnrollment[];
  monthlyStats?: MonthlyStats[];
}

export interface InstructorCourse {
  id: string;
  title: string;
  thumbnail: string;
  slug: string;
  enrollments: number;
  revenue: number;
  rating: number;
  reviewCount: number;
  completionRate: number;
  status: string;
  createdAt: string;
  lastUpdatedAt: string;
}

export interface InstructorRecentEnrollment {
  id: number;
  studentName: string;
  studentAvatar: string;
  studentEmail: string;
  courseTitle: string;
  courseThumbnail: string;
  amount: number;
  enrolledAt: string;
}

export interface InstructorStudent {
  id: string;
  name: string;
  email: string;
  phone?: string;
  profileImageUrl: string;
  courseName: string;
  courseId: string;
  enrollmentId: string;
  progress: number;
  enrolledAt: string;
  lastActiveAt?: string;
}

export interface InstructorStudentData {
  students: InstructorStudent[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}

export interface SessionProgress {
  sessionId: string;
  sessionTitle: string;
  order: number;
  isCompleted: boolean;
  watchPercentage: number;
  completedAt?: string;
}

export interface ChapterProgress {
  chapterId: string;
  chapterTitle: string;
  order: number;
  sessions: SessionProgress[];
  completionPercentage: number;
}

export interface InstructorStudentDetail {
  enrollmentId: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  studentPhone?: string;
  studentProfileImageUrl?: string;
  courseId: string;
  courseName: string;
  overallProgress: number;
  enrolledAt: string;
  lastActiveAt?: string;
  enrollmentStatus: string;
  chapterProgress: ChapterProgress[];
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  // ===== Student Dashboard =====
  getStudentDashboard(): Observable<StudentDashboard | null> {
    return this.http.get<StudentDashboardResponse>(`${this.apiUrl}/dashboard/student`).pipe(
      map(response => {
        if (!response.isSuccess || !response.data) return null;
        const data = response.data;
        
        // Map enrollments to expected format
        const enrollments: StudentEnrollment[] = (data.enrollments || data.recentEnrollments || []).map((e: any) => ({
          id: e.id,
          courseId: e.courseId,
          courseTitle: e.courseName || e.courseTitle || '',
          courseName: e.courseName || e.courseTitle || '',
          courseThumbnail: e.courseThumbnail || '',
          courseSlug: e.courseSlug || e.courseId,
          instructorName: e.instructorName || '',
          progress: e.progressPercentage || e.progress || 0,
          progressPercentage: e.progressPercentage || e.progress || 0,
          totalSessions: e.totalSessions || 0,
          completedSessions: e.completedSessions || 0,
          status: e.status,
          enrolledAt: e.createdAt || e.enrolledAt,
          createdAt: e.createdAt || e.enrolledAt,
          lastAccessedAt: e.lastAccessedAt
        }));

        // Map certificates
        const certificates: StudentCertificate[] = (data.certificates || []).map((c: any) => ({
          id: c.id,
          courseTitle: c.courseTitle || '',
          courseThumbnail: c.courseThumbnail || '',
          issuedAt: c.issuedAt || c.createdAt,
          certificateUrl: c.certificateUrl || '',
          verificationCode: c.verificationCode || ''
        }));

        // Map badges
        const badges: StudentBadge[] = (data.badges || data.recentBadges || []).map((b: any) => ({
          id: b.id,
          name: b.nameEn || b.name || '',
          description: b.descriptionEn || b.description || '',
          iconUrl: b.iconUrl || '',
          earnedAt: b.earnedAt
        }));

        return {
          ...data,
          enrolledCourses: data.totalEnrollments || 0,
          totalEnrollments: data.totalEnrollments || 0,
          completedCourses: data.completedCourses || 0,
          inProgressCourses: data.inProgressCourses || data.activeCourses || 0,
          activeCourses: data.activeCourses || data.inProgressCourses || 0,
          totalCertificates: data.totalCertificates || data.certificatesEarned || 0,
          certificatesEarned: data.certificatesEarned || data.totalCertificates || 0,
          totalBadges: data.totalBadges || data.badgesEarned || 0,
          badgesEarned: data.badgesEarned || data.totalBadges || 0,
          totalXp: data.totalXp || 0,
          currentLevel: data.currentLevel || 1,
          xpToNextLevel: data.xpToNextLevel || 1000,
          overallProgress: data.overallProgress || 0,
          enrollments,
          recentEnrollments: enrollments,
          certificates,
          badges,
          recentBadges: badges,
          recentActivity: data.recentActivity || []
        } as StudentDashboard;
      }),
      catchError(error => {
        console.error('Error fetching student dashboard:', error);
        return of(null);
      })
    );
  }

  getStudentEnrollments(): Observable<StudentEnrollment[]> {
    return this.http.get<any>(`${this.apiUrl}/dashboard/student/enrollments`).pipe(
      map(response => response.isSuccess ? response.data : []),
      catchError(() => of([]))
    );
  }

  // ===== Admin Dashboard =====
  getAdminDashboard(): Observable<AdminDashboard | null> {
    return this.http.get<AdminDashboardResponse>(`${this.apiUrl}/dashboard/admin`).pipe(
      map(response => {
        if (!response.isSuccess) return null;
        const data = response.data;
        // Map backend response to frontend interface
        return {
          ...data,
          totalUsers: (data.totalStudents || 0) + (data.totalInstructors || 0),
          // Map other fields that might have different names
          recentEnrollments: data.recentEnrollments || [],
          recentUsers: data.recentUsers || []
        } as AdminDashboard;
      }),
      catchError(error => {
        console.error('Error fetching admin dashboard:', error);
        return of(null);
      })
    );
  }

  getAuditLogs(pageNumber = 1, pageSize = 50, action?: string): Observable<any> {
    let url = `${this.apiUrl}/dashboard/admin/audit-logs?pageNumber=${pageNumber}&pageSize=${pageSize}`;
    if (action) {
      url += `&action=${action}`;
    }
    return this.http.get<any>(url).pipe(
      map(response => response.isSuccess ? response.data : { items: [], totalCount: 0 }),
      catchError(() => of({ items: [], totalCount: 0 }))
    );
  }

  getUsers(pageNumber = 1, pageSize = 20, role?: string, search?: string): Observable<any> {
    let url = `${this.apiUrl}/dashboard/admin/users?pageNumber=${pageNumber}&pageSize=${pageSize}`;
    if (role) url += `&role=${role}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    
    return this.http.get<any>(url).pipe(
      map(response => response.isSuccess ? response.data : { items: [], totalCount: 0 }),
      catchError(() => of({ items: [], totalCount: 0 }))
    );
  }

  updateUserRole(userId: string, role: string): Observable<boolean> {
    return this.http.put<any>(`${this.apiUrl}/dashboard/admin/users/${userId}/role`, { role }).pipe(
      map(response => response.isSuccess),
      catchError(() => of(false))
    );
  }

  toggleUserStatus(userId: string, isActive: boolean): Observable<boolean> {
    return this.http.put<any>(`${this.apiUrl}/dashboard/admin/users/${userId}/status`, { isActive }).pipe(
      map(response => response.isSuccess),
      catchError(() => of(false))
    );
  }

  approveEnrollment(enrollmentId: string, paidAmount = 0): Observable<boolean> {
    return this.http.post<any>(`${this.apiUrl}/enrollments/${enrollmentId}/approve`, { paidAmount }).pipe(
      map(response => response.isSuccess),
      catchError(() => of(false))
    );
  }

  rejectEnrollment(enrollmentId: string, reason = ''): Observable<boolean> {
    return this.http.post<any>(`${this.apiUrl}/enrollments/${enrollmentId}/reject`, { reason }).pipe(
      map(response => response.isSuccess),
      catchError(() => of(false))
    );
  }

  // ===== Instructor Dashboard =====
  getInstructorDashboard(): Observable<InstructorDashboard | null> {
    return this.http.get<InstructorDashboardResponse>(`${this.apiUrl}/dashboard/instructor`).pipe(
      map(response => {
        if (!response.isSuccess || !response.data) return null;
        
        const data = response.data as any;
        
        // Map recentCourses to courses array with proper structure
        const courses: InstructorCourse[] = (data.recentCourses || []).map((c: any) => ({
          id: c.id,
          title: c.nameEn || c.title || 'Untitled',
          thumbnail: c.thumbnailUrl || c.thumbnail || '',
          slug: c.slug || '',
          enrollments: c.enrollmentCount || c.enrollments || 0,
          revenue: c.revenue || 0,
          rating: c.averageRating || c.rating || 0,
          reviewCount: c.reviewCount || 0,
          completionRate: c.completionRate || 0,
          status: c.status || 'Draft',
          createdAt: c.createdAt,
          lastUpdatedAt: c.updatedAt || c.createdAt
        }));

        // Map recentEnrollments to proper structure
        const recentEnrollments: InstructorRecentEnrollment[] = (data.recentEnrollments || []).map((e: any) => ({
          id: e.id,
          studentName: e.userName || e.studentName || 'Unknown',
          studentAvatar: e.userAvatar || e.studentAvatar || '',
          studentEmail: e.userEmail || e.studentEmail || '',
          courseTitle: e.courseName || e.courseTitle || 'Unknown',
          courseThumbnail: e.courseThumbnail || '',
          amount: e.amountPaid || e.amount || 0,
          enrolledAt: e.createdAt || e.enrolledAt
        }));

        return {
          totalCourses: data.totalCourses || 0,
          publishedCourses: data.publishedCourses || 0,
          draftCourses: data.draftCourses || 0,
          totalStudents: data.totalEnrollments || data.totalStudents || 0,
          totalEnrollments: data.totalEnrollments || 0,
          activeEnrollments: data.activeEnrollments || 0,
          completedEnrollments: data.completedEnrollments || 0,
          totalRevenue: data.totalRevenue || 0,
          monthlyRevenue: data.thisMonthRevenue || data.monthlyRevenue || 0,
          averageRating: data.averageRating || 0,
          totalReviews: data.totalReviews || 0,
          courses,
          recentEnrollments
        };
      }),
      catchError(error => {
        console.error('Error fetching instructor dashboard:', error);
        return of(null);
      })
    );
  }

  getInstructorCourses(): Observable<InstructorCourse[]> {
    return this.http.get<any>(`${this.apiUrl}/dashboard/instructor/courses`).pipe(
      map(response => response.isSuccess ? response.data : []),
      catchError(() => of([]))
    );
  }

  getCourseAnalytics(courseId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/dashboard/instructor/courses/${courseId}/analytics`).pipe(
      map(response => response.isSuccess ? response.data : null),
      catchError(() => of(null))
    );
  }

  getInstructorStudents(pageNumber = 1, pageSize = 50): Observable<InstructorStudentData> {
    return this.http.get<any>(`${this.apiUrl}/dashboard/instructor/students?pageNumber=${pageNumber}&pageSize=${pageSize}`).pipe(
      map(response => {
        if (response.isSuccess && response.data) {
          const data = response.data;
          return {
            students: (data.items || []).map((s: any) => ({
              id: s.id,
              name: s.name,
              email: s.email,
              phone: s.phone,
              profileImageUrl: s.profileImageUrl || '',
              courseName: s.courseName,
              courseId: s.courseId,
              enrollmentId: s.enrollmentId,
              progress: s.progress || 0,
              enrolledAt: s.enrolledAt,
              lastActiveAt: s.lastActiveAt
            })),
            totalCount: data.totalCount || 0,
            pageNumber: data.pageNumber || pageNumber,
            pageSize: data.pageSize || pageSize
          };
        }
        return { students: [], totalCount: 0, pageNumber, pageSize };
      }),
      catchError(() => of({ students: [], totalCount: 0, pageNumber, pageSize }))
    );
  }

  getStudentDetail(enrollmentId: string): Observable<InstructorStudentDetail | null> {
    return this.http.get<any>(`${this.apiUrl}/dashboard/instructor/students/${enrollmentId}`).pipe(
      map(response => {
        if (response.isSuccess && response.data) {
          return response.data as InstructorStudentDetail;
        }
        return null;
      }),
      catchError(() => of(null))
    );
  }

  removeStudentFromCourse(enrollmentId: string, reason?: string): Observable<boolean> {
    const url = reason 
      ? `${this.apiUrl}/dashboard/instructor/students/${enrollmentId}?reason=${encodeURIComponent(reason)}`
      : `${this.apiUrl}/dashboard/instructor/students/${enrollmentId}`;
    return this.http.delete<any>(url).pipe(
      map(response => response.isSuccess === true),
      catchError(() => of(false))
    );
  }

  getInstructors(): Observable<Instructor[]> {
    return this.http.get<any>(`${this.apiUrl}/dashboard/admin/instructors`).pipe(
      map(response => response.isSuccess ? response.data : []),
      catchError(() => of([]))
    );
  }

  // Contact Messages methods
  getContactMessages(pageNumber = 1, pageSize = 100, isRead?: boolean): Observable<{ isSuccess: boolean; data?: any[] }> {
    let url = `${this.apiUrl}/dashboard/admin/contact-messages?pageNumber=${pageNumber}&pageSize=${pageSize}`;
    if (isRead !== undefined) {
      url += `&isRead=${isRead}`;
    }
    return this.http.get<{ isSuccess: boolean; data?: any[] }>(url).pipe(
      catchError(() => of({ isSuccess: false, data: [] }))
    );
  }

  markMessageAsRead(messageId: string): Observable<{ isSuccess: boolean }> {
    return this.http.post<{ isSuccess: boolean }>(`${this.apiUrl}/dashboard/admin/contact-messages/${messageId}/read`, {}).pipe(
      catchError(() => of({ isSuccess: false }))
    );
  }

  deleteContactMessage(messageId: string): Observable<{ isSuccess: boolean }> {
    return this.http.delete<{ isSuccess: boolean }>(`${this.apiUrl}/dashboard/admin/contact-messages/${messageId}`).pipe(
      catchError(() => of({ isSuccess: false }))
    );
  }
}

export interface Instructor {
  id: string;
  fullName: string;
  profileImageUrl?: string;
  bio?: string;
}
