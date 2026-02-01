import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';
import { environment } from '@environments/environment';

export interface LibraryItem {
  id: string;
  title: string;
  titleAr?: string;
  description: string;
  descriptionAr?: string;
  type: 'Article' | 'Tutorial' | 'Video' | 'eBook' | 'Template' | 'Tool' | 'PDF' | 'Document';
  category: string;
  thumbnailUrl: string;
  fileUrl?: string;
  externalUrl?: string;
  authorName: string;
  readTime?: string;
  duration?: string;
  views: number;
  downloads: number;
  likes: number;
  isFree: boolean;
  isPremium: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LibraryCategory {
  id: string;
  name: string;
  nameAr?: string;
  icon: string;
  itemCount: number;
}

export interface LibraryResponse {
  isSuccess: boolean;
  data: {
    items: LibraryItem[];
    totalCount: number;
    pageNumber: number;
    pageSize: number;
    totalPages: number;
  };
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class LibraryService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/library`;

  getItems(pageNumber = 1, pageSize = 20, category?: string, search?: string): Observable<LibraryItem[]> {
    let url = `${this.apiUrl}?pageNumber=${pageNumber}&pageSize=${pageSize}`;
    if (category && category !== 'all') {
      url += `&category=${encodeURIComponent(category)}`;
    }
    if (search) {
      url += `&search=${encodeURIComponent(search)}`;
    }

    return this.http.get<LibraryResponse>(url).pipe(
      map(response => response.isSuccess ? response.data.items : []),
      catchError(error => {
        console.error('Error fetching library items:', error);
        return of([]);
      })
    );
  }

  getItemById(id: string): Observable<LibraryItem | null> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map(response => response.isSuccess ? response.data : null),
      catchError(() => of(null))
    );
  }

  getCategories(): Observable<LibraryCategory[]> {
    return this.http.get<any>(`${this.apiUrl}/categories`).pipe(
      map(response => response.isSuccess ? response.data : []),
      catchError(() => of([]))
    );
  }

  trackDownload(id: string): Observable<boolean> {
    return this.http.post<any>(`${this.apiUrl}/${id}/download`, {}).pipe(
      map(response => response.isSuccess),
      catchError(() => of(false))
    );
  }
}
