import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LandingService, FeaturedCourse, Testimonial, Category, PlatformStats, Internship, Instructor } from '@core/services/landing.service';
import { MediaService } from '@core/services/media.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss'
})
export class LandingComponent implements OnInit {
  private landingService = inject(LandingService);
  mediaService = inject(MediaService);

  isLoading = signal(true);
  courses = signal<FeaturedCourse[]>([]);
  categories = signal<Category[]>([]);
  testimonials = signal<Testimonial[]>([]);
  internships = signal<Internship[]>([]);
  instructors = signal<Instructor[]>([]);
  stats = signal<PlatformStats>({
    students: '5,000',
    courses: '100',
    instructors: '50',
    rating: '4.9'
  });

  ngOnInit() {
    this.loadData();
    this.setupScrollAnimations();
  }

  loadData() {
    forkJoin({
      courses: this.landingService.getFeaturedCourses(),
      categories: this.landingService.getCategories(),
      testimonials: this.landingService.getTestimonials(),
      stats: this.landingService.getStats(),
      internships: this.landingService.getInternships(),
      instructors: this.landingService.getInstructors()
    }).subscribe({
      next: (data) => {
        this.courses.set(data.courses || []);
        this.categories.set(data.categories || []);
        this.testimonials.set(data.testimonials || []);
        if (data.stats) {
          this.stats.set(data.stats);
        }
        this.internships.set(data.internships || []);
        this.instructors.set(data.instructors || []);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load landing data', err);
        this.isLoading.set(false);
      }
    });
  }

  setupScrollAnimations() {
    if (typeof window !== 'undefined' && 'IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('animate-on-scroll');
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.1 }
      );

      setTimeout(() => {
        document.querySelectorAll('.animate-on-scroll').forEach((el) => {
          observer.observe(el);
        });
      }, 100);
    }
  }

  // Helper methods for display
  getCourseTitle(course: FeaturedCourse): string {
    return course.title;
  }

  getCourseDescription(course: FeaturedCourse): string {
    return course.description;
  }

  getDurationHours(course: FeaturedCourse): number {
    return Math.round((course.totalDurationMinutes || 0) / 60);
  }

  getCategoryTitle(category: Category): string {
    return category.nameEn;
  }

  getCategoryDescription(category: Category): string {
    return category.descriptionEn || '';
  }

  getTestimonialContent(testimonial: Testimonial): string {
    return testimonial.content;
  }

  getTestimonialAuthor(testimonial: Testimonial): string {
    return testimonial.authorName;
  }

  getTestimonialTitle(testimonial: Testimonial): string {
    return testimonial.authorTitle || '';
  }

  getInstructorName(instructor: Instructor): string {
    return instructor.name;
  }

  getInstructorSpecialty(instructor: Instructor): string {
    return instructor.specialty;
  }

  getInstructorBio(instructor: Instructor): string {
    return instructor.bio;
  }

  getInstructorImage(instructor: Instructor): string {
    return this.mediaService.getAvatarUrl(instructor.profileImageUrl);
  }

  getInstructorStudentCount(instructor: Instructor): string {
    const count = instructor.studentCount || 0;
    if (count >= 1000) {
      return (count / 1000).toFixed(1) + 'K';
    }
    return count.toString();
  }

  getInstructorRating(instructor: Instructor): string {
    return (instructor.rating || 0).toFixed(1);
  }
}
