import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';
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
  profileImageUrl?: string;
  bio?: string;
  bioAr?: string;
  role: 'Admin' | 'Instructor' | 'Student';
  isEmailVerified: boolean;
  isActive: boolean;
  preferredLanguage: string;
  xpPoints: number;
  createdAt: string;
  lastLoginAt?: string;
}

export interface CreateUserDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  firstNameAr?: string;
  lastNameAr?: string;
  phone?: string;
  role: 'Admin' | 'Instructor' | 'Student';
}

export interface UpdateUserDto {
  firstName?: string;
  lastName?: string;
  firstNameAr?: string;
  lastNameAr?: string;
  phone?: string;
  bio?: string;
  bioAr?: string;
  preferredLanguage?: string;
}

export interface PaginatedResult<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/dashboard/admin`;

  // Get all users (Admin only)
  getUsers(params?: {
    pageNumber?: number;
    pageSize?: number;
    role?: string;
    search?: string;
    isActive?: boolean;
  }): Observable<PaginatedResult<User>> {
    let httpParams = new HttpParams();
    if (params?.pageNumber) httpParams = httpParams.set('pageNumber', params.pageNumber.toString());
    if (params?.pageSize) httpParams = httpParams.set('pageSize', params.pageSize.toString());
    if (params?.role) httpParams = httpParams.set('role', params.role);
    if (params?.search) httpParams = httpParams.set('search', params.search);
    if (params?.isActive !== undefined) httpParams = httpParams.set('isActive', params.isActive.toString());

    return this.http.get<any>(`${this.API_URL}/users`, { params: httpParams }).pipe(
      map(response => response.isSuccess ? response.data : { items: [], totalCount: 0, pageNumber: 1, pageSize: 20, totalPages: 0 }),
      catchError(() => of({ items: [], totalCount: 0, pageNumber: 1, pageSize: 20, totalPages: 0 }))
    );
  }

  // Update user role (Admin only)
  updateUserRole(userId: string, role: string): Observable<boolean> {
    return this.http.put<any>(`${this.API_URL}/users/${userId}/role`, { role }).pipe(
      map(response => response.isSuccess),
      catchError(() => of(false))
    );
  }

  // Toggle user status (Admin only)
  toggleUserStatus(userId: string, isActive: boolean): Observable<boolean> {
    return this.http.put<any>(`${this.API_URL}/users/${userId}/status`, { isActive }).pipe(
      map(response => response.isSuccess),
      catchError(() => of(false))
    );
  }

  // Create new user (Admin only)
  createUser(userData: CreateUserDto): Observable<User | null> {
    return this.http.post<any>(`${this.API_URL}/users`, userData).pipe(
      map(response => response.isSuccess ? response.data : null),
      catchError(() => of(null))
    );
  }

  // Delete user (Admin only)
  deleteUser(userId: string): Observable<boolean> {
    return this.http.delete<any>(`${this.API_URL}/users/${userId}`).pipe(
      map(response => response.isSuccess),
      catchError(() => of(false))
    );
  }

  // Get user by ID
  getUser(userId: string): Observable<User | null> {
    return this.http.get<any>(`${this.API_URL}/users/${userId}`).pipe(
      map(response => response.isSuccess ? response.data : null),
      catchError(() => of(null))
    );
  }

  // Update profile
  updateProfile(data: UpdateUserDto): Observable<boolean> {
    return this.http.put<any>(`${environment.apiUrl}/auth/profile`, data).pipe(
      map(response => response.isSuccess),
      catchError(() => of(false))
    );
  }

  // Change password
  changePassword(currentPassword: string, newPassword: string): Observable<{ success: boolean; message: string }> {
    return this.http.post<any>(`${environment.apiUrl}/auth/change-password`, {
      currentPassword,
      newPassword,
      confirmNewPassword: newPassword
    }).pipe(
      map(response => ({
        success: response.isSuccess,
        message: response.message || 'Password changed successfully'
      })),
      catchError(error => of({
        success: false,
        message: error.error?.message || 'Failed to change password'
      }))
    );
  }
}
