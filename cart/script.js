const API_URL = 'http://localhost:3000';
const EXCHANGE_RATE = 80;

async function fetchCartItems(userId) {
    try {
        console.log('Fetching cart items for userId:', userId);
        const response = await fetch(`${API_URL}/cart?userId=${userId}`);
        console.log('Cart response status:', response.status);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const cartItems = await response.json();
        console.log('Cart items:', cartItems);
        if (!cartItems.length) {
            console.log('No cart items found');
            return [];
        }
        const productIds = cartItems.map(item => item.productId).filter(id => id);
        console.log('Product IDs:', productIds);
        if (!productIds.length) {
            console.log('No valid product IDs');
            return [];
        }
        const productsResponse = await fetch(`${API_URL}/products?id_in=${productIds.join(',')}`);
        console.log('Products response status:', productsResponse.status);
        if (!productsResponse.ok) {
            throw new Error(`HTTP error! status: ${productsResponse.status}`);
        }
        const products = await productsResponse.json();
        console.log('Products:', products);
        const mappedItems = cartItems.map(cartItem => ({
            ...cartItem,
            product: products.find(p => p.id === cartItem.productId) || {}
        })).filter(item => item.product && item.product.id);
        console.log('Mapped cart items:', mappedItems);
        return mappedItems;
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
    console.log('User ID:', userId);
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
        totalItemsElement.textContent = lang === 'ru' ? 'Всего товаров: 0' : 'Total items: 0';
        totalItemsElement.setAttribute('data-i18n', 'cart.totalItems');
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
        console.log('Discount End Date for item:', item.productId, item.product.discountEndDate);
        const isDiscountValid = item.product.discount > 0 && item.product.discount < 100 && (!discountEndDate || currentDate <= discountEndDate);
        const effectivePrice = isDiscountValid
            ? item.product.price * (100 - item.product.discount) / 100
            : item.product.price;
        const displayPrice = lang === 'ru' ? (effectivePrice * EXCHANGE_RATE).toFixed(2) : effectivePrice.toFixed(2);
        const itemTotal = lang === 'ru' ? (effectivePrice * quantity * EXCHANGE_RATE).toFixed(2) : (effectivePrice * quantity).toFixed(2);
        totalPrice += Number(itemTotal);
        console.log('Item:', item.productId, 'Price:', item.product.price, 'Quantity:', quantity, 'Item Total:', itemTotal);
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
                discountEndDateDisplay = `<span data-i18n="discount_end_date" data-date="${discountEndDate.toISOString()}">${
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
    totalItemsElement.setAttribute('data-i18n', 'cart.totalItems');
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
    console.log('DOMContentLoaded fired');
    const userId = localStorage.getItem('userId');
    const userRole = localStorage.getItem('userRole');
    const checkoutBtn = document.getElementById('checkoutBtn');

    if (!userId) {
        window.location.href = '../login/index.html';
        return;
    }

    if (userRole === 'admin') {
        checkoutBtn.disabled = true;
        const warning = document.createElement('p');
        warning.textContent = localStorage.getItem('lang') === 'ru'
            ? 'Администратор не может оформить заказ'
            : 'Administrator cannot place an order';
        warning.style.color = 'red';
        warning.style.fontWeight = 'bold';
        warning.style.marginTop = '1rem';
        checkoutBtn.parentElement.appendChild(warning);

        checkoutBtn.addEventListener('click', () => {
            alert(localStorage.getItem('lang') === 'ru'
                ? 'Администратор не может оформить заказ'
                : 'Administrator cannot place an order');
        });
    } else {
        checkoutBtn.addEventListener('click', () => checkout(userId));
    }

    initTranslations('cart');
});