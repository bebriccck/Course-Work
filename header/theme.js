document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded fired');
    initializeTheme();
});

function initializeTheme() {
    const htmlElement = document.documentElement;
    const savedTheme = localStorage.getItem('theme') || 'light';
    
    console.log('Initializing theme:', savedTheme);

    if (savedTheme === 'dark') {
        htmlElement.classList.add('dark-theme');
    } else {
        htmlElement.classList.remove('dark-theme');
    }

    function bindThemeButton(themeButton) {
        if (!themeButton || themeButton.hasAttribute('data-theme-bound')) {
            console.warn('Theme button not found or already bound');
            return;
        }
        themeButton.setAttribute('data-theme-bound', 'true');
        themeButton.addEventListener('click', () => {
            htmlElement.classList.toggle('dark-theme');
            const isDark = htmlElement.classList.contains('dark-theme');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
            console.log('Theme switched to:', isDark ? 'dark' : 'light');
        });
        console.log('Theme button bound');
    }

    const themeButton = document.querySelector('.theme');
    if (themeButton) {
        bindThemeButton(themeButton);
    } else {

        const observer = new MutationObserver((mutations, obs) => {
            const themeButton = document.querySelector('.theme');
            if (themeButton) {
                bindThemeButton(themeButton);
                obs.disconnect();
                console.log('Theme button found via MutationObserver');
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }
}