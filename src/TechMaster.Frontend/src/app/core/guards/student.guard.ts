import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const studentGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Only students can access student pages - NOT admin, NOT instructors
  if (authService.isAuthenticated() && authService.isStudent()) {
    return true;
  }

  if (authService.isAuthenticated()) {
    // Redirect based on role
    if (authService.isAdmin()) {
      router.navigate(['/admin/dashboard']);
    } else if (authService.isInstructor()) {
      router.navigate(['/instructor/dashboard']);
    } else {
      // Fallback for any other role
      router.navigate(['/']);
    }
  } else {
    router.navigate(['/auth/login'], { queryParams: { returnUrl: state.url } });
  }
  
  return false;
};
