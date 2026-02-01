# TechMaster - E-Learning Platform

A comprehensive enterprise-grade e-learning platform built with ASP.NET Core 8 and Angular 17+.

## 🚀 Features

### Student Features
- ✅ Browse and enroll in courses (free or paid)
- ✅ Upload payment receipts for paid courses
- ✅ Access learning content: Videos (YouTube/uploaded), PDFs, Articles, Quizzes, Assignments
- ✅ Track progress with automated session completion
- ✅ Take interactive quizzes with real-time scoring
- ✅ Message instructors directly
- ✅ View and download certificates upon course completion
- ✅ Rate and review courses

### Instructor Features
- ✅ Create and manage courses with modules and sessions
- ✅ Add various content types (videos, PDFs, articles, quizzes)
- ✅ Create quizzes with multiple question types
- ✅ Schedule live sessions (weekly recurring or one-time)
- ✅ Respond to student messages
- ✅ View revenue and earnings dashboard
- ✅ Manage course enrollments

### Admin Features
- ✅ Approve/reject course enrollments and payment receipts
- ✅ Manage system settings (payment methods, social links, etc.)
- ✅ View comprehensive revenue dashboards
- ✅ Manage courses, instructors, and students
- ✅ Configure platform settings (FAQs, testimonials, badges)
- ✅ Monitor platform statistics

## 🏗️ Tech Stack

### Backend
- **Framework:** ASP.NET Core 8
- **Database:** SQL Server / SQLite
- **ORM:** Entity Framework Core
- **Authentication:** JWT Bearer Tokens
- **Real-time:** SignalR (Chat & Notifications)
- **File Storage:** Local file system (configurable)

### Frontend
- **Framework:** Angular 17+
- **Language:** TypeScript
- **Styling:** CSS3 with modern layouts
- **State Management:** Signals
- **HTTP Client:** HttpClient with interceptors
- **Routing:** Angular Router with guards

## 📋 Prerequisites

- **Backend:**
  - .NET 8 SDK
  - SQL Server (or SQLite for development)
  - Visual Studio 2022 / VS Code

- **Frontend:**
  - Node.js 18+ and npm
  - Angular CLI 17+

## 🛠️ Installation

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/TechMaster.git
cd TechMaster
```

### 2. Backend Setup

```bash
cd src/TechMaster.API

# Restore dependencies
dotnet restore

# Update database connection string in appsettings.Development.json
# Then run migrations
dotnet ef database update --project ../TechMaster.Infrastructure

# Run the API
dotnet run
```

Backend will run on: `http://localhost:5000` or `https://localhost:5001`

### 3. Frontend Setup

```bash
cd src/TechMaster.Frontend

# Install dependencies
npm install

# Update API URL in src/environments/environment.ts if needed

# Run development server
ng serve
```

Frontend will run on: `http://localhost:4200`

## 🗄️ Database

### Run Migrations
```bash
cd src/TechMaster.Infrastructure
dotnet ef migrations add InitialCreate --startup-project ../TechMaster.API
dotnet ef database update --startup-project ../TechMaster.API
```

### Seed Data
The application includes automatic seeding for:
- Default admin user
- Sample categories
- System settings
- Payment methods

## 📁 Project Structure

```
TechMaster/
├── src/
│   ├── TechMaster.API/              # ASP.NET Core Web API
│   │   ├── Controllers/             # API Controllers (14 controllers)
│   │   ├── Hubs/                    # SignalR Hubs
│   │   ├── Middleware/              # Custom middleware
│   │   └── Properties/              # Publish profiles
│   │
│   ├── TechMaster.Application/      # Application layer
│   │   ├── DTOs/                    # Data Transfer Objects
│   │   └── Mappings/                # AutoMapper profiles
│   │
│   ├── TechMaster.Domain/           # Domain layer
│   │   ├── Entities/                # Domain entities
│   │   └── Enums/                   # Enumerations
│   │
│   ├── TechMaster.Infrastructure/   # Infrastructure layer
│   │   ├── Persistence/             # DbContext & configurations
│   │   ├── Services/                # Business logic services
│   │   ├── Seeding/                 # Database seeders
│   │   └── Migrations/              # EF Core migrations
│   │
│   └── TechMaster.Frontend/         # Angular application
│       └── src/
│           ├── app/
│           │   ├── core/            # Core services & guards
│           │   ├── features/        # Feature modules
│           │   │   ├── admin/       # Admin dashboard
│           │   │   ├── instructor/  # Instructor dashboard
│           │   │   └── student/     # Student dashboard
│           │   └── shared/          # Shared components
│           └── environments/        # Environment configs
│
├── .gitignore
├── DEPLOY.md                        # Deployment guide
└── README.md
```

## 🔐 Default Credentials

**Admin Account:**
- Email: `admin@techmaster.com`
- Password: `Admin@123`

## 🌐 API Endpoints

The API includes 95+ endpoints across 6 main controllers:

- **CoursesController:** Course management (28 endpoints)
- **EnrollmentsController:** Enrollment & progress (16 endpoints)
- **QuizzesController:** Quiz management (15 endpoints)
- **PublicController:** Public data (9 endpoints)
- **AdminSettingsController:** System settings (19 endpoints)
- **ChatController:** Messaging (8 endpoints)

API Documentation: Available at `/swagger` when running in development mode

## 🚀 Deployment

See [DEPLOY.md](DEPLOY.md) for comprehensive deployment instructions including:
- Backend deployment to Linux/Windows servers
- Frontend deployment with Nginx
- SSL setup with Let's Encrypt
- Database migration strategies
- Systemd service configuration

## 🧪 Testing

```bash
# Backend tests
cd src/TechMaster.API
dotnet test

# Frontend tests
cd src/TechMaster.Frontend
npm test
```

## 📝 Environment Variables

### Backend (appsettings.json)
- `ConnectionStrings:DefaultConnection` - Database connection string
- `Jwt:Key` - JWT secret key (min 32 chars)
- `Jwt:Issuer` - Token issuer URL
- `AllowedOrigins` - CORS allowed origins

### Frontend (environment.ts)
- `apiUrl` - Backend API URL
- `production` - Production mode flag
- `whatsappNumber` - Support WhatsApp number

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is proprietary software. All rights reserved.

## 👥 Authors

- TechMaster Development Team

## 📞 Support

For support, email: techmasterr.official@gmail.com
WhatsApp: +201108894920

---

## 🎯 Key Highlights

- ✅ **95+ API Endpoints** - Comprehensive REST API
- ✅ **Zero Build Errors** - Clean, production-ready code
- ✅ **EGP Currency** - Standardized to Egyptian Pound
- ✅ **Real-time Chat** - SignalR-powered messaging
- ✅ **Progress Tracking** - Automatic session completion
- ✅ **Multi-Content Support** - Videos, PDFs, Articles, Quizzes
- ✅ **Role-Based Access** - Student, Instructor, Admin roles
- ✅ **Responsive Design** - Mobile-friendly UI

Built with ❤️ using ASP.NET Core & Angular
