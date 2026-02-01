import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="not-found-page">
      <div class="container">
        <div class="content">
          <div class="error-code">404</div>
          <h1>Page Not Found</h1>
          <p>The page you're looking for doesn't exist or has been moved.</p>
          
          <div class="illustration">
            <div class="lost-astronaut">
              <span class="astronaut">👨‍🚀</span>
              <span class="stars">✨</span>
            </div>
          </div>

          <div class="suggestions">
            <h3>Here are some suggestions:</h3>
            <ul>
              <li>Check the URL for typos</li>
              <li>Go back to the previous page</li>
              <li>Visit our homepage</li>
            </ul>
          </div>

          <div class="actions">
            <a routerLink="/" class="btn-primary">
              Go to Homepage
            </a>
            <a routerLink="/courses" class="btn-secondary">
              Browse Courses
            </a>
          </div>

          <div class="quick-links">
            <h4>Quick Links</h4>
            <div class="links">
              <a routerLink="/courses">Courses</a>
              <a routerLink="/internships">Internships</a>
              <a routerLink="/library">Library</a>
              <a routerLink="/contact">Contact</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .not-found-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #f8f9fa 0%, #e8f4f8 100%);
      padding: 2rem;
    }

    .container {
      max-width: 600px;
      width: 100%;
    }

    .content {
      text-align: center;
    }

    .error-code {
      font-size: 8rem;
      font-weight: 900;
      line-height: 1;
      background: linear-gradient(135deg, #247090 0%, #1a5570 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin-bottom: 1rem;
    }

    h1 {
      font-size: 2rem;
      font-weight: 700;
      color: #000;
      margin-bottom: 0.5rem;
    }

    p {
      color: #666;
      font-size: 1.1rem;
      margin-bottom: 2rem;
    }

    .illustration {
      margin: 2rem 0;
    }

    .lost-astronaut {
      position: relative;
      display: inline-block;
      animation: float 3s ease-in-out infinite;
    }

    .astronaut {
      font-size: 5rem;
    }

    .stars {
      position: absolute;
      top: -10px;
      right: -20px;
      font-size: 2rem;
      animation: twinkle 1.5s ease-in-out infinite;
    }

    @keyframes float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-15px); }
    }

    @keyframes twinkle {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.5; transform: scale(0.8); }
    }

    .suggestions {
      background: #fff;
      border-radius: 12px;
      padding: 1.5rem;
      margin-bottom: 2rem;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
      text-align: left;
    }

    .suggestions h3 {
      font-size: 1rem;
      font-weight: 600;
      margin-bottom: 1rem;
    }

    .suggestions ul {
      margin: 0;
      padding-left: 1.25rem;
    }

    .suggestions li {
      color: #666;
      margin-bottom: 0.5rem;
    }

    .actions {
      display: flex;
      gap: 1rem;
      justify-content: center;
      margin-bottom: 2rem;
    }

    .btn-primary {
      padding: 0.875rem 2rem;
      background: #247090;
      color: #fff;
      border-radius: 8px;
      font-weight: 600;
      text-decoration: none;
      transition: all 0.2s;
    }

    .btn-primary:hover {
      background: #1a5570;
      transform: translateY(-2px);
    }

    .btn-secondary {
      padding: 0.875rem 2rem;
      background: #fff;
      color: #247090;
      border: 2px solid #247090;
      border-radius: 8px;
      font-weight: 600;
      text-decoration: none;
      transition: all 0.2s;
    }

    .btn-secondary:hover {
      background: #247090;
      color: #fff;
    }

    .quick-links {
      padding-top: 2rem;
      border-top: 1px solid #e0e0e0;
    }

    .quick-links h4 {
      font-size: 0.9rem;
      font-weight: 600;
      color: #666;
      margin-bottom: 1rem;
    }

    .links {
      display: flex;
      gap: 1.5rem;
      justify-content: center;
      flex-wrap: wrap;
    }

    .links a {
      color: #247090;
      text-decoration: none;
      font-weight: 500;
      transition: color 0.2s;
    }

    .links a:hover {
      color: #1a5570;
      text-decoration: underline;
    }

    @media (max-width: 768px) {
      .error-code {
        font-size: 5rem;
      }

      h1 {
        font-size: 1.5rem;
      }

      .actions {
        flex-direction: column;
      }

      .btn-primary,
      .btn-secondary {
        width: 100%;
        text-align: center;
      }
    }
  `]
})
export class NotFoundComponent {}
