// Конфигурация Supabase
// ВАЖНО: Замените эти значения на ваши реальные ключи из Supabase проекта

const SUPABASE_URL = 'YOUR_SUPABASE_URL'; // Например: https://xxxxx.supabase.co
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY'; // Ваш публичный ключ

// Инициализация Supabase клиента
let supabase = null;

if (SUPABASE_URL !== 'YOUR_SUPABASE_URL' && SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY') {
    // Проверяем наличие библиотеки Supabase
    if (typeof window.supabase !== 'undefined') {
        const { createClient } = window.supabase;
        supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('Supabase подключен успешно');
    } else {
        console.warn('Supabase client не загружен. Убедитесь, что скрипт подключен.');
    }
} else {
    console.warn('Supabase не настроен. Используется локальное хранилище.');
}

// Функция для проверки подключения к Supabase
function isSupabaseConfigured() {
    return supabase !== null && SUPABASE_URL !== 'YOUR_SUPABASE_URL';
}

// Экспорт для использования в других файлах
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { supabase, isSupabaseConfigured };
}

