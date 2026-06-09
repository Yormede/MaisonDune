@echo off
setlocal enabledelayedexpansion

set "ENV_FILE=%~dp0.env"
if not exist "%ENV_FILE%" (
    echo Missing deploy\.env file.
    echo Copy deploy\.env.example to deploy\.env and fill your private values.
    pause
    exit /b 1
)

for /f "usebackq eol=# tokens=1,* delims==" %%A in ("%ENV_FILE%") do (
    if not "%%A"=="" set "%%A=%%B"
)

if "%REMOTE_HOST%"=="" goto missing_config
if "%REMOTE_DIR%"=="" goto missing_config
if "%LOCAL_SITE%"=="" goto missing_config
if "%LOCAL_DEPLOY%"=="" goto missing_config

echo.
echo Maison Dune - deployment
echo Target: %REMOTE_HOST%:%REMOTE_DIR%
echo.

echo [1/4] Preparing remote folders...
ssh %REMOTE_HOST% "mkdir -p %REMOTE_DIR%/site/assets"
if %errorlevel% neq 0 goto ssh_error

echo [2/4] Uploading Docker config...
scp "%LOCAL_DEPLOY%\docker-compose.yml" %REMOTE_HOST%:%REMOTE_DIR%/docker-compose.yml
if %errorlevel% neq 0 goto copy_error
scp "%LOCAL_DEPLOY%\nginx.conf" %REMOTE_HOST%:%REMOTE_DIR%/nginx.conf
if %errorlevel% neq 0 goto copy_error

echo [3/4] Uploading site files...
scp "%LOCAL_SITE%\index.html" %REMOTE_HOST%:%REMOTE_DIR%/site/
if %errorlevel% neq 0 goto copy_error
scp "%LOCAL_SITE%\styles.css" %REMOTE_HOST%:%REMOTE_DIR%/site/
if %errorlevel% neq 0 goto copy_error
scp "%LOCAL_SITE%\script.js" %REMOTE_HOST%:%REMOTE_DIR%/site/
if %errorlevel% neq 0 goto copy_error
scp -r "%LOCAL_SITE%\assets\*" %REMOTE_HOST%:%REMOTE_DIR%/site/assets/
if %errorlevel% neq 0 goto copy_error

echo [4/4] Restarting container...
ssh %REMOTE_HOST% "cd %REMOTE_DIR% && docker compose pull && docker compose up -d --force-recreate"
if %errorlevel% neq 0 goto docker_error

echo.
echo Deployment complete.
if not "%PUBLIC_URL%"=="" echo URL: %PUBLIC_URL%
echo.
pause
exit /b 0

:missing_config
echo Missing required value in deploy\.env.
pause
exit /b 1

:ssh_error
echo SSH connection failed. Check REMOTE_HOST and network access.
pause
exit /b 1

:copy_error
echo File copy failed.
pause
exit /b 1

:docker_error
echo Docker compose failed.
pause
exit /b 1
