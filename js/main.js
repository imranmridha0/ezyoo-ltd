/* ============================================
   EAZYOO Main JavaScript
   Handles: Navigation, Animations, Forms
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initMobileMenu();
  initScrollReveal();
  initSmoothScroll();
});

/* === NAVBAR SCROLL EFFECT === */
function initNavbar() {
  const navbar = document.getElementById('navbar');
  if (!navbar) return;

  let lastScroll = 0;
  
  window.addEventListener('scroll', () => {
    const currentScroll = window.scrollY;
    
    if (currentScroll > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
    
    lastScroll = currentScroll;
  }, { passive: true });
}

/* === MOBILE MENU TOGGLE === */
function initMobileMenu() {
  const toggle = document.getElementById('mobileToggle');
  const navLinks = document.getElementById('navLinks');
  if (!toggle || !navLinks) return;

  toggle.addEventListener('click', () => {
    toggle.classList.toggle('active');
    navLinks.classList.toggle('open');
    document.body.style.overflow = navLinks.classList.contains('open') ? 'hidden' : '';
  });

  // Close menu when clicking a link
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      toggle.classList.remove('active');
      navLinks.classList.remove('open');
      document.body.style.overflow = '';
    });
  });

  // Close menu on outside click
  document.addEventListener('click', (e) => {
    if (!toggle.contains(e.target) && !navLinks.contains(e.target)) {
      toggle.classList.remove('active');
      navLinks.classList.remove('open');
      document.body.style.overflow = '';
    }
  });
}

/* === SCROLL REVEAL ANIMATION === */
function initScrollReveal() {
  const reveals = document.querySelectorAll('.reveal');
  if (reveals.length === 0) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  });

  reveals.forEach(el => observer.observe(el));
}

/* === SMOOTH SCROLL FOR ANCHOR LINKS === */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      
      const target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        const navHeight = document.getElementById('navbar')?.offsetHeight || 72;
        const targetPosition = target.offsetTop - navHeight - 20;
        
        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      }
    });
  });
}

/* === FORM HANDLERS === */

// Wholesale Form
function handleWholesaleSubmit(event) {
  event.preventDefault();
  
  const form = event.target;
  const formData = new FormData(form);
  const data = {};
  formData.forEach((value, key) => {
    if (data[key]) {
      // Handle multiple values (checkboxes)
      if (Array.isArray(data[key])) {
        data[key].push(value);
      } else {
        data[key] = [data[key], value];
      }
    } else {
      data[key] = value;
    }
  });
  
  // Log data (in production, send to your email service / API)
  console.log('Wholesale Application Submitted:', data);
  
  // Show success message
  form.style.display = 'none';
  const success = document.getElementById('wholesaleSuccess');
  if (success) {
    success.classList.add('show');
  }
  
  // Scroll to top of form
  const container = document.getElementById('wholesaleFormContainer');
  if (container) {
    container.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

// Collaboration Form
function handleCollabSubmit(event) {
  event.preventDefault();
  
  const form = event.target;
  const formData = new FormData(form);
  const data = {};
  formData.forEach((value, key) => {
    data[key] = value;
  });
  
  console.log('Collaboration Enquiry Submitted:', data);
  
  form.style.display = 'none';
  const success = document.getElementById('collabSuccess');
  if (success) {
    success.classList.add('show');
  }
  
  const container = document.getElementById('collabFormContainer');
  if (container) {
    container.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

/* === NEWSLETTER SIGNUP (Footer) === */
document.addEventListener('DOMContentLoaded', () => {
  const newsletterBtns = document.querySelectorAll('.footer-newsletter button');
  
  newsletterBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      const input = this.parentElement.querySelector('input');
      const email = input?.value?.trim();
      
      if (!email || !email.includes('@')) {
        input.style.borderColor = '#EF4444';
        input.focus();
        setTimeout(() => { input.style.borderColor = ''; }, 2000);
        return;
      }
      
      console.log('Newsletter signup:', email);
      
      // Visual feedback
      const originalText = this.textContent;
      this.textContent = '✓ Subscribed!';
      this.style.background = '#4A7C59';
      input.value = '';
      
      setTimeout(() => {
        this.textContent = originalText;
        this.style.background = '';
      }, 3000);
    });
  });
});

/* === PRODUCT CARD HOVER PARALLAX (SUBTLE) === */
document.addEventListener('DOMContentLoaded', () => {
  const cards = document.querySelectorAll('.product-card');
  
  cards.forEach(card => {
    const img = card.querySelector('.product-card-image img');
    if (!img) return;
    
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      
      img.style.transform = `scale(1.05) translate(${x * 8}px, ${y * 8}px)`;
    });
    
    card.addEventListener('mouseleave', () => {
      img.style.transform = 'scale(1)';
    });
  });
});
