@echo off
setlocal EnableExtensions
chcp 65001 >nul
title GIMP Code Block - Plug-in Maker
cd /d "%~dp0"

rem ---- couleurs (Windows 10 et plus) ----
for /f %%a in ('echo prompt $E ^| cmd') do set "E=%%a"
set "R=%E%[0m"
set "B=%E%[1m"
set "C1=%E%[38;5;208m"
set "C2=%E%[38;5;214m"
set "C3=%E%[38;5;220m"
set "C4=%E%[38;5;81m"
set "C5=%E%[38;5;75m"
set "G=%E%[38;5;114m"
set "D=%E%[38;5;245m"
set "W=%E%[97m"
set "RED=%E%[38;5;203m"

set "APP=%~dp0gimp-code-block\dist\gimp-code-block.html"
set "PLUG=%APPDATA%\GIMP\2.10\plug-ins"
set "INST=%~dp0gimp-code-block\tools\gimp-install.ps1"

:menu
cls
echo.
echo %C1%   ██████╗ ██╗███╗   ███╗██████╗ %R%
echo %C2%  ██╔════╝ ██║████╗ ████║██╔══██╗%R%
echo %C3%  ██║  ███╗██║██╔████╔██║██████╔╝%R%
echo %C4%  ██║   ██║██║██║╚██╔╝██║██╔═══╝ %R%
echo %C5%  ╚██████╔╝██║██║ ╚═╝ ██║██║     %R%
echo %C5%   ╚═════╝ ╚═╝╚═╝     ╚═╝╚═╝     %B%%W% Code Block%R%
echo.
echo %D%  Crée tes plug-ins GIMP 2.10 en emboîtant des blocs%R%
echo %D%  ─────────────────────────────────────────────────────%R%
echo.
echo    %B%%G%[1]%R%  ▶  Ouvrir l'atelier %D%(+ installation directe dans GIMP)%R%
echo    %B%%C4%[2]%R%  📁 Ouvrir le dossier des plug-ins de GIMP
echo    %B%%C2%[3]%R%  🧩 Installer les plug-ins en attente dans Téléchargements
echo    %B%%C3%[4]%R%  📘 Lire le guide d'utilisation
echo    %B%%RED%[5]%R%  ✖  Quitter
echo.
echo %D%  (l'atelier s'ouvre tout seul dans 10 secondes)%R%
echo.
choice /c 12345 /n /t 10 /d 1 /m "  Ton choix : "
if errorlevel 5 goto :eof
if errorlevel 4 goto guide
if errorlevel 3 goto install
if errorlevel 2 goto plugins

:open
if not exist "%APP%" goto missing
echo.
echo %G%  ✔ Ouverture de l'atelier dans ton navigateur…%R%
start "" "%APP%"
if not exist "%INST%" goto :eof
echo.
echo %C2%%B%  🧩 Installation directe dans GIMP%R%
echo %D%  Dans l'atelier, clique « 🧩 Installer dans GIMP » : le plug-in arrive ici tout seul.%R%
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%INST%" -Watch
goto :eof

:install
if not exist "%INST%" goto noinst
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%INST%"
echo.
echo %D%  Appuie sur une touche pour revenir au menu.%R%
pause >nul
goto menu

:noinst
echo.
echo %RED%  Fichier introuvable :%R% "%INST%"
pause >nul
goto menu

:missing
echo.
echo %RED%  Fichier introuvable :%R% "%APP%"
echo %D%  Garde ce .bat à la racine du dossier du projet.%R%
pause >nul
goto menu

:plugins
if not exist "%PLUG%" mkdir "%PLUG%"
echo.
echo %C4%  ✔ Dossier des plug-ins :%R% %PLUG%
echo %D%  Range ici les fichiers .py téléchargés, puis redémarre GIMP.%R%
start "" explorer "%PLUG%"
timeout /t 3 >nul
goto menu

:guide
start "" "https://github.com/XinAnsard/GIMP-2.10-Code-Block---Plug-in-Maker/blob/main/gimp-code-block/docs/guide/fr.md"
goto menu
