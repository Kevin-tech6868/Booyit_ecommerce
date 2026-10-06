// src/store/cartStore.js

const CART_KEY = "cart";

function readCart() {
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeCart(items) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
  // Notifies any component listening (Navbar badge, Cart page) in the same tab
  window.dispatchEvent(new Event("cartchange"));
}

export function getCart() {
  return readCart();
}

export function getCartCount() {
  return readCart().reduce((sum, item) => sum + item.quantity, 0);
}

export function getCartTotal() {
  return readCart().reduce(
    (sum, item) => sum + Number(item.price) * item.quantity,
    0
  );
}

// product: the full product row from your API (id, product_name, price, image_path, stock_quantity...)
export function addToCart(product, qty = 1) {
  const items = readCart();
  const existing = items.find((item) => item.id === product.id);
  const maxQty = product.stock_quantity ?? Infinity;

  if (existing) {
    existing.quantity = Math.min(existing.quantity + qty, maxQty);
  } else {
    items.push({
      id: product.id,
      product_name: product.product_name,
      price: product.price,
      image_path: product.image_path,
      stock_quantity: product.stock_quantity,
      quantity: Math.min(qty, maxQty),
    });
  }

  writeCart(items);
}

export function updateQuantity(id, qty) {
  const items = readCart();
  const item = items.find((item) => item.id === id);
  if (!item) return;

  const maxQty = item.stock_quantity ?? Infinity;
  item.quantity = Math.max(1, Math.min(qty, maxQty));

  writeCart(items);
}

export function removeFromCart(id) {
  const items = readCart().filter((item) => item.id !== id);
  writeCart(items);
}

export function clearCart() {
  writeCart([]);
}