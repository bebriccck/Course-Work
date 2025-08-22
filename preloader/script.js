// Добавление стилей прелоадера динамически
const preloaderStyle = document.createElement('style');
preloaderStyle.id = 'preloader-style';
preloaderStyle.textContent = `
    #preloader {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: var(--bg-color);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 2000;
        transition: opacity 0.5s ease;
    }
    .dark-theme #preloader {
        background-color: var(--bg-color);
    }
    #preloader.hidden {
        opacity: 0;
        pointer-events: none;
    }
    .spinner {
        width: 5rem;
        height: 5rem;
        border: 0.5rem solid var(--border-color);
        border-top: 0.5rem solid var(--accent-color);
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }
    @keyframes spin {
        0% {
            transform: rotate(0deg);
        }
        100% {
            transform: rotate(360deg);
        }
    }
    @media (max-width: 768px) {
        .spinner {
            width: 4rem;
            height: 4rem;
            border-width: 0.4rem;
        }
    }
    @media (max-width: 480px) {
        .spinner {
            width: 3.5rem;
            height: 3.5rem;
            border-width: 0.3rem;
        }
    }
    @media (max-width: 320px) {
        .spinner {
            width: 3rem;
            height: 3rem;
            border-width: 0.3rem;
        }
    }
`;
document.head.appendChild(preloaderStyle);

// Скрытие прелоадера и удаление его стилей после полной загрузки страницы
window.onload = () => {
    const preloader = document.getElementById('preloader');
    const preloaderStyleElement = document.getElementById('preloader-style');
    if (preloader) {
        preloader.classList.add('hidden');
        setTimeout(() => {
            preloader.style.display = 'none';
            if (preloaderStyleElement) {
                preloaderStyleElement.remove(); // Удаляем стили прелоадера
            }
        }, 500); // Задержка для плавного исчезновения
    }
};