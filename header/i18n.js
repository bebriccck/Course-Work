const DEFAULT_LANG = 'en';
let currentLang = localStorage.getItem('lang') || DEFAULT_LANG;

async function loadTranslations(file, lang = currentLang) {
    try {
        const response = await fetch(`../translates/${lang}/${file}.json`);
        if (!response.ok) throw new Error(`Failed to load ${file}.json for ${lang}`);
        return await response.json();
    } catch (error) {
        console.error(error);
        return {};
    }
}

function applyTranslations(translations, scope = document) {
    const elements = scope.querySelectorAll('[data-i18n]');
    elements.forEach(element => {
        const key = element.getAttribute('data-i18n');
        if (translations[key]) {
            element.textContent = translations[key];
        }
    });
}

async function initTranslations(pageName) {
    const pageTranslations = await loadTranslations(pageName);
    applyTranslations(pageTranslations);

    const headerTranslations = await loadTranslations('header');
    applyTranslations(headerTranslations, document.getElementById('header'));

    const footerTranslations = await loadTranslations('footer');
    applyTranslations(footerTranslations, document.getElementById('footer'));

    setupLanguageDropdown(pageName);

    if (pageName === 'shop' && typeof window.renderProducts === 'function' && typeof window.getCurrentParams === 'function') {
        window.renderProducts(window.getCurrentParams());
    }
    if (pageName === 'cart' && typeof window.renderCart === 'function') {
        window.renderCart();
    }
    if (pageName === 'favorites' && typeof window.renderFavorites === 'function') {
        window.renderFavorites();
    }
}

async function changeLanguage(lang, pageName) {
    currentLang = lang;
    localStorage.setItem('lang', lang);

    const pageTranslations = await loadTranslations(pageName);
    applyTranslations(pageTranslations);

    const headerTranslations = await loadTranslations('header');
    applyTranslations(headerTranslations, document.getElementById('header'));

    const footerTranslations = await loadTranslations('footer');
    applyTranslations(footerTranslations, document.getElementById('footer'));

    const langDisplay = document.querySelector('.lang p');
    if (langDisplay) {
        langDisplay.textContent = lang === 'en' ? 'English (USD)' : 'Русский (RUB)';
    }

    if (pageName === 'shop' && typeof window.renderProducts === 'function' && typeof window.getCurrentParams === 'function') {
        window.renderProducts(window.getCurrentParams());
    }
    if (pageName === 'cart' && typeof window.renderCart === 'function') {
        window.renderCart();
    }
    if (pageName === 'favorites' && typeof window.renderFavorites === 'function') {
        window.renderFavorites();
    }
}

function setupLanguageDropdown(pageName) {
    const langButton = document.querySelector('.lang button');
    const langContainer = document.querySelector('.lang');
    if (!langButton || !langContainer) return;

    const dropdown = document.createElement('div');
    dropdown.className = 'lang-dropdown';
    dropdown.style.display = 'none';
    dropdown.style.position = 'absolute';
    dropdown.style.backgroundColor = 'var(--bg-color)';
    dropdown.style.border = '1px solid var(--border-color)';
    dropdown.style.padding = '1rem';
    dropdown.style.zIndex = '1000';

    const languages = [
        { code: 'en', name: 'English (USD)' },
        { code: 'ru', name: 'Русский (RUB)' }
    ];

    languages.forEach(lang => {
        const langOption = document.createElement('p');
        langOption.textContent = lang.name;
        langOption.style.cursor = 'pointer';
        langOption.style.padding = '0.5rem';
        langOption.addEventListener('click', () => {
            changeLanguage(lang.code, pageName);
            dropdown.style.display = 'none';
        });
        dropdown.appendChild(langOption);
    });

    langContainer.appendChild(dropdown);

    langButton.addEventListener('click', () => {
        dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
    });

    document.addEventListener('click', (e) => {
        if (!langContainer.contains(e.target)) {
            dropdown.style.display = 'none';
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const pathParts = window.location.pathname.split('/');
    let pageName = pathParts[pathParts.length - 1].replace('.html', '');
    if (!pageName || pageName === 'index') {
        pageName = pathParts[pathParts.length - 2] || 'services';
    }
    initTranslations(pageName);
});