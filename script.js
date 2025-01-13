
// Update Cart Counter
function updateCartCounter() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
    const cartCountElement = document.getElementById('cart-count');
    if (cartCount > 0) {
        cartCountElement.textContent = cartCount;
        cartCountElement.style.display = 'inline'; // Show badge
    } else {
        cartCountElement.style.display = 'none'; // Hide badge if cart is empty
    }
}

// Add to Cart Functionality
function addToCart(product) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];

    // Check if the item is already in the cart
    let existingProduct = cart.find(item => item.id === product.id);
    if (existingProduct) {
        existingProduct.quantity += product.quantity;
    } else {
        cart.push(product);
    }

    // Save the updated cart to localStorage
    localStorage.setItem('cart', JSON.stringify(cart));
    alert('Product added to cart!');
    updateCartCounter();
}

// Fetch Products from JSON
async function fetchProducts() {
    try {
        const response = await fetch('products.json');
        if (!response.ok) throw new Error('Failed to load products.');
        return await response.json();
    } catch (error) {
        console.error('Error loading products:', error);
        return { products: [] };
    }
}

// Initialize product-related functionalities
async function initializeProducts() {
    const productContainer = document.querySelector('#featured-products-container');
    if (!productContainer) return;

    const data = await fetchProducts();
    const products = data.products || [];

    products.forEach(product => {
        const stars = Array.from({ length: 5 }, (_, i) =>
            `<i class="bi ${i < product.rating ? 'bi-star-fill' : 'bi-star'}"></i>`
        ).join('');

        const productCard = `
            <div class="col-6 col-sm-6 col-md-6 col-lg-3">
                <a href="sproduct.html?id=${product.id}" class="product-link">
                    <div class="card">
                        <img src="${product.image}" alt="${product.name}">
                        <div class="card-body">
                            <span class="brand">${product.brand}</span>
                            <p>${product.name}</p>
                            <div class="rating">${stars}</div>
                            <span class="price">${product.price}</span>
                            <button class="add-to-cart-btn mt-3" 
                                data-id="${product.id}" 
                                data-name="${product.name}" 
                                data-price="${product.price.replace('$', '')}" 
                                data-image="${product.image}">
                                <i class="bi bi-cart3"></i>
                            </button>
                        </div>
                    </div>
                </a>
            </div>
        `;
        productContainer.innerHTML += productCard;
    });

    // Attach event listeners to "Add to Cart" buttons
    document.querySelectorAll('.add-to-cart-btn').forEach(button => {
        button.addEventListener('click', function (e) {
            e.preventDefault();
            const product = {
                id: parseInt(this.dataset.id),
                name: this.dataset.name,
                price: parseFloat(this.dataset.price),
                image: this.dataset.image,
                quantity: 1
            };
            addToCart(product);
        });
    });
}

// Initialize single product page
async function initializeSingleProduct() {
    const params = new URLSearchParams(window.location.search);
    const productId = params.get('id');
    const productDetails = document.getElementById('product-details');

    if (!productId || !productDetails) return;

    const data = await fetchProducts();
    const product = data.products.find(p => p.id === parseInt(productId));

    if (!product) {
        productDetails.innerHTML = '<p>Product not found.</p>';
        return;
    }

    // Populate product details
    document.getElementById('MainImg').src = product.image;
    document.querySelector('.sproduct-details h4').textContent = product.name;
    document.querySelector('.sproduct-details h2').textContent = product.price;

    // Add to Cart button functionality
    const addToCartButton = document.querySelector('.sproduct-details button');
    addToCartButton.addEventListener('click', () => {
        const quantity = parseInt(document.querySelector('.sproduct-details input[type="number"]').value) || 1;

        addToCart({
            id: product.id,
            name: product.name,
            price: parseFloat(product.price.replace('$', '')),
            image: product.image,
            quantity: quantity
        });
    });
}

// Initialize cart page
function initializeCart() {
    const cartItemsContainer = document.querySelector('#cart-items');
    const cartSubtotal = document.querySelector('#cart-subtotal');
    const cartTotal = document.querySelector('#cart-total');
    const couponInput = document.querySelector('.coupon-input');
    const applyBtn = document.querySelector('.apply-btn');

    if (!cartItemsContainer || !cartSubtotal || !cartTotal) return;

    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    let appliedCoupon = null;

    // Function to update cart totals
    function updateCartTotals() {
        let subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
        let discount = appliedCoupon ? subtotal * appliedCoupon : 0;
        let total = subtotal - discount;
        cartSubtotal.textContent = `$${subtotal.toFixed(2)}`;
        cartTotal.innerHTML = `<strong>$${total.toFixed(2)}</strong>`;
    }

    // Function to render cart items
    function renderCartItems() {
        cartItemsContainer.innerHTML = '';

        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<tr><td colspan="6">Your cart is empty.</td></tr>';
            updateCartTotals();
            return;
        }

        cart.forEach(item => {
            const cartRow = `
                <tr data-id="${item.id}">
                    <td><a href="#" class="remove-item"><i class="bi bi-x-circle"></i></a></td>
                    <td><img src="${item.image}" alt="${item.name}" width="50"></td>
                    <td>${item.name}</td>
                    <td>$${item.price.toFixed(2)}</td>
                    <td><input type="number" class="quantity-input" value="${item.quantity}" min="1" data-id="${item.id}"></td>
                    <td>$${(item.price * item.quantity).toFixed(2)}</td>
                </tr>
            `;
            cartItemsContainer.innerHTML += cartRow;
        });

        updateCartTotals();
    }

    // Update quantity and subtotal when quantity changes
    cartItemsContainer.addEventListener('input', (e) => {
        if (e.target.classList.contains('quantity-input')) {
            const productId = parseInt(e.target.dataset.id);
            const newQuantity = parseInt(e.target.value);
            const product = cart.find(item => item.id === productId);

            if (product) {
                product.quantity = newQuantity > 0 ? newQuantity : 1;
                localStorage.setItem('cart', JSON.stringify(cart));
                renderCartItems();
                updateCartCounter();
            }
        }
    });

    // Remove item from cart
    cartItemsContainer.addEventListener('click', (e) => {
        if (e.target.closest('.remove-item')) {
            const productId = parseInt(e.target.closest('tr').dataset.id);
            cart = cart.filter(item => item.id !== productId);
            localStorage.setItem('cart', JSON.stringify(cart));
            renderCartItems();
            updateCartCounter();
        }
    });

    // Apply coupon
    applyBtn.addEventListener('click', () => {
        const couponCode = couponInput.value.trim().toLowerCase();
        if (couponCode === 'discount10') {
            appliedCoupon = 0.1;
            alert('Coupon applied! You get 10% off.');
        } else {
            appliedCoupon = null;
            alert('Invalid coupon code.');
        }
        updateCartTotals();
    });

    // Initialize cart items
    renderCartItems();
}

// Initialize based on the page
document.addEventListener('DOMContentLoaded', () => {
    updateCartCounter();
    initializeProducts();
    initializeSingleProduct();
    initializeCart();
});
