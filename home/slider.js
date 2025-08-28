async function fetchProducts() {
    try {
        const response = await fetch(`${API_URL}/products`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const products = await response.json();
        const shuffled = products.sort(() => 0.5 - Math.random());
        console.log('Slider products fetched:', shuffled.slice(0, 5));
        return shuffled.slice(0, 5);
    } catch (error) {
        console.error('Error fetching products:', error);
        return [];
    }
}

function createSlide(product) {
    const lang = localStorage.getItem('lang') || 'en';
    const currentDate = new Date();
    const discountEndDate = product.discountEndDate ? new Date(product.discountEndDate) : null;
    const isDiscountValid = product.discount > 0 && product.discount < 100 && (!discountEndDate || currentDate <= discountEndDate);
    const effectivePrice = isDiscountValid ? product.price * (100 - product.discount) / 100 : product.price;
    const displayPrice = lang === 'ru' ? (effectivePrice * EXCHANGE_RATE).toFixed(2) : effectivePrice.toFixed(2);
    let priceDisplay = `<p class="price">${lang === 'ru' ? '₽' : '$'}${displayPrice}</p>`;
    let discountEndDateDisplay = '';
    if (isDiscountValid) {
        const originalPrice = lang === 'ru' ? (product.price * EXCHANGE_RATE).toFixed(2) : product.price.toFixed(2);
        priceDisplay = `
            <div class="price-container">
                <p class="new-price">${lang === 'ru' ? '₽' : '$'}${displayPrice}</p>
                <p class="old-price">${lang === 'ru' ? '₽' : '$'}${originalPrice}</p>
                <p class="discount-label">${product.discount}% ${lang === 'ru' ? 'СКИДКА' : 'OFF'}</p>
            </div>
        `;
        if (discountEndDate) {
            discountEndDateDisplay = `<span data-i18n="discount_end_date">${
                lang === 'ru'
                    ? `Скидка до: ${discountEndDate.toLocaleDateString('ru-RU', { day: '2-digit', month: 'short', year: 'numeric' })}`
                    : `Discount valid until: ${discountEndDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`
            }</span>`;
        }
    }
    const name = lang === 'ru' ? product.ru_name || product.name : product.name;
    return `
        <div class="slide">
            <div class="slide-content">
                <div class="slide-left">
                    <h2>${name || 'Product'}</h2>
                    <h3 data-i18n="slider_motto">We Serve Your Dream Furniture</h3>
                    ${priceDisplay}
                    <p class="discount-end-date">${discountEndDateDisplay}</p>
                    <button data-i18n="shop_now" onclick="window.location.href='../product/index.html?id=${product.id}'">Shop Now</button>
                </div>
                <div class="slide-right">
                    <img src="../img/shop/${product.id}.png" alt="${name || 'Product'}">
                </div>
            </div>
        </div>
    `;
}

window.initSlider = async function initSlider() {
    const slidesContainer = document.querySelector('.slides');
    const indicatorsContainer = document.querySelector('.slider-indicators');
    if (!slidesContainer || !indicatorsContainer) {
        console.error('Missing DOM elements: slides or slider-indicators');
        setTimeout(window.initSlider, 100);
        return;
    }

    const lang = localStorage.getItem('lang') || 'en';
    const products = await fetchProducts();
    if (products.length === 0) {
        console.error('No products available for slider');
        slidesContainer.innerHTML = `<p data-i18n="no_products">No products available.</p>`;
        window.applyTranslations && window.applyTranslations(await window.loadTranslations('home', lang), document);
        return;
    }

    slidesContainer.innerHTML = products.map(product => createSlide(product)).join('');
    indicatorsContainer.innerHTML = products.map((_, index) => `
        <div class="indicator ${index === 0 ? 'active' : ''}" data-index="${index}"></div>
    `).join('');

    console.log('Applying translations for slider');
    window.applyTranslations && window.applyTranslations(await window.loadTranslations('home', lang), document);

    let currentSlide = 0;
    const slides = document.querySelectorAll('.slide');
    const indicators = document.querySelectorAll('.indicator');
    const totalSlides = slides.length;

    function showSlide(index) {
        if (index >= totalSlides) currentSlide = 0;
        else if (index < 0) currentSlide = totalSlides - 1;
        else currentSlide = index;

        slides.forEach((slide, i) => {
            slide.style.transform = `translateX(-${currentSlide * 100}%)`;
        });

        indicators.forEach((indicator, i) => {
            indicator.classList.toggle('active', i === currentSlide);
        });
    }

    setInterval(() => {
        showSlide(currentSlide + 1);
    }, 5000);

    indicators.forEach(indicator => {
        indicator.addEventListener('click', () => {
            showSlide(Number(indicator.dataset.index));
        });
    });

    showSlide(currentSlide);
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded: Initializing slider');
    window.initSlider();
});