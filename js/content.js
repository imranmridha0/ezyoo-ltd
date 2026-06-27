/**
 * EAZYOO Content Manager
 * Reads saved admin settings from localStorage and applies them to every page.
 * Include this script at the bottom of every HTML page.
 */
(function() {
  const data = JSON.parse(localStorage.getItem('eazyoo_content') || '{}');
  if (!data || Object.keys(data).length === 0) return;

  function set(sel, prop, val) {
    if (!val) return;
    document.querySelectorAll(sel).forEach(el => { el[prop] = val; });
  }
  function setSrc(sel, val) { if (!val) return; document.querySelectorAll(sel).forEach(el => el.src = val); }
  function setHref(sel, val) { if (!val) return; document.querySelectorAll(sel).forEach(el => el.href = val); }

  // Brand / Logo
  if (data.brandName) document.querySelectorAll('.logo-text').forEach(el => el.textContent = data.brandName);

  // Hero section
  if (data.heroTagline) {
    const h1 = document.querySelector('.hero h1');
    if (h1) h1.innerHTML = data.heroTagline.replace('. ', '.<br>');
  }
  if (data.heroSubtitle) set('.hero-subtitle', 'textContent', data.heroSubtitle);
  if (data.heroImgUrl) setSrc('.hero-bg img', data.heroImgUrl);
  if (data.ctaText) {
    const btn = document.querySelector('.hero-buttons .btn-primary');
    if (btn) { const icon = btn.querySelector('.btn-icon'); btn.textContent = data.ctaText; if(icon) btn.prepend(icon); }
  }
  if (data.ctaUrl) {
    const btn = document.querySelector('.hero-buttons .btn-primary');
    if (btn) btn.href = data.ctaUrl;
  }
  if (data.navCtaText) set('.nav-cta', 'textContent', data.navCtaText);

  // Product 1 - Water Bottle
  if (data.p1ImgUrl) setSrc('#water-bottle img, .product-card:first-child img', data.p1ImgUrl);
  if (data.p1Name) set('#water-bottle h2', 'textContent', data.p1Name);
  if (data.p1Desc) {
    const desc = document.querySelector('#water-bottle .about-content > p');
    if (desc) desc.textContent = data.p1Desc;
  }
  if (data.p1Price) {
    const price = document.querySelector('#water-bottle [style*="font-size: 2rem"]');
    if (price) price.textContent = data.p1Price.startsWith('£') ? data.p1Price : '£' + data.p1Price;
  }
  if (data.p1Rating) {
    const rating = document.querySelector('#water-bottle [style*="color-warm-amber"] span');
    if (rating) rating.textContent = data.p1Rating;
  }
  if (data.p1Category) {
    const cat = document.querySelector('#water-bottle .section-label');
    if (cat) cat.textContent = data.p1Category;
  }
  if (data.p1AmazonUrl) {
    const btn = document.querySelector('#water-bottle .btn-primary');
    if (btn) btn.href = data.p1AmazonUrl;
  }
  if (data.p1Features && data.p1Features.length) {
    const ul = document.querySelector('#water-bottle ul');
    if (ul) {
      ul.innerHTML = data.p1Features.map(f =>
        '<li style="padding: var(--space-sm) 0; color: var(--color-text-light); display: flex; gap: var(--space-sm);"><span>&#x2705;</span><span>' + f + '</span></li>'
      ).join('');
    }
  }

  // Product 2 - Cutting Board
  if (data.p2ImgUrl) setSrc('#cutting-board img', data.p2ImgUrl);
  if (data.p2Name) set('#cutting-board h2', 'textContent', data.p2Name);
  if (data.p2Desc) {
    const desc = document.querySelector('#cutting-board .about-content > p');
    if (desc) desc.textContent = data.p2Desc;
  }
  if (data.p2Price) {
    const price = document.querySelector('#cutting-board [style*="font-size: 2rem"]');
    if (price) price.textContent = data.p2Price.startsWith('£') ? data.p2Price : '£' + data.p2Price;
  }
  if (data.p2Badge) {
    const badge = document.querySelector('#cutting-board [style*="color: white"]');
    if (badge) badge.textContent = data.p2Badge;
  }
  if (data.p2Category) {
    const cat = document.querySelector('#cutting-board .section-label');
    if (cat) cat.textContent = data.p2Category;
  }
  if (data.p2AmazonUrl) {
    const btn = document.querySelector('#cutting-board .btn-secondary');
    if (btn) btn.href = data.p2AmazonUrl;
  }
  if (data.p2Features && data.p2Features.length) {
    const ul = document.querySelector('#cutting-board ul');
    if (ul) {
      ul.innerHTML = data.p2Features.map(f =>
        '<li style="padding: var(--space-sm) 0; color: var(--color-text-light); display: flex; gap: var(--space-sm);"><span>&#x2705;</span><span>' + f + '</span></li>'
      ).join('');
    }
  }

  // Homepage product cards (index.html)
  const cards = document.querySelectorAll('.products-grid .product-card, #products .product-card');
  if (cards.length >= 1) {
    if (data.p1ImgUrl) { const img = cards[0].querySelector('img'); if(img) img.src = data.p1ImgUrl; }
    if (data.p1Name)   { const h = cards[0].querySelector('h3'); if(h) h.textContent = data.p1Name; }
    if (data.p1Price)  { const p = cards[0].querySelector('.product-price'); if(p) p.textContent = data.p1Price.startsWith('£') ? data.p1Price : '£'+data.p1Price; }
    if (data.p1AmazonUrl) { const a = cards[0].querySelector('a[href*="amazon"]'); if(a) a.href = data.p1AmazonUrl; }
  }
  if (cards.length >= 2) {
    if (data.p2ImgUrl) { const img = cards[1].querySelector('img'); if(img) img.src = data.p2ImgUrl; }
    if (data.p2Name)   { const h = cards[1].querySelector('h3'); if(h) h.textContent = data.p2Name; }
    if (data.p2Price)  { const p = cards[1].querySelector('.product-price'); if(p) p.textContent = data.p2Price.startsWith('£') ? data.p2Price : '£'+data.p2Price; }
    if (data.p2AmazonUrl) { const a = cards[1].querySelector('a[href*="amazon"]'); if(a) a.href = data.p2AmazonUrl; }
  }

  // Page title update
  if (data.brandName) {
    document.title = document.title.replace(/EAZYOO/g, data.brandName);
  }
})();
