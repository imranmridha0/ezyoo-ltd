/**
 * EAZYOO CMS Content Manager
 * Fetches data.json and populates the page dynamically.
 */
document.addEventListener('DOMContentLoaded', async () => {
  try {
    // 1. Fetch data
    const res = await fetch('data.json');
    if (!res.ok) throw new Error('Could not load site data');
    const data = await res.json();
    
    // Helper functions
    const set = (sel, prop, val) => {
      if (!val) return;
      document.querySelectorAll(sel).forEach(el => el[prop] = val);
    };
    const setSrc = (sel, val) => {
      if (!val) return;
      document.querySelectorAll(sel).forEach(el => el.src = val);
    };
    const setHref = (sel, val) => {
      if (!val) return;
      document.querySelectorAll(sel).forEach(el => el.href = val);
    };

    // ==========================================
    // INJECT SETTINGS & SEO
    // ==========================================
    const s = data.settings || {};
    
    // SEO
    if (data.seo) {
      if (data.seo.metaTitle) document.title = data.seo.metaTitle;
      if (data.seo.metaDescription) {
        let metaDesc = document.querySelector('meta[name="description"]');
        if (!metaDesc) {
          metaDesc = document.createElement('meta');
          metaDesc.name = 'description';
          document.head.appendChild(metaDesc);
        }
        metaDesc.content = data.seo.metaDescription;
      }
    }

    // Brand
    if (s.brandName) document.querySelectorAll('.logo-text').forEach(el => el.textContent = s.brandName);

    // Hero
    if (s.heroTagline) {
      const h1 = document.querySelector('.hero h1');
      if (h1) h1.innerHTML = s.heroTagline.replace('. ', '.<br>');
    }
    set('.hero-subtitle', 'textContent', s.heroSubtitle);
    setSrc('.hero-bg img', s.heroImgUrl);
    
    if (s.ctaText) {
      const btn = document.querySelector('.hero-buttons .btn-primary');
      if (btn) { const icon = btn.querySelector('.btn-icon'); btn.textContent = s.ctaText; if(icon) btn.prepend(icon); }
    }
    if (s.ctaUrl) setHref('.hero-buttons .btn-primary', s.ctaUrl);
    set('.nav-cta', 'textContent', s.navCtaText);

    // Contact
    if (s.contactEmail) {
      document.querySelectorAll('p, a').forEach(el => {
        if (el.textContent.includes('hello@eazyoo.co.uk')) el.textContent = el.textContent.replace('hello@eazyoo.co.uk', s.contactEmail);
        if (el.href && el.href.includes('mailto:hello@eazyoo.co.uk')) el.href = el.href.replace('hello@eazyoo.co.uk', s.contactEmail);
      });
    }
    if (s.contactPhone) {
      const f = document.querySelector('.footer-bottom p');
      if (f && !f.textContent.includes('Tel:')) f.innerHTML += ` | Tel: ${s.contactPhone}`;
    }

    // Social
    const socials = [{l:'Facebook',u:s.socialFb},{l:'Instagram',u:s.socialIg},{l:'TikTok',u:s.socialTt},{l:'YouTube',u:s.socialYt}];
    socials.forEach(soc => {
      const link = document.querySelector(`.social-links a[aria-label="${soc.l}"]`);
      if (link) {
        if (soc.u && soc.u !== '#') { link.href = soc.u; link.style.display = 'inline-flex'; } 
        else { link.style.display = 'none'; }
      }
    });

    // ==========================================
    // RENDER PRODUCTS
    // ==========================================
    const prodContainers = document.querySelectorAll('#dynamic-products, .products-grid');
    if (prodContainers.length > 0 && data.products) {
      
      const renderProductCard = (p) => `
        <div class="product-card" id="${p.id}">
          <div class="product-img-wrapper">
            <img src="${p.imgUrl}" alt="${p.name}">
            ${p.badge ? `<div style="position:absolute;top:15px;right:15px;background:var(--color-primary);color:white;padding:4px 12px;border-radius:20px;font-size:0.8rem;font-weight:600;">${p.badge}</div>` : ''}
          </div>
          <div class="product-info">
            <div style="font-size:0.8rem;color:var(--color-primary);font-weight:600;margin-bottom:8px;">${p.category || ''}</div>
            <h3>${p.name}</h3>
            <p>${p.description}</p>
            <ul style="margin:16px 0; list-style:none; padding:0;">
              ${(p.features||[]).map(f => `<li style="padding:4px 0; color:var(--color-text-light); display:flex; gap:8px;"><span>&#x2705;</span><span>${f}</span></li>`).join('')}
            </ul>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-top:20px;">
              <span style="font-size:1.5rem; font-weight:700;">${p.price.toString().startsWith('£') ? p.price : '£'+p.price}</span>
              <a href="${p.amazonUrl}" target="_blank" class="btn btn-primary">Buy on Amazon</a>
            </div>
          </div>
        </div>
      `;

      prodContainers.forEach(container => {
        // Clear old static products if any
        if (container.id === 'dynamic-products' || container.innerHTML.includes('product-card')) {
          container.innerHTML = data.products.map(renderProductCard).join('');
        }
      });
    }

    // ==========================================
    // RENDER POSTS (BLOG)
    // ==========================================
    const blogListContainer = document.getElementById('dynamic-posts');
    if (blogListContainer && data.posts) {
      const renderPostCard = (p) => `
        <div class="product-card">
          <div class="product-img-wrapper" style="height:200px;">
            <img src="${p.imgUrl || 'images/hero-banner.png'}" style="object-fit:cover; width:100%; height:100%;">
          </div>
          <div class="product-info">
            <div style="font-size:0.8rem;color:var(--color-text-light);margin-bottom:8px;">${p.date}</div>
            <h3>${p.title}</h3>
            <p style="margin: 12px 0;">${p.excerpt}</p>
            <a href="post.html?id=${p.id}" class="btn btn-secondary" style="width:100%; text-align:center;">Read More</a>
          </div>
        </div>
      `;
      blogListContainer.innerHTML = data.posts.sort((a,b)=>new Date(b.date)-new Date(a.date)).map(renderPostCard).join('');
    }

    // ==========================================
    // RENDER SINGLE POST
    // ==========================================
    const singlePostContainer = document.getElementById('single-post-view');
    if (singlePostContainer && data.posts) {
      const urlParams = new URLSearchParams(window.location.search);
      const postId = urlParams.get('id');
      const post = data.posts.find(p => p.id === postId);
      
      if (!post) {
        singlePostContainer.innerHTML = '<h2>Post not found</h2><a href="blog.html">Back to Blog</a>';
      } else {
        document.title = post.title + " | " + (s.brandName || 'EAZYOO');
        singlePostContainer.innerHTML = `
          <div style="text-align:center; max-width:800px; margin:0 auto; padding-bottom:40px;">
            <div style="font-size:0.9rem; color:var(--color-text-light); margin-bottom:12px;">${post.date}</div>
            <h1 style="font-size:2.5rem; margin-bottom:30px;">${post.title}</h1>
            <img src="${post.imgUrl || 'images/hero-banner.png'}" style="width:100%; border-radius:12px; margin-bottom:40px; box-shadow:0 15px 40px rgba(0,0,0,0.1);">
            <div style="text-align:left; font-size:1.1rem; line-height:1.8; color:var(--color-text);">
              ${post.content}
            </div>
            <div style="margin-top:50px; text-align:center;">
              <a href="blog.html" class="btn btn-secondary">← Back to all posts</a>
            </div>
          </div>
        `;
      }
    }

  } catch (err) {
    console.error('Error loading CMS data:', err);
  }
});
