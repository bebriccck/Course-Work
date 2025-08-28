const API_URL = 'http://localhost:3000';
const EXCHANGE_RATE = 80;

async function fetchFavoriteItems(userId) {
    try {
        const response = await fetch(`${API_URL}/favorites?userId=${userId}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const favoriteItems = await response.json();
        console.log('Favorite items:', favoriteItems);
        const productIds = favoriteItems.map(item => item.productId).filter(id => id);
        if (productIds.length === 0) return [];

        const productsResponse = await fetch(`${API_URL}/products?id_in=${productIds.join(',')}`);
        if (!productsResponse.ok) {
            throw new Error(`HTTP error! status: ${productsResponse.status}`);
        }
        const products = await productsResponse.json();
        console.log('Products:', products);

        const reviewsResponse = await fetch(`${API_URL}/reviews?productId_in=${productIds.join(',')}`);
        if (!reviewsResponse.ok) {
            throw new Error(`HTTP error! status: ${reviewsResponse.status}`);
        }
        const reviews = await reviewsResponse.json();

        return favoriteItems.map(favoriteItem => {
            const product = products.find(p => p.id === favoriteItem.productId) || {};
            const productReviews = reviews.filter(r => r.productId === favoriteItem.productId);
            const rating = productReviews.length > 0 
                ? (productReviews.reduce((sum, review) => sum + review.rating, 0) / productReviews.length).toFixed(1)
                : 0;
            return {
                ...favoriteItem,
                product: { ...product, rating }
            };
        }).filter(item => item.product && item.product.id);
    } catch (error) {
        console.error('Error fetching favorite items:', error);
        return [];
    }
}

async function removeFromFavorites(favoriteId) {
    try {
        const response = await fetch(`${API_URL}/favorites/${favoriteId}`, {
            method: 'DELETE'
        });
        if (!response.ok) {
            throw new Error('Failed to remove from favorites');
        }
        window.renderFavorites();
        alert(localStorage.getItem('lang') === 'ru' ? 'Удалено из избранного!' : 'Removed from favorites!');
    } catch (error) {
        console.error('Error removing from favorites:', error);
        alert(localStorage.getItem('lang') === 'ru' ? 'Ошибка удаления из избранного' : 'Failed to remove from favorites');
    }
}

async function addToCart(productId) {
    const userId = localStorage.getItem('userId');
    if (!userId) {
        window.location.href = '../login/index.html';
        return;
    }
    try {
        const responseCheck = await fetch(`${API_URL}/cart?userId=${userId}&productId=${productId}`);
        const existingCartItems = await responseCheck.json();
        if (existingCartItems.length > 0) {
            alert(localStorage.getItem('lang') === 'ru' ? 'Этот товар уже в корзине!' : 'This product is already in your cart!');
            return;
        }

        const response = await fetch(`${API_URL}/cart`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: Number(userId), productId: Number(productId), quantity: 1 })
        });
        if (response.ok) {
            alert(localStorage.getItem('lang') === 'ru' ? 'Добавлено в корзину!' : 'Added to cart!');
        } else {
            throw new Error('Failed to add to cart');
        }
    } catch (error) {
        console.error('Error adding to cart:', error);
        alert(localStorage.getItem('lang') === 'ru' ? 'Ошибка добавления в корзину' : 'Failed to add to cart');
    }
}

window.renderFavorites = async function renderFavorites() {
    const userId = localStorage.getItem('userId');
    if (!userId) {
        window.location.href = '../login/index.html';
        return;
    }

    const lang = localStorage.getItem('lang') || 'en';
    const productGrid = document.getElementById('productGrid');
    const noFavorites = document.getElementById('noFavorites');

    if (!productGrid) console.error('Missing DOM element: productGrid');
    if (!noFavorites) console.error('Missing DOM element: noFavorites');

    if (!productGrid || !noFavorites) {
        console.error('One or more required DOM elements are missing, retrying in 100ms');
        setTimeout(window.renderFavorites, 100);
        return;
    }

    const favoriteItems = await fetchFavoriteItems(userId);
    if (favoriteItems.length === 0) {
        noFavorites.style.display = 'block';
        productGrid.innerHTML = '';
        window.applyTranslations && window.applyTranslations(await window.loadTranslations('favorites', lang), document);
        return;
    }

    noFavorites.style.display = 'none';

    productGrid.innerHTML = favoriteItems.map(item => {
        const currentDate = new Date();
        const discountEndDate = item.product.discountEndDate ? new Date(item.product.discountEndDate) : null;
        const isDiscountValid = item.product.discount > 0 && item.product.discount < 100 && (!discountEndDate || currentDate <= discountEndDate);
        const effectivePrice = isDiscountValid
            ? item.product.price * (100 - item.product.discount) / 100
            : item.product.price;
        const displayPrice = lang === 'ru' ? (effectivePrice * EXCHANGE_RATE).toFixed(2) : effectivePrice.toFixed(2);
        let priceDisplay = `<span class="price">${lang === 'ru' ? '₽' : '$'}${displayPrice}</span>`;
        let discountEndDateDisplay = '';
        if (isDiscountValid) {
            const originalPrice = lang === 'ru' ? (item.product.price * EXCHANGE_RATE).toFixed(2) : item.product.price.toFixed(2);
            priceDisplay = `
                <div class="prices">
                    <span class="new-price">${lang === 'ru' ? '₽' : '$'}${displayPrice}</span>
                    <span class="old-price">${lang === 'ru' ? '₽' : '$'}${originalPrice}</span>
                </div>
                <span class="discount-label">${item.product.discount}% ${lang === 'ru' ? 'СКИДКА' : 'OFF'}</span>
            `;
            if (discountEndDate) {
                discountEndDateDisplay = `<span data-i18n="discount_end_date">${
                    lang === 'ru'
                        ? `Скидка до: ${discountEndDate.toLocaleDateString('ru-RU', { day: '2-digit', month: 'short', year: 'numeric' })}`
                        : `Discount valid until: ${discountEndDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`
                }</span>`;
            }
        }
        const name = lang === 'ru' ? item.product.ru_name || item.product.name : item.product.name;
        const description = lang === 'ru' ? item.product.ru_description || item.product.description : item.product.description;
        const ratingDisplay = item.product.rating !== undefined && item.product.rating > 0 
            ? `<i class="fas fa-star"></i> ${item.product.rating}` 
            : '<i class="fas fa-star"></i> 0';
        return `
            <div class="product-card">
                <div class="product-image">
                    <a href="../product/index.html?id=${item.productId}">
                        <img src="../img/shop/${item.productId}.png" alt="${name || 'Product'}">
                    </a>
                    <div class="product-actions">
                        <button class="favorite-btn filled" data-favorite-id="${item.id}">
                            <i class="fas fa-heart"></i>
                        </button>
                        <button class="cart-btn" data-id="${item.productId}">
                            <i class="fas fa-shopping-cart"></i>
                        </button>
                    </div>
                </div>
                <div class="product-info">
                    <h3><a href="../product/index.html?id=${item.productId}">${name || 'Unknown Product'}</a></h3>
                    <p class="description">${description || ''}</p>
                    <div class="product-meta">
                        <div class="price-container">${priceDisplay}</div>
                        <p class="discount-end-date">${discountEndDateDisplay}</p>
                        <span class="rating">${ratingDisplay}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    document.querySelectorAll('.favorite-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const favoriteId = e.target.closest('.favorite-btn').dataset.favoriteId;
            removeFromFavorites(favoriteId);
        });
    });

    document.querySelectorAll('.cart-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const productId = e.target.closest('.cart-btn').dataset.id;
            addToCart(productId);
        });
    });

    window.applyTranslations && window.applyTranslations(await window.loadTranslations('favorites', lang), document);
}

document.addEventListener('DOMContentLoaded', () => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
        window.location.href = '../login/index.html';
        return;
    }

    window.renderFavorites();
});