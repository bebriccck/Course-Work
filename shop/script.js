const API_URL = 'http://localhost:3000';
const ITEMS_PER_PAGE = 12;
let currentPage = 1;
let totalItems = 0;
let selectedCategories = new Set(['']);

function getCurrentParams() {
    const searchInput = document.getElementById('searchInput');
    const sortSelect = document.getElementById('sortSelect');
    const minPrice = document.getElementById('minPrice');
    const maxPrice = document.getElementById('maxPrice');

    const params = {};
    if (searchInput && searchInput.value) {
        params.q = searchInput.value;
    }
    if (sortSelect && sortSelect.value) {
        const [sortBy, sortOrder] = sortSelect.value.split(',');
        params._sort = sortBy;
        params._order = sortOrder;
    }
    if (minPrice && minPrice.value) {
        params['price_gte'] = minPrice.value;
    }
    if (maxPrice && maxPrice.value) {
        params['price_lte'] = maxPrice.value;
    }
    return params;
}

async function fetchProducts(params = {}) {
    const query = new URLSearchParams({
        _page: currentPage,
        _limit: ITEMS_PER_PAGE,
        ...params
    });
    if (selectedCategories.size > 0 && !selectedCategories.has('')) {
        query.delete('category');
        selectedCategories.forEach(category => query.append('category_like', category));
    }
    try {
        const response = await fetch(`${API_URL}/products?${query.toString()}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        totalItems = response.headers.get('X-Total-Count') ? Number(response.headers.get('X-Total-Count')) : data.length;
        updatePagination();
        return data;
    } catch (error) {
        console.error('Error fetching products:', error);
        return [];
    }
}

async function fetchCategories() {
    try {
        const response = await fetch(`${API_URL}/products`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const products = await response.json();
        const categories = new Set(products.map(p => p.category));
        const categoryList = document.getElementById('categoryList');
        categories.forEach(category => {
            const li = document.createElement('li');
            li.dataset.category = category;
            li.innerHTML = `${category} <i class="fas fa-check" style="display: none;"></i>`;
            categoryList.appendChild(li);
        });
    } catch (error) {
        console.error('Error fetching categories:', error);
    }
}

function updatePagination() {
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    const pageInfo = document.getElementById('pageInfo');
    const pageNumbersContainer = document.getElementById('pageNumbers');
    if (!pageInfo || !pageNumbersContainer) return;

    pageNumbersContainer.innerHTML = '';
    pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;

    if (totalPages <= 0) return;

    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage < maxVisiblePages - 1) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
        const pageButton = document.createElement('button');
        pageButton.textContent = i;
        pageButton.classList.add('page-number');
        if (i === currentPage) {
            pageButton.classList.add('active');
        }
        pageButton.addEventListener('click', () => {
            currentPage = i;
            renderProducts(getCurrentParams());
        });
        pageNumbersContainer.appendChild(pageButton);
    }

    document.getElementById('firstPage').disabled = currentPage === 1;
    document.getElementById('prevPage').disabled = currentPage === 1;
    document.getElementById('nextPage').disabled = currentPage === totalPages;
    document.getElementById('lastPage').disabled = currentPage === totalPages;
}

async function renderProducts(params = {}) {
    const products = await fetchProducts(params);
    const productGrid = document.getElementById('productGrid');
    const noResults = document.getElementById('noResults');
    if (!productGrid || !noResults) return;

    if (products.length === 0) {
        noResults.style.display = 'block';
        productGrid.innerHTML = '';
        return;
    }

    const userId = localStorage.getItem('userId');
    const role = localStorage.getItem('role');
    let favoriteItems = [];
    if (userId) {
        try {
            const response = await fetch(`${API_URL}/favorites?userId=${userId}`);
            favoriteItems = await response.json();
        } catch (error) {
            console.error('Error fetching favorites:', error);
        }
    }

    noResults.style.display = 'none';
    productGrid.innerHTML = products.map(product => {
        const isFavorite = favoriteItems.some(item => item.productId === product.id);
        const favoriteId = isFavorite ? favoriteItems.find(item => item.productId === product.id).id : '';
        let adminActions = '';
        if (role === 'admin') {
            adminActions = `
                <button class="edit-btn" data-id="${product.id}">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="delete-btn" data-id="${product.id}">
                    <i class="fas fa-trash"></i>
                </button>
            `;
        }
        return `
            <div class="product-card">
                <div class="product-image">
                    <img src="../img/shop/${product.id}.png" alt="${product.name}">
                    <div class="product-actions">
                        <button class="favorite-btn${isFavorite ? ' filled' : ''}" data-id="${product.id}" data-favorite-id="${favoriteId}">
                            <i class="fa${isFavorite ? 's' : 'r'} fa-heart"></i>
                        </button>
                        <button class="cart-btn" data-id="${product.id}">
                            <i class="fas fa-shopping-cart"></i>
                        </button>
                        ${adminActions}
                    </div>
                </div>
                <div class="product-info">
                    <h3>${product.name}</h3>
                    <p class="description">${product.description}</p>
                    <div class="product-meta">
                        <span class="price">$${product.price}</span>
                        <span class="rating"><i class="fas fa-star"></i> ${product.rating}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

async function addToFavorites(productId) {
    const userId = localStorage.getItem('userId');
    if (!userId) {
        window.location.href = '../login/index.html';
        return;
    }
    try {
        const responseCheck = await fetch(`${API_URL}/favorites?userId=${userId}&productId=${productId}`);
        const existingFavorites = await responseCheck.json();
        if (existingFavorites.length > 0) {
            const favoriteId = existingFavorites[0].id;
            const responseDelete = await fetch(`${API_URL}/favorites/${favoriteId}`, {
                method: 'DELETE'
            });
            if (responseDelete.ok) {
                renderProducts(getCurrentParams());
                alert('Removed from favorites!');
            } else {
                throw new Error('Failed to remove from favorites');
            }
        } else {
            const response = await fetch(`${API_URL}/favorites`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: Number(userId), productId: Number(productId) })
            });
            if (response.ok) {
                renderProducts(getCurrentParams());
                alert('Added to favorites!');
            } else {
                throw new Error('Failed to add to favorites');
            }
        }
    } catch (error) {
        console.error('Error managing favorites:', error);
        alert('Failed to manage favorites');
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

async function addProduct() {
    document.getElementById('modalTitle').textContent = 'Add Product';
    document.getElementById('name').value = '';
    document.getElementById('description').value = '';
    document.getElementById('price').value = '';
    document.getElementById('category').value = '';
    document.getElementById('productForm').dataset.id = '';
    document.getElementById('productModal').style.display = 'flex';
}

async function editProduct(productId) {
    try {
        const response = await fetch(`${API_URL}/products/${productId}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const product = await response.json();
        document.getElementById('modalTitle').textContent = 'Edit Product';
        document.getElementById('name').value = product.name;
        document.getElementById('description').value = product.description;
        document.getElementById('price').value = product.price;
        document.getElementById('category').value = product.category;
        document.getElementById('productForm').dataset.id = productId;
        document.getElementById('productModal').style.display = 'flex';
    } catch (error) {
        console.error('Error fetching product for edit:', error);
        alert('Failed to load product data');
    }
}

async function deleteProduct(productId) {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {

        const reviewsResponse = await fetch(`${API_URL}/reviews?productId=${productId}`);
        if (!reviewsResponse.ok) throw new Error('Failed to fetch reviews');
        const reviews = await reviewsResponse.json();
        for (const review of reviews) {
            const deleteReviewResponse = await fetch(`${API_URL}/reviews/${review.id}`, {
                method: 'DELETE'
            });
            if (!deleteReviewResponse.ok) throw new Error(`Failed to delete review ${review.id}`);
        }

        const productResponse = await fetch(`${API_URL}/products/${productId}`, {
            method: 'DELETE'
        });
        if (productResponse.ok) {
            alert('Product and associated reviews deleted successfully!');
            renderProducts(getCurrentParams());
        } else {
            throw new Error('Failed to delete product');
        }
    } catch (error) {
        console.error('Error deleting product or reviews:', error);
        alert('Failed to delete product or reviews');
    }
}

async function saveProduct(e) {
    e.preventDefault();
    const form = e.target;
    const id = form.dataset.id;
    const name = document.getElementById('name').value;
    const description = document.getElementById('description').value;
    const price = Number(document.getElementById('price').value);
    const category = document.getElementById('category').value;

    const productData = { name, description, price, category };
    if (!id) {
        productData.rating = 0; 
    }

    try {
        let response;
        if (id) {

            response = await fetch(`${API_URL}/products/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(productData)
            });
        } else {
            // Add new product
            response = await fetch(`${API_URL}/products`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(productData)
            });
        }
        if (response.ok) {
            alert(id ? 'Product updated successfully!' : 'Product added successfully!');
            renderProducts(getCurrentParams());
            closeModal();
        } else {
            throw new Error(id ? 'Failed to update product' : 'Failed to add product');
        }
    } catch (error) {
        console.error('Error saving product:', error);
        alert('Failed to save product');
    }
}

function closeModal() {
    document.getElementById('productModal').style.display = 'none';
}

document.addEventListener('DOMContentLoaded', () => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
        window.location.href = '../login/index.html';
        return;
    }

    fetchCategories().then(() => {
        renderProducts();
    }).catch(error => console.error('Error on DOM load:', error));

    const role = localStorage.getItem('role');
    if (role === 'admin') {
        document.getElementById('addProductBtn').style.display = 'block';
    }

    document.getElementById('addProductBtn').addEventListener('click', addProduct);
    document.getElementById('productForm').addEventListener('submit', saveProduct);
    document.getElementById('cancelModal').addEventListener('click', closeModal);

    const categoriesMenu = document.querySelector('.categories_menu');
    const categoriesDropdown = document.querySelector('.categories_dropdown');
    if (categoriesMenu && categoriesDropdown) {
        categoriesMenu.addEventListener('click', () => {
            categoriesDropdown.style.display = categoriesDropdown.style.display === 'none' ? 'block' : 'none';
        });
    }

    const categoryList = document.getElementById('categoryList');
    if (categoryList) {
        categoryList.addEventListener('click', (e) => {
            if (e.target.tagName === 'LI') {
                const category = e.target.dataset.category;
                const checkIcon = e.target.querySelector('i');
                
                if (category === '') {
                    selectedCategories.clear();
                    document.querySelectorAll('#categoryList i').forEach(icon => icon.style.display = 'none');
                    if (checkIcon) checkIcon.style.display = 'block';
                    selectedCategories.add('');
                } else {
                    if (selectedCategories.has('')) {
                        selectedCategories.delete('');
                        document.querySelector('[data-category=""] i').style.display = 'none';
                    }
                    if (selectedCategories.has(category)) {
                        selectedCategories.delete(category);
                        if (checkIcon) checkIcon.style.display = 'none';
                    } else {
                        selectedCategories.add(category);
                        if (checkIcon) checkIcon.style.display = 'block';
                    }
                }
                currentPage = 1;
                renderProducts(getCurrentParams());
            }
        });
    }

    const resetCategories = document.getElementById('resetCategories');
    if (resetCategories) {
        resetCategories.addEventListener('click', () => {
            selectedCategories.clear();
            selectedCategories.add('');
            document.querySelectorAll('#categoryList i').forEach(icon => icon.style.display = 'none');
            document.querySelector('[data-category=""] i').style.display = 'block';
            currentPage = 1;
            renderProducts(getCurrentParams());
        });
    }

    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            currentPage = 1;
            renderProducts(getCurrentParams());
        });
    }

    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
        sortSelect.addEventListener('change', () => {
            currentPage = 1;
            renderProducts(getCurrentParams());
        });
    }

    const applyRange = document.getElementById('applyRange');
    if (applyRange) {
        applyRange.addEventListener('click', () => {
            currentPage = 1;
            renderProducts(getCurrentParams());
        });
    }

    const firstPage = document.getElementById('firstPage');
    if (firstPage) {
        firstPage.addEventListener('click', () => {
            if (currentPage !== 1) {
                currentPage = 1;
                renderProducts(getCurrentParams());
            }
        });
    }

    const prevPage = document.getElementById('prevPage');
    if (prevPage) {
        prevPage.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                renderProducts(getCurrentParams());
            }
        });
    }

    const nextPage = document.getElementById('nextPage');
    if (nextPage) {
        nextPage.addEventListener('click', () => {
            if (currentPage < Math.ceil(totalItems / ITEMS_PER_PAGE)) {
                currentPage++;
                renderProducts(getCurrentParams());
            }
        });
    }

    const lastPage = document.getElementById('lastPage');
    if (lastPage) {
        lastPage.addEventListener('click', () => {
            const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
            if (currentPage !== totalPages) {
                currentPage = totalPages;
                renderProducts(getCurrentParams());
            }
        });
    }

    const productGrid = document.getElementById('productGrid');
    if (productGrid) {
        productGrid.addEventListener('click', (e) => {
            if (e.target.closest('.favorite-btn')) {
                const id = e.target.closest('.favorite-btn').dataset.id;
                addToFavorites(id);
            } else if (e.target.closest('.cart-btn')) {
                const id = e.target.closest('.cart-btn').dataset.id;
                addToCart(id);
            } else if (e.target.closest('.edit-btn')) {
                const id = e.target.closest('.edit-btn').dataset.id;
                editProduct(id);
            } else if (e.target.closest('.delete-btn')) {
                const id = e.target.closest('.delete-btn').dataset.id;
                deleteProduct(id);
            } else if (e.target.closest('.product-card')) {
                const id = e.target.closest('.product-card').querySelector('.cart-btn').dataset.id;
                window.location.href = `../product/index.html?id=${id}`;
            }
        });
    }
});