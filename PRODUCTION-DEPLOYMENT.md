# TechMaster Production Deployment Checklist

## ✅ Backend Configuration - COMPLETED

### 1. Database Connection
- **Status:** ✅ Configured
- **Server:** db39262.public.databaseasp.net
- **Database:** db39262
- **Connection String:** Configured in appsettings.json with Encrypt=True and TrustServerCertificate=True

### 2. API Settings
- **Base URL:** https://techmasterapi.runasp.net
- **Production Settings:** Configured in appsettings.Production.json
- **CORS:** Configured to allow production domain and wildcard subdomains

### 3. Authentication
- **JWT Secret:** Configured (32+ characters)
- **Issuer:** TechMaster
- **Audience:** TechMasterUsers
- **Token Expiration:** 60 minutes
- **Refresh Token:** 7 days

### 4. CORS Policy
```csharp
Configured origins:
- http://localhost:4200 (development)
- http://localhost:4201
- http://localhost:3000
- https://techmasterapi.runasp.net (production)
- Wildcard subdomain support enabled
```

## ✅ Frontend Configuration - COMPLETED

### Environment Settings (environment.prod.ts)
```typescript
{
  production: true,
  apiUrl: 'https://techmasterapi.runasp.net/api',
  hubUrl: '/hubs',
  whatsappNumber: '01108894920',
  defaultLanguage: 'en',
  supportedLanguages: ['en', 'ar']
}
```

## 📋 Deployment Steps

### Backend Deployment

1. **Republish the backend with updated settings:**
   ```bash
   cd c:\DATA\TechMaster\src\TechMaster.API
   dotnet publish -c Release -r linux-x64 --self-contained false -o ./publish
   ```

2. **Upload to runasp.net:**
   - Zip the `publish` folder
   - Upload to your runasp.net hosting
   - Ensure the server is configured to run .NET 8.0

3. **Run Database Migrations (if not done):**
   ```bash
   # On your hosting server or locally pointing to production DB
   dotnet ef database update --project TechMaster.Infrastructure --startup-project TechMaster.API
   ```

4. **Verify API is running:**
   - Visit: https://techmasterapi.runasp.net/api/health (if you have a health endpoint)
   - Or test any public endpoint like: https://techmasterapi.runasp.net/api/public/categories

### Frontend Deployment

1. **Build for production:**
   ```bash
   cd c:\DATA\TechMaster\src\TechMaster.Frontend
   npm install
   ng build --configuration=production
   ```

2. **Deploy the dist folder:**
   - The build output will be in `dist/tech-master-frontend/browser/`
   - Upload this to your web hosting (Netlify, Vercel, Azure Static Web Apps, etc.)

3. **Update CORS if frontend domain changes:**
   - If your frontend will be at a different domain (e.g., https://techmaster.com)
   - Update the CORS policy in Program.cs to include that domain
   - Republish the backend

## 🔍 Post-Deployment Verification

### Backend Tests
- [ ] API responds at https://techmasterapi.runasp.net/api
- [ ] Database connection works (check auth endpoints)
- [ ] JWT authentication works (try login)
- [ ] SignalR hubs are accessible at /hubs/chat and /hubs/notifications
- [ ] File uploads work (check wwwroot/uploads folder exists)

### Frontend Tests
- [ ] Frontend loads without errors
- [ ] Can connect to API (check browser console for CORS errors)
- [ ] Login/Registration works
- [ ] Course enrollment flow works
- [ ] Mark as complete functionality works
- [ ] Quizzes load and submit correctly
- [ ] Admin panel accessible
- [ ] Real-time chat/notifications work (SignalR)

### Integration Tests
- [ ] Student can browse courses
- [ ] Student can enroll in free courses
- [ ] Student can upload payment receipt for paid courses
- [ ] Admin can approve/reject enrollments
- [ ] Student can mark sessions as complete
- [ ] Student can take quizzes
- [ ] Instructor can manage courses and sessions
- [ ] Instructor can reply to student messages
- [ ] Currency displays as EGP everywhere

## ⚙️ Configuration Files Summary

### Backend Files
- `appsettings.json` - Main configuration with database connection
- `appsettings.Production.json` - Production-specific settings
- `Program.cs` - CORS and middleware configuration

### Frontend Files
- `src/environments/environment.prod.ts` - Production API URLs
- `angular.json` - Build configuration

## 🚨 Important Notes

1. **Database Seeding:**
   - The app will automatically seed the database on first run
   - Default admin credentials will be created
   - Make sure to change default passwords after first login

2. **File Uploads:**
   - Ensure the `wwwroot/uploads` folder exists on the server
   - Set proper permissions for file uploads

3. **HTTPS:**
   - Both backend and frontend should use HTTPS in production
   - Update CORS if you change domain names

4. **Environment Variables:**
   - Consider using environment variables for sensitive data
   - Update connection strings and JWT secrets for production

5. **Logging:**
   - Logs are written to `Logs/` folder
   - Monitor logs for errors after deployment

## 📞 Support
- Backend API: https://techmasterapi.runasp.net/api
- Database: db39262.public.databaseasp.net
- WhatsApp Support: 01108894920

---
**Last Updated:** January 2026
**Status:** Ready for deployment ✅
