@echo off
chcp 65001 > nul
title ProgectX Multiverse Hub
echo ===================================================
echo 🪐 ЗАПУСК МУЛЬТИВСЕЛЕННОЙ PROGECTX...
echo ===================================================
echo.
echo 🚀 Запуск локального сервера...
cd bestdog
start "" http://localhost:3000/
npm run dev
pause
