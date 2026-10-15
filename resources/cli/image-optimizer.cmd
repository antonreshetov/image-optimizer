@echo off
setlocal
set ELECTRON_RUN_AS_NODE=1
"%~dp0..\..\Image Optimizer.exe" "%~dp0..\app.asar\build\cli\index.js" %*
exit /b %errorlevel%
