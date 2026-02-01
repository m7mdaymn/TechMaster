import { Injectable } from '@angular/core';
import { environment } from '@environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MediaService {
  private baseUrl: string;

  constructor() {
    // Remove /api from the API URL to get the base server URL
    this.baseUrl = environment.apiUrl.replace('/api', '');
  }

  /**
   * Resolves a media URL to its full path.
   * Handles relative paths by prepending the API base URL.
   * @param url The URL to resolve (can be relative like /uploads/... or absolute like http://...)
   * @returns The resolved full URL, or empty string if url is null/undefined
   */
  getMediaUrl(url: string | null | undefined): string {
    if (!url) return '';
    
    // If it's already an absolute URL or a data URL, return as-is
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
      return url;
    }
    
    // For relative paths, prepend the base URL
    const separator = url.startsWith('/') ? '' : '/';
    return `${this.baseUrl}${separator}${url}`;
  }

  /**
   * Gets a default placeholder image if the URL is empty
   */
  getImageUrl(url: string | null | undefined, placeholder: string = 'assets/images/placeholder.jpg'): string {
    const resolvedUrl = this.getMediaUrl(url);
    return resolvedUrl || placeholder;
  }

  /**
   * Gets a course thumbnail URL with placeholder fallback
   */
  getCourseThumbnail(url: string | null | undefined): string {
    return this.getImageUrl(url, 'assets/images/course-placeholder.jpg');
  }

  /**
   * Gets a user avatar URL with placeholder fallback
   */
  getAvatarUrl(url: string | null | undefined): string {
    return this.getImageUrl(url, 'assets/images/avatar-placeholder.png');
  }

  /**
   * Gets a video URL with proper path resolution
   */
  getVideoUrl(url: string | null | undefined): string {
    return this.getMediaUrl(url);
  }

  /**
   * Gets a library item thumbnail URL with placeholder fallback
   */
  getLibraryThumbnail(url: string | null | undefined): string {
    return this.getImageUrl(url, 'assets/images/library-placeholder.jpg');
  }
}
