const LANG_DEFAULT = 'en';
let langCurrent = localStorage.getItem('lang') || LANG_DEFAULT;

async function loadTranslations(file, lang = langCurrent) {
    try {
        const response = await fetch(`../translates/${lang}/${file}.json`);
        if (!response.ok) throw new Error(`Failed to load ${file}.json for ${lang}`);
        return await response.json();
    } catch (error) {
        console.error('Error loading translations:', error);
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
    console.log('Initializing translations for page:', pageName);
    const pageTranslations = await loadTranslations(pageName);
    applyTranslations(pageTranslations);

    const headerTranslations = await loadTranslations('header');
    applyTranslations(headerTranslations, document.getElementById('header'));

    const footerTranslations = await loadTranslations('footer');
    applyTranslations(footerTranslations, document.getElementById('footer'));

    setupLanguageDropdown(pageName);

    if (pageName === 'shop' && typeof window.renderProducts === 'function' && typeof window.getCurrentParams === 'function') {
        console.log('Rendering shop products');
        window.renderProducts(window.getCurrentParams());
    }
    if (pageName === 'cart' && typeof window.renderCart === 'function') {
        console.log('Rendering cart');
        window.renderCart();
    }
    if (pageName === 'favorites' && typeof window.renderFavorites === 'function') {
        console.log('Rendering favorites');
        window.renderFavorites();
    }
    if (pageName === 'services') {
        if (typeof window.renderCategories === 'function') {
            console.log('Rendering categories');
            window.renderCategories();
        }
        if (typeof window.initSlider === 'function') {
            console.log('Initializing slider');
            window.initSlider();
        }
        if (typeof window.initSpecialOffers === 'function') {
            console.log('Initializing special offers');
            window.initSpecialOffers();
        }
    }
}

async function changeLanguage(lang, pageName) {
    console.log('Changing language to:', lang, 'for page:', pageName);
    langCurrent = lang;
    localStorage.setItem('lang', lang);

    if (pageName === 'services') {
        console.log('Attempting to reload page for services to apply language change');
        try {
            window.location.reload();
        } catch (error) {
            console.error('Reload failed:', error);
            const pageTranslations = await loadTranslations(pageName);
            applyTranslations(pageTranslations);
            if (typeof window.renderCategories === 'function') {
                console.log('Fallback: Rendering categories');
                window.renderCategories();
            }
            if (typeof window.initSlider === 'function') {
                console.log('Fallback: Initializing slider');
                window.initSlider();
            }
            if (typeof window.initSpecialOffers === 'function') {
                console.log('Fallback: Initializing special offers');
                window.initSpecialOffers();
            }
        }
        return;
    }

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
        console.log('Rendering shop products after language change');
        window.renderProducts(window.getCurrentParams());
    }
    if (pageName === 'cart' && typeof window.renderCart === 'function') {
        console.log('Rendering cart after language change');
        window.renderCart();
    }
    if (pageName === 'favorites' && typeof window.renderFavorites === 'function') {
        console.log('Rendering favorites after language change');
        window.renderFavorites();
    }
}

function setupLanguageDropdown(pageName) {
    const langButton = document.querySelector('.lang button');
    const langContainer = document.querySelector('.lang');
    if (!langButton || !langContainer) {
        console.error('Missing DOM elements: lang button or container');
        return;
    }

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
            console.log('Language selected:', lang.code, 'for page:', pageName);
            changeLanguage(lang.code, pageName);
            dropdown.style.display = 'none';
        });
        dropdown.appendChild(langOption);
    });

    langContainer.appendChild(dropdown);

    langButton.addEventListener('click', () => {
        console.log('Language dropdown toggled');
        dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
    });

    document.addEventListener('click', (e) => {
        if (!langContainer.contains(e.target)) {
            dropdown.style.display = 'none';
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded: Initializing i18n');
    const pathParts = window.location.pathname.split('/');
    let pageName = pathParts[pathParts.length - 1].replace('.html', '');
    if (!pageName || pageName === 'index' || pathParts.includes('home')) {
        pageName = 'services';
    }
    console.log('Detected pageName:', pageName);
    initTranslations(pageName);
});