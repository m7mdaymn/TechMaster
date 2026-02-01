import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';
import { environment } from '@environments/environment';

export interface UserProgress {
  userId: string;
  xpPoints: number;
  level: number;
  xpToNextLevel: number;
  levelProgress: number;
  rank: number;
  totalBadges: number;
}

export interface Badge {
  id: string;
  name: string;
  nameAr?: string;
  description: string;
  descriptionAr?: string;
  iconUrl: string;
  xpReward: number;
  criteria: string;
  criteriaAr?: string;
  isActive: boolean;
  createdAt: string;
}

export interface UserBadge {
  id: string;
  badge: Badge;
  earnedAt: string;
}

export interface CreateBadgeDto {
  name: string;
  nameAr?: string;
  description: string;
  descriptionAr?: string;
  iconUrl: string;
  xpReward: number;
  criteria: string;
  criteriaAr?: string;
}

@Injectable({
  providedIn: 'root'
})
export class GamificationService {
  private http = inject(HttpClient);
  private readonly API_URL = `${environment.apiUrl}/gamification`;

  // Get user's XP and level progress
  getMyProgress(): Observable<UserProgress | null> {
    return this.http.get<any>(`${this.API_URL}/my-progress`).pipe(
      map(response => response.isSuccess ? response.data : null),
      catchError(() => of(null))
    );
  }

  // Get user's earned badges
  getMyBadges(): Observable<UserBadge[]> {
    return this.http.get<any>(`${this.API_URL}/my-badges`).pipe(
      map(response => response.isSuccess ? response.data : []),
      catchError(() => of([]))
    );
  }

  // Get all available badges
  getAllBadges(): Observable<Badge[]> {
    return this.http.get<any>(`${this.API_URL}/badges`).pipe(
      map(response => response.isSuccess ? response.data : []),
      catchError(() => of([]))
    );
  }

  // Create a badge (Admin only)
  createBadge(data: CreateBadgeDto): Observable<Badge | null> {
    return this.http.post<any>(`${this.API_URL}/badges`, data).pipe(
      map(response => response.isSuccess ? response.data : null),
      catchError(() => of(null))
    );
  }

  // Award XP to user (Admin only)
  awardXp(userId: string, points: number, reason: string): Observable<boolean> {
    return this.http.post<any>(`${this.API_URL}/users/${userId}/xp`, { points, reason }).pipe(
      map(response => response.isSuccess),
      catchError(() => of(false))
    );
  }

  // Get leaderboard
  getLeaderboard(count: number = 100, period: string = 'all'): Observable<Leaderboard | null> {
    return this.http.get<any>(`${this.API_URL}/leaderboard`, {
      params: { count: count.toString(), period }
    }).pipe(
      map(response => response.isSuccess ? response.data : null),
      catchError(() => of(null))
    );
  }

  // Get current user's rank
  getMyRank(): Observable<UserRank | null> {
    return this.http.get<any>(`${this.API_URL}/my-rank`).pipe(
      map(response => response.isSuccess ? response.data : null),
      catchError(() => of(null))
    );
  }
}

export interface LeaderboardEntry {
  userId: string;
  userName: string;
  profileImageUrl?: string;
  totalXp: number;
  level: number;
  rank: number;
  badgeCount: number;
  completedCourses: number;
}

export interface Leaderboard {
  topUsers: LeaderboardEntry[];
  totalParticipants: number;
  period: string;
  generatedAt: string;
}

export interface UserRank {
  rank: number;
  totalXp: number;
  level: number;
  totalParticipants: number;
  xpToNextRank: number;
  nextUser?: LeaderboardEntry;
  previousUser?: LeaderboardEntry;
}
