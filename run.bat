@echo off
setlocal EnableDelayedExpansion

REM Store the original directory
set "ORIGINAL_DIR=%CD%"

REM Check if virtual environment exists
if not exist "backend\venv\Scripts\activate" (
    echo Virtual environment not found! Please set up the environment first.
    exit /b 1
)

REM Start Django backend
cd backend || (
    echo Failed to change to backend directory
    exit /b 1
)
call venv\Scripts\activate || (
    echo Failed to activate virtual environment
    cd "%ORIGINAL_DIR%"
    exit /b 1
)
cd ParkingManagementSystem || (
    echo Failed to change to ParkingManagementSystem directory
    deactivate
    cd "%ORIGINAL_DIR%"
    exit /b 1
)

REM Start Django server with title
start "Django Server" cmd /k "python manage.py runserver 0.0.0.0:8000"

REM Return to root directory
cd "%ORIGINAL_DIR%"

REM Start Vite frontend
cd frontend || (
    echo Failed to change to frontend directory
    taskkill /FI "WINDOWTITLE eq Django Server*" /T /F
    exit /b 1
)

REM Check if node_modules exists
if not exist "node_modules\" (
    echo Node modules not found! Please run 'npm install' first.
    taskkill /FI "WINDOWTITLE eq Django Server*" /T /F
    cd "%ORIGINAL_DIR%"
    exit /b 1
)

REM Start Vite server with title
start "Vite Server" cmd /k "npm run dev"

echo Servers started successfully!
echo To stop all servers, close this window or press Ctrl+C

REM Wait for user input before closing
pause

REM Cleanup on exit
taskkill /FI "WINDOWTITLE eq Django Server*" /T /F
taskkill /FI "WINDOWTITLE eq Vite Server*" /T /F
cd "%ORIGINAL_DIR%"
endlocal
