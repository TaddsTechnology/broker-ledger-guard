@echo off
echo ==================================================
echo Broker ERP - Concurrent Application Starter
echo ==================================================
echo.

REM Check if we're in the correct directory
if not exist "package.json" (
    echo ERROR: Please run this script from the project root directory
    echo Current directory: %CD%
    pause
    exit /b 1
)

echo Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo Node.js version: 
node --version
echo.

echo Checking if backend dependencies are installed...
if not exist "backend\node_modules" (
    echo Installing backend dependencies...
    cd backend
    npm install
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install backend dependencies
        cd ..
        pause
        exit /b 1
    )
    cd ..
    echo Backend dependencies installed successfully
) else (
    echo Backend dependencies already installed
)
echo.

echo Checking if frontend dependencies are installed...
if not exist "node_modules" (
    echo Installing frontend dependencies...
    npm install
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install frontend dependencies
        pause
        exit /b 1
    )
    echo Frontend dependencies installed successfully
) else (
    echo Frontend dependencies already installed
)
echo.

echo Starting both Backend and Frontend servers concurrently...
echo.
echo Backend will run on port 3001
echo Frontend will run on port 5173
echo.
echo Press Ctrl+C to stop both servers
echo.

REM Install concurrently if not already installed
npm list -g concurrently >nul 2>&1
if %errorlevel% neq 0 (
    echo Installing concurrently globally...
    npm install -g concurrently
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install concurrently
        pause
        exit /b 1
    )
)

echo Starting servers...
concurrently --names "BACKEND,FRONTEND" -c "bgBlue.bold,bgGreen.bold" "cd backend && npm run dev" "npm run dev"