import { Component, inject, signal, AfterViewInit, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { AuthService } from '@core/services/auth.service';
import { ToastrService } from 'ngx-toastr';
import { environment } from '@environments/environment';

declare const google: any;

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  template: `
    <div class="auth-page">
      <div class="auth-container">
        <div class="auth-card">
          <div class="auth-header">
            <a routerLink="/" class="auth-logo">
              <span class="logo-text">Tech<span class="highlight">Master</span></span>
            </a>
            <h1>Create Account</h1>
            <p>Start your learning journey today</p>
          </div>

          <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" class="auth-form">
            <div class="form-group">
              <label for="fullName">Full Name</label>
              <div class="input-wrapper">
                <span class="material-icons">person</span>
                <input 
                  type="text" 
                  id="fullName" 
                  formControlName="fullName"
                  placeholder="Enter your full name"
                  [class.error]="registerForm.get('fullName')?.invalid && registerForm.get('fullName')?.touched"
                >
              </div>
              @if (registerForm.get('fullName')?.invalid && registerForm.get('fullName')?.touched) {
                <span class="error-text">Full name is required</span>
              }
            </div>

            <div class="form-group">
              <label for="email">Email</label>
              <div class="input-wrapper">
                <span class="material-icons">email</span>
                <input 
                  type="email" 
                  id="email" 
                  formControlName="email"
                  placeholder="Enter your email"
                  [class.error]="registerForm.get('email')?.invalid && registerForm.get('email')?.touched"
                >
              </div>
              @if (registerForm.get('email')?.invalid && registerForm.get('email')?.touched) {
                <span class="error-text">Valid email is required</span>
              }
            </div>

            <div class="form-group">
              <label for="phone">Phone </label>
              <div class="input-wrapper">
                <span class="material-icons">phone</span>
                <input 
                  type="tel" 
                  id="phone" 
                  formControlName="phone"
                  placeholder="Enter your phone number"
                >
              </div>
            </div>

            <div class="form-group">
              <label for="password">Password</label>
              <div class="input-wrapper">
                <span class="material-icons">lock</span>
                <input 
                  [type]="showPassword() ? 'text' : 'password'" 
                  id="password" 
                  formControlName="password"
                  placeholder="Enter your password"
                  [class.error]="registerForm.get('password')?.invalid && registerForm.get('password')?.touched"
                >
                <button type="button" class="toggle-password" (click)="togglePassword()">
                  <span class="material-icons">{{ showPassword() ? 'visibility_off' : 'visibility' }}</span>
                </button>
              </div>
              @if (registerForm.get('password')?.invalid && registerForm.get('password')?.touched) {
                <span class="error-text">Password must be at least 6 characters</span>
              }
            </div>

            <div class="form-group">
              <label for="confirmPassword">Confirm Password</label>
              <div class="input-wrapper">
                <span class="material-icons">lock</span>
                <input 
                  [type]="showConfirmPassword() ? 'text' : 'password'" 
                  id="confirmPassword" 
                  formControlName="confirmPassword"
                  placeholder="Confirm your password"
                  [class.error]="registerForm.get('confirmPassword')?.invalid && registerForm.get('confirmPassword')?.touched"
                >
                <button type="button" class="toggle-password" (click)="toggleConfirmPassword()">
                  <span class="material-icons">{{ showConfirmPassword() ? 'visibility_off' : 'visibility' }}</span>
                </button>
              </div>
              @if (registerForm.get('confirmPassword')?.touched && registerForm.errors?.['passwordMismatch']) {
                <span class="error-text">Passwords do not match</span>
              }
            </div>

            <button type="submit" class="btn btn-primary btn-lg btn-block" [disabled]="isLoading()">
              @if (isLoading()) {
                <span class="spinner"></span>
              } @else {
                Create Account
              }
            </button>
          </form>

          <div class="auth-divider">
            <span>or</span>
          </div>

          <button type="button" class="btn btn-google" (click)="loginWithGoogle()">
            <svg viewBox="0 0 24 24" width="20" height="20">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <div class="auth-footer">
            <a routerLink="/" class="home-link">← Back to Home</a>
            <div class="signup-link">
              <span>Already have an account?</span>
              <a routerLink="/auth/login">Sign In</a>
            </div>
          </div>
        </div>
      </div>
      <div class="auth-background">
        <div class="background-content">
          <h2>Join TechMaster</h2>
          <p>Start your journey to becoming a tech expert</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-page {
      min-height: 100vh;
      display: flex;
    }

    .auth-container {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      background: var(--color-white);
      overflow-y: auto;
    }

    .auth-card {
      width: 100%;
      max-width: 420px;
      padding: 1rem 0;
    }

    .auth-header {
      text-align: center;
      margin-bottom: 1.5rem;
    }

    .auth-logo {
      display: inline-block;
      margin-bottom: 1rem;
      text-decoration: none;
    }

    .logo-text {
      font-size: 2rem;
      font-weight: 800;
      color: var(--color-dark);
    }

    .logo-text .highlight {
      color: var(--color-primary);
    }

    .auth-header h1 {
      font-size: 1.75rem;
      font-weight: 700;
      color: var(--color-dark);
      margin-bottom: 0.5rem;
    }

    .auth-header p {
      color: var(--color-gray-600);
    }

    .auth-form {
      margin-bottom: 1.5rem;
    }

    .form-group {
      margin-bottom: 1rem;
    }

    .form-group label {
      display: block;
      font-weight: 500;
      margin-bottom: 0.5rem;
      color: var(--color-dark);
      font-size: 0.875rem;
    }

    .input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }

    .input-wrapper .material-icons {
      position: absolute;
      left: 1rem;
      color: var(--color-gray-400);
      font-size: 1.25rem;
    }

    .input-wrapper input {
      width: 100%;
      padding: 0.75rem 1rem 0.75rem 3rem;
      border: 2px solid var(--color-gray-200);
      border-radius: 10px;
      font-size: 1rem;
      transition: all 0.3s ease;
    }

    .input-wrapper input:focus {
      border-color: var(--color-primary);
      outline: none;
      box-shadow: 0 0 0 3px rgba(36, 112, 144, 0.1);
    }

    .input-wrapper input.error {
      border-color: #ef4444;
    }

    .toggle-password {
      position: absolute;
      right: 1rem;
      background: none;
      border: none;
      cursor: pointer;
      color: var(--color-gray-400);
      padding: 0;
    }

    .toggle-password:hover {
      color: var(--color-gray-600);
    }

    .error-text {
      display: block;
      margin-top: 0.5rem;
      font-size: 0.75rem;
      color: #ef4444;
    }

    .btn-block {
      width: 100%;
      margin-top: 0.5rem;
    }

    .spinner {
      width: 20px;
      height: 20px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .auth-divider {
      display: flex;
      align-items: center;
      margin: 1.5rem 0;
    }

    .auth-divider::before,
    .auth-divider::after {
      content: '';
      flex: 1;
      height: 1px;
      background: var(--color-gray-200);
    }

    .auth-divider span {
      padding: 0 1rem;
      color: var(--color-gray-500);
      font-size: 0.875rem;
    }

    .btn-google {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      padding: 0.75rem;
      background: var(--color-white);
      border: 2px solid var(--color-gray-200);
      border-radius: 10px;
      font-size: 1rem;
      font-weight: 500;
      color: var(--color-dark);
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .btn-google:hover {
      background: var(--color-gray-50);
      border-color: var(--color-gray-300);
    }

    .auth-footer {
      text-align: center;
      margin-top: 1.5rem;
      font-size: 0.875rem;
      color: var(--color-gray-600);
    }

    .home-link {
      display: block;
      color: var(--color-primary);
      font-weight: 600;
      text-decoration: none;
      margin-bottom: 1rem;
    }

    .home-link:hover {
      text-decoration: underline;
    }

    .signup-link a {
      color: var(--color-primary);
      font-weight: 600;
      text-decoration: none;
      margin-left: 0.25rem;
    }

    .signup-link a:hover {
      text-decoration: underline;
    }

    .auth-background {
      flex: 1;
      display: none;
      background: linear-gradient(135deg, var(--color-primary) 0%, #1d5a73 50%, var(--color-dark) 100%);
      position: relative;
      overflow: hidden;
    }

    .background-content {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: var(--color-white);
      text-align: center;
      padding: 2rem;
    }

    .background-content h2 {
      font-size: 2.5rem;
      font-weight: 800;
      margin-bottom: 1rem;
    }

    .background-content p {
      font-size: 1.25rem;
      opacity: 0.9;
    }

    @media (min-width: 1024px) {
      .auth-background {
        display: block;
      }
    }

    /* RTL Support */
    :host-context([dir="rtl"]) {
      .input-wrapper .material-icons {
        left: auto;
        right: 1rem;
      }

      .input-wrapper input {
        padding: 0.75rem 3rem 0.75rem 1rem;
      }

      .toggle-password {
        right: auto;
        left: 1rem;
      }

      .auth-footer a {
        margin-left: 0;
        margin-right: 0.25rem;
      }
    }
  `]
})
export class RegisterComponent implements AfterViewInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private toastr = inject(ToastrService);
  private ngZone = inject(NgZone);

  showPassword = signal(false);
  showConfirmPassword = signal(false);
  isLoading = signal(false);
  googleLoading = signal(false);

  registerForm: FormGroup = this.fb.group({
    fullName: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required]]
  }, { validators: this.passwordMatchValidator });

  ngAfterViewInit(): void {
    this.initializeGoogleSignIn();
  }

  private initializeGoogleSignIn(): void {
    const checkGoogle = setInterval(() => {
      if (typeof google !== 'undefined' && google.accounts) {
        clearInterval(checkGoogle);
        google.accounts.id.initialize({
          client_id: environment.googleClientId,
          callback: (response: any) => this.handleGoogleCallback(response),
          auto_select: false,
          cancel_on_tap_outside: true
        });
      }
    }, 100);
    setTimeout(() => clearInterval(checkGoogle), 10000);
  }

  private handleGoogleCallback(response: any): void {
    this.ngZone.run(() => {
      if (response.credential) {
        this.processGoogleToken(response.credential);
      }
    });
  }

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      return { passwordMismatch: true };
    }
    return null;
  }

  togglePassword(): void {
    this.showPassword.update(v => !v);
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword.update(v => !v);
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      Object.keys(this.registerForm.controls).forEach(key => {
        this.registerForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.isLoading.set(true);
    const { fullName, email, phone, password, confirmPassword } = this.registerForm.value;

    this.authService.register({ fullName, email, phone, password, confirmPassword }).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.toastr.success('Registration successful! Please login.');
        this.router.navigate(['/auth/login']);
      },
      error: (error) => {
        this.isLoading.set(false);
        this.toastr.error(error.error?.messageEn || 'Registration failed');
      }
    });
  }

  loginWithGoogle(): void {
    if (typeof google === 'undefined' || !google.accounts) {
      this.toastr.error('Google Sign-In is not available. Please refresh the page.');
      return;
    }
    
    google.accounts.id.prompt((notification: any) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        this.openGoogleSignInPopup();
      }
    });
  }

  private openGoogleSignInPopup(): void {
    const width = 500;
    const height = 600;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    
    const popup = window.open(
      `https://accounts.google.com/o/oauth2/v2/auth?client_id=${environment.googleClientId}&redirect_uri=${window.location.origin}/auth/google/callback&response_type=token%20id_token&scope=email%20profile%20openid&nonce=${Math.random().toString(36).substring(7)}`,
      'GoogleSignIn',
      `width=${width},height=${height},left=${left},top=${top}`
    );

    const checkPopup = setInterval(() => {
      try {
        if (popup?.closed) {
          clearInterval(checkPopup);
        } else if (popup?.location?.hash) {
          const hash = popup.location.hash.substring(1);
          const params = new URLSearchParams(hash);
          const idToken = params.get('id_token');
          if (idToken) {
            clearInterval(checkPopup);
            popup.close();
            this.processGoogleToken(idToken);
          }
        }
      } catch { /* Cross-origin error expected */ }
    }, 500);

    setTimeout(() => clearInterval(checkPopup), 120000);
  }

  private processGoogleToken(idToken: string): void {
    this.googleLoading.set(true);
    this.isLoading.set(true);

    this.authService.googleLogin(idToken).subscribe({
      next: (response) => {
        this.googleLoading.set(false);
        this.isLoading.set(false);

        if (response.isSuccess && response.user && response.token) {
          const role = response.user.role;
          this.toastr.success('Successfully signed in with Google!');
          
          setTimeout(() => {
            if (role === 'Admin') {
              this.router.navigate(['/admin/dashboard']);
            } else if (role === 'Instructor') {
              this.router.navigate(['/instructor/dashboard']);
            } else {
              this.router.navigate(['/student/dashboard']);
            }
          }, 100);
        } else {
          this.toastr.error(response.message || 'Google sign-in failed');
        }
      },
      error: (error) => {
        this.googleLoading.set(false);
        this.isLoading.set(false);
        this.toastr.error(error.error?.message || 'Google sign-in failed');
      }
    });
  }
}
