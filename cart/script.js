const API_URL = 'http://localhost:3000';
const EXCHANGE_RATE = 80;

async function fetchCartItems(userId) {
    try {
        const response = await fetch(`${API_URL}/cart?userId=${userId}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const cartItems = await response.json();
        console.log('Cart items:', cartItems);
        if (!cartItems.length) return [];
        const productIds = cartItems.map(item => item.productId).filter(id => id);
        if (!productIds.length) return [];
        const productsResponse = await fetch(`${API_URL}/products?id_in=${productIds.join(',')}`);
        if (!productsResponse.ok) {
            throw new Error(`HTTP error! status: ${productsResponse.status}`);
        }
        const products = await productsResponse.json();
        console.log('Products:', products);
        return cartItems.map(cartItem => ({
            ...cartItem,
            product: products.find(p => p.id === cartItem.productId) || {}
        })).filter(item => item.product && item.product.id);
    } catch (error) {
        console.error('Error fetching cart items:', error);
        return [];
    }
}

async function updateCartItemQuantity(cartId, quantity) {
    try {
        const response = await fetch(`${API_URL}/cart/${cartId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ quantity: Number(quantity) })
        });
        if (!response.ok) {
            throw new Error('Failed to update quantity');
        }
        window.renderCart();
    } catch (error) {
        console.error('Error updating quantity:', error);
        alert(localStorage.getItem('lang') === 'ru' ? 'Ошибка обновления количества' : 'Failed to update quantity');
    }
}

async function removeCartItem(cartId) {
    try {
        const response = await fetch(`${API_URL}/cart/${cartId}`, {
            method: 'DELETE'
        });
        if (!response.ok) {
            throw new Error('Failed to remove item');
        }
        window.renderCart();
    } catch (error) {
        console.error('Error removing item:', error);
        alert(localStorage.getItem('lang') === 'ru' ? 'Ошибка удаления товара' : 'Failed to remove item');
    }
}

async function checkout(userId) {
    try {
        const cartItems = await fetchCartItems(userId);
        if (cartItems.length === 0) {
            alert(localStorage.getItem('lang') === 'ru' ? 'Ваша корзина пуста!' : 'Your cart is empty!');
            return;
        }

        const lang = localStorage.getItem('lang') || 'en';
        const currentDate = new Date();
        const order = {
            userId: Number(userId),
            date: new Date().toISOString(),
            items: cartItems.map(item => {
                const discountEndDate = item.product.discountEndDate ? new Date(item.product.discountEndDate) : null;
                const isDiscountValid = item.product.discount > 0 && item.product.discount < 100 && (!discountEndDate || currentDate <= discountEndDate);
                const effectivePrice = isDiscountValid
                    ? item.product.price * (100 - item.product.discount) / 100
                    : item.product.price;
                return {
                    productId: item.productId,
                    quantity: item.quantity || 1,
                    price: lang === 'ru' ? (effectivePrice * EXCHANGE_RATE).toFixed(2) : effectivePrice.toFixed(2)
                };
            })
        };

        const orderResponse = await fetch(`${API_URL}/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(order)
        });
        if (!orderResponse.ok) {
            throw new Error('Failed to create order');
        }

        for (const item of cartItems) {
            const response = await fetch(`${API_URL}/cart/${item.id}`, {
                method: 'DELETE'
            });
            if (!response.ok) {
                throw new Error(`Failed to remove cart item ${item.id}`);
            }
        }

        alert(localStorage.getItem('lang') === 'ru' ? 'Покупка успешно завершена! Корзина очищена.' : 'Purchase successful! Your cart has been cleared.');
        window.renderCart();
    } catch (error) {
        console.error('Error during checkout:', error);
        alert(localStorage.getItem('lang') === 'ru' ? 'Ошибка обработки покупки' : 'Failed to process purchase');
    }
}

window.renderCart = async function renderCart() {
    const userId = localStorage.getItem('userId');
    if (!userId) {
        window.location.href = '../login/index.html';
        return;
    }

    const lang = localStorage.getItem('lang') || 'en';
    const cartItemsContainer = document.getElementById('cartItems');
    const noItems = document.getElementById('noItems');
    const totalPriceElement = document.getElementById('totalPrice');
    const totalItemsElement = document.getElementById('totalItems');
    const checkoutBtn = document.getElementById('checkoutBtn');

    if (!cartItemsContainer) console.error('Missing DOM element: cartItems');
    if (!noItems) console.error('Missing DOM element: noItems');
    if (!totalPriceElement) console.error('Missing DOM element: totalPrice');
    if (!totalItemsElement) console.error('Missing DOM element: totalItems');
    if (!checkoutBtn) console.error('Missing DOM element: checkoutBtn');

    if (!cartItemsContainer || !noItems || !totalPriceElement || !totalItemsElement || !checkoutBtn) {
        console.error('One or more required DOM elements are missing, retrying in 100ms');
        setTimeout(window.renderCart, 100);
        return;
    }

    const cartItems = await fetchCartItems(userId);
    if (cartItems.length === 0) {
        noItems.style.display = 'block';
        cartItemsContainer.innerHTML = '';
        totalPriceElement.textContent = lang === 'ru' ? '₽0.00' : '$0.00';
        totalItemsElement.setAttribute('data-i18n', 'total_items');
        checkoutBtn.disabled = true;
        window.applyTranslations && window.applyTranslations(await window.loadTranslations('cart', lang), document);
        return;
    }

    noItems.style.display = 'none';
    checkoutBtn.disabled = false;

    let totalPrice = 0;
    let totalItemsCount = 0;
    const currentDate = new Date();

    cartItemsContainer.innerHTML = cartItems.map(item => {
        const quantity = item.quantity || 1;
        totalItemsCount += quantity;
        const discountEndDate = item.product.discountEndDate ? new Date(item.product.discountEndDate) : null;
        const isDiscountValid = item.product.discount > 0 && item.product.discount < 100 && (!discountEndDate || currentDate <= discountEndDate);
        const effectivePrice = isDiscountValid
            ? item.product.price * (100 - item.product.discount) / 100
            : item.product.price;
        const displayPrice = lang === 'ru' ? (effectivePrice * EXCHANGE_RATE).toFixed(2) : effectivePrice.toFixed(2);
        const itemTotal = lang === 'ru' ? (effectivePrice * quantity * EXCHANGE_RATE).toFixed(2) : (effectivePrice * quantity).toFixed(2);
        totalPrice += Number(itemTotal);
        let priceDisplay = `<span class="price">${lang === 'ru' ? '₽' : '$'}${displayPrice} x ${quantity} = ${lang === 'ru' ? '₽' : '$'}${itemTotal}</span>`;
        let discountEndDateDisplay = '';
        if (isDiscountValid) {
            const originalPrice = lang === 'ru' ? (item.product.price * EXCHANGE_RATE).toFixed(2) : item.product.price.toFixed(2);
            priceDisplay = `
                <div class="price-container">
                    <div class="prices">
                        <span class="new-price">${lang === 'ru' ? '₽' : '$'}${displayPrice}</span>
                        <span class="old-price">${lang === 'ru' ? '₽' : '$'}${originalPrice}</span>
                    </div>
                    <span class="item-total">x ${quantity} = ${lang === 'ru' ? '₽' : '$'}${itemTotal}</span>
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
        const name = lang === 'ru' ? item.product.ru_name || item.product.name : item.product.name;
        const description = lang === 'ru' ? item.product.ru_description || item.product.description : item.product.description;
        return `
            <div class="cart-item">
                <a href="../product/index.html?id=${item.productId}">
                    <img src="../img/shop/${item.productId}.png" alt="${name || 'Product'}">
                </a>
                <div class="cart-item-info">
                    <h3><a href="../product/index.html?id=${item.productId}">${name || 'Unknown Product'}</a></h3>
                    <p class="description">${description || ''}</p>
                    ${priceDisplay}
                    <p class="discount-end-date">${discountEndDateDisplay}</p>
                </div>
                <div class="cart-item-controls">
                    <input type="number" min="1" value="${quantity}" data-id="${item.id}">
                    <button class="remove-btn" data-id="${item.id}">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');

    totalItemsElement.textContent = lang === 'ru' ? `Всего товаров: ${totalItemsCount}` : `Total items: ${totalItemsCount}`;
    totalItemsElement.setAttribute('data-i18n', 'total_items');
    totalPriceElement.textContent = lang === 'ru' ? `₽${totalPrice.toFixed(2)}` : `$${totalPrice.toFixed(2)}`;
    window.applyTranslations && window.applyTranslations(await window.loadTranslations('cart', lang), document);

    document.querySelectorAll('.cart-item-controls input').forEach(input => {
        input.addEventListener('change', (e) => {
            const cartId = e.target.dataset.id;
            const quantity = e.target.value;
            if (quantity < 1) {
                e.target.value = 1;
                return;
            }
            updateCartItemQuantity(cartId, quantity);
        });
    });

    document.querySelectorAll('.remove-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const cartId = e.target.closest('.remove-btn').dataset.id;
            removeCartItem(cartId);
        });
    });
}

document.addEventListener('DOMContentLoaded', () => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
        window.location.href = '../login/index.html';
        return;
    }

    window.renderCart();
});