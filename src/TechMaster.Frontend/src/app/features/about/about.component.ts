import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LandingService, PlatformStats, Instructor } from '@core/services/landing.service';
import { MediaService } from '@core/services/media.service';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="about-page">
      <!-- Hero Section -->
      <section class="hero">
        <div class="hero-bg">
          <div class="grid-pattern"></div>
          <div class="gradient-orb orb-1"></div>
          <div class="gradient-orb orb-2"></div>
          <div class="floating-shapes">
            <div class="shape shape-1"></div>
            <div class="shape shape-2"></div>
            <div class="shape shape-3"></div>
          </div>
        </div>
        <div class="hero-content">
          <div class="badge">
            <span>🏆</span>
            <span>Egypt's #1 Tech Learning Platform</span>
          </div>
          <h1>Empowering the Next Generation of <span class="accent">Tech Leaders</span></h1>
          <p>We're on a mission to make quality tech education accessible to everyone. Join thousands of learners transforming their careers.</p>
          
          <!-- Stats Row -->
          <div class="stats-row">
            <div class="stat-item">
              <span class="stat-num">{{ stats()?.students  }}+</span>
              <span class="stat-label">Students</span>
            </div>
            <div class="stat-item">
              <span class="stat-num">{{ stats()?.courses }}+</span>
              <span class="stat-label">Courses</span>
            </div>
            <div class="stat-item">
              <span class="stat-num">{{ stats()?.instructors }}+</span>
              <span class="stat-label">Instructors</span>
            </div>

          </div>
        </div>
      </section>

      <!-- Mission Section -->
      <section class="mission-section">
        <div class="container">
          <div class="mission-grid">
            <div class="mission-card">
              <h3>Our Mission</h3>
              <p>To democratize technology education and empower individuals with the skills they need to succeed in the digital economy.</p>
            </div>
            <div class="mission-card">
              <h3>Our Vision</h3>
              <p>To become the leading tech education platform in the Middle East, producing world-class developers and innovators.</p>
            </div>
            <div class="mission-card">
              <h3>Our Values</h3>
              <p>Excellence, Innovation, Accessibility, and Community. These principles guide everything we do.</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Story Section -->
      <section class="story-section">
        <div class="container">
          <div class="section-header">
            <div class="section-tag">Our Journey</div>
            <h2>From <span class="accent">Startup</span> to Industry Leader</h2>
          </div>
          <div class="timeline">
            @for (event of timeline; track event.year) {
              <div class="timeline-item">
                <div class="timeline-marker">
                  <span>{{ event.year }}</span>
                </div>
                <div class="timeline-content">
                  <h4>{{ event.title }}</h4>
                  <p>{{ event.description }}</p>
                </div>
              </div>
            }
          </div>
        </div>
      </section>

      <!-- Team Section -->
      <section class="team-section">
        <div class="container">
          <div class="section-header">
            <div class="section-tag">Our Team</div>
            <h2>Meet the <span class="accent">Experts</span></h2>
            <p>Our team of passionate educators and industry professionals</p>
          </div>
          
          <!-- Dynamic Instructors from API -->
          @if (instructors().length > 0) {
            <div class="team-grid">
              @for (instructor of instructors(); track instructor.id) {
                <div class="team-card instructor-card">
                  <div class="instructor-avatar">
                    @if (instructor.profileImageUrl) {
                      <img [src]="getImageUrl(instructor.profileImageUrl)" [alt]="instructor.name">
                    } @else {
                      <span class="avatar-placeholder">{{ instructor.name.charAt(0) }}</span>
                    }
                  </div>
                  <h4>{{ instructor.name }}</h4>
                  <span class="member-role">{{ instructor.specialty || 'Instructor' }}</span>
                  <div class="instructor-stats">
                    <span>📚 {{ instructor.courseCount || 0 }} courses</span>
                    <span>👥 {{ instructor.studentCount || 0 }} students</span>

                  </div>
                </div>
              }
            </div>
          } @else {
            <!-- Fallback static team members -->
            <div class="team-grid">
              @for (member of teamMembers; track member.name) {
                <div class="team-card">
                  <div class="member-avatar">{{ member.avatar }}</div>
                  <h4>{{ member.name }}</h4>
                  <span class="member-role">{{ member.role }}</span>
                </div>
              }
            </div>
          }
        </div>
      </section>

      <!-- Features Section -->
      <section class="features-section">
        <div class="container">
          <div class="section-header">
            <div class="section-tag">Why Choose Us</div>
            <h2>What Makes Us <span class="accent">Different</span></h2>
          </div>
          <div class="features-grid">
            @for (feature of features; track feature.title) {
              <div class="feature-card">
                <div class="feature-icon">{{ feature.icon }}</div>
                <h4>{{ feature.title }}</h4>
                <p>{{ feature.description }}</p>
              </div>
            }
          </div>
        </div>
      </section>

      <!-- Partners Section -->
      <section class="partners-section">
        <div class="container">
          <div class="section-header">
            <div class="section-tag">Trusted By</div>
            <h2>Our <span class="accent">Partners</span></h2>
          </div>
          <div class="partners-slider">
            <div class="partners-track">
              @for (partner of partners; track $index) {
                <div class="partner-logo">{{ partner }}</div>
              }
            </div>
          </div>
        </div>
      </section>

      <!-- CTA Section -->
      <section class="cta-section">
        <div class="container">
          <div class="cta-card">
            <div class="cta-content">
              <h2>Ready to Start Your Journey?</h2>
              <p>Join thousands of learners and transform your career today.</p>
              <div class="cta-buttons">
                <a routerLink="/courses" class="btn-primary">Explore Courses</a>
                <a routerLink="/contact" class="btn-secondary">Contact Us</a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  `,
  styles: [`
    :host {
      --primary: #247090;
      --primary-dark: #1a5570;
      --primary-light: #3498db;
      --dark: #0f172a;
      --dark-light: #1e293b;
      --gray-100: #f8fafc;
      --gray-200: #e2e8f0;
      --gray-400: #94a3b8;
      --gray-600: #475569;
      --white: #fff;
      --radius: 16px;
      --shadow: 0 4px 20px rgba(0,0,0,0.08);
    }

    .about-page {
      background: var(--gray-100);
      overflow-x: hidden;
    }

    .container {
      max-width: 1280px;
      margin: 0 auto;
      padding: 0 1.5rem;
    }

    .section-tag {
      display: inline-block;
      padding: 0.5rem 1rem;
      background: rgba(36,112,144,0.1);
      color: var(--primary);
      border-radius: 100px;
      font-size: 0.875rem;
      font-weight: 600;
      text-transform: uppercase;
      margin-bottom: 1rem;
    }

    .section-header {
      text-align: center;
      margin-bottom: 3rem;
    }

    .section-header h2 {
      font-size: 2.5rem;
      font-weight: 800;
      color: var(--dark);
      margin-bottom: 0.5rem;
    }

    .section-header p {
      color: var(--gray-600);
      font-size: 1.125rem;
    }

    .accent {
      background: linear-gradient(135deg, var(--primary), var(--primary-light));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    /* Hero */
    .hero {
      position: relative;
      padding: 8rem 2rem 6rem;
      background: var(--dark);
      overflow: hidden;
    }

    .hero-bg {
      position: absolute;
      inset: 0;
    }

    .grid-pattern {
      position: absolute;
      inset: 0;
      background-image: linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
      background-size: 50px 50px;
    }

    .gradient-orb {
      position: absolute;
      border-radius: 50%;
      filter: blur(100px);
    }

    .orb-1 {
      width: 600px;
      height: 600px;
      background: rgba(36,112,144,0.3);
      top: -200px;
      right: -100px;
    }

    .orb-2 {
      width: 400px;
      height: 400px;
      background: rgba(52,152,219,0.2);
      bottom: -100px;
      left: 10%;
    }

    .floating-shapes .shape {
      position: absolute;
      border-radius: 50%;
      background: rgba(255,255,255,0.05);
      animation: floatAnim 6s ease-in-out infinite;
    }

    .shape-1 { width: 100px; height: 100px; top: 20%; left: 10%; animation-delay: 0s; }
    .shape-2 { width: 60px; height: 60px; top: 60%; left: 5%; animation-delay: 2s; }
    .shape-3 { width: 80px; height: 80px; top: 30%; right: 10%; animation-delay: 4s; }

    @keyframes floatAnim {
      0%, 100% { transform: translateY(0) rotate(0deg); }
      50% { transform: translateY(-20px) rotate(10deg); }
    }

    .hero-content {
      position: relative;
      z-index: 1;
      text-align: center;
      max-width: 900px;
      margin: 0 auto;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.625rem 1.25rem;
      background: rgba(255,255,255,0.1);
      border: 1px solid rgba(255,255,255,0.2);
      border-radius: 100px;
      color: var(--white);
      font-size: 0.875rem;
      margin-bottom: 2rem;
    }

    .hero h1 {
      font-size: 3.5rem;
      font-weight: 800;
      color: var(--white);
      line-height: 1.2;
      margin-bottom: 1.5rem;
    }

    .hero p {
      font-size: 1.25rem;
      color: rgba(255,255,255,0.8);
      line-height: 1.7;
      margin-bottom: 3rem;
    }

    .stats-row {
      display: flex;
      justify-content: center;
      gap: 4rem;
      flex-wrap: wrap;
    }

    .stat-item {
      text-align: center;
    }

    .stat-num {
      display: block;
      font-size: 2.5rem;
      font-weight: 800;
      color: var(--white);
    }

    .stat-label {
      color: rgba(255,255,255,0.6);
      font-size: 0.9rem;
    }

    /* Mission */
    .mission-section {
      padding: 5rem 0;
      margin-top: -60px;
      position: relative;
      z-index: 10;
    }

    .mission-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 2rem;
    }

    .mission-card {
      background: var(--white);
      border-radius: var(--radius);
      padding: 2.5rem;
      text-align: center;
      box-shadow: var(--shadow);
      transition: transform 0.3s;
    }

    .mission-card:hover {
      transform: translateY(-4px);
    }

    .card-icon {
      font-size: 3rem;
      margin-bottom: 1.5rem;
    }

    .mission-card h3 {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--dark);
      margin-bottom: 0.75rem;
    }

    .mission-card p {
      color: var(--gray-600);
      line-height: 1.7;
    }

    /* Story */
    .story-section {
      padding: 5rem 0;
      background: var(--white);
    }

    .timeline {
      max-width: 800px;
      margin: 0 auto;
      position: relative;
    }

    .timeline::before {
      content: '';
      position: absolute;
      left: 50%;
      transform: translateX(-50%);
      width: 2px;
      height: 100%;
      background: var(--gray-200);
    }

    .timeline-item {
      display: flex;
      align-items: flex-start;
      margin-bottom: 3rem;
    }

    .timeline-item:nth-child(odd) {
      flex-direction: row-reverse;
    }

    .timeline-marker {
      flex-shrink: 0;
      width: 80px;
      height: 80px;
      background: linear-gradient(135deg, var(--primary), var(--primary-light));
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--white);
      font-weight: 800;
      font-size: 1.25rem;
      position: relative;
      z-index: 1;
    }

    .timeline-content {
      flex: 1;
      padding: 0 2rem;
      max-width: 300px;
    }

    .timeline-content h4 {
      font-size: 1.125rem;
      font-weight: 700;
      color: var(--dark);
      margin-bottom: 0.5rem;
    }

    .timeline-content p {
      color: var(--gray-600);
      font-size: 0.9rem;
    }

    /* Team */
    .team-section {
      padding: 5rem 0;
    }

    .team-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 2rem;
    }

    .team-card {
      background: var(--white);
      border-radius: var(--radius);
      padding: 2rem;
      text-align: center;
      box-shadow: var(--shadow);
    }

    .member-avatar {
      width: 80px;
      height: 80px;
      background: linear-gradient(135deg, var(--primary), var(--primary-light));
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2rem;
      margin: 0 auto 1rem;
    }

    .instructor-card .instructor-avatar {
      width: 100px;
      height: 100px;
      border-radius: 50%;
      overflow: hidden;
      margin: 0 auto 1rem;
      border: 3px solid var(--primary);
    }

    .instructor-avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .instructor-avatar .avatar-placeholder {
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, var(--primary), var(--primary-light));
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2.5rem;
      color: var(--white);
      font-weight: 700;
    }

    .instructor-stats {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 0.75rem;
      margin-top: 0.75rem;
      font-size: 0.8rem;
      color: var(--gray-600);
    }

    .instructor-stats span {
      background: var(--gray-100);
      padding: 0.25rem 0.5rem;
      border-radius: 8px;
    }

    .team-card h4 {
      font-size: 1rem;
      font-weight: 700;
      color: var(--dark);
      margin-bottom: 0.25rem;
    }

    .member-role {
      color: var(--primary);
      font-size: 0.85rem;
      font-weight: 500;
    }

    /* Features */
    .features-section {
      padding: 5rem 0;
      background: var(--white);
    }

    .features-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 2rem;
    }

    .feature-card {
      padding: 2rem;
      border-radius: var(--radius);
      background: var(--gray-100);
      transition: all 0.3s;
    }

    .feature-card:hover {
      background: rgba(36,112,144,0.1);
    }

    .feature-icon {
      font-size: 2.5rem;
      margin-bottom: 1rem;
    }

    .feature-card h4 {
      font-size: 1.125rem;
      font-weight: 700;
      color: var(--dark);
      margin-bottom: 0.5rem;
    }

    .feature-card p {
      color: var(--gray-600);
      font-size: 0.9rem;
      line-height: 1.6;
    }

    /* Partners */
    .partners-section {
      padding: 5rem 0;
    }

    .partners-slider {
      overflow: hidden;
    }

    .partners-track {
      display: flex;
      gap: 3rem;
      animation: scrollPartners 20s linear infinite;
    }

    @keyframes scrollPartners {
      0% { transform: translateX(0); }
      100% { transform: translateX(-50%); }
    }

    .partner-logo {
      flex-shrink: 0;
      padding: 1.5rem 2.5rem;
      background: var(--white);
      border-radius: var(--radius);
      font-weight: 700;
      color: var(--gray-600);
      box-shadow: var(--shadow);
    }

    /* CTA */
    .cta-section {
      padding: 4rem 0 6rem;
    }

    .cta-card {
      background: linear-gradient(135deg, var(--dark), var(--dark-light));
      border-radius: 24px;
      padding: 4rem;
      text-align: center;
    }

    .cta-content h2 {
      font-size: 2.5rem;
      font-weight: 800;
      color: var(--white);
      margin-bottom: 0.75rem;
    }

    .cta-content p {
      color: rgba(255,255,255,0.8);
      font-size: 1.125rem;
      margin-bottom: 2rem;
    }

    .cta-buttons {
      display: flex;
      gap: 1rem;
      justify-content: center;
    }

    .btn-primary {
      padding: 1rem 2rem;
      background: var(--primary);
      color: var(--white);
      border-radius: var(--radius);
      font-weight: 600;
      text-decoration: none;
      transition: all 0.3s;
    }

    .btn-primary:hover { background: var(--primary-dark); }

    .btn-secondary {
      padding: 1rem 2rem;
      background: rgba(255,255,255,0.1);
      color: var(--white);
      border: 1px solid rgba(255,255,255,0.2);
      border-radius: var(--radius);
      font-weight: 600;
      text-decoration: none;
      transition: all 0.3s;
    }

    .btn-secondary:hover { background: rgba(255,255,255,0.2); }

    /* Responsive */
    @media (max-width: 1024px) {
      .mission-grid, .features-grid { grid-template-columns: 1fr; }
      .team-grid { grid-template-columns: repeat(2, 1fr); }
    }

    @media (max-width: 768px) {
      .hero { padding: 6rem 1.5rem 4rem; }
      .hero h1 { font-size: 2rem; }
      .stats-row { gap: 2rem; }
      .stat-num { font-size: 1.75rem; }
      .timeline::before { left: 0; }
      .timeline-item { flex-direction: column !important; }
      .timeline-marker { margin-bottom: 1rem; }
      .timeline-content { padding: 0; max-width: 100%; }
      .team-grid { grid-template-columns: 1fr; }
      .section-header h2 { font-size: 2rem; }
      .cta-card { padding: 2.5rem 1.5rem; }
      .cta-content h2 { font-size: 1.75rem; }
      .cta-buttons { flex-direction: column; }
    }
  `]
})
export class AboutComponent implements OnInit {
  private landingService = inject(LandingService);
  private mediaService = inject(MediaService);

  stats = signal<PlatformStats | null>(null);
  instructors = signal<Instructor[]>([]);

  teamMembers = [
    { name: 'Ahmed Hassan', role: 'Founder & CEO', avatar: '👨‍💼' },
    { name: 'Sara Mohamed', role: 'CTO', avatar: '👩‍💻' },
    { name: 'Omar Khaled', role: 'Lead Instructor', avatar: '👨‍🏫' },
    { name: 'Nour Ahmed', role: 'Product Manager', avatar: '👩‍💼' }
  ];

  timeline = [
    { year: '2020', title: 'Founded', description: 'TechMaster was born with a vision to transform tech education.' },
    { year: '2021', title: 'First 1000 Students', description: 'Reached our first milestone of 1000 enrolled students.' },
    { year: '2022', title: 'Expanded Team', description: 'Grew to 20+ instructors and launched 50+ courses.' },
    { year: '2023', title: 'Industry Recognition', description: 'Named top tech education platform in the region.' },
    { year: '2024', title: 'Global Reach', description: 'Expanded to serve students across the Middle East.' }
  ];

  features = [
    { icon: '🎓', title: 'Expert Instructors', description: 'Learn from industry professionals with real-world experience.' },
    { icon: '📱', title: 'Learn Anywhere', description: 'Access courses on any device, anytime, anywhere.' },
    { icon: '🏆', title: 'Certificates', description: 'Earn recognized certificates upon course completion.' },
    { icon: '💬', title: 'Community Support', description: 'Join our active community of learners and mentors.' },
    { icon: '🔄', title: 'Lifetime Access', description: 'Get unlimited access to all course materials forever.' },
    { icon: '💼', title: 'Career Services', description: 'Get help with job placement and career growth.' }
  ];

  partners = ['Microsoft', 'Google', 'Amazon AWS', 'Meta', 'IBM', 'Oracle', 'Microsoft', 'Google'];

  ngOnInit() {
    this.loadStats();
    this.loadInstructors();
  }

  loadStats() {
    this.landingService.getStats().subscribe({
      next: (stats) => this.stats.set(stats),
      error: () => {}
    });
  }

  loadInstructors() {
    this.landingService.getInstructors(8).subscribe({
      next: (instructors) => this.instructors.set(instructors || []),
      error: () => {} // Silently fail, will show static team
    });
  }

  getImageUrl(url: string | undefined): string {
    return this.mediaService.getImageUrl(url || '');
  }
}
