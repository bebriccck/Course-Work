async function fetchCategories() {
    try {
        const response = await fetch(`${API_URL}/products`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const products = await response.json();
        const categories = new Set(products.map(p => p.category));
        return ['All', ...categories];
    } catch (error) {
        console.error('Ошибка загрузки категорий:', error);
        return ['All']; 
    }
}

async function renderCategories() {
    const categoryList = document.getElementById('categoryList');
    if (!categoryList) return;

    const categories = await fetchCategories();
    categoryList.innerHTML = categories.map(category => `
        <li data-category="${category === 'All' ? '' : category}">${category}</li>
    `).join('');
    categoryList.addEventListener('click', (e) => {
        if (e.target.tagName === 'LI') {
            const category = e.target.dataset.category;
            categoryList.querySelectorAll('li').forEach(li => li.classList.remove('active'));
            e.target.classList.add('active');
            window.location.href = category ? `../shop/index.html?category=${encodeURIComponent(category)}` : '../shop/index.html';
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    renderCategories();
});