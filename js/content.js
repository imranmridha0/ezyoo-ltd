/**
 * EAZYOO CMS Content Manager v2
 * Fetches data.json and populates all pages dynamically.
 * Supports: Products, Categories, Blog, Cart, B2B Pricing
 */

// ==========================================
// SNIPCART INTEGRATION
// ==========================================
function initSnipcart(apiKey) {
  if (!apiKey) {
    console.warn('Snipcart API Key is missing. Cart checkout will not work.');
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
  // Configure Snipcart to allow dynamic product injection (no server validation for this demo)
  snipcartDiv.setAttribute('data-config-add-product-behavior', 'none'); 
  document.body.appendChild(snipcartDiv);
}

// ==========================================
// MAIN INIT
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const res = await fetch('data.json');
    if (!res.ok) throw new Error('Could not load site data');
    const data = await res.json();
    
    const isWholesale = localStorage.getItem('eazyoo_wholesale_logged_in') === 'true';

    // ==========================================
    // INJECT SEO & SETTINGS
    // ==========================================
    const s = data.settings || {};
    
    // Inject Snipcart
    // Use test key if none provided in settings for demo purposes
    const snipcartKey = s.snipcartApiKey || 'NmU2YWI4NDEtYTNhYi00NGQ2LTljNjUtYjM0ZTUwZDcxOTIxNjM4NTM3NjI3MjA1NTY4MDMx';
    initSnipcart(snipcartKey);

    if (data.seo) {
      if (data.seo.metaTitle) document.title = data.seo.metaTitle;
      if (data.seo.metaDescription) {
        let metaDesc = document.querySelector('meta[name="description"]');
        if (!metaDesc) { metaDesc = document.createElement('meta'); metaDesc.name = 'description'; document.head.appendChild(metaDesc); }
        metaDesc.content = data.seo.metaDescription;
      }
    }
    if (s.brandName) document.querySelectorAll('.logo-text').forEach(el => el.textContent = s.brandName);

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
      const imgs = p.images && p.images.length > 0 ? p.images : ['https://placehold.co/600x600/e2e8f0/475569?text=No+Image'];
      const firstImg = imgs[0];
      
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
              <button class="snipcart-add-item btn-add-cart" 
                data-item-id="${p.id}"
                data-item-price="${priceToUse}"
                data-item-url="/"
                data-item-description="${p.description}"
                data-item-image="${firstImg}"
                data-item-name="${p.name.replace(/"/g, '&quot;')}">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
                Add to Cart
              </button>
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
      // Shuffle all products and pick 8 random ones for a fresh homepage feel
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
