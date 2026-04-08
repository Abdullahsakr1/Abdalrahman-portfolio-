/* ============================================
   MAIN APPLICATION LOGIC
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize all modules
  initLoading();
  initNavbar();
  initHeroCanvas();
  initBackToTop();

  // Load dynamic content first, then init filters, animations, and language
  loadDynamicContent().then(() => {
    initPortfolioFilter();
    initScrollAnimations();
    initProjectModal();
    initLanguage(); // from language.js
  });
});

/* ============================================
   LOADING SCREEN
   ============================================ */
function initLoading() {
  const loader = document.querySelector('.loading-screen');
  if (!loader) return;

  window.addEventListener('load', () => {
    setTimeout(() => {
      loader.classList.add('hidden');
      document.body.style.overflow = '';
    }, 800);
  });

  // Fallback: hide loader after 3s max
  setTimeout(() => {
    loader.classList.add('hidden');
    document.body.style.overflow = '';
  }, 3000);

  // Prevent scroll during loading
  document.body.style.overflow = 'hidden';
}

/* ============================================
   NAVBAR
   ============================================ */
function initNavbar() {
  const navbar = document.querySelector('.navbar');
  const hamburger = document.querySelector('.hamburger');
  const mobileNav = document.querySelector('.mobile-nav');
  const mobileNavLinks = document.querySelectorAll('.mobile-nav a');
  const navLinks = document.querySelectorAll('.nav-links a[href^="#"]');

  // Scroll effect
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });

  // Hamburger toggle
  if (hamburger) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('active');
      mobileNav.classList.toggle('active');
      document.body.style.overflow = mobileNav.classList.contains('active') ? 'hidden' : '';
    });
  }

  // Close mobile nav on link click
  mobileNavLinks.forEach(link => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('active');
      mobileNav.classList.remove('active');
      document.body.style.overflow = '';
    });
  });

  // Active nav link on scroll
  const sections = document.querySelectorAll('section[id]');

  function updateActiveLink() {
    const scrollY = window.scrollY + 200;
    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.offsetHeight;
      const sectionId = section.getAttribute('id');
      if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
        navLinks.forEach(link => {
          link.classList.remove('active');
          if (link.getAttribute('href') === `#${sectionId}`) {
            link.classList.add('active');
          }
        });
      }
    });
  }

  window.addEventListener('scroll', updateActiveLink);
  updateActiveLink();
}

/* ============================================
   HERO CANVAS ANIMATION
   Floating design-related shapes (pen tool,
   circles, triangles, squares) with particles
   and connecting lines — a creative, graphic
   design-themed animated background.
   ============================================ */
function initHeroCanvas() {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let animationId;
  let particles = [];
  let shapes = [];
  let mouse = { x: -1000, y: -1000 };

  // Resize canvas
  function resize() {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  // Track mouse for interactive glow
  canvas.parentElement.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
  });
  canvas.parentElement.addEventListener('mouseleave', () => {
    mouse.x = -1000;
    mouse.y = -1000;
  });

  // Colors
  const gold = 'rgba(212, 168, 83,';
  const goldLight = 'rgba(232, 201, 117,';

  // Shape types for graphic design theme
  const shapeTypes = ['circle', 'triangle', 'square', 'diamond', 'ring', 'cross', 'dot'];

  // Create floating shapes
  function createShape() {
    const type = shapeTypes[Math.floor(Math.random() * shapeTypes.length)];
    return {
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 20 + 8,
      speedX: (Math.random() - 0.5) * 0.4,
      speedY: (Math.random() - 0.5) * 0.4,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.01,
      opacity: Math.random() * 0.25 + 0.05,
      type: type,
      pulsePhase: Math.random() * Math.PI * 2,
    };
  }

  // Create small particles
  function createParticle() {
    return {
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      size: Math.random() * 2 + 0.5,
      speedX: (Math.random() - 0.5) * 0.3,
      speedY: (Math.random() - 0.5) * 0.3,
      opacity: Math.random() * 0.4 + 0.1,
    };
  }

  // Initialize
  const shapeCount = Math.min(Math.floor(canvas.width / 60), 25);
  const particleCount = Math.min(Math.floor(canvas.width / 20), 60);

  for (let i = 0; i < shapeCount; i++) shapes.push(createShape());
  for (let i = 0; i < particleCount; i++) particles.push(createParticle());

  // Draw individual shape
  function drawShape(shape) {
    ctx.save();
    ctx.translate(shape.x, shape.y);
    ctx.rotate(shape.rotation);

    // Proximity glow effect
    const dist = Math.hypot(mouse.x - shape.x, mouse.y - shape.y);
    const glowMultiplier = dist < 200 ? 1 + (1 - dist / 200) * 1.5 : 1;
    const pulse = Math.sin(Date.now() * 0.001 + shape.pulsePhase) * 0.1 + 1;
    const finalOpacity = Math.min(shape.opacity * glowMultiplier * pulse, 0.6);

    const color = glowMultiplier > 1.3 ? goldLight : gold;
    ctx.strokeStyle = `${color} ${finalOpacity})`;
    ctx.fillStyle = `${color} ${finalOpacity * 0.15})`;
    ctx.lineWidth = 1;

    const s = shape.size;

    switch (shape.type) {
      case 'circle':
        ctx.beginPath();
        ctx.arc(0, 0, s, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fill();
        break;

      case 'triangle':
        ctx.beginPath();
        ctx.moveTo(0, -s);
        ctx.lineTo(-s * 0.866, s * 0.5);
        ctx.lineTo(s * 0.866, s * 0.5);
        ctx.closePath();
        ctx.stroke();
        ctx.fill();
        break;

      case 'square':
        ctx.beginPath();
        ctx.rect(-s * 0.7, -s * 0.7, s * 1.4, s * 1.4);
        ctx.stroke();
        ctx.fill();
        break;

      case 'diamond':
        ctx.beginPath();
        ctx.moveTo(0, -s);
        ctx.lineTo(s * 0.7, 0);
        ctx.lineTo(0, s);
        ctx.lineTo(-s * 0.7, 0);
        ctx.closePath();
        ctx.stroke();
        ctx.fill();
        break;

      case 'ring':
        ctx.beginPath();
        ctx.arc(0, 0, s, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, 0, s * 0.5, 0, Math.PI * 2);
        ctx.stroke();
        break;

      case 'cross':
        ctx.beginPath();
        ctx.moveTo(-s, 0);
        ctx.lineTo(s, 0);
        ctx.moveTo(0, -s);
        ctx.lineTo(0, s);
        ctx.stroke();
        break;

      case 'dot':
        ctx.beginPath();
        ctx.arc(0, 0, s * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = `${color} ${finalOpacity * 0.6})`;
        ctx.fill();
        break;
    }

    ctx.restore();
  }

  // Draw connecting lines between nearby shapes
  function drawConnections() {
    const maxDist = 180;
    for (let i = 0; i < shapes.length; i++) {
      for (let j = i + 1; j < shapes.length; j++) {
        const dist = Math.hypot(shapes[i].x - shapes[j].x, shapes[i].y - shapes[j].y);
        if (dist < maxDist) {
          const opacity = (1 - dist / maxDist) * 0.08;
          ctx.strokeStyle = `${gold} ${opacity})`;
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(shapes[i].x, shapes[i].y);
          ctx.lineTo(shapes[j].x, shapes[j].y);
          ctx.stroke();
        }
      }
    }
  }

  // Draw gradient vignette overlay
  function drawOverlay() {
    const gradient = ctx.createRadialGradient(
      canvas.width / 2, canvas.height / 2, 0,
      canvas.width / 2, canvas.height / 2, canvas.width * 0.7
    );
    gradient.addColorStop(0, 'rgba(10, 10, 15, 0)');
    gradient.addColorStop(1, 'rgba(10, 10, 15, 0.6)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Bottom fade for content readability
    const bottomGrad = ctx.createLinearGradient(0, canvas.height * 0.6, 0, canvas.height);
    bottomGrad.addColorStop(0, 'rgba(10, 10, 15, 0)');
    bottomGrad.addColorStop(1, 'rgba(10, 10, 15, 0.85)');
    ctx.fillStyle = bottomGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // Animation loop
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background base
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle gradient background
    const bgGrad = ctx.createRadialGradient(
      canvas.width * 0.3, canvas.height * 0.3, 0,
      canvas.width * 0.3, canvas.height * 0.3, canvas.width * 0.6
    );
    bgGrad.addColorStop(0, 'rgba(26, 26, 46, 0.5)');
    bgGrad.addColorStop(1, 'rgba(10, 10, 15, 0)');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw & update particles
    particles.forEach(p => {
      p.x += p.speedX;
      p.y += p.speedY;

      // Wrap around
      if (p.x < 0) p.x = canvas.width;
      if (p.x > canvas.width) p.x = 0;
      if (p.y < 0) p.y = canvas.height;
      if (p.y > canvas.height) p.y = 0;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `${gold} ${p.opacity})`;
      ctx.fill();
    });

    // Draw connections
    drawConnections();

    // Draw & update shapes
    shapes.forEach(s => {
      s.x += s.speedX;
      s.y += s.speedY;
      s.rotation += s.rotationSpeed;

      // Wrap around
      if (s.x < -50) s.x = canvas.width + 50;
      if (s.x > canvas.width + 50) s.x = -50;
      if (s.y < -50) s.y = canvas.height + 50;
      if (s.y > canvas.height + 50) s.y = -50;

      drawShape(s);
    });

    // Overlay for readability
    drawOverlay();

    animationId = requestAnimationFrame(animate);
  }

  animate();

  // Pause animation when not visible
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        if (!animationId) animate();
      } else {
        cancelAnimationFrame(animationId);
        animationId = null;
      }
    });
  });
  observer.observe(canvas);
}

/* ============================================
   XSS SANITIZATION
   ============================================ */
function escapeHTML(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

function sanitizeURL(url) {
  if (!url) return '';
  const trimmed = url.trim();
  if (/^javascript:/i.test(trimmed)) return '';
  if (/^data:(?!image\/)/i.test(trimmed)) return '';
  return escapeHTML(trimmed);
}

/* ============================================
   DYNAMIC CONTENT LOADING
   Loads projects, certificates, about, and
   contact from Firebase Firestore collections
   ============================================ */
async function loadDynamicContent() {
  await Promise.all([
    loadProjects(),
    loadCertificates(),
    loadAbout(),
    loadContact()
  ]);
}

// Get current language
function getLang() {
  return localStorage.getItem('lang') || 'en';
}

/* ---- PROJECTS (Firestore) ---- */
let portfolioProjects = [];

async function loadProjects() {
  try {
    const snapshot = await db.collection('projects').orderBy('createdAt', 'desc').get();
    portfolioProjects = snapshot.docs.map(doc => doc.data());
  } catch (error) {
    console.error('Error loading projects from Firestore:', error);
    portfolioProjects = [];
  }
  renderProjects();
}

function renderProjects() {
  const grid = document.getElementById('portfolio-grid');
  if (!grid) return;

  const lang = getLang();
  const viewText = lang === 'ar' ? 'عرض المشروع' : 'View Project';

  if (portfolioProjects.length === 0) {
    grid.innerHTML = '<p style="text-align:center;color:var(--text-muted);grid-column:1/-1;padding:40px;">No projects available yet.</p>';
    return;
  }

  grid.innerHTML = portfolioProjects.map((p, idx) => {
    const title = escapeHTML(p.title ? (p.title[lang] || p.title.en || '') : '');
    const desc = escapeHTML(p.desc ? (p.desc[lang] || p.desc.en || '') : '');
    const cat = escapeHTML(p.categoryLabel ? (p.categoryLabel[lang] || p.categoryLabel.en || p.category) : p.category);
    // Use first image from media array, fallback to image field
    const firstImage = getFirstMediaImage(p);
    const img = sanitizeURL(firstImage || 'images/project-branding.png');
    const category = escapeHTML(p.category || '');
    const id = escapeHTML(p.id || 'project-' + idx);

    return `
      <article class="project-card" data-category="${category}" id="${id}">
        <div class="project-image">
          <img src="${img}" alt="${title}" loading="lazy">
          <div class="project-overlay">
            <a href="javascript:void(0)" class="project-overlay-btn" data-project-idx="${idx}">${viewText}</a>
          </div>
        </div>
        <div class="project-info">
          <span class="project-category">${cat}</span>
          <h3 class="project-title">${title}</h3>
          <p class="project-desc">${desc}</p>
        </div>
      </article>
    `;
  }).join('');
}

/**
 * Get the first image URL from a project's media array, with fallback to image field.
 */
function getFirstMediaImage(project) {
  if (project.media && Array.isArray(project.media)) {
    const firstImg = project.media.find(m => m.type === 'image');
    if (firstImg) return firstImg.url;
  }
  return project.image || '';
}

/**
 * Detect media type from a URL based on file extension.
 */
function detectMediaTypeFromURL(url) {
  if (!url) return 'file';
  const ext = url.split('.').pop().split('?')[0].toLowerCase();
  const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico'];
  const videoExts = ['mp4', 'webm', 'ogg', 'mov', 'avi'];
  if (imageExts.includes(ext)) return 'image';
  if (videoExts.includes(ext)) return 'video';
  return 'file';
}

/**
 * Get file extension from URL or filename.
 */
function getFileExtension(url) {
  if (!url) return '';
  return url.split('.').pop().split('?')[0].toLowerCase();
}

/**
 * Get the display name from a media item.
 */
function getMediaDisplayName(mediaItem) {
  if (mediaItem.name) return mediaItem.name;
  const parts = mediaItem.url.split('/');
  return parts[parts.length - 1].split('?')[0] || 'File';
}

/* ---- CERTIFICATES (Firestore) ---- */
let portfolioCertificates = [];

async function loadCertificates() {
  try {
    const snapshot = await db.collection('certificates').orderBy('createdAt', 'desc').get();
    portfolioCertificates = snapshot.docs.map(doc => doc.data());
  } catch (error) {
    console.error('Error loading certificates from Firestore:', error);
    portfolioCertificates = [];
  }
  renderCertificates();
}

function renderCertificates() {
  const grid = document.getElementById('certificates-grid');
  if (!grid) return;

  const lang = getLang();

  if (portfolioCertificates.length === 0) {
    grid.innerHTML = '<p style="text-align:center;color:var(--text-muted);grid-column:1/-1;padding:40px;">No certificates available yet.</p>';
    return;
  }

  grid.innerHTML = portfolioCertificates.map((c, idx) => {
    const title = escapeHTML(c.title ? (c.title[lang] || c.title.en || '') : '');
    const org = escapeHTML(c.org ? (c.org[lang] || c.org.en || '') : '');
    const img = sanitizeURL(c.image || 'images/certificate.png');
    const id = escapeHTML(c.id || 'cert-' + idx);

    return `
      <article class="certificate-card" id="${id}">
        <div class="certificate-image">
          <img src="${img}" alt="${title}" loading="lazy" width="600" height="413">
        </div>
        <div class="certificate-info">
          <h3 class="certificate-title">${title}</h3>
          <span class="certificate-org">${org}</span>
        </div>
      </article>
    `;
  }).join('');
}

/* ---- ABOUT (Firestore) ---- */
let portfolioAbout = null;

async function loadAbout() {
  try {
    const doc = await db.collection('about').doc('info').get();
    if (doc.exists) {
      portfolioAbout = doc.data();
      applyAbout();
    }
  } catch (error) {
    console.error('Error loading about from Firestore:', error);
  }
}

function applyAbout() {
  if (!portfolioAbout) return;
  const lang = getLang();
  const a = portfolioAbout;

  // Name
  const nameEl = document.querySelector('[data-i18n="about.name"]');
  if (nameEl && a.name) nameEl.textContent = a.name[lang] || a.name.en || '';

  // Role
  const roleEl = document.querySelector('[data-i18n="about.role"]');
  if (roleEl && a.role) roleEl.textContent = a.role[lang] || a.role.en || '';

  // Badge
  const badgeEl = document.querySelector('[data-i18n="about.badge"]');
  if (badgeEl && a.badge) {
    const badgeText = a.badge[lang] || a.badge.en || '';
    badgeEl.textContent = badgeText;
    badgeEl.style.display = badgeText ? '' : 'none';
  }

  // Paragraph 1
  const p1El = document.querySelector('[data-i18n="about.p1"]');
  if (p1El && a.p1) p1El.textContent = a.p1[lang] || a.p1.en || '';

  // Paragraph 2
  const p2El = document.querySelector('[data-i18n="about.p2"]');
  if (p2El && a.p2) p2El.textContent = a.p2[lang] || a.p2.en || '';
}

/* ---- CONTACT (Firestore) ---- */
let portfolioContact = null;

async function loadContact() {
  try {
    const doc = await db.collection('contact').doc('info').get();
    if (doc.exists) {
      portfolioContact = doc.data();
      applyContact();
    }
  } catch (error) {
    console.error('Error loading contact from Firestore:', error);
  }
}

function applyContact() {
  if (!portfolioContact) return;
  const lang = getLang();
  const c = portfolioContact;

  // Email
  const emailEl = document.querySelector('[data-i18n="contact.email"]');
  if (emailEl && c.email) emailEl.textContent = escapeHTML(c.email);

  // Phone
  const phoneEl = document.querySelector('[data-i18n="contact.phone"]');
  if (phoneEl && c.phone) phoneEl.textContent = escapeHTML(c.phone);

  // Location
  const locEl = document.querySelector('[data-i18n="contact.location"]');
  if (locEl && c.location) locEl.textContent = escapeHTML(c.location[lang] || c.location.en || '');
}

/* ============================================
   RE-RENDER ON LANGUAGE CHANGE
   Hook into the language system to re-render
   dynamic content when language switches
   ============================================ */
// Override the original applyTranslations to also re-render dynamic content
const _originalApplyTranslations = window.applyTranslations || function() {};
window.applyTranslations = function(lang) {
  // Call the original from language.js
  if (typeof _originalApplyTranslations === 'function') {
    _originalApplyTranslations(lang);
  }
  // Re-render dynamic content with new language
  renderProjects();
  renderCertificates();
  applyAbout();
  applyContact();
  // Re-init filter after re-render
  initPortfolioFilter();
};

/* ============================================
   PROJECT MODAL POPUP
   ============================================ */
/* ============================================
   MEDIA GALLERY STATE
   ============================================ */
let galleryCurrentSlide = 0;
let galleryTotalSlides = 0;
let galleryVisualMedia = []; // images + videos only (for slider)

function initProjectModal() {
  const overlay = document.getElementById('project-modal-overlay');
  const closeBtn = document.getElementById('project-modal-close');
  const prevBtn = document.getElementById('media-nav-prev');
  const nextBtn = document.getElementById('media-nav-next');

  if (!overlay) return;

  // Close button
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      closeProjectModal();
    });
  }

  // Click overlay to close
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      closeProjectModal();
    }
  });

  // Navigation buttons
  if (prevBtn) prevBtn.addEventListener('click', () => galleryPrev());
  if (nextBtn) nextBtn.addEventListener('click', () => galleryNext());

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (!overlay.classList.contains('active')) return;
    if (e.key === 'Escape') closeProjectModal();
    if (e.key === 'ArrowLeft') galleryPrev();
    if (e.key === 'ArrowRight') galleryNext();
  });

  // Touch swipe support
  let touchStartX = 0;
  let touchEndX = 0;
  const gallery = document.getElementById('media-gallery');
  if (gallery) {
    gallery.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });
    gallery.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      const diff = touchStartX - touchEndX;
      if (Math.abs(diff) > 50) {
        if (diff > 0) galleryNext();
        else galleryPrev();
      }
    }, { passive: true });
  }

  // Event delegation for "View Project" buttons
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-project-idx]');
    if (!btn) return;
    e.preventDefault();

    const idx = parseInt(btn.getAttribute('data-project-idx'));
    const project = portfolioProjects[idx];
    if (!project) return;

    openProjectModal(project);
  });
}

function closeProjectModal() {
  const overlay = document.getElementById('project-modal-overlay');
  overlay.classList.remove('active');
  document.body.style.overflow = '';
  // Pause any playing videos
  const videos = overlay.querySelectorAll('video');
  videos.forEach(v => { v.pause(); v.currentTime = 0; });
}

function openProjectModal(project) {
  const overlay = document.getElementById('project-modal-overlay');
  const lang = getLang();
  const title = project.title ? (project.title[lang] || project.title.en) : '';
  const desc = project.desc ? (project.desc[lang] || project.desc.en) : '';
  const cat = project.categoryLabel ? (project.categoryLabel[lang] || project.categoryLabel.en) : project.category;

  // Set text content
  document.getElementById('project-modal-title').textContent = title;
  document.getElementById('project-modal-desc').textContent = desc;
  document.getElementById('project-modal-cat').textContent = cat;

  // Build media array (backward compatible)
  let media = [];
  if (project.media && Array.isArray(project.media) && project.media.length > 0) {
    media = project.media.map(m => ({
      type: m.type || detectMediaTypeFromURL(m.url),
      url: m.url,
      name: m.name || ''
    }));
  } else if (project.image) {
    media = [{ type: 'image', url: project.image, name: '' }];
  }

  // Separate visual media (images/videos) from files
  galleryVisualMedia = media.filter(m => m.type === 'image' || m.type === 'video');
  const fileMedia = media.filter(m => m.type === 'file');

  // Build gallery slides
  buildGallerySlides(galleryVisualMedia, title);

  // Build file download chips
  buildFileChips(fileMedia);

  // Show modal
  galleryCurrentSlide = 0;
  galleryTotalSlides = galleryVisualMedia.length;
  updateGalleryPosition();

  overlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function buildGallerySlides(visualMedia, title) {
  const track = document.getElementById('media-slides-track');
  const gallery = document.getElementById('media-gallery');
  const dotsContainer = document.getElementById('media-dots');
  const counter = document.getElementById('media-counter');
  const prevBtn = document.getElementById('media-nav-prev');
  const nextBtn = document.getElementById('media-nav-next');

  if (visualMedia.length === 0) {
    // No visual media — hide gallery
    gallery.style.display = 'none';
    dotsContainer.style.display = 'none';
    return;
  }

  gallery.style.display = '';
  dotsContainer.style.display = visualMedia.length > 1 ? 'flex' : 'none';

  // Show/hide nav buttons
  const showNav = visualMedia.length > 1;
  prevBtn.style.display = showNav ? '' : 'none';
  nextBtn.style.display = showNav ? '' : 'none';
  counter.style.display = showNav ? '' : 'none';

  // Build slides HTML
  track.innerHTML = visualMedia.map((m, i) => {
    if (m.type === 'video') {
      const sanitized = sanitizeURL(m.url);
      return `<div class="media-slide">
        <video controls preload="metadata" playsinline>
          <source src="${sanitized}" type="video/${getFileExtension(m.url) || 'mp4'}">
          Your browser does not support the video tag.
        </video>
      </div>`;
    } else {
      const sanitized = sanitizeURL(m.url);
      const alt = escapeHTML(m.name || title || 'Project image');
      return `<div class="media-slide">
        <img src="${sanitized}" alt="${alt} ${i + 1}">
      </div>`;
    }
  }).join('');

  // Build dots
  dotsContainer.innerHTML = visualMedia.map((_, i) =>
    `<div class="media-dot${i === 0 ? ' active' : ''}" data-slide="${i}"></div>`
  ).join('');

  // Dot click listeners
  dotsContainer.querySelectorAll('.media-dot').forEach(dot => {
    dot.addEventListener('click', () => {
      galleryCurrentSlide = parseInt(dot.getAttribute('data-slide'));
      updateGalleryPosition();
    });
  });
}

function buildFileChips(fileMedia) {
  const section = document.getElementById('media-files-section');
  const list = document.getElementById('media-files-list');

  if (fileMedia.length === 0) {
    section.style.display = 'none';
    return;
  }

  section.style.display = '';
  list.innerHTML = fileMedia.map((f, i) => {
    const name = escapeHTML(getMediaDisplayName(f));
    const ext = getFileExtension(f.url);
    return `<a href="javascript:void(0)" onclick="downloadFile(${i})" class="media-file-chip">
      <svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
      <span>${name}</span>
      <span class="file-ext">${escapeHTML(ext)}</span>
    </a>`;
  }).join('');

  // Store file media references for download
  window._currentFileMedia = fileMedia;
}

/**
 * Download a file from a cross-origin URL (Cloudinary) by fetching as blob.
 * Falls back to opening in new tab if fetch fails.
 */
function downloadFile(index) {
  const fileMedia = window._currentFileMedia;
  if (!fileMedia || !fileMedia[index]) return;

  const f = fileMedia[index];
  const url = f.url;
  const filename = f.name || getMediaDisplayName(f);

  // Try fetch + blob for cross-origin download
  fetch(url, { mode: 'cors' })
    .then(response => {
      if (!response.ok) throw new Error('Network response was not ok');
      return response.blob();
    })
    .then(blob => {
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    })
    .catch(() => {
      // Fallback: open in new tab
      window.open(url, '_blank');
    });
}

function updateGalleryPosition() {
  const track = document.getElementById('media-slides-track');
  const counter = document.getElementById('media-counter');
  const dotsContainer = document.getElementById('media-dots');

  if (!track || galleryTotalSlides === 0) return;

  // Clamp
  galleryCurrentSlide = Math.max(0, Math.min(galleryCurrentSlide, galleryTotalSlides - 1));

  // Move track
  track.style.transform = `translateX(-${galleryCurrentSlide * 100}%)`;

  // Update counter (use LTR marks so numbers don't reverse in RTL)
  if (counter && galleryTotalSlides > 1) {
    counter.textContent = `\u200E${galleryCurrentSlide + 1} / ${galleryTotalSlides}\u200E`;
  }

  // Update dots
  if (dotsContainer) {
    dotsContainer.querySelectorAll('.media-dot').forEach((dot, i) => {
      dot.classList.toggle('active', i === galleryCurrentSlide);
    });
  }

  // Pause videos that are not visible
  const slides = track.querySelectorAll('.media-slide');
  slides.forEach((slide, i) => {
    const video = slide.querySelector('video');
    if (video && i !== galleryCurrentSlide) {
      video.pause();
    }
  });
}

function galleryNext() {
  if (galleryCurrentSlide < galleryTotalSlides - 1) {
    galleryCurrentSlide++;
    updateGalleryPosition();
  }
}

function galleryPrev() {
  if (galleryCurrentSlide > 0) {
    galleryCurrentSlide--;
    updateGalleryPosition();
  }
}

/* ============================================
   PORTFOLIO FILTER
   ============================================ */
function initPortfolioFilter() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const projectCards = document.querySelectorAll('.project-card');

  filterBtns.forEach(btn => {
    // Remove old listeners by cloning
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);

    newBtn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      newBtn.classList.add('active');

      const filter = newBtn.getAttribute('data-filter');

      document.querySelectorAll('.project-card').forEach(card => {
        const category = card.getAttribute('data-category');
        if (filter === 'all' || category === filter) {
          card.classList.remove('hidden');
          card.style.animation = 'fadeInUp 0.5s ease forwards';
        } else {
          card.classList.add('hidden');
          card.style.animation = '';
        }
      });
    });
  });
}

/* ============================================
   SCROLL ANIMATIONS
   ============================================ */
function initScrollAnimations() {
  const revealElements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale, .stagger-children');

  if ('IntersectionObserver' in window) {
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

    revealElements.forEach(el => observer.observe(el));
  } else {
    revealElements.forEach(el => el.classList.add('visible'));
  }
}

/* ============================================
   BACK TO TOP
   ============================================ */
function initBackToTop() {
  const btn = document.querySelector('.back-to-top');
  if (!btn) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 500) {
      btn.classList.add('visible');
    } else {
      btn.classList.remove('visible');
    }
  });

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}
