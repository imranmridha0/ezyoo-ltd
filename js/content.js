/**
 * EAZYOO CMS Content Manager v3
 * Fetches data.json and populates all pages dynamically.
 * Cart handled by cart.js (localStorage-based, no Snipcart dependency).
 */

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const res = await fetch('data.json');
    if (!res.ok) throw new Error('Could not load site data');
    const data = await res.json();

    const isWholesale = localStorage.getItem('eazyoo_wholesale_logged_in') === 'true';

    // ── SEO & Brand ──────────────────────────────────────────────────────────
    const s = data.settings || {};
    if (data.seo?.metaTitle) document.title = data.seo.metaTitle;
    if (data.seo?.metaDescription) {
      let el = document.querySelector('meta[name="description"]');
      if (!el) { el = document.createElement('meta'); el.name = 'description'; document.head.appendChild(el); }
      el.content = data.seo.metaDescription;
    }
    if (s.brandName) document.querySelectorAll('.logo-text').forEach(el => el.textContent = s.brandName);

    // Inject social links from settings
    updateSocialLinks(s);

    // Render noticeboard / banner from settings
    renderNoticeboard(s.noticeboard);

    // Show a Sign Out button in the nav if a customer is signed in
    updateNavAuthState();

    // ── Category Navigation Bar ──────────────────────────────────────────────
    const catNav = document.getElementById('category-nav');
    if (catNav && data.categories) {
      catNav.innerHTML = data.categories.map(c => `
        <a href="products.html?cat=${c.id}" class="cat-link" data-cat="${c.id}">
          <span class="cat-icon">${c.icon}</span>
          <span class="cat-name">${c.name}</span>
        </a>`).join('');
    }

    // ── Stock badge helper ───────────────────────────────────────────────────
    function stockBadge(stock) {
      if (stock === undefined || stock === null) return '';
      if (stock <= 0) return `<span class="stock-badge stock-out">Out of Stock</span>`;
      if (stock <= 10) return `<span class="stock-badge stock-low">Low Stock — ${stock} left</span>`;
      return `<span class="stock-badge stock-in">In Stock</span>`;
    }

    // ── Product Card ─────────────────────────────────────────────────────────
    function renderProductCard(p) {
      const imgs = p.images?.length ? p.images : ['https://placehold.co/600x600/e2e8f0/475569?text=No+Image'];
      const firstImg = imgs[0];
      const stockLevel = (typeof p.stockQty === 'number') ? p.stockQty : p.stock;
      const isOutOfStock = typeof stockLevel === 'number' && stockLevel <= 0;

      const priceToUse = isWholesale && p.priceWholesale ? p.priceWholesale : p.price;
      let priceHtml;
      if (isWholesale && p.priceWholesale) {
        priceHtml = `
          <div class="price-group">
            <span class="product-price-old">£${parseFloat(p.price).toFixed(2)}</span>
            <span class="product-price wholesale">£${parseFloat(p.priceWholesale).toFixed(2)}</span>
            <span class="wholesale-badge">B2B</span>
          </div>`;
      } else {
        priceHtml = `<span class="product-price">£${parseFloat(p.price || 0).toFixed(2)}</span>`;
      }

      // Image (slider for multi-image products)
      let imageHtml;
      if (imgs.length > 1) {
        imageHtml = `
          <div class="product-slider">
            ${imgs.map((src, i) => `<img src="${src}" alt="${p.name}" class="slide" style="opacity:${i===0?1:0}" data-index="${i}" loading="lazy">`).join('')}
          </div>`;
      } else {
        imageHtml = `<img src="${firstImg}" alt="${p.name}" class="product-card-img" loading="lazy">`;
      }

      // Stars
      const rating = p.rating || 0;
      const starsHtml = '★'.repeat(Math.floor(rating)) + (rating % 1 >= 0.5 ? '½' : '') + '☆'.repeat(5 - Math.floor(rating) - (rating % 1 >= 0.5 ? 1 : 0));

      const badgeHtml = p.badge
        ? `<span class="card-badge ${p.badge === 'Best Seller' ? 'badge-hot' : 'badge-new'}">${p.badge}</span>`
        : '';

      // Encode product data for onclick
      const productData = JSON.stringify({
        id: p.id,
        name: p.name,
        price: priceToUse,
        image: firstImg
      }).replace(/"/g, '&quot;');

      const cartBtn = isOutOfStock
        ? `<button class="btn-add-cart" disabled style="opacity:0.5;cursor:not-allowed;">Out of Stock</button>`
        : `<button class="btn-add-cart" onclick="addToCart(JSON.parse(this.dataset.product))" data-product="${productData}">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 001.96 1.61h9.72a2 2 0 001.95-1.55l1.57-7.45H6"/>
            </svg>
            Add to Cart
           </button>`;

      return `
        <div class="product-card" data-category="${p.category}" data-price="${p.price}" data-rating="${rating}" data-id="${p.id}">
          <div class="product-card-visual" onclick="location.href='product.html?id=${p.id}'">
            ${badgeHtml}
            ${imageHtml}
          </div>
          <div class="product-card-body">
            <span class="product-card-category">${(data.categories||[]).find(c=>c.id===p.category)?.name || p.category}</span>
            <h3 class="product-card-title" onclick="location.href='product.html?id=${p.id}'">${p.name}</h3>
            <p class="product-card-desc">${p.description}</p>
            <div class="product-card-rating">
              <span class="stars">${starsHtml}</span>
              <span class="rating-num">${rating}</span>
            </div>
            ${stockBadge(stockLevel)}
            <div class="product-card-footer">
              ${priceHtml}
              ${cartBtn}
            </div>
          </div>
        </div>`;
    }

    // ── Own-Brand Card (EAZYOO Originals with Amazon CTA) ────────────────────
    function renderOwnBrandCard(p) {
      const imgs = p.images?.length ? p.images : ['https://placehold.co/600x600/e2e8f0/475569?text=No+Image'];
      const firstImg = imgs[0];
      const rating = p.rating || 0;
      const starsHtml = '★'.repeat(Math.floor(rating)) + (rating % 1 >= 0.5 ? '½' : '') + '☆'.repeat(5 - Math.floor(rating) - (rating % 1 >= 0.5 ? 1 : 0));
      const stockLevel = (typeof p.stockQty === 'number') ? p.stockQty : p.stock;
      const priceToUse = isWholesale && p.priceWholesale ? p.priceWholesale : p.price;
      const productData = JSON.stringify({ id: p.id, name: p.name, price: priceToUse, image: firstImg }).replace(/"/g, '&quot;');
      const amazon = p.amazonUrl && p.amazonUrl !== '#' ? p.amazonUrl : 'https://www.amazon.co.uk/s?me=AGGGQPAQ7YS4X';
      const catName = (data.categories || []).find(c => c.id === p.category)?.name || '';
      return `
        <div class="product-card own-brand-card" data-id="${p.id}">
          <div class="product-card-visual" onclick="location.href='product.html?id=${p.id}'">
            <span class="card-badge badge-amazon">Available on Amazon</span>
            <img src="${firstImg}" alt="${p.name}" class="product-card-img" loading="lazy">
          </div>
          <div class="product-card-body">
            <span class="product-card-category">EAZYOO${catName ? ' · ' + catName : ''}</span>
            <h3 class="product-card-title" onclick="location.href='product.html?id=${p.id}'">${p.name}</h3>
            <p class="product-card-desc">${p.description}</p>
            <div class="product-card-rating">
              <span class="stars">${starsHtml}</span>
              <span class="rating-num">${rating}</span>
            </div>
            ${stockBadge(stockLevel)}
            <div class="product-card-footer">
              <span class="product-price">£${parseFloat(priceToUse || 0).toFixed(2)}</span>
            </div>
            <div class="own-brand-actions">
              <button class="btn-add-cart" onclick="addToCart(JSON.parse(this.dataset.product))" data-product="${productData}">Add to Cart</button>
              <a href="${amazon}" target="_blank" rel="noopener" class="btn-amazon">View on Amazon →</a>
            </div>
          </div>
        </div>`;
    }

    // ── Homepage: EAZYOO Originals (own brand) ───────────────────────────────
    const ownBrandEl = document.getElementById('own-brand-products');
    if (ownBrandEl && data.products) {
      const ownBrand = data.products.filter(p => p.ownBrand);
      ownBrandEl.innerHTML = ownBrand.length
        ? ownBrand.map(renderOwnBrandCard).join('')
        : '<p style="text-align:center; width:100%; color:var(--color-text-light);">Coming soon.</p>';
    }

    // ── Homepage: More From Our Range (everything except own-brand) ───────────
    const dynProducts = document.getElementById('dynamic-products');
    if (dynProducts && data.products) {
      const others = data.products.filter(p => !p.ownBrand);
      const shuffled = [...others].sort(() => Math.random() - 0.5);
      dynProducts.innerHTML = shuffled.slice(0, 8).map(renderProductCard).join('');
    }

    // ── Homepage: Category Showcase ──────────────────────────────────────────
    const catShowcase = document.getElementById('categories-showcase');
    if (catShowcase && data.categories) {
      catShowcase.innerHTML = data.categories.map(c => {
        const count = (data.products||[]).filter(p => p.category === c.id).length;
        return `
          <a href="products.html?cat=${c.id}" class="category-card">
            <span class="category-icon">${c.icon}</span>
            <h4>${c.name}</h4>
            <p>${count} products</p>
          </a>`;
      }).join('');
    }

    // ── Products Page ────────────────────────────────────────────────────────
    const productGrid = document.getElementById('product-grid');
    if (productGrid && data.products) {
      const urlParams = new URLSearchParams(window.location.search);
      const activeCat = urlParams.get('cat') || 'all';
      let products = [...data.products];

      if (activeCat !== 'all') products = products.filter(p => p.category === activeCat);

      const pageTitle = document.getElementById('products-page-title');
      if (pageTitle && activeCat !== 'all') {
        const catObj = (data.categories||[]).find(c => c.id === activeCat);
        if (catObj) pageTitle.textContent = catObj.name;
      }

      const countEl = document.getElementById('product-count');
      if (countEl) countEl.textContent = `${products.length} products`;

      productGrid.innerHTML = products.map(renderProductCard).join('');

      // Category filter sidebar
      const filterContainer = document.getElementById('filter-categories');
      if (filterContainer && data.categories) {
        filterContainer.innerHTML = `
          <a href="products.html" class="filter-cat-btn ${activeCat==='all'?'active':''}" data-cat="all">All Products <span class="filter-count">${data.products.length}</span></a>
          ${data.categories.map(c => {
            const count = data.products.filter(p => p.category === c.id).length;
            return `<a href="products.html?cat=${c.id}" class="filter-cat-btn ${activeCat===c.id?'active':''}" data-cat="${c.id}">${c.icon} ${c.name} <span class="filter-count">${count}</span></a>`;
          }).join('')}`;
      }

      // Price slider
      const priceSlider = document.getElementById('price-range');
      const priceLabel = document.getElementById('price-label');
      const maxPriceInData = Math.ceil(Math.max(...data.products.map(p => parseFloat(p.price||0))));
      if (priceSlider) {
        priceSlider.max = maxPriceInData;
        priceSlider.value = maxPriceInData;
        if (priceLabel) priceLabel.textContent = `Up to £${maxPriceInData}`;
        priceSlider.addEventListener('input', () => {
          const max = parseFloat(priceSlider.value);
          if (priceLabel) priceLabel.textContent = `Up to £${max.toFixed(0)}`;
          document.querySelectorAll('.product-card').forEach(card => {
            card.style.display = parseFloat(card.dataset.price) <= max ? '' : 'none';
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

    // ── Single Product Detail Page (product.html?id=…) ───────────────────────
    const detailView = document.getElementById('product-detail-view');
    if (detailView && data.products) {
      const prodId = new URLSearchParams(window.location.search).get('id');
      const p = data.products.find(x => x.id === prodId);

      if (p) {
        document.title = `${p.name} — EAZYOO`;
        const crumbName = document.getElementById('crumb-product-name');
        if (crumbName) crumbName.textContent = p.name;

        const imgs = p.images && p.images.length ? p.images : ['https://placehold.co/600x600/e2e8f0/475569?text=No+Image'];
        const firstImg = imgs[0];
        const stock = (typeof p.stockQty === 'number') ? p.stockQty : (p.stock || 0);

        let stockHtml;
        if (stock === 0) stockHtml = `<span class="stock-badge stock-out">Out of Stock</span>`;
        else if (stock <= 10) stockHtml = `<span class="stock-badge stock-low">Only ${stock} left</span>`;
        else stockHtml = `<span class="stock-badge stock-in">In Stock (${stock} available)</span>`;

        const priceToUse = isWholesale && p.priceWholesale ? p.priceWholesale : p.price;
        let pricingHtml = `<div class="detail-price">£${parseFloat(p.price).toFixed(2)}</div>`;
        if (isWholesale && p.priceWholesale) {
          pricingHtml = `
            <div class="detail-price-wholesale-wrap">
              <span class="detail-price-old">£${parseFloat(p.price).toFixed(2)}</span>
              <span class="detail-price-wholesale">£${parseFloat(p.priceWholesale).toFixed(2)}</span>
              <span class="wholesale-badge" style="font-size:0.75rem; padding:4px 8px;">B2B Wholesale</span>
            </div>`;
        }

        // Buttons: Add to Cart (our cart engine) + Amazon
        let buttonsHtml = '';
        if (stock > 0) {
          const pdata = JSON.stringify({ id: p.id, name: p.name, price: priceToUse, image: firstImg }).replace(/"/g, '&quot;');
          buttonsHtml += `<button class="detail-btn detail-btn-primary" onclick="addToCart(JSON.parse(this.dataset.product))" data-product="${pdata}">🛒 Add to Cart</button>`;
        } else {
          buttonsHtml += `<button class="detail-btn" style="background:#e5e7eb; color:#9ca3af; cursor:not-allowed; border:none;" disabled>❌ Out of Stock</button>`;
        }
        if (p.amazonUrl && p.amazonUrl !== '#') {
          buttonsHtml += `<a href="${p.amazonUrl}" target="_blank" rel="noopener" class="detail-btn detail-btn-amazon">📦 View on Amazon</a>`;
        }

        let featuresHtml = '';
        if (p.features && p.features.length) {
          featuresHtml = `<div class="detail-features-title">Highlights</div><ul class="detail-features">${p.features.map(f => `<li>${f}</li>`).join('')}</ul>`;
        }

        const specs = [
          { label: 'Brand', value: p.brand || 'EAZYOO' },
          { label: 'SKU Code', value: p.sku || 'EZ-' + p.id.toUpperCase() },
          { label: 'Weight', value: p.weight || 'N/A' },
          { label: 'Dimensions', value: p.dimensions || 'N/A' },
          { label: 'Material', value: p.material || 'Premium Quality' },
          { label: 'Stock Status', value: stock > 0 ? 'Available' : 'Out of stock' }
        ];

        const galleryHtml = `
          <div class="detail-gallery">
            <div class="main-img-wrap">
              <img src="${firstImg}" alt="${p.name}" id="main-product-image">
            </div>
            ${imgs.length > 1 ? `
              <div class="thumb-list">
                ${imgs.map((src, i) => `
                  <div class="thumb-item ${i === 0 ? 'active' : ''}" onclick="switchProductImage('${src}', this)">
                    <img src="${src}" alt="Thumbnail ${i + 1}">
                  </div>`).join('')}
              </div>` : ''}
          </div>`;

        const rating = p.rating || 0;
        const starsHtml = '★'.repeat(Math.floor(rating)) + (rating % 1 >= 0.5 ? '½' : '') + '☆'.repeat(5 - Math.floor(rating) - (rating % 1 >= 0.5 ? 1 : 0));

        detailView.innerHTML = `
          ${galleryHtml}
          <div class="detail-info">
            <div class="detail-brand">${p.brand || 'EAZYOO'}</div>
            <h1 class="detail-title">${p.name}</h1>
            <div class="detail-meta">
              <div class="detail-rating"><span class="stars">${starsHtml}</span><span style="font-weight:600; color:var(--color-text);">${rating}</span></div>
              <span class="detail-sku">SKU: ${p.sku || 'EZ-' + p.id.toUpperCase()}</span>
              ${stockHtml}
            </div>
            <div class="detail-price-wrap">${pricingHtml}</div>
            <p class="detail-desc">${p.fullDescription || p.description}</p>
            <div class="detail-actions"><div class="detail-buttons-row">${buttonsHtml}</div></div>
            ${featuresHtml}
            <div class="detail-specs-title">Specifications</div>
            <table class="detail-specs-table"><tbody>
              ${specs.map(sp => `<tr><td>${sp.label}</td><td>${sp.value}</td></tr>`).join('')}
            </tbody></table>
          </div>`;

        // Related products (same category)
        const relatedGrid = document.getElementById('related-products-grid');
        if (relatedGrid) {
          const related = data.products.filter(x => x.category === p.category && x.id !== p.id).sort(() => Math.random() - 0.5).slice(0, 4);
          relatedGrid.innerHTML = related.length
            ? related.map(renderProductCard).join('')
            : '<p style="color:var(--color-text-light); text-align:center; width:100%;">No related products found.</p>';
        }
      } else {
        detailView.innerHTML = '<p style="text-align:center; padding:100px 0; color:var(--color-text-light); grid-column:span 2;">Product not found.</p>';
      }
    }

    // ── Blog ─────────────────────────────────────────────────────────────────
    const blogList = document.getElementById('dynamic-posts');
    if (blogList && data.posts) {
      blogList.innerHTML = data.posts
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .map(p => `
          <div class="product-card">
            <div class="product-card-visual">
              <img src="${p.imgUrl||'images/hero-banner.png'}" alt="${p.title}" class="product-card-img" style="object-fit:cover;height:220px;" loading="lazy">
            </div>
            <div class="product-card-body">
              <span class="product-card-category">${p.date}</span>
              <h3 class="product-card-title">${p.title}</h3>
              <p class="product-card-desc">${p.excerpt}</p>
              <a href="post.html?id=${p.id}" class="btn-add-cart" style="text-decoration:none;text-align:center;display:block;">Read More →</a>
            </div>
          </div>`).join('');
    }

    // ── Single Post ──────────────────────────────────────────────────────────
    const singlePost = document.getElementById('single-post-view');
    if (singlePost && data.posts) {
      const postId = new URLSearchParams(window.location.search).get('id');
      const post = data.posts.find(p => p.id === postId);
      if (post) {
        document.title = (post.metaTitle || post.title + ' — EAZYOO');
        injectPostSEO(post);
        singlePost.innerHTML = `
          <article style="max-width:760px;margin:0 auto;padding:80px 0;">
            <a href="blog.html" style="color:var(--color-primary,var(--color-ocean-blue));text-decoration:none;font-weight:600;">← Back to Blog</a>
            <h1 style="font-size:2.5rem;margin:24px 0 12px;">${post.title}</h1>
            <p style="color:var(--color-text-light);margin-bottom:32px;">${post.date}</p>
            ${post.imgUrl ? `<img src="${post.imgUrl}" style="width:100%;border-radius:16px;margin-bottom:32px;" loading="lazy" alt="${post.title}">` : ''}
            <div style="line-height:1.85;font-size:1.05rem;">${post.content}</div>
          </article>`;
      } else {
        singlePost.innerHTML = '<p style="text-align:center;padding:100px 0;">Post not found.</p>';
      }
    }

    // ── Image Slider Auto-Play ───────────────────────────────────────────────
    setInterval(() => {
      document.querySelectorAll('.product-slider').forEach(slider => {
        const slides = slider.querySelectorAll('.slide');
        if (slides.length <= 1) return;
        let active = Array.from(slides).findIndex(s => parseFloat(s.style.opacity) === 1);
        if (active < 0) active = 0;
        slides[active].style.opacity = '0';
        slides[(active + 1) % slides.length].style.opacity = '1';
      });
    }, 3000);

  } catch (err) {
    console.error('EAZYOO CMS Error:', err);
  }
});

// ── Noticeboard / Banner ─────────────────────────────────────────────────────
const NB_ICONS = {
  maintenance: { label: '⚠️ Maintenance', emoji: '🚧' },
  deals:       { label: '🔥 Big Deals',   emoji: '🔥' },
  hourly_deal: { label: '⏰ Hourly Deal',  emoji: '⏰' },
  sale:        { label: '💸 Sale',         emoji: '💸' },
  custom:      { label: '📢 Notice',       emoji: '📢' }
};

function renderNoticeboard(nb) {
  if (!nb || !nb.enabled || !nb.text || !nb.text.trim()) return;
  const type  = nb.type || 'custom';
  const speed = nb.speed || 'normal';
  const info  = NB_ICONS[type] || NB_ICONS.custom;
  const inner = `
    <div class="nb-inner">
      <span class="nb-icon-pill">${info.label}</span>
      <div class="nb-marquee-wrap">
        <span class="nb-marquee speed-${speed}">${nb.text}&nbsp;&nbsp;&nbsp;•&nbsp;&nbsp;&nbsp;${nb.text}&nbsp;&nbsp;&nbsp;•&nbsp;&nbsp;&nbsp;${nb.text}</span>
      </div>
      <button class="nb-dismiss" onclick="this.closest('#site-noticeboard').classList.add('nb-hidden')" title="Dismiss">✕</button>
    </div>`;

  // Use the existing placeholder div if present, else insert after the navbar.
  let board = document.getElementById('site-noticeboard');
  if (board) {
    board.className = `nb-type-${type}`;
    board.innerHTML = inner;
  } else {
    const nav = document.getElementById('navbar');
    if (!nav) return;
    board = document.createElement('div');
    board.id = 'site-noticeboard';
    board.className = `nb-type-${type}`;
    board.innerHTML = inner;
    nav.insertAdjacentElement('afterend', board);
  }
}

// ── Nav Sign-Out (shows on every page when a customer is signed in) ──────────
function updateNavAuthState() {
  const session = JSON.parse(sessionStorage.getItem('eazyoo_session') || 'null');
  const navActions = document.querySelector('.nav-actions');
  if (!navActions) return;

  const existing = document.getElementById('nav-signout-btn');
  if (!session) { if (existing) existing.remove(); return; }
  if (existing) return;

  const btn = document.createElement('button');
  btn.id = 'nav-signout-btn';
  btn.title = `Signed in as ${session.email} — click to sign out`;
  btn.style.cssText = 'background:none; border:1px solid rgba(0,95,204,0.3); border-radius:20px; padding:5px 14px; font-size:0.78rem; font-weight:600; color:var(--color-primary,#005fcc); cursor:pointer; display:flex; align-items:center; gap:5px; font-family:inherit; transition:all 0.2s; white-space:nowrap; margin-right:6px;';
  btn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/></svg> Sign Out`;
  btn.onmouseenter = () => { btn.style.background = 'rgba(0,95,204,0.08)'; };
  btn.onmouseleave = () => { btn.style.background = 'none'; };
  btn.onclick = () => {
    sessionStorage.removeItem('eazyoo_session');
    window.location.href = 'account.html';
  };

  const cta = navActions.querySelector('.nav-cta');
  if (cta) navActions.insertBefore(btn, cta);
  else navActions.prepend(btn);
}

// ── Product Detail: switch main image from thumbnail ─────────────────────────
window.switchProductImage = function(src, el) {
  const main = document.getElementById('main-product-image');
  if (main) main.src = src;
  document.querySelectorAll('.thumb-item').forEach(t => t.classList.remove('active'));
  if (el) el.classList.add('active');
};

// ── Social Link Injection ────────────────────────────────────────────────────
function updateSocialLinks(s) {
  const fbLinks   = document.querySelectorAll('a[aria-label="Facebook"]');
  const igLinks   = document.querySelectorAll('a[aria-label="Instagram"]');
  const ttLinks   = document.querySelectorAll('a[aria-label="TikTok"]');

  const fb = (s && s.socialFb && s.socialFb !== '#') ? s.socialFb : 'https://www.facebook.com/eazyoo.ltd';
  const ig = (s && s.socialIg && s.socialIg !== '#') ? s.socialIg : 'https://www.instagram.com/eazyoo.az';

  fbLinks.forEach(a => {
    a.href = fb;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/></svg>`;
  });
  igLinks.forEach(a => {
    a.href = ig;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>`;
  });
  ttLinks.forEach(a => {
    a.href = 'https://www.tiktok.com/@eazyoo';
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V9.17a8.19 8.19 0 004.79 1.52V7.24a4.85 4.85 0 01-1.02-.55z"/></svg>`;
  });
}

// ── Blog Post SEO (meta tags + Article JSON-LD for Google) ───────────────────
function injectPostSEO(post) {
  const setMeta = (key, val, attr = 'name') => {
    if (!val) return;
    let el = document.head.querySelector('meta[' + attr + '="' + key + '"]');
    if (!el) { el = document.createElement('meta'); el.setAttribute(attr, key); document.head.appendChild(el); }
    el.setAttribute('content', val);
  };
  const pageUrl = window.location.href;
  const imgAbs = post.imgUrl ? new URL(post.imgUrl, window.location.href).href : '';
  const desc = post.metaDescription || post.excerpt || '';

  setMeta('description', desc);
  if (post.keywords) setMeta('keywords', post.keywords);
  setMeta('og:title', post.metaTitle || post.title, 'property');
  setMeta('og:description', desc, 'property');
  setMeta('og:type', 'article', 'property');
  setMeta('og:url', pageUrl, 'property');
  if (imgAbs) setMeta('og:image', imgAbs, 'property');
  setMeta('twitter:card', 'summary_large_image');
  setMeta('twitter:title', post.metaTitle || post.title);
  setMeta('twitter:description', desc);
  if (imgAbs) setMeta('twitter:image', imgAbs);

  // Canonical URL
  let canon = document.head.querySelector('link[rel="canonical"]');
  if (!canon) { canon = document.createElement('link'); canon.rel = 'canonical'; document.head.appendChild(canon); }
  canon.href = pageUrl;

  // Article structured data (JSON-LD) so Google can index it as an article
  const ld = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": post.title,
    "description": desc,
    "datePublished": post.date,
    "author": { "@type": "Organization", "name": "EAZYOO" },
    "publisher": { "@type": "Organization", "name": "EAZYOO" },
    "mainEntityOfPage": { "@type": "WebPage", "@id": pageUrl }
  };
  if (imgAbs) ld.image = imgAbs;
  let script = document.getElementById('post-jsonld');
  if (!script) { script = document.createElement('script'); script.type = 'application/ld+json'; script.id = 'post-jsonld'; document.head.appendChild(script); }
  script.textContent = JSON.stringify(ld);
}
