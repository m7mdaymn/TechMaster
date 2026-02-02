@echo off
REM TechMaster Backend Deployment Script
REM This script publishes the backend for Linux x64 deployment

echo ========================================
echo  TechMaster Backend Deployment
echo ========================================
echo.

echo [1/3] Cleaning previous builds...
cd src\TechMaster.API
if exist publish rmdir /s /q publish
if exist bin\Release rmdir /s /q bin\Release

echo.
echo [2/3] Publishing for Linux x64...
dotnet publish -c Release -r linux-x64 --self-contained false -o ./publish

if %errorlevel% neq 0 (
    echo.
    echo ERROR: Build failed!
    pause
    exit /b %errorlevel%
)

echo.
echo [3/3] Creating deployment package...
cd publish
if exist ..\TechMaster-Backend-Deploy.zip del ..\TechMaster-Backend-Deploy.zip
powershell -Command "Compress-Archive -Path * -DestinationPath ..\TechMaster-Backend-Deploy.zip"

echo.
echo ========================================
echo  Deployment package created successfully!
echo ========================================
echo.
echo Package location: src\TechMaster.API\TechMaster-Backend-Deploy.zip
echo.
echo Next steps:
echo 1. Upload TechMaster-Backend-Deploy.zip to your hosting server
echo 2. Extract the files on the server
echo 3. Configure the server to run the application
echo.

cd ..\..\..\

pause
