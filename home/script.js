async function fetchCategories() {
    try {
        const response = await fetch(`${API_URL}/products`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const products = await response.json();
        const lang = localStorage.getItem('lang') || 'en';
        const categories = new Set(products.map(p => lang === 'ru' ? p.ru_category || p.category : p.category));
        console.log('Categories fetched:', categories);
        return ['All', ...categories];
    } catch (error) {
        console.error('Error fetching categories:', error);
        return ['All'];
    }
}

window.renderCategories = async function renderCategories() {
    const categoryList = document.getElementById('categoryList');
    if (!categoryList) {
        console.error('Missing DOM element: categoryList');
        setTimeout(window.renderCategories, 100);
        return;
    }

    const lang = localStorage.getItem('lang') || 'en';
    const categories = await fetchCategories();
    if (categories.length === 0) {
        console.error('No categories available');
        categoryList.innerHTML = '<li data-i18n="category_all" data-category="">All</li>';
    } else {
        categoryList.innerHTML = categories.map(category => `
            <li data-i18n="category_${category.toLowerCase().replace(/\s+/g, '_')}" data-category="${category === 'All' ? '' : category}">${category}</li>
        `).join('');
    }
    categoryList.addEventListener('click', (e) => {
        if (e.target.tagName === 'LI') {
            const category = e.target.dataset.category;
            categoryList.querySelectorAll('li').forEach(li => li.classList.remove('active'));
            e.target.classList.add('active');
            window.location.href = category ? `../shop/index.html?category=${encodeURIComponent(category)}` : '../shop/index.html';
        }
    });

    console.log('Applying translations for categories');
    window.applyTranslations && window.applyTranslations(await window.loadTranslations('home', lang), document);
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded: Initializing categories');
    window.renderCategories();
});