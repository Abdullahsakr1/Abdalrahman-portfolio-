/* ============================================
   ADMIN PANEL LOGIC — Firebase Auth + Firestore
   ============================================ */

// ---- FIRESTORE COLLECTION NAMES ----
const COLLECTIONS = {
  projects: 'projects',
  certificates: 'certificates',
  about: 'about',
  contact: 'contact'
};

// ============================================
//  XSS SANITIZATION
//  Escapes HTML special characters to prevent
//  stored XSS attacks from Firestore data
// ============================================
function escapeHTML(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

// Sanitize a URL — allow only http/https/data/relative paths
function sanitizeURL(url) {
  if (!url) return '';
  const trimmed = url.trim();
  // Block javascript: and data: URIs except images
  if (/^javascript:/i.test(trimmed)) return '';
  if (/^data:(?!image\/)/i.test(trimmed)) return '';
  return escapeHTML(trimmed);
}

// ---- INIT ----
document.addEventListener('DOMContentLoaded', () => {
  initLoginForm();
  initSidebar();
  initMobileToggle();

  // Listen for Firebase Auth state changes
  firebase.auth().onAuthStateChanged((user) => {
    if (user) {
      showDashboard();
    } else {
      showLoginScreen();
    }
  });
});

// ============================================
//  AUTHENTICATION (Firebase Auth)
// ============================================
function initLoginForm() {
  const form = document.getElementById('login-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const pass = document.getElementById('login-pass').value.trim();
    const errorEl = document.getElementById('login-error');
    const loginBtn = document.getElementById('login-btn');

    // Disable button during auth
    loginBtn.disabled = true;
    loginBtn.textContent = 'Signing in...';
    errorEl.classList.remove('show');

    try {
      await firebase.auth().signInWithEmailAndPassword(email, pass);
      // onAuthStateChanged will handle showing the dashboard
    } catch (error) {
      console.error('Login error:', error);
      // User-friendly error messages
      let msg = 'Invalid email or password';
      if (error.code === 'auth/user-not-found') msg = 'No account found with this email';
      else if (error.code === 'auth/wrong-password') msg = 'Incorrect password';
      else if (error.code === 'auth/invalid-email') msg = 'Invalid email format';
      else if (error.code === 'auth/too-many-requests') msg = 'Too many attempts. Try again later';
      else if (error.code === 'auth/invalid-credential') msg = 'Invalid email or password';

      errorEl.textContent = msg;
      errorEl.classList.add('show');
    } finally {
      loginBtn.disabled = false;
      loginBtn.textContent = 'Sign In';
    }
  });
}

function showDashboard() {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('admin-wrapper').classList.add('active');
  loadAllData();
}

function showLoginScreen() {
  document.getElementById('login-screen').style.display = '';
  document.getElementById('admin-wrapper').classList.remove('active');
}

async function logout() {
  try {
    await firebase.auth().signOut();
    // onAuthStateChanged will handle showing the login screen
  } catch (error) {
    console.error('Logout error:', error);
  }
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
  document.querySelectorAll('.admin-panel').forEach(p => p.classList.remove('active'));
  const target = document.getElementById(`panel-${panelName}`);
  if (target) target.classList.add('active');

  document.querySelectorAll('#sidebar-nav a').forEach(a => {
    a.classList.toggle('active', a.getAttribute('data-panel') === panelName);
  });

  document.getElementById('admin-sidebar').classList.remove('open');

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
//  DATA MANAGEMENT (Firestore)
// ============================================
let projectsData = [];
let certificatesData = [];
let aboutData = {};
let contactData = {};

async function loadAllData() {
  try {
    const projSnap = await db.collection(COLLECTIONS.projects).orderBy('createdAt', 'desc').get();
    projectsData = projSnap.docs.map(doc => ({ _docId: doc.id, ...doc.data() }));

    const certSnap = await db.collection(COLLECTIONS.certificates).orderBy('createdAt', 'desc').get();
    certificatesData = certSnap.docs.map(doc => ({ _docId: doc.id, ...doc.data() }));

    const aboutSnap = await db.collection(COLLECTIONS.about).doc('info').get();
    aboutData = aboutSnap.exists ? aboutSnap.data() : {};

    const contactSnap = await db.collection(COLLECTIONS.contact).doc('info').get();
    contactData = contactSnap.exists ? contactSnap.data() : {};

    renderDashboard();
  } catch (error) {
    console.error('Error loading data from Firestore:', error);
    showToast('Failed to load data. Check console.', 'error');
  }
}

// ============================================
//  DASHBOARD
// ============================================
function renderDashboard() {
  document.getElementById('stat-projects').textContent = projectsData ? projectsData.length : 0;
  document.getElementById('stat-certs').textContent = certificatesData ? certificatesData.length : 0;

  let imgCount = 0;
  if (projectsData) imgCount += projectsData.length;
  if (certificatesData) imgCount += certificatesData.length;
  document.getElementById('stat-images').textContent = imgCount;

  const container = document.getElementById('recent-projects');
  if (!container) return;

  if (!projectsData || projectsData.length === 0) {
    container.innerHTML = '<p style="color:var(--text-muted);font-size:0.9rem;">No projects yet. Add your first project!</p>';
    return;
  }

  const recent = projectsData.slice(0, 3);
  container.innerHTML = recent.map(p => createItemRowHTML(p, 'project')).join('');
}

function createItemRowHTML(item, type) {
  const title = escapeHTML(item.title ? (item.title.en || '') : '');
  const subtitle = escapeHTML(
    type === 'project'
      ? (item.categoryLabel ? item.categoryLabel.en : item.category)
      : (item.org ? item.org.en : '')
  );
  const img = sanitizeURL(item.image || 'images/certificate.png');

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
//  PROJECTS CRUD (Firestore)
// ============================================
function renderProjectList() {
  const container = document.getElementById('project-list');
  if (!projectsData || projectsData.length === 0) {
    container.innerHTML = '<p style="padding:24px;color:var(--text-muted);font-size:0.9rem;">No projects found. Click "Add Project" to create one.</p>';
    return;
  }

  container.innerHTML = projectsData.map((p, idx) => {
    const title = escapeHTML(p.title ? p.title.en : '');
    const cat = escapeHTML(p.categoryLabel ? p.categoryLabel.en : p.category);
    const img = sanitizeURL(p.image || '');
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
    const fi = document.getElementById('proj-image-input');
    if (fi) fi.value = '';
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

async function deleteProject(idx) {
  if (!confirm('Are you sure you want to delete this project?')) return;

  const project = projectsData[idx];
  if (!project || !project._docId) return;

  try {
    await db.collection(COLLECTIONS.projects).doc(project._docId).delete();
    projectsData.splice(idx, 1);
    renderProjectList();
    showToast('Project deleted', 'success');
  } catch (error) {
    console.error('Delete project error:', error);
    showToast('Failed to delete project', 'error');
  }
}

async function saveProject() {
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

  // ---- Cloudinary image upload (PRESERVED) ----
  const saveBtn = document.querySelector('#project-form .btn-primary');
  const fileInput = document.getElementById('proj-image-input');
  let imageToUse = currentProjectImage || 'images/project-branding.png';

  if (fileInput && fileInput.files && fileInput.files[0]) {
    setButtonLoading(saveBtn, true);
    try {
      const uploadedUrl = await uploadImageToCloudinary(fileInput.files[0]);
      imageToUse = uploadedUrl;
    } catch (err) {
      setButtonLoading(saveBtn, false);
      showToast('Image upload failed: ' + err.message, 'error');
      return;
    }
    setButtonLoading(saveBtn, false);
  }
  // ---- End Cloudinary ----

  const projectData = {
    title: { en: titleEn, ar: titleAr || titleEn },
    desc: { en: descEn, ar: descAr || descEn },
    category: category,
    categoryLabel: { en: catLabelEn || category, ar: catLabelAr || catLabelEn || category },
    image: imageToUse,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  };

  try {
    setButtonLoading(saveBtn, true, 'Saving...');

    if (editId !== '') {
      const idx = parseInt(editId);
      const docId = projectsData[idx]._docId;
      await db.collection(COLLECTIONS.projects).doc(docId).update(projectData);
      showToast('Project updated!', 'success');
    } else {
      projectData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
      await db.collection(COLLECTIONS.projects).add(projectData);
      showToast('Project added!', 'success');
    }

    setButtonLoading(saveBtn, false);
    hideProjectForm();
    await loadAllData();
    renderProjectList();
  } catch (error) {
    setButtonLoading(saveBtn, false);
    console.error('Save project error:', error);
    showToast('Failed to save project', 'error');
  }
}

// ============================================
//  CERTIFICATES CRUD (Firestore)
// ============================================
function renderCertList() {
  const container = document.getElementById('cert-list');
  if (!certificatesData || certificatesData.length === 0) {
    container.innerHTML = '<p style="padding:24px;color:var(--text-muted);font-size:0.9rem;">No certificates found. Click "Add Certificate" to create one.</p>';
    return;
  }

  container.innerHTML = certificatesData.map((c, idx) => {
    const title = escapeHTML(c.title ? c.title.en : '');
    const org = escapeHTML(c.org ? c.org.en : '');
    const img = sanitizeURL(c.image || 'images/certificate.png');
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
    const fi = document.getElementById('cert-image-input');
    if (fi) fi.value = '';
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

async function deleteCertificate(idx) {
  if (!confirm('Are you sure you want to delete this certificate?')) return;

  const cert = certificatesData[idx];
  if (!cert || !cert._docId) return;

  try {
    await db.collection(COLLECTIONS.certificates).doc(cert._docId).delete();
    certificatesData.splice(idx, 1);
    renderCertList();
    showToast('Certificate deleted', 'success');
  } catch (error) {
    console.error('Delete certificate error:', error);
    showToast('Failed to delete certificate', 'error');
  }
}

async function saveCertificate() {
  const titleEn = document.getElementById('cert-title-en').value.trim();
  const titleAr = document.getElementById('cert-title-ar').value.trim();
  const orgEn = document.getElementById('cert-org-en').value.trim();
  const orgAr = document.getElementById('cert-org-ar').value.trim();
  const editId = document.getElementById('cert-edit-id').value;

  if (!titleEn) {
    showToast('Please enter a certificate title', 'error');
    return;
  }

  // ---- Cloudinary image upload (PRESERVED) ----
  const saveBtn = document.querySelector('#cert-form .btn-primary');
  const fileInput = document.getElementById('cert-image-input');
  let imageToUse = currentCertImage || 'images/certificate.png';

  if (fileInput && fileInput.files && fileInput.files[0]) {
    setButtonLoading(saveBtn, true);
    try {
      const uploadedUrl = await uploadImageToCloudinary(fileInput.files[0]);
      imageToUse = uploadedUrl;
    } catch (err) {
      setButtonLoading(saveBtn, false);
      showToast('Image upload failed: ' + err.message, 'error');
      return;
    }
    setButtonLoading(saveBtn, false);
  }
  // ---- End Cloudinary ----

  const certData = {
    title: { en: titleEn, ar: titleAr || titleEn },
    org: { en: orgEn, ar: orgAr || orgEn },
    image: imageToUse,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  };

  try {
    setButtonLoading(saveBtn, true, 'Saving...');

    if (editId !== '') {
      const idx = parseInt(editId);
      const docId = certificatesData[idx]._docId;
      await db.collection(COLLECTIONS.certificates).doc(docId).update(certData);
      showToast('Certificate updated!', 'success');
    } else {
      certData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
      await db.collection(COLLECTIONS.certificates).add(certData);
      showToast('Certificate added!', 'success');
    }

    setButtonLoading(saveBtn, false);
    hideCertForm();
    await loadAllData();
    renderCertList();
  } catch (error) {
    setButtonLoading(saveBtn, false);
    console.error('Save certificate error:', error);
    showToast('Failed to save certificate', 'error');
  }
}

// ============================================
//  ABOUT FORM (Firestore)
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

async function saveAbout() {
  aboutData = {
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
    },
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  };

  try {
    await db.collection(COLLECTIONS.about).doc('info').set(aboutData);
    showToast('About info saved!', 'success');
  } catch (error) {
    console.error('Save about error:', error);
    showToast('Failed to save about info', 'error');
  }
}

// ============================================
//  CONTACT FORM (Firestore)
// ============================================
function loadContactForm() {
  if (!contactData) return;
  document.getElementById('contact-email').value = contactData.email || '';
  document.getElementById('contact-phone').value = contactData.phone || '';
  document.getElementById('contact-loc-en').value = contactData.location ? contactData.location.en : '';
  document.getElementById('contact-loc-ar').value = contactData.location ? contactData.location.ar : '';
  document.getElementById('contact-facebook').value = contactData.social ? contactData.social.facebook : '';
  document.getElementById('contact-behance').value = contactData.social ? contactData.social.behance : '';
  document.getElementById('contact-instagram').value = contactData.social ? contactData.social.instagram : '';
}

async function saveContact() {
  contactData = {
    email: document.getElementById('contact-email').value.trim(),
    phone: document.getElementById('contact-phone').value.trim(),
    location: {
      en: document.getElementById('contact-loc-en').value.trim(),
      ar: document.getElementById('contact-loc-ar').value.trim()
    },
    social: {
      facebook: document.getElementById('contact-facebook').value.trim(),
      behance: document.getElementById('contact-behance').value.trim(),
      instagram: document.getElementById('contact-instagram').value.trim()
    },
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  };

  try {
    await db.collection(COLLECTIONS.contact).doc('info').set(contactData);
    showToast('Contact info saved!', 'success');
  } catch (error) {
    console.error('Save contact error:', error);
    showToast('Failed to save contact info', 'error');
  }
}

// ============================================
//  CLOUDINARY IMAGE UPLOAD (PRESERVED)
// ============================================

// ---- Cloudinary Configuration ----
const CLOUDINARY_CLOUD_NAME = 'degbom2gj';
const CLOUDINARY_UPLOAD_PRESET = 'portofolio-images';
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

/**
 * Upload an image file to Cloudinary via unsigned upload.
 * @param {File} file - The image file to upload.
 * @returns {Promise<string>} The secure URL of the uploaded image.
 */
async function uploadImageToCloudinary(file) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

  try {
    const response = await fetch(CLOUDINARY_UPLOAD_URL, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `Upload failed (HTTP ${response.status})`);
    }

    const data = await response.json();

    if (!data.secure_url) {
      throw new Error('No URL returned from Cloudinary');
    }

    return data.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
}

/**
 * Toggle a button between loading and normal state.
 * @param {HTMLElement} btn - The button element.
 * @param {boolean} isLoading - Whether to show loading state.
 * @param {string} [loadingText] - Custom loading text.
 */
function setButtonLoading(btn, isLoading, loadingText) {
  if (!btn) return;
  if (isLoading) {
    btn._originalText = btn._originalText || btn.textContent;
    btn.textContent = loadingText || 'Uploading image... Please wait';
    btn.disabled = true;
    btn.style.opacity = '0.6';
    btn.style.cursor = 'not-allowed';
  } else {
    btn.textContent = btn._originalText || 'Save';
    btn.disabled = false;
    btn.style.opacity = '';
    btn.style.cursor = '';
    btn._originalText = null;
  }
}

// ---- File input listeners (preview only, upload happens on save) ----
document.addEventListener('DOMContentLoaded', () => {
  const projInput = document.getElementById('proj-image-input');
  if (projInput) {
    projInput.addEventListener('change', (e) => {
      previewSelectedImage(e.target.files[0], 'proj-preview');
    });
  }

  const certInput = document.getElementById('cert-image-input');
  if (certInput) {
    certInput.addEventListener('change', (e) => {
      previewSelectedImage(e.target.files[0], 'cert-preview');
    });
  }
});

/**
 * Show a local preview of the selected image.
 * @param {File} file - The selected file.
 * @param {string} previewId - The ID of the <img> preview element.
 */
function previewSelectedImage(file, previewId) {
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    showToast('Please select an image file', 'error');
    return;
  }

  if (file.size > 10 * 1024 * 1024) {
    showToast('Image must be under 10MB', 'error');
    return;
  }

  const preview = document.getElementById(previewId);
  if (preview) {
    preview.src = URL.createObjectURL(file);
    preview.style.display = 'block';
  }
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
    projects: projectsData.map(({ _docId, ...rest }) => rest),
    certificates: certificatesData.map(({ _docId, ...rest }) => rest),
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

// ============================================
//  ADMIN LANGUAGE TOGGLE
// ============================================
let adminLang = 'en';

const adminTranslations = {
  en: {
    dashboard: 'Dashboard',
    projects: 'Projects',
    certificates: 'Certificates',
    about: 'About',
    contact: 'Contact',
    viewSite: 'View Site',
    logout: 'Logout',
    adminPanel: 'Admin Panel',
    totalProjects: 'Total Projects',
    totalCerts: 'Total Certificates',
    totalImages: 'Total Images',
    recentProjects: 'Recent Projects',
    saveChanges: 'Save Changes',
    addProject: 'Add Project',
    addCertificate: 'Add Certificate',
    exportData: 'Export Data'
  },
  ar: {
    dashboard: 'لوحة التحكم',
    projects: 'المشاريع',
    certificates: 'الشهادات',
    about: 'عني',
    contact: 'التواصل',
    viewSite: 'عرض الموقع',
    logout: 'تسجيل الخروج',
    adminPanel: 'لوحة الإدارة',
    totalProjects: 'إجمالي المشاريع',
    totalCerts: 'إجمالي الشهادات',
    totalImages: 'إجمالي الصور',
    recentProjects: 'المشاريع الأخيرة',
    saveChanges: 'حفظ التغييرات',
    addProject: 'إضافة مشروع',
    addCertificate: 'إضافة شهادة',
    exportData: 'تصدير البيانات'
  }
};

function switchAdminLang(lang) {
  adminLang = lang;

  // Update button active state
  document.querySelectorAll('.admin-lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
  });

  // Set direction
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';

  const t = adminTranslations[lang];

  // Sidebar navigation
  const navLinks = document.querySelectorAll('#sidebar-nav a');
  const navKeys = ['dashboard', 'projects', 'certificates', 'about', 'contact'];
  navLinks.forEach((link, i) => {
    if (navKeys[i]) {
      // Keep SVG, update text
      const svg = link.querySelector('svg');
      link.textContent = '';
      if (svg) link.appendChild(svg);
      link.appendChild(document.createTextNode(' ' + t[navKeys[i]]));
    }
  });

  // Admin label
  const adminLabel = document.querySelector('.admin-label');
  if (adminLabel) adminLabel.textContent = t.adminPanel;

  // Sidebar footer links
  const footerLinks = document.querySelectorAll('.sidebar-footer > a');
  if (footerLinks[0]) {
    const svg0 = footerLinks[0].querySelector('svg');
    footerLinks[0].textContent = '';
    if (svg0) footerLinks[0].appendChild(svg0);
    footerLinks[0].appendChild(document.createTextNode(' ' + t.viewSite));
  }
  if (footerLinks[1]) {
    const svg1 = footerLinks[1].querySelector('svg');
    footerLinks[1].textContent = '';
    if (svg1) footerLinks[1].appendChild(svg1);
    footerLinks[1].appendChild(document.createTextNode(' ' + t.logout));
  }
}
