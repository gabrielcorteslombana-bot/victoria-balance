Set WshShell = CreateObject("WScript.Shell")
WshShell.Run "cmd /c cd /d C:\Users\jesus.cortes\Downloads\victoria-balance\server && npm run dev", 0, False
WScript.Sleep 1500
WshShell.Run "cmd /c cd /d C:\Users\jesus.cortes\Downloads\victoria-balance\client && npx vite --host 0.0.0.0 --port 5173", 0, False
