document.addEventListener('DOMContentLoaded', function() {
    // Инициализация Telegram WebApp
    if (window.Telegram && window.Telegram.WebApp) {
        const tg = window.Telegram.WebApp;
        tg.ready();
        tg.expand(); // Развернуть на весь экран
        
        // Настройка цветов под тему Telegram (по желанию)
        // document.documentElement.style.setProperty('--bg-color', tg.backgroundColor);
        
        // Автоматический вход, если есть данные пользователя
        const user = tg.initDataUnsafe.user;
        if (user) {
            localStorage.setItem('isLoggedIn', 'true');
            // Если имя еще не сохранено или это новый вход
            if (!localStorage.getItem('userName') || localStorage.getItem('userName') !== user.first_name) {
                localStorage.setItem('userName', user.first_name);
                localStorage.setItem('userEmail', user.username ? `@${user.username}` : 'telegram_user');
            }
        }
    }

    // Обработка навигации
    const links = document.querySelectorAll('.nav-links a');
    
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);

            if (targetSection) {
                window.scrollTo({
                    top: targetSection.offsetTop - 70,
                    behavior: 'smooth'
                });

            // Обновление активной ссылки
                links.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
            }
        });
    });

    // Кнопка "Начать" в Hero секции
    setupHeroButtons();

    // Обработка формы входа
    setupLoginModal();
    
    // Проверка статуса входа при загрузке
    checkLoginStatus();
});

function setupHeroButtons() {
    const createProfileBtn = document.getElementById('createProfileBtn');
    const findPairBtn = document.getElementById('findPairBtn');
    
    if (createProfileBtn) {
        createProfileBtn.addEventListener('click', function(e) {
            e.preventDefault();
            const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
            
            if (isLoggedIn) {
                // Если пользователь залогинен, открываем редактирование профиля
                openEditProfileModal();
        } else {
                // Если не залогинен, открываем модальное окно входа
                openLoginModal();
            }
        });
    }
    
    if (findPairBtn) {
        findPairBtn.addEventListener('click', function(e) {
            e.preventDefault();
            openFindPairModal();
        });
    }
}

function setupLoginModal() {
    const loginForm = document.getElementById('loginForm');
    const closeBtn = document.querySelector('.close-modal');
    const modal = document.getElementById('loginModal');
    
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const email = this.querySelector('input[type="email"]').value;
            const password = this.querySelector('input[type="password"]').value;
            
            // Имитация входа
            if (email && password) {
                handleSuccessfulLogin(email);
        }
    });
}

    if (closeBtn) {
        closeBtn.addEventListener('click', closeLoginModal);
    }
    
    // Закрытие по клику вне окна
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeLoginModal();
        }
    });
}

    // Обработка кнопок соц. сетей
    const socialButtons = document.querySelectorAll('.social-btn');
    socialButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            // Имитация входа через соц. сети
            handleSuccessfulLogin('user@social.com');
        });
    });
}

// Проверка статуса входа
function checkLoginStatus() {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    if (isLoggedIn) {
        updateUIAfterLogin();
    }
}

// Уведомления
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Анимация появления
    setTimeout(() => notification.classList.add('show'), 10);
    
    // Удаление через 3 секунды
            setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function openRegisterModal() {
    showNotification('Открытие формы регистрации...', 'info');
    // Прокрутка к секции контактов или открытие модального окна регистрации
    setTimeout(() => {
        const contactSection = document.querySelector('#contact');
        if (contactSection) {
            const offsetTop = contactSection.offsetTop - 70;
            window.scrollTo({
                top: offsetTop,
                behavior: 'smooth'
            });
        }
    }, 300);
}

// Модальное окно поиска пары
function openFindPairModal() {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    
    if (isLoggedIn) {
        // Если пользователь залогинен, открываем поиск
        openMatchingInterface();
    } else {
        // Если не залогинен, прокручиваем к секции "О нас"
        showNotification('Для поиска пары необходимо войти в систему', 'info');
        setTimeout(() => {
            const aboutSection = document.querySelector('#about');
            if (aboutSection) {
                const offsetTop = aboutSection.offsetTop - 70;
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        }, 300);
    }
}

let matchingProfiles = [
    { name: 'Анна', age: 20, course: 2, specialty: 'Дизайн', image: 'images/anna.jpg', bio: 'Соглашусь на свидание в театре' },
    { name: 'Елена', age: 19, course: 1, specialty: 'Маркетинг', image: 'images/elena.jpg', bio: 'Люблю активный отдых и новые знакомства' },
    { name: 'Мария', age: 21, course: 3, specialty: 'Фотография', image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&h=300&fit=crop&crop=face', bio: 'Фотограф-любитель, ищу единомышленников' },
    { name: 'София', age: 20, course: 2, specialty: 'Психология', image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=300&fit=crop&crop=face', bio: 'Интересуюсь психологией и саморазвитием' },
    { name: 'Виктория', age: 22, course: 4, specialty: 'Юриспруденция', image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&h=300&fit=crop&crop=face', bio: 'Будущий юрист, люблю спорт и книги' },
    { name: 'Максим', age: 21, course: 3, specialty: 'Медицина', image: 'images/maxim.jpg', bio: 'Медик, увлекаюсь наукой и путешествиями' }
];

let currentProfileIndex = 0;

// Интерфейс поиска пары (Тиндер-стайл)
function openMatchingInterface() {
    // Удаляем старое модальное окно, если есть
    const oldModal = document.getElementById('matchingModal');
    if (oldModal) oldModal.remove();

    const matchingModal = document.createElement('div');
    matchingModal.className = 'modal';
    matchingModal.id = 'matchingModal';
    
    // Перемешиваем массив профилей при каждом открытии
    matchingProfiles.sort(() => Math.random() - 0.5);
    currentProfileIndex = 0;
    
    matchingModal.innerHTML = `
        <div class="modal-content matching-modal-content">
            <span class="modal-close matching-close">&times;</span>
            <div class="modal-header">
                <i class="fas fa-search-location" style="font-size: 2rem; color: #ff6b6b;"></i>
                <h2>Поиск собеседника</h2>
                <p style="color: #7f8c8d;">Найдите кого-то интересного для общения</p>
            </div>
            
            <div class="profile-card-container" id="profileCardContainer">
                <!-- Карточка будет добавлена через JS -->
            </div>
            
            <div class="matching-controls" style="display: none;">
                <!-- Кнопки скрыты, используется свайп -->
            </div>
        </div>
    `;
    
    document.body.appendChild(matchingModal);
    matchingModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    // Отрисовываем первый профиль
    renderProfileCard();
    
    // Закрытие модального окна
    const closeBtn = matchingModal.querySelector('.matching-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeMatchingModal);
    }
    
    matchingModal.addEventListener('click', function(e) {
        if (e.target === matchingModal) {
            closeMatchingModal();
        }
    });
}

function renderProfileCard() {
    const container = document.getElementById('profileCardContainer');
    if (!container) return;
    
    const profile = matchingProfiles[currentProfileIndex];
    const bio = profile.bio || 'Студент(ка) вуза. Ищу общение по интересам.';
    
    container.innerHTML = `
        <div class="profile-card fade-in" id="currentProfileCard">
            <div class="profile-image-wrapper">
                <img src="${profile.image}" alt="${profile.name}" onerror="this.src='https://i.pravatar.cc/300?img=${currentProfileIndex + 1}'">
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
                        <i class="fas fa-pencil-alt bio-edit-icon"></i>
                    </div>
                    <div class="bio-content">
                        ${bio}
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Инициализируем свайп для новой карточки
    initSwipeHandlers();
}

function nextProfile() {
    const card = document.querySelector('.profile-card');
    if (card) {
        card.classList.add('slide-out-left');
        setTimeout(() => {
            currentProfileIndex = (currentProfileIndex + 1) % matchingProfiles.length;
            renderProfileCard();
        }, 300);
    }
}

function connectProfile() {
    const profile = matchingProfiles[currentProfileIndex];
    showNotification(`Отправлен запрос на общение с ${profile.name}!`, 'success');
    
    const card = document.querySelector('.profile-card');
    if (card) {
        card.classList.add('slide-out-right');
        setTimeout(() => {
            closeMatchingModal();
            // Открываем окно чата
            openChatWindow(profile);
        }, 500);
    }
}

function closeMatchingModal() {
    const matchingModal = document.getElementById('matchingModal');
    if (matchingModal) {
        matchingModal.remove();
        document.body.style.overflow = 'auto';
    }
}

// Функциональность свайпа для карточек
let swipeStartX = 0;
let swipeStartY = 0;
let swipeCurrentX = 0;
let swipeCurrentY = 0;
let isSwiping = false;
let cardElement = null;

function initSwipeHandlers() {
    // Удаляем старые обработчики, если есть
    const oldCard = document.getElementById('currentProfileCard');
    if (oldCard && oldCard._swipeInitialized) {
        return; // Уже инициализировано
    }
    
    cardElement = document.getElementById('currentProfileCard');
    if (!cardElement) {
        console.log('Card element not found for swipe');
        return;
    }
    
    // Помечаем, что инициализировано
    cardElement._swipeInitialized = true;
    
    // Touch события для мобильных устройств
    cardElement.addEventListener('touchstart', handleSwipeStart, { passive: true });
    cardElement.addEventListener('touchmove', handleSwipeMove, { passive: true });
    cardElement.addEventListener('touchend', handleSwipeEnd, { passive: true });
    
    // Mouse события для десктопа (для тестирования)
    let isMouseDown = false;
    cardElement.addEventListener('mousedown', function(e) {
        isMouseDown = true;
        handleSwipeStart(e);
    });
    cardElement.addEventListener('mousemove', function(e) {
        if (isMouseDown) {
            handleSwipeMove(e);
        }
    });
    cardElement.addEventListener('mouseup', function(e) {
        if (isMouseDown) {
            isMouseDown = false;
            handleSwipeEnd(e);
        }
    });
    cardElement.addEventListener('mouseleave', function(e) {
        if (isMouseDown) {
            isMouseDown = false;
            handleSwipeEnd(e);
        }
    });
    
    console.log('Swipe handlers initialized');
}

function handleSwipeStart(e) {
    const touch = e.touches ? e.touches[0] : e;
    swipeStartX = touch.clientX;
    swipeStartY = touch.clientY;
    isSwiping = true;
    if (cardElement) {
        cardElement.style.transition = 'none';
    }
}

function handleSwipeMove(e) {
    if (!isSwiping || !cardElement) return;
    
    const touch = e.touches ? e.touches[0] : e;
    swipeCurrentX = touch.clientX - swipeStartX;
    swipeCurrentY = touch.clientY - swipeStartY;
    
    // Вращаем карточку при свайпе
    const rotation = swipeCurrentX * 0.1;
    cardElement.style.transform = `translateX(${swipeCurrentX}px) rotate(${rotation}deg)`;
    
    // Меняем прозрачность в зависимости от направления
    const opacity = 1 - Math.abs(swipeCurrentX) / 300;
    cardElement.style.opacity = Math.max(0.3, opacity);
    
    // Добавляем визуальную индикацию направления
    if (swipeCurrentX > 50) {
        cardElement.classList.add('swiping-right');
        cardElement.classList.remove('swiping-left');
    } else if (swipeCurrentX < -50) {
        cardElement.classList.add('swiping-left');
        cardElement.classList.remove('swiping-right');
    } else {
        cardElement.classList.remove('swiping-left', 'swiping-right');
    }
}

function handleSwipeEnd(e) {
    if (!isSwiping || !cardElement) return;
    
    isSwiping = false;
    cardElement.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
    
    const swipeThreshold = 100; // Минимальное расстояние для свайпа
    
    if (Math.abs(swipeCurrentX) > swipeThreshold) {
        if (swipeCurrentX > 0) {
            // Свайп вправо - лайк
            cardElement.style.transform = `translateX(100vw) rotate(30deg)`;
            cardElement.style.opacity = '0';
            setTimeout(() => {
                connectProfile();
            }, 300);
        } else {
            // Свайп влево - пропуск
            cardElement.style.transform = `translateX(-100vw) rotate(-30deg)`;
            cardElement.style.opacity = '0';
            setTimeout(() => {
                nextProfile();
            }, 300);
        }
    } else {
        // Возвращаем карточку на место
        cardElement.style.transform = 'translateX(0) rotate(0deg)';
        cardElement.style.opacity = '1';
        cardElement.classList.remove('swiping-left', 'swiping-right');
    }
    
    // Сброс значений
    swipeCurrentX = 0;
    swipeCurrentY = 0;
}

// Делаем функции глобальными
window.openMatchingInterface = openMatchingInterface;
window.nextProfile = nextProfile;
window.connectProfile = connectProfile;
window.closeMatchingModal = closeMatchingModal;
window.openPairRoulette = openMatchingInterface; // Для совместимости с HTML

// Показ истории чатов пользователя
function showMyPairs() {
    // Создаем модальное окно с историей чатов
    const pairsModal = document.createElement('div');
    pairsModal.className = 'modal';
    pairsModal.id = 'pairsModal';
    
    // Примерные данные чатов (в реальном приложении это будет из API)
    const pairs = [
        { name: 'Анна', age: 20, course: 2, specialty: 'Дизайн', image: 'images/anna.jpg', match: 95 },
        { name: 'Елена', age: 19, course: 1, specialty: 'Маркетинг', image: 'images/elena.jpg', match: 88 },
        { name: 'Максим', age: 21, course: 3, specialty: 'Медицина', image: 'images/maxim.jpg', match: 92 }
    ];
    
    let pairsHTML = pairs.map(pair => `
        <div class="pair-card">
            <div class="pair-image">
                <img src="${pair.image}" alt="${pair.name}" onerror="this.src='https://i.pravatar.cc/300?img=1'">
                <div class="match-badge">Онлайн</div>
            </div>
            <div class="pair-info">
                <h3>${pair.name}, ${pair.age}</h3>
                <p class="pair-profession">${pair.course} курс</p>
                <p class="pair-city">${pair.specialty}</p>
                <div class="pair-actions">
                    <button class="btn-primary btn-small" onclick="startChat('${pair.name}')">
                        <i class="fas fa-comment"></i> Написать
                    </button>
                    <button class="btn-secondary btn-small" onclick="viewProfile('${pair.name}')">
                        <i class="fas fa-user"></i> Профиль
                    </button>
                </div>
            </div>
        </div>
    `).join('');
    
    pairsModal.innerHTML = `
        <div class="modal-content pairs-modal-content">
            <span class="modal-close pairs-close">&times;</span>
            <div class="modal-header">
                <i class="fas fa-comments" style="font-size: 2.5rem; color: #ff6b6b;"></i>
                <h2>История чатов</h2>
                <p style="color: #7f8c8d; margin-top: 0.5rem;">Недавние собеседники: ${pairs.length}</p>
            </div>
            <div class="pairs-list">
                ${pairsHTML}
            </div>
            <div class="pairs-footer">
                <button class="btn-secondary btn-full" onclick="closePairsModal()">Закрыть</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(pairsModal);
    pairsModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    // Закрытие модального окна
    const closeBtn = pairsModal.querySelector('.pairs-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', closePairsModal);
    }
    
    pairsModal.addEventListener('click', function(e) {
        if (e.target === pairsModal) {
            closePairsModal();
        }
    });
}

function closePairsModal() {
    const pairsModal = document.getElementById('pairsModal');
    if (pairsModal) {
        pairsModal.remove();
        document.body.style.overflow = 'auto';
    }
}

function startChat(name) {
    // Находим профиль по имени (в реальном приложении будет ID)
    const profile = matchingProfiles.find(p => p.name === name) || { 
        name: name, 
        age: '20', 
        course: '?', 
        specialty: 'Студент', 
        image: 'https://i.pravatar.cc/300' 
    };

    showNotification(`Открываем чат с ${name}...`, 'info');
    closePairsModal();
    setTimeout(() => {
        openChatWindow(profile);
    }, 500);
}

function viewProfile(name) {
    showNotification(`Открываем профиль ${name}...`, 'info');
    closePairsModal();
}

// Делаем функции глобальными
window.closePairsModal = closePairsModal;
window.startChat = startChat;
window.viewProfile = viewProfile;

// Функции для модального окна входа
function openLoginModal() {
    const modal = document.getElementById('loginModal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function closeLoginModal() {
    const modal = document.getElementById('loginModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// Обработка успешного входа
function handleSuccessfulLogin(email) {
    // Сохраняем состояние входа в localStorage
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('userEmail', email);
    
    // Показываем уведомление
    showNotification('Вход выполнен успешно!', 'success');
    
    // Закрываем модальное окно
    closeLoginModal();
    
    // Обновляем интерфейс
    updateUIAfterLogin();
}

// Обновление интерфейса после входа
function updateUIAfterLogin() {
    const navLoginBtn = document.querySelector('.nav-btn');
    
    if (navLoginBtn) {
        navLoginBtn.innerHTML = '<i class="fas fa-user"></i> Профиль';
        navLoginBtn.classList.remove('btn-primary');
        navLoginBtn.classList.add('btn-secondary');
        
        // Удаляем старый обработчик и добавляем новый
        const newBtn = navLoginBtn.cloneNode(true);
        navLoginBtn.parentNode.replaceChild(newBtn, navLoginBtn);
        
        // Добавляем обработчик для кнопки профиля
        newBtn.addEventListener('click', function(e) {
            e.preventDefault();
            showUserProfile();
        });
    }
    
    // Обновляем кнопки в hero секции
    const createProfileBtn = document.getElementById('createProfileBtn');
    const findPairBtn = document.getElementById('findPairBtn');
    
    if (createProfileBtn) {
        createProfileBtn.innerHTML = '<i class="fas fa-user-edit"></i> Редактировать профиль';
         
        // Обновляем обработчик для кнопки "Редактировать профиль"
        const newCreateBtn = createProfileBtn.cloneNode(true);
        createProfileBtn.parentNode.replaceChild(newCreateBtn, createProfileBtn);
        newCreateBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            showUserProfile();
        });
    }
    
    if (findPairBtn) {
        findPairBtn.innerHTML = '<i class="fas fa-search-location"></i> Найти собеседника';
        
        // Обновляем обработчик для кнопки "Найти собеседника"
        const newFindBtn = findPairBtn.cloneNode(true);
        findPairBtn.parentNode.replaceChild(newFindBtn, findPairBtn);
        newFindBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            openMatchingInterface();
        });
    }
}

// Показ профиля пользователя
function showUserProfile() {
    const userEmail = localStorage.getItem('userEmail') || 'пользователь';
    const userName = localStorage.getItem('userName') || userEmail.split('@')[0];
    const userAge = localStorage.getItem('userAge') || '';
    const userAbout = localStorage.getItem('userAbout') || '';
    const userCourse = localStorage.getItem('userCourse') || '';
    const userGroup = localStorage.getItem('userGroup') || '';
    const userSpecialty = localStorage.getItem('userSpecialty') || '';
    
    const profileModal = document.createElement('div');
    profileModal.className = 'modal';
    profileModal.id = 'profileModal';
    
    profileModal.innerHTML = `
        <div class="modal-content profile-modal-content">
            <span class="modal-close profile-close">&times;</span>
            <div class="modal-header">
                <div class="profile-avatar-large">
                    <i class="fas fa-user-circle"></i>
                </div>
                <h2>${userName}</h2>
                <p>${userEmail}</p>
            </div>
            <div class="profile-details">
                ${userAge ? `<div class="profile-item"><strong>Возраст:</strong> ${userAge}</div>` : ''}
                ${userCourse ? `<div class="profile-item"><strong>Курс:</strong> ${userCourse}</div>` : ''}
                ${userSpecialty ? `<div class="profile-item"><strong>Специальность:</strong> ${userSpecialty}</div>` : ''}
                ${userGroup ? `<div class="profile-item"><strong>Группа:</strong> ${userGroup}</div>` : ''}
                ${userAbout ? `<div class="profile-item"><strong>О себе:</strong> ${userAbout}</div>` : ''}
            </div>
            <div class="profile-actions">
                <button class="btn-primary" onclick="openEditProfileModal(); closeProfileModal();">Редактировать</button>
                <button class="btn-secondary" onclick="handleLogout()">Выйти</button>
            </div>
        </div>
    `;

    document.body.appendChild(profileModal);
    profileModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    // Закрытие модального окна
    const closeBtn = profileModal.querySelector('.profile-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeProfileModal);
    }
    
    profileModal.addEventListener('click', function(e) {
        if (e.target === profileModal) {
            closeProfileModal();
        }
    });
}

function closeProfileModal() {
    const profileModal = document.getElementById('profileModal');
    if (profileModal) {
        profileModal.remove();
        document.body.style.overflow = 'auto';
    }
}

// Открытие модального окна редактирования профиля
function openEditProfileModal() {
    const editModal = document.createElement('div');
    editModal.className = 'modal';
    editModal.id = 'editProfileModal';
    
    // Получаем текущие данные
    const userName = localStorage.getItem('userName') || '';
    const userAge = localStorage.getItem('userAge') || '';
    const userAbout = localStorage.getItem('userAbout') || '';
    const userCourse = localStorage.getItem('userCourse') || '';
    const userGroup = localStorage.getItem('userGroup') || '';
    const userSpecialty = localStorage.getItem('userSpecialty') || '';
    
    editModal.innerHTML = `
        <div class="modal-content edit-profile-content">
            <span class="modal-close edit-profile-close">&times;</span>
            <div class="modal-header">
                <h2>Редактирование профиля</h2>
            </div>
            <form id="editProfileForm">
                <div class="form-group">
                    <label for="editName">Имя</label>
                    <input type="text" id="editName" value="${userName}" placeholder="Ваше имя" required>
                </div>
                <div class="form-group">
                    <label for="editAge">Возраст</label>
                    <input type="number" id="editAge" value="${userAge}" placeholder="Ваш возраст">
                </div>
                <div class="form-group">
                    <label for="editCourse">Курс</label>
                    <input type="number" id="editCourse" value="${userCourse}" placeholder="Номер курса (1-6)">
                </div>
                <div class="form-group">
                    <label for="editSpecialty">Специальность / Факультет</label>
                    <input type="text" id="editSpecialty" value="${userSpecialty}" placeholder="Например: Экономика">
                </div>
                <div class="form-group">
                    <label for="editGroup">Группа</label>
                    <input type="text" id="editGroup" value="${userGroup}" placeholder="Например: ЭК-201">
                </div>
                <div class="form-group">
                    <label for="editAbout">О себе</label>
                    <textarea id="editAbout" rows="3" placeholder="Расскажите немного о себе...">${userAbout}</textarea>
                </div>
                <button type="submit" class="btn-primary btn-full">Сохранить</button>
            </form>
        </div>
    `;
    
    document.body.appendChild(editModal);
    editModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    // Обработчик отправки формы
    const form = editModal.querySelector('#editProfileForm');
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const name = document.getElementById('editName').value;
        const age = document.getElementById('editAge').value;
        const about = document.getElementById('editAbout').value;
        const course = document.getElementById('editCourse').value;
        const specialty = document.getElementById('editSpecialty').value;
        const group = document.getElementById('editGroup').value;
        
        localStorage.setItem('userName', name);
        localStorage.setItem('userAge', age);
        localStorage.setItem('userAbout', about);
        localStorage.setItem('userCourse', course);
        localStorage.setItem('userSpecialty', specialty);
        localStorage.setItem('userGroup', group);
        
        showNotification('Профиль успешно обновлен!', 'success');
        closeEditProfileModal();
        
        // Если открыто окно профиля, обновляем его (закрываем и открываем заново)
        if (document.getElementById('profileModal')) {
            closeProfileModal();
            showUserProfile();
        }
    });
    
    // Закрытие модального окна
    const closeBtn = editModal.querySelector('.edit-profile-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeEditProfileModal);
    }
    
    editModal.addEventListener('click', function(e) {
        if (e.target === editModal) {
            closeEditProfileModal();
        }
    });
}

function closeEditProfileModal() {
    const editModal = document.getElementById('editProfileModal');
    if (editModal) {
        editModal.remove();
        document.body.style.overflow = 'auto';
    }
}

// Делаем функции глобальными
window.showUserProfile = showUserProfile;
window.closeProfileModal = closeProfileModal;
window.handleLogout = handleLogout;
window.openEditProfileModal = openEditProfileModal;
window.closeEditProfileModal = closeEditProfileModal;

function handleLogout() {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userEmail');
    
    // Сброс кнопки профиля в навигации
    const navLoginBtn = document.querySelector('.nav-btn');
    if (navLoginBtn) {
        navLoginBtn.innerHTML = 'Войти';
        navLoginBtn.classList.remove('btn-secondary');
        navLoginBtn.classList.add('btn-primary');
        
        const newBtn = navLoginBtn.cloneNode(true);
        navLoginBtn.parentNode.replaceChild(newBtn, navLoginBtn);
        
        newBtn.addEventListener('click', function(e) {
            e.preventDefault();
            openLoginModal();
        });
    }
    
    // Сброс кнопок в hero
    const createProfileBtn = document.getElementById('createProfileBtn');
    const findPairBtn = document.getElementById('findPairBtn');
    
    if (createProfileBtn) {
        createProfileBtn.innerHTML = 'Создать профиль';
        const newCreateBtn = createProfileBtn.cloneNode(true);
        createProfileBtn.parentNode.replaceChild(newCreateBtn, createProfileBtn);
        newCreateBtn.addEventListener('click', function(e) {
            e.preventDefault();
            openLoginModal();
        });
    }
    
    if (findPairBtn) {
        findPairBtn.innerHTML = 'Найти друзей';
        const newFindBtn = findPairBtn.cloneNode(true);
        findPairBtn.parentNode.replaceChild(newFindBtn, findPairBtn);
        newFindBtn.addEventListener('click', function(e) {
            e.preventDefault();
            openFindPairModal(); // Откроет уведомление о необходимости входа
        });
    }
    
    closeProfileModal();
    showNotification('Вы вышли из системы', 'info');
}

/* Функционал чата */
function openChatWindow(profile) {
    // Удаляем старый чат если есть
    const oldChat = document.getElementById('chatWindow');
    if (oldChat) oldChat.remove();

    const chatWindow = document.createElement('div');
    chatWindow.className = 'chat-window';
    chatWindow.id = 'chatWindow';

    chatWindow.innerHTML = `
        <div class="chat-header">
            <div class="chat-user-info">
                <img src="${profile.image}" alt="${profile.name}" class="chat-avatar" onerror="this.src='https://i.pravatar.cc/300?img=1'">
                <div class="chat-user-details">
                    <h4>${profile.name}</h4>
                    <p>Онлайн</p>
                </div>
            </div>
            <div class="chat-controls">
                <button onclick="minimizeChat()"><i class="fas fa-minus"></i></button>
                <button onclick="closeChatWindow()"><i class="fas fa-times"></i></button>
            </div>
        </div>
        <div class="chat-messages" id="chatMessages">
            <div class="message received">
                Привет! Я тоже учусь на ${profile.specialty}. Давай знакомиться?
                <div class="message-time">${new Date().toLocaleTimeString().slice(0, 5)}</div>
            </div>
        </div>
        <div class="chat-input-area">
            <input type="text" id="chatInput" placeholder="Напишите сообщение..." onkeypress="handleEnter(event)">
            <button class="btn-send" onclick="sendMessage()">
                <i class="fas fa-paper-plane"></i>
            </button>
        </div>
    `;

    document.body.appendChild(chatWindow);
}

function closeChatWindow() {
    const chat = document.getElementById('chatWindow');
    if (chat) chat.remove();
}

function minimizeChat() {
    const chat = document.getElementById('chatWindow');
    if (chat) {
        chat.style.display = 'none';
        showNotification('Чат свернут. (В демо-версии его нельзя развернуть обратно)', 'info');
    }
}

function sendMessage() {
    const input = document.getElementById('chatInput');
    const messages = document.getElementById('chatMessages');
    
    if (input && input.value.trim() !== '') {
        const text = input.value;
        
        // Добавляем сообщение пользователя
        const userMsg = document.createElement('div');
        userMsg.className = 'message sent';
        userMsg.innerHTML = `
            ${text}
            <div class="message-time">${new Date().toLocaleTimeString().slice(0, 5)}</div>
        `;
        messages.appendChild(userMsg);
        input.value = '';
        messages.scrollTop = messages.scrollHeight;

        // Имитация ответа
        setTimeout(() => {
            const replyMsg = document.createElement('div');
            replyMsg.className = 'message received';
            replyMsg.innerHTML = `
                Интересно! Расскажи подробнее)
                <div class="message-time">${new Date().toLocaleTimeString().slice(0, 5)}</div>
            `;
            messages.appendChild(replyMsg);
            messages.scrollTop = messages.scrollHeight;
        }, 2000 + Math.random() * 2000);
    }
}

function handleEnter(e) {
    if (e.key === 'Enter') {
        sendMessage();
    }
}

// Делаем функции чата глобальными
window.openChatWindow = openChatWindow;
window.closeChatWindow = closeChatWindow;
window.minimizeChat = minimizeChat;
window.sendMessage = sendMessage;
window.handleEnter = handleEnter;
