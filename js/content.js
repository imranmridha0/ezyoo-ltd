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
          <div class="product-card-visual">
            ${badgeHtml}
            ${imageHtml}
          </div>
          <div class="product-card-body">
            <span class="product-card-category">${(data.categories||[]).find(c=>c.id===p.category)?.name || p.category}</span>
            <h3 class="product-card-title">${p.name}</h3>
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
          <div class="product-card-visual">
            <span class="card-badge badge-amazon">Available on Amazon</span>
            <img src="${firstImg}" alt="${p.name}" class="product-card-img" loading="lazy">
          </div>
          <div class="product-card-body">
            <span class="product-card-category">EAZYOO${catName ? ' · ' + catName : ''}</span>
            <h3 class="product-card-title">${p.name}</h3>
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
