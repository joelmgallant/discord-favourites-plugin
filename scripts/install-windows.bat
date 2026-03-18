@echo off
setlocal

echo ============================================
echo  Discord Favourites Plugin - Windows Install
echo ============================================
echo.

set "BASE_DIR=%~dp0"
set "DIST_DIR=%BASE_DIR%dist"
set "INSTALLER_DIR=%BASE_DIR%dist\Installer"
set "INSTALLER_EXE=%INSTALLER_DIR%\VencordInstallerCli.exe"
set "INSTALLER_URL=https://github.com/Vencord/Installer/releases/latest/download/VencordInstallerCli.exe"

:: Check dist exists
if not exist "%DIST_DIR%\renderer.js" (
    echo ERROR: dist folder not found. Make sure you extracted the full zip.
    pause
    exit /b 1
)

:: Download installer if needed
if not exist "%INSTALLER_EXE%" (
    echo Downloading Vencord installer...
    mkdir "%INSTALLER_DIR%" 2>nul
    powershell -Command "Invoke-WebRequest -Uri '%INSTALLER_URL%' -OutFile '%INSTALLER_EXE%'"
    if errorlevel 1 (
        echo ERROR: Failed to download installer.
        pause
        exit /b 1
    )
    echo Download complete.
)

echo.
echo Installing Vencord with Favourites Plugin...
echo.

:: Run installer with our dist directory
set "VENCORD_USER_DATA_DIR=%BASE_DIR%"
set "VENCORD_DEV_INSTALL=1"
"%INSTALLER_EXE%" --install

echo.
echo ============================================
echo  Done! Restart Discord to activate.
echo  Enable "FavouritesPanel" in:
echo  Vencord Settings ^> Plugins
echo ============================================
echo.
pause
