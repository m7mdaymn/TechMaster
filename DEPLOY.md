# TechMaster Deployment Guide

## 📦 Backend Deployment (ASP.NET Core API)

### Option 1: Publish to Folder (For Server Upload)

```bash
# Navigate to API project
cd src/TechMaster.API

# Publish for Linux server
dotnet publish -c Release -r linux-x64 --self-contained false -o ./publish

# Publish for Windows server
dotnet publish -c Release -r win-x64 --self-contained false -o ./publish

# Publish as self-contained (includes .NET runtime)
dotnet publish -c Release -r linux-x64 --self-contained true -o ./publish
```

### Option 2: Using Publish Profile

```bash
cd src/TechMaster.API
dotnet publish /p:PublishProfile=FolderProfile
```

The published files will be in: `src/TechMaster.API/bin/Release/net8.0/publish/`

### Upload to Server

1. **Upload published files** to your server (e.g., `/var/www/techmaster-api/`)

2. **Create appsettings.Production.json** on server:
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "YOUR_PRODUCTION_DATABASE_CONNECTION_STRING"
  },
  "Jwt": {
    "Key": "YOUR_PRODUCTION_JWT_SECRET_KEY_AT_LEAST_32_CHARACTERS",
    "Issuer": "https://api.yourdomain.com",
    "Audience": "https://yourdomain.com"
  },
  "Logging": {
    "LogLevel": {
      "Default": "Warning",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "AllowedHosts": "*",
  "AllowedOrigins": "https://yourdomain.com",
  "FileStorage": {
    "MaxFileSizeMB": 100,
    "AllowedExtensions": ".jpg,.jpeg,.png,.gif,.pdf,.mp4,.mov,.avi,.zip"
  }
}
```

3. **Set environment variable**:
```bash
export ASPNETCORE_ENVIRONMENT=Production
```

4. **Run the application**:
```bash
# Direct run
dotnet TechMaster.API.dll

# Or use systemd service (recommended)
```

### Setup Systemd Service (Linux)

Create `/etc/systemd/system/techmaster-api.service`:

```ini
[Unit]
Description=TechMaster API
After=network.target

[Service]
WorkingDirectory=/var/www/techmaster-api
ExecStart=/usr/bin/dotnet /var/www/techmaster-api/TechMaster.API.dll
Restart=always
RestartSec=10
KillSignal=SIGINT
SyslogIdentifier=techmaster-api
User=www-data
Environment=ASPNETCORE_ENVIRONMENT=Production
Environment=DOTNET_PRINT_TELEMETRY_MESSAGE=false

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable techmaster-api
sudo systemctl start techmaster-api
sudo systemctl status techmaster-api
```

### Setup Nginx Reverse Proxy

Create `/etc/nginx/sites-available/techmaster-api`:

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection keep-alive;
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # File upload size
        client_max_body_size 100M;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/techmaster-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### SSL Setup (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.yourdomain.com
```

---

## 🌐 Frontend Deployment (Angular)

### Build for Production

```bash
cd src/TechMaster.Frontend

# Build with production configuration
npm run build

# Or with base href for subdirectory
ng build --configuration production --base-href=/

# Output will be in: dist/techmaster-frontend/
```

### Update Environment for Production

Before building, update `src/environments/environment.ts`:

```typescript
export const environment = {
  production: true,
  apiUrl: 'https://api.yourdomain.com/api',
  whatsappNumber: '+201234567890'
};
```

### Deploy to Server

1. **Upload dist folder** to server (e.g., `/var/www/techmaster-frontend/`)

```bash
# From local machine
scp -r dist/techmaster-frontend/* user@yourserver:/var/www/techmaster-frontend/
```

2. **Setup Nginx for Angular**

Create `/etc/nginx/sites-available/techmaster-frontend`:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    root /var/www/techmaster-frontend;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
```

Enable and reload:
```bash
sudo ln -s /etc/nginx/sites-available/techmaster-frontend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

3. **Setup SSL**:
```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

---

## 🗄️ Database Setup

### SQL Server (Production)

1. **Backup development database**:
```bash
# From development
dotnet ef database update --project src/TechMaster.Infrastructure
```

2. **Generate SQL script** (optional):
```bash
dotnet ef migrations script --project src/TechMaster.Infrastructure --output migration.sql
```

3. **Update connection string** in production appsettings.Production.json

4. **Run migrations on production**:
```bash
dotnet ef database update --project src/TechMaster.Infrastructure
```

---

## 📋 Pre-Deployment Checklist

### Backend
- [ ] Update ConnectionStrings in appsettings.Production.json
- [ ] Update JWT secret key (min 32 characters)
- [ ] Set production URLs (Issuer, Audience, AllowedOrigins)
- [ ] Configure file upload limits
- [ ] Set up database backups
- [ ] Configure logging (e.g., Serilog to files)
- [ ] Test all API endpoints
- [ ] Set up SSL certificate

### Frontend
- [ ] Update environment.ts with production API URL
- [ ] Build with --configuration production
- [ ] Test build locally (ng serve --configuration production)
- [ ] Configure Nginx for SPA routing
- [ ] Set up SSL certificate
- [ ] Configure CDN (optional)

### Server
- [ ] Install .NET 8 Runtime
- [ ] Install Nginx
- [ ] Configure firewall (allow ports 80, 443)
- [ ] Set up automated backups
- [ ] Configure monitoring
- [ ] Set up log rotation

---

## 🚀 Quick Deploy Commands

### Complete Backend Deploy
```bash
# 1. Publish
cd src/TechMaster.API
dotnet publish -c Release -r linux-x64 -o ./publish

# 2. Upload to server
scp -r publish/* user@yourserver:/var/www/techmaster-api/

# 3. Restart service (on server)
sudo systemctl restart techmaster-api
```

### Complete Frontend Deploy
```bash
# 1. Build
cd src/TechMaster.Frontend
npm run build

# 2. Upload to server
scp -r dist/techmaster-frontend/* user@yourserver:/var/www/techmaster-frontend/

# 3. Clear cache (on server)
sudo systemctl reload nginx
```

---

## 🔍 Troubleshooting

### Backend not starting
```bash
# Check logs
sudo journalctl -u techmaster-api -n 50

# Check if port is in use
sudo netstat -tulpn | grep :5000

# Verify permissions
sudo chown -R www-data:www-data /var/www/techmaster-api
```

### Frontend 404 errors
```bash
# Verify Nginx configuration
sudo nginx -t

# Check file permissions
ls -la /var/www/techmaster-frontend

# Verify try_files directive in Nginx config
```

### Database connection issues
- Verify connection string
- Check if database server is accessible
- Run migrations: `dotnet ef database update`

---

## 📞 Support

For issues, check logs:
- Backend: `/var/log/techmaster-api/` or `journalctl -u techmaster-api`
- Nginx: `/var/log/nginx/error.log`
- Application logs: Check Logs/ folder in API directory
