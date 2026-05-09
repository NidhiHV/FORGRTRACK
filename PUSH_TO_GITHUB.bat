@echo off
cd /d "C:\Users\nidhi\Documents\ForgeTrack"
echo --- FORGETRACK GITHUB PUSH TOOL ---
echo.
echo 1. Adding files...
"C:\Program Files\Git\bin\git.exe" add .
echo 2. Committing...
"C:\Program Files\Git\bin\git.exe" commit -m "Auto-push from ForgeTrack tool"
echo 3. Pushing to GitHub (A login window may appear)...
"C:\Program Files\Git\bin\git.exe" push -u origin main
echo.
echo --- DONE! You can close this window now. ---
pause
