@echo off
start "Victoria Balance Backend" cmd /k "cd /d C:\Users\jesus.cortes\Downloads\victoria-balance\server && npm run dev"
start "Victoria Balance Frontend" cmd /k "cd /d C:\Users\jesus.cortes\Downloads\victoria-balance\client && npx vite --port 5173"
