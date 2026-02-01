import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../services/auth.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const toastr = inject(ToastrService);
  const authService = inject(AuthService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'An unexpected error occurred';

      if (error.error) {
        if (error.error.message) {
          errorMessage = error.error.message;
        } else if (error.error.messageEn) {
          errorMessage = error.error.messageEn;
        }
      }

      // Skip logout for refresh token requests to avoid logout loops
      const isRefreshRequest = req.url.includes('refresh-token');
      const isAuthRequest = req.url.includes('/auth/');
      const isLogoutRequest = req.url.includes('/logout');

      switch (error.status) {
        case 401:
          // Only logout if it's not a refresh token, auth, or logout request
          if (!isRefreshRequest && !isAuthRequest && !isLogoutRequest) {
            authService.logout();
            router.navigate(['/auth/login']);
          }
          errorMessage = 'Please login to continue';
          break;
        case 403:
          errorMessage = 'You do not have permission to access this resource';
          break;
        case 404:
          errorMessage = 'Resource not found';
          break;
        case 500:
          errorMessage = 'Server error. Please try again later';
          break;
      }

      // Don't show error toast for auth requests (login handles its own errors)
      if (!isAuthRequest) {
        toastr.error(errorMessage);
      }
      
      return throwError(() => error);
    })
  );
};
