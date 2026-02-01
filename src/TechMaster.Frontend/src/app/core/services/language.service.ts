import { Injectable, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { DOCUMENT } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  private translate = inject(TranslateService);
  private document = inject(DOCUMENT);
  
  currentLang = signal<string>('en');
  isRtl = signal<boolean>(false);

  constructor() {
    this.translate.addLangs(['en', 'ar']);
    this.translate.setDefaultLang('en');
    // Set English LTR on initialization
    this.document.documentElement.setAttribute('dir', 'ltr');
    this.document.documentElement.setAttribute('lang', 'en');
  }

  setLanguage(lang: string): void {
    this.translate.use(lang);
    this.currentLang.set(lang);
    localStorage.setItem('language', lang);

    const isRtl = lang === 'ar';
    this.isRtl.set(isRtl);
    
    // Update document direction and lang
    this.document.documentElement.setAttribute('dir', isRtl ? 'rtl' : 'ltr');
    this.document.documentElement.setAttribute('lang', lang);
    this.document.body.setAttribute('dir', isRtl ? 'rtl' : 'ltr');
  }

  toggleLanguage(): void {
    const newLang = this.currentLang() === 'en' ? 'ar' : 'en';
    this.setLanguage(newLang);
  }

  getCurrentLang(): string {
    return this.currentLang();
  }

  isCurrentRtl(): boolean {
    return this.isRtl();
  }
}
