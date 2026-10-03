@echo off
echo ============================================
echo   Brew ^& Bean - Specialty Coffee POS
echo ============================================
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo [1/2] Installing dependencies...
    call npm install
    echo.
)

echo [2/2] Starting development server...
echo.
echo   App will be available at: http://localhost:5173
echo.
echo   Demo credentials:
echo     Admin:   admin / admin123
echo     Cashier: cashier / cash123
echo.
echo ============================================
echo.

call npm run dev
