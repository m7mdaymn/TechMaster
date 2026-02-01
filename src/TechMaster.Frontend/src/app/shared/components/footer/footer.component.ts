import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { environment } from '@environments/environment';
import { LandingService } from '@core/services/landing.service';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <footer class="footer">
      <div class="container">
        <div class="footer-grid">
          <!-- Brand -->
          <div class="footer-brand">
            <a routerLink="/" class="logo">
              <span class="logo-tech">Tech</span><span class="logo-master">Master</span>
            </a>
            <p class="brand-desc">Empowering the next generation of tech professionals through quality education and hands-on training.</p>
            <div class="social-links">
              @if (socialLinks().facebook) {
                <a [href]="socialLinks().facebook" target="_blank" aria-label="Facebook">
                  <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                    <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95z"/>
                  </svg>
                </a>
              }
              @if (socialLinks().twitter) {
                <a [href]="socialLinks().twitter" target="_blank" aria-label="Twitter">
                  <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                    <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z"/>
                  </svg>
                </a>
              }
              @if (socialLinks().linkedIn) {
                <a [href]="socialLinks().linkedIn" target="_blank" aria-label="LinkedIn">
                  <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
                  </svg>
                </a>
              }
              @if (socialLinks().instagram) {
                <a [href]="socialLinks().instagram" target="_blank" aria-label="Instagram">
                  <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                    <path d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6m9.65 1.5a1.25 1.25 0 0 1 1.25 1.25A1.25 1.25 0 0 1 17.25 8 1.25 1.25 0 0 1 16 6.75a1.25 1.25 0 0 1 1.25-1.25M12 7a5 5 0 0 1 5 5 5 5 0 0 1-5 5 5 5 0 0 1-5-5 5 5 0 0 1 5-5m0 2a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3z"/>
                  </svg>
                </a>
              }
              @if (socialLinks().youtube) {
                <a [href]="socialLinks().youtube" target="_blank" aria-label="YouTube">
                  <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                    <path d="M10 15l5.19-3L10 9v6m11.56-7.83c.13.47.22 1.1.28 1.9.07.8.1 1.49.1 2.09L22 12c0 2.19-.16 3.8-.44 4.83-.25.9-.83 1.48-1.73 1.73-.47.13-1.33.22-2.65.28-1.3.07-2.49.1-3.59.1L12 19c-4.19 0-6.8-.16-7.83-.44-.9-.25-1.48-.83-1.73-1.73-.13-.47-.22-1.1-.28-1.9-.07-.8-.1-1.49-.1-2.09L2 12c0-2.19.16-3.8.44-4.83.25-.9.83-1.48 1.73-1.73.47-.13 1.33-.22 2.65-.28 1.3-.07 2.49-.1 3.59-.1L12 5c4.19 0 6.8.16 7.83.44.9.25 1.48.83 1.73 1.73z"/>
                  </svg>
                </a>
              }
              @if (socialLinks().tiktok) {
                <a [href]="socialLinks().tiktok" target="_blank" aria-label="TikTok">
                  <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                  </svg>
                </a>
              }
            </div>
          </div>

          <!-- Quick Links -->
          <div class="footer-links">
            <h4>Quick Links</h4>
            <ul>
              <li><a routerLink="/courses">Courses</a></li>
              <li><a routerLink="/internships">Internships</a></li>
              <li><a routerLink="/library">Library</a></li>
              <li><a routerLink="/about">About Us</a></li>
            </ul>
          </div>

          <!-- Support -->
          <div class="footer-links">
            <h4>Support</h4>
            <ul>
              <li><a routerLink="/contact">Contact Us</a></li>
              <li><a routerLink="/contact">FAQ</a></li>
              <li><a routerLink="/contact">Privacy Policy</a></li>
              <li><a routerLink="/contact">Terms of Service</a></li>
            </ul>
          </div>

          <!-- Contact -->
          <div class="footer-contact">
            <h4>Contact Us</h4>
            <div class="contact-item">
              <span class="material-icons">email</span>
              <a [href]="'mailto:' + contactEmail()">{{ contactEmail() }}</a>
            </div>
            <div class="contact-item">
              <span class="material-icons">phone</span>
              <a [href]="'tel:' + supportPhone()">{{ supportPhone() || whatsappNumber() }}</a>
            </div>
            <a [href]="'https://wa.me/' + whatsappNumber()" target="_blank" class="whatsapp-btn">
              <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Chat on WhatsApp
            </a>
          </div>
        </div>

        <div class="footer-bottom">
          <p>&copy; {{ currentYear }} TechMaster. All rights reserved.</p>
        </div>
      </div>
    </footer>
  `,
  styles: [`
    .footer {
      background: #111827;
      color: #9ca3af;
      padding: 4rem 0 2rem;
      margin-top: auto;
    }

    .footer-grid {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr 1.5fr;
      gap: 3rem;

      @media (max-width: 992px) {
        grid-template-columns: 1fr 1fr;
        gap: 2rem;
      }

      @media (max-width: 576px) {
        grid-template-columns: 1fr;
      }
    }

    .logo {
      font-size: 1.5rem;
      font-weight: 800;
      text-decoration: none;
      display: inline-flex;
      margin-bottom: 1rem;

      .logo-tech {
        color: #247090;
      }

      .logo-master {
        color: white;
      }
    }

    .brand-desc {
      margin-bottom: 1.5rem;
      line-height: 1.7;
    }

    .social-links {
      display: flex;
      gap: 1rem;

      a {
        color: #9ca3af;
        transition: color 0.2s;

        &:hover {
          color: #247090;
        }
      }
    }

    .footer-links {
      h4 {
        color: white;
        font-size: 1rem;
        font-weight: 600;
        margin-bottom: 1.5rem;
      }

      ul {
        list-style: none;
      }

      li {
        margin-bottom: 0.75rem;
      }

      a {
        color: #9ca3af;
        text-decoration: none;
        transition: color 0.2s;

        &:hover {
          color: #247090;
        }
      }
    }

    .footer-contact {
      h4 {
        color: white;
        font-size: 1rem;
        font-weight: 600;
        margin-bottom: 1.5rem;
      }
    }

    .contact-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 1rem;

      .material-icons {
        font-size: 1.25rem;
        color: #247090;
      }

      a {
        color: #9ca3af;
        text-decoration: none;
        transition: color 0.2s;

        &:hover {
          color: white;
        }
      }
    }

    .whatsapp-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      background: #25d366;
      color: white;
      text-decoration: none;
      border-radius: 0.5rem;
      font-weight: 600;
      margin-top: 0.5rem;
      transition: all 0.2s;

      &:hover {
        background: #22c55e;
        transform: translateY(-2px);
      }
    }

    .footer-bottom {
      margin-top: 3rem;
      padding-top: 2rem;
      border-top: 1px solid #374151;
      text-align: center;

      p {
        font-size: 0.875rem;
      }
    }
  `]
})
export class FooterComponent implements OnInit {
  private landingService = inject(LandingService);

  currentYear = new Date().getFullYear();
  whatsappNumber = signal(environment.whatsappNumber);
  
  // Social links from API
  socialLinks = signal<{
    facebook?: string;
    instagram?: string;
    linkedIn?: string;
    twitter?: string;
    tiktok?: string;
    youtube?: string;
  }>({});
  
  contactEmail = signal('techmasterr.official@gmail.com');
  supportPhone = signal('+201108894920');

  ngOnInit() {
    this.loadSettings();
  }

  loadSettings() {
    this.landingService.getSettings().subscribe({
      next: (settings) => {
        if (settings) {
          // Parse settings object - handle both flat and nested structures
          const getValue = (key: string): string => {
            const setting = settings[key];
            if (typeof setting === 'string') return setting;
            if (setting?.Value) return setting.Value;
            if ((setting as any)?.value) return (setting as any).value;
            return '';
          };
          
          // Social links - check multiple key formats (social.facebook, facebook, FacebookUrl)
          this.socialLinks.set({
            facebook: getValue('social.facebook') || getValue('facebook') || getValue('FacebookUrl'),
            instagram: getValue('social.instagram') || getValue('instagram') || getValue('InstagramUrl'),
            linkedIn: getValue('social.linkedin') || getValue('linkedin') || getValue('linkedIn') || getValue('LinkedInUrl'),
            twitter: getValue('social.twitter') || getValue('twitter') || getValue('TwitterUrl'),
            tiktok: getValue('social.tiktok') || getValue('tiktok') || getValue('TikTokUrl'),
            youtube: getValue('social.youtube') || getValue('youtube') || getValue('YouTubeUrl')
          });
          
          // Contact info
          const whatsapp = getValue('payment.whatsappNumber') || getValue('whatsappNumber') || getValue('whatsapp') || getValue('general.supportPhone');
          if (whatsapp) this.whatsappNumber.set(whatsapp.replace(/\+/g, ''));
          
          const email = getValue('contact.email') || getValue('contactEmail') || getValue('email') || getValue('general.contactEmail');
          if (email) this.contactEmail.set(email);
          
          const phone = getValue('contact.phone') || getValue('supportPhone') || getValue('phone') || getValue('general.supportPhone');
          if (phone) this.supportPhone.set(phone);
        }
      },
      error: () => {} // Silently fail, use defaults
    });
  }
}
