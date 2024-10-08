// Select necessary DOM elements
const elements = {
    listProductHTML: document.querySelector(".grid-container"),
    listCartHTML: document.querySelector(".cart-section"),
    iconCartSpan: document.querySelector("#cart-count"),
    confirmOrderBtn: document.getElementById("confirm-order-btn"),
    orderConfirmationModal: document.getElementById("order-confirmation-modal"),
    orderSummary: document.getElementById("order-summary"),
    newOrderBtn: document.getElementById("new-order-btn"),
};

// Initialize app state
let state = {
    listProducts: [],
    cart: {},
};

// Fetch product data and initialize app
const initApp = async () => {
    try {
        const response = await fetch("data.json");
        state.listProducts = await response.json();
        renderProducts();
    } catch (error) {
        console.error("Failed to fetch products:", error);
    }
};

// Render products to the HTML
const renderProducts = () => {
    elements.listProductHTML.innerHTML = ""; // Clear existing products
    state.listProducts.forEach(renderProductCard);
    attachButtonListeners();
};

// Render a single product card
const renderProductCard = (product) => {
    const productCard = document.createElement("div");
    productCard.classList.add("card"); // Changed to match CSS
    productCard.dataset.name = product.name;
    productCard.innerHTML = `
        <img class="card-image" src="${product.image.desktop}" alt="product"> 
        <button class="add-to-cart-button">
            <img src="assets/images/icon-add-to-cart.svg" alt="cart icon"> Add to cart
        </button>
        <div class="quantity-selector hidden"> 
            <button class="icon-decrement">-</button>
            <span>1</span>
            <button class="icon-increment">+</button>
        </div>
        <p class="toLeft">${product.category}</p>
        <h2 class="product-name">${product.name}</h2>
        <h3 class="price">$${product.price.toFixed(2)}</h3>
    `;
    elements.listProductHTML.appendChild(productCard);
};

// Attach event listeners to buttons
const attachButtonListeners = () => {
    document.querySelectorAll(".add-to-cart-button").forEach(button => {
        button.addEventListener("click", handleAddToCartClick);
    });

    document.querySelectorAll(".icon-increment, .icon-decrement").forEach(button => {
        button.addEventListener("click", handleQuantityChange);
    });
};

// Handle the Add to Cart button click
const handleAddToCartClick = (event) => {
    const productCard = event.target.closest(".card");
    const productName = productCard.dataset.name;
    const productPrice = parseFloat(productCard.querySelector(".price").textContent.replace('$', ''));

    toggleAddToCartButton(productCard, true); // Hide Add to Cart button/////*** 
    updateCart(productName, productPrice, 1); // Add product to cart
    updateCartDisplay();
};

// Update the cart with the product
const updateCart = (productName, price, quantity) => {
    if (!state.cart[productName]) {
        state.cart[productName] = { quantity: 0, price };
    }
    state.cart[productName].quantity += quantity;
};

// Toggle visibility of the Add to Cart button and counter
const toggleAddToCartButton = (productCard, hide) => {
    const addToCartButton = productCard.querySelector(".add-to-cart-button");
    const counterDiv = productCard.querySelector(".quantity-selector");
    addToCartButton.classList.toggle("hidden", hide);
    counterDiv.classList.toggle("hidden", !hide);
};

// Handle quantity increment/decrement
const handleQuantityChange = (event) => {
    const button = event.target;
    const counterDiv = button.closest(".quantity-selector");
    const span = counterDiv.querySelector("span");
    const productCard = button.closest(".card");
    const productName = productCard.dataset.name;

    let currentQuantity = parseInt(span.textContent);
    
    if (button.classList.contains("icon-increment")) {
        currentQuantity++;
    } else if (button.classList.contains("icon-decrement")) {
        currentQuantity = Math.max(1, currentQuantity - 1);
    }

    span.textContent = currentQuantity;
    state.cart[productName].quantity = currentQuantity;

    if (currentQuantity === 1 && button.classList.contains("icon-decrement")) {
        delete state.cart[productName];
        toggleAddToCartButton(productCard, false);
        counterDiv.classList.add("hidden");
    }
    updateCartDisplay();
};

////////////////////////////////////// Update the cart display
const updateCartDisplay = () => {
    elements.listCartHTML.innerHTML = ""; // Clear cart display
    let totalQuantity = 0;
    let totalPrice = 0;

    // Calculate the total quantity and total price
    for (const { quantity, price } of Object.values(state.cart)) {
        totalQuantity += quantity;
        totalPrice += price * quantity;
    }

    if (totalQuantity === 0) {
        elements.listCartHTML.innerHTML = `
            <img src="/assets/images/illustration-empty-cart.svg" alt="empty cart" />
            <p>Your added items will appear here.</p>
        `;
    } else {
        // Render Cart Header with Total Quantity
        const cartHeader = `<h1>Your Cart (${totalQuantity})</h1>`;
        elements.listCartHTML.innerHTML = cartHeader;

        // Render each cart item
        for (const [productName, { quantity, price }] of Object.entries(state.cart)) {
            renderCartItem(productName, quantity, price);
        }

        const orderTotalDiv = document.createElement("div");
        orderTotalDiv.innerHTML = `<h3>Order Total: $${totalPrice.toFixed(2)}</h3>`;
        elements.listCartHTML.appendChild(orderTotalDiv);
    }

    // Show/Hide the Confirm Order button based on cart items
    elements.confirmOrderBtn.hidden = totalQuantity === 0; // Show if totalQuantity >= 1

    // Update the cart count in the cart icon
    elements.iconCartSpan.textContent = totalQuantity;
};

// Render individual cart item
const renderCartItem = (productName, quantity, price) => {
    const cartItem = document.createElement("div");
    cartItem.classList.add("cart-item");
    cartItem.innerHTML = `
        <h2>${productName}</h2>
        <div class="pdcs-infos">
            <p class="product-quantity">${quantity}X</p>
            <p class="single-price">@$${price.toFixed(2)}</p>
            <p class="total-price">$${(price * quantity).toFixed(2)}</p>
            <button class="remove-from-cart" data-name="${productName}">
                <img src="/assets/images/icon-remove-item.svg" alt="remove icon" />
            </button>
        </div>
    `;
    elements.listCartHTML.appendChild(cartItem);

    // Attach remove button listener
    cartItem.querySelector(".remove-from-cart").addEventListener("click", handleRemoveFromCart);
};

// Handle remove item from cart
const handleRemoveFromCart = (event) => {
    const productName = event.target.dataset.name;
    delete state.cart[productName];
    updateCartDisplay();

    const productCard = document.querySelector(`.card[data-name="${productName}"]`);
    toggleAddToCartButton(productCard, false);
};

// Handle confirm order button click
elements.confirmOrderBtn.addEventListener("click", () => {
    renderOrderSummary(); // Render summary of the cart in a dialog/modal
    toggleModalVisibility(elements.orderConfirmationModal); // Show the modal
});

// Render order summary in the modal
const renderOrderSummary = () => {
    const summaryHTML = Object.entries(state.cart)
        .map(([item, { quantity, price }]) => `
            <div class="order-summary-item">
                <img src="${state.listProducts.find(p => p.name === item).image.desktop}" alt="${item}" />
                <p>${item}</p>
                <p>Quantity: ${quantity}</p>
                <p>Price: $${price.toFixed(2)}</p>
                <p>Total: $${(price * quantity).toFixed(2)}</p>
            </div>
        `)
        .join("");

    const orderTotal = Object.values(state.cart).reduce((total, { price, quantity }) => total + price * quantity, 0);
    elements.orderSummary.innerHTML = `
        <div class="order-confirmation-header">
            <img src="/assets/images/icon-order-confirmed.svg" alt="Order Confirmed" />
            <h2>Order Confirmed</h2>
            <p>We hope you enjoy your food!</p>
        </div>
        ${summaryHTML}
        <h3>Order Total: $${orderTotal.toFixed(2)}</h3>
        <button class="new-order-btn">New Order</button>
    `;

    // Attach event listener to "New Order" button
    elements.orderSummary.querySelector(".new-order-btn").addEventListener("click", handleNewOrder);
};

// Handle new order button click
const handleNewOrder = () => {
    state.cart = {}; // Clear the cart
    updateCartDisplay(); // Update the cart display
    toggleModalVisibility(elements.orderConfirmationModal); // Hide the modal

    // Show all add-to-cart buttons again (if they were toggled)
    document.querySelectorAll(".card").forEach(card => {
        toggleAddToCartButton(card, false);
    });
};

// Toggle modal visibility
const toggleModalVisibility = (modal) => {
    modal.classList.toggle("hidden");
};

// Initialize the application
initApp();
