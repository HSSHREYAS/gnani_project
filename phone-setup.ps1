<#
.SYNOPSIS
    Puts MatsyaMitra on a real Android phone connected by USB (for testing and demo recording).
.DESCRIPTION
    Run this AFTER .\quick-start.ps1 has the backend (port 8000) and Metro (port 8081) running.
    For every connected device it: installs the debug app if missing (or with -Reinstall),
    forwards the phone's localhost:8000 / :8081 to this laptop over USB, and launches the app.
    Keep the USB cable plugged in while using the app.
.EXAMPLE
    .\phone-setup.ps1
    .\phone-setup.ps1 -Reinstall
#>
param([switch]$Reinstall)

$adb = Join-Path $env:LOCALAPPDATA "Android\Sdk\platform-tools\adb.exe"
if (-not (Test-Path $adb)) { Write-Host "adb not found at $adb" -ForegroundColor Red; exit 1 }
$apk = Join-Path $PSScriptRoot "android\app\build\outputs\apk\debug\app-debug.apk"

$devices = @(& $adb devices | Select-String -Pattern '^(\S+)\s+device$' | ForEach-Object { $_.Matches[0].Groups[1].Value })
$phones = @($devices | Where-Object { $_ -notlike 'emulator-*' })
if ($phones.Count -eq 0) {
    Write-Host "No phone found." -ForegroundColor Yellow
    Write-Host "1. On the phone: Settings > About phone > tap 'Build number' 7 times."
    Write-Host "2. Settings > Developer options > turn on 'USB debugging'."
    Write-Host "3. Plug in the USB cable and tap 'Allow' on the phone, then run this again."
    & $adb devices
    exit 1
}

foreach ($serial in $devices) {
    Write-Host "== $serial ==" -ForegroundColor Cyan
    $installed = (& $adb -s $serial shell pm list packages com.matsyamitra) -match 'com.matsyamitra'
    if ($Reinstall -or -not $installed) {
        if (-not (Test-Path $apk)) { Write-Host "App file missing. Run .\quick-start.ps1 -Rebuild first." -ForegroundColor Red; exit 1 }
        Write-Host "Installing app (about a minute)..."
        & $adb -s $serial install -r $apk | Select-Object -Last 1
    }
    & $adb -s $serial reverse tcp:8000 tcp:8000 | Out-Null
    & $adb -s $serial reverse tcp:8081 tcp:8081 | Out-Null
    & $adb -s $serial shell am force-stop com.matsyamitra
    & $adb -s $serial shell monkey -p com.matsyamitra -c android.intent.category.LAUNCHER 1 | Out-Null
    Write-Host "Ready. Keep the cable connected." -ForegroundColor Green
}
