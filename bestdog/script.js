/**
 * BEST DOG GALLERY - SCRIPT.JS (v3.2.0 Firebase Production)
 */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js';
import {
    getFirestore, doc, setDoc, getDoc, updateDoc, getDocs,
    increment, collection, query, orderBy, limit,
    onSnapshot, serverTimestamp, arrayUnion
} from 'https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js';

console.log("БОТ НА СВЯЗИ ВЕРСИЯ 5.0.51");

// ❗ Впиши свои Firebase-ключи семда!
const firebaseConfig = {
    apiKey: "AIzaSyARiuqjPVzWwCQFquahFj3SGwwA92XfC",
    authDomain: "bestdog-fb34c.firebaseapp.com",
    projectId: "bestdog-fb34c",
    storageBucket: "bestdog-fb34c.firebasestorage.app",
    messagingSenderId: "971181096994",
    appId: "1:971181096994:web:2c5a8d14b5f3b125c0a7b",
    measurementId: "G-46127K6WL"
};

let db;
let dbEnabled = false;
try {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    dbEnabled = true;
    console.log('[Firebase] Подключено к Firestore ✅');
} catch (e) {
    console.warn('[Firebase] Оффлайн-режим. Проверь конфигурацию Firebase.', e.message);
    dbEnabled = false;
}

// --- STATE ---
const CRITERIA = [
    { id: 'cringe', title: 'Кринжовость 🤡' },
    { id: 'size', title: 'Размерность 🐘' },
    { id: 'cute', title: 'Милость 🥰' },
    { id: 'aggro', title: 'Агрессивность 🌋' },
    { id: 'beauty', title: 'Красивность ✨' }
];

const SHOP_ITEMS = [
    { id: 'paw_cursor', icon: '🐾', title: 'Собачья лапка', desc: 'Меняет курсор на сайте', price: 30 },
    { id: 'golden_badge', icon: '🥇', title: 'Золотой бейдж', desc: 'Сияющий статус рейтинга', price: 50 },
    { id: 'super_like', icon: '🔥', title: 'Супер-лайк', desc: '+5 голосов собаке', price: 15, consumable: true }
];

const CREATOR_PHOTOS = [
    'my_faces/face1.png', 'my_faces/face2.jpg', 'my_faces/face3.jpg',
    'my_faces/face4.jpg', 'my_faces/face5.jpg', 'my_faces/face6.png',
    'my_faces/face7.jpg', 'my_faces/face8.jpg', 'my_faces/face9.jpg',
    'my_faces/face10.jpg', 'my_faces/face11.jpg', 'my_faces/face12.jpg',
    'my_faces/images (1).jpg', 'my_faces/images (2).jpg', 'my_faces/images (3).jpg',
    'my_faces/images (4).jpg', 'my_faces/images (5).jpg', 'my_faces/images (6).jpg',
    'my_faces/images (7).jpg', 'my_faces/images.jpg',
    'my_faces/Без названия (1).jpg', 'my_faces/Без названия (2).jpg', 'my_faces/Без названия (3).jpg',
    'my_faces/Без названия (4).jpg', 'my_faces/Без названия (40).jpg', 'my_faces/Без названия (5).jpg',
    'my_faces/Без названия.jpg'
];

const CREATOR_SIGNATURES = {
    'my_faces/face1.png': 'Гений, миллиардер, филантроп',
    'my_faces/face2.jpg': 'МС СВО',
    'my_faces/face3.jpg': 'МС ОГУРЕЦ',
    'my_faces/face4.jpg': 'Банник',
    'my_faces/face5.jpg': 'Маламчик',
    'my_faces/face6.png': '67',
    'my_faces/face7.jpg': 'Ященко',
    'my_faces/face8.jpg': 'Гром',
    'my_faces/face9.jpg': 'Моня',
    'my_faces/face10.jpg': 'Чарлик',
    'my_faces/face11.jpg': 'Gazan',
    'my_faces/face12.jpg': 'Максим Пианист',
    'my_faces/images (1).jpg': 'САЛАМ',
    'my_faces/images (2).jpg': 'Бурмалдатик',
    'my_faces/images (3).jpg': 'Салатик',
    'my_faces/images (4).jpg': 'Хаммам',
    'my_faces/images (5).jpg': 'Майонез',
    'my_faces/images (6).jpg': 'Фли',
    'my_faces/images (7).jpg': 'Черемша',
    'my_faces/images.jpg': 'Чуркаслав'
};
const CREATOR_BREEDS = ["лысина"];
const GAME_BREEDS = [
    "Affenpinscher", "African", "Airedale", "Akita", "Appenzeller", "Basenji", "Beagle", "Bluetick",
    "Borzoi", "Bouvier", "Boxer", "Brabancon", "Briard", "Bulldog", "Bullterrier", "Cairn", "Chihuahua",
    "Chow", "Corgi", "Dachshund", "Dalmatian", "Doberman", "Eskimo", "Greyhound", "Huskie", "Labrador",
    "Malamute", "Mastiff", "Newfoundland", "Otterhound", "Papillon", "Pekinese", "Pembroke", "Pinscher",
    "Pointer", "Pomeranian", "Poodle", "Pug", "Pyrenees", "Retriever", "Ridgeback", "Rottweiler",
    "Saluki", "Samoyed", "Schipperke", "Schnauzer", "Setter", "Sharpei", "Shiba", "Shihtzu", "Spaniel",
    "Stbernard", "Terrier", "Vizsla", "Weimaraner", "Whippet", "Wolfhound"
];
let totalDogsLoadedCount = 0;
let currentGameScore = 0;
let currentGameStreak = 0;

function getActiveModal() {
    const lbView = document.getElementById('game-leaderboard-view');
    if (lbView && !lbView.classList.contains('hidden')) return lbView;
    return document.querySelector('.modal.active, #lightbox.active');
}

function hideMobileNav() {
    document.getElementById('mobile-nav')?.classList.add('nav-hidden');
}

function showMobileNav() {
    document.getElementById('mobile-nav')?.classList.remove('nav-hidden');
}

function pushModalState() {
    // Предотвращаем горизонтальное смещение контента при скрытии скроллбара
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    document.body.classList.add('no-scroll');
    // ГАРАНТИРОВАННО скрываем панель
    const mobileNav = document.getElementById('mobile-nav');
    if (mobileNav) mobileNav.classList.add('nav-hidden');

    // И ТОЛЬКО НА МОБИЛКАХ пушим историю
    if (window.innerWidth <= 768) {
        history.pushState({ modalOpen: true }, '');
    }
}

const ACHIEVEMENTS = [
    {
        id: 'liker_1',
        icon: '💙',
        title: 'Добряк',
        desc: 'Поставь 10 лайков',
        threshold: 10,
        getProgress: () => userProgress.likesGiven,
        condition: () => userProgress.likesGiven >= 10
    },
    {
        id: 'rater_1',
        icon: '📝',
        title: 'Кинолог',
        desc: 'Оцени 10 собак по всем критериям',
        threshold: 10,
        getProgress: () => userProgress.dogsRated,
        condition: () => userProgress.dogsRated >= 10
    },
    {
        id: 'scanner_1',
        icon: '🤖',
        title: 'Собачий сканер',
        desc: 'Определи породу 5 раз',
        threshold: 5,
        getProgress: () => userProgress.breedsIdentified,
        condition: () => userProgress.breedsIdentified >= 5
    },
    {
        id: 'minigame_streak',
        icon: '🎯',
        title: 'Кинолог-эксперт',
        desc: 'Угадай породу 5 раз подряд в мини-игре',
        threshold: 5,
        getProgress: () => userProgress.miniGameStreak || 0,
        condition: () => (userProgress.miniGameStreak || 0) >= 5
    },
    {
        id: 'secret_boss',
        icon: '👑',
        title: 'Кто здесь Босс?',
        desc: 'Секретная ачивка 🔒',
        threshold: 1,
        getProgress: () => userProgress.unlocked.includes('secret_boss') ? 1 : 0,
        condition: () => userProgress.unlocked.includes('secret_boss')
    },
    {
        id: 'ms_ogurets',
        icon: '🤾',
        title: 'МС ОГУРЕЦ',
        desc: 'Найди и кликни фото разработчика',
        threshold: 1,
        getProgress: () => userProgress.unlocked.includes('ms_ogurets') ? 1 : 0,
        condition: () => userProgress.unlocked.includes('ms_ogurets')
    },
    {
        id: 'new_balance_achievement',
        icon: '👟',
        title: 'МС Нью Беленс',
        desc: 'Кликнул на баланс косточек и познал истинный стиль',
        threshold: 1,
        getProgress: () => userProgress.unlocked.includes('new_balance_achievement') ? 1 : 0,
        condition: () => userProgress.unlocked.includes('new_balance_achievement')
    },
    {
        id: 'creator_face_achievement',
        icon: '😎',
        title: 'Познал Лицо Создателя',
        desc: 'Открыл фото ВЕРШИТЕЛЯ в полный экран',
        threshold: 1,
        getProgress: () => userProgress.unlocked.includes('creator_face_achievement') ? 1 : 0,
        condition: () => userProgress.unlocked.includes('creator_face_achievement')
    },
    {
        id: 'full_collection_achievement',
        icon: '👑',
        title: 'Король Создателей',
        desc: 'Собери все 27 лиц Создателя в свою коллекцию!',
        threshold: 27,
        getProgress: () => userProgress.collection?.length || 0,
        condition: () => (userProgress.collection?.length || 0) >= 27
    }
];


let userProgress = JSON.parse(localStorage.getItem('dog_user_progress')) || {
    bones: 0,
    dogsRated: 0,
    breedsIdentified: 0,
    likesGiven: 0,
    miniGameStreak: 0,
    superLikes: 0,
    unlocked: [],
    purchased: [],
    collection: [],
    scanned: []
};

// Guarantee collection and scanned arrays initialization
userProgress.collection = userProgress.collection || [];
userProgress.scanned = userProgress.scanned || [];

// Санитизация существующей коллекции: очищаем старые случайные совпадения для всех фиксированных подписей у других лиц
let collectionMutated = false;
userProgress.collection.forEach(item => {
    for (const [fixedUrl, fixedBreed] of Object.entries(CREATOR_SIGNATURES)) {
        if (item.url !== fixedUrl && (item.breed === fixedBreed || item.breed.toLowerCase() === fixedBreed.toLowerCase())) {
            const rb = CREATOR_BREEDS[Math.floor(Math.random() * CREATOR_BREEDS.length)];
            item.breed = rb.charAt(0).toUpperCase() + rb.slice(1);
            collectionMutated = true;
        }
    }
});
if (collectionMutated) {
    localStorage.setItem('dog_user_progress', JSON.stringify(userProgress));
}

// Обнуление косточек для всех существующих пользователей (v3.9.1)
if (!userProgress.bonesReset_v391) {
    userProgress.bones = 0;
    userProgress.bonesReset_v391 = true;
    localStorage.setItem('dog_user_progress', JSON.stringify(userProgress));
}

// Ensure superLikes exists in existing progress
if (userProgress.superLikes === undefined) userProgress.superLikes = 0;

let likedDogs = JSON.parse(localStorage.getItem('my_liked_dogs')) || [];

// Reset likes once as requested
if (!localStorage.getItem('likes_reset_v3_1')) {
    likedDogs = [];
    localStorage.removeItem('my_liked_dogs');
    localStorage.setItem('likes_reset_v3_1', 'true');
}

// One-time welcome bonus +500 bones
if (!localStorage.getItem('bonus_500_v3_1')) {
    userProgress.bones += 500;
    localStorage.setItem('bonus_500_v3_1', 'true');
    localStorage.setItem('dog_user_progress', JSON.stringify(userProgress));
}

let votedDogs = JSON.parse(localStorage.getItem('my_voted_dogs')) || [];
let currentDogForVote = null;

// --- FIRESTORE SYNC (Real-time) ---

// Генерируем безопасный ID документа из URL (вместо спецсимволов)
const urlToDocId = (url) => btoa(url).replace(/[/=+]/g, '_');

// Извлечение породы из URL Dog CEO
const extractBreedFromUrl = (url) => {
    if (url.includes('dog.ceo')) {
        const parts = url.split('/');
        const breedPart = parts[4];
        if (breedPart) {
            return breedPart.split('-').reverse().join(' ').replace(/\b\w/g, c => c.toUpperCase());
        }
    }
    if (CREATOR_PHOTOS.includes(url)) {
        const titles = ["МС ОГУРЕЦ", "БАННИК", "МС СВО", "ВЕРШИТЕЛЬ"];
        return titles[Math.floor(Math.random() * titles.length)];
    }
    return "Метис 🐾";
};

// --- ЛАЙК ---
window.syncLike = async (url, isLike) => {
    if (!dbEnabled) return;
    const docId = urlToDocId(url);
    const dogRef = doc(db, 'dogs', docId);
    try {
        await setDoc(dogRef, {
            url,
            breed: extractBreedFromUrl(url),
            likes: increment(isLike ? 1 : -1),
            createdAt: serverTimestamp()
        }, { merge: true });
        console.log(`[Firebase] Лайк ${isLike ? '+1' : '-1'} отправлен для:`, url);
    } catch (err) {
        console.error('[Firebase] Ошибка лайка:', err);
    }
};

// --- ВЕРДИКТ (Счёт) ---
window.syncVote = async (url, scoreData, isNewVote) => {
    if (!dbEnabled) return;
    const docId = urlToDocId(url);
    const dogRef = doc(db, 'dogs', docId);
    try {
        const snap = await getDoc(dogRef);
        const existing = snap.exists() ? snap.data() : { ratings: [] };

        const updatedRatings = [...(existing.ratings || []), scoreData];
        const avgAll = (updatedRatings.reduce((s, r) => s + parseFloat(r.avg), 0) / updatedRatings.length).toFixed(1);

        const avgCriteria = {};
        ['cringe', 'size', 'cute', 'aggro', 'beauty'].forEach(key => {
            const vals = updatedRatings.filter(r => r[key] != null).map(r => r[key]);
            avgCriteria[`avg_${key}`] = vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : 0;
        });

        await setDoc(dogRef, {
            url,
            breed: existing.breed || extractBreedFromUrl(url),
            likes: increment(isNewVote ? 1 : 0), // +1 за сам вердикт, если это новый голос
            ratings: arrayUnion(scoreData),
            avg: parseFloat(avgAll),
            ...avgCriteria,
            updatedAt: serverTimestamp()
        }, { merge: true });

        console.log('[Firebase] Вердикт сохранён (+1 лайк бонус) ✅', { url, avg: avgAll });
    } catch (err) {
        console.error('[Firebase] Ошибка сохранения вердикта:', err);
    }
};

// --- REAL-TIME РЕЙТИНГ (Общий Топ) ---
let _unsubscribeGlobal = null; // Ссылка для отписки от предыдущего слушателя

window.subscribeGlobalRating = () => {
    if (!dbEnabled) return;
    if (_unsubscribeGlobal) _unsubscribeGlobal(); // Отписываемся если уже подписаны

    const criteriaSelect = document.getElementById('rating-sort-criteria')?.value || 'avg';
    const orderSelect = document.getElementById('rating-sort-order')?.value || 'desc';

    // Определяем поле в Firestore по которому сортируем
    const fieldMap = {
        avg: 'avg', likes: 'likes', cringe: 'avg_cringe',
        size: 'avg_size', cute: 'avg_cute', aggressive: 'avg_aggro', beauty: 'avg_beauty'
    };
    const sortField = fieldMap[criteriaSelect] || 'avg';

    // Запрашиваем всю коллекцию собак из Firestore для полноценной сортировки на клиенте
    const q = query(collection(db, 'dogs'));

    _unsubscribeGlobal = onSnapshot(q, (snapshot) => {
        const container = document.getElementById('rating-list-container');
        const activeTab = document.querySelector('.tab-btn[data-rating-tab].active')?.getAttribute('data-rating-tab');
        if (!container || activeTab !== 'global') return;

        // Преобразуем документы в массив объектов с обязательными score и rating (сконвертированными в числа)
        let dogsData = snapshot.docs.map(doc => {
            const data = doc.data();
            const val = Number(data[sortField]) || 0;
            return {
                id: doc.id,
                url: data.url,
                likes: Number(data.likes) || 0,
                ratings: data.ratings || [],
                breed: (data.url || '').split('/')[4],
                score: val,
                rating: val
            };
        });

        // Сортируем массив как a.score - b.score (или a.rating - b.rating)
        dogsData.sort((a, b) => {
            if (orderSelect === 'desc') {
                return Number(b.score) - Number(a.score);
            }
            return Number(a.score) - Number(b.score);
        });

        // Берем топ 10 после сортировки
        const topList = dogsData.slice(0, 10);

        if (topList.length === 0) {
            let emptyMsg = "Пока никто не набрал лайков 🐾 — будь первым!";
            if (criteriaSelect === 'avg') {
                emptyMsg = "Пока нет оценок 🐾 — будь первым!";
            } else if (criteriaSelect !== 'likes') {
                emptyMsg = "Пока нет оценок по этому критерию 🐾 — будь первым!";
            }
            container.innerHTML = `<p style="text-align:center;padding:20px;color:var(--text-muted)">${emptyMsg}</p>`;
            return;
        }

        container.innerHTML = topList.map((d, i) => {
            const breedName = d.breed ? d.breed.split('-').reverse().join(' ').replace(/\b\w/g, c => c.toUpperCase()) : 'Неизвестно';
            const scoreLabel = criteriaSelect === 'likes' ? `❤️ ${d.likes}` : `⭐ ${d.score}`;
            return `
                <div class="rating-item">
                    <span class="breed-rank-num">#${i + 1}</span>
                    <img src="${d.url}" class="rating-img" onclick="window.openLightbox('${d.url}')" style="cursor:zoom-in">
                    <div class="rating-info">
                        <div class="breed-rank-name">${breedName}</div>
                        <div class="rating-likes">${scoreLabel}</div>
                        <div style="font-size:0.75rem;opacity:0.6">Рейтингов: ${d.ratings.length}</div>
                    </div>
                </div>
            `;
        }).join('');

        console.log('[Firebase] Real-time рейтинг обновлён, записей:', dogsData.length);
    }, (err) => {
        console.error('[Firebase] onSnapshot ошибка:', err.message);
    });
};

// Старый мок-метод оставляем для обратной совместимости (если dbEnabled = false)
window.syncToFirebase = (actionType, url, data) => {
    if (dbEnabled) return;
    console.log(`[Firebase OFFLINE] ${actionType}`, { url, ...data });
};

const getMockCriteria = (url) => {
    const hash = url.split('').reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a }, 0);
    return {
        cringe: Math.abs(hash % 10) + 1,
        size: Math.abs((hash >> 1) % 10) + 1,
        cute: Math.abs((hash >> 2) % 10) + 1,
        aggressive: Math.abs((hash >> 3) % 10) + 1,
        beauty: Math.abs((hash >> 4) % 10) + 1,
    };
};

// --- UTILS ---
window.unlockAchievement = (id) => {
    if (!userProgress.unlocked.includes(id)) {
        userProgress.unlocked.push(id);
        userProgress.bones += 50;
        const ach = ACHIEVEMENTS.find(a => a.id === id);
        if (ach) showAchievementToast(ach);

        // Спец-действия для наград
        if (id === 'ms_ogurets') {
            window.spawnPickleRick();
            showToast("🥒 Секретная кнопка разблокирована!");
        } else if (id === 'creator_face_achievement') {
            document.body.classList.remove('dark-theme', 'light-theme');
            document.body.classList.add('vershitel-theme');
            userProgress.creatorModeActive = true;
            localStorage.setItem('creator_mode_enabled', 'true');
            showToast("😈 Режим Вершителя активирован!");
            if (window.fixVisualBugsDynamically) window.fixVisualBugsDynamically();
        }

        save();
        updateUI();
        window.checkUnlockedMemes();
    }
};


window.checkAchievements = () => {
    ACHIEVEMENTS.forEach(ach => {
        if (!userProgress.unlocked.includes(ach.id) && ach.condition()) {
            window.unlockAchievement(ach.id);
        }
    });
};

function showAchievementToast(ach) {
    // Ищем или создаём специальный элемент для ach-toast
    let achToast = document.getElementById('ach-toast');
    if (!achToast) {
        achToast = document.createElement('div');
        achToast.id = 'ach-toast';
        document.body.appendChild(achToast);
    }
    achToast.innerHTML = `
        <div class="ach-toast-icon">${ach.icon}</div>
        <div class="ach-toast-text">
            <div class="ach-toast-label">Достижение разблокировано!</div>
            <div class="ach-toast-title">${ach.title}</div>
            <div class="ach-toast-bonus">+50 🦴</div>
        </div>
    `;
    achToast.classList.remove('ach-hidden');
    achToast.classList.add('ach-visible');
    setTimeout(() => {
        achToast.classList.remove('ach-visible');
        achToast.classList.add('ach-hidden');
    }, 4000);
}

// --- MEME HUB LOGIC (v4.2.7) ---
window.checkUnlockedMemes = () => {
    const isRickUnlocked = userProgress.unlocked?.includes('ms_ogurets');
    const isSneakerUnlocked = userProgress.unlocked?.includes('new_balance_achievement');
    const isCreatorUnlocked = userProgress.unlocked?.includes('creator_face_achievement');

    const rickBtn = document.getElementById('trigger-cucumber-btn');
    const sneakerBtn = document.getElementById('trigger-sneaker-btn');
    const creatorBtn = document.getElementById('trigger-creator-theme-btn');

    if (rickBtn) {
        if (isRickUnlocked) {
            rickBtn.classList.remove('hidden');
            rickBtn.style.display = 'inline-block';
        } else {
            rickBtn.classList.add('hidden');
            rickBtn.style.display = '';
        }
    }

    if (sneakerBtn) {
        if (isSneakerUnlocked) {
            sneakerBtn.classList.remove('hidden');
            sneakerBtn.style.display = 'inline-block';
        } else {
            sneakerBtn.classList.add('hidden');
            sneakerBtn.style.display = '';
        }
    }

    if (creatorBtn) {
        if (isCreatorUnlocked) {
            creatorBtn.classList.remove('hidden');
            creatorBtn.style.display = 'inline-block';
        } else {
            creatorBtn.classList.add('hidden');
            creatorBtn.style.display = '';
        }
    }

    const hub = document.querySelector('.meme-hub-container');
    if (hub) {
        const isCursorPurchased = userProgress.purchased?.includes('paw_cursor');
        if (!isRickUnlocked && !isSneakerUnlocked && !isCreatorUnlocked && !isCursorPurchased) {
            hub.style.display = 'none';
        } else {
            hub.style.display = 'inline-block';
        }
    }
};


function save() {
    window.checkAchievements();
    localStorage.setItem('dog_user_progress', JSON.stringify(userProgress));
    localStorage.setItem('my_liked_dogs', JSON.stringify(likedDogs));
    localStorage.setItem('my_voted_dogs', JSON.stringify(votedDogs));
}

function updateUI() {
    ['bones-balance', 'shop-bones-balance'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = userProgress.bones;
    });

    const globalBones = document.getElementById('global-bones');
    if (globalBones) {
        globalBones.classList.add('force-dark-bg');
        const balanceSpan = document.getElementById('bones-balance');
        if (balanceSpan) {
            balanceSpan.classList.add('force-white-text');
            balanceSpan.classList.remove('force-dark-bg');
        }
    }

    // Восстанавливаем выбранную пользователем тему (светлую или темную), если сейчас не включен режим Вершителя
    const userThemePref = localStorage.getItem('user_theme_pref') || 'dark';
    if (!document.body.classList.contains('vershitel-theme')) {
        if (userThemePref === 'light') {
            document.body.classList.remove('dark-theme');
            document.body.classList.add('light-theme');
        } else {
            document.body.classList.remove('light-theme');
            document.body.classList.add('dark-theme');
        }
    }

    // Эффекты магазина: кастомный курсор Создателя
    const cursorToggle = document.getElementById('cursor-toggle-container');
    const cursorCheckbox = document.getElementById('cursor-checkbox');
    if (userProgress.purchased?.includes('paw_cursor')) {
        if (cursorToggle) cursorToggle.classList.remove('hidden');

        const pref = localStorage.getItem('creator_cursor_user_pref') || 'enabled';
        if (pref === 'enabled') {
            if (cursorCheckbox) cursorCheckbox.checked = true;
            document.body.classList.add('creator-cursor-active');
            localStorage.setItem('creator_cursor_enabled', 'true');
        } else {
            if (cursorCheckbox) cursorCheckbox.checked = false;
            document.body.classList.remove('creator-cursor-active');
            localStorage.setItem('creator_cursor_enabled', 'false');
        }
    } else {
        if (cursorToggle) cursorToggle.classList.add('hidden');
        document.body.classList.remove('creator-cursor-active');
        localStorage.setItem('creator_cursor_enabled', 'false');
    }
    if (userProgress.purchased?.includes('golden_badge')) {
        document.body.classList.add('golden-badges-active');
    }

    // Проверяем доступность мемов в хабе
    window.checkUnlockedMemes();
}


function showToast(msg) {
    const t = document.getElementById('app-toast');
    if (!t) return;
    t.innerHTML = msg;
    t.className = 'toast show';
    setTimeout(() => t.classList.remove('show'), 3000);
}

// --- RENDERING ---
function createDogCard(url, i = 0, isCreator = false) {
    const id = btoa(url);
    const card = document.createElement('div');
    card.className = 'dog-card';
    if (isCreator) card.setAttribute('data-creator', 'true');
    card.style.animationDelay = `${i * 0.05}s`;

    const isLiked = likedDogs.includes(url);
    const totalLikes = isLiked ? 1 : 0;

    // Проверяем, была ли уже отсканирована эта собака
    const isScanned = (userProgress.scanned && userProgress.scanned.includes(url)) || 
                      (userProgress.collection && userProgress.collection.some(item => item.url === url));

    // Порода для всех изначально "Новая"
    let breedDisplay = `Новая <span class="badge-sparkle">✨</span>`;
    let badgeClass = `new-badge${isScanned ? ' hidden' : ''}`;

    card.innerHTML = `
        <div class="photo-container">
            <img src="${url}" 
                 loading="lazy" 
                 decoding="async" 
                 alt="dog" 
                 onerror="if(!this.dataset.triedFallback){ this.dataset.triedFallback='true'; this.src='https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=300&auto=format&fit=crop'; this.classList.add('image-failed'); } else { this.closest('.dog-card').style.setProperty('display', 'none', 'important'); }">
            <div class="${badgeClass}" id="avg-${id}">${breedDisplay}</div>
        </div>

        <div class="breed-info-panel" id="breed-${id}"></div>

        <!-- Анимированный зеленый эквалайзер Spotify -->
        <div class="equalizer-container">
            <div class="eq-bar bar-1"></div>
            <div class="eq-bar bar-2"></div>
            <div class="eq-bar bar-3"></div>
            <div class="eq-bar bar-4"></div>
            <div class="eq-bar bar-5"></div>
            <div class="eq-bar bar-6"></div>
            <div class="eq-bar bar-7"></div>
        </div>

        <!-- Панель управления плеером Spotify Media Controls -->
        <div class="spotify-media-controls">
            <button class="player-btn scan-btn" onclick="event.stopPropagation(); window.scanBreed(event)" title="Анализ породы">
                📊
            </button>
            <button class="player-btn play-btn ${isLiked ? 'active' : ''}" onclick="event.stopPropagation(); window.toggleLike(event, '${url}')" title="Лайк">
                ❤️ <span class="count">${totalLikes}</span>
            </button>
            <button class="player-btn rate-btn" onclick="event.stopPropagation(); window.openVote('${url}')" title="Оценить">
                ⭐
            </button>
        </div>
    `;

    card.onclick = () => window.openLightbox(url);
    if (window.VanillaTilt && window.innerWidth > 768) window.VanillaTilt.init(card, { max: 10, speed: 400 });
    return card;
}

// --- LOGIC ---
window.toggleLike = (e, url) => {
    const btn = e.currentTarget;
    const countSpan = btn.querySelector('.count');
    let currentLikes = countSpan ? parseInt(countSpan.textContent) : 0;

    const idx = likedDogs.indexOf(url);
    if (idx > -1) {
        likedDogs.splice(idx, 1);
        btn.classList.remove('active');
        if (countSpan) countSpan.textContent = currentLikes - 1;
        window.syncLike(url, false); // Реальный Firestore: likes - 1
    } else {
        likedDogs.push(url);
        btn.classList.add('active');
        if (countSpan) countSpan.textContent = currentLikes + 1;
        userProgress.bones += 1;
        userProgress.likesGiven++;
        window.syncLike(url, true); // Реальный Firestore: likes + 1
    }

    // Триггер ачивки создателя
    if (btn.closest('.dog-card')?.hasAttribute('data-creator')) {
        window.unlockAchievement('ms_ogurets');
    }

    save();
    updateUI();
};

window.calculateAverageScore = () => {
    const inputs = document.querySelectorAll('#criteria-list input[type="range"]');
    if (inputs.length === 0) return;
    let sum = 0;
    inputs.forEach(input => {
        sum += parseFloat(input.value);
    });
    const avg = sum / inputs.length;
    const scoreEl = document.getElementById('live-average-score');
    if (scoreEl) {
        scoreEl.textContent = avg.toFixed(1);
    }
};

window.openVote = (url) => {
    window.closeAllModals();
    // Триггер ачивки при попытке оценить создателя
    const card = document.querySelector(`.dog-card img[src="${url}"]`)?.closest('.dog-card');
    if (card?.hasAttribute('data-creator')) {
        window.unlockAchievement('ms_ogurets');
    }

    currentDogForVote = url;
    const verdictImg = document.getElementById('vote-img');
    verdictImg.src = url;
    verdictImg.style.cursor = 'pointer';
    verdictImg.onclick = () => window.openLightbox(url);

    // Устанавливаем текущее количество лайков (из кэша или DOM)
    const cardLikes = document.querySelector(`.dog-card img[src="${url}"]`)?.closest('.dog-card')?.querySelector('.count')?.textContent || "0";
    const likesBadge = document.getElementById('vote-likes-count');
    if (likesBadge) likesBadge.textContent = `❤️ ${cardLikes}`;

    document.getElementById('criteria-list').innerHTML = CRITERIA.map(c => `
        <div class="slider-group">
            <label>${c.title}</label>
            <div class="slider-controls">
                <input type="range" min="1" max="10" value="5" oninput="this.nextElementSibling.textContent=this.value; window.calculateAverageScore();">
                <span class="slider-value">5</span>
            </div>
        </div>
    `).join('');

    // Вычисляем дефолтное среднее значение при открытии окна
    window.calculateAverageScore();

    const submitBtn = document.getElementById('submit-vote');
    if (submitBtn) {
        if (votedDogs.includes(url)) {
            submitBtn.textContent = "Изменить вердикт ♻️";
        } else {
            submitBtn.textContent = "Сохранить вердикт (Получить 🦴+1)";
        }
    }

    // Добавляем кнопку Супер-лайка
    const superLikesCount = userProgress.superLikes || 0;
    const isAlreadySuperLiked = votedDogs.includes(`${url}_super`);

    const superBtn = document.createElement('button');
    superBtn.id = 'super-like-btn';
    superBtn.className = 'btn-super-like';

    if (isAlreadySuperLiked) {
        superBtn.innerHTML = `Супер-лайк применён! 🔥`;
        superBtn.disabled = true;
    } else if (superLikesCount > 0) {
        superBtn.innerHTML = `Супер-лайк 🔥❤️ (х${superLikesCount})`;
        superBtn.onclick = () => window.applySuperLike(url);
    } else {
        superBtn.innerHTML = `Супер-лайк 🔥❤️ <span class="super-like-buy-hint">Купить в магазине 🐾</span>`;
        superBtn.disabled = true;
    }

    document.getElementById('criteria-list').appendChild(superBtn);

    document.getElementById('vote-modal').classList.add('active');
    pushModalState();
};

window.applySuperLike = async (url) => {
    if (userProgress.superLikes <= 0) return;
    const btn = document.getElementById('super-like-btn');
    if (!btn || btn.disabled) return;

    // Локальное обновление
    userProgress.superLikes--;
    votedDogs.push(`${url}_super`); // Защита от повтора

    // Визуальный эффект
    const rect = btn.getBoundingClientRect();
    window.triggerSuperLikeFx(rect.left + rect.width / 2, rect.top + rect.height / 2);

    // Обновление UI кнопки и счетчика
    btn.disabled = true;
    btn.innerHTML = `Супер-лайк применён! 🔥`;

    const likesBadge = document.getElementById('vote-likes-count');
    if (likesBadge) {
        const currentLikes = parseInt(likesBadge.textContent.replace('❤️ ', '')) || 0;
        likesBadge.textContent = `❤️ ${currentLikes + 5}`;
        likesBadge.classList.add('pulse-glow');
        setTimeout(() => likesBadge.classList.remove('pulse-glow'), 1000);
    }

    // Firebase транзакция (Likes +5)
    if (dbEnabled) {
        const docId = urlToDocId(url);
        const dogRef = doc(db, 'dogs', docId);
        try {
            // Используем setDoc с merge: true для атомарного создания или обновления
            await setDoc(dogRef, {
                url,
                likes: increment(5),
                updatedAt: serverTimestamp()
            }, { merge: true });
            console.log('[Firebase] Супер-лайк (+5) отправлен! 🚀');
        } catch (e) {
            console.error('[Firebase] Ошибка супер-лайка:', e);
        }
    }

    save();
    updateUI();
};

window.triggerSuperLikeFx = (x, y) => {
    const particles = 20;
    const icons = ['❤️', '🔥', '✨', '⭐'];

    for (let i = 0; i < particles; i++) {
        const p = document.createElement('div');
        p.className = 'super-like-particle';
        p.innerHTML = icons[Math.floor(Math.random() * icons.length)];

        // Случайное направление
        const angle = Math.random() * Math.PI * 2;
        const dist = 50 + Math.random() * 100;
        const tx = Math.cos(angle) * dist;
        const ty = Math.sin(angle) * dist;

        p.style.left = `${x}px`;
        p.style.top = `${y}px`;
        p.style.setProperty('--tx', `${tx}px`);
        p.style.setProperty('--ty', `${ty}px`);

        document.body.appendChild(p);
        setTimeout(() => p.remove(), 1000);
    }
};

window.scanBreed = (event) => {
    const btn = event.currentTarget || event.target.closest('.player-btn');
    if (!btn) return;
    const card = btn.closest('.dog-card');
    if (!card) return;
    const img = card.querySelector('.photo-container > img');
    if (!img) return;
    const url = img.getAttribute('src');

    const tag = card.querySelector('.breed-info-panel');
    if (!tag) return;

    // --- Pickle Rick Clicks Count Easter Egg ---
    const hasCucumberAchievement = userProgress.unlocked.includes('ms_ogurets');
    if (!hasCucumberAchievement) {
        if (!window.cucumberClicksCount) window.cucumberClicksCount = 0;
        window.cucumberClicksCount++;
        if (window.cucumberClicksCount % 3 === 0) {
            // Запускаем анимацию огурца и открываем достижение одновременно, не блокируя проверку породы
            window.spawnPickleRick();
            window.unlockAchievement('ms_ogurets');
        }
    }

    // Проверяем, создатель это или собака
    const isCreator = card.hasAttribute('data-creator');

    tag.textContent = "🔍 Определяем...";
    tag.classList.add('active');
    
    // Включаем супер-режим эквалайзера при сканировании породы
    card.classList.add('scanning-eq');

    let breedResult;
    if (isCreator) {
        const matchedKey = Object.keys(CREATOR_SIGNATURES).find(key => url.includes(key));
        if (matchedKey) {
            breedResult = `🐕 ${CREATOR_SIGNATURES[matchedKey]}`;
        } else {
            const rb = CREATOR_BREEDS[Math.floor(Math.random() * CREATOR_BREEDS.length)];
            breedResult = `🐕 ${rb.charAt(0).toUpperCase() + rb.slice(1)}`;
        }
    } else {
        const breed = url.split('/')[4].split('-').reverse().join(' ');
        breedResult = `🐕 ${breed.charAt(0).toUpperCase() + breed.slice(1)}`;
    }

    setTimeout(() => {
        tag.textContent = breedResult;
        
        // Отключаем супер-режим эквалайзера
        card.classList.remove('scanning-eq');

        // Скрываем плашку "Новая" при успешном сканировании
        const badge = card.querySelector('.new-badge');
        if (badge) {
            badge.classList.add('hidden');
        }

        // Сохраняем в список найденных собак
        if (!userProgress.scanned) userProgress.scanned = [];
        if (!userProgress.scanned.includes(url)) {
            userProgress.scanned.push(url);
        }

        // --- Creator Face Achievement Trigger ---
        if (isCreator) {
            if (!userProgress.unlocked.includes('creator_face_achievement')) {
                window.unlockAchievement('creator_face_achievement');
            }

            // --- Collect Face Logic (v5.1.0) ---
            if (!userProgress.collection) userProgress.collection = [];
            const alreadyCollected = userProgress.collection.some(item => item.url === url);
            if (!alreadyCollected) {
                userProgress.collection.push({
                    url: url,
                    breed: breedResult.replace('🐕 ', ''),
                    date: new Date().toLocaleDateString('ru-RU')
                });
                
                // Track achievement progress
                window.checkAchievements?.();
                
                // Show celebration overlay
                window.showPremiumCollectionToast(url, breedResult);
            }
        }

        // --- Pickle Rick Marathon Trigger ---
        if (isCreator && breedResult.includes("МС ОГУРЕЦ")) {
            if (!userProgress.unlocked.includes('ms_ogurets')) {
                window.unlockAchievement('ms_ogurets');
            }
        }

        userProgress.breedsIdentified++;
        save();
    }, 600);
};

// --- 6. The Running Pickle Rick Marathon (v3.2.4) ---
window.spawnPickleRick = () => {
    const rick = document.createElement('img');
    rick.className = 'picklerick-runner';
    rick.src = 'img/pickle-rick-run.png';

    // Fallback на эмодзи, если картинка не найдена
    rick.onerror = () => {
        rick.remove();
        const fallback = document.createElement('div');
        fallback.className = 'picklerick-runner';
        fallback.innerHTML = '🥒';
        fallback.style.fontSize = '80px';
        fallback.style.display = 'flex';
        fallback.style.alignItems = 'center';
        fallback.style.justifyContent = 'center';
        document.body.appendChild(fallback);
        fallback.addEventListener('animationend', () => fallback.remove());
    };

    document.body.appendChild(rick);
    rick.addEventListener('animationend', () => rick.remove());
};

// --- 7. King of the Week (v2.6.2) ---
async function renderKingBanner() {
    const container = document.getElementById('side-king');
    const modalContent = document.getElementById('king-modal-content');
    if (!container && !modalContent) return;

    let kingUrl = 'img/fallback_dog_2.jpg';
    let dogName = 'Хороший мальчик';
    let likesCount = 0;

    if (dbEnabled) {
        try {
            const q = query(collection(db, 'dogs'), orderBy('likes', 'desc'), limit(1));
            const snapshot = await getDocs(q);
            if (!snapshot.empty) {
                const kingData = snapshot.docs[0].data();
                kingUrl = kingData.url;
                likesCount = kingData.likes || 0;

                // Извлекаем породу
                if (kingData.breed) {
                    dogName = kingData.breed;
                } else {
                    dogName = extractBreedFromUrl(kingUrl);
                }
            }
        } catch (e) {
            console.error("[Firebase] Ошибка загрузки Короля:", e);
        }
    }

    if (container) {
        container.innerHTML = `
            <img src="${kingUrl}" class="king-side-photo-compact" id="king-img" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=300&auto=format&fit=crop'">
        `;
    }

    if (modalContent) {
        modalContent.innerHTML = `
            <div class="king-of-the-week">
                <div class="king-photo-wrapper">
                    <img src="${kingUrl}" class="king-photo" onclick="window.openLightbox('${kingUrl}')" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=300&auto=format&fit=crop'" style="cursor: zoom-in;">
                </div>
                <div class="king-info">
                    <span class="king-badge">Король</span>
                    <h3 class="king-name" style="text-transform: capitalize;">${dogName}</h3>
                    <div class="king-stats">
                        <span>❤️ Лайков: ${likesCount}</span>
                    </div>
                </div>
            </div>
        `;
    }
}

// --- 8. Shop Logic (v3.0.0) ---
window.initShop = () => {
    window.closeAllModals();
    const grid = document.getElementById('shop-grid');
    if (!grid) return;
    grid.innerHTML = SHOP_ITEMS.map(item => `
        <div class="shop-item">
            <div class="shop-item-icon">${item.icon}</div>
            <h3>${item.title}</h3>
            <p>${item.desc}</p>
            <button class="btn-buy" onclick="window.buyItem('${item.id}', ${item.price})">
                ${userProgress.purchased.includes(item.id) && !item.consumable ? 'Куплено' : `Купить ${item.price} 🦴`}
            </button>
        </div>
    `).join('');

    // --- ОТКРЫТИЕ МОДАЛА МАГАЗИНА ---
    document.getElementById('shop-modal')?.classList.add('active');
    pushModalState();
};

window.buyItem = (id, price) => {
    if (userProgress.bones < price) return showToast("Недостаточно косточек! 🦴");
    if (userProgress.purchased.includes(id) && !SHOP_ITEMS.find(i => i.id === id).consumable) {
        return showToast("Уже куплено! ✨");
    }

    userProgress.bones -= price;
    if (!userProgress.purchased.includes(id)) userProgress.purchased.push(id);

    if (id === 'super_like') {
        userProgress.superLikes = (userProgress.superLikes || 0) + 1;
        showToast("Супер-лайк куплен! 🔥 Проверьте окно оценки.");
    } else {
        showToast("Покупка успешна! 🎉");
    }

    save();
    updateUI();
    window.initShop();
};

// --- 9. Mini Game (v3.4.0) ---
// --- Таймер мини-игры ---
let _gameTimerInterval = null;
const GAME_TIMER_SECONDS = 15;

function gameStopTimer() {
    if (_gameTimerInterval) {
        clearInterval(_gameTimerInterval);
        _gameTimerInterval = null;
    }
}

function gameStartTimer(onExpire) {
    gameStopTimer();
    let timeLeft = GAME_TIMER_SECONDS;

    const barEl = document.getElementById('game-timer-bar');
    const textEl = document.getElementById('game-timer-text');

    const update = () => {
        if (!barEl || !textEl) return;
        const pct = (timeLeft / GAME_TIMER_SECONDS) * 100;
        barEl.style.width = pct + '%';
        textEl.textContent = timeLeft;

        // Цвет по срочности
        barEl.className = 'game-timer-bar';
        if (pct <= 30) barEl.classList.add('danger');
        else if (pct <= 60) barEl.classList.add('warning');
    };

    update();

    _gameTimerInterval = setInterval(() => {
        timeLeft--;
        update();
        if (timeLeft <= 0) {
            gameStopTimer();
            onExpire();
        }
    }, 1000);
}


window.startMiniGame = () => {
    window.closeAllModals();
    const modal = document.getElementById('game-modal');
    if (!modal) return;

    currentGameScore = 0;
    currentGameStreak = 0;
    document.getElementById('game-score').textContent = '0';
    document.getElementById('game-streak').textContent = '0';

    modal.classList.add('active');
    pushModalState();
    window.updateGameMultiplier();
    window.nextGameRound();
};

window.updateGameMultiplier = () => {
    let multiplier = 1;
    if (currentGameStreak >= 3 && currentGameStreak < 6) multiplier = 2;
    else if (currentGameStreak >= 6 && currentGameStreak < 10) multiplier = 3;
    else if (currentGameStreak >= 10) multiplier = 4;

    const rewardVal = document.getElementById('current-reward-val');
    const badge = document.getElementById('multiplier-badge');
    const rewardBanner = document.querySelector('.game-reward-banner');

    if (rewardVal) {
        rewardVal.textContent = `+${1 * multiplier}`;
        rewardVal.classList.add('force-white-text');
    }
    if (badge) {
        badge.textContent = `(X${multiplier})`;
        badge.className = `badge-x${multiplier}`;
        badge.classList.add('force-white-text');
    }
    if (rewardBanner) {
        rewardBanner.classList.add('force-white-text');
    }
    return multiplier;
};

window.nextGameRound = async () => {
    const imgEl = document.getElementById('game-main-img');
    const optionsEl = document.getElementById('game-options');
    const feedbackEl = document.getElementById('game-feedback');

    if (!imgEl || !optionsEl) return;

    const rewardBanner = document.querySelector('.game-reward-banner');
    if (rewardBanner) {
        rewardBanner.classList.add('force-white-text');
    }
    const rewardVal = document.getElementById('current-reward-val');
    if (rewardVal) {
        rewardVal.classList.add('force-white-text');
    }
    const badge = document.getElementById('multiplier-badge');
    if (badge) {
        badge.classList.add('force-white-text');
    }



    gameStopTimer();
    optionsEl.innerHTML = '<div class="game-loading">Загружаем пёсика... 🐕</div>';
    feedbackEl?.classList.add('hidden');
    document.getElementById('next-round-btn')?.classList.add('hidden');
    imgEl.style.opacity = '0.3';

    try {
        const res = await fetch('https://dog.ceo/api/breeds/image/random');
        const data = await res.json();
        const url = data.message;

        const correctBreedRaw = url.split('/')[4];
        const correctBreed = correctBreedRaw
            .split('-').reverse().join(' ')
            .replace(/\b\w/g, c => c.toUpperCase());

        imgEl.src = url;
        imgEl.style.opacity = '1';
        imgEl.style.cursor = 'zoom-in';
        imgEl.onclick = () => window.openLightbox(url);

        let options = [correctBreed];
        while (options.length < 4) {
            const randomBreed = GAME_BREEDS[Math.floor(Math.random() * GAME_BREEDS.length)];
            if (!options.includes(randomBreed)) options.push(randomBreed);
        }
        options.sort(() => Math.random() - 0.5);

        optionsEl.innerHTML = options.map(opt => `
            <button class="game-option-btn" onclick="window.checkGameAnswer(this, '${opt.replace(/'/g, "\\'")}', '${correctBreed.replace(/'/g, "\\'")}')">
                ${opt}
            </button>
        `).join('');

        // Запускаем таймер — при истечении считается неправильный ответ
        gameStartTimer(() => {
            const allBtns = optionsEl.querySelectorAll('.game-option-btn');
            allBtns.forEach(b => {
                b.disabled = true;
                if (b.textContent.trim() === correctBreed) b.classList.add('correct');
            });
            currentGameStreak = 0;
            document.getElementById('game-streak').textContent = '0';

            const fb = document.getElementById('game-feedback');
            if (fb) {
                fb.textContent = `⏱️ Время вышло! Правильно: ${correctBreed}`;
                fb.className = 'game-feedback wrong-feedback';
                fb.classList.remove('hidden');
            }
            document.getElementById('next-round-btn')?.classList.remove('hidden');
        });

    } catch (e) {
        showToast('Ошибка связи с Dog API 📡');
        console.error(e);
        optionsEl.innerHTML = '<button class="game-option-btn" onclick="window.nextGameRound()">Повторить 🔄</button>';
    }
};

window.showFloatingReward = (btn, text) => {
    const rect = btn.getBoundingClientRect();
    const floating = document.createElement('span');
    floating.className = 'floating-reward';
    floating.textContent = text;
    floating.style.left = (rect.left + rect.width / 2) + 'px';
    floating.style.top = (rect.top - 10) + 'px';
    document.body.appendChild(floating);
    setTimeout(() => {
        if (document.body.contains(floating)) floating.remove();
    }, 1500);
};

window.checkGameAnswer = (btn, chosen, correct) => {
    gameStopTimer();

    const optionsEl = document.getElementById('game-options');
    const allBtns = optionsEl?.querySelectorAll('.game-option-btn') || [];
    allBtns.forEach(b => { b.disabled = true; });

    const feedbackEl = document.getElementById('game-feedback');
    const isCorrect = chosen === correct;

    if (isCorrect) {
        btn.classList.add('correct');
        currentGameScore += 100 + (currentGameStreak * 10);
        currentGameStreak += 1;

        const multiplier = window.updateGameMultiplier();
        const reward = 1 * multiplier;
        userProgress.bones += reward;

        if (currentGameStreak >= 5) {
            window.unlockAchievement('minigame_streak');
            userProgress.miniGameStreak = Math.max(userProgress.miniGameStreak || 0, currentGameStreak);
        }
        save();
        updateUI();

        if (feedbackEl) {
            feedbackEl.textContent = currentGameStreak >= 2
                ? `✅ Верно! 🔥 Серия: ${currentGameStreak} (Награда: +${reward} 🦴)`
                : `✅ Верно! +${reward} 🦴`;
            feedbackEl.className = 'game-feedback correct-feedback';
            feedbackEl.classList.remove('hidden');
        }

        window.showFloatingReward(btn, `+${reward} 🦴`);
        window.updateGameMultiplier(); // Подготовка к следующему ответру
    } else {
        btn.classList.add('wrong');
        allBtns.forEach(b => {
            if (b.textContent.trim() === correct) b.classList.add('correct');
        });
        currentGameStreak = 0;
        window.updateGameMultiplier();

        if (feedbackEl) {
            feedbackEl.textContent = `❌ Неверно! Правильно: ${correct}`;
            feedbackEl.className = 'game-feedback wrong-feedback';
            feedbackEl.classList.remove('hidden');
        }
    }

    document.getElementById('game-score').textContent = currentGameScore;
    document.getElementById('game-streak').textContent = currentGameStreak;

    document.getElementById('next-round-btn')?.classList.remove('hidden');
};

// Единственная глобальная функция закрытия лайтбокса
window.closeLightbox = (isPopState = false) => {
    const lb = document.getElementById('lightbox');
    if (lb) lb.classList.remove('active');
    if (window.resetLightboxTransform) window.resetLightboxTransform();
};

window.lightboxScale = 1;

window.openLightbox = (url) => {
    const lb = document.getElementById('lightbox');
    const img = document.getElementById('lightbox-img');
    if (!lb || !img) return;

    if (window.resetLightboxTransform) window.resetLightboxTransform();
    img.src = url;

    // Режим Создателя (v4.4.0)
    if (CREATOR_PHOTOS.includes(url)) {
        if (!userProgress.unlocked.includes('creator_face_achievement')) {
            window.unlockAchievement('creator_face_achievement');
        }
    }

    lb.classList.add('active');
    pushModalState();
};

// --- 8. Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    updateUI();

    // Обработчик тумблера курсора Создателя
    const cursorCheckbox = document.getElementById('cursor-checkbox');
    if (cursorCheckbox) {
        cursorCheckbox.addEventListener('change', (e) => {
            if (e.target.checked) {
                document.body.classList.add('creator-cursor-active');
                localStorage.setItem('creator_cursor_user_pref', 'enabled');
                localStorage.setItem('creator_cursor_enabled', 'true');
                showToast("😈 Курсор Создателя включен!");
            } else {
                document.body.classList.remove('creator-cursor-active');
                localStorage.setItem('creator_cursor_user_pref', 'disabled');
                localStorage.setItem('creator_cursor_enabled', 'false');
                showToast("😇 Курсор Создателя выключен!");
            }
        });
    }

    renderKingBanner();

    // ТРЕТЬЯ ТЕМА: РЕЖИМ СОЗДАТЕЛЯ (v4.4.0)
    const creatorThemeBtn = document.getElementById('trigger-creator-theme-btn');
    if (creatorThemeBtn) {
        creatorThemeBtn.addEventListener('click', () => {
            const isCreatorActive = document.body.classList.contains('vershitel-theme');
            if (isCreatorActive) {
                document.body.classList.remove('vershitel-theme');
                const userThemePref = localStorage.getItem('user_theme_pref') || 'dark';
                document.body.classList.add(userThemePref === 'light' ? 'light-theme' : 'dark-theme');
                userProgress.creatorModeActive = false;
                localStorage.setItem('creator_mode_enabled', 'false');
                save();
            } else {
                document.body.classList.remove('dark-theme', 'light-theme');
                document.body.classList.add('vershitel-theme');
                userProgress.creatorModeActive = true;
                localStorage.setItem('creator_mode_enabled', 'true');
                save();
            }
            if (window.fixVisualBugsDynamically) window.fixVisualBugsDynamically();
        });
    }


    // Game Zoom Logic
    const gameImg = document.getElementById('game-main-img');
    const zoomOverlay = document.getElementById('game-image-zoom-overlay');
    const zoomImg = document.getElementById('zoom-img');

    if (gameImg && zoomOverlay && zoomImg) {
        gameImg.onclick = () => {
            zoomImg.src = gameImg.src;
            zoomOverlay.classList.add('active');
        };
        zoomOverlay.onclick = () => {
            zoomOverlay.classList.remove('active');
        };
    }

    // Game Leaderboard Listeners
    const openLB = document.getElementById('open-leaderboard-btn');
    const closeLB = document.getElementById('close-leaderboard-btn');
    const lbView = document.getElementById('game-leaderboard-view');

    if (openLB) openLB.onclick = window.showLeaderboard;
    if (closeLB) closeLB.onclick = () => {
        if (typeof window.hideLeaderboard === 'function') window.hideLeaderboard();
        if (history.state && history.state.modalOpen) history.back();
    };

    const grid = document.getElementById('dogs-container');
    const loadMoreBtn = document.getElementById('load-more-btn');
    const sentinel = document.getElementById('infinite-sentinel');

    let isFetchingDogs = false;
    let galleryObserver = null;


    window.loadDogsBatch = async (count = 9) => {
        if (isFetchingDogs) return;
        isFetchingDogs = true;

        try {
            const res = await fetch(`https://dog.ceo/api/breeds/image/random/${count}`);
            if (!res.ok) throw new Error("Network response was not ok");
            const data = await res.json();

            if (data.status === 'success' && data.message && data.message.length > 0) {
                const dogImagesArray = data.message;
                for (let i = 0; i < dogImagesArray.length; i++) {
                    totalDogsLoadedCount++;

                    const isCreatorClassActive = document.body.classList.contains('vershitel-theme') ||
                        document.body.classList.contains('creator-theme') ||
                        document.body.classList.contains('creator-mode-active') ||
                        localStorage.getItem('creator_mode_enabled') === 'true';

                    let imgSrc = '';
                    let isCreatorTime = false;

                    // Photos spawn with a 12% baseline chance in any mode, and 20% in Vershitel mode.
                    const spawnChance = isCreatorClassActive ? 0.20 : 0.12;

                    if (Math.random() < spawnChance && CREATOR_PHOTOS.length > 0) {
                        const randomIndex = Math.floor(Math.random() * CREATOR_PHOTOS.length);
                        imgSrc = CREATOR_PHOTOS[randomIndex];
                        isCreatorTime = true;
                        console.log("🎲 [ВЕРШИТЕЛЬ]: Карточка заменена на лицо ->", imgSrc);
                    } else {
                        imgSrc = dogImagesArray[i];
                    }

                    if (imgSrc) {
                        grid?.appendChild(createDogCard(imgSrc, i, isCreatorTime));
                    }
                    await new Promise(r => setTimeout(r, 45));
                }
            } else {
                // Если картинок больше нет (или API вернул пустоту)
                if (loadMoreBtn) {
                    loadMoreBtn.innerHTML = "Вы посмотрели всех пёсиков! 🐾";
                    loadMoreBtn.disabled = true;
                }
            }
        } catch (err) {
            console.error("Batch load error:", err);
            showToast("Ошибка сети. Попробуйте еще раз... 🔄");
        } finally {
            isFetchingDogs = false;
        }
    };


    // Железнобетонная подгрузка по кнопке (v4.3.9)
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', async () => {
            if (loadMoreBtn.disabled) return;

            // Включаем режим загрузки прямо на кнопке
            loadMoreBtn.disabled = true;
            loadMoreBtn.innerHTML = 'Синхронизация... ⏳';
            loadMoreBtn.style.opacity = '0.7';
            loadMoreBtn.style.cursor = 'wait';

            try {
                await window.loadDogsBatch(9);
            } catch (error) {
                console.error('Ошибка при загрузке новых собак:', error);
            } finally {
                // ЖЕЛЕЗОБЕТОННЫЙ СБРОС (выполнится всегда)
                if (loadMoreBtn.innerHTML !== "Вы посмотрели всех пёсиков! 🐾") {
                    loadMoreBtn.disabled = false;
                    loadMoreBtn.innerHTML = 'Смотреть ещё собак 🐾';
                    loadMoreBtn.style.opacity = '1';
                    loadMoreBtn.style.cursor = 'pointer';
                }
            }
        });
    }

    // Очистка старых обсерверов
    if (galleryObserver) {
        galleryObserver.disconnect();
        galleryObserver = null;
    }


    // Первичная загрузка
    window.loadDogsBatch(9);

    // Sidebar Modal Listeners (v3.0.9 Fix)

    const btnMap = {
        'side-king': 'king-modal',
        'side-rating-btn': 'rating-modal',
        'side-shop-btn': 'shop-modal',
        'side-achievements-btn': 'achievements-modal',
        'side-collection-btn': 'collection-modal',
        'side-hall-btn': 'hall-modal',
        'side-breeds-btn': 'hall-modal',
        'side-minigame-btn': 'minigame-modal'
    };

    Object.entries(btnMap).forEach(([btnId, modalId]) => {
        document.getElementById(btnId)?.addEventListener('click', () => {
            window.closeAllModals();
            if (modalId === 'king-modal') window.showKingModal();
            else if (modalId === 'hall-modal') window.showHallOfFame();
            else if (modalId === 'shop-modal') window.initShop();
            else if (modalId === 'minigame-modal') window.startMiniGame();
            else if (modalId === 'achievements-modal') window.showAchievements();
            else if (modalId === 'collection-modal') window.showCollectionModal();
            else {
                document.getElementById(modalId)?.classList.add('active');
                pushModalState();
            }
            if (btnId === 'side-breeds-btn') {
                document.querySelector('[data-hall-tab="breeds"]')?.click();
            }
        });
    });

    // Header Button Listeners
    document.getElementById('open-rating')?.addEventListener('click', () => {
        window.closeAllModals();
        window.renderRatings(); // Локальный топ (Мои топы) всегда подготов
        window.subscribeGlobalRating(); // Подписываемся на real-time Общий топ
        document.getElementById('rating-modal')?.classList.add('active');
        pushModalState();
    });
    document.getElementById('open-hall')?.addEventListener('click', window.showHallOfFame);

    // --- NEW BALANCE EASTER EGG (v4.3.0) ---
    window.runSneakerAnimation = () => {
        const sneaker = document.createElement('img');
        sneaker.src = 'img/nb-sneaker.png';
        sneaker.className = 'nb-sneaker-run';
        document.body.appendChild(sneaker);
        setTimeout(() => sneaker.remove(), 3500);
    };

    document.getElementById('global-bones')?.addEventListener('click', () => {
        // 1. Всегда открываем окно баланса
        const modal = document.getElementById('balance-modal');
        const modalVal = document.getElementById('modal-bones-val');
        const superlikesVal = document.getElementById('modal-superlikes-val');
        if (modal && modalVal) {
            modalVal.textContent = userProgress.bones;
            modalVal.classList.add('force-white-text');
            if (superlikesVal) {
                superlikesVal.textContent = userProgress.superLikes || 0;
                superlikesVal.classList.add('force-white-text');
            }
            modal.classList.add('active');
            pushModalState();
        }

        // 2. Анимация и ачивка — только ОДИН раз (если еще не разблокировано)
        if (!userProgress.unlocked?.includes('new_balance_achievement')) {
            window.runSneakerAnimation();
            window.unlockAchievement('new_balance_achievement');
        }
    });

    // --- MEME HUB HANDLERS (v4.3.0) ---
    const sidebarHub = document.querySelector('.spotify-sidebar-hub');
    const hubTrigger = document.querySelector('.main-hub-trigger');
    if (sidebarHub && hubTrigger) {
        hubTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            sidebarHub.classList.toggle('active');
        });

        // Close dropdown when clicking outside of it
        document.addEventListener('click', (e) => {
            if (!sidebarHub.contains(e.target)) {
                sidebarHub.classList.remove('active');
            }
        });
    }

    document.getElementById('trigger-cucumber-btn')?.addEventListener('click', () => {
        if (window.spawnPickleRick) window.spawnPickleRick();
    });

    document.getElementById('trigger-sneaker-btn')?.addEventListener('click', () => {
        // В хабе кроссовок бегает всегда при клике!
        window.runSneakerAnimation();
    });




    // Voting Logic
    document.getElementById('submit-vote')?.addEventListener('click', () => {
        if (!currentDogForVote) return;

        const inputs = document.querySelectorAll('#criteria-list input[type="range"]');
        let total = 0;
        inputs.forEach(input => total += parseInt(input.value));
        const avg = (total / inputs.length).toFixed(1);

        // Плоская структура для Firestore (без вложенных объектов)
        const scoreData = {
            avg: parseFloat(avg),
            cringe: parseInt(inputs[0]?.value || 5),
            size: parseInt(inputs[1]?.value || 5),
            cute: parseInt(inputs[2]?.value || 5),
            aggro: parseInt(inputs[3]?.value || 5),
            beauty: parseInt(inputs[4]?.value || 5),
            ts: Date.now()
        };

        // Реальная запись в Firestore — асинхронно, не блокируем UI
        const isNewVote = !votedDogs.includes(currentDogForVote);
        if (isNewVote) {
            votedDogs.push(currentDogForVote);
            userProgress.bones += 1;
            userProgress.dogsRated++;
            showToast("Вердикт сохранен! 🦴+1");
        } else {
            showToast("Вердикт обновлен! ♻️");
        }

        window.syncVote(currentDogForVote, scoreData, isNewVote);

        save();
        updateUI();

        // Обновляем визуальный бейдж на карточке собаки
        const id = btoa(currentDogForVote);
        const avgBadge = document.getElementById(`avg-${id}`);
        if (avgBadge) avgBadge.textContent = `⭐ ${avg}`;

        document.getElementById('vote-modal').classList.remove('active');
        if (history.state && history.state.modalOpen) history.back();
    });

    // Sidebar Special Buttons
    const triggerCucumberBtn = document.getElementById('trigger-cucumber-btn') || document.getElementById('rick-summoner');
    triggerCucumberBtn?.addEventListener('click', window.spawnPickleRick);
    document.getElementById('test-rick')?.addEventListener('click', window.spawnPickleRick);

    // Hall of Fame Tabs
    document.querySelectorAll('[data-hall-tab]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('[data-hall-tab]').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.hall-view').forEach(v => {
                v.classList.remove('active');
                v.style.display = 'none';
            });

            e.target.classList.add('active');
            const tab = e.target.getAttribute('data-hall-tab');
            const targetId = tab === 'breeds' ? 'hall-breeds-view' : 'hall-winners-view';
            const view = document.getElementById(targetId);
            if (view) {
                view.classList.add('active');
                view.style.display = 'block';
            }

            if (tab === 'breeds') window.loadBreedBattle();
            else window.loadNominees();
        });
    });

    // Rating Tabs & Filters — при переключении переподписываемся на Firestore
    document.querySelectorAll('[data-rating-tab]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('[data-rating-tab]').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            const tab = e.target.getAttribute('data-rating-tab');
            if (tab === 'global') {
                window.subscribeGlobalRating(); // real-time из Firestore
            } else {
                if (_unsubscribeGlobal) { _unsubscribeGlobal(); _unsubscribeGlobal = null; }
                window.renderRatings(); // локальные данные для «Мои топы»
            }
        });
    });

    // При смене фильтра — перезапускаем onSnapshot с новой сортировкой
    const resubscribe = () => {
        const activeTab = document.querySelector('.tab-btn[data-rating-tab].active')?.getAttribute('data-rating-tab');
        if (activeTab === 'global') window.subscribeGlobalRating();
        else window.renderRatings();
    };
    document.getElementById('rating-sort-criteria')?.addEventListener('change', resubscribe);
    document.getElementById('rating-sort-order')?.addEventListener('change', resubscribe);

    // Theme Toggle — переключаем оба класса одновременно
    document.getElementById('theme-toggle')?.addEventListener('click', () => {
        document.body.classList.remove('vershitel-theme');
        userProgress.creatorModeActive = false;
        localStorage.setItem('creator_mode_enabled', 'false');
        save();

        const isDark = document.body.classList.toggle('dark-theme');
        document.body.classList.toggle('light-theme', !isDark);
        localStorage.setItem('user_theme_pref', isDark ? 'dark' : 'light');
    });

    // Close Modals (кнопки ×)
    document.querySelectorAll('.close-modal, .close-lightbox').forEach(b => {
        b.onclick = (e) => {
            e.preventDefault();
            const modal = e.target.closest('.modal') || document.getElementById('lightbox');
            window.closeAnyModal(modal);
        };
    });

    // Escape — закрытие ТОЛЬКО самого верхнего открытого окна (v4.2.2)
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const activeModals = Array.from(document.querySelectorAll('.modal.active, [class*="modal"].active, #lightbox.active'));

            if (activeModals.length > 0) {
                e.preventDefault();
                // Берем последнее открытое окно в DOM
                const topModal = activeModals[activeModals.length - 1];

                if (topModal.id === 'lightbox') {
                    window.closeLightbox();
                } else if (window.closeAnyModal) {
                    window.closeAnyModal(topModal);
                } else {
                    topModal.classList.remove('active');
                }
            }
        }
    });

    // Зум в лайтбоксе управляется через событие wheel (см. конец файла)
});

// --- RATING AND HALL OF FAME LOGIC ---
window.renderRatings = () => {
    const dogs = [];
    const criteriaSelect = document.getElementById('rating-sort-criteria')?.value || 'avg';
    const orderSelect = document.getElementById('rating-sort-order')?.value || 'desc';
    const activeTab = document.querySelector('.tab-btn[data-rating-tab].active')?.getAttribute('data-rating-tab') || 'global';

    document.querySelectorAll('.dog-card').forEach(card => {
        const img = card.querySelector('img').src;
        const avgText = card.querySelector('.new-badge').textContent;
        const likesText = card.querySelector('.count')?.textContent || "0";
        const avg = parseFloat(avgText.replace('⭐ ', '')) || 0;
        const likes = parseInt(likesText) || 0;
        const breedPart = img.split('/')[4];
        const breed = breedPart ? breedPart.split('-').reverse().join(' ').replace(/\b\w/g, c => c.toUpperCase()) : 'Неизвестно';

        const mockCriteria = getMockCriteria(img);
        const criteriaVal = mockCriteria[criteriaSelect] !== undefined ? mockCriteria[criteriaSelect] : (criteriaSelect === 'likes' ? likes : avg);
        const val = Number(criteriaVal) || 0;

        dogs.push({
            img, avg, likes, breed, ...mockCriteria,
            score: val,
            rating: val
        });
    });

    let filteredDogs = [...dogs];

    // Вкладка "Мои топы" - только те, за кого голосовали или лайкали
    if (activeTab === 'local') {
        filteredDogs = filteredDogs.filter(d => votedDogs.includes(d.img) || likedDogs.includes(d.img));
    }

    // Сортируем массив как a.score - b.score (или a.rating - b.rating)
    filteredDogs.sort((a, b) => {
        if (orderSelect === 'desc') {
            return Number(b.score) - Number(a.score);
        }
        return Number(a.score) - Number(b.score);
    });

    const topList = filteredDogs.slice(0, 10);

    const renderListHTML = topList.length ? topList.map((d, i) => `
        <div class="rating-item">
            <span class="breed-rank-num">#${i + 1}</span>
            <img src="${d.img}" loading="lazy" decoding="async" class="rating-img" onclick="window.openLightbox('${d.img}')" style="cursor: zoom-in;">
            <div class="rating-info">
                <div class="breed-rank-name">${d.breed}</div>
                <div class="rating-likes">
                    ${criteriaSelect === 'likes' ? '❤️ ' + d.likes :
            criteriaSelect === 'avg' ? '⭐ ' + d.avg :
                '📊 ' + d[criteriaSelect] + '/10'}
                </div>
            </div>
        </div>
    `).join('') : (() => {
        let emptyMsg = "Здесь пока пусто 🐾";
        if (criteriaSelect === 'avg') {
            emptyMsg = "Пока нет оценок 🐾";
        } else if (criteriaSelect === 'likes') {
            emptyMsg = "Пока никто не набрал лайков 🐾";
        }
        return `<p style="text-align:center; padding:20px; color:var(--text-muted);">${emptyMsg}</p>`;
    })();

    const container = document.getElementById('rating-list-container');
    if (container) container.innerHTML = renderListHTML;
};

window.hideLeaderboard = () => {
    const lbView = document.getElementById('game-leaderboard-view');
    if (lbView) {
        lbView.classList.add('hidden');
    }
    const gameCloseBtn = document.querySelector('#game-modal .close-modal');
    if (gameCloseBtn) {
        gameCloseBtn.classList.remove('element-hidden');
    }
};

window.showLeaderboard = async () => {
    const lbView = document.getElementById('game-leaderboard-view');
    const lbList = document.getElementById('leaderboard-list');
    if (!lbView || !lbList) return;

    // Если уже открыт -> Закрываем как переключатель (Trophy Toggle)
    if (!lbView.classList.contains('hidden')) {
        window.hideLeaderboard();
        if (history.state && history.state.modalOpen) {
            history.back();
        }
        return;
    }

    lbView.classList.remove('hidden');
    pushModalState();
    lbList.innerHTML = '<div class="loading-leaderboard">Загрузка... ⏳</div>';

    // Скрываем крестик самой игры, чтобы не накладывался на крестик топа
    const gameCloseBtn = document.querySelector('#game-modal .close-modal');
    if (gameCloseBtn) gameCloseBtn.classList.add('element-hidden');

    if (!dbEnabled) {
        lbList.innerHTML = '<div class="error">Firebase не подключен 🔌</div>';
        return;
    }

    try {
        const q = query(collection(db, 'game_leaderboard'), orderBy('maxStreak', 'desc'), limit(10));
        const querySnapshot = await getDocs(q);

        let html = '';
        let rank = 1;
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            html += `
                <div class="leader-item">
                    <span class="leader-rank">#${rank++}</span>
                    <span class="leader-name">${data.username}</span>
                    <span class="leader-score">${data.maxStreak} 🔥</span>
                </div>
            `;
        });

        lbList.innerHTML = html || '<div class="empty">Пока нет рекордов 🐾</div>';
    } catch (e) {
        console.error(lbList.innerHTML = 'Ошибка загрузки 😢');
    }
};

window.initHallOfFame = () => {
    // По умолчанию открываем Номинантов
    const nomineesTab = document.querySelector('[data-hall-tab="winners"]');
    if (nomineesTab) nomineesTab.click();
};

window.loadNominees = async () => {
    const grid = document.getElementById('hall-grid');
    if (!grid) return;
    grid.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding:50px;">Загрузка чемпионов... 🏆</div>';

    if (!dbEnabled) return grid.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding:50px;">База данных недоступна 😢</div>';

    try {
        const q = query(collection(db, 'dogs'), orderBy('likes', 'desc'), limit(9));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            grid.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding:50px;">Номинантов пока нет. Будь первым, кто проголосует! 🐕</div>';
            return;
        }

        grid.innerHTML = snapshot.docs.map((doc, i) => {
            const data = doc.data();
            let breed = data.breed || extractBreedFromUrl(data.url);

            // Если это создатель, подсвечиваем
            const isCreator = CREATOR_PHOTOS.includes(data.url);
            if (isCreator && !data.breed) breed = "МС ОГУРЕЦ 🥒";

            return `
                <div class="hall-card ${isCreator ? 'creator-card' : ''}">
                    <div class="hall-rank">#${i + 1}</div>
                    <img src="${data.url}" loading="lazy" decoding="async" class="hall-img" onclick="window.openLightbox('${data.url}')">
                    <div class="hall-info">
                        <div class="hall-breed" style="text-transform: capitalize;">${breed}</div>
                        <div class="hall-likes">❤️ ${data.likes || 0} лайков</div>
                    </div>
                </div>
            `;
        }).join('');
    } catch (e) {
        console.error("Hall of Fame Error:", e);
        grid.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding:50px;">Ошибка загрузки данных ❌</div>';
    }
};

window.loadBreedBattle = async () => {
    const list = document.getElementById('breeds-list');
    if (!list) return;
    list.innerHTML = '<div style="text-align:center; padding:50px;">Считаем голоса фракций... 📊</div>';

    if (!dbEnabled) return;

    try {
        const q = query(collection(db, 'dogs'), orderBy('likes', 'desc'), limit(100));
        const snapshot = await getDocs(q);

        const breedStats = {};
        snapshot.docs.forEach(doc => {
            const data = doc.data();
            const breed = data.breed || extractBreedFromUrl(data.url);
            if (!breedStats[breed]) breedStats[breed] = { totalLikes: 0, count: 0 };
            breedStats[breed].totalLikes += (data.likes || 0);
            breedStats[breed].count++;
        });

        const sortedBreeds = Object.entries(breedStats)
            .map(([name, stats]) => ({ name, ...stats }))
            .sort((a, b) => b.totalLikes - a.totalLikes)
            .slice(0, 10);

        if (sortedBreeds.length === 0) {
            list.innerHTML = '<div style="text-align:center; padding:50px;">Данных для битвы пород пока нет 🐾</div>';
            return;
        }

        const maxLikes = sortedBreeds[0].totalLikes;

        list.innerHTML = sortedBreeds.map((b, i) => {
            const pct = Math.round((b.totalLikes / maxLikes) * 100);
            return `
                <div class="breed-rank-item">
                    <span class="breed-rank-num">#${i + 1}</span>
                    <div class="breed-rank-info">
                        <div class="breed-rank-header">
                            <span class="breed-rank-name">${b.name}</span>
                            <span class="breed-rank-likes">${b.totalLikes} Score</span>
                        </div>
                        <div class="breed-rank-progress-bg">
                            <div class="breed-rank-progress-fill" style="width: ${pct}%"></div>
                        </div>
                        <div style="font-size: 0.7rem; color: var(--text-muted); margin-top: 5px;">
                            ${b.count} участников в составе фракции
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    } catch (e) {
        console.error("Breed Battle Error:", e);
        list.innerHTML = '<div style="text-align:center; padding:50px;">Ошибка агрегации данных ❌</div>';
    }
};

// --- ACHIEVEMENTS RENDER ---
window.renderAchievements = () => {
    const grid = document.getElementById('achievements-grid');
    if (!grid) return;

    grid.innerHTML = ACHIEVEMENTS.map(ach => {
        const isUnlocked = userProgress.unlocked.includes(ach.id);
        const progress = ach.getProgress();
        const pct = Math.min(100, Math.round((progress / ach.threshold) * 100));

        return `
            <div class="ach-card ${isUnlocked ? 'ach-unlocked' : 'ach-locked'}" 
                 ${isUnlocked ? `onclick="window.openAchievementDetail('${ach.id}')"` : ''}>
                <div class="ach-icon">${isUnlocked ? ach.icon : '🔒'}</div>
                <div class="ach-body">
                    <div class="ach-title">${isUnlocked ? ach.title : '???'}</div>
                    <div class="ach-desc">${isUnlocked ? ach.desc : 'Продолжай играть...'}</div>
                    <div class="ach-progress-bar">
                        <div class="ach-progress-fill" style="width:${isUnlocked ? 100 : pct}%"></div>
                    </div>
                    <div class="ach-progress-text">${isUnlocked ? 'Выполнено ✔️' : `${Math.min(progress, ach.threshold)} / ${ach.threshold}`}</div>
                </div>
            </div>
        `;
    }).join('');
};

// --- GLOBAL UI WRAPPERS (v3.6.0) ---
window.openUniversalModal = (headerText, contentElement, showContinueButton = true) => {
    let modal = document.getElementById('universal-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'universal-modal';
        modal.className = 'modal';
        document.body.appendChild(modal);
    }

    modal.innerHTML = `
        <div class="modal-content">
            <span class="close-modal">&times;</span>
            <h2 class="modal-title"><span class="modal-icon">ℹ️</span> ${headerText}</h2>
            <div class="universal-modal-body"></div>
            ${showContinueButton ? `<button id="btn-modal-continue" class="action-btn next-round-btn" style="margin-top:20px; width:100%; display:block !important;">Продолжить ➡️</button>` : ''}
        </div>
    `;

    const body = modal.querySelector('.universal-modal-body');
    if (typeof contentElement === 'string') {
        body.innerHTML = contentElement;
    } else if (contentElement instanceof HTMLElement) {
        body.appendChild(contentElement);
    }

    modal.querySelector('.close-modal').onclick = (e) => {
        e.preventDefault();
        window.closeAnyModal(modal);
    };

    const contBtn = modal.querySelector('#btn-modal-continue');
    if (contBtn) {
        contBtn.onclick = (e) => {
            e.preventDefault();
            window.closeAnyModal(modal);
        };
    }

    modal.classList.add('active');
    pushModalState();
};

window.showKingModal = async () => {
    window.closeAllModals();
    await renderKingBanner();
    document.getElementById('king-modal')?.classList.add('active');
    pushModalState();
};

window.showHallOfFame = () => {
    window.closeAllModals();
    window.initHallOfFame();
    document.getElementById('hall-modal')?.classList.add('active');
    pushModalState();
};

window.showAchievements = () => {
    window.closeAllModals();
    window.renderAchievements();
    document.getElementById('achievements-modal')?.classList.add('active');
    pushModalState();
};

window.openAchievementDetail = (achId) => {
    const ach = ACHIEVEMENTS.find(a => a.id === achId);
    if (!ach) return;

    const modal = document.getElementById('achievement-detail-modal');
    if (!modal) return;

    document.getElementById('ach-detail-icon').textContent = ach.icon;
    document.getElementById('ach-detail-title').textContent = ach.title;
    document.getElementById('ach-detail-desc').textContent = ach.desc;

    modal.classList.add('active');
    pushModalState();
};

window.closeAchievementDetail = () => {
    window.closeAnyModal(document.getElementById('achievement-detail-modal'));
};

window.closeAnyModal = (modalElement) => {
    if (!modalElement) return;

    // 1. Закрываем само окно (ТОЛЬКО remove('active'), НИКОГДА не add('.hidden') к модалкам!)
    modalElement.classList.remove('active');
    // ВНИМАНИЕ: .hidden здесь НЕ добавляется — этот класс ломает повторное открытие модалок

    // Дополнительно для лайтбокса
    if (modalElement.id === 'lightbox') {
        const img = document.getElementById('lightbox-img');
        if (img) {
            img.style.transform = 'scale(1)';
            img.style.cursor = 'zoom-in';
        }
    }

    // 2. ГАРАНТИРОВАННО возвращаем нижнюю панель
    const mobileNav = document.getElementById('mobile-nav');
    if (mobileNav) {
        mobileNav.classList.remove('nav-hidden');
    }

    // 3. Сбрасываем is-scrolling на всякий случай (безопасный фаллбэк)
    document.body.classList.remove('is-scrolling');

    // 4. И ТОЛЬКО НА МОБИЛКАХ управляем историей
    if (window.innerWidth <= 768 && history.state && history.state.modalOpen) {
        history.back();
    }

    // 5. Проверяем, остались ли открытые модалки, чтобы снять блокировку скролла
    setTimeout(() => {
        if (!getActiveModal()) {
            document.body.classList.remove('no-scroll');
            document.body.style.paddingRight = '';
        }
    }, 100);

    // Отписка от Firestore если это рейтинг
    if (modalElement.id === 'rating-modal' && typeof _unsubscribeGlobal === 'function') {
        _unsubscribeGlobal();
        _unsubscribeGlobal = null;
    }
};

window.closeGameModalDirectly = () => {
    const modal = document.getElementById('game-modal');
    if (modal) {
        modal.classList.remove('active');
    }
    if (typeof window.hideLeaderboard === 'function') {
        window.hideLeaderboard();
    }
    document.body.style.overflow = '';
    document.body.classList.remove('no-scroll');
    document.body.style.paddingRight = '';
    const mobileNav = document.getElementById('mobile-nav');
    if (mobileNav) {
        mobileNav.classList.remove('nav-hidden');
    }
};

window.closeAllModals = () => {
    document.querySelectorAll('.modal.active').forEach(m => window.closeAnyModal(m));
    const lb = document.getElementById('lightbox');
    if (lb?.classList.contains('active')) window.closeAnyModal(lb);
};

window.addEventListener('popstate', async (event) => {
    const activeModal = getActiveModal();
    if (activeModal) {
        if (activeModal.id === 'game-modal') await window.checkAndSyncGameRecord();

        activeModal.classList.remove('active');
        activeModal.classList.add('hidden');

        if (activeModal.id === 'rating-modal' && typeof _unsubscribeGlobal === 'function') {
            _unsubscribeGlobal();
            _unsubscribeGlobal = null;
        }
    }

    setTimeout(() => {
        if (!getActiveModal()) {
            showMobileNav();
            document.body.classList.remove('no-scroll');
            document.body.style.paddingRight = '';
        }
    }, 100);
});

// --- MOBILE DOCK HANDLERS ---
window.openKingModal = window.showKingModal;
window.openRickGame = window.startMiniGame;

// --- MOBILE CLEANUP ---
if (window.innerWidth <= 768) {
    document.addEventListener('DOMContentLoaded', () => {
        const cleanTitles = () => {
            document.querySelectorAll('button, .side-btn, [data-tip]').forEach(el => {
                el.removeAttribute('title');
            });
        };
        cleanTitles();
        const observer = new MutationObserver(cleanTitles);
        observer.observe(document.body, { childList: true, subtree: true });
    });
}

// Безопасный сброс is-scrolling по первому клику (защита от залипания)
document.addEventListener('pointerdown', () => {
    document.body.classList.remove('is-scrolling');
}, { passive: true, capture: true });

// ФИНАЛЬНЫЙ СКРИПТ-УБИЙЦА БАГОВ
function fixVisualBugsDynamically() {
    const isVershitel = document.body.classList.contains('vershitel-theme');
    const isDark = document.body.classList.contains('dark-theme') || 
                   document.body.getAttribute('data-theme') === 'dark' ||
                   isVershitel;

    // 1. Берем вообще все возможные элементы боковых панелей, включая .side-widget-compact
    const allWidgets = document.querySelectorAll('.side-btn, .action-btn, .side-widget-compact, .mobile-only-nav button, button');

    allWidgets.forEach(btn => {
        // Если активен Режим Вершителя, не вмешиваемся в стили переключателя темы и кнопки магазина
        const isThemeToggle = btn.id === 'theme-toggle' || btn.classList.contains('theme-toggle');
        const isShopBtn = btn.id === 'side-shop-btn' || btn.id === 'mob-shop-btn' ||
            btn.textContent.includes('🛒') || btn.innerHTML.includes('cart') ||
            btn.innerHTML.includes('shop') || btn.className.includes('shop');

        // Если активен Режим Вершителя и это кнопка магазина, принудительно даем force-dark-bg и чистим стили!
        if (isVershitel && isShopBtn) {
            btn.classList.add('force-dark-bg');
            btn.style.removeProperty('background');
            btn.style.removeProperty('color');
            btn.style.removeProperty('border');
            btn.style.removeProperty('box-shadow');
            btn.style.removeProperty('filter');

            const children = btn.querySelectorAll('*');
            children.forEach(child => {
                child.style.removeProperty('background');
                child.style.removeProperty('color');
                child.style.removeProperty('border');
                child.style.removeProperty('box-shadow');
                child.style.removeProperty('filter');
            });
            return;
        }

        if (isVershitel && isThemeToggle) {
            // В режиме Вершителя полностью очищаем инлайн-стили, заданные JS, чтобы работал чистый CSS!
            btn.style.removeProperty('background');
            btn.style.removeProperty('color');
            btn.style.removeProperty('border');
            btn.style.removeProperty('box-shadow');
            btn.style.removeProperty('filter');

            const children = btn.querySelectorAll('*');
            children.forEach(child => {
                child.style.removeProperty('background');
                child.style.removeProperty('color');
                child.style.removeProperty('border');
                child.style.removeProperty('box-shadow');
                child.style.removeProperty('filter');
            });
            return; // Пропускаем дальнейшую обработку
        }

        // Тотально зачищаем квадраты и аутлайны у всех внутренностей
        const children = btn.querySelectorAll('*');
        children.forEach(child => {
            child.style.setProperty('border', 'none', 'important');
            child.style.setProperty('outline', 'none', 'important');
            child.style.setProperty('box-shadow', 'none', 'important');
            child.style.setProperty('background', 'transparent', 'important');
        });

        // Жестко определяем кнопку магазина (по иконке корзины, классу или ID)
        if (isShopBtn) {
            if (isDark) {
                // В темной теме возвращаем кнопке нормальный темный круглый фон
                btn.style.setProperty('background', 'rgba(255, 255, 255, 0.1)', 'important');
                btn.style.setProperty('filter', 'none', 'important');

                // Инвертируем ТОЛЬКО саму иконку/эмодзи внутри
                const icon = btn.querySelector('span, img, i') || btn;
                if (icon !== btn) {
                    icon.style.setProperty('filter', 'invert(1) brightness(2)', 'important');
                }
            } else {
                // В светлой теме делаем фон белым с мягкой тенью
                btn.style.setProperty('background', '#ffffff', 'important');
                btn.style.setProperty('filter', 'none', 'important');
                btn.style.setProperty('box-shadow', '0 4px 15px rgba(0,0,0,0.15)', 'important');
            }
        }
    });

    // 2. Уничтожаем рамку на крестиках закрытия (ищем по классам и по тексту "×")
    const closeElements = document.querySelectorAll('.close-btn, [class*="close"], .modal button');
    closeElements.forEach(el => {
        if (el.textContent.trim() === '×' || el.className.includes('close')) {
            el.style.setProperty('border', 'none', 'important');
            el.style.setProperty('outline', 'none', 'important');
            el.style.setProperty('box-shadow', 'none', 'important');
            el.style.setProperty('background', 'transparent', 'important');

            el.querySelectorAll('*').forEach(child => {
                child.style.setProperty('border', 'none', 'important');
                child.style.setProperty('outline', 'none', 'important');
                child.style.setProperty('box-shadow', 'none', 'important');
                child.style.setProperty('background', 'transparent', 'important');
            });
        }
    });
}

// Запускаем при загрузке и при каждом клике на переключатель темы
document.addEventListener('DOMContentLoaded', fixVisualBugsDynamically);
window.addEventListener('click', () => setTimeout(fixVisualBugsDynamically, 50));

// --- LIGHTBOX INTERACTION LOGIC (Zoom & Pan) ---
document.addEventListener('DOMContentLoaded', () => {
    const lightboxImg = document.getElementById('lightbox-img');
    if (!lightboxImg) return;

    let isDragging = false;
    let startX, startY;
    let translateX = 0;
    let translateY = 0;

    // Сброс позиции при открытии/закрытии (вызывается из глобальных функций)
    window.resetLightboxTransform = () => {
        window.lightboxScale = 1;
        translateX = 0;
        translateY = 0;
        lightboxImg.style.transform = `translate(0, 0) scale(1)`;
        lightboxImg.style.cursor = 'zoom-in';
    };

    lightboxImg.addEventListener('wheel', (e) => {
        e.preventDefault();

        const delta = e.deltaY < 0 ? 0.15 : -0.15;
        const newScale = Math.min(Math.max(window.lightboxScale + delta, 1), 5);

        if (newScale !== window.lightboxScale) {
            window.lightboxScale = newScale;
            lightboxImg.style.transform = `translate(${translateX}px, ${translateY}px) scale(${window.lightboxScale})`;
            lightboxImg.style.cursor = window.lightboxScale > 1 ? 'grab' : 'zoom-in';
        }
    }, { passive: false });

    lightboxImg.addEventListener('mousedown', (e) => {
        if (window.lightboxScale > 1) {
            isDragging = true;
            startX = e.clientX - translateX;
            startY = e.clientY - translateY;
            lightboxImg.style.cursor = 'grabbing';
            lightboxImg.style.transition = 'none'; // Убираем задержку при таскании
        }
    });

    window.addEventListener('mousemove', (e) => {
        if (!isDragging) return;

        // Новые потенциальные координаты
        let nextX = e.clientX - startX;
        let nextY = e.clientY - startY;

        // Ограничители (Clamp), чтобы картинка не исчезала с экрана
        const scale = window.lightboxScale;
        const maxShiftX = (scale - 1) * (window.innerWidth / 2);
        const maxShiftY = (scale - 1) * (window.innerHeight / 2);

        translateX = Math.max(-maxShiftX, Math.min(maxShiftX, nextX));
        translateY = Math.max(-maxShiftY, Math.min(maxShiftY, nextY));

        lightboxImg.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
    });

    window.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            lightboxImg.style.cursor = 'grab';
            lightboxImg.style.transition = 'transform 0.3s ease';
        }
    });
});


// --- 9. Creator Face Collection Album & Celebrating Toast (v5.1.0) ---

window.showPremiumCollectionToast = (url, breedResult) => {
    const toast = document.getElementById('premium-collection-toast');
    const toastImg = document.getElementById('premium-toast-img');
    const toastBreed = document.getElementById('premium-toast-breed');
    const viewBtn = document.getElementById('premium-toast-view-btn');

    if (!toast || !toastImg || !toastBreed) return;

    // Populating details
    toastImg.src = url;
    toastBreed.textContent = breedResult;

    // Triggering the full-screen visual active state
    toast.classList.add('active');
    
    // Confetti or particle explosion effect
    window.spawnCollectionConfetti?.();

    // Set action button to immediately open the album
    if (viewBtn) {
        viewBtn.onclick = () => {
            toast.classList.remove('active');
            window.showCollectionModal();
        };
    }
};

window.spawnCollectionConfetti = () => {
    const emojis = ['✨', '🎉', '🌟', '💖', '🐾', '👑'];
    for (let i = 0; i < 30; i++) {
        const particle = document.createElement('div');
        particle.textContent = emojis[Math.floor(Math.random() * emojis.length)];
        particle.style.position = 'fixed';
        particle.style.zIndex = '99999';
        particle.style.left = Math.random() * 100 + 'vw';
        particle.style.top = '-5vh';
        particle.style.fontSize = (Math.random() * 20 + 20) + 'px';
        particle.style.pointerEvents = 'none';
        particle.style.transition = `transform ${Math.random() * 2 + 2}s cubic-bezier(0.1, 0.8, 0.3, 1), opacity ${Math.random() * 2 + 2}s ease-in-out`;
        
        document.body.appendChild(particle);
        
        // Trigger transition
        setTimeout(() => {
            particle.style.transform = `translate(${Math.random() * 200 - 100}px, ${window.innerHeight + 100}px) rotate(${Math.random() * 360}deg)`;
            particle.style.opacity = '0';
        }, 50);

        // Cleanup
        setTimeout(() => {
            particle.remove();
        }, 4000);
    }
};

window.showCollectionModal = () => {
    window.closeAllModals();
    const modal = document.getElementById('collection-modal');
    const grid = document.getElementById('collection-grid');
    const countText = document.getElementById('collection-percent-text');
    const progressBar = document.getElementById('collection-progress-bar');

    if (!modal || !grid || !countText || !progressBar) return;

    // Ensure collection is initialized
    if (!userProgress.collection) userProgress.collection = [];

    // Clear previous items in the grid
    grid.innerHTML = '';

    // Calculate progress stats
    const totalCount = CREATOR_PHOTOS.length;
    const collectedCount = userProgress.collection.length;
    const percent = Math.round((collectedCount / totalCount) * 100);

    countText.textContent = `${collectedCount} из ${totalCount} (${percent}%)`;
    progressBar.style.width = `${percent}%`;

    // Loop through all static photos to populate the album slots
    CREATOR_PHOTOS.forEach((photoUrl, index) => {
        // Find if this specific url is collected
        const found = userProgress.collection.find(item => item.url === photoUrl);
        
        const card = document.createElement('div');
        card.className = `collection-card ${found ? 'unlocked' : 'locked'}`;

        if (found) {
            let displayBreed = found.breed;
            if (CREATOR_SIGNATURES[photoUrl]) {
                displayBreed = CREATOR_SIGNATURES[photoUrl];
            }

            card.innerHTML = `
                <div class="collection-card-img-wrapper">
                    <img class="collection-card-img" src="${photoUrl}" alt="Creator face">
                </div>
                <div class="collection-card-title">Лицо Создателя #${index + 1}</div>
                <div class="collection-card-breed">🐕 ${displayBreed}</div>
                <div class="collection-card-date">${found.date}</div>
            `;
            
            // Открываем детальную карточку создателя при клике
            card.addEventListener('click', () => {
                window.openCreatorCardDetail(photoUrl, displayBreed, index + 1);
            });
        } else {
            card.innerHTML = `
                <div class="collection-card-img-wrapper">
                    <img class="collection-card-img" src="${photoUrl}" alt="Locked face">
                    <div class="collection-card-lock-overlay">🔒</div>
                </div>
                <div class="collection-card-title">Лицо Создателя #${index + 1}</div>
                <div class="collection-card-breed">Неизвестно</div>
                <div class="collection-card-date">Секрет 🔒</div>
            `;
        }

        grid.appendChild(card);
    });

    // Display the modal & track history
    modal.classList.add('active');
    pushModalState();
};

const AURAS = [
    "🌌 Космический ультрафиолет (99% Силы)",
    "🔥 Огненный оранж (88% Харизмы)",
    "🍀 Изумрудный дзен (95% Спокойствия)",
    "💎 Неоновый алмаз (92% Креативности)",
    "⚡ Грозовой электрик (97% Драйва)",
    "🌸 Золотая сакура (90% Интуиции)"
];
const STATUSES = [
    "💻 Заряжен на кодинг (200 FPS)",
    "😎 На чилле, на расслабоне",
    "👑 Обдумывает великие планы",
    "🍜 Обеденный перерыв (Пьет чай)",
    "💡 Создает новые пасхалки",
    "💤 Восполняет ресурсы сна",
    "🎹 Сочиняет музыкальный хит"
];
const PREDICTIONS = [
    "Сегодня идеальный день, чтобы отсканировать ещё одного пёсика!",
    "Твоя удача сегодня повышена на +15%. Время крутить собачьи корма!",
    "Кто-то близкий принесет тебе косточку. Будь готов!",
    "Отличные новости уже на подходе. Главное — не вешать хвост!",
    "Сегодня звезды советуют включить режим Вершителя и покорить топ!",
    "Твой любимый пёсик думает о тебе прямо сейчас!",
    "Фортуна улыбается смелым. Твой следующий скан будет легендарным!"
];

window.openCreatorCardDetail = function(photoUrl, displayBreed, number) {
    const modal = document.getElementById('creator-detail-modal');
    if (!modal) return;
    
    document.getElementById('creator-detail-img').src = photoUrl;
    document.getElementById('creator-detail-title').textContent = `Создатель #${number}`;
    document.getElementById('creator-detail-breed').textContent = `🐕 ${displayBreed}`;
    
    // Генерируем стабильный сид на основе URL для постоянства характеристик конкретного лица
    let seed = 0;
    for (let i = 0; i < photoUrl.length; i++) {
        seed += photoUrl.charCodeAt(i);
    }
    
    const aura = AURAS[seed % AURAS.length];
    const status = STATUSES[(seed + 2) % STATUSES.length];
    const energy = 80 + (seed % 21);
    const prediction = PREDICTIONS[(seed + 5) % PREDICTIONS.length];
    
    document.getElementById('creator-aura-val').textContent = aura;
    document.getElementById('creator-energy-val').textContent = `${energy}%`;
    document.getElementById('creator-status-val').textContent = status;
    document.getElementById('creator-prediction-val').textContent = prediction;
    
    modal.classList.add('active');
};

window.skipNextCard = function(btn) {
    const card = btn.closest('.dog-card');
    if (card) {
        card.style.transform = 'translateX(140px) rotate(10deg)';
        card.style.opacity = '0';
        setTimeout(() => {
            card.remove();
            // check if we need to load more
            if (document.querySelectorAll('.dog-card').length < 3) {
                window.loadDogsBatch(6);
            }
        }, 300);
    }
};

window.skipBackCard = function(btn) {
    window.showToast("⏮️ Перемотка собачьего плейлиста на начало!");
};
