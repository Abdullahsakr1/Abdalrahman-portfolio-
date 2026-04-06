/* ============================================
   ADMIN PANEL LOGIC
   ============================================ */

// ---- AUTH ----
const ADMIN_USER = 'admin';
const ADMIN_PASS = '123456';
const SESSION_KEY = 'admin_session';

// ---- DATA KEYS (localStorage) ----
const STORAGE_KEYS = {
  projects: 'portfolio_projects',
  certificates: 'portfolio_certificates',
  about: 'portfolio_about',
  contact: 'portfolio_contact'
};

// ---- INIT ----
document.addEventListener('DOMContentLoaded', () => {
  if (isLoggedIn()) {
    showDashboard();
  }
  initLoginForm();
  initSidebar();
  initMobileToggle();
});

// ============================================
//  AUTHENTICATION
// ============================================
function isLoggedIn() {
  return localStorage.getItem(SESSION_KEY) === 'true';
}

function initLoginForm() {
  const form = document.getElementById('login-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const user = document.getElementById('login-user').value.trim();
    const pass = document.getElementById('login-pass').value.trim();
    const errorEl = document.getElementById('login-error');

    if (user === ADMIN_USER && pass === ADMIN_PASS) {
      localStorage.setItem(SESSION_KEY, 'true');
      showDashboard();
      errorEl.classList.remove('show');
    } else {
      errorEl.classList.add('show');
    }
  });
}

function showDashboard() {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('admin-wrapper').classList.add('active');
  loadAllData();
  renderDashboard();
}

function logout() {
  localStorage.removeItem(SESSION_KEY);
  location.reload();
}

// ============================================
//  SIDEBAR NAVIGATION
// ============================================
function initSidebar() {
  const navLinks = document.querySelectorAll('#sidebar-nav a');
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      const panel = link.getAttribute('data-panel');
      switchPanel(panel);
    });
  });

  document.getElementById('logout-btn').addEventListener('click', logout);
}

function switchPanel(panelName) {
  // Hide all panels
  document.querySelectorAll('.admin-panel').forEach(p => p.classList.remove('active'));
  // Show target panel
  const target = document.getElementById(`panel-${panelName}`);
  if (target) target.classList.add('active');

  // Update nav active state
  document.querySelectorAll('#sidebar-nav a').forEach(a => {
    a.classList.toggle('active', a.getAttribute('data-panel') === panelName);
  });

  // Close mobile sidebar
  document.getElementById('admin-sidebar').classList.remove('open');

  // Refresh panel data
  if (panelName === 'dashboard') renderDashboard();
  if (panelName === 'projects') renderProjectList();
  if (panelName === 'certificates') renderCertList();
  if (panelName === 'about') loadAboutForm();
  if (panelName === 'contact') loadContactForm();
}

function initMobileToggle() {
  const toggle = document.getElementById('mobile-toggle');
  const sidebar = document.getElementById('admin-sidebar');

  if (toggle) {
    toggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
    });
  }
}

// ============================================
//  DATA MANAGEMENT
// ============================================
let projectsData = [];
let certificatesData = [];
let aboutData = {};
let contactData = {};

async function loadAllData() {
  // Load from localStorage first, fallback to JSON files
  projectsData = loadFromStorage(STORAGE_KEYS.projects) || await fetchJSON('data/projects.json');
  certificatesData = loadFromStorage(STORAGE_KEYS.certificates) || await fetchJSON('data/certificates.json');
  aboutData = loadFromStorage(STORAGE_KEYS.about) || await fetchJSON('data/about.json');
  contactData = loadFromStorage(STORAGE_KEYS.contact) || await fetchJSON('data/contact.json');

  // Save to localStorage so we always have a copy
  saveToStorage(STORAGE_KEYS.projects, projectsData);
  saveToStorage(STORAGE_KEYS.certificates, certificatesData);
  saveToStorage(STORAGE_KEYS.about, aboutData);
  saveToStorage(STORAGE_KEYS.contact, contactData);
}

async function fetchJSON(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error();
    return await res.json();
  } catch {
    return null;
  }
}

function loadFromStorage(key) {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

function saveToStorage(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn('Storage error:', e);
  }
}

// ============================================
//  DASHBOARD
// ============================================
function renderDashboard() {
  document.getElementById('stat-projects').textContent = projectsData ? projectsData.length : 0;
  document.getElementById('stat-certs').textContent = certificatesData ? certificatesData.length : 0;

  // Count unique images
  let imgCount = 0;
  if (projectsData) imgCount += projectsData.length;
  if (certificatesData) imgCount += certificatesData.length;
  document.getElementById('stat-images').textContent = imgCount;

  // Recent projects
  const container = document.getElementById('recent-projects');
  if (!container) return;

  if (!projectsData || projectsData.length === 0) {
    container.innerHTML = '<p style="color:var(--text-muted);font-size:0.9rem;">No projects yet. Add your first project!</p>';
    return;
  }

  const recent = projectsData.slice(-3).reverse();
  container.innerHTML = recent.map(p => createItemRowHTML(p, 'project')).join('');
}

function createItemRowHTML(item, type) {
  const title = item.title ? (item.title.en || '') : '';
  const subtitle = type === 'project'
    ? (item.categoryLabel ? item.categoryLabel.en : item.category)
    : (item.org ? item.org.en : '');
  const img = item.image || 'images/certificate.png';

  return `
    <div class="item-row">
      <div class="item-thumb"><img src="${img}" alt="${title}"></div>
      <div class="item-info">
        <h4>${title}</h4>
        <span>${subtitle}</span>
      </div>
    </div>
  `;
}

// ============================================
//  PROJECTS CRUD
// ============================================
function renderProjectList() {
  const container = document.getElementById('project-list');
  if (!projectsData || projectsData.length === 0) {
    container.innerHTML = '<p style="padding:24px;color:var(--text-muted);font-size:0.9rem;">No projects found. Click "Add Project" to create one.</p>';
    return;
  }

  container.innerHTML = projectsData.map((p, idx) => {
    const title = p.title ? p.title.en : '';
    const cat = p.categoryLabel ? p.categoryLabel.en : p.category;
    const img = p.image || '';
    return `
      <div class="item-row">
        <div class="item-thumb"><img src="${img}" alt="${title}"></div>
        <div class="item-info">
          <h4>${title}</h4>
          <span>${cat}</span>
        </div>
        <div class="item-actions">
          <button class="btn-edit" onclick="editProject(${idx})">Edit</button>
          <button class="btn-delete" onclick="deleteProject(${idx})">Delete</button>
        </div>
      </div>
    `;
  }).join('');
}

let currentProjectImage = '';

function showProjectForm(editIdx) {
  document.getElementById('project-form').style.display = 'block';
  document.getElementById('project-list').style.display = 'none';
  document.getElementById('btn-add-project').style.display = 'none';

  // Reset form
  if (editIdx === undefined) {
    document.getElementById('project-form-title').textContent = 'Add New Project';
    document.getElementById('project-edit-id').value = '';
    document.getElementById('proj-title-en').value = '';
    document.getElementById('proj-title-ar').value = '';
    document.getElementById('proj-desc-en').value = '';
    document.getElementById('proj-desc-ar').value = '';
    document.getElementById('proj-category').value = 'branding';
    document.getElementById('proj-cat-label-en').value = '';
    document.getElementById('proj-cat-label-ar').value = '';
    document.getElementById('proj-preview').style.display = 'none';
    currentProjectImage = '';
  }
}

function hideProjectForm() {
  document.getElementById('project-form').style.display = 'none';
  document.getElementById('project-list').style.display = 'block';
  document.getElementById('btn-add-project').style.display = '';
}

function editProject(idx) {
  const p = projectsData[idx];
  if (!p) return;

  showProjectForm(idx);
  document.getElementById('project-form-title').textContent = 'Edit Project';
  document.getElementById('project-edit-id').value = idx;
  document.getElementById('proj-title-en').value = p.title ? p.title.en : '';
  document.getElementById('proj-title-ar').value = p.title ? p.title.ar : '';
  document.getElementById('proj-desc-en').value = p.desc ? p.desc.en : '';
  document.getElementById('proj-desc-ar').value = p.desc ? p.desc.ar : '';
  document.getElementById('proj-category').value = p.category || 'branding';
  document.getElementById('proj-cat-label-en').value = p.categoryLabel ? p.categoryLabel.en : '';
  document.getElementById('proj-cat-label-ar').value = p.categoryLabel ? p.categoryLabel.ar : '';

  if (p.image) {
    const preview = document.getElementById('proj-preview');
    preview.src = p.image;
    preview.style.display = 'block';
    currentProjectImage = p.image;
  }
}

function deleteProject(idx) {
  if (!confirm('Are you sure you want to delete this project?')) return;
  projectsData.splice(idx, 1);
  saveToStorage(STORAGE_KEYS.projects, projectsData);
  renderProjectList();
  showToast('Project deleted', 'success');
}

function saveProject() {
  const titleEn = document.getElementById('proj-title-en').value.trim();
  const titleAr = document.getElementById('proj-title-ar').value.trim();
  const descEn = document.getElementById('proj-desc-en').value.trim();
  const descAr = document.getElementById('proj-desc-ar').value.trim();
  const category = document.getElementById('proj-category').value;
  const catLabelEn = document.getElementById('proj-cat-label-en').value.trim();
  const catLabelAr = document.getElementById('proj-cat-label-ar').value.trim();
  const editId = document.getElementById('project-edit-id').value;

  if (!titleEn) {
    showToast('Please enter a project title', 'error');
    return;
  }

  const imageToUse = currentProjectImage || 'images/project-branding.png';

  const project = {
    id: 'project-' + Date.now(),
    title: { en: titleEn, ar: titleAr || titleEn },
    desc: { en: descEn, ar: descAr || descEn },
    category: category,
    categoryLabel: { en: catLabelEn || category, ar: catLabelAr || catLabelEn || category },
    image: imageToUse
  };

  if (editId !== '') {
    // Update existing  
    const idx = parseInt(editId);
    project.id = projectsData[idx].id || project.id;
    projectsData[idx] = project;
    showToast('Project updated!', 'success');
  } else {
    // Add new
    projectsData.push(project);
    showToast('Project added!', 'success');
  }

  saveToStorage(STORAGE_KEYS.projects, projectsData);
  hideProjectForm();
  renderProjectList();
}

// ============================================
//  CERTIFICATES CRUD
// ============================================
function renderCertList() {
  const container = document.getElementById('cert-list');
  if (!certificatesData || certificatesData.length === 0) {
    container.innerHTML = '<p style="padding:24px;color:var(--text-muted);font-size:0.9rem;">No certificates found. Click "Add Certificate" to create one.</p>';
    return;
  }

  container.innerHTML = certificatesData.map((c, idx) => {
    const title = c.title ? c.title.en : '';
    const org = c.org ? c.org.en : '';
    const img = c.image || 'images/certificate.png';
    return `
      <div class="item-row">
        <div class="item-thumb"><img src="${img}" alt="${title}"></div>
        <div class="item-info">
          <h4>${title}</h4>
          <span>${org}</span>
        </div>
        <div class="item-actions">
          <button class="btn-edit" onclick="editCertificate(${idx})">Edit</button>
          <button class="btn-delete" onclick="deleteCertificate(${idx})">Delete</button>
        </div>
      </div>
    `;
  }).join('');
}

let currentCertImage = '';

function showCertForm(editIdx) {
  document.getElementById('cert-form').style.display = 'block';
  document.getElementById('cert-list').style.display = 'none';

  if (editIdx === undefined) {
    document.getElementById('cert-form-title').textContent = 'Add New Certificate';
    document.getElementById('cert-edit-id').value = '';
    document.getElementById('cert-title-en').value = '';
    document.getElementById('cert-title-ar').value = '';
    document.getElementById('cert-org-en').value = '';
    document.getElementById('cert-org-ar').value = '';
    document.getElementById('cert-preview').style.display = 'none';
    currentCertImage = '';
  }
}

function hideCertForm() {
  document.getElementById('cert-form').style.display = 'none';
  document.getElementById('cert-list').style.display = 'block';
}

function editCertificate(idx) {
  const c = certificatesData[idx];
  if (!c) return;

  showCertForm(idx);
  document.getElementById('cert-form-title').textContent = 'Edit Certificate';
  document.getElementById('cert-edit-id').value = idx;
  document.getElementById('cert-title-en').value = c.title ? c.title.en : '';
  document.getElementById('cert-title-ar').value = c.title ? c.title.ar : '';
  document.getElementById('cert-org-en').value = c.org ? c.org.en : '';
  document.getElementById('cert-org-ar').value = c.org ? c.org.ar : '';

  if (c.image) {
    const preview = document.getElementById('cert-preview');
    preview.src = c.image;
    preview.style.display = 'block';
    currentCertImage = c.image;
  }
}

function deleteCertificate(idx) {
  if (!confirm('Are you sure you want to delete this certificate?')) return;
  certificatesData.splice(idx, 1);
  saveToStorage(STORAGE_KEYS.certificates, certificatesData);
  renderCertList();
  showToast('Certificate deleted', 'success');
}

function saveCertificate() {
  const titleEn = document.getElementById('cert-title-en').value.trim();
  const titleAr = document.getElementById('cert-title-ar').value.trim();
  const orgEn = document.getElementById('cert-org-en').value.trim();
  const orgAr = document.getElementById('cert-org-ar').value.trim();
  const editId = document.getElementById('cert-edit-id').value;

  if (!titleEn) {
    showToast('Please enter a certificate title', 'error');
    return;
  }

  const imageToUse = currentCertImage || 'images/certificate.png';

  const cert = {
    id: 'cert-' + Date.now(),
    title: { en: titleEn, ar: titleAr || titleEn },
    org: { en: orgEn, ar: orgAr || orgEn },
    image: imageToUse
  };

  if (editId !== '') {
    const idx = parseInt(editId);
    cert.id = certificatesData[idx].id || cert.id;
    certificatesData[idx] = cert;
    showToast('Certificate updated!', 'success');
  } else {
    certificatesData.push(cert);
    showToast('Certificate added!', 'success');
  }

  saveToStorage(STORAGE_KEYS.certificates, certificatesData);
  hideCertForm();
  renderCertList();
}

// ============================================
//  ABOUT FORM
// ============================================
function loadAboutForm() {
  if (!aboutData) return;
  document.getElementById('about-name-en').value = aboutData.name ? aboutData.name.en : '';
  document.getElementById('about-name-ar').value = aboutData.name ? aboutData.name.ar : '';
  document.getElementById('about-role-en').value = aboutData.role ? aboutData.role.en : '';
  document.getElementById('about-role-ar').value = aboutData.role ? aboutData.role.ar : '';
  document.getElementById('about-badge-en').value = aboutData.badge ? aboutData.badge.en : '';
  document.getElementById('about-badge-ar').value = aboutData.badge ? aboutData.badge.ar : '';
  document.getElementById('about-p1-en').value = aboutData.p1 ? aboutData.p1.en : '';
  document.getElementById('about-p1-ar').value = aboutData.p1 ? aboutData.p1.ar : '';
  document.getElementById('about-p2-en').value = aboutData.p2 ? aboutData.p2.en : '';
  document.getElementById('about-p2-ar').value = aboutData.p2 ? aboutData.p2.ar : '';
}

function saveAbout() {
  aboutData = {
    ...aboutData,
    name: {
      en: document.getElementById('about-name-en').value.trim(),
      ar: document.getElementById('about-name-ar').value.trim()
    },
    role: {
      en: document.getElementById('about-role-en').value.trim(),
      ar: document.getElementById('about-role-ar').value.trim()
    },
    badge: {
      en: document.getElementById('about-badge-en').value.trim(),
      ar: document.getElementById('about-badge-ar').value.trim()
    },
    p1: {
      en: document.getElementById('about-p1-en').value.trim(),
      ar: document.getElementById('about-p1-ar').value.trim()
    },
    p2: {
      en: document.getElementById('about-p2-en').value.trim(),
      ar: document.getElementById('about-p2-ar').value.trim()
    }
  };

  saveToStorage(STORAGE_KEYS.about, aboutData);
  showToast('About info saved!', 'success');
}

// ============================================
//  CONTACT FORM
// ============================================
function loadContactForm() {
  if (!contactData) return;
  document.getElementById('contact-email').value = contactData.email || '';
  document.getElementById('contact-phone').value = contactData.phone || '';
  document.getElementById('contact-loc-en').value = contactData.location ? contactData.location.en : '';
  document.getElementById('contact-loc-ar').value = contactData.location ? contactData.location.ar : '';
  document.getElementById('contact-linkedin').value = contactData.social ? contactData.social.linkedin : '';
  document.getElementById('contact-behance').value = contactData.social ? contactData.social.behance : '';
  document.getElementById('contact-dribbble').value = contactData.social ? contactData.social.dribbble : '';
  document.getElementById('contact-instagram').value = contactData.social ? contactData.social.instagram : '';
}

function saveContact() {
  contactData = {
    email: document.getElementById('contact-email').value.trim(),
    phone: document.getElementById('contact-phone').value.trim(),
    location: {
      en: document.getElementById('contact-loc-en').value.trim(),
      ar: document.getElementById('contact-loc-ar').value.trim()
    },
    social: {
      linkedin: document.getElementById('contact-linkedin').value.trim(),
      behance: document.getElementById('contact-behance').value.trim(),
      dribbble: document.getElementById('contact-dribbble').value.trim(),
      instagram: document.getElementById('contact-instagram').value.trim()
    }
  };

  saveToStorage(STORAGE_KEYS.contact, contactData);
  showToast('Contact info saved!', 'success');
}

// ============================================
//  IMAGE UPLOAD (Base64 for static hosting)
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  // Project image upload
  const projInput = document.getElementById('proj-image-input');
  if (projInput) {
    projInput.addEventListener('change', (e) => {
      handleImageUpload(e.target.files[0], 'proj-preview', (dataUrl) => {
        currentProjectImage = dataUrl;
      });
    });
  }

  // Certificate image upload
  const certInput = document.getElementById('cert-image-input');
  if (certInput) {
    certInput.addEventListener('change', (e) => {
      handleImageUpload(e.target.files[0], 'cert-preview', (dataUrl) => {
        currentCertImage = dataUrl;
      });
    });
  }
});

function handleImageUpload(file, previewId, callback) {
  if (!file) return;

  // Validate file type
  if (!file.type.startsWith('image/')) {
    showToast('Please select an image file', 'error');
    return;
  }

  // Validate file size (max 2MB for localStorage)
  if (file.size > 2 * 1024 * 1024) {
    showToast('Image must be under 2MB', 'error');
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    const dataUrl = e.target.result;
    const preview = document.getElementById(previewId);
    if (preview) {
      preview.src = dataUrl;
      preview.style.display = 'block';
    }
    if (callback) callback(dataUrl);
  };
  reader.readAsDataURL(file);
}

// ============================================
//  MODAL
// ============================================
function closeModal() {
  document.getElementById('modal-overlay').classList.remove('active');
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
});

// ============================================
//  TOAST NOTIFICATIONS
// ============================================
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast ${type} show`;

  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

// ============================================
//  EXPORT DATA (Download JSON)
// ============================================
function exportData() {
  const data = {
    projects: projectsData,
    certificates: certificatesData,
    about: aboutData,
    contact: contactData
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'portfolio-data.json';
  a.click();
  URL.revokeObjectURL(url);
  showToast('Data exported!', 'success');
}
