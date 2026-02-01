import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, BehaviorSubject } from 'rxjs';
import { environment } from '@environments/environment';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  firstNameAr?: string;
  lastNameAr?: string;
  fullName: string;
  phone?: string;
  phoneNumber?: string;
  profileImageUrl?: string;
  bio?: string;
  bioAr?: string;
  role: 'Admin' | 'Instructor' | 'Student';
  isEmailVerified: boolean;
  preferredLanguage: string;
  xpPoints: number;
  createdAt: string;
  // Extended profile fields
  expertise?: string;
  linkedInUrl?: string;
  twitterUrl?: string;
  websiteUrl?: string;
  gitHubUrl?: string;
  portfolioUrl?: string;
  cvUrl?: string;
  country?: string;
  city?: string;
  timezone?: string;
  language?: string;
  notificationsEnabled?: boolean;
  emailNotifications?: boolean;
}

export interface AuthResponse {
  isSuccess: boolean;
  message?: string;
  messageAr?: string;
  token?: string;
  refreshToken?: string;
  tokenExpiry?: string;
  user?: User;
}

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterRequest {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  phone?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  
  private readonly API_URL = `${environment.apiUrl}/auth`;
  private readonly TOKEN_KEY = 'techmaster_token';
  private readonly REFRESH_TOKEN_KEY = 'techmaster_refresh_token';
  private readonly USER_KEY = 'techmaster_user';

  private currentUserSubject = new BehaviorSubject<User | null>(this.loadUser());
  currentUser$ = this.currentUserSubject.asObservable();

  private loadUser(): User | null {
    const userJson = localStorage.getItem(this.USER_KEY);
    return userJson ? JSON.parse(userJson) : null;
  }

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/login`, request).pipe(
      tap(response => {
        if (response.isSuccess && response.token && response.user) {
          this.setSession(response);
        }
      })
    );
  }

  register(request: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/register`, request).pipe(
      tap(response => {
        if (response.isSuccess && response.token && response.user) {
          this.setSession(response);
        }
      })
    );
  }

  googleLogin(idToken: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/google`, { idToken }).pipe(
      tap(response => {
        if (response.isSuccess && response.token && response.user) {
          this.setSession(response);
        }
      })
    );
  }

  refreshToken(): Observable<AuthResponse> {
    const refreshToken = localStorage.getItem(this.REFRESH_TOKEN_KEY);
    return this.http.post<AuthResponse>(`${this.API_URL}/refresh-token`, { refreshToken }).pipe(
      tap(response => {
        if (response.isSuccess && response.token && response.user) {
          this.setSession(response);
        }
      })
    );
  }

  forgotPassword(email: string): Observable<any> {
    return this.http.post(`${this.API_URL}/forgot-password`, { email });
  }

  resetPassword(token: string, password: string): Observable<any> {
    return this.http.post(`${this.API_URL}/reset-password`, { token, newPassword: password, confirmNewPassword: password });
  }

  changePassword(currentPassword: string, newPassword: string): Observable<any> {
    return this.http.post(`${this.API_URL}/change-password`, { currentPassword, newPassword, confirmNewPassword: newPassword });
  }

  updateProfile(data: Partial<User>): Observable<AuthResponse> {
    return this.http.put<AuthResponse>(`${this.API_URL}/profile`, data).pipe(
      tap((response: AuthResponse) => {
        if (response.isSuccess) {
          const currentUser = this.currentUserSubject.value;
          if (currentUser) {
            // If server returns updated user, use that; otherwise merge with sent data
            const updatedUser = response.user 
              ? { ...currentUser, ...response.user }
              : { ...currentUser, ...data };
            localStorage.setItem(this.USER_KEY, JSON.stringify(updatedUser));
            this.currentUserSubject.next(updatedUser);
          }
        }
      })
    );
  }

  /**
   * Refresh user data from API
   */
  refreshUserFromApi(): Observable<any> {
    return this.http.get<any>(`${this.API_URL}/me`).pipe(
      tap((response: any) => {
        if (response.isSuccess && response.data) {
          const currentUser = this.currentUserSubject.value;
          if (currentUser) {
            const updatedUser = { ...currentUser, ...response.data };
            localStorage.setItem(this.USER_KEY, JSON.stringify(updatedUser));
            this.currentUserSubject.next(updatedUser);
          }
        }
      })
    );
  }

  logout(): void {
    // Clear session first to prevent 401 loops
    this.clearSession();
    // Try to notify server (ignore errors as we're already logged out locally)
    this.http.post(`${this.API_URL}/logout`, {}).subscribe({
      error: () => {} // Ignore logout API errors
    });
    this.router.navigate(['/']);
  }

  private setSession(response: AuthResponse): void {
    console.log('setSession called with:', response);
    console.log('Has token:', !!response.token);
    console.log('Has refreshToken:', !!response.refreshToken);
    console.log('Has user:', !!response.user);
    
    if (response.token && response.refreshToken && response.user) {
      localStorage.setItem(this.TOKEN_KEY, response.token);
      localStorage.setItem(this.REFRESH_TOKEN_KEY, response.refreshToken);
      localStorage.setItem(this.USER_KEY, JSON.stringify(response.user));
      this.currentUserSubject.next(response.user);
      console.log('Session saved successfully. Token in localStorage:', !!localStorage.getItem(this.TOKEN_KEY));
    } else {
      console.error('Session not saved - missing required data');
    }
  }

  private clearSession(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUserSubject.next(null);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isAdmin(): boolean {
    return this.getCurrentUser()?.role === 'Admin';
  }

  isInstructor(): boolean {
    return this.getCurrentUser()?.role === 'Instructor';
  }

  isStudent(): boolean {
    return this.getCurrentUser()?.role === 'Student';
  }
}
