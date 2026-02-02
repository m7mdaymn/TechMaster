@echo off
REM TechMaster Frontend Deployment Script
REM This script builds the frontend for production deployment

echo ========================================
echo  TechMaster Frontend Deployment
echo ========================================
echo.

echo [1/3] Installing dependencies...
cd src\TechMaster.Frontend
call npm install

if %errorlevel% neq 0 (
    echo.
    echo ERROR: npm install failed!
    pause
    exit /b %errorlevel%
)

echo.
echo [2/3] Building for production...
call ng build --configuration=production

if %errorlevel% neq 0 (
    echo.
    echo ERROR: Build failed!
    pause
    exit /b %errorlevel%
)

echo.
echo [3/3] Creating deployment package...
cd dist\tech-master-frontend\browser
if exist ..\..\..\TechMaster-Frontend-Deploy.zip del ..\..\..\TechMaster-Frontend-Deploy.zip
powershell -Command "Compress-Archive -Path * -DestinationPath ..\..\..\TechMaster-Frontend-Deploy.zip"

echo.
echo ========================================
echo  Deployment package created successfully!
echo ========================================
echo.
echo Package location: src\TechMaster.Frontend\TechMaster-Frontend-Deploy.zip
echo.
echo Next steps:
echo 1. Upload TechMaster-Frontend-Deploy.zip to your web hosting
echo 2. Extract the files to your web root directory
echo 3. Configure your web server (nginx, IIS, etc.)
echo.
echo Production API URL: https://techmasterapi.runasp.net/api
echo.

cd ..\..\..\..\

pause
