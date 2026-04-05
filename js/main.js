/* ============================================
   MAIN APPLICATION LOGIC
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize all modules
  initLoading();
  initNavbar();
  initHeroCanvas();
  initPortfolioFilter();
  initScrollAnimations();
  initBackToTop();
  initLanguage(); // from language.js
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
   PORTFOLIO FILTER
   ============================================ */
function initPortfolioFilter() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const projectCards = document.querySelectorAll('.project-card');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.getAttribute('data-filter');

      projectCards.forEach(card => {
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
