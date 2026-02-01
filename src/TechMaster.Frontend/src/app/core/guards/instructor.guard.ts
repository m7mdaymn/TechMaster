import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const instructorGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Only instructors can access instructor pages - NOT admin, NOT students
  if (authService.isAuthenticated() && authService.isInstructor()) {
    return true;
  }

  if (authService.isAuthenticated()) {
    // Redirect based on role
    if (authService.isAdmin()) {
      router.navigate(['/admin/dashboard']);
    } else {
      router.navigate(['/student/dashboard']);
    }
  } else {
    router.navigate(['/auth/login'], { queryParams: { returnUrl: state.url } });
  }
  
  return false;
};
