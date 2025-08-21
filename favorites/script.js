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
        return favoriteItems.map(favoriteItem => ({
            ...favoriteItem,
            product: products.find(p => p.id === favoriteItem.productId) || {}
        }));
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

    productGrid.innerHTML = favoriteItems.map(item => `
        <div class="product-card">
            <div class="product-image">
                <img src="../img/shop/${item.productId}.png" alt="${item.product.name || 'Product'}">
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
                <h3>${item.product.name || 'Unknown Product'}</h3>
                <p class="description">${item.product.description || ''}</p>
                <div class="product-meta">
                    <span class="price">$${item.product.price?.toFixed(2) || '0.00'}</span>
                    <span class="rating"><i class="fas fa-star"></i> ${item.product.rating || 'N/A'}</span>
                </div>
            </div>
        </div>
    `).join('');

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