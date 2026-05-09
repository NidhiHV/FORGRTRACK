@echo off
cd /d "C:\Users\nidhi\Documents\ForgeTrack"
echo --- FORGETRACK GITHUB PUSH TOOL ---
echo.
echo 1. Preparing files...
"C:\Program Files\Git\bin\git.exe" add .
echo 2. Committing...
"C:\Program Files\Git\bin\git.exe" commit -m "Final fix for Vercel deployment"
echo 3. FORCE Pushing to GitHub...
"C:\Program Files\Git\bin\git.exe" push -u origin main --force
echo.
echo --- DONE! You can close this window now. ---
pause
