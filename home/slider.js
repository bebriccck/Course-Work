async function fetchProducts() {
    try {
        const response = await fetch(`${API_URL}/products`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const products = await response.json();
        const shuffled = products.sort(() => 0.5 - Math.random());
        return shuffled.slice(0, 5);
    } catch (error) {
        console.error('Error fetching products:', error);
        return [];
    }
}

function createSlide(product) {
    return `
        <div class="slide">
            <div class="slide-content">
                <div class="slide-left">
                    <h2>${product.name}</h2>
                    <h3>We Serve Your Dream Furniture</h3>
                    <p class="price">$${product.price.toFixed(2)}</p>
                    <button onclick="window.location.href='../product/index.html?id=${product.id}'">Shop Now</button>
                </div>
                <div class="slide-right">
                    <img src="../img/shop/${product.id}.png" alt="${product.name}">
                </div>
            </div>
        </div>
    `;
}

async function initSlider() {
    const slidesContainer = document.querySelector('.slides');
    const indicatorsContainer = document.querySelector('.slider-indicators');
    const products = await fetchProducts();

    if (products.length === 0) {
        slidesContainer.innerHTML = '<p>No products available.</p>';
        return;
    }

    slidesContainer.innerHTML = products.map(product => createSlide(product)).join('');

    indicatorsContainer.innerHTML = products.map((_, index) => `
        <div class="indicator ${index === 0 ? 'active' : ''}" data-index="${index}"></div>
    `).join('');

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

document.addEventListener('DOMContentLoaded', initSlider);