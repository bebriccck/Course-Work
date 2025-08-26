const API_URL = 'http://localhost:3000';

async function fetchCartItems(userId) {
    try {
        const response = await fetch(`${API_URL}/cart?userId=${userId}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const cartItems = await response.json();
        const productIds = cartItems.map(item => item.productId);
        if (productIds.length === 0) return [];
        const productsResponse = await fetch(`${API_URL}/products?id_in=${productIds.join(',')}`);
        if (!productsResponse.ok) {
            throw new Error(`HTTP error! status: ${productsResponse.status}`);
        }
        const products = await productsResponse.json();
        return cartItems.map(cartItem => ({
            ...cartItem,
            product: products.find(p => p.id === cartItem.productId) || {}
        }));
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
        renderCart();
    } catch (error) {
        console.error('Error updating quantity:', error);
        alert('Failed to update quantity');
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
        renderCart();
    } catch (error) {
        console.error('Error removing item:', error);
        alert('Failed to remove item');
    }
}

async function checkout(userId) {
    try {
        const cartItems = await fetchCartItems(userId);
        if (cartItems.length === 0) {
            alert('Your cart is empty!');
            return;
        }

        const currentDate = new Date();
        const order = {
            userId: Number(userId),
            date: new Date().toISOString(),
            items: cartItems.map(item => {
                const discountEndDate = item.product.discountEndDate ? new Date(item.product.discountEndDate) : null;
                const isDiscountValid = item.product.discount > 0 && item.product.discount < 100 && (!discountEndDate || currentDate <= discountEndDate);
                const effectivePrice = isDiscountValid
                    ? (item.product.price * (100 - item.product.discount) / 100).toFixed(2)
                    : item.product.price.toFixed(2);
                return {
                    productId: item.productId,
                    quantity: item.quantity || 1,
                    price: effectivePrice
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

        alert('Purchase successful! Your cart has been cleared.');
        renderCart();
    } catch (error) {
        console.error('Error during checkout:', error);
        alert('Failed to process purchase');
    }
}

async function renderCart() {
    const userId = localStorage.getItem('userId');
    if (!userId) {
        window.location.href = '../login/index.html';
        return;
    }

    const cartItems = await fetchCartItems(userId);
    const cartItemsContainer = document.getElementById('cartItems');
    const noItems = document.getElementById('noItems');
    const totalPriceElement = document.getElementById('totalPrice');
    const totalItemsElement = document.getElementById('totalItems');
    const checkoutBtn = document.getElementById('checkoutBtn');

    if (!cartItemsContainer || !noItems || !totalPriceElement || !totalItemsElement || !checkoutBtn) return;

    if (cartItems.length === 0) {
        noItems.style.display = 'block';
        cartItemsContainer.innerHTML = '';
        totalPriceElement.textContent = '$0.00';
        totalItemsElement.textContent = 'Total items: 0';
        checkoutBtn.disabled = true;
        return;
    }

    noItems.style.display = 'none';
    checkoutBtn.disabled = false;

    let totalPrice = 0;
    let totalItemsCount = 0;
    const currentDate = new Date();

    cartItems.forEach(item => {
        const quantity = item.quantity || 1;
        totalItemsCount += quantity;
        const discountEndDate = item.product.discountEndDate ? new Date(item.product.discountEndDate) : null;
        const isDiscountValid = item.product.discount > 0 && item.product.discount < 100 && (!discountEndDate || currentDate <= discountEndDate);
        const effectivePrice = isDiscountValid
            ? (item.product.price * (100 - item.product.discount) / 100)
            : item.product.price;
        totalPrice += effectivePrice * quantity;
    });

    totalItemsElement.textContent = `Total items: ${totalItemsCount}`;
    totalPriceElement.textContent = `$${totalPrice.toFixed(2)}`;

    cartItemsContainer.innerHTML = cartItems.map(item => {
        const quantity = item.quantity || 1;
        const discountEndDate = item.product.discountEndDate ? new Date(item.product.discountEndDate) : null;
        const isDiscountValid = item.product.discount > 0 && item.product.discount < 100 && (!discountEndDate || currentDate <= discountEndDate);
        const effectivePrice = isDiscountValid
            ? (item.product.price * (100 - item.product.discount) / 100).toFixed(2)
            : item.product.price.toFixed(2);
        const itemTotal = (effectivePrice * quantity).toFixed(2);
        let priceDisplay = `<span class="price">$${effectivePrice} x ${quantity} = $${itemTotal}</span>`;
        let discountEndDateDisplay = '';
        if (isDiscountValid) {
            priceDisplay = `
                <div class="price-container">
                    <div class="prices">
                        <span class="new-price">$${effectivePrice}</span>
                        <span class="old-price">$${item.product.price.toFixed(2)}</span>
                    </div>
                    <span class="item-total">x ${quantity} = $${itemTotal}</span>
                </div>
            `;
            if (discountEndDate) {
                discountEndDateDisplay = `Discount valid until: ${discountEndDate.toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                })}`;
            }
        }
        return `
            <div class="cart-item">
                <a href="../product/index.html?id=${item.productId}">
                    <img src="../img/shop/${item.productId}.png" alt="${item.product.name || 'Product'}">
                </a>
                <div class="cart-item-info">
                    <h3><a href="../product/index.html?id=${item.productId}">${item.product.name || 'Unknown Product'}</a></h3>
                    <p class="description">${item.product.description || ''}</p>
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

    renderCart();

    const checkoutBtn = document.getElementById('checkoutBtn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            checkout(userId);
        });
    }
});