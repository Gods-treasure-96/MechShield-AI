@echo off
title MechShield AI Server
echo ========================================================
echo       Starting MechShield AI Hackathon Platform
echo ========================================================
echo.
echo Launching server on http://localhost:8000 ...
start "" http://localhost:8000
node "%~dp0server.js"
pause
