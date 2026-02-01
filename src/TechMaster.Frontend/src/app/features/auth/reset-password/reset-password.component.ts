import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, TranslateModule],
  template: `
    <div class="reset-password-page">
      <div class="form-container">
        <div class="form-card">
          <div class="logo-section">
            <a routerLink="/" class="logo">
              <span class="logo-icon">🎓</span>
              <span class="logo-text">TechMaster</span>
            </a>
          </div>

          @if (!resetSuccess()) {
            <div class="form-header">
              <h1>{{ 'AUTH.RESET_PASSWORD' | translate }}</h1>
              <p>{{ 'AUTH.RESET_PASSWORD_DESC' | translate }}</p>
            </div>

            <form [formGroup]="form" (ngSubmit)="onSubmit()">
              <div class="form-group">
                <label for="password">{{ 'AUTH.NEW_PASSWORD' | translate }}</label>
                <div class="input-wrapper">
                  <span class="input-icon">🔒</span>
                  <input 
                    [type]="showPassword() ? 'text' : 'password'" 
                    id="password" 
                    formControlName="password"
                    [placeholder]="'AUTH.NEW_PASSWORD_PLACEHOLDER' | translate"
                  >
                  <button type="button" class="toggle-password" (click)="showPassword.set(!showPassword())">
                    {{ showPassword() ? '👁️' : '👁️‍🗨️' }}
                  </button>
                </div>
                @if (form.get('password')?.invalid && form.get('password')?.touched) {
                  <span class="error-text">{{ 'AUTH.ERRORS.PASSWORD_REQUIREMENTS' | translate }}</span>
                }
              </div>

              <div class="password-strength">
                <div class="strength-bar">
                  <div 
                    class="strength-fill" 
                    [style.width]="passwordStrength() + '%'"
                    [class.weak]="passwordStrength() <= 33"
                    [class.medium]="passwordStrength() > 33 && passwordStrength() <= 66"
                    [class.strong]="passwordStrength() > 66"
                  ></div>
                </div>
                <span class="strength-text">
                  {{ passwordStrengthText() }}
                </span>
              </div>

              <div class="form-group">
                <label for="confirmPassword">{{ 'AUTH.CONFIRM_PASSWORD' | translate }}</label>
                <div class="input-wrapper">
                  <span class="input-icon">🔒</span>
                  <input 
                    [type]="showConfirmPassword() ? 'text' : 'password'" 
                    id="confirmPassword" 
                    formControlName="confirmPassword"
                    [placeholder]="'AUTH.CONFIRM_PASSWORD_PLACEHOLDER' | translate"
                  >
                  <button type="button" class="toggle-password" (click)="showConfirmPassword.set(!showConfirmPassword())">
                    {{ showConfirmPassword() ? '👁️' : '👁️‍🗨️' }}
                  </button>
                </div>
                @if (form.get('confirmPassword')?.hasError('mismatch') && form.get('confirmPassword')?.touched) {
                  <span class="error-text">{{ 'AUTH.ERRORS.PASSWORD_MISMATCH' | translate }}</span>
                }
              </div>

              <button type="submit" class="submit-btn" [disabled]="loading() || form.invalid">
                @if (loading()) {
                  <span class="spinner"></span>
                } @else {
                  {{ 'AUTH.RESET_PASSWORD' | translate }}
                }
              </button>
            </form>
          } @else {
            <div class="success-message">
              <div class="success-icon">✅</div>
              <h2>{{ 'AUTH.PASSWORD_RESET_SUCCESS' | translate }}</h2>
              <p>{{ 'AUTH.PASSWORD_RESET_SUCCESS_DESC' | translate }}</p>
              <a routerLink="/auth/login" class="submit-btn">
                {{ 'AUTH.LOGIN' | translate }}
              </a>
            </div>
          }
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
            <h2>{{ 'AUTH.CREATE_NEW_PASSWORD' | translate }}</h2>
            <p>{{ 'AUTH.STRONG_PASSWORD_TIP' | translate }}</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .reset-password-page {
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
      padding: 0.875rem 3rem 0.875rem 3rem;
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

    .toggle-password {
      position: absolute;
      right: 1rem;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      cursor: pointer;
      font-size: 1.1rem;
      padding: 0;
    }

    .error-text {
      color: #dc3545;
      font-size: 0.85rem;
      margin-top: 0.25rem;
      display: block;
    }

    .password-strength {
      margin-bottom: 1.25rem;
    }

    .strength-bar {
      height: 4px;
      background: #e0e0e0;
      border-radius: 2px;
      overflow: hidden;
      margin-bottom: 0.5rem;
    }

    .strength-fill {
      height: 100%;
      transition: all 0.3s ease;
    }

    .strength-fill.weak {
      background: #dc3545;
    }

    .strength-fill.medium {
      background: #ffc107;
    }

    .strength-fill.strong {
      background: #28a745;
    }

    .strength-text {
      font-size: 0.85rem;
      color: #666;
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
      text-decoration: none;
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
    }

    @media (max-width: 992px) {
      .reset-password-page {
        grid-template-columns: 1fr;
      }

      .visual-container {
        display: none;
      }
    }

    :host-context([dir="rtl"]) {
      .input-icon {
        left: auto;
        right: 1rem;
      }

      .toggle-password {
        right: auto;
        left: 1rem;
      }

      input {
        padding: 0.875rem 3rem 0.875rem 3rem;
      }
    }
  `]
})
export class ResetPasswordComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toastr = inject(ToastrService);
  private translate = inject(TranslateService);

  loading = signal(false);
  showPassword = signal(false);
  showConfirmPassword = signal(false);
  resetSuccess = signal(false);
  passwordStrength = signal(0);

  token = '';

  form: FormGroup = this.fb.group({
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', [Validators.required]]
  }, { validators: this.passwordMatchValidator });

  ngOnInit() {
    this.token = this.route.snapshot.queryParamMap.get('token') || '';
    
    if (!this.token) {
      this.toastr.error(
        this.translate.instant('AUTH.ERRORS.INVALID_RESET_LINK'),
        this.translate.instant('COMMON.ERROR')
      );
      this.router.navigate(['/auth/forgot-password']);
    }

    this.form.get('password')?.valueChanges.subscribe(value => {
      this.calculatePasswordStrength(value);
    });
  }

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');

    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ mismatch: true });
      return { mismatch: true };
    }

    return null;
  }

  calculatePasswordStrength(password: string) {
    let strength = 0;
    
    if (password.length >= 8) strength += 25;
    if (password.match(/[a-z]/)) strength += 25;
    if (password.match(/[A-Z]/)) strength += 25;
    if (password.match(/[0-9]/)) strength += 12.5;
    if (password.match(/[^a-zA-Z0-9]/)) strength += 12.5;

    this.passwordStrength.set(Math.min(100, strength));
  }

  passwordStrengthText(): string {
    const strength = this.passwordStrength();
    if (strength <= 33) return this.translate.instant('AUTH.PASSWORD_WEAK');
    if (strength <= 66) return this.translate.instant('AUTH.PASSWORD_MEDIUM');
    return this.translate.instant('AUTH.PASSWORD_STRONG');
  }

  onSubmit() {
    if (this.form.invalid) return;

    this.loading.set(true);
    
    // Simulate API call
    setTimeout(() => {
      this.loading.set(false);
      this.resetSuccess.set(true);
      this.toastr.success(
        this.translate.instant('AUTH.PASSWORD_RESET_SUCCESS'),
        this.translate.instant('COMMON.SUCCESS')
      );
    }, 1500);
  }
}
