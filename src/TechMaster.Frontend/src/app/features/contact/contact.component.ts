import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { LandingService, FAQ as ApiFAQ } from '@core/services/landing.service';
import { environment } from '@environments/environment';

interface FAQ {
  question: string;
  answer: string;
  isOpen?: boolean;
}

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="contact-page">
      <!-- Hero Section -->
      <section class="hero">
        <div class="hero-bg">
          <div class="grid-pattern"></div>
          <div class="gradient-overlay"></div>
        </div>
        <div class="hero-content">
          <div class="badge">
            <span>💬</span>
            <span>We're Here to Help</span>
          </div>
          <h1>Get in <span class="accent">Touch</span></h1>
          <p>Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.</p>
        </div>
      </section>

      <!-- Contact Cards Section -->
      <section class="contact-cards-section">
        <div class="container">
          <div class="cards-grid">
            <div class="contact-card">
              <div class="card-icon">📍</div>
              <h3>Visit Us</h3>
              <p>Cairo, Egypt<br></p>
            </div>
            <div class="contact-card">
              <div class="card-icon">📧</div>
              <h3>Email Us</h3>
              <p><a [href]="'mailto:' + contactEmail()">{{ contactEmail() }}</a></p>
            </div>
            <div class="contact-card highlight">
              <div class="card-icon">💬</div>
              <h3>WhatsApp</h3>
              <a [href]="'https://wa.me/' + whatsappNumber()" target="_blank" class="whatsapp-btn">
                Chat Now <span>→</span>
              </a>
            </div>
            <div class="contact-card">
              <div class="card-icon">📞</div>
              <h3>Call Us</h3>
              <p><a [href]="'tel:' + contactPhone()">{{ contactPhone() }}</a></p>
            </div>
          </div>
        </div>
      </section>

      <!-- Main Contact Section -->
      <section class="main-contact-section">
        <div class="container">
          <div class="contact-grid">
            <!-- Contact Form -->
            <div class="form-wrapper">
              <div class="form-header">
                <h2>Send us a Message</h2>
                <p>Fill out the form below and we'll get back to you within 24 hours.</p>
              </div>
              <form (ngSubmit)="submitForm()" #contactForm="ngForm">
                <div class="form-row">
                  <div class="form-group">
                    <label>Full Name *</label>
                    <input type="text" [(ngModel)]="form.name" name="name" required placeholder="John Doe">
                  </div>
                  <div class="form-group">
                    <label>Email Address *</label>
                    <input type="email" [(ngModel)]="form.email" name="email" required placeholder="john&#64;example.com">
                  </div>
                </div>

                <div class="form-row">
                  <div class="form-group">
                    <label>Phone Number</label>
                    <input type="tel" [(ngModel)]="form.phone" name="phone" placeholder="+20 XXX XXX XXXX">
                  </div>
                  <div class="form-group">
                    <label>Subject *</label>
                    <select [(ngModel)]="form.subject" name="subject" required>
                      <option value="">Select a subject</option>
                      <option value="general">General Inquiry</option>
                      <option value="courses">Courses Information</option>
                      <option value="payment">Payment Issues</option>
                      <option value="technical">Technical Support</option>
                      <option value="partnership">Partnership</option>
                      <option value="careers">Careers</option>
                    </select>
                  </div>
                </div>

                <div class="form-group">
                  <label>Your Message *</label>
                  <textarea [(ngModel)]="form.message" name="message" rows="5" required placeholder="How can we help you?"></textarea>
                </div>

                <button type="submit" class="submit-btn" [disabled]="isSubmitting() || !contactForm.valid">
                  @if (isSubmitting()) {
                    <span class="spinner"></span>
                    Sending...
                  } @else {
                    Send Message <span>→</span>
                  }
                </button>
              </form>
            </div>

            <!-- Info Side -->
            <div class="info-wrapper">
              <div class="info-card">
                <h3>Why Contact Us?</h3>
                <div class="reason-list">
                  <div class="reason">
                    <span class="icon">✓</span>
                    <span>Get personalized course recommendations</span>
                  </div>
                  <div class="reason">
                    <span class="icon">✓</span>
                    <span>Learn about enterprise training solutions</span>
                  </div>
                  <div class="reason">
                    <span class="icon">✓</span>
                    <span>Discuss partnership opportunities</span>
                  </div>
                  <div class="reason">
                    <span class="icon">✓</span>
                    <span>Get technical support assistance</span>
                  </div>
                </div>
              </div>

              <div class="social-card">
                <h3>Follow Us</h3>
                <p>Stay connected for updates and tips</p>
                <div class="social-links">
                  @if (socialLinks().facebook) {
                    <a [href]="socialLinks().facebook" target="_blank" class="social-btn facebook"><span>f</span></a>
                  }
                  @if (socialLinks().twitter) {
                    <a [href]="socialLinks().twitter" target="_blank" class="social-btn twitter"><span>𝕏</span></a>
                  }
                  @if (socialLinks().linkedIn) {
                    <a [href]="socialLinks().linkedIn" target="_blank" class="social-btn linkedin"><span>in</span></a>
                  }
                  @if (socialLinks().youtube) {
                    <a [href]="socialLinks().youtube" target="_blank" class="social-btn youtube"><span>▶</span></a>
                  }
                  @if (socialLinks().instagram) {
                    <a [href]="socialLinks().instagram" target="_blank" class="social-btn instagram"><span>📷</span></a>
                  }
                </div>
              </div>

              <div class="quick-links">
                <h3>Quick Links</h3>
                <a routerLink="/courses">Browse Courses</a>
                <a routerLink="/library">Resource Library</a>
                <a routerLink="/internships">Internship Programs</a>
                <a routerLink="/about">About Us</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- FAQ Section -->
      <section class="faq-section">
        <div class="container">
          <div class="section-header">
            <div class="section-tag">FAQs</div>
            <h2>Frequently Asked <span class="accent">Questions</span></h2>
            <p>Find quick answers to common questions</p>
          </div>
          <div class="faq-grid">
            @for (faq of faqs; track faq.question; let i = $index) {
              <div class="faq-item" [class.open]="faq.isOpen" (click)="toggleFaq(i)">
                <div class="faq-question">
                  <span>{{ faq.question }}</span>
                  <span class="toggle">{{ faq.isOpen ? '−' : '+' }}</span>
                </div>
                @if (faq.isOpen) {
                  <div class="faq-answer">
                    <p>{{ faq.answer }}</p>
                  </div>
                }
              </div>
            }
          </div>
        </div>
      </section>

      <!-- CTA Section -->
      <section class="cta-section">
        <div class="container">
          <div class="cta-box">
            <div class="cta-content">
              <h2>Ready to Start Learning?</h2>
              <p>Join thousands of students and start your tech journey today.</p>
            </div>
            <a routerLink="/courses" class="cta-btn">
              Explore Courses <span>→</span>
            </a>
          </div>
        </div>
      </section>
    </div>
  `,
  styles: [`
    :host {
      --primary: #247090;
      --primary-dark: #1a5570;
      --dark: #0f172a;
      --dark-light: #1e293b;
      --gray-100: #f8fafc;
      --gray-200: #e2e8f0;
      --gray-400: #94a3b8;
      --gray-600: #475569;
      --white: #fff;
      --success: #10b981;
      --radius: 16px;
      --shadow: 0 4px 20px rgba(0,0,0,0.1);
    }

    .contact-page {
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
      background: linear-gradient(135deg, var(--primary), #3498db);
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

    .gradient-overlay {
      position: absolute;
      inset: 0;
      background: radial-gradient(circle at 30% 50%, rgba(36,112,144,0.3) 0%, transparent 50%);
    }

    .hero-content {
      position: relative;
      z-index: 1;
      text-align: center;
      max-width: 700px;
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
      margin-bottom: 1rem;
    }

    .hero p {
      font-size: 1.25rem;
      color: rgba(255,255,255,0.8);
      line-height: 1.7;
    }

    /* Contact Cards */
    .contact-cards-section {
      margin-top: -60px;
      position: relative;
      z-index: 10;
      padding-bottom: 4rem;
    }

    .cards-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1.5rem;
    }

    .contact-card {
      background: var(--white);
      border-radius: var(--radius);
      padding: 2rem;
      text-align: center;
      box-shadow: var(--shadow);
      transition: all 0.3s;
    }

    .contact-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 10px 40px rgba(0,0,0,0.15);
    }

    .contact-card.highlight {
      background: linear-gradient(135deg, var(--primary), var(--primary-dark));
      color: var(--white);
    }

    .card-icon {
      font-size: 2.5rem;
      margin-bottom: 1rem;
    }

    .contact-card h3 {
      font-size: 1.125rem;
      font-weight: 700;
      margin-bottom: 0.75rem;
    }

    .contact-card p {
      color: var(--gray-600);
      font-size: 0.9rem;
      line-height: 1.6;
    }

    .contact-card.highlight p,
    .contact-card.highlight h3 {
      color: var(--white);
    }

    .whatsapp-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      background: var(--white);
      color: var(--primary);
      border-radius: 100px;
      font-weight: 600;
      text-decoration: none;
      margin-top: 0.5rem;
      transition: all 0.3s;
    }

    .whatsapp-btn:hover {
      transform: scale(1.05);
    }

    /* Main Contact */
    .main-contact-section {
      padding: 4rem 0;
    }

    .contact-grid {
      display: grid;
      grid-template-columns: 1.5fr 1fr;
      gap: 3rem;
    }

    .form-wrapper {
      background: var(--white);
      border-radius: var(--radius);
      padding: 2.5rem;
      box-shadow: var(--shadow);
    }

    .form-header h2 {
      font-size: 1.75rem;
      font-weight: 700;
      color: var(--dark);
      margin-bottom: 0.5rem;
    }

    .form-header p {
      color: var(--gray-600);
      margin-bottom: 2rem;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .form-group {
      margin-bottom: 1.25rem;
    }

    .form-group label {
      display: block;
      font-weight: 600;
      font-size: 0.875rem;
      color: var(--dark);
      margin-bottom: 0.5rem;
    }

    .form-group input,
    .form-group select,
    .form-group textarea {
      width: 100%;
      padding: 0.875rem 1rem;
      border: 2px solid var(--gray-200);
      border-radius: 12px;
      font-size: 1rem;
      transition: all 0.3s;
      background: var(--gray-100);
    }

    .form-group input:focus,
    .form-group select:focus,
    .form-group textarea:focus {
      outline: none;
      border-color: var(--primary);
      background: var(--white);
      box-shadow: 0 0 0 4px rgba(36,112,144,0.1);
    }

    .form-group textarea {
      resize: vertical;
      min-height: 120px;
    }

    .submit-btn {
      width: 100%;
      padding: 1rem 2rem;
      background: linear-gradient(135deg, var(--primary), var(--primary-dark));
      color: var(--white);
      border: none;
      border-radius: 12px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      transition: all 0.3s;
      box-shadow: 0 4px 15px rgba(36,112,144,0.4);
    }

    .submit-btn:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(36,112,144,0.5);
    }

    .submit-btn:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }

    .spinner {
      width: 20px;
      height: 20px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: var(--white);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* Info Side */
    .info-wrapper {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .info-card, .social-card, .quick-links {
      background: var(--white);
      border-radius: var(--radius);
      padding: 1.5rem;
      box-shadow: var(--shadow);
    }

    .info-card h3, .social-card h3, .quick-links h3 {
      font-size: 1.125rem;
      font-weight: 700;
      color: var(--dark);
      margin-bottom: 1rem;
    }

    .reason-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .reason {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-size: 0.9rem;
      color: var(--gray-600);
    }

    .reason .icon {
      width: 24px;
      height: 24px;
      background: var(--success);
      color: var(--white);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      flex-shrink: 0;
    }

    .social-card p {
      color: var(--gray-600);
      font-size: 0.9rem;
      margin-bottom: 1rem;
    }

    .social-links {
      display: flex;
      gap: 0.75rem;
    }

    .social-btn {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--white);
      font-weight: 700;
      text-decoration: none;
      transition: transform 0.3s;
    }

    .social-btn:hover { transform: scale(1.1); }
    .social-btn.facebook { background: #1877f2; }
    .social-btn.twitter { background: #000; }
    .social-btn.linkedin { background: #0077b5; }
    .social-btn.youtube { background: #ff0000; }
    .social-btn.instagram { background: linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888); }

    .quick-links {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .quick-links a {
      display: flex;
      align-items: center;
      padding: 0.75rem 1rem;
      background: var(--gray-100);
      border-radius: 8px;
      color: var(--dark);
      text-decoration: none;
      font-weight: 500;
      transition: all 0.3s;
    }

    .quick-links a:hover {
      background: rgba(36,112,144,0.1);
      color: var(--primary);
    }

    /* FAQ */
    .faq-section {
      padding: 6rem 0;
      background: var(--white);
    }

    .faq-grid {
      max-width: 800px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .faq-item {
      background: var(--gray-100);
      border-radius: 12px;
      overflow: hidden;
      cursor: pointer;
      transition: all 0.3s;
    }

    .faq-item:hover {
      background: rgba(36,112,144,0.05);
    }

    .faq-item.open {
      background: var(--gray-100);
      box-shadow: var(--shadow);
    }

    .faq-question {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.25rem 1.5rem;
      font-weight: 600;
      color: var(--dark);
    }

    .toggle {
      width: 28px;
      height: 28px;
      background: var(--white);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
      color: var(--primary);
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .faq-answer {
      padding: 0 1.5rem 1.25rem;
    }

    .faq-answer p {
      color: var(--gray-600);
      line-height: 1.7;
    }

    /* CTA */
    .cta-section {
      padding: 4rem 0 6rem;
    }

    .cta-box {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 3rem 4rem;
      background: linear-gradient(135deg, var(--dark), var(--dark-light));
      border-radius: 24px;
      gap: 2rem;
    }

    .cta-content h2 {
      font-size: 2rem;
      font-weight: 800;
      color: var(--white);
      margin-bottom: 0.5rem;
    }

    .cta-content p {
      color: rgba(255,255,255,0.8);
      font-size: 1.125rem;
    }

    .cta-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 1rem 2rem;
      background: var(--white);
      color: var(--primary);
      border-radius: var(--radius);
      font-weight: 600;
      text-decoration: none;
      transition: all 0.3s;
      white-space: nowrap;
    }

    .cta-btn:hover {
      transform: scale(1.05);
    }

    /* Responsive */
    @media (max-width: 1200px) {
      .cards-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 992px) {
      .contact-grid {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 768px) {
      .hero { padding: 6rem 1.5rem 4rem; }
      .hero h1 { font-size: 2rem; }
      .contact-cards-section { margin-top: -40px; }
      .cards-grid { grid-template-columns: 1fr; }
      .form-row { grid-template-columns: 1fr; }
      .section-header h2 { font-size: 2rem; }
      .cta-box { flex-direction: column; text-align: center; padding: 2rem; }
    }
  `]
})
export class ContactComponent implements OnInit {
  private landingService = inject(LandingService);
  private toastr = inject(ToastrService);

  isSubmitting = signal(false);
  
  // Settings from API
  whatsappNumber = signal(environment.whatsappNumber || '201029907297');
  contactEmail = signal('techmasterr.official@gmail.com');
  contactPhone = signal('+201108894920');
  contactAddress = signal('Cairo, Egypt\n');
  
  // Social links from API
  socialLinks = signal<{
    facebook?: string;
    instagram?: string;
    linkedIn?: string;
    twitter?: string;
    youtube?: string;
  }>({});

  form = {
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  };

  faqs: FAQ[] = [];
  
  // Default FAQs as fallback
  private defaultFaqs: FAQ[] = [
    {
      question: 'How do I enroll in a course?',
      answer: 'Simply browse our courses, select the one you want, and click "Enroll Now". You can pay using credit card, debit card, or bank transfer.',
      isOpen: false
    },
    {
      question: 'Do you offer refunds?',
      answer: 'Yes, we offer a 7-day money-back guarantee on all our courses. If you\'re not satisfied, contact our support team for a full refund.',
      isOpen: false
    },
    {
      question: 'Can I access courses on mobile devices?',
      answer: 'Absolutely! Our platform is fully responsive and works on all devices including smartphones, tablets, and computers.',
      isOpen: false
    },
    {
      question: 'Do I get a certificate after completion?',
      answer: 'Yes, upon successful completion of any course, you will receive a verified digital certificate that you can share on LinkedIn.',
      isOpen: false
    },
    {
      question: 'How long do I have access to course materials?',
      answer: 'You get lifetime access to all course materials once enrolled, including any future updates to the course content.',
      isOpen: false
    }
  ];

  toggleFaq(index: number) {
    this.faqs[index].isOpen = !this.faqs[index].isOpen;
  }

  ngOnInit() {
    this.loadSettings();
    this.loadFaqs();
  }

  loadFaqs() {
    this.landingService.getFaqs().subscribe({
      next: (data) => {
        if (data && data.length > 0) {
          this.faqs = data.map(faq => ({
            question: faq.questionEn || '',
            answer: faq.answerEn || '',
            isOpen: false
          }));
        } else {
          this.faqs = this.defaultFaqs;
        }
      },
      error: () => {
        this.faqs = this.defaultFaqs;
      }
    });
  }

  loadSettings() {
    this.landingService.getSettings().subscribe({
      next: (settings) => {
        if (settings) {
          const getValue = (key: string): string => {
            const setting = settings[key];
            if (typeof setting === 'string') return setting;
            if (setting?.Value) return setting.Value;
            if ((setting as any)?.value) return (setting as any).value;
            return '';
          };
          
          // Social links
          this.socialLinks.set({
            facebook: getValue('social.facebook') || getValue('facebook') || getValue('FacebookUrl'),
            instagram: getValue('social.instagram') || getValue('instagram') || getValue('InstagramUrl'),
            linkedIn: getValue('social.linkedin') || getValue('linkedin') || getValue('LinkedInUrl'),
            twitter: getValue('social.twitter') || getValue('twitter') || getValue('TwitterUrl'),
            youtube: getValue('social.youtube') || getValue('youtube') || getValue('YouTubeUrl')
          });
          
          // Contact info
          const whatsapp = getValue('payment.whatsappNumber') || getValue('whatsappNumber') || getValue('general.supportPhone');
          if (whatsapp) this.whatsappNumber.set(whatsapp.replace(/\+/g, ''));
          
          const email = getValue('general.contactEmail') || getValue('contact.email') || getValue('contactEmail');
          if (email) this.contactEmail.set(email);
          
          const phone = getValue('general.supportPhone') || getValue('contact.phone') || getValue('supportPhone');
          if (phone) this.contactPhone.set(phone);
        }
      },
      error: () => {} // Silently fail, use defaults
    });
  }

  submitForm() {
    if (!this.form.name || !this.form.email || !this.form.subject || !this.form.message) {
      this.toastr.error('Please fill in all required fields');
      return;
    }

    this.isSubmitting.set(true);

    this.landingService.submitContact({
      name: this.form.name,
      email: this.form.email,
      phone: this.form.phone,
      subject: this.form.subject,
      message: this.form.message
    }).subscribe({
      next: () => {
        this.toastr.success('Message sent successfully! We\'ll get back to you soon.');
        this.form = { name: '', email: '', phone: '', subject: '', message: '' };
        this.isSubmitting.set(false);
      },
      error: () => {
        this.toastr.error('Failed to send message. Please try again.');
        this.isSubmitting.set(false);
      }
    });
  }
}
