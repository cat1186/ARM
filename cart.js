 const CART_KEY = "armEnterprisesCart";
      const BILL_KEY = "armEnterprisesLastBill";

function getCart() {
  try {
    const cart = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
    return Array.isArray(cart) ? cart : [];
  } catch {
    saveCart([]);
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function getCartFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const cartData = params.get("cart");

  if (!cartData) {
    return null;
  }

  try {
    const cart = JSON.parse(cartData);
    if (Array.isArray(cart)) {
      saveCart(cart);
      return cart;
    }
    return null;
  } catch {
    return null;
  }
}

function formatRupees(value) {
  return `₹${value}`;
}

function hasCustomerDetails() {
  try {
    const customer = JSON.parse(localStorage.getItem("armCustomerDetails") || "{}");
    return Boolean(customer.submitted && customer.name && customer.phone && customer.address);
  } catch {
    return false;
  }
}

function setupSizeSelection() {
  const sizeContainer = document.querySelector(".selectable-sizes");
  const addButton = document.querySelector("[data-add-selected]");
  const feedback = document.querySelector(".cart-feedback");

  if (!sizeContainer || !addButton) {
    return;
  }

  const gsm = sizeContainer.dataset.gsm;
  const unit = sizeContainer.dataset.unit || (gsm.includes("GSM") ? "kg" : "qty");
  const sizeCards = [...sizeContainer.querySelectorAll(".size-card")];
  const sizeButtons = sizeCards.map((card) => card.querySelector("[data-size]"));

  sizeCards.forEach((card) => {
    const button = card.querySelector("[data-size]");
    const quantityNode = card.querySelector("[data-quantity]");
    const plusButton = card.querySelector("[data-plus]");
    const minusButton = card.querySelector("[data-minus]");

    button.addEventListener("click", () => {
      button.classList.toggle("selected");
      card.classList.toggle("selected", button.classList.contains("selected"));
      feedback.textContent = button.classList.contains("selected")
        ? `${button.dataset.size} selected`
        : `${button.dataset.size} removed from selection`;
    });

    plusButton.addEventListener("click", () => {
      quantityNode.textContent = Number(quantityNode.textContent) + 1;
      button.classList.add("selected");
      card.classList.add("selected");
      feedback.textContent = `${button.dataset.size} quantity is ${quantityNode.textContent} ${unit}`;
    });

    minusButton.addEventListener("click", () => {
      const nextQuantity = Math.max(0, Number(quantityNode.textContent) - 1);
      quantityNode.textContent = nextQuantity;
      if (nextQuantity === 0) {
        button.classList.remove("selected");
        card.classList.remove("selected");
      }
      feedback.textContent = `${button.dataset.size} quantity is ${nextQuantity} ${unit}`;
    });
  });

  addButton.addEventListener("click", () => {
    const selectedCards = sizeCards.filter((card) => Number(card.querySelector("[data-quantity]").textContent) > 0);

    if (selectedCards.length === 0) {
      feedback.textContent = "Add quantity for at least one size first.";
      return;
    }

    const cart = getCart();

    selectedCards.forEach((card) => {
      const button = card.querySelector("[data-size]");
      const quantityNode = card.querySelector("[data-quantity]");
      const size = button.dataset.size;
      const price = Number(button.dataset.price);
      const quantity = Number(quantityNode.textContent);
      const existing = cart.find((item) => item.gsm === gsm && item.size === size);

      if (existing) {
        existing.quantity += quantity;
        existing.unit = unit;
      } else {
        cart.push({ gsm, size, price, quantity, unit });
      }

      button.classList.remove("selected");
      card.classList.remove("selected");
      quantityNode.textContent = "0";
    });

    saveCart(cart);
    feedback.textContent = `${selectedCards.length} item type added to cart.`;
    window.location.href = `payments.html?cart=${encodeURIComponent(JSON.stringify(cart))}`;
  });
}

function renderCart() {
  const cartItems = document.querySelector("[data-cart-items]");
  const cartTotal = document.querySelector("[data-cart-total]");
  const clearButton = document.querySelector("[data-clear-cart]");
  const paymentButton = document.querySelector(".payment-button");
  const paymentMessage = document.querySelector(".payment-message");
  const purchasePopup = document.querySelector("[data-purchase-popup]");

  if (!cartItems || !cartTotal) {
    return;
  }

  const cart = getCartFromUrl() || getCart();
  cartItems.innerHTML = "";

  if (cart.length === 0) {
    cartItems.innerHTML = '<p class="empty-cart">No items in cart yet.</p>';
    cartTotal.textContent = formatRupees(0);
    return;
  }

  let total = 0;

  cart.forEach((item) => {
    const itemTotal = item.price * item.quantity;
    total += itemTotal;

    const row = document.createElement("div");
    row.className = "cart-row";
    row.innerHTML = `
      <div>
        <strong>${item.gsm} - ${item.size}</strong>
        <span>Quantity: ${item.quantity} ${item.unit || "kg"} x ${formatRupees(item.price)} per ${item.unit || "kg"}</span>
      </div>
      <b>${formatRupees(itemTotal)}</b>
    `;
    cartItems.append(row);
  });

  cartTotal.textContent = formatRupees(total);

  clearButton?.addEventListener("click", () => {
    saveCart([]);
    renderCart();
  });

  paymentButton?.addEventListener("click", () => {
    if (total === 0) {
      paymentMessage.textContent = "Cart is empty. Add items before payment.";
      return;
    }

    if (!hasCustomerDetails()) {
      window.location.href = "index.html?customer=required#products";
      return;
    }

    const bill = {
      billNo: `ARM-${Date.now()}`,
      date: new Date().toLocaleString(),
      items: cart,
      total,
      customer: JSON.parse(localStorage.getItem("armCustomerDetails") || "{}"),
    };

    localStorage.setItem(BILL_KEY, JSON.stringify(bill));
    saveCart([]);
    localStorage.removeItem("armCustomerDetails");
    purchasePopup?.classList.add("show");
    paymentMessage.textContent = "Payment completed. Opening bill...";
    setTimeout(() => {
      window.location.href = `bill.html?bill=${encodeURIComponent(JSON.stringify(bill))}`;
    }, 900);
  });
}

setupSizeSelection();
renderCart();

function renderBill() {
  const billArea = document.querySelector("[data-bill-items]");
  const billTotal = document.querySelector("[data-bill-total]");
  const billMeta = document.querySelector("[data-bill-meta]");
  const customerBox = document.querySelector("[data-bill-customer]");

  if (!billArea || !billTotal) {
    return;
  }

  const params = new URLSearchParams(window.location.search);
  let bill = null;

  try {
    bill = params.get("bill")
      ? JSON.parse(params.get("bill"))
      : JSON.parse(localStorage.getItem(BILL_KEY) || "null");
  } catch {
    bill = null;
  }

  if (!bill || !Array.isArray(bill.items)) {
    billArea.innerHTML = '<p class="empty-cart">No bill found.</p>';
    billTotal.textContent = formatRupees(0);
    return;
  }

  billMeta.textContent = `Bill No: ${bill.billNo} | Date: ${bill.date}`;
  customerBox.innerHTML = `
    <strong>${bill.customer?.name || "Customer"}</strong>
    <span>${bill.customer?.phone || ""}</span>
    <span>${bill.customer?.address || ""}</span>
  `;

  billArea.innerHTML = "";
  bill.items.forEach((item) => {
    const itemTotal = item.price * item.quantity;
    const row = document.createElement("div");
    row.className = "cart-row";
    row.innerHTML = `
      <div>
        <strong>${item.gsm} - ${item.size}</strong>
        <span>${item.quantity} ${item.unit || "kg"} x ${formatRupees(item.price)} per ${item.unit || "kg"}</span>
      </div>
      <b>${formatRupees(itemTotal)}</b>
    `;
    billArea.append(row);
  });

  billTotal.textContent = formatRupees(bill.total);
}

renderBill();
function sendToWhatsApp() {
  const name = document.getElementById("custName")?.value || "";
  const phoneInput = document.getElementById("custPhone")?.value || "";
  const address = document.getElementById("custAddress")?.value || "";

  const params = new URLSearchParams(window.location.search);
  const urlCart = params.get("cart");
  let cart = [];

  if (urlCart) {
    try {
      cart = JSON.parse(urlCart);
    } catch (e) {
      cart = getCart();
    }
  } else {
    cart = getCart();
  }

  if (!cart || cart.length === 0) {
    alert("Your cart is empty!");
    return;
  }

let message = `Hello, I want to order:

Name: ${name}
Phone: ${phoneInput}
Address: ${address}

`;

  cart.forEach((item, index) => {
    const itemTotal = item.price * item.quantity;

    message += `${index + 1}. ${item.gsm} - ${item.size}\n`;
    message += `Qty: ${item.quantity}kg × ₹${item.price} = ₹${itemTotal}\n\n`;
  });

  message += "Please confirm my order.";

  let phone = "919655440644";

  let url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

  window.open(url, "_blank");
}

// Make it globally accessible for the onclick handler
window.sendToWhatsApp = sendToWhatsApp;
