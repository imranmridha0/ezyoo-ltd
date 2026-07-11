/**
 * EAZYOO CMS Content Manager v3
 * Fetches data.json and populates all pages dynamically.
 * Supports: Products, Categories, Blog, Cart, B2B Pricing,
 *           Noticeboard, Social Links, Nav Sign-Out
 */

// ==========================================
// SNIPCART INTEGRATION
// ==========================================
function initSnipcart(apiKey) {
  if (!apiKey) {
    console.warn('Snipcart API Key is missing. Using Amazon redirect fallback for cart.');
    return;
  }

  if (document.getElementById('snipcart')) return; // Already injected

  // Add Preconnects
  const preconnect1 = document.createElement('link');
  preconnect1.rel = 'preconnect';
  preconnect1.href = 'https://app.snipcart.com';
  const preconnect2 = document.createElement('link');
  preconnect2.rel = 'preconnect';
  preconnect2.href = 'https://cdn.snipcart.com';
  document.head.appendChild(preconnect1);
  document.head.appendChild(preconnect2);

  // Add CSS
  const css = document.createElement('link');
  css.rel = 'stylesheet';
  css.href = 'https://cdn.snipcart.com/themes/v3.0.31/default/snipcart.css';
  document.head.appendChild(css);

  // Add Script
  const script = document.createElement('script');
  script.src = 'https://cdn.snipcart.com/themes/v3.0.31/default/snipcart.js';
  script.async = true;
  document.body.appendChild(script);

  // Add hidden Snipcart div
  const snipcartDiv = document.createElement('div');
  snipcartDiv.id = 'snipcart';
  snipcartDiv.setAttribute('data-api-key', apiKey);
  snipcartDiv.setAttribute('hidden', 'true');
  snipcartDiv.setAttribute('data-config-add-product-behavior', 'none');
  document.body.appendChild(snipcartDiv);
}

// ==========================================
// NOTICEBOARD BANNER
// ==========================================
const NB_ICONS = {
  maintenance: { label: '⚠️ Maintenance',  emoji: '🚧' },
  deals:       { label: '🔥 Big Deals',    emoji: '🔥' },
  hourly_deal: { label: '⏰ Hourly Deal',  emoji: '⏰' },
  sale:        { label: '💸 Sale',         emoji: '💸' },
  custom:      { label: '📢 Notice',       emoji: '📢' }
};

function renderNoticeboard(nb) {
  if (!nb || !nb.enabled) return;

  const nav = document.getElementById('navbar');
  if (!nav) return;

  const type  = nb.type || 'custom';
  const speed = nb.speed || 'normal';
  const info  = NB_ICONS[type] || NB_ICONS.custom;

  const board = document.createElement('div');
  board.id = 'site-noticeboard';
  board.className = `nb-type-${type}`;
  board.innerHTML = `
    <div class="nb-inner">
      <span class="nb-icon-pill">${info.label}</span>
      <div class="nb-marquee-wrap">
        <span class="nb-marquee speed-${speed}">${nb.text}&nbsp;&nbsp;&nbsp;•&nbsp;&nbsp;&nbsp;${nb.text}&nbsp;&nbsp;&nbsp;•&nbsp;&nbsp;&nbsp;${nb.text}</span>
      </div>
      <button class="nb-dismiss" onclick="this.closest('#site-noticeboard').classList.add('nb-hidden')" title="Dismiss">✕</button>
    </div>
  `;

  // Insert after navbar
  nav.insertAdjacentElement('afterend', board);
}

// ==========================================
// SOCIAL LINKS INJECTION
// ==========================================
function injectSocialLinks(s) {
  const map = {
    'Facebook': s.socialFb,
    'Instagram': s.socialIg,
    'TikTok': s.socialTt,
    'YouTube': s.socialYt
  };
  const abbr = { 'Facebook': 'FB', 'Instagram': 'IG', 'TikTok': 'TT', 'YouTube': 'YT' };

  document.querySelectorAll('.social-links a').forEach(a => {
    const label = a.getAttribute('aria-label');
    if (label && map[label]) {
      const url = map[label];
      if (url && url !== '#' && url.trim() !== '') {
        a.href = url;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
      }
    }
  });
}

// ==========================================
// NAV SIGN-OUT STATE
// ==========================================
function updateNavAuthState() {
  const session = JSON.parse(sessionStorage.getItem('eazyoo_session') || 'null');
  if (!session) return;

  // Look for the account icon link in nav and add sign-out option
  const navActions = document.querySelector('.nav-actions');
  if (!navActions) return;

  // Check if already injected
  if (document.getElementById('nav-signout-btn')) return;

  const signOutBtn = document.createElement('button');
  signOutBtn.id = 'nav-signout-btn';
  signOutBtn.title = `Signed in as ${session.email} — click to sign out`;
  signOutBtn.style.cssText = `
    background: none; border: 1px solid rgba(0,95,204,0.3);
    border-radius: 20px; padding: 5px 14px; font-size: 0.78rem;
    font-weight: 600; color: var(--color-primary, #005fcc);
    cursor: pointer; display: flex; align-items: center; gap: 5px;
    font-family: inherit; transition: all 0.2s;
    white-space: nowrap; margin-right: 6px;
  `;
  signOutBtn.innerHTML = `
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
    Sign Out
  `;
  signOutBtn.onmouseenter = () => { signOutBtn.style.background = 'rgba(0,95,204,0.08)'; };
  signOutBtn.onmouseleave = () => { signOutBtn.style.background = 'none'; };
  signOutBtn.onclick = () => {
    sessionStorage.removeItem('eazyoo_session');
    window.location.href = 'account.html';
  };

  // Insert before the CTA button
  const cta = navActions.querySelector('.nav-cta');
  if (cta) {
    navActions.insertBefore(signOutBtn, cta);
  } else {
    navActions.prepend(signOutBtn);
  }
}

// ==========================================
// MAIN INIT
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Cache-bust: always fetch fresh data (fixes stale product publishing)
    const res = await fetch('data.json?v=' + Date.now());
    if (!res.ok) throw new Error('Could not load site data');
    const data = await res.json();

    const isWholesale = localStorage.getItem('eazyoo_wholesale_logged_in') === 'true';

    // ==========================================
    // INJECT SEO & SETTINGS
    // ==========================================
    const s = data.settings || {};

    // Inject Snipcart
    const snipcartKey = s.snipcartApiKey || '';
    initSnipcart(snipcartKey);
    const hasSnipcart = !!snipcartKey;

    if (data.seo) {
      if (data.seo.metaTitle) document.title = data.seo.metaTitle;
      if (data.seo.metaDescription) {
        let metaDesc = document.querySelector('meta[name="description"]');
        if (!metaDesc) { metaDesc = document.createElement('meta'); metaDesc.name = 'description'; document.head.appendChild(metaDesc); }
        metaDesc.content = data.seo.metaDescription;
      }
    }
    if (s.brandName) document.querySelectorAll('.logo-text').forEach(el => el.textContent = s.brandName);

    // Render noticeboard
    renderNoticeboard(s.noticeboard);

    // Inject social links into all footers
    injectSocialLinks(s);

    // Update nav auth state (show sign out if logged in)
    updateNavAuthState();

    // ==========================================
    // RENDER CATEGORY NAV (Mega Menu)
    // ==========================================
    const catNav = document.getElementById('category-nav');
    if (catNav && data.categories) {
      catNav.innerHTML = data.categories.map(c => `
        <a href="products.html?cat=${c.id}" class="cat-link" data-cat="${c.id}">
          <span class="cat-icon">${c.icon}</span>
          <span class="cat-name">${c.name}</span>
        </a>
      `).join('');
    }

    // ==========================================
    // RENDER PRODUCT CARD (Shared function)
    // ==========================================
    function renderProductCard(p) {
      const imgs = p.images && p.images.length > 0 ? p.images : ['https://placehold.co/400x400/e2e8f0/475569?text=No+Image'];
      const firstImg = imgs[0];
      const amazonUrl = p.amazonUrl || '';

      let priceHtml = `<span class="product-price">£${parseFloat(p.price).toFixed(2)}</span>`;
      if (isWholesale && p.priceWholesale) {
        priceHtml = `
          <div class="price-group">
            <span class="product-price-old">£${parseFloat(p.price).toFixed(2)}</span>
            <span class="product-price wholesale">£${parseFloat(p.priceWholesale).toFixed(2)}</span>
            <span class="wholesale-badge">B2B</span>
          </div>
        `;
      }

      // Image slider HTML
      let imageHtml;
      if (imgs.length > 1) {
        imageHtml = `
          <div class="product-slider">
            ${imgs.map((src, i) => `<img src="${src}" alt="${p.name}" class="slide" style="opacity:${i === 0 ? 1 : 0};" data-index="${i}">`).join('')}
          </div>
        `;
      } else {
        imageHtml = `<img src="${firstImg}" alt="${p.name}" class="product-card-img">`;
      }

      // Star rating
      const rating = p.rating || 0;
      const fullStars = Math.floor(rating);
      const halfStar = rating % 1 >= 0.5 ? 1 : 0;
      const emptyStars = 5 - fullStars - halfStar;
      const starsHtml = '★'.repeat(fullStars) + (halfStar ? '½' : '') + '☆'.repeat(emptyStars);

      const badgeHtml = p.badge ? `<span class="card-badge ${p.badge === 'Best Seller' ? 'badge-hot' : 'badge-new'}">${p.badge}</span>` : '';

      const priceToUse = isWholesale && p.priceWholesale ? p.priceWholesale : p.price;

      // Cart button: use Snipcart if key exists, else Amazon redirect fallback
      let cartBtnHtml;
      if (hasSnipcart) {
        cartBtnHtml = `
          <button class="snipcart-add-item btn-add-cart"
            data-item-id="${p.id}"
            data-item-price="${priceToUse}"
            data-item-url="/data.json"
            data-item-description="${(p.description || '').replace(/"/g, '&quot;')}"
            data-item-image="${firstImg}"
            data-item-name="${(p.name || '').replace(/"/g, '&quot;')}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
            Add to Cart
          </button>
        `;
      } else if (amazonUrl) {
        cartBtnHtml = `
          <a class="btn-add-cart" href="${amazonUrl}" target="_blank" rel="noopener" title="Buy on Amazon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
            Buy on Amazon
          </a>
        `;
      } else {
        cartBtnHtml = `
          <button class="btn-add-cart" style="opacity:0.5; cursor:not-allowed;" disabled title="Coming soon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
            Coming Soon
          </button>
        `;
      }

      return `
        <div class="product-card" data-category="${p.category}" data-price="${p.price}" data-rating="${rating}" data-id="${p.id}">
          <div class="product-card-visual">
            ${badgeHtml}
            ${imageHtml}
          </div>
          <div class="product-card-body">
            <span class="product-card-category">${(data.categories || []).find(c => c.id === p.category)?.name || p.category}</span>
            <h3 class="product-card-title">${p.name}</h3>
            <p class="product-card-desc">${p.description}</p>
            <div class="product-card-rating">
              <span class="stars">${starsHtml}</span>
              <span class="rating-num">${rating}</span>
            </div>
            <div class="product-card-footer">
              ${priceHtml}
              ${cartBtnHtml}
            </div>
          </div>
        </div>
      `;
    }

    // ==========================================
    // HOME PAGE: Featured Products (Random Mix)
    // ==========================================
    const dynProducts = document.getElementById('dynamic-products');
    if (dynProducts && data.products) {
      const shuffled = [...data.products].sort(() => Math.random() - 0.5);
      dynProducts.innerHTML = shuffled.slice(0, 8).map(renderProductCard).join('');
    }

    // Categories showcase on homepage
    const catShowcase = document.getElementById('categories-showcase');
    if (catShowcase && data.categories) {
      catShowcase.innerHTML = data.categories.map(c => {
        const count = (data.products || []).filter(p => p.category === c.id).length;
        return `
          <a href="products.html?cat=${c.id}" class="category-card">
            <span class="category-icon">${c.icon}</span>
            <h4>${c.name}</h4>
            <p>${count} products</p>
          </a>
        `;
      }).join('');
    }

    // ==========================================
    // PRODUCTS PAGE: Full catalog with filters
    // ==========================================
    const productGrid = document.getElementById('product-grid');
    if (productGrid && data.products) {
      const urlParams = new URLSearchParams(window.location.search);
      const activeCat = urlParams.get('cat') || 'all';
      let products = [...data.products];

      // Highlight active category in filter
      document.querySelectorAll('.filter-cat-btn').forEach(btn => {
        if (btn.dataset.cat === activeCat) btn.classList.add('active');
      });

      // Filter by category from URL
      if (activeCat !== 'all') {
        products = products.filter(p => p.category === activeCat);
      }

      // Update page title
      const pageTitle = document.getElementById('products-page-title');
      if (pageTitle && activeCat !== 'all') {
        const catObj = (data.categories || []).find(c => c.id === activeCat);
        if (catObj) pageTitle.textContent = catObj.name;
      }

      // Product count
      const countEl = document.getElementById('product-count');
      if (countEl) countEl.textContent = `${products.length} products`;

      productGrid.innerHTML = products.map(renderProductCard).join('');

      // Build category filter buttons
      const filterContainer = document.getElementById('filter-categories');
      if (filterContainer && data.categories) {
        filterContainer.innerHTML = `
          <a href="products.html" class="filter-cat-btn ${activeCat === 'all' ? 'active' : ''}" data-cat="all">All</a>
          ${data.categories.map(c => {
            const count = data.products.filter(p => p.category === c.id).length;
            return `<a href="products.html?cat=${c.id}" class="filter-cat-btn ${activeCat === c.id ? 'active' : ''}" data-cat="${c.id}">${c.icon} ${c.name} <span class="filter-count">${count}</span></a>`;
          }).join('')}
        `;
      }

      // Price filter
      const priceSlider = document.getElementById('price-range');
      const priceLabel = document.getElementById('price-label');
      if (priceSlider) {
        priceSlider.addEventListener('input', () => {
          const maxPrice = parseFloat(priceSlider.value);
          if (priceLabel) priceLabel.textContent = `Up to £${maxPrice.toFixed(0)}`;
          document.querySelectorAll('.product-card').forEach(card => {
            const cardPrice = parseFloat(card.dataset.price);
            card.style.display = cardPrice <= maxPrice ? '' : 'none';
          });
        });
      }

      // Sort
      const sortSelect = document.getElementById('sort-select');
      if (sortSelect) {
        sortSelect.addEventListener('change', () => {
          const val = sortSelect.value;
          const grid = document.getElementById('product-grid');
          const cards = Array.from(grid.querySelectorAll('.product-card'));
          cards.sort((a, b) => {
            if (val === 'price-asc') return parseFloat(a.dataset.price) - parseFloat(b.dataset.price);
            if (val === 'price-desc') return parseFloat(b.dataset.price) - parseFloat(a.dataset.price);
            if (val === 'rating') return parseFloat(b.dataset.rating) - parseFloat(a.dataset.rating);
            return 0;
          });
          cards.forEach(c => grid.appendChild(c));
        });
      }
    }

    // ==========================================
    // BLOG
    // ==========================================
    const blogList = document.getElementById('dynamic-posts');
    if (blogList && data.posts) {
      blogList.innerHTML = data.posts.sort((a, b) => new Date(b.date) - new Date(a.date)).map(p => `
        <div class="product-card">
          <div class="product-card-visual">
            <img src="${p.imgUrl || 'images/hero-banner.png'}" alt="${p.title}" class="product-card-img" style="object-fit:cover; height:200px;">
          </div>
          <div class="product-card-body">
            <span class="product-card-category">${p.date}</span>
            <h3 class="product-card-title">${p.title}</h3>
            <p class="product-card-desc">${p.excerpt}</p>
            <a href="post.html?id=${p.id}" class="btn-add-cart" style="text-decoration:none; text-align:center;">Read More →</a>
          </div>
        </div>
      `).join('');
    }

    // Single Post
    const singlePost = document.getElementById('single-post-view');
    if (singlePost && data.posts) {
      const postId = new URLSearchParams(window.location.search).get('id');
      const post = data.posts.find(p => p.id === postId);
      if (post) {
        document.title = post.title + ' — EAZYOO';
        singlePost.innerHTML = `
          <article style="max-width:760px; margin:0 auto; padding:80px 0;">
            <a href="blog.html" style="color:var(--color-primary); text-decoration:none; font-weight:600;">← Back to Blog</a>
            <h1 style="font-size:2.5rem; margin:24px 0 12px;">${post.title}</h1>
            <p style="color:var(--color-text-light); margin-bottom:32px;">${post.date}</p>
            ${post.imgUrl ? `<img src="${post.imgUrl}" style="width:100%; border-radius:16px; margin-bottom:32px;">` : ''}
            <div style="line-height:1.8; font-size:1.05rem;">${post.content}</div>
          </article>
        `;
      } else {
        singlePost.innerHTML = '<p style="text-align:center; padding:100px 0;">Post not found.</p>';
      }
    }

    // ==========================================
    // IMAGE SLIDER AUTO-PLAY
    // ==========================================
    setInterval(() => {
      document.querySelectorAll('.product-slider').forEach(slider => {
        const slides = slider.querySelectorAll('.slide');
        if (slides.length <= 1) return;
        let activeIdx = Array.from(slides).findIndex(s => s.style.opacity === '1' || s.style.opacity === 1);
        if (activeIdx < 0) activeIdx = 0;
        slides[activeIdx].style.opacity = '0';
        slides[(activeIdx + 1) % slides.length].style.opacity = '1';
      });
    }, 3000);

  } catch (err) {
    console.error('EAZYOO CMS Error:', err);
  }
});
