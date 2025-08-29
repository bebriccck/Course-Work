const API_URL = 'http://localhost:3000';
const EXCHANGE_RATE = 80;

async function fetchProduct(productId) {
    try {
        const response = await fetch(`${API_URL}/products/${productId}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const product = await response.json();
        const reviewsResponse = await fetch(`${API_URL}/reviews?productId=${productId}`);
        if (!reviewsResponse.ok) throw new Error(`HTTP error! status: ${reviewsResponse.status}`);
        const reviews = await reviewsResponse.json();
        const rating = reviews.length > 0
            ? (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1)
            : 0;
        return { ...product, rating };
    } catch (error) {
        console.error('Error fetching product:', error);
        return null;
    }
}

async function fetchReviews(productId) {
    try {
        const response = await fetch(`${API_URL}/reviews?productId=${productId}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const reviews = await response.json();
        const userIds = reviews.map(review => review.userId);
        if (userIds.length === 0) return [];
        const usersResponse = await fetch(`${API_URL}/users?id_in=${userIds.join(',')}`);
        if (!usersResponse.ok) throw new Error(`HTTP error! status: ${usersResponse.status}`);
        const users = await usersResponse.json();
        return reviews.map(review => ({
            ...review,
            user: users.find(u => u.id === review.userId) || { nickname: localStorage.getItem('lang') === 'ru' ? 'Неизвестный' : 'Unknown' }
        }));
    } catch (error) {
        console.error('Error fetching reviews:', error);
        return [];
    }
}

async function hasPurchasedProduct(userId, productId) {
    try {
        const response = await fetch(`${API_URL}/orders?userId=${userId}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const orders = await response.json();
        return orders.some(order => order.items.some(item => item.productId === Number(productId)));
    } catch (error) {
        console.error('Error checking purchase:', error);
        return false;
    }
}

async function hasReviewedProduct(userId, productId) {
    try {
        const response = await fetch(`${API_URL}/reviews?userId=${userId}&productId=${productId}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const reviews = await response.json();
        return reviews.length > 0 ? reviews[0] : null;
    } catch (error) {
        console.error('Error checking review:', error);
        return null;
    }
}

async function addToCart(productId) {
    const userId = localStorage.getItem('userId');
    const lang = localStorage.getItem('lang') || 'en';
    const translations = await window.loadTranslations('product');
    if (!userId) {
        window.location.href = '../login/index.html';
        return;
    }
    try {
        const responseCheck = await fetch(`${API_URL}/cart?userId=${userId}&productId=${productId}`);
        const existingCartItems = await responseCheck.json();
        if (existingCartItems.length > 0) {
            alert(translations['product.cart_already_added'] || (lang === 'ru' ? 'Этот товар уже в вашей корзине!' : 'This product is already in your cart!'));
            return;
        }
        const response = await fetch(`${API_URL}/cart`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: Number(userId), productId: Number(productId), quantity: 1 })
        });
        if (response.ok) {
            alert(translations['product.cart_added'] || (lang === 'ru' ? 'Добавлено в корзину!' : 'Added to cart!'));
        } else {
            throw new Error('Failed to add to cart');
        }
    } catch (error) {
        console.error('Error adding to cart:', error);
        alert(translations['product.cart_error'] || (lang === 'ru' ? 'Ошибка добавления в корзину' : 'Failed to add to cart'));
    }
}

async function toggleFavorite(productId, favoriteBtn) {
    const userId = localStorage.getItem('userId');
    const lang = localStorage.getItem('lang') || 'en';
    const translations = await window.loadTranslations('product');
    if (!userId) {
        window.location.href = '../login/index.html';
        return;
    }
    try {
        const responseCheck = await fetch(`${API_URL}/favorites?userId=${userId}&productId=${productId}`);
        const existingFavorites = await responseCheck.json();
        if (existingFavorites.length > 0) {
            const response = await fetch(`${API_URL}/favorites/${existingFavorites[0].id}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('Failed to remove from favorites');
            favoriteBtn.classList.remove('filled');
            favoriteBtn.innerHTML = '<i class="far fa-heart"></i>';
            favoriteBtn.setAttribute('data-i18n', 'product.add_to_favorites');
            alert(translations['product.favorites_removed'] || (lang === 'ru' ? 'Удалено из избранного!' : 'Removed from favorites!'));
        } else {
            const response = await fetch(`${API_URL}/favorites`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: Number(userId), productId: Number(productId) })
            });
            if (!response.ok) throw new Error('Failed to add to favorites');
            favoriteBtn.classList.add('filled');
            favoriteBtn.innerHTML = '<i class="fas fa-heart"></i>';
            favoriteBtn.setAttribute('data-i18n', 'product.remove_from_favorites');
            alert(translations['product.favorites_added'] || (lang === 'ru' ? 'Добавлено в избранное!' : 'Added to favorites!'));
        }
        await window.reapplyTranslations('product');
    } catch (error) {
        console.error('Error toggling favorite:', error);
        alert(translations['product.favorites_error'] || (lang === 'ru' ? 'Ошибка обновления избранного' : 'Failed to update favorites'));
    }
}

async function submitReview(productId, text, rating) {
    const userId = localStorage.getItem('userId');
    const lang = localStorage.getItem('lang') || 'en';
    const translations = await window.loadTranslations('product');
    try {
        const response = await fetch(`${API_URL}/reviews`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: Number(userId),
                productId: Number(productId),
                text,
                rating: Number(rating),
                date: new Date().toISOString()
            })
        });
        if (!response.ok) throw new Error('Failed to submit review');
        alert(translations['product.review_submitted'] || (lang === 'ru' ? 'Отзыв успешно отправлен!' : 'Review submitted successfully!'));
        renderProductPage();
    } catch (error) {
        console.error('Error submitting review:', error);
        alert(translations['product.review_error'] || (lang === 'ru' ? 'Ошибка отправки отзыва' : 'Failed to submit review'));
    }
}

async function editReview(reviewId, text, rating) {
    const lang = localStorage.getItem('lang') || 'en';
    const translations = await window.loadTranslations('product');
    try {
        const response = await fetch(`${API_URL}/reviews/${reviewId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                text,
                rating: Number(rating),
                date: new Date().toISOString()
            })
        });
        if (!response.ok) throw new Error('Failed to edit review');
        alert(translations['product.review_updated'] || (lang === 'ru' ? 'Отзыв успешно обновлен!' : 'Review updated successfully!'));
        renderProductPage();
    } catch (error) {
        console.error('Error editing review:', error);
        alert(translations['product.review_edit_error'] || (lang === 'ru' ? 'Ошибка редактирования отзыва' : 'Failed to edit review'));
    }
}

async function deleteReview(reviewId, productId) {
    const lang = localStorage.getItem('lang') || 'en';
    const translations = await window.loadTranslations('product');
    try {
        const response = await fetch(`${API_URL}/reviews/${reviewId}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Failed to delete review');
        alert(translations['product.review_deleted'] || (lang === 'ru' ? 'Отзыв успешно удален!' : 'Review deleted successfully!'));
        renderProductPage();
    } catch (error) {
        console.error('Error deleting review:', error);
        alert(translations['product.review_delete_error'] || (lang === 'ru' ? 'Ошибка удаления отзыва' : 'Failed to delete review'));
    }
}

async function renderProductPage() {
    const userId = localStorage.getItem('userId');
    const role = localStorage.getItem('role');
    const lang = localStorage.getItem('lang') || 'en';
    const translations = await window.loadTranslations('product');
    if (!userId) {
        window.location.href = '../login/index.html';
        return;
    }

    const params = new URLSearchParams(window.location.search);
    const productId = params.get('id');
    if (!productId) {
        document.querySelector('.content').innerHTML = `<p data-i18n="product.not_found">${translations['product.not_found'] || 'Product not found.'}</p>`;
        await window.reapplyTranslations('product');
        return;
    }

    const product = await fetchProduct(productId);
    if (!product) {
        document.querySelector('.content').innerHTML = `<p data-i18n="product.not_found">${translations['product.not_found'] || 'Product not found.'}</p>`;
        await window.reapplyTranslations('product');
        return;
    }

    document.getElementById('productImage').src = `../img/shop/${productId}.png`;
    document.getElementById('productImage').alt = lang === 'ru' ? product.ru_name || product.name : product.name || 'Product';
    document.getElementById('productName').textContent = lang === 'ru' ? product.ru_name || product.name : product.name || 'Unknown Product';
    document.getElementById('productDescription').textContent = lang === 'ru' ? product.ru_description || product.description : product.description || '';

    const currentDate = new Date();
    const discountEndDate = product.discountEndDate ? new Date(product.discountEndDate) : null;
    const isDiscountValid = product.discount > 0 && product.discount < 100 && (!discountEndDate || currentDate <= discountEndDate);
    const currencySymbol = lang === 'ru' ? '₽' : '$';
    const displayPrice = lang === 'ru' ? (product.price * EXCHANGE_RATE).toFixed(2) : product.price?.toFixed(2) || '0.00';
    let priceDisplay = `<span class="price">${currencySymbol}${displayPrice}</span>`;
    let discountEndDateDisplay = '';
    if (isDiscountValid) {
        const discountedPrice = lang === 'ru' ? ((product.price * (100 - product.discount) / 100) * EXCHANGE_RATE).toFixed(2) : (product.price * (100 - product.discount) / 100).toFixed(2);
        priceDisplay = `
            <div class="prices">
                <span class="new-price">${currencySymbol}${discountedPrice}</span>
                <span class="old-price">${currencySymbol}${displayPrice}</span>
            </div>
            <span class="discount-label">${product.discount}% ${lang === 'ru' ? 'СКИДКА' : 'OFF'}</span>
        `;
        if (discountEndDate) {
            discountEndDateDisplay = translations['product.discount_end_date'].replace('{date}', discountEndDate.toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            }));
        }
    }
    document.getElementById('productPrice').innerHTML = priceDisplay;
    document.getElementById('discountEndDate').textContent = discountEndDateDisplay;

    document.getElementById('productRating').innerHTML = `<i class="fas fa-star"></i> ${product.rating || '0'}`;

    const favoriteBtn = document.getElementById('favoriteBtn');
    const responseCheck = await fetch(`${API_URL}/favorites?userId=${userId}&productId=${productId}`);
    const existingFavorites = await responseCheck.json();
    if (existingFavorites.length > 0) {
        favoriteBtn.classList.add('filled');
        favoriteBtn.innerHTML = '<i class="fas fa-heart"></i>';
        favoriteBtn.setAttribute('data-i18n', 'product.remove_from_favorites');
    } else {
        favoriteBtn.classList.remove('filled');
        favoriteBtn.innerHTML = '<i class="far fa-heart"></i>';
        favoriteBtn.setAttribute('data-i18n', 'product.add_to_favorites');
    }

    const reviews = await fetchReviews(productId);
    const reviewsList = document.getElementById('reviewsList');
    if (reviews.length === 0) {
        reviewsList.innerHTML = `<p data-i18n="product.no_reviews">${translations['product.no_reviews'] || 'No reviews yet.'}</p>`;
    } else {
        reviewsList.innerHTML = reviews.map(review => `
            <div class="review-item">
                <div class="review-header">
                    <span class="user">${review.user.nickname || (lang === 'ru' ? 'Неизвестный' : 'Unknown')}</span>
                    <span class="date">${new Date(review.date).toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-GB')}</span>
                </div>
                <div class="review-rating">
                    ${'<i class="fas fa-star"></i>'.repeat(review.rating)}
                    ${'<i class="far fa-star"></i>'.repeat(5 - review.rating)}
                </div>
                <p class="review-text">${review.text}</p>
                ${review.userId === Number(userId) ? `
                    <div class="review-actions">
                        <button class="edit-btn" data-review-id="${review.id}" data-text="${review.text}" data-rating="${review.rating}" data-i18n="product.edit_button">Edit</button>
                        <button class="delete-btn" data-review-id="${review.id}" data-i18n="product.delete_button">Delete</button>
                    </div>
                ` : ''}
            </div>
        `).join('');
    }

    const reviewForm = document.getElementById('reviewForm');
    const reviewText = document.getElementById('reviewText');
    const submitReviewBtn = document.getElementById('submitReviewBtn');
    const reviewMessage = document.getElementById('reviewMessage');
    const ratingSelect = document.getElementById('ratingSelect');
    let selectedRating = 0;
    let isEditing = false;
    let editingReviewId = null;

    if (role === 'admin') {
        reviewForm.style.display = 'none';
        reviewMessage.style.display = 'block';
        reviewMessage.setAttribute('data-i18n', 'product.admin_cannot_review');
        reviewMessage.textContent = translations['product.admin_cannot_review'] || (lang === 'ru' ? 'Администраторы не могут оставлять или редактировать отзывы.' : 'Administrators cannot leave or edit reviews.');
        await window.reapplyTranslations('product');
        document.getElementById('productCategory').textContent = translations['product.category'].replace('{category}', lang === 'ru' ? product.ru_category || product.category || 'N/A' : product.category || 'N/A');
        return;
    }

    const hasPurchased = await hasPurchasedProduct(userId, productId);
    const existingReview = await hasReviewedProduct(userId, productId);

    if (!hasPurchased) {
        reviewForm.style.display = 'none';
        reviewMessage.style.display = 'block';
        reviewMessage.setAttribute('data-i18n', 'product.must_purchase');
        reviewMessage.textContent = translations['product.must_purchase'] || (lang === 'ru' ? 'Вы можете оставить отзыв только после покупки этого товара.' : 'You can only leave a review after purchasing this product.');
        await window.reapplyTranslations('product');
        document.getElementById('productCategory').textContent = translations['product.category'].replace('{category}', lang === 'ru' ? product.ru_category || product.category || 'N/A' : product.category || 'N/A');
        return;
    }

    if (existingReview && !isEditing) {
        reviewForm.style.display = 'none';
        reviewMessage.style.display = 'block';
        reviewMessage.setAttribute('data-i18n', 'product.already_reviewed');
        reviewMessage.textContent = translations['product.already_reviewed'] || (lang === 'ru' ? 'Вы уже оставили отзыв для этого товара.' : 'You have already submitted a review for this product.');
        await window.reapplyTranslations('product');
        document.getElementById('productCategory').textContent = translations['product.category'].replace('{category}', lang === 'ru' ? product.ru_category || product.category || 'N/A' : product.category || 'N/A');
    } else {
        reviewForm.style.display = 'block';
        reviewMessage.style.display = 'none';
        document.getElementById('productCategory').textContent = translations['product.category'].replace('{category}', lang === 'ru' ? product.ru_category || product.category || 'N/A' : product.category || 'N/A');
        await window.reapplyTranslations('product');
    }

    const updateRatingDisplay = () => {
        ratingSelect.querySelectorAll('i').forEach((star, index) => {
            star.className = index < selectedRating ? 'fas fa-star' : 'far fa-star';
        });
        submitReviewBtn.disabled = reviewText.value.length < 10 || selectedRating === 0;
    };

    ratingSelect.querySelectorAll('i').forEach(star => {
        star.addEventListener('click', () => {
            selectedRating = Number(star.dataset.value);
            updateRatingDisplay();
        });
    });

    reviewText.addEventListener('input', updateRatingDisplay);

    submitReviewBtn.addEventListener('click', () => {
        if (reviewText.value.length >= 10 && selectedRating > 0) {
            if (isEditing) {
                editReview(editingReviewId, reviewText.value, selectedRating);
            } else {
                submitReview(productId, reviewText.value, selectedRating);
            }
        }
    });

    const formActions = document.querySelector('.form-actions');
    const cancelBtn = document.createElement('button');
    cancelBtn.classList.add('cancel-btn');
    cancelBtn.setAttribute('data-i18n', 'product.cancel_review');
    formActions.appendChild(cancelBtn);

    cancelBtn.addEventListener('click', () => {
        isEditing = false;
        editingReviewId = null;
        reviewText.value = '';
        selectedRating = 0;
        updateRatingDisplay();
        submitReviewBtn.setAttribute('data-i18n', 'product.submit_review');
        cancelBtn.style.display = 'none';
        renderProductPage();
    });

    document.getElementById('cartBtn').addEventListener('click', () => addToCart(productId));
    favoriteBtn.addEventListener('click', () => toggleFavorite(productId, favoriteBtn));

    reviewsList.addEventListener('click', (e) => {
        if (e.target.classList.contains('edit-btn')) {
            isEditing = true;
            editingReviewId = e.target.dataset.reviewId;
            reviewText.value = e.target.dataset.text;
            selectedRating = Number(e.target.dataset.rating);
            updateRatingDisplay();
            submitReviewBtn.setAttribute('data-i18n', 'product.save_review');
            cancelBtn.style.display = 'block';
            reviewForm.style.display = 'block';
            reviewMessage.style.display = 'none';
            window.reapplyTranslations('product');
            document.getElementById('productCategory').textContent = translations['product.category'].replace('{category}', lang === 'ru' ? product.ru_category || product.category || 'N/A' : product.category || 'N/A');
        } else if (e.target.classList.contains('delete-btn')) {
            deleteReview(e.target.dataset.reviewId, productId);
        }
    });

    console.log('Translations for product.category:', translations['product.category']);
    console.log('Product category:', product.category, 'ru_category:', product.ru_category);
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing product page');
    window.initTranslations('product').then(() => {
        renderProductPage();
    });
});