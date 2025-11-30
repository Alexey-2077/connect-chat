@echo off
echo ========================================
echo      LoveConnect - Сайт знакомств
echo ========================================
echo.
echo Сервер запускается на http://localhost:8000
echo.
echo Для остановки нажмите Ctrl+C
echo.
cd /d %~dp0
python -m http.server 8000
