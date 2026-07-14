/**
 * EAZYOO Cart Engine
 * localStorage-based cart with drawer UI, toast notifications, and email checkout.
 */

const CART_KEY = 'eazyoo_cart';

// ── Storage helpers ──────────────────────────────────────────────────────────
function getCart() {
  try { return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); }
  catch { return []; }
}
function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

// ── Badge ────────────────────────────────────────────────────────────────────
function updateBadge() {
  const count = getCart().reduce((sum, i) => sum + i.qty, 0);
  document.querySelectorAll('.cart-badge').forEach(el => {
    el.textContent = count;
    el.style.display = count > 0 ? 'flex' : 'none';
  });
}

// ── Add / Remove / Update ────────────────────────────────────────────────────
window.addToCart = function(product) {
  const cart = getCart();
  const existing = cart.find(i => i.id === product.id);
  if (existing) {
    existing.qty++;
  } else {
    cart.push({ id: product.id, name: product.name, price: product.price, image: product.image, qty: 1 });
  }
  saveCart(cart);
  updateBadge();
  renderCartDrawer();
  openCart();
  showToast('Added to cart — ' + product.name);
};

window.removeFromCart = function(id) {
  saveCart(getCart().filter(i => i.id !== id));
  updateBadge();
  renderCartDrawer();
};

window.updateQty = function(id, delta) {
  const cart = getCart();
  const item = cart.find(i => i.id === id);
  if (!item) return;
  item.qty = Math.max(0, item.qty + delta);
  if (item.qty === 0) return window.removeFromCart(id);
  saveCart(cart);
  updateBadge();
  renderCartDrawer();
};

// ── Total ────────────────────────────────────────────────────────────────────
function getTotal() {
  return getCart().reduce((sum, i) => sum + parseFloat(i.price) * i.qty, 0);
}

// ── Render Drawer Contents ───────────────────────────────────────────────────
function renderCartDrawer() {
  const cartItems = document.getElementById('cart-items');
  const cartTotal = document.getElementById('cart-total');
  const cartCount = document.getElementById('cart-count-header');
  if (!cartItems) return;

  const cart = getCart();
  const itemCount = cart.reduce((s, i) => s + i.qty, 0);

  if (cartCount) cartCount.textContent = itemCount > 0 ? `(${itemCount})` : '';

  if (cart.length === 0) {
    cartItems.innerHTML = `
      <div class="cart-empty">
        <div style="font-size:3rem;margin-bottom:16px;">🛒</div>
        <p style="color:var(--color-text-light);font-size:0.95rem;margin-bottom:0;">Your cart is empty</p>
        <a href="products.html" onclick="closeCart()" class="btn-add-cart" style="margin-top:20px;text-decoration:none;">Browse Products</a>
      </div>`;
  } else {
    cartItems.innerHTML = cart.map(item => `
      <div class="cart-item">
        <img src="${item.image}" alt="${item.name}" class="cart-item-img"
             onerror="this.src='https://placehold.co/64x64/e2e8f0/475569?text=?'">
        <div class="cart-item-info">
          <div class="cart-item-name">${item.name}</div>
          <div class="cart-item-price">£${parseFloat(item.price).toFixed(2)}</div>
          <div class="cart-item-controls">
            <button onclick="updateQty('${item.id}',-1)" aria-label="Decrease">−</button>
            <span>${item.qty}</span>
            <button onclick="updateQty('${item.id}',1)" aria-label="Increase">+</button>
          </div>
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:8px;">
          <span style="font-weight:700;font-size:0.95rem;">£${(parseFloat(item.price) * item.qty).toFixed(2)}</span>
          <button onclick="removeFromCart('${item.id}')" class="cart-remove-btn" aria-label="Remove">✕</button>
        </div>
      </div>`).join('');
  }

  if (cartTotal) cartTotal.textContent = `£${getTotal().toFixed(2)}`;
}

// ── Open / Close ─────────────────────────────────────────────────────────────
window.openCart = function() {
  document.getElementById('cart-drawer')?.classList.add('open');
  document.getElementById('cart-overlay')?.classList.add('open');
  document.body.style.overflow = 'hidden';
  renderCartDrawer();
};

window.closeCart = function() {
  document.getElementById('cart-drawer')?.classList.remove('open');
  document.getElementById('cart-overlay')?.classList.remove('open');
  document.body.style.overflow = '';
};

// ── Checkout (email-based for static site) ───────────────────────────────────
window.checkoutCart = function() {
  const cart = getCart();
  if (cart.length === 0) { showToast('Your cart is empty', 'error'); return; }

  const total = getTotal();
  const lines = cart.map(i =>
    `• ${i.qty}× ${i.name} @ £${parseFloat(i.price).toFixed(2)} = £${(parseFloat(i.price) * i.qty).toFixed(2)}`
  ).join('\n');

  const subject = encodeURIComponent('Order Request — EAZYOO');
  const body = encodeURIComponent(
    `Hello EAZYOO,\n\nI would like to place the following order:\n\n${lines}\n\nOrder Total: £${total.toFixed(2)}\n\n` +
    `Please confirm availability and send payment details.\n\nThank you!`
  );

  window.location.href = `mailto:contact@eazyoo.co.uk?subject=${subject}&body=${body}`;
};

// ── Toast ────────────────────────────────────────────────────────────────────
function showToast(msg, type = 'success') {
  document.querySelectorAll('.ez-toast').forEach(t => t.remove());
  const toast = document.createElement('div');
  toast.className = 'ez-toast' + (type === 'error' ? ' ez-toast-error' : '');
  toast.innerHTML = `<span>${type === 'success' ? '✓' : '!'}</span> ${msg}`;
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('show'));
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  }, 3000);
}

// ── Dark Mode Toggle ─────────────────────────────────────────────────────────
function initDarkMode() {
  const stored = localStorage.getItem('eazyoo_theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const isDark = stored ? stored === 'dark' : prefersDark;
  if (isDark) document.documentElement.setAttribute('data-theme', 'dark');

  const btn = document.getElementById('dark-mode-toggle');
  if (!btn) return;
  btn.setAttribute('aria-pressed', isDark);
  btn.title = isDark ? 'Switch to light mode' : 'Switch to dark mode';

  btn.addEventListener('click', () => {
    const nowDark = document.documentElement.getAttribute('data-theme') === 'dark';
    if (nowDark) {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('eazyoo_theme', 'light');
      btn.setAttribute('aria-pressed', false);
      btn.title = 'Switch to dark mode';
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('eazyoo_theme', 'dark');
      btn.setAttribute('aria-pressed', true);
      btn.title = 'Switch to light mode';
    }
  });
}

// ── Inject Cart Drawer HTML ───────────────────────────────────────────────────
function injectCartDrawer() {
  if (document.getElementById('cart-drawer')) return;
  document.body.insertAdjacentHTML('beforeend', `
    <div class="cart-overlay" id="cart-overlay" onclick="closeCart()"></div>
    <aside class="cart-drawer" id="cart-drawer" aria-label="Shopping cart">
      <div class="cart-drawer-header">
        <h3>Your Cart <span id="cart-count-header" style="font-size:0.8rem;color:var(--color-text-light);font-weight:400;"></span></h3>
        <button class="cart-close" onclick="closeCart()" aria-label="Close cart">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
      <div class="cart-items" id="cart-items">
        <div class="cart-empty">
          <div style="font-size:3rem;margin-bottom:16px;">🛒</div>
          <p style="color:var(--color-text-light);">Your cart is empty</p>
        </div>
      </div>
      <div class="cart-drawer-footer">
        <div class="cart-total-row" style="margin-bottom:16px;">
          <span>Order Total</span>
          <span id="cart-total">£0.00</span>
        </div>
        <button onclick="checkoutCart()" class="btn btn-primary" style="width:100%;justify-content:center;border-radius:var(--radius-full);padding:14px;">
          Request Order via Email
        </button>
        <p style="font-size:0.72rem;color:var(--color-text-light);text-align:center;margin-top:10px;margin-bottom:0;">
          Orders confirmed within 24 hours · contact@eazyoo.co.uk
        </p>
      </div>
    </aside>
  `);
}

// ── Init ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  injectCartDrawer();
  updateBadge();
  initDarkMode();

  // Wire nav cart buttons (remove Snipcart class so Snipcart doesn't intercept)
  document.querySelectorAll('.cart-btn, .snipcart-checkout').forEach(btn => {
    btn.classList.remove('snipcart-checkout');
    btn.addEventListener('click', openCart);
  });

  // Escape key closes cart
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeCart();
  });
});
