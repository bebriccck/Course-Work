async function fetchSpecialOffers() {
    try {
        const response = await fetch(`${API_URL}/specialOffers`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const specialOffers = await response.json();
        const productsResponse = await fetch(`${API_URL}/products`);
        if (!productsResponse.ok) throw new Error(`HTTP error! status: ${productsResponse.status}`);
        const products = await productsResponse.json();
        const currentDate = new Date();
        
        
        if (specialOffers.length === 0) {
            return [];
        }

        const offers = specialOffers.map(offer => {
            const product = products.find(p => p.id === offer.productId);
            if (!product) return null;
            const isDiscountValid = product.discount > 0 && product.discount < 100 && 
                (!product.discountEndDate || new Date(product.discountEndDate) >= currentDate);
            return { ...offer, product, isDiscountValid };
        }).filter(offer => offer !== null);

        return offers.slice(0, 2);
    } catch (error) {
        console.error('Error fetching special offers:', error);
        return [];
    }
}

function createOffer(offer, index) {
    const { product, isDiscountValid } = offer;
    const discountedPrice = isDiscountValid ? (product.price * (100 - product.discount) / 100).toFixed(2) : null;
    const timerHtml = isDiscountValid && product.discountEndDate ? `
        <div class="time" data-end-date="${product.discountEndDate}">
            <div class="days">0 <span class="time_type">days</span></div>
            <div class="hrs">0 <span class="time_type">hours</span></div>
            <div class="min">0 <span class="time_type">minutes</span></div>
            <div class="secs">0 <span class="time_type">seconds</span></div>
        </div>
    ` : '';
    return `
        <div class="offer" data-offer-id="${offer.id || ''}" data-product-id="${product.id}">
            <div class="offer-image" style="background: url(../img/shop/${product.id}.png) no-repeat center/cover;" 
                 data-fallback="../img/shop/placeholder.png">
                <div class="offer-actions">
                    ${isAdmin() ? `
                        <button class="edit-btn" data-offer-id="${offer.id || ''}" data-product-id="${product.id}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="delete-btn" data-offer-id="${offer.id || ''}">
                            <i class="fas fa-trash"></i>
                        </button>
                    ` : ''}
                </div>
            </div>
            ${isDiscountValid ? `<div class="discount">${product.discount}% off</div>` : ''}
            <h3>${product.name}</h3>
            <p>${product.description}</p>
            <div class="price">
                ${isDiscountValid ? `
                    <p class="new">$${discountedPrice}</p>
                    <p class="old">$${product.price.toFixed(2)}</p>
                ` : `<p class="new">$${product.price.toFixed(2)}</p>`}
                <button onclick="window.location.href='../product/index.html?id=${product.id}'">Buy Now</button>
            </div>
            ${timerHtml}
        </div>
    `;
}

function updateTimer(offerElement, endDate) {
    const daysEl = offerElement.querySelector('.days');
    const hrsEl = offerElement.querySelector('.hrs');
    const minEl = offerElement.querySelector('.min');
    const secsEl = offerElement.querySelector('.secs');
    const end = new Date(endDate);
    
    function update() {
        const now = new Date();
        const diff = end - now;
        if (diff <= 0) {
            clearInterval(timerInterval);
            offerElement.querySelector('.time').style.display = 'none';
            return;
        }
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        daysEl.firstChild.nodeValue = days;
        hrsEl.firstChild.nodeValue = hours;
        minEl.firstChild.nodeValue = minutes;
        secsEl.firstChild.nodeValue = seconds;
    }
    
    update();
    const timerInterval = setInterval(update, 1000);
}

async function initSpecialOffers() {
    const offersContainer = document.querySelector('.offers');

    if (isAdmin()) {
        console.log('Admin detected, showing controls');
        document.getElementById('admin-controls').style.display = 'block';
        setupAdminControls();
    } else {
        console.log('Not admin, hiding controls');
    }

    const offers = await fetchSpecialOffers();

    if (offers.length === 0) {
        offersContainer.innerHTML = '<p>No special offers available.</p>';
        return;
    }

    offersContainer.innerHTML = offers.map((offer, index) => createOffer(offer, index)).join('');
    
    
    offersContainer.querySelectorAll('.offer-image').forEach(imageDiv => {
        const img = new Image();
        img.src = imageDiv.style.backgroundImage.slice(5, -2); 
        img.onerror = () => {
            imageDiv.style.backgroundImage = `url(${imageDiv.dataset.fallback})`;
            const fallbackImg = new Image();
            fallbackImg.src = imageDiv.dataset.fallback;
            fallbackImg.onerror = () => {
                imageDiv.style.backgroundImage = `url(https://via.placeholder.com/300x200?text=No+Image)`;
            };
        };
    });
    

    offersContainer.querySelectorAll('.time').forEach(timeEl => {
        const endDate = timeEl.dataset.endDate;
        if (endDate) {
            updateTimer(timeEl.closest('.offer'), endDate);
        }
    });
}

function isAdmin() {
    const role = localStorage.getItem('role');
    const isAdminUser = role === 'admin';
    console.log('Checking isAdmin:', { role, isAdminUser });
    return isAdminUser;
}

async function setupAdminControls() {
    const addButton = document.getElementById('add-offer');
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modal-title');
    const productSelect = document.getElementById('product-select');
    const saveButton = document.getElementById('save-offer');
    const cancelButton = document.getElementById('cancel-offer');
    const offersContainer = document.querySelector('.offers');
    
    async function populateProductSelect(selectedProductId = null) {
        try {
            const response = await fetch(`${API_URL}/products`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const products = await response.json();
            const currentDate = new Date();
            const discountedProducts = products.filter(p => 
                p.discount > 0 && p.discount < 100 && 
                (!p.discountEndDate || new Date(p.discountEndDate) >= currentDate)
            );
            productSelect.innerHTML = discountedProducts.map(product => `
                <option value="${product.id}" ${product.id === selectedProductId ? 'selected' : ''}>
                    ${product.name}
                </option>
            `).join('');
            if (discountedProducts.length === 0) {
                productSelect.innerHTML = '<option value="">No products with discount</option>';
            }
        } catch (error) {
            console.error('Error fetching products:', error);
            alert('Failed to load products');
        }
    }
    
    addButton.addEventListener('click', async () => {
        const specialOffers = await fetch(`${API_URL}/specialOffers`).then(res => res.json());
        if (specialOffers.length >= 2) {
            alert('Maximum 2 special offers allowed.');
            return;
        }
        modalTitle.textContent = 'Add Special Offer';
        await populateProductSelect();
        modal.dataset.mode = 'add';
        modal.style.display = 'block';
    });
    
    offersContainer.addEventListener('click', async (e) => {
        if (e.target.closest('.edit-btn')) {
            const offerElement = e.target.closest('.offer');
            const offerId = e.target.closest('.edit-btn').dataset.offerId;
            const productId = e.target.closest('.edit-btn').dataset.productId;
            modalTitle.textContent = 'Edit Special Offer';
            await populateProductSelect(parseInt(productId));
            modal.dataset.mode = 'edit';
            modal.dataset.offerId = offerId;
            modal.style.display = 'block';
        } else if (e.target.closest('.delete-btn')) {
            const offerId = e.target.closest('.delete-btn').dataset.offerId;
            if (offerId) {
                try {
                    await fetch(`${API_URL}/specialOffers/${offerId}`, { method: 'DELETE' });
                    initSpecialOffers();
                } catch (error) {
                    console.error('Error deleting offer:', error);
                    alert('Failed to delete offer');
                }
            }
        }
    });
    
    saveButton.addEventListener('click', async () => {
        const mode = modal.dataset.mode;
        const productId = parseInt(productSelect.value);
        if (!productId) {
            alert('Please select a product');
            return;
        }
        try {
            if (mode === 'add') {
                const response = await fetch(`${API_URL}/specialOffers`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ productId })
                });
                if (response.ok) {
                    modal.style.display = 'none';
                    initSpecialOffers();
                } else {
                    throw new Error('Failed to add offer');
                }
            } else if (mode === 'edit') {
                const offerId = modal.dataset.offerId;
                const response = await fetch(`${API_URL}/specialOffers/${offerId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ productId })
                });
                if (response.ok) {
                    modal.style.display = 'none';
                    initSpecialOffers();
                } else {
                    throw new Error('Failed to update offer');
                }
            }
        } catch (error) {
            console.error('Error saving offer:', error);
            alert('Failed to save offer');
        }
    });
    
    cancelButton.addEventListener('click', () => {
        modal.style.display = 'none';
    });
}

document.addEventListener('DOMContentLoaded', initSpecialOffers);