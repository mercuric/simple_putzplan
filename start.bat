@echo off
echo Putzplan App wird gestartet...
echo.

REM Prüfe ob Docker läuft
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo Fehler: Docker läuft nicht. Bitte starten Sie Docker Desktop.
    pause
    exit /b 1
)

echo Docker läuft. Starte Anwendung...
echo.

REM Starte die Anwendung
docker-compose up -d

if %errorlevel% equ 0 (
    echo.
    echo Anwendung erfolgreich gestartet!
    echo.
    echo Frontend: http://localhost
    echo Backend API: http://localhost:3001
    echo.
    echo Drücken Sie eine beliebige Taste, um den Browser zu öffnen...
    pause >nul
    start http://localhost
) else (
    echo.
    echo Fehler beim Starten der Anwendung.
    echo Prüfen Sie die Logs mit: docker-compose logs
)

echo.
echo Drücken Sie eine beliebige Taste zum Beenden...
pause >nul

