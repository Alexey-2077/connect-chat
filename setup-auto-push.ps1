# Скрипт для настройки автоматического пуша изменений каждый час
# Запустите этот скрипт один раз для настройки

Write-Host "Настройка автоматического обновления GitHub..." -ForegroundColor Cyan

# Получаем путь к текущей директории
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$autoPushScript = Join-Path $scriptPath "auto-push.ps1"

# Проверяем, существует ли скрипт
if (-not (Test-Path $autoPushScript)) {
    Write-Host "Ошибка: файл auto-push.ps1 не найден!" -ForegroundColor Red
    exit 1
}

# Имя задачи в планировщике
$taskName = "GitHubAutoPush_ConnectChat"

# Проверяем, существует ли уже задача
$existingTask = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue

if ($existingTask) {
    Write-Host "Задача уже существует. Обновляю..." -ForegroundColor Yellow
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
}

# Создаем действие (запуск PowerShell скрипта)
$action = New-ScheduledTaskAction -Execute "PowerShell.exe" `
    -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$autoPushScript`""

# Создаем триггер (каждый час)
$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Hours 1) -RepetitionDuration (New-TimeSpan -Days 365)

# Настройки задачи
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable

# Создаем задачу
$principal = New-ScheduledTaskPrincipal -UserId "$env:USERDOMAIN\$env:USERNAME" -LogonType Interactive

try {
    Register-ScheduledTask -TaskName $taskName `
        -Action $action `
        -Trigger $trigger `
        -Settings $settings `
        -Principal $principal `
        -Description "Автоматическое обновление изменений в GitHub каждый час" | Out-Null
    
    Write-Host "✓ Задача успешно создана!" -ForegroundColor Green
    Write-Host "  Имя задачи: $taskName" -ForegroundColor Gray
    Write-Host "  Частота: каждый час" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Для проверки задачи выполните:" -ForegroundColor Cyan
    Write-Host "  Get-ScheduledTask -TaskName $taskName" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Для удаления задачи выполните:" -ForegroundColor Cyan
    Write-Host "  Unregister-ScheduledTask -TaskName $taskName -Confirm:`$false" -ForegroundColor Yellow
} catch {
    Write-Host "✗ Ошибка при создании задачи: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Попробуйте запустить PowerShell от имени администратора" -ForegroundColor Yellow
}

