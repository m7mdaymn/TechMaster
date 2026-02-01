import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, TranslateModule],
  template: `
    <div class="forgot-password-page">
      <div class="form-container">
        <div class="form-card">
          <div class="logo-section">
            <a routerLink="/" class="logo">
              <span class="logo-icon">🎓</span>
              <span class="logo-text">TechMaster</span>
            </a>
          </div>

          @if (!emailSent()) {
            <div class="form-header">
              <h1>{{ 'AUTH.FORGOT_PASSWORD' | translate }}</h1>
              <p>{{ 'AUTH.FORGOT_PASSWORD_DESC' | translate }}</p>
            </div>

            <form [formGroup]="form" (ngSubmit)="onSubmit()">
              <div class="form-group">
                <label for="email">{{ 'AUTH.EMAIL' | translate }}</label>
                <div class="input-wrapper">
                  <span class="input-icon">📧</span>
                  <input 
                    type="email" 
                    id="email" 
                    formControlName="email"
                    [placeholder]="'AUTH.EMAIL_PLACEHOLDER' | translate"
                  >
                </div>
                @if (form.get('email')?.invalid && form.get('email')?.touched) {
                  <span class="error-text">{{ 'AUTH.ERRORS.INVALID_EMAIL' | translate }}</span>
                }
              </div>

              <button type="submit" class="submit-btn" [disabled]="loading() || form.invalid">
                @if (loading()) {
                  <span class="spinner"></span>
                } @else {
                  {{ 'AUTH.SEND_RESET_LINK' | translate }}
                }
              </button>
            </form>
          } @else {
            <div class="success-message">
              <div class="success-icon">✉️</div>
              <h2>{{ 'AUTH.CHECK_EMAIL' | translate }}</h2>
              <p>{{ 'AUTH.RESET_EMAIL_SENT' | translate }}</p>
              <button class="submit-btn" (click)="emailSent.set(false)">
                {{ 'AUTH.RESEND_EMAIL' | translate }}
              </button>
            </div>
          }

          <div class="form-footer">
            <p>
              {{ 'AUTH.REMEMBER_PASSWORD' | translate }}
              <a routerLink="/auth/login">{{ 'AUTH.LOGIN' | translate }}</a>
            </p>
          </div>
        </div>
      </div>

      <div class="visual-container">
        <div class="visual-content">
          <div class="floating-shapes">
            <div class="shape shape-1"></div>
            <div class="shape shape-2"></div>
            <div class="shape shape-3"></div>
          </div>
          <div class="visual-text">
            <h2>{{ 'AUTH.SECURE_RESET' | translate }}</h2>
            <p>{{ 'AUTH.SECURE_RESET_DESC' | translate }}</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .forgot-password-page {
      min-height: 100vh;
      display: grid;
      grid-template-columns: 1fr 1fr;
    }

    .form-container {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      background: #fff;
    }

    .form-card {
      width: 100%;
      max-width: 420px;
    }

    .logo-section {
      margin-bottom: 2rem;
    }

    .logo {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      text-decoration: none;
    }

    .logo-icon {
      font-size: 2rem;
    }

    .logo-text {
      font-size: 1.5rem;
      font-weight: 700;
      color: #000;
    }

    .form-header {
      margin-bottom: 2rem;
    }

    .form-header h1 {
      font-size: 1.75rem;
      font-weight: 700;
      color: #000;
      margin-bottom: 0.5rem;
    }

    .form-header p {
      color: #666;
      font-size: 0.95rem;
      line-height: 1.6;
    }

    .form-group {
      margin-bottom: 1.25rem;
    }

    .form-group label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
      color: #333;
    }

    .input-wrapper {
      position: relative;
    }

    .input-icon {
      position: absolute;
      left: 1rem;
      top: 50%;
      transform: translateY(-50%);
      font-size: 1.1rem;
    }

    input {
      width: 100%;
      padding: 0.875rem 1rem 0.875rem 3rem;
      border: 2px solid #e0e0e0;
      border-radius: 12px;
      font-size: 1rem;
      transition: all 0.3s ease;
      background: #f8f9fa;
    }

    input:focus {
      outline: none;
      border-color: #247090;
      background: #fff;
    }

    .error-text {
      color: #dc3545;
      font-size: 0.85rem;
      margin-top: 0.25rem;
      display: block;
    }

    .submit-btn {
      width: 100%;
      padding: 1rem;
      background: linear-gradient(135deg, #247090 0%, #1a5570 100%);
      color: #fff;
      border: none;
      border-radius: 12px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      margin-top: 1.5rem;
    }

    .submit-btn:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(36, 112, 144, 0.3);
    }

    .submit-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .spinner {
      width: 20px;
      height: 20px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .success-message {
      text-align: center;
      padding: 2rem 0;
    }

    .success-icon {
      font-size: 4rem;
      margin-bottom: 1rem;
    }

    .success-message h2 {
      font-size: 1.5rem;
      font-weight: 700;
      color: #000;
      margin-bottom: 0.5rem;
    }

    .success-message p {
      color: #666;
      margin-bottom: 1.5rem;
      line-height: 1.6;
    }

    .form-footer {
      margin-top: 2rem;
      text-align: center;
    }

    .form-footer p {
      color: #666;
    }

    .form-footer a {
      color: #247090;
      font-weight: 600;
      text-decoration: none;
    }

    .form-footer a:hover {
      text-decoration: underline;
    }

    .visual-container {
      background: linear-gradient(135deg, #247090 0%, #1a5570 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      overflow: hidden;
    }

    .visual-content {
      position: relative;
      z-index: 2;
      text-align: center;
      padding: 2rem;
    }

    .floating-shapes {
      position: absolute;
      inset: 0;
      overflow: hidden;
    }

    .shape {
      position: absolute;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 50%;
    }

    .shape-1 {
      width: 300px;
      height: 300px;
      top: -100px;
      right: -100px;
      animation: float 6s ease-in-out infinite;
    }

    .shape-2 {
      width: 200px;
      height: 200px;
      bottom: -50px;
      left: -50px;
      animation: float 8s ease-in-out infinite reverse;
    }

    .shape-3 {
      width: 150px;
      height: 150px;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      animation: pulse 4s ease-in-out infinite;
    }

    @keyframes float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-20px); }
    }

    @keyframes pulse {
      0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.5; }
      50% { transform: translate(-50%, -50%) scale(1.1); opacity: 0.3; }
    }

    .visual-text {
      color: #fff;
    }

    .visual-text h2 {
      font-size: 2rem;
      font-weight: 700;
      margin-bottom: 1rem;
    }

    .visual-text p {
      font-size: 1.1rem;
      opacity: 0.9;
      max-width: 300px;
      margin: 0 auto;
      line-height: 1.6;
    }

    @media (max-width: 992px) {
      .forgot-password-page {
        grid-template-columns: 1fr;
      }

      .visual-container {
        display: none;
      }

      .form-container {
        min-height: 100vh;
      }
    }

    :host-context([dir="rtl"]) {
      .input-icon {
        left: auto;
        right: 1rem;
      }

      input {
        padding: 0.875rem 3rem 0.875rem 1rem;
      }
    }
  `]
})
export class ForgotPasswordComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private toastr = inject(ToastrService);
  private translate = inject(TranslateService);

  loading = signal(false);
  emailSent = signal(false);

  form: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });

  onSubmit() {
    if (this.form.invalid) return;

    this.loading.set(true);
    
    // Simulate API call for password reset
    setTimeout(() => {
      this.loading.set(false);
      this.emailSent.set(true);
      this.toastr.success(
        this.translate.instant('AUTH.RESET_EMAIL_SENT'),
        this.translate.instant('COMMON.SUCCESS')
      );
    }, 1500);
  }
}
