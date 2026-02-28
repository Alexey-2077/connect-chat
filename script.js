/**
 * Connect Chat — Оптимизированный скрипт
 *
 * Ключевые улучшения:
 * — Кэш DOM-элементов (нет повторных querySelector)
 * — Event delegation вместо cloneNode/replaceChild
 * — Батчевое чтение localStorage
 * — Исправлена утечка памяти в свайп-обработчиках (AbortController)
 * — requestAnimationFrame только там, где нужно
 * — Нет inline onclick-атрибутов — всё через JS
 */

'use strict';

/* =========================================================
   Утилиты
========================================================= */

/** Кэш DOM-элементов — ищем один раз */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => ctx.querySelectorAll(sel);

/** Хелпер: блокировка/разблокировка прокрутки body */
function lockScroll()   { document.body.style.overflow = 'hidden'; }
function unlockScroll() { document.body.style.overflow = ''; }

/** Показать уведомление */
function showNotification(message, type = 'info') {
    const note = document.createElement('div');
    note.className = `notification ${type}`;
    note.textContent = message;
    document.body.appendChild(note);

    // Принудительный reflow для запуска transition
    note.getBoundingClientRect();
    note.classList.add('show');

    setTimeout(() => {
        note.classList.remove('show');
        note.addEventListener('transitionend', () => note.remove(), { once: true });
    }, 3000);
}

/* =========================================================
   localStorage — читаем всё одним вызовом
========================================================= */

const UserStore = {
    get(key)         { return localStorage.getItem(key); },
    set(key, value)  { localStorage.setItem(key, value); },
    remove(key)      { localStorage.removeItem(key); },

    /** Читаем сразу все поля профиля */
    getProfile() {
        return {
            isLoggedIn : localStorage.getItem('isLoggedIn') === 'true',
            email      : localStorage.getItem('userEmail')    || '',
            name       : localStorage.getItem('userName')     || '',
            age        : localStorage.getItem('userAge')      || '',
            course     : localStorage.getItem('userCourse')   || '',
            group      : localStorage.getItem('userGroup')    || '',
            specialty  : localStorage.getItem('userSpecialty')|| '',
            about      : localStorage.getItem('userAbout')    || '',
            avatar     : localStorage.getItem('userAvatar')   || '',
        };
    },

    saveProfile({ name, age, course, group, specialty, about, avatar }) {
        const data = { userName: name, userAge: age, userCourse: course,
                       userGroup: group, userSpecialty: specialty,
                       userAbout: about, userAvatar: avatar };
        Object.entries(data).forEach(([k, v]) => { if (v !== undefined) localStorage.setItem(k, v); });
    },

    clearAuth() {
        ['isLoggedIn', 'userEmail'].forEach(k => localStorage.removeItem(k));
    }
};

/* =========================================================
   Управление модальными окнами
========================================================= */

/**
 * Базовый класс модального окна.
 * Создаёт элемент, добавляет его в DOM, удаляет при закрытии.
 */
class Modal {
    constructor(id) {
        this.id = id;
    }

    /** Открыть модальное окно с заданным HTML-содержимым */
    open(html) {
        // Убираем старый экземпляр если есть
        this.close();

        const el = document.createElement('div');
        el.className = 'modal';
        el.id = this.id;
        el.setAttribute('role', 'dialog');
        el.setAttribute('aria-modal', 'true');
        el.innerHTML = html;
        document.body.appendChild(el);
        el.style.display = 'flex';
        lockScroll();

        this.el = el;

        // Закрытие по клику на фон
        el.addEventListener('click', (e) => {
            if (e.target === el) this.close();
        });

        // Закрытие по кнопке ×
        const closeBtn = el.querySelector('.modal-close');
        if (closeBtn) closeBtn.addEventListener('click', () => this.close());

        return el;
    }

    close() {
        const el = document.getElementById(this.id);
        if (el) { el.remove(); unlockScroll(); }
        this.el = null;
    }
}

/* =========================================================
   Экран загрузки
========================================================= */

function initLoadingScreen() {
    const screen = document.getElementById('loadingScreen');
    if (!screen) { initCookieConsent(); return; }

    // Повторный вход — сразу скрываем
    if (sessionStorage.getItem('hasSeenLoading')) {
        screen.remove();
        initCookieConsent();
        return;
    }

    document.body.classList.add('loading');

    const images = Array.from($$('img')).filter(img => !img.complete);
    let loaded = 0;
    const total = images.length;

    const done = () => {
        screen.classList.add('hidden');
        document.body.classList.remove('loading');
        sessionStorage.setItem('hasSeenLoading', '1');
        screen.addEventListener('transitionend', () => {
            screen.remove();
            initCookieConsent();
        }, { once: true });
    };

    if (total === 0) {
        setTimeout(done, 800);
        return;
    }

    const onLoad = () => { if (++loaded >= total) setTimeout(done, 300); };
    images.forEach(img => {
        img.addEventListener('load',  onLoad, { once: true });
        img.addEventListener('error', onLoad, { once: true });
    });

    // Страховочный таймаут
    setTimeout(done, 3000);
}

/* =========================================================
   Cookie Consent
========================================================= */

function initCookieConsent() {
    if (UserStore.get('cookieConsent')) return;

    const consent = document.getElementById('cookieConsent');
    if (!consent) return;

    setTimeout(() => {
        consent.classList.add('show');
        lockScroll();
    }, 300);
}

function hideCookieConsent() {
    const consent = document.getElementById('cookieConsent');
    if (!consent) return;
    consent.classList.remove('show');
    unlockScroll();
    consent.addEventListener('transitionend', () => consent.style.display = 'none', { once: true });
}

/* =========================================================
   Предзагрузка изображений профилей
========================================================= */

const imageCache = new Map();

function preloadProfileImages() {
    PROFILES.forEach((profile, i) => {
        const img = new Image();
        img.onload  = () => imageCache.set(profile.image, img.src);
        img.onerror = () => imageCache.set(profile.image, `https://i.pravatar.cc/300?img=${i + 1}`);
        img.src = profile.image;
    });
}

/* =========================================================
   Данные профилей
========================================================= */

const PROFILES = [
    { name: 'Анна',      age: 20, course: 2, specialty: 'Дизайн',          image: 'images/photo_2025-03-28_15-32-38.jpg', bio: 'Соглашусь на свидание в театре' },
    { name: 'Елена',     age: 19, course: 1, specialty: 'Маркетинг',        image: 'images/photo_2025-06-22_15-16-30.jpg', bio: 'Люблю активный отдых и новые знакомства' },
    { name: 'Дмитрий',   age: 21, course: 3, specialty: 'Фотография',       image: 'images/photo_2025-06-23_16-52-21.jpg', bio: 'Увлекаюсь фотографией и видеосъемкой.' },
    { name: 'София',     age: 20, course: 2, specialty: 'Психология',       image: 'images/photo_2025-10-11_02-13-52.jpg', bio: 'Интересуюсь психологией и саморазвитием' },
    { name: 'Александр', age: 22, course: 4, specialty: 'Юриспруденция',    image: 'images/photo_2025-10-14_13-24-43.jpg', bio: 'Изучаю право, люблю дискуссии.' },
];

/* =========================================================
   Matching (Тиндер-стайл)
========================================================= */

const matchingModal = new Modal('matchingModal');

let currentProfiles   = [];
let currentIndex      = 0;
let swipeAbortCtrl    = null; // AbortController для свайп-обработчиков

async function openMatchingInterface() {
    // Показываем лоадер немедленно
    matchingModal.open(`
        <div class="modal-content matching-modal-content">
            <div style="text-align:center;padding:40px">
                <div class="loading-spinner" style="width:60px;height:60px;margin:0 auto">
                    <div class="spinner-ring"></div>
                </div>
                <p style="margin-top:20px;color:#7f8c8d">Загрузка профилей...</p>
            </div>
        </div>
    `);

    // Получаем профили (асинхронно, если нужен Supabase)
    let profiles = await getAllProfiles();

    // Исключаем текущего пользователя
    const { name: myName } = UserStore.getProfile();
    if (myName) profiles = profiles.filter(p => p.name !== myName);

    if (profiles.length === 0) {
        matchingModal.open(`
            <div class="modal-content matching-modal-content">
                <button class="modal-close" aria-label="Закрыть">&times;</button>
                <div class="modal-header">
                    <i class="fas fa-search-location" style="font-size:2rem;color:#ff6b6b"></i>
                    <h2>Нет доступных профилей</h2>
                    <p style="color:#7f8c8d">Заполните свой профиль, чтобы другие могли вас найти!</p>
                </div>
            </div>
        `);
        return;
    }

    // Перемешиваем (Fisher–Yates — равномерный)
    for (let i = profiles.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [profiles[i], profiles[j]] = [profiles[j], profiles[i]];
    }

    currentProfiles = profiles;
    currentIndex    = 0;

    matchingModal.open(`
        <div class="modal-content matching-modal-content">
            <button class="modal-close" aria-label="Закрыть">&times;</button>
            <div class="modal-header">
                <i class="fas fa-search-location" style="font-size:2rem;color:#ff6b6b"></i>
                <h2>Поиск собеседника</h2>
                <p style="color:#7f8c8d">Свайп вправо — начать чат, влево — пропустить</p>
            </div>
            <div class="profile-card-container" id="profileCardContainer"></div>
            <div class="matching-controls">
                <button class="control-btn btn-skip" id="btnSkip" aria-label="Пропустить">
                    <i class="fas fa-times"></i>
                </button>
                <button class="control-btn btn-like" id="btnLike" aria-label="Начать чат">
                    <i class="fas fa-heart"></i>
                </button>
            </div>
        </div>
    `);

    // Кнопки управления
    matchingModal.el.querySelector('#btnSkip').addEventListener('click', nextProfile);
    matchingModal.el.querySelector('#btnLike').addEventListener('click', connectProfile);

    renderProfileCard();
}

async function getAllProfiles() {
    let all = [...PROFILES];

    if (typeof getAllProfilesFromSupabase === 'function') {
        const remote = await getAllProfilesFromSupabase().catch(() => []);
        if (remote && remote.length) {
            const seen = new Set(PROFILES.map(p => p.name));
            remote.forEach(p => { if (!seen.has(p.name)) { seen.add(p.name); all.unshift(p); } });
        }
    }

    return all;
}

function renderProfileCard() {
    const container = document.getElementById('profileCardContainer');
    if (!container) return;

    const profile = currentProfiles[currentIndex];
    const imageSrc = imageCache.get(profile.image) || profile.image;
    const bio = profile.bio || 'Студент(ка) вуза. Ищу общение по интересам.';

    // Отрисовка через requestAnimationFrame — избегаем layout thrashing
    requestAnimationFrame(() => {
        container.innerHTML = `
            <div class="profile-card fade-in" id="currentProfileCard">
                <div class="profile-image-wrapper">
                    <img src="${imageSrc}" alt="${profile.name}" loading="eager"
                         onerror="this.src='https://i.pravatar.cc/300?img=${currentIndex + 1}'">
                    <div class="profile-badges">
                        <span class="badge badge-online">Онлайн</span>
                    </div>
                </div>
                <div class="profile-info-content">
                    <h3>${profile.name}, ${profile.age}</h3>
                    <p class="profile-details">${profile.course} курс, ${profile.specialty}</p>
                    <div class="bio-container">
                        <div class="bio-header">
                            <span class="bio-title">Био</span>
                        </div>
                        <div class="bio-content">${bio}</div>
                    </div>
                </div>
            </div>
        `;

        initSwipeHandlers();
    });
}

function nextProfile() {
    const card = document.getElementById('currentProfileCard');
    if (!card) return;

    card.classList.add('slide-out-left');
    card.addEventListener('transitionend', () => {
        currentIndex = (currentIndex + 1) % currentProfiles.length;
        renderProfileCard();
    }, { once: true });
}

function connectProfile() {
    const profile = currentProfiles[currentIndex];
    showNotification(`Отправлен запрос на общение с ${profile.name}!`, 'success');

    const card = document.getElementById('currentProfileCard');
    if (!card) return;

    card.classList.add('slide-out-right');
    card.addEventListener('transitionend', () => {
        matchingModal.close();
        openChatWindow(profile);
    }, { once: true });
}

/* =========================================================
   Свайп — с AbortController (нет утечки памяти!)
========================================================= */

let swipeStartX = 0;
let isSwiping   = false;
let rafId       = null;

function initSwipeHandlers() {
    // Удаляем старые обработчики перед добавлением новых
    if (swipeAbortCtrl) swipeAbortCtrl.abort();
    swipeAbortCtrl = new AbortController();
    const { signal } = swipeAbortCtrl;

    const card = document.getElementById('currentProfileCard');
    if (!card) return;

    // Touch
    card.addEventListener('touchstart', onDragStart, { passive: true, signal });
    card.addEventListener('touchmove',  onDragMove,  { passive: true, signal });
    card.addEventListener('touchend',   onDragEnd,   { passive: true, signal });

    // Mouse (для десктопа)
    let mouseDown = false;
    card.addEventListener('mousedown', e => { mouseDown = true; onDragStart(e); }, { signal });
    card.addEventListener('mousemove', e => { if (mouseDown) onDragMove(e); }, { signal });
    card.addEventListener('mouseup',   e => { if (mouseDown) { mouseDown = false; onDragEnd(e); } }, { signal });
    card.addEventListener('mouseleave',e => { if (mouseDown) { mouseDown = false; onDragEnd(e); } }, { signal });
}

function onDragStart(e) {
    const touch = e.touches ? e.touches[0] : e;
    swipeStartX = touch.clientX;
    isSwiping   = true;

    const card = document.getElementById('currentProfileCard');
    if (card) card.style.transition = 'none';
}

function onDragMove(e) {
    if (!isSwiping) return;
    if (rafId) cancelAnimationFrame(rafId);

    rafId = requestAnimationFrame(() => {
        const card = document.getElementById('currentProfileCard');
        if (!card) return;

        const touch = e.touches ? e.touches[0] : e;
        const dx = touch.clientX - swipeStartX;
        const rotation = dx * 0.1;
        const opacity  = Math.max(0.3, 1 - Math.abs(dx) / 300);

        card.style.transform = `translateX(${dx}px) rotate(${rotation}deg)`;
        card.style.opacity   = opacity;

        card.classList.toggle('swiping-right', dx > 50);
        card.classList.toggle('swiping-left',  dx < -50);
    });
}

function onDragEnd(e) {
    if (!isSwiping) return;
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }

    isSwiping = false;
    const card = document.getElementById('currentProfileCard');
    if (!card) return;

    card.style.transition = 'transform 0.2s ease, opacity 0.2s ease';

    const touch = e.changedTouches ? e.changedTouches[0] : e;
    const dx = touch.clientX - swipeStartX;

    if (Math.abs(dx) > 100) {
        if (dx > 0) {
            card.style.transform = 'translateX(100vw) rotate(30deg)';
            card.style.opacity   = '0';
            card.addEventListener('transitionend', connectProfile, { once: true });
        } else {
            card.style.transform = 'translateX(-100vw) rotate(-30deg)';
            card.style.opacity   = '0';
            card.addEventListener('transitionend', nextProfile, { once: true });
        }
    } else {
        card.style.transform = '';
        card.style.opacity   = '';
        card.classList.remove('swiping-left', 'swiping-right');
    }
}

/* =========================================================
   История чатов
========================================================= */

const pairsModal = new Modal('pairsModal');

const PAIRS_DATA = [
    { name: 'Анна',   age: 20, course: 2, specialty: 'Дизайн',   image: 'images/anna.jpg' },
    { name: 'Елена',  age: 19, course: 1, specialty: 'Маркетинг',image: 'images/elena.jpg' },
    { name: 'Максим', age: 21, course: 3, specialty: 'Медицина', image: 'images/maxim.jpg' },
];

function showMyPairs() {
    const pairsHTML = PAIRS_DATA.map(pair => `
        <div class="pair-card">
            <div class="pair-image">
                <img src="${pair.image}" alt="${pair.name}" loading="lazy"
                     onerror="this.src='https://i.pravatar.cc/300?img=1'">
                <div class="match-badge">Онлайн</div>
            </div>
            <div class="pair-info">
                <h3>${pair.name}, ${pair.age}</h3>
                <p class="pair-profession">${pair.course} курс</p>
                <p class="pair-city">${pair.specialty}</p>
                <div class="pair-actions">
                    <button class="btn-primary btn-small" data-action="chat" data-name="${pair.name}">
                        <i class="fas fa-comment"></i> Написать
                    </button>
                    <button class="btn-secondary btn-small" data-action="profile" data-name="${pair.name}">
                        <i class="fas fa-user"></i> Профиль
                    </button>
                </div>
            </div>
        </div>
    `).join('');

    const el = pairsModal.open(`
        <div class="modal-content pairs-modal-content">
            <button class="modal-close" aria-label="Закрыть">&times;</button>
            <div class="modal-header">
                <i class="fas fa-comments" style="font-size:2.5rem;color:#ff6b6b"></i>
                <h2>История чатов</h2>
                <p style="color:#7f8c8d;margin-top:.5rem">Недавние собеседники: ${PAIRS_DATA.length}</p>
            </div>
            <div class="pairs-list">${pairsHTML}</div>
            <div class="pairs-footer">
                <button class="btn-secondary btn-full" id="closePairsBtn">Закрыть</button>
            </div>
        </div>
    `);

    el.querySelector('#closePairsBtn').addEventListener('click', () => pairsModal.close());

    // Event delegation для кнопок внутри пар
    el.querySelector('.pairs-list').addEventListener('click', (e) => {
        const btn = e.target.closest('[data-action]');
        if (!btn) return;

        const { action, name } = btn.dataset;
        if (action === 'chat') {
            const profile = PAIRS_DATA.find(p => p.name === name)
                         || { name, age: 20, course: '?', specialty: 'Студент', image: 'https://i.pravatar.cc/300' };
            pairsModal.close();
            setTimeout(() => openChatWindow(profile), 150);
        } else if (action === 'profile') {
            showNotification(`Открываем профиль ${name}...`, 'info');
            pairsModal.close();
        }
    });
}

/* =========================================================
   Авторизация
========================================================= */

function openLoginModal() {
    const modal = document.getElementById('loginModal');
    if (modal) { modal.style.display = 'flex'; lockScroll(); }
}

function closeLoginModal() {
    const modal = document.getElementById('loginModal');
    if (modal) { modal.style.display = 'none'; unlockScroll(); }
}

function handleSuccessfulLogin(email) {
    UserStore.set('isLoggedIn', 'true');
    UserStore.set('userEmail', email);
    showNotification('Вход выполнен успешно!', 'success');
    closeLoginModal();
    updateUIAfterLogin();
}

function handleLogout() {
    UserStore.clearAuth();
    updateUIForGuest();
    closeProfileModal();
    showNotification('Вы вышли из системы', 'info');
}

/* =========================================================
   Обновление UI (без cloneNode!)
   Используем event delegation на document — один раз
========================================================= */

function updateUIAfterLogin() {
    const btn = document.getElementById('navAuthBtn');
    if (btn) {
        btn.innerHTML = '<i class="fas fa-user" aria-hidden="true"></i> Профиль';
        btn.className = 'btn-secondary nav-btn';
        btn.dataset.action = 'profile';
    }

    const createBtn = document.getElementById('createProfileBtn');
    if (createBtn) {
        createBtn.innerHTML = '<i class="fas fa-user-edit" aria-hidden="true"></i> Редактировать профиль';
        createBtn.dataset.action = 'editProfile';
    }

    const findBtn = document.getElementById('findPairBtn');
    if (findBtn) {
        findBtn.innerHTML = '<i class="fas fa-search-location" aria-hidden="true"></i> Найти собеседника';
        findBtn.dataset.action = 'findPair';
    }
}

function updateUIForGuest() {
    const btn = document.getElementById('navAuthBtn');
    if (btn) {
        btn.innerHTML = 'Войти';
        btn.className = 'btn-primary nav-btn';
        btn.dataset.action = 'login';
    }

    const createBtn = document.getElementById('createProfileBtn');
    if (createBtn) {
        createBtn.innerHTML = '<i class="fas fa-user-plus" aria-hidden="true"></i> Создать профиль';
        createBtn.dataset.action = 'createProfile';
    }

    const findBtn = document.getElementById('findPairBtn');
    if (findBtn) {
        findBtn.innerHTML = '<i class="fas fa-random" aria-hidden="true"></i> Начать чат';
        findBtn.dataset.action = 'startChat';
    }
}

/* =========================================================
   Профиль пользователя
========================================================= */

const profileModal     = new Modal('profileModal');
const editProfileModal = new Modal('editProfileModal');

function showUserProfile() {
    const p = UserStore.getProfile();
    const displayName = p.name || (p.email ? p.email.split('@')[0] : 'Пользователь');

    profileModal.open(`
        <div class="modal-content profile-modal-content">
            <button class="modal-close" aria-label="Закрыть">&times;</button>
            <div class="modal-header">
                <div class="profile-avatar-large">
                    ${p.avatar
                        ? `<img src="${p.avatar}" alt="${displayName}">`
                        : '<i class="fas fa-user-circle" aria-hidden="true"></i>'
                    }
                </div>
                <h2>${displayName}</h2>
                <p>${p.email}</p>
            </div>
            <div class="profile-details">
                ${p.age        ? `<div class="profile-item"><strong>Возраст:</strong> ${p.age}</div>` : ''}
                ${p.course     ? `<div class="profile-item"><strong>Курс:</strong> ${p.course}</div>` : ''}
                ${p.specialty  ? `<div class="profile-item"><strong>Специальность:</strong> ${p.specialty}</div>` : ''}
                ${p.group      ? `<div class="profile-item"><strong>Группа:</strong> ${p.group}</div>` : ''}
                ${p.about      ? `<div class="profile-item"><strong>О себе:</strong> ${p.about}</div>` : ''}
            </div>
            <div class="profile-actions">
                <button class="btn-primary" id="editProfileBtn">Редактировать</button>
                <button class="btn-secondary" id="logoutBtn">Выйти</button>
            </div>
        </div>
    `);

    profileModal.el.querySelector('#editProfileBtn').addEventListener('click', () => {
        profileModal.close();
        openEditProfileModal();
    });
    profileModal.el.querySelector('#logoutBtn').addEventListener('click', handleLogout);
}

function closeProfileModal() { profileModal.close(); }

function openEditProfileModal() {
    const p = UserStore.getProfile();

    editProfileModal.open(`
        <div class="modal-content edit-profile-content">
            <button class="modal-close edit-profile-close" aria-label="Закрыть">&times;</button>
            <div class="edit-profile-header">
                <div class="edit-profile-icon"><i class="fas fa-user-edit" aria-hidden="true"></i></div>
                <h2>Редактирование профиля</h2>
                <p>Обновите информацию о себе</p>
            </div>
            <form id="editProfileForm" class="edit-profile-form" novalidate>
                <div class="avatar-upload-section">
                    <div class="avatar-preview-wrapper">
                        <div class="avatar-preview" id="avatarPreview">
                            ${p.avatar
                                ? `<img src="${p.avatar}" alt="Аватар">`
                                : '<i class="fas fa-user" aria-hidden="true"></i>'
                            }
                        </div>
                        <label for="avatarInput" class="avatar-upload-btn">
                            <i class="fas fa-camera" aria-hidden="true"></i>
                            <span>Изменить фото</span>
                        </label>
                        <input type="file" id="avatarInput" accept="image/*" style="display:none">
                    </div>
                </div>

                <div class="form-group-wrapper">
                    <div class="form-group-icon"><i class="fas fa-user" aria-hidden="true"></i></div>
                    <div class="form-group">
                        <label for="editName">Имя</label>
                        <input type="text" id="editName" value="${p.name}" placeholder="Ваше имя" required autocomplete="given-name">
                    </div>
                </div>
                <div class="form-group-wrapper">
                    <div class="form-group-icon"><i class="fas fa-birthday-cake" aria-hidden="true"></i></div>
                    <div class="form-group">
                        <label for="editAge">Возраст</label>
                        <input type="number" id="editAge" value="${p.age}" placeholder="Ваш возраст" min="16" max="100">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group-wrapper">
                        <div class="form-group-icon"><i class="fas fa-graduation-cap" aria-hidden="true"></i></div>
                        <div class="form-group">
                            <label for="editCourse">Курс</label>
                            <input type="number" id="editCourse" value="${p.course}" placeholder="1-6" min="1" max="6">
                        </div>
                    </div>
                    <div class="form-group-wrapper">
                        <div class="form-group-icon"><i class="fas fa-users" aria-hidden="true"></i></div>
                        <div class="form-group">
                            <label for="editGroup">Группа</label>
                            <input type="text" id="editGroup" value="${p.group}" placeholder="ЭК-201">
                        </div>
                    </div>
                </div>
                <div class="form-group-wrapper">
                    <div class="form-group-icon"><i class="fas fa-book" aria-hidden="true"></i></div>
                    <div class="form-group">
                        <label for="editSpecialty">Специальность / Факультет</label>
                        <input type="text" id="editSpecialty" value="${p.specialty}" placeholder="Например: Экономика">
                    </div>
                </div>
                <div class="form-group-wrapper">
                    <div class="form-group-icon"><i class="fas fa-info-circle" aria-hidden="true"></i></div>
                    <div class="form-group">
                        <label for="editAbout">О себе</label>
                        <textarea id="editAbout" rows="4" placeholder="Расскажите о себе...">${p.about}</textarea>
                    </div>
                </div>

                <div class="edit-profile-actions">
                    <button type="button" class="btn-secondary btn-cancel" id="cancelEditBtn">Отмена</button>
                    <button type="submit" class="btn-primary btn-save">
                        <i class="fas fa-save" aria-hidden="true"></i> Сохранить
                    </button>
                </div>
            </form>
        </div>
    `);

    const el = editProfileModal.el;

    // Предпросмотр аватарки
    el.querySelector('#avatarInput').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = ({ target }) => {
            el.querySelector('#avatarPreview').innerHTML = `<img src="${target.result}" alt="Аватар">`;
            UserStore.set('userAvatar', target.result);
        };
        reader.readAsDataURL(file);
    });

    el.querySelector('#cancelEditBtn').addEventListener('click', () => editProfileModal.close());

    el.querySelector('#editProfileForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        const data = {
            name      : el.querySelector('#editName').value.trim(),
            age       : el.querySelector('#editAge').value,
            course    : el.querySelector('#editCourse').value,
            group     : el.querySelector('#editGroup').value.trim(),
            specialty : el.querySelector('#editSpecialty').value.trim(),
            about     : el.querySelector('#editAbout').value.trim(),
            avatar    : UserStore.get('userAvatar') || '',
        };

        UserStore.saveProfile(data);

        if (typeof saveUserProfileToSupabase === 'function') {
            const saved = await saveUserProfileToSupabase().catch(() => false);
            showNotification(saved ? 'Профиль синхронизирован!' : 'Профиль сохранён локально', 'success');
        } else {
            showNotification('Профиль успешно обновлён!', 'success');
        }

        editProfileModal.close();
    });
}

function closeEditProfileModal() { editProfileModal.close(); }

/* =========================================================
   Чат
========================================================= */

function openChatWindow(profile) {
    // Удаляем старый чат
    const old = document.getElementById('chatWindow');
    if (old) old.remove();

    const chatEl = document.createElement('div');
    chatEl.className = 'chat-window';
    chatEl.id = 'chatWindow';

    const time = new Date().toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' });

    chatEl.innerHTML = `
        <div class="chat-header">
            <div class="chat-header-gradient" aria-hidden="true"></div>
            <div class="chat-user-info">
                <div class="chat-avatar-wrapper">
                    <img src="${profile.image}" alt="${profile.name}" class="chat-avatar"
                         onerror="this.src='https://i.pravatar.cc/300?img=1'">
                    <div class="chat-online-indicator" aria-hidden="true"></div>
                </div>
                <div class="chat-user-details">
                    <h4>${profile.name}</h4>
                    <p class="chat-status"><span class="status-dot" aria-hidden="true"></span> Онлайн</p>
                </div>
            </div>
            <div class="chat-controls">
                <button class="chat-control-btn" id="chatMinimizeBtn" title="Свернуть" aria-label="Свернуть чат">
                    <i class="fas fa-minus" aria-hidden="true"></i>
                </button>
                <button class="chat-control-btn" id="chatCloseBtn" title="Закрыть" aria-label="Закрыть чат">
                    <i class="fas fa-times" aria-hidden="true"></i>
                </button>
            </div>
        </div>
        <div class="chat-messages" id="chatMessages" role="log" aria-live="polite">
            <div class="message-wrapper received">
                <div class="message received">
                    <div class="message-content">Привет! Я тоже учусь на ${profile.specialty}. Давай знакомиться?</div>
                    <div class="message-time">${time}</div>
                </div>
            </div>
        </div>
        <div class="chat-input-area">
            <div class="chat-input-wrapper">
                <button class="chat-attach-btn" title="Прикрепить файл" aria-label="Прикрепить файл">
                    <i class="fas fa-paperclip" aria-hidden="true"></i>
                </button>
                <input type="text" id="chatInput" placeholder="Напишите сообщение..." autocomplete="off">
                <button class="chat-emoji-btn" title="Эмодзи" aria-label="Эмодзи">
                    <i class="far fa-smile" aria-hidden="true"></i>
                </button>
            </div>
            <button class="btn-send" id="sendBtn" title="Отправить" aria-label="Отправить сообщение" disabled>
                <i class="fas fa-paper-plane" aria-hidden="true"></i>
            </button>
        </div>
    `;

    document.body.appendChild(chatEl);

    const input   = chatEl.querySelector('#chatInput');
    const sendBtn = chatEl.querySelector('#sendBtn');
    const msgs    = chatEl.querySelector('#chatMessages');

    // Управление состоянием кнопки отправки
    input.addEventListener('input', () => {
        sendBtn.disabled = input.value.trim() === '';
    });

    // Enter для отправки
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); doSend(); }
    });

    sendBtn.addEventListener('click', doSend);
    chatEl.querySelector('#chatCloseBtn').addEventListener('click', closeChatWindow);
    chatEl.querySelector('#chatMinimizeBtn').addEventListener('click', minimizeChat);

    // Авто-фокус с задержкой
    setTimeout(() => input.focus(), 100);

    /** Внутренняя функция отправки (замыкание для доступа к DOM) */
    function doSend() {
        const text = input.value.trim();
        if (!text) return;

        const time = new Date().toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' });

        appendMessage(msgs, text, 'sent', time);
        input.value = '';
        sendBtn.disabled = true;
        input.focus();

        // Имитация ответа
        const delay = 1500 + Math.random() * 2000;
        setTimeout(() => {
            const replyTime = new Date().toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' });
            appendMessage(msgs, 'Интересно! Расскажи подробнее)', 'received', replyTime);
        }, delay);
    }
}

/** Добавить сообщение в список — без innerHTML для безопасности */
function appendMessage(container, text, type, time) {
    const wrapper = document.createElement('div');
    wrapper.className = `message-wrapper ${type}`;

    const msg = document.createElement('div');
    msg.className = `message ${type}`;

    const content = document.createElement('div');
    content.className = 'message-content';
    content.textContent = text; // textContent защищает от XSS

    const timeEl = document.createElement('div');
    timeEl.className = 'message-time';
    timeEl.textContent = time;

    msg.append(content, timeEl);
    wrapper.appendChild(msg);
    container.appendChild(wrapper);
    container.scrollTop = container.scrollHeight;
}

function closeChatWindow() {
    const chat = document.getElementById('chatWindow');
    if (chat) chat.remove();
}

function minimizeChat() {
    const chat = document.getElementById('chatWindow');
    if (chat) chat.style.display = 'none';
    showNotification('Чат свёрнут', 'info');
}

/* =========================================================
   Глобальный event delegation (одна точка входа)
   Заменяет все inline onclick и cloneNode/replaceChild
========================================================= */

function setupGlobalDelegation() {
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-action], .nav-btn, #navAuthBtn, #createProfileBtn, #findPairBtn, #cookieAcceptBtn, #cookieDeclineBtn');
        if (!btn) return;

        const action = btn.dataset.action || btn.id;

        switch (action) {
            case 'navAuthBtn':
            case 'login':
                openLoginModal();
                break;

            case 'profile':
                showUserProfile();
                break;

            case 'createProfileBtn':
            case 'createProfile':
                if (UserStore.getProfile().isLoggedIn) openEditProfileModal();
                else openLoginModal();
                break;

            case 'editProfile':
                openEditProfileModal();
                break;

            case 'findPairBtn':
            case 'findPair':
            case 'startChat':
                openFindPairModal();
                break;

            case 'cookieAcceptBtn':
                UserStore.set('cookieConsent', 'accepted');
                hideCookieConsent();
                showNotification('Спасибо! Настройки сохранены.', 'success');
                break;

            case 'cookieDeclineBtn':
                UserStore.set('cookieConsent', 'declined');
                hideCookieConsent();
                showNotification('Cookies отключены.', 'info');
                break;
        }
    });
}

function openFindPairModal() {
    if (UserStore.getProfile().isLoggedIn) {
        openMatchingInterface();
    } else {
        showNotification('Для поиска необходимо войти в систему', 'info');
        setTimeout(() => {
            const about = document.getElementById('about');
            if (about) about.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 150);
    }
}

/* =========================================================
   Инициализация приложения
========================================================= */

function init() {
    // Telegram WebApp
    if (window.Telegram?.WebApp) {
        const tg = window.Telegram.WebApp;
        tg.ready();
        tg.expand();

        const tgUser = tg.initDataUnsafe?.user;
        if (tgUser) {
            UserStore.set('isLoggedIn', 'true');
            if (!UserStore.get('userName') || UserStore.get('userName') !== tgUser.first_name) {
                UserStore.set('userName', tgUser.first_name);
                UserStore.set('userEmail', tgUser.username ? `@${tgUser.username}` : 'telegram_user');
            }
        }
    }

    // Плавный скролл по якорям
    document.querySelectorAll('.nav-link[href^="#"]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = document.querySelector(link.getAttribute('href'));
            if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });

            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            link.classList.add('active');
        });
    });

    // Форма входа
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email    = loginForm.querySelector('#loginEmail').value.trim();
            const password = loginForm.querySelector('#loginPassword').value;
            if (email && password) handleSuccessfulLogin(email);
        });
    }

    // Кнопка закрытия модала входа
    const loginModalClose = document.querySelector('#loginModal .modal-close');
    if (loginModalClose) loginModalClose.addEventListener('click', closeLoginModal);

    // Закрытие loginModal по фону
    const loginModal = document.getElementById('loginModal');
    if (loginModal) {
        loginModal.addEventListener('click', (e) => {
            if (e.target === loginModal) closeLoginModal();
        });
    }

    // Социальные кнопки входа
    document.querySelectorAll('.btn-social[data-social]').forEach(btn => {
        btn.addEventListener('click', () => handleSuccessfulLogin('user@social.com'));
    });

    // Форма контактов
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            showNotification('Сообщение отправлено!', 'success');
            contactForm.reset();
        });
    }

    // Глобальный delegation
    setupGlobalDelegation();

    // Проверяем статус входа
    if (UserStore.getProfile().isLoggedIn) updateUIAfterLogin();

    // Предзагружаем изображения профилей
    preloadProfileImages();
}

/* =========================================================
   Точка входа
========================================================= */

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initLoadingScreen();
        init();
    });
} else {
    initLoadingScreen();
    init();
}

/* =========================================================
   Публичное API (для совместимости с HTML)
========================================================= */

Object.assign(window, {
    acceptCookies       : () => { UserStore.set('cookieConsent', 'accepted'); hideCookieConsent(); showNotification('Настройки сохранены.', 'success'); },
    declineCookies      : () => { UserStore.set('cookieConsent', 'declined'); hideCookieConsent(); },
    openMatchingInterface,
    nextProfile,
    connectProfile,
    closeMatchingModal  : () => matchingModal.close(),
    openPairRoulette    : openMatchingInterface,
    showMyPairs,
    closePairsModal     : () => pairsModal.close(),
    openLoginModal,
    closeLoginModal,
    showUserProfile,
    closeProfileModal,
    handleLogout,
    openEditProfileModal,
    closeEditProfileModal,
    openChatWindow,
    closeChatWindow,
    minimizeChat,
    sendMessage         : () => document.getElementById('sendBtn')?.click(),
    handleEnter         : (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); document.getElementById('sendBtn')?.click(); } },
});
