const API_URL = 'http://localhost:3000';

async function fetchFavoriteItems(userId) {
    try {
        const response = await fetch(`${API_URL}/favorites?userId=${userId}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const favoriteItems = await response.json();
        const productIds = favoriteItems.map(item => item.productId);
        if (productIds.length === 0) return [];

        const productsResponse = await fetch(`${API_URL}/products?id_in=${productIds.join(',')}`);
        if (!productsResponse.ok) {
            throw new Error(`HTTP error! status: ${productsResponse.status}`);
        }
        const products = await productsResponse.json();

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
        });
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
        renderFavorites();
        alert('Removed from favorites!');
    } catch (error) {
        console.error('Error removing from favorites:', error);
        alert('Failed to remove from favorites');
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
            alert('This product is already in your cart!');
            return;
        }

        const response = await fetch(`${API_URL}/cart`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: Number(userId), productId: Number(productId), quantity: 1 })
        });
        if (response.ok) {
            alert('Added to cart!');
        } else {
            throw new Error('Failed to add to cart');
        }
    } catch (error) {
        console.error('Error adding to cart:', error);
        alert('Failed to add to cart');
    }
}

async function renderFavorites() {
    const userId = localStorage.getItem('userId');
    if (!userId) {
        window.location.href = '../login/index.html';
        return;
    }

    const favoriteItems = await fetchFavoriteItems(userId);
    const productGrid = document.getElementById('productGrid');
    const noFavorites = document.getElementById('noFavorites');

    if (!productGrid || !noFavorites) return;

    if (favoriteItems.length === 0) {
        noFavorites.style.display = 'block';
        productGrid.innerHTML = '';
        return;
    }

    noFavorites.style.display = 'none';

    productGrid.innerHTML = favoriteItems.map(item => {
        const currentDate = new Date();
        const discountEndDate = item.product.discountEndDate ? new Date(item.product.discountEndDate) : null;
        const isDiscountValid = item.product.discount > 0 && item.product.discount < 100 && (!discountEndDate || currentDate <= discountEndDate);
        let priceDisplay = `<span class="price">$${item.product.price?.toFixed(2) || '0.00'}</span>`;
        let discountEndDateDisplay = '';
        if (isDiscountValid) {
            const discountedPrice = (item.product.price * (100 - item.product.discount) / 100).toFixed(2);
            priceDisplay = `
                <div class="prices">
                    <span class="new-price">$${discountedPrice}</span>
                    <span class="old-price">$${item.product.price.toFixed(2)}</span>
                </div>
                <span class="discount-label">${item.product.discount}% OFF</span>
            `;
            if (discountEndDate) {
                discountEndDateDisplay = `Discount valid until: ${discountEndDate.toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                })}`;
            }
        }
        const ratingDisplay = item.product.rating !== undefined && item.product.rating > 0 
            ? `<i class="fas fa-star"></i> ${item.product.rating}` 
            : '<i class="fas fa-star"></i> 0';
        return `
            <div class="product-card">
                <div class="product-image">
                    <a href="../product/index.html?id=${item.productId}">
                        <img src="../img/shop/${item.productId}.png" alt="${item.product.name || 'Product'}">
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
                    <h3><a href="../product/index.html?id=${item.productId}">${item.product.name || 'Unknown Product'}</a></h3>
                    <p class="description">${item.product.description || ''}</p>
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
}

document.addEventListener('DOMContentLoaded', () => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
        window.location.href = '../login/index.html';
        return;
    }

    renderFavorites();
});