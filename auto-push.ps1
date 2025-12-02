# Скрипт для автоматического коммита и пуша изменений в GitHub
# Использование: .\auto-push.ps1

Write-Host "Проверка изменений в репозитории..." -ForegroundColor Cyan

# Проверяем статус git
$status = git status --porcelain

if ($status) {
    Write-Host "Найдены изменения. Добавляю файлы..." -ForegroundColor Yellow
    
    # Добавляем все изменения
    git add .
    
    # Создаем коммит с текущей датой и временем
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $commitMessage = "Auto-update: автоматическое обновление $timestamp"
    
    git commit -m $commitMessage
    
    Write-Host "Отправляю изменения на GitHub..." -ForegroundColor Green
    
    # Пушим изменения
    git push origin main
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Изменения успешно отправлены на GitHub!" -ForegroundColor Green
    } else {
        Write-Host "✗ Ошибка при отправке изменений" -ForegroundColor Red
    }
} else {
    Write-Host "Нет изменений для коммита." -ForegroundColor Gray
}

