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
            const childElements = element.querySelectorAll('[data-i18n]');
            if (childElements.length > 0) {
                childElements.forEach(child => {
                    const childKey = child.getAttribute('data-i18n');
                    if (translations[childKey]) {
                        child.textContent = translations[childKey];
                        console.log(`Applied translation for child key: ${childKey} = ${translations[childKey]}`);
                    }
                });
                Array.from(element.childNodes).forEach(node => {
                    if (node.nodeType === Node.TEXT_NODE && translations[key]) {
                        let text = translations[key];
                        if (key === 'cart.totalItems' && text.includes('{count}')) {
                            const count = scope.querySelector('#totalItems')?.textContent.match(/\d+/)?.[0] || '0';
                            text = text.replace('{count}', count);
                        }
                        node.textContent = text;
                        console.log(`Applied translation for parent text node: ${key} = ${text}`);
                    }
                });
            } else {
                let text = translations[key];
                if (key === 'cart.totalItems' && text.includes('{count}')) {
                    const count = element.textContent.match(/\d+/)?.[0] || '0';
                    text = text.replace('{count}', count);
                }
                element.textContent = text;
                console.log(`Applied translation for key: ${key} = ${text}`);
            }
        }
    });
    const placeholderElements = scope.querySelectorAll('[data-i18n-placeholder]');
    placeholderElements.forEach(element => {
        const key = element.getAttribute('data-i18n-placeholder');
        if (translations[key]) {
            element.placeholder = translations[key];
            console.log(`Applied placeholder translation for key: ${key} = ${translations[key]}`);
        }
    });
}

window.reapplyTranslations = async (pageName) => {
    console.log('Reapplying translations for page:', pageName);
    const pageTranslations = await loadTranslations(pageName);
    applyTranslations(pageTranslations);
};

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
    if (pageName === 'services' || pageName === 'home') {
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
    if (pageName === 'login') {
        console.log('Initializing login form translations');
        validateForm && validateForm();
        const registerLink = document.querySelector('a[data-i18n="register_link"]');
        if (registerLink) {
            console.log('Register link found:', { href: registerLink.href, text: registerLink.textContent });
        } else {
            console.error('Register link not found');
        }
    }
}

async function changeLanguage(lang, pageName) {
    console.log('Changing language to:', lang, 'for page:', pageName);
    langCurrent = lang;
    localStorage.setItem('lang', lang);

    // Reload the page for shop, cart, product, services, and home
    if (['shop', 'cart', 'product', 'services', 'home'].includes(pageName)) {
        console.log('Reloading page for', pageName, 'to apply language change');
        try {
            window.location.reload();
        } catch (error) {
            console.error('Reload failed:', error);
            // Fallback to dynamic re-rendering if reload fails
            const pageTranslations = await loadTranslations(pageName);
            applyTranslations(pageTranslations);
            const headerTranslations = await loadTranslations('header');
            applyTranslations(headerTranslations, document.getElementById('header'));
            const footerTranslations = await loadTranslations('footer');
            applyTranslations(footerTranslations, document.getElementById('footer'));
            if (pageName === 'shop' && typeof window.renderProducts === 'function' && typeof window.getCurrentParams === 'function') {
                console.log('Fallback: Rendering shop products');
                window.renderProducts(window.getCurrentParams());
            }
            if (pageName === 'cart' && typeof window.renderCart === 'function') {
                console.log('Fallback: Rendering cart');
                window.renderCart();
            }
            if (pageName === 'product' && typeof window.renderProductPage === 'function') {
                console.log('Fallback: Rendering product page');
                window.renderProductPage();
            }
            if (pageName === 'services' || pageName === 'home') {
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
        }
        return;
    }

    // Dynamic re-rendering for other pages
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

    if (pageName === 'favorites' && typeof window.renderFavorites === 'function') {
        console.log('Rendering favorites after language change');
        window.renderFavorites();
    }
    if (pageName === 'login') {
        console.log('Initializing login form translations');
        validateForm && validateForm();
        const registerLink = document.querySelector('a[data-i18n="register_link"]');
        if (registerLink) {
            console.log('Register link found after language change:', { href: registerLink.href, text: registerLink.textContent });
        } else {
            console.error('Register link not found after language change');
        }
    }
}

function setupLanguageDropdown(pageName) {
    const langButton = document.querySelector('.lang button');
    const langContainer = document.querySelector('.lang');
    if (!langButton || !langContainer) {
        console.error('Missing DOM elements: lang button or container');
        setTimeout(() => setupLanguageDropdown(pageName), 100);
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
    console.log('Current pathname:', window.location.pathname);
    const pathParts = window.location.pathname.split('/');
    let pageName = pathParts[pathParts.length - 2] || pathParts[pathParts.length - 1].replace('.html', '');
    if (!pageName || pageName === 'index' || pageName === 'home') {
        if (pathParts.includes('shop')) pageName = 'shop';
        else if (pathParts.includes('about')) pageName = 'about';
        else if (pathParts.includes('contact')) pageName = 'contact';
        else if (pathParts.includes('cart')) pageName = 'cart';
        else if (pathParts.includes('product')) pageName = 'product';
    }
    console.log('Detected pageName:', pageName);
    initTranslations(pageName);
});