const API_URL = 'http://localhost:3000';

async function fetchProduct(productId) {
    try {
        const response = await fetch(`${API_URL}/products/${productId}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
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
            user: users.find(u => u.id === review.userId) || { nickname: 'Unknown' }
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

async function toggleFavorite(productId, favoriteBtn) {
    const userId = localStorage.getItem('userId');
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
            alert('Removed from favorites!');
        } else {
            const response = await fetch(`${API_URL}/favorites`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: Number(userId), productId: Number(productId) })
            });
            if (!response.ok) throw new Error('Failed to add to favorites');
            favoriteBtn.classList.add('filled');
            favoriteBtn.innerHTML = '<i class="fas fa-heart"></i>';
            alert('Added to favorites!');
        }
    } catch (error) {
        console.error('Error toggling favorite:', error);
        alert('Failed to update favorites');
    }
}

async function updateProductRating(productId) {
    try {
        const response = await fetch(`${API_URL}/reviews?productId=${productId}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const reviews = await response.json();
        const avgRating = reviews.length > 0
            ? Number((reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1))
            : 0;
        const updateResponse = await fetch(`${API_URL}/products/${productId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rating: avgRating })
        });
        if (!updateResponse.ok) throw new Error('Failed to update product rating');
    } catch (error) {
        console.error('Error updating product rating:', error);
    }
}

async function submitReview(productId, text, rating) {
    const userId = localStorage.getItem('userId');
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
        await updateProductRating(productId);
        alert('Review submitted successfully!');
        renderProductPage();
    } catch (error) {
        console.error('Error submitting review:', error);
        alert('Failed to submit review');
    }
}

async function editReview(reviewId, text, rating) {
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
        const review = await response.json();
        await updateProductRating(review.productId);
        alert('Review updated successfully!');
        renderProductPage();
    } catch (error) {
        console.error('Error editing review:', error);
        alert('Failed to edit review');
    }
}

async function deleteReview(reviewId, productId) {
    try {
        const response = await fetch(`${API_URL}/reviews/${reviewId}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Failed to delete review');
        await updateProductRating(productId);
        alert('Review deleted successfully!');
        renderProductPage();
    } catch (error) {
        console.error('Error deleting review:', error);
        alert('Failed to delete review');
    }
}

async function renderProductPage() {
    const userId = localStorage.getItem('userId');
    const role = localStorage.getItem('role');
    if (!userId) {
        window.location.href = '../login/index.html';
        return;
    }

    const params = new URLSearchParams(window.location.search);
    const productId = params.get('id');
    if (!productId) {
        document.querySelector('.content').innerHTML = '<p>Product not found.</p>';
        return;
    }

    const product = await fetchProduct(productId);
    if (!product) {
        document.querySelector('.content').innerHTML = '<p>Product not found.</p>';
        return;
    }

    document.getElementById('productImage').src = `../img/shop/${productId}.png`;
    document.getElementById('productImage').alt = product.name || 'Product';
    document.getElementById('productName').textContent = product.name || 'Unknown Product';
    document.getElementById('productDescription').textContent = product.description || '';
    document.getElementById('productPrice').textContent = `$${product.price?.toFixed(2) || '0.00'}`;
    document.getElementById('productRating').innerHTML = `<i class="fas fa-star"></i> ${product.rating || '0'}`;
    document.getElementById('productCategory').textContent = `Category: ${product.category || 'N/A'}`;

    const favoriteBtn = document.getElementById('favoriteBtn');
    const responseCheck = await fetch(`${API_URL}/favorites?userId=${userId}&productId=${productId}`);
    const existingFavorites = await responseCheck.json();
    if (existingFavorites.length > 0) {
        favoriteBtn.classList.add('filled');
        favoriteBtn.innerHTML = '<i class="fas fa-heart"></i>';
    } else {
        favoriteBtn.classList.remove('filled');
        favoriteBtn.innerHTML = '<i class="far fa-heart"></i>';
    }

    const reviews = await fetchReviews(productId);
    const reviewsList = document.getElementById('reviewsList');
    if (reviews.length === 0) {
        reviewsList.innerHTML = '<p>No reviews yet.</p>';
    } else {
        reviewsList.innerHTML = reviews.map(review => `
            <div class="review-item">
                <div class="review-header">
                    <span class="user">${review.user.nickname || 'Unknown'}</span>
                    <span class="date">${new Date(review.date).toLocaleDateString()}</span>
                </div>
                <div class="review-rating">
                    ${'<i class="fas fa-star"></i>'.repeat(review.rating)}
                    ${'<i class="far fa-star"></i>'.repeat(5 - review.rating)}
                </div>
                <p class="review-text">${review.text}</p>
                ${review.userId === Number(userId) ? `
                    <div class="review-actions">
                        <button class="edit-btn" data-review-id="${review.id}" data-text="${review.text}" data-rating="${review.rating}">Edit</button>
                        <button class="delete-btn" data-review-id="${review.id}">Delete</button>
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
        reviewMessage.textContent = 'Administrators cannot leave or edit reviews.';
        return;
    }

    const hasPurchased = await hasPurchasedProduct(userId, productId);
    const existingReview = await hasReviewedProduct(userId, productId);

    if (!hasPurchased) {
        reviewForm.style.display = 'none';
        reviewMessage.style.display = 'block';
        reviewMessage.textContent = 'You can only leave a review after purchasing this product.';
        return;
    }

    if (existingReview && !isEditing) {
        reviewForm.style.display = 'none';
        reviewMessage.style.display = 'block';
        reviewMessage.textContent = 'You have already submitted a review for this product.';
    } else {
        reviewForm.style.display = 'block';
        reviewMessage.style.display = 'none';
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
    cancelBtn.textContent = 'Cancel';
    cancelBtn.classList.add('cancel-btn');
    cancelBtn.style.display = 'none';
    formActions.appendChild(cancelBtn);

    cancelBtn.addEventListener('click', () => {
        isEditing = false;
        editingReviewId = null;
        reviewText.value = '';
        selectedRating = 0;
        updateRatingDisplay();
        submitReviewBtn.textContent = 'Submit Review';
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
            submitReviewBtn.textContent = 'Save Review';
            cancelBtn.style.display = 'block';
            reviewForm.style.display = 'block';
            reviewMessage.style.display = 'none';
        } else if (e.target.classList.contains('delete-btn')) {
            deleteReview(e.target.dataset.reviewId, productId);
        }
    });
}

document.addEventListener('DOMContentLoaded', renderProductPage);