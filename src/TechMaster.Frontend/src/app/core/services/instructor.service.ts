import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';
import { environment } from '@environments/environment';

// Instructor Dashboard
export interface InstructorDashboard {
  totalCourses: number;
  publishedCourses: number;
  draftCourses: number;
  totalEnrollments: number;
  activeEnrollments: number;
  completedEnrollments: number;
  totalRevenue: number;
  thisMonthRevenue: number;
  averageRating: number;
  totalReviews: number;
  recentCourses: CourseDto[];
  recentEnrollments: EnrollmentDto[];
}

export interface CourseDto {
  id: string;
  nameEn: string;
  nameAr?: string;
  slug: string;
  shortDescriptionEn?: string;
  thumbnailUrl?: string;
  status: string;
  price: number;
  enrollmentCount: number;
  averageRating: number;
  totalReviews: number;
  completionRate?: number;
  createdAt: string;
  instructor?: InstructorInfo;
}

export interface InstructorInfo {
  id: string;
  fullName: string;
  profileImageUrl?: string;
}

export interface EnrollmentDto {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  courseId: string;
  courseName: string;
  status: string;
  progress: number;
  enrolledAt: string;
}

// Course Analytics
export interface CourseAnalytics {
  courseId: string;
  courseName: string;
  totalEnrollments: number;
  activeStudents: number;
  completionRate: number;
  averageRating: number;
  totalRevenue: number;
  enrollmentTrend: { month: string; count: number }[];
  moduleProgress: { moduleId: string; moduleName: string; completedCount: number; completionRate: number }[];
  recentActivity: { id: string; type: string; description: string; timestamp: string }[];
}

export interface EnrollmentTrend {
  date: string;
  count: number;
}

export interface SessionAnalytics {
  sessionId: string;
  sessionName: string;
  viewCount: number;
  completionRate: number;
  averageWatchPercentage: number;
}

// Course Creation & Management
export interface CreateCourseDto {
  nameEn: string;
  nameAr?: string;
  shortDescriptionEn?: string;
  shortDescriptionAr?: string;
  descriptionEn?: string;
  descriptionAr?: string;
  thumbnailUrl?: string;
  promoVideoUrl?: string;
  price?: number;
  originalPrice?: number;
  categoryId?: string;
  level?: string;
  durationHours?: number;
  language?: string;
  prerequisites?: string;
  whatYouWillLearn?: string;
  whoIsThisFor?: string;
  instructorId?: string;
  status?: string;
}

export interface UpdateCourseDto extends CreateCourseDto {
  isFeatured?: boolean;
}

// Modules
export interface ModuleDto {
  id: string;
  nameEn: string;
  nameAr?: string;
  descriptionEn?: string;
  sortOrder: number;
  sessions: SessionDto[];
}

export interface CreateModuleDto {
  nameEn: string;
  nameAr?: string;
  descriptionEn?: string;
  descriptionAr?: string;
  sortOrder?: number;
  courseId?: string;
}

// Sessions
export interface SessionDto {
  id: string;
  nameEn: string;
  nameAr?: string;
  descriptionEn?: string;
  videoUrl?: string;
  videoDurationMinutes?: number;
  sortOrder: number;
  isPreview: boolean;
  sessionType: string;
  scheduledAt?: string;
  liveStreamUrl?: string;
  materials: SessionMaterialDto[];
}

export interface CreateSessionDto {
  nameEn: string;
  nameAr?: string;
  descriptionEn?: string;
  descriptionAr?: string;
  videoUrl?: string;
  videoDurationMinutes?: number;
  sortOrder?: number;
  isPreview?: boolean;
  sessionType?: string;
  scheduledAt?: string;
  liveStreamUrl?: string;
  moduleId?: string;
}

export interface UpdateSessionDto extends CreateSessionDto {}

// Session Materials
export interface SessionMaterialDto {
  id: string;
  nameEn: string;
  nameAr?: string;
  fileUrl: string;
  fileType: string;
  fileSize?: number;
}

export interface CreateSessionMaterialDto {
  nameEn: string;
  nameAr?: string;
  fileUrl: string;
  fileType: string;
  fileSize?: number;
  sessionId?: string;
}

// Chat
export interface ChatRoom {
  id: string;
  name: string;
  courseId?: string;
  courseName?: string;
  participantCount: number;
  lastMessage?: ChatMessage;
  unreadCount: number;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  senderPhotoUrl?: string;
  content: string;
  createdAt: string;
  isRead: boolean;
}

// Notifications
export interface NotificationDto {
  id: string;
  title: string;
  titleAr?: string;
  message: string;
  messageAr?: string;
  type: string;
  isRead: boolean;
  link?: string;
  createdAt: string;
}

// Earnings
export interface EarningsData {
  totalEarnings: number;
  thisMonthEarnings: number;
  lastMonthEarnings: number;
  pendingPayouts: number;
  monthlyEarnings: MonthlyEarning[];
  courseEarnings: CourseEarning[];
  recentTransactions: Transaction[];
}

export interface MonthlyEarning {
  month: string;
  amount: number;
  enrollments: number;
}

export interface CourseEarning {
  courseId: string;
  courseName: string;
  totalEarnings: number;
  enrollments: number;
  averageRating: number;
}

export interface Transaction {
  id: string;
  type: string;
  amount: number;
  description: string;
  status: string;
  createdAt: string;
}

// Live Session
export interface LiveSessionDto {
  id: string;
  title: string;
  sessionId?: string;
  sessionName?: string;
  courseId: string;
  courseName: string;
  scheduledAt: string;
  durationMinutes: number;
  duration?: number;
  platform: 'youtube' | 'zoom' | 'teams' | 'meet' | 'other';
  streamUrl: string;
  recordingUrl?: string;
  meetingId?: string;
  passcode?: string;
  status?: 'scheduled' | 'live' | 'ended' | 'cancelled';
  description?: string;
  attendeeCount?: number;
}

export interface CreateLiveSessionDto {
  title: string;
  courseId: string;
  scheduledAt: string;
  durationMinutes: number;
  platform: string;
  streamUrl: string;
  description?: string;
}

// Student for instructor view
export interface InstructorStudent {
  id: string;
  fullName: string;
  email: string;
  profileImageUrl?: string;
  enrolledCourses: number;
  totalProgress: number;
  lastActiveAt?: string;
  enrollments: StudentEnrollment[];
}

export interface StudentEnrollment {
  courseId: string;
  courseName: string;
  progress: number;
  enrolledAt: string;
  status: string;
}

@Injectable({
  providedIn: 'root'
})
export class InstructorService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  // Dashboard
  getDashboard(): Observable<InstructorDashboard | null> {
    return this.http.get<any>(`${this.apiUrl}/dashboard/instructor`).pipe(
      map(response => response.isSuccess ? response.data : null),
      catchError(() => of(null))
    );
  }

  // Courses
  getMyCourses(): Observable<CourseDto[]> {
    return this.http.get<any>(`${this.apiUrl}/dashboard/instructor/courses`).pipe(
      map(response => response.isSuccess ? response.data : []),
      catchError(() => of([]))
    );
  }

  getCourse(courseId: string): Observable<CourseDto | null> {
    return this.http.get<any>(`${this.apiUrl}/courses/${courseId}`).pipe(
      map(response => response.isSuccess ? response.data : null),
      catchError(() => of(null))
    );
  }

  createCourse(dto: CreateCourseDto): Observable<CourseDto | null> {
    return this.http.post<any>(`${this.apiUrl}/courses`, dto).pipe(
      map(response => response.isSuccess ? response.data : null),
      catchError(() => of(null))
    );
  }

  updateCourse(courseId: string, dto: UpdateCourseDto): Observable<boolean> {
    return this.http.put<any>(`${this.apiUrl}/courses/${courseId}`, dto).pipe(
      map(response => response.isSuccess),
      catchError(() => of(false))
    );
  }

  deleteCourse(courseId: string): Observable<boolean> {
    return this.http.delete<any>(`${this.apiUrl}/courses/${courseId}`).pipe(
      map(response => response.isSuccess),
      catchError(() => of(false))
    );
  }

  // Course Analytics
  getCourseAnalytics(courseId: string): Observable<CourseAnalytics | null> {
    return this.http.get<any>(`${this.apiUrl}/dashboard/instructor/courses/${courseId}/analytics`).pipe(
      map(response => {
        if (response.isSuccess && response.data) {
          const data = response.data;
          return {
            courseId: data.courseId,
            courseName: data.courseName || '',
            totalEnrollments: data.totalEnrollments || 0,
            activeStudents: data.activeEnrollments || data.activeStudents || 0,
            completionRate: data.completionRate || 0,
            averageRating: data.averageRating || 0,
            totalRevenue: data.totalRevenue || 0,
            enrollmentTrend: (data.enrollmentTrends || []).map((t: any) => ({
              month: new Date(t.date).toLocaleDateString('en-US', { month: 'short' }),
              count: t.count
            })),
            moduleProgress: (data.sessionAnalytics || []).map((s: any) => ({
              moduleId: s.sessionId,
              moduleName: s.sessionName || 'Session',
              completedCount: Math.round((s.completionRate || 0) * data.totalEnrollments / 100),
              completionRate: s.completionRate || 0
            })),
            recentActivity: [] // Backend doesn't provide this yet
          } as CourseAnalytics;
        }
        return null;
      }),
      catchError(() => of(null))
    );
  }

  // Modules
  createModule(courseId: string, dto: CreateModuleDto): Observable<ModuleDto | null> {
    return this.http.post<any>(`${this.apiUrl}/courses/${courseId}/modules`, dto).pipe(
      map(response => response.isSuccess ? response.data : null),
      catchError(() => of(null))
    );
  }

  updateModule(moduleId: string, dto: any): Observable<boolean> {
    return this.http.put<any>(`${this.apiUrl}/courses/modules/${moduleId}`, dto).pipe(
      map(response => response.isSuccess),
      catchError(() => of(false))
    );
  }

  deleteModule(moduleId: string): Observable<boolean> {
    return this.http.delete<any>(`${this.apiUrl}/courses/modules/${moduleId}`).pipe(
      map(response => response.isSuccess),
      catchError(() => of(false))
    );
  }

  reorderModules(courseId: string, moduleIds: string[]): Observable<boolean> {
    return this.http.post<any>(`${this.apiUrl}/courses/${courseId}/modules/reorder`, moduleIds).pipe(
      map(response => response.isSuccess),
      catchError(() => of(false))
    );
  }

  // Sessions
  createSession(moduleId: string, dto: CreateSessionDto): Observable<SessionDto | null> {
    return this.http.post<any>(`${this.apiUrl}/courses/modules/${moduleId}/sessions`, dto).pipe(
      map(response => response.isSuccess ? response.data : null),
      catchError(() => of(null))
    );
  }

  updateSession(sessionId: string, dto: UpdateSessionDto): Observable<boolean> {
    return this.http.put<any>(`${this.apiUrl}/courses/sessions/${sessionId}`, dto).pipe(
      map(response => response.isSuccess),
      catchError(() => of(false))
    );
  }

  deleteSession(sessionId: string): Observable<boolean> {
    return this.http.delete<any>(`${this.apiUrl}/courses/sessions/${sessionId}`).pipe(
      map(response => response.isSuccess),
      catchError(() => of(false))
    );
  }

  reorderSessions(moduleId: string, sessionIds: string[]): Observable<boolean> {
    return this.http.post<any>(`${this.apiUrl}/courses/modules/${moduleId}/sessions/reorder`, sessionIds).pipe(
      map(response => response.isSuccess),
      catchError(() => of(false))
    );
  }

  // Session Materials
  addSessionMaterial(sessionId: string, dto: CreateSessionMaterialDto): Observable<SessionMaterialDto | null> {
    return this.http.post<any>(`${this.apiUrl}/courses/sessions/${sessionId}/materials`, dto).pipe(
      map(response => response.isSuccess ? response.data : null),
      catchError(() => of(null))
    );
  }

  deleteMaterial(materialId: string): Observable<boolean> {
    return this.http.delete<any>(`${this.apiUrl}/courses/materials/${materialId}`).pipe(
      map(response => response.isSuccess),
      catchError(() => of(false))
    );
  }

  // Notifications
  getNotifications(count = 20): Observable<NotificationDto[]> {
    return this.http.get<any>(`${this.apiUrl}/notifications`, { params: { count: count.toString() } }).pipe(
      map(response => {
        if (response.isSuccess && response.data) {
          return response.data.map((n: any) => ({
            id: n.id,
            title: n.titleEn || n.title || '',
            titleAr: n.titleAr,
            message: n.messageEn || n.message || '',
            messageAr: n.messageAr,
            type: n.type,
            isRead: n.isRead,
            link: n.actionUrl || n.link,
            createdAt: n.createdAt
          }));
        }
        return [];
      }),
      catchError(() => of([]))
    );
  }

  getUnreadNotificationCount(): Observable<number> {
    return this.http.get<any>(`${this.apiUrl}/notifications/unread-count`).pipe(
      map(response => response.isSuccess ? response.data : 0),
      catchError(() => of(0))
    );
  }

  markNotificationAsRead(notificationId: string): Observable<boolean> {
    return this.http.post<any>(`${this.apiUrl}/notifications/${notificationId}/read`, {}).pipe(
      map(response => response.isSuccess),
      catchError(() => of(false))
    );
  }

  markAllNotificationsAsRead(): Observable<boolean> {
    return this.http.post<any>(`${this.apiUrl}/notifications/read-all`, {}).pipe(
      map(response => response.isSuccess),
      catchError(() => of(false))
    );
  }

  // Chat
  getChatRooms(): Observable<ChatRoom[]> {
    return this.http.get<any>(`${this.apiUrl}/chat/rooms`).pipe(
      map(response => {
        if (response.isSuccess && response.data) {
          return response.data.map((room: any) => this.mapChatRoom(room));
        }
        return [];
      }),
      catchError(() => of([]))
    );
  }

  getChatRoom(roomId: string): Observable<ChatRoom | null> {
    return this.http.get<any>(`${this.apiUrl}/chat/rooms/${roomId}`).pipe(
      map(response => response.isSuccess && response.data ? this.mapChatRoom(response.data) : null),
      catchError(() => of(null))
    );
  }

  getChatMessages(roomId: string, count = 50): Observable<ChatMessage[]> {
    return this.http.get<any>(`${this.apiUrl}/chat/rooms/${roomId}/messages`, { params: { count: count.toString() } }).pipe(
      map(response => {
        if (response.isSuccess && response.data) {
          return response.data.map((msg: any) => this.mapChatMessage(msg));
        }
        return [];
      }),
      catchError(() => of([]))
    );
  }

  sendMessage(roomId: string, content: string): Observable<ChatMessage | null> {
    return this.http.post<any>(`${this.apiUrl}/chat/rooms/${roomId}/messages`, { content }).pipe(
      map(response => response.isSuccess && response.data ? this.mapChatMessage(response.data) : null),
      catchError(() => of(null))
    );
  }

  private mapChatRoom(room: any): ChatRoom {
    return {
      id: room.id,
      name: room.name,
      courseId: room.courseId,
      courseName: room.courseName,
      participantCount: room.memberCount ?? room.participantCount ?? 0,
      lastMessage: room.lastMessage ? this.mapChatMessage(room.lastMessage) : undefined,
      unreadCount: room.unreadCount ?? 0
    };
  }

  private mapChatMessage(msg: any): ChatMessage {
    return {
      id: msg.id,
      roomId: msg.chatRoomId || msg.roomId || '',
      senderId: msg.senderId,
      senderName: msg.senderName || '',
      senderPhotoUrl: msg.senderProfileImage || msg.senderPhotoUrl,
      content: msg.content || '',
      createdAt: msg.createdAt,
      isRead: msg.isRead ?? false
    };
  }

  createCourseChat(courseId: string): Observable<ChatRoom | null> {
    return this.http.post<any>(`${this.apiUrl}/chat/rooms/course/${courseId}`, {}).pipe(
      map(response => response.isSuccess && response.data ? this.mapChatRoom(response.data) : null),
      catchError(() => of(null))
    );
  }

  // Students
  getMyStudents(): Observable<InstructorStudent[]> {
    return this.http.get<any>(`${this.apiUrl}/dashboard/instructor/students`).pipe(
      map(response => response.isSuccess ? response.data : []),
      catchError(() => of([]))
    );
  }

  getStudentDetails(studentId: string): Observable<InstructorStudent | null> {
    return this.http.get<any>(`${this.apiUrl}/dashboard/instructor/students/${studentId}`).pipe(
      map(response => response.isSuccess ? response.data : null),
      catchError(() => of(null))
    );
  }

  // Earnings
  getEarnings(): Observable<EarningsData | null> {
    return this.http.get<any>(`${this.apiUrl}/dashboard/instructor/earnings`).pipe(
      map(response => response.isSuccess ? response.data : null),
      catchError(() => of(null))
    );
  }

  // Live Sessions
  getLiveSessions(): Observable<LiveSessionDto[]> {
    return this.http.get<any>(`${this.apiUrl}/dashboard/instructor/live-sessions`).pipe(
      map(response => response.isSuccess ? response.data : []),
      catchError(() => of([]))
    );
  }

  createLiveSession(dto: any): Observable<LiveSessionDto> {
    return this.http.post<any>(`${this.apiUrl}/dashboard/instructor/live-sessions`, dto).pipe(
      map(response => response.isSuccess ? response.data : null),
      catchError(() => of(null as any))
    );
  }

  updateLiveSession(sessionId: string, dto: any): Observable<LiveSessionDto> {
    return this.http.put<any>(`${this.apiUrl}/dashboard/instructor/live-sessions/${sessionId}`, dto).pipe(
      map(response => response.isSuccess ? response.data : null),
      catchError(() => of(null as any))
    );
  }

  deleteLiveSession(sessionId: string): Observable<boolean> {
    return this.http.delete<any>(`${this.apiUrl}/dashboard/instructor/live-sessions/${sessionId}`).pipe(
      map(response => response.isSuccess),
      catchError(() => of(false))
    );
  }

  // Quizzes - Get quizzes for instructor's courses
  getMyQuizzes(): Observable<any[]> {
    // First get instructor's courses, then get quizzes for each
    return this.getMyCourses().pipe(
      map(courses => courses.map(c => c.id)),
      catchError(() => of([]))
    );
  }

  getCourseQuizzes(courseId: string): Observable<any[]> {
    return this.http.get<any>(`${this.apiUrl}/quizzes/course/${courseId}`).pipe(
      map(response => response.isSuccess ? response.data : []),
      catchError(() => of([]))
    );
  }

  createQuiz(courseId: string, dto: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/quizzes`, { ...dto, courseId }).pipe(
      map(response => response.isSuccess ? response.data : null),
      catchError(() => of(null))
    );
  }

  updateQuiz(quizId: string, dto: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/quizzes/${quizId}`, dto).pipe(
      map(response => response.isSuccess ? response.data : null),
      catchError(() => of(null))
    );
  }

  deleteQuiz(quizId: string): Observable<boolean> {
    return this.http.delete<any>(`${this.apiUrl}/quizzes/${quizId}`).pipe(
      map(response => response.isSuccess),
      catchError(() => of(false))
    );
  }

  getQuizQuestions(quizId: string): Observable<any[]> {
    return this.http.get<any>(`${this.apiUrl}/quizzes/${quizId}/questions`).pipe(
      map(response => response.isSuccess ? response.data : []),
      catchError(() => of([]))
    );
  }

  saveQuizQuestions(quizId: string, questions: any[]): Observable<boolean> {
    return this.http.put<any>(`${this.apiUrl}/quizzes/${quizId}/questions`, questions).pipe(
      map(response => response.isSuccess),
      catchError(() => of(false))
    );
  }

  // Quiz publish/unpublish - use update quiz with isActive flag
  toggleQuizPublish(quizId: string, publish: boolean): Observable<boolean> {
    return this.http.put<any>(`${this.apiUrl}/quizzes/${quizId}`, { isActive: publish }).pipe(
      map(response => response.isSuccess),
      catchError(() => of(false))
    );
  }

  // Modules helper
  getCourseModules(courseId: string): Observable<any[]> {
    return this.http.get<any>(`${this.apiUrl}/courses/${courseId}/modules`).pipe(
      map(response => response.isSuccess ? response.data : []),
      catchError(() => of([]))
    );
  }

  // Categories
  getCategories(): Observable<any[]> {
    return this.http.get<any>(`${this.apiUrl}/courses/categories`).pipe(
      map(response => response.isSuccess ? response.data : []),
      catchError(() => of([]))
    );
  }
}
