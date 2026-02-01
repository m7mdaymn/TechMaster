import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';
import { instructorGuard } from './core/guards/instructor.guard';
import { studentGuard } from './core/guards/student.guard';

export const routes: Routes = [
  // Public routes with header/footer
  {
    path: '',
    loadComponent: () => import('./layouts/public-layout/public-layout.component').then(m => m.PublicLayoutComponent),
    children: [
      {
        path: '',
        loadComponent: () => import('./features/landing/landing.component').then(m => m.LandingComponent)
      },
      {
        path: 'courses',
        loadComponent: () => import('./features/courses/courses-list/courses-list.component').then(m => m.CoursesListComponent)
      },
      {
        path: 'courses/:slug',
        loadComponent: () => import('./features/courses/course-detail/course-detail.component').then(m => m.CourseDetailComponent)
      },
      {
        path: 'internships',
        loadComponent: () => import('./features/internships/internships-list/internships-list.component').then(m => m.InternshipsListComponent)
      },
      {
        path: 'internships/:slug',
        loadComponent: () => import('./features/internships/internship-detail/internship-detail.component').then(m => m.InternshipDetailComponent)
      },
      {
        path: 'library',
        loadComponent: () => import('./features/library/library-list/library-list.component').then(m => m.LibraryListComponent)
      },
      {
        path: 'contact',
        loadComponent: () => import('./features/contact/contact.component').then(m => m.ContactComponent)
      },
      {
        path: 'about',
        loadComponent: () => import('./features/about/about.component').then(m => m.AboutComponent)
      },
      {
        path: 'verify-certificate/:number',
        loadComponent: () => import('./features/certificate/verify-certificate/verify-certificate.component').then(m => m.VerifyCertificateComponent)
      }
    ]
  },

  // Auth routes (no header/footer)
  {
    path: 'auth',
    children: [
      {
        path: 'login',
        loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
      },
      {
        path: 'register',
        loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent)
      },
      {
        path: 'forgot-password',
        loadComponent: () => import('./features/auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent)
      },
      {
        path: 'reset-password',
        loadComponent: () => import('./features/auth/reset-password/reset-password.component').then(m => m.ResetPasswordComponent)
      }
    ]
  },

  // Student routes with student layout
  {
    path: 'student',
    canActivate: [studentGuard],
    loadComponent: () => import('./layouts/student-layout/student-layout.component').then(m => m.StudentLayoutComponent),
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/student/student-dashboard.component').then(m => m.StudentDashboardComponent)
      },
      {
        path: 'my-courses',
        loadComponent: () => import('./features/student/my-courses/my-courses.component').then(m => m.MyCoursesComponent)
      },
      {
        path: 'learn/:courseId',
        loadComponent: () => import('./features/student/learning/learning.component').then(m => m.LearningComponent)
      },
      {
        path: 'quiz/:sessionId',
        loadComponent: () => import('./features/student/quiz/student-quiz.component').then(m => m.StudentQuizComponent)
      },
      {
        path: 'certificates',
        loadComponent: () => import('./features/student/certificates/certificates.component').then(m => m.StudentCertificatesComponent)
      },
      {
        path: 'profile',
        loadComponent: () => import('./features/student/profile/profile.component').then(m => m.ProfileComponent)
      },
      {
        path: 'chat',
        loadComponent: () => import('./features/chat/chat.component').then(m => m.ChatComponent)
      },
      {
        path: 'leaderboard',
        loadComponent: () => import('./features/student/leaderboard/leaderboard.component').then(m => m.LeaderboardComponent)
      },
      {
        path: 'my-internships',
        loadComponent: () => import('./features/student/my-internships/my-internships.component').then(m => m.MyInternshipsComponent)
      },
      {
        path: 'internship-tasks/:internshipId',
        loadComponent: () => import('./features/student/internship-tasks/internship-tasks.component').then(m => m.InternshipTasksComponent)
      }
    ]
  },

  // Instructor routes with instructor layout
  {
    path: 'instructor',
    canActivate: [instructorGuard],
    loadComponent: () => import('./layouts/instructor-layout/instructor-layout.component').then(m => m.InstructorLayoutComponent),
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/instructor/dashboard/instructor-dashboard.component').then(m => m.InstructorDashboardComponent)
      },
      {
        path: 'courses',
        loadComponent: () => import('./features/instructor/courses/courses.component').then(m => m.InstructorCoursesComponent)
      },
      {
        path: 'courses/create',
        loadComponent: () => import('./features/instructor/course-editor/course-editor.component').then(m => m.CourseEditorComponent)
      },
      {
        path: 'courses/:id/edit',
        loadComponent: () => import('./features/instructor/course-editor/course-editor.component').then(m => m.CourseEditorComponent)
      },
      {
        path: 'students',
        loadComponent: () => import('./features/instructor/students/instructor-students.component').then(m => m.InstructorStudentsComponent)
      },
      {
        path: 'earnings',
        loadComponent: () => import('./features/instructor/earnings/instructor-earnings.component').then(m => m.InstructorEarningsComponent)
      },
      {
        path: 'notifications',
        loadComponent: () => import('./features/instructor/notifications/instructor-notifications.component').then(m => m.InstructorNotificationsComponent)
      },
      {
        path: 'chat',
        loadComponent: () => import('./features/instructor/chat/instructor-chat.component').then(m => m.InstructorChatComponent)
      },
      {
        path: 'analytics',
        loadComponent: () => import('./features/instructor/analytics/instructor-analytics.component').then(m => m.InstructorAnalyticsComponent)
      },
      {
        path: 'settings',
        loadComponent: () => import('./features/instructor/settings/instructor-settings.component').then(m => m.InstructorSettingsComponent)
      },
      {
        path: 'live-sessions',
        loadComponent: () => import('./features/instructor/live-sessions/instructor-live-sessions.component').then(m => m.InstructorLiveSessionsComponent)
      }
    ]
  },

  // Admin routes with admin layout
  {
    path: 'admin',
    canActivate: [adminGuard],
    loadComponent: () => import('./layouts/admin-layout/admin-layout.component').then(m => m.AdminLayoutComponent),
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/admin/dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent)
      },
      {
        path: 'users',
        loadComponent: () => import('./features/admin/users/users.component').then(m => m.UsersComponent)
      },
      {
        path: 'courses',
        loadComponent: () => import('./features/admin/courses/admin-courses.component').then(m => m.AdminCoursesComponent)
      },
      {
        path: 'create-course',
        loadComponent: () => import('./features/admin/create-course/admin-create-course.component').then(m => m.AdminCreateCourseComponent)
      },
      {
        path: 'enrollments',
        loadComponent: () => import('./features/admin/enrollments/enrollments.component').then(m => m.EnrollmentsComponent)
      },
      {
        path: 'internships',
        loadComponent: () => import('./features/admin/internships/admin-internships.component').then(m => m.AdminInternshipsComponent)
      },
      {
        path: 'certificates',
        loadComponent: () => import('./features/admin/certificates/admin-certificates.component').then(m => m.AdminCertificatesComponent)
      },
      {
        path: 'library',
        loadComponent: () => import('./features/admin/library/admin-library.component').then(m => m.AdminLibraryComponent)
      },
      {
        path: 'testimonials',
        loadComponent: () => import('./features/admin/testimonials/admin-testimonials.component').then(m => m.AdminTestimonialsComponent)
      },
      {
        path: 'reports',
        loadComponent: () => import('./features/admin/reports/admin-reports.component').then(m => m.AdminReportsComponent)
      },
      {
        path: 'settings',
        loadComponent: () => import('./features/admin/settings/settings.component').then(m => m.SettingsComponent)
      },
      {
        path: 'messages',
        loadComponent: () => import('./features/admin/messages/admin-messages.component').then(m => m.AdminMessagesComponent)
      }
    ]
  },

  // 404
  {
    path: '**',
    loadComponent: () => import('./features/not-found/not-found.component').then(m => m.NotFoundComponent)
  }
];
