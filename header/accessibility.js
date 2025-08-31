document.addEventListener('DOMContentLoaded', function () {

    function initializeAccessibility() {

        const isHomePage = window.location.pathname.includes('/home/index.html') ||
                           window.location.pathname === '/' ||
                           window.location.pathname === '/index.html' ||
                           window.location.pathname === '/home/';
        if (!isHomePage) {
            console.log('Accessibility: Not on home page, features disabled. Pathname:', window.location.pathname);
            return;
        }

        console.log('Accessibility: Initializing on home page.');

        const header = document.getElementById('header');
        if (!header) {
            console.error('Accessibility: Header element not found.');
            return;
        }

        const observer = new MutationObserver(() => {
            const visButton = document.querySelector('.vis');
            if (visButton) {
                console.log('Accessibility: .vis button found, attaching event listener.');
                visButton.addEventListener('click', openAccessibilityModal);
                observer.disconnect(); 
            } else {
                console.log('Accessibility: Waiting for .vis button to load...');
            }
        });

        observer.observe(header, { childList: true, subtree: true });

        applyAccessibilitySettings();

        window.addEventListener('languageChanged', (event) => {
            const lang = event.detail.lang;
            console.log(`Accessibility: Updating modal translations for language: ${lang}`);
            window.translationsApplied['accessibility'] = false; // Reset cache
            window.loadTranslations('accessibility', lang).then(translations => {
                console.log('Accessibility: Applying translations after language change:', translations);
                applyTranslations(translations, document, 'accessibility');
            }).catch(error => {
                console.error('Accessibility: Failed to load translations for language change:', error);
            });
        });
    }

    if (!localStorage.getItem('accessibilityFontSize')) {
        localStorage.setItem('accessibilityFontSize', 'normal');
    }
    if (!localStorage.getItem('accessibilityColorScheme')) {
        localStorage.setItem('accessibilityColorScheme', 'default');
    }
    if (!localStorage.getItem('accessibilityHideImages')) {
        localStorage.setItem('accessibilityHideImages', 'false');
    }

    initializeAccessibility();
});

async function openAccessibilityModal() {

    const isHomePage = window.location.pathname.includes('/home/index.html') ||
                       window.location.pathname === '/' ||
                       window.location.pathname === '/index.html' ||
                       window.location.pathname === '/home/';
    if (!isHomePage) {
        console.log('Accessibility: Modal opening prevented, not on home page.');
        return;
    }

    console.log('Accessibility: Opening modal.');

    const modal = document.createElement('div');
    modal.className = 'accessibility-modal';
    modal.innerHTML = `
        <div class="accessibility-modal-content">
            <h3 data-i18n="accessibility_title">Accessibility Settings</h3>
            <div class="form-group">
                <label for="font-size" data-i18n="font_size_label">Font Size:</label>
                <select id="font-size">
                    <option value="normal" data-i18n="font_normal">Normal</option>
                    <option value="large" data-i18n="font_large">Large</option>
                    <option value="extra-large" data-i18n="font_extra_large">Extra Large</option>
                </select>
            </div>
            <div class="form-group">
                <label for="color-scheme" data-i18n="color_scheme_label">Color Scheme:</label>
                <select id="color-scheme">
                    <option value="default" data-i18n="color_default">Default</option>
                    <option value="black-green" data-i18n="color_black_green">Black on Green</option>
                    <option value="beige-brown" data-i18n="color_beige_brown">Beige on Brown</option>
                    <option value="blue-darkblue" data-i18n="color_blue_darkblue">Blue on Dark Blue</option>
                </select>
            </div>
            <div class="form-group">
                <label for="hide-images" data-i18n="hide_images_label">Hide Images:</label>
                <input type="checkbox" id="hide-images">
            </div>
            <button id="save-accessibility" data-i18n="save">Save</button>
            <button id="cancel-accessibility" data-i18n="cancel">Cancel</button>
        </div>
    `;

    document.body.appendChild(modal);

    const fontSizeSelect = modal.querySelector('#font-size');
    const colorSchemeSelect = modal.querySelector('#color-scheme');
    const hideImagesCheckbox = modal.querySelector('#hide-images');

    fontSizeSelect.value = localStorage.getItem('accessibilityFontSize') || 'normal';
    colorSchemeSelect.value = localStorage.getItem('accessibilityColorScheme') || 'default';
    hideImagesCheckbox.checked = localStorage.getItem('accessibilityHideImages') === 'true';

    const lang = localStorage.getItem('lang') || 'en';
    console.log(`Accessibility: Loading translations for language: ${lang}`);
    try {
        window.translationsApplied['accessibility'] = false; 
        const translations = await window.loadTranslations('accessibility', lang);
        console.log('Accessibility: Applying modal translations:', translations);
        if (Object.keys(translations).length === 0) {
            console.warn('Accessibility: No translations loaded, using default English.');
            applyTranslations({
                accessibility_title: 'Accessibility Settings',
                font_size_label: 'Font Size',
                font_normal: 'Normal',
                font_large: 'Large',
                font_extra_large: 'Extra Large',
                color_scheme_label: 'Color Scheme',
                color_default: 'Default',
                color_black_green: 'Black on Green',
                color_beige_brown: 'Beige on Brown',
                color_blue_darkblue: 'Blue on Dark Blue',
                hide_images_label: 'Hide Images',
                save: 'Save',
                cancel: 'Cancel'
            }, modal, 'accessibility');
        } else {
            applyTranslations(translations, modal, 'accessibility');
        }
    } catch (error) {
        console.error('Accessibility: Failed to load or apply translations:', error);
        applyTranslations({
            accessibility_title: 'Accessibility Settings',
            font_size_label: 'Font Size',
            font_normal: 'Normal',
            font_large: 'Large',
            font_extra_large: 'Extra Large',
            color_scheme_label: 'Color Scheme',
            color_default: 'Default',
            color_black_green: 'Black on Green',
            color_beige_brown: 'Beige on Brown',
            color_blue_darkblue: 'Blue on Dark Blue',
            hide_images_label: 'Hide Images',
            save: 'Save',
            cancel: 'Cancel'
        }, modal, 'accessibility');
    }

    modal.querySelector('#save-accessibility').addEventListener('click', () => {
        console.log('Accessibility: Saving settings.');
        localStorage.setItem('accessibilityFontSize', fontSizeSelect.value);
        localStorage.setItem('accessibilityColorScheme', colorSchemeSelect.value);
        localStorage.setItem('accessibilityHideImages', hideImagesCheckbox.checked);
        applyAccessibilitySettings();
        modal.remove();
    });

    modal.querySelector('#cancel-accessibility').addEventListener('click', () => {
        console.log('Accessibility: Modal closed without saving.');
        modal.remove();
    });
}

function applyAccessibilitySettings() {
    const isHomePage = window.location.pathname.includes('/home/index.html') ||
                       window.location.pathname === '/' ||
                       window.location.pathname === '/index.html' ||
                       window.location.pathname === '/home/';
    if (!isHomePage) {
        return;
    }

    console.log('Accessibility: Applying settings.');

    const fontSize = localStorage.getItem('accessibilityFontSize') || 'normal';
    const colorScheme = localStorage.getItem('accessibilityColorScheme') || 'default';
    const hideImages = localStorage.getItem('accessibilityHideImages') === 'true';
    document.documentElement.classList.remove('font-normal', 'font-large', 'font-extra-large');
    document.documentElement.classList.remove('scheme-black-green', 'scheme-beige-brown', 'scheme-blue-darkblue');
    document.documentElement.classList.remove('hide-images');

    if (fontSize !== 'normal') {
        document.documentElement.classList.add(`font-${fontSize}`);
    }

    if (colorScheme !== 'default') {
        document.documentElement.classList.add(`scheme-${colorScheme}`);
    }

    if (hideImages) {
        document.documentElement.classList.add('hide-images');
    }
}