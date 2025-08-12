const API_URL = 'http://localhost:3000';
const ITEMS_PER_PAGE = 12;
let currentPage = 1;
let totalItems = 0;
let selectedCategories = new Set(['']);

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

    noResults.style.display = 'none';
    productGrid.innerHTML = products.map(product => `
        <div class="product-card">
            <div class="product-image">
                <img src="../img/shop/${product.id}.png" alt="${product.name}">
                <div class="product-actions">
                    <button class="favorite-btn" data-id="${product.id}">
                        <i class="fa${product.favorite ? 's' : 'r'} fa-heart"></i>
                    </button>
                    <button class="cart-btn" data-id="${product.id}">
                        <i class="fas fa-shopping-cart"></i>
                    </button>
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
    `).join('');
}

async function addToFavorites(id) {
    try {
        const response = await fetch(`${API_URL}/favorites`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productId: id })
        });
        if (response.ok) renderProducts(getCurrentParams());
        else throw new Error('Failed to add to favorites');
    } catch (error) {
        console.error('Error adding to favorites:', error);
    }
}

async function addToCart(id) {
    try {
        const response = await fetch(`${API_URL}/cart`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ productId: id })
        });
        if (response.ok) alert('Added to cart!');
        else throw new Error('Failed to add to cart');
    } catch (error) {
        console.error('Error adding to cart:', error);
    }
}

function getCurrentParams() {
    const search = document.getElementById('searchInput').value;
    const [sort, order] = document.getElementById('sortSelect').value.split(',');
    const minPrice = document.getElementById('minPrice').value;
    const maxPrice = document.getElementById('maxPrice').value;

    const params = {};
    if (search) params.q = search;
    if (sort) {
        params._sort = sort;
        params._order = order;
    }
    if (minPrice) params.price_gte = minPrice;
    if (maxPrice) params.price_lte = maxPrice;

    return params;
}

document.addEventListener('DOMContentLoaded', () => {
    fetchCategories().then(() => {
        renderProducts();
    }).catch(error => console.error('Error on DOM load:', error));

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
            }
            if (e.target.closest('.cart-btn')) {
                const id = e.target.closest('.cart-btn').dataset.id;
                addToCart(id);
            }
        });
    }
});