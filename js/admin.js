/* ============================================
   ADMIN PANEL LOGIC — Firebase Auth + Firestore
   Multi-Media Upload System
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
// ============================================
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

// ============================================
//  MEDIA TYPE DETECTION
// ============================================
const IMAGE_EXTS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico', 'tiff', 'tif'];
const VIDEO_EXTS = ['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv', 'wmv', 'flv'];
const FILE_EXTS = ['pdf', 'zip', 'ai', 'psd', 'docx', 'doc', 'eps', 'indd', 'rar', '7z', 'xlsx', 'pptx', 'txt'];

function detectMediaType(filename) {
  if (!filename) return 'file';
  const ext = filename.split('.').pop().toLowerCase();
  if (IMAGE_EXTS.includes(ext)) return 'image';
  if (VIDEO_EXTS.includes(ext)) return 'video';
  return 'file';
}

function detectMediaTypeFromMime(mimeType) {
  if (!mimeType) return 'file';
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  return 'file';
}

function getFileExtension(name) {
  if (!name) return '';
  return name.split('.').pop().toLowerCase();
}

function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// ---- INIT ----
document.addEventListener('DOMContentLoaded', () => {
  initLoginForm();
  initSidebar();
  initMobileToggle();
  initMediaUploader();

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

    loginBtn.disabled = true;
    loginBtn.textContent = 'Signing in...';
    errorEl.classList.remove('show');

    try {
      await firebase.auth().signInWithEmailAndPassword(email, pass);
    } catch (error) {
      console.error('Login error:', error);
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

  let mediaCount = 0;
  if (projectsData) {
    projectsData.forEach(p => {
      if (p.media && Array.isArray(p.media)) mediaCount += p.media.length;
      else if (p.image) mediaCount += 1;
    });
  }
  if (certificatesData) mediaCount += certificatesData.length;
  document.getElementById('stat-images').textContent = mediaCount;

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
  // Use first image from media array
  let img = '';
  if (item.media && Array.isArray(item.media)) {
    const firstImg = item.media.find(m => m.type === 'image');
    if (firstImg) img = sanitizeURL(firstImg.url);
  }
  if (!img) img = sanitizeURL(item.image || 'images/certificate.png');

  const mediaCount = item.media && Array.isArray(item.media) ? item.media.length : 0;
  const mediaLabel = mediaCount > 1 ? ` · ${mediaCount} media` : '';

  return `
    <div class="item-row">
      <div class="item-thumb"><img src="${img}" alt="${title}"></div>
      <div class="item-info">
        <h4>${title}</h4>
        <span>${subtitle}${mediaLabel}</span>
      </div>
    </div>
  `;
}

// ============================================
//  MULTI-MEDIA UPLOAD SYSTEM
// ============================================
let projectMediaItems = []; // Array of { file: File|null, url: string, type: string, name: string, size: number, uploaded: boolean }

function initMediaUploader() {
  const dropZone = document.getElementById('media-drop-zone');
  const fileInput = document.getElementById('media-file-input');
  const addBtn = document.getElementById('btn-add-media');

  if (!dropZone || !fileInput) return;

  // File input change
  fileInput.addEventListener('change', (e) => {
    handleMediaFiles(e.target.files);
    fileInput.value = ''; // Reset so same file can be re-added
  });

  // Drag and drop
  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
  });

  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('drag-over');
  });

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    if (e.dataTransfer.files.length > 0) {
      handleMediaFiles(e.dataTransfer.files);
    }
  });

  // Add more media button
  if (addBtn) {
    addBtn.addEventListener('click', () => {
      fileInput.click();
    });
  }

  // Init drag-to-reorder
  initMediaDragReorder();
}

function handleMediaFiles(files) {
  Array.from(files).forEach(file => {
    // Detect type from file
    const type = detectMediaTypeFromMime(file.type) !== 'file'
      ? detectMediaTypeFromMime(file.type)
      : detectMediaType(file.name);

    const mediaItem = {
      file: file,
      url: '', // Will be set after Cloudinary upload
      type: type,
      name: file.name,
      size: file.size,
      uploaded: false,
      previewUrl: '' // Local preview URL
    };

    // Create local preview for images
    if (type === 'image') {
      mediaItem.previewUrl = URL.createObjectURL(file);
    }

    projectMediaItems.push(mediaItem);
  });

  renderMediaItems();
}

function renderMediaItems() {
  const list = document.getElementById('media-items-list');
  if (!list) return;

  list.innerHTML = projectMediaItems.map((item, idx) => {
    const name = escapeHTML(item.name);
    const ext = getFileExtension(item.name);
    const size = formatFileSize(item.size);
    const typeClass = `type-${item.type}`;
    const typeLabel = item.type.charAt(0).toUpperCase() + item.type.slice(1);

    // Preview
    let previewHTML = '';
    if (item.type === 'image' && (item.previewUrl || item.url)) {
      const src = sanitizeURL(item.previewUrl || item.url);
      previewHTML = `<img src="${src}" alt="${name}">`;
    } else if (item.type === 'video') {
      previewHTML = `<svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>`;
    } else {
      previewHTML = `<svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`;
    }

    const uploadedIcon = item.uploaded ? ' ✓' : '';

    return `
      <div class="media-item" draggable="true" data-idx="${idx}">
        <div class="media-item-drag"><span></span><span></span><span></span></div>
        <div class="media-item-preview">${previewHTML}</div>
        <div class="media-item-info">
          <div class="media-item-name">${name}${uploadedIcon}</div>
          <div class="media-item-meta">
            <span class="media-type-badge ${typeClass}">${typeLabel}</span>
            <span class="media-item-size">${ext.toUpperCase()}${size ? ' · ' + size : ''}</span>
          </div>
        </div>
        <button class="media-item-remove" onclick="removeMediaItem(${idx})" title="Remove">&times;</button>
      </div>
    `;
  }).join('');
}

function removeMediaItem(idx) {
  const item = projectMediaItems[idx];
  if (item && item.previewUrl) {
    URL.revokeObjectURL(item.previewUrl);
  }
  projectMediaItems.splice(idx, 1);
  renderMediaItems();
}

// ---- Drag-to-Reorder ----
function initMediaDragReorder() {
  const list = document.getElementById('media-items-list');
  if (!list) return;

  let draggedIdx = null;

  list.addEventListener('dragstart', (e) => {
    const item = e.target.closest('.media-item');
    if (!item) return;
    draggedIdx = parseInt(item.getAttribute('data-idx'));
    item.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', ''); // Required for Firefox
  });

  list.addEventListener('dragend', (e) => {
    const item = e.target.closest('.media-item');
    if (item) item.classList.remove('dragging');
    draggedIdx = null;
  });

  list.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const afterElement = getDragAfterElement(list, e.clientY);
    const dragging = list.querySelector('.dragging');
    if (!dragging) return;
    if (afterElement == null) {
      list.appendChild(dragging);
    } else {
      list.insertBefore(dragging, afterElement);
    }
  });

  list.addEventListener('drop', (e) => {
    e.preventDefault();
    if (draggedIdx === null) return;

    // Read new order from DOM
    const items = list.querySelectorAll('.media-item');
    const newOrder = [];
    items.forEach(el => {
      const idx = parseInt(el.getAttribute('data-idx'));
      newOrder.push(projectMediaItems[idx]);
    });
    projectMediaItems = newOrder;
    renderMediaItems();
  });
}

function getDragAfterElement(container, y) {
  const draggableElements = [...container.querySelectorAll('.media-item:not(.dragging)')];

  return draggableElements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    if (offset < 0 && offset > closest.offset) {
      return { offset: offset, element: child };
    } else {
      return closest;
    }
  }, { offset: Number.NEGATIVE_INFINITY }).element;
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
    
    // Show first image from media
    let img = '';
    if (p.media && Array.isArray(p.media)) {
      const firstImg = p.media.find(m => m.type === 'image');
      if (firstImg) img = sanitizeURL(firstImg.url);
    }
    if (!img) img = sanitizeURL(p.image || '');

    const mediaCount = p.media && Array.isArray(p.media) ? p.media.length : (p.image ? 1 : 0);
    const mediaLabel = mediaCount > 0 ? ` · ${mediaCount} media` : '';

    return `
      <div class="item-row">
        <div class="item-thumb"><img src="${img}" alt="${title}"></div>
        <div class="item-info">
          <h4>${title}</h4>
          <span>${cat}${mediaLabel}</span>
        </div>
        <div class="item-actions">
          <button class="btn-edit" onclick="editProject(${idx})">Edit</button>
          <button class="btn-delete" onclick="deleteProject(${idx})">Delete</button>
        </div>
      </div>
    `;
  }).join('');
}

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
    projectMediaItems = [];
    renderMediaItems();
  }
}

function hideProjectForm() {
  document.getElementById('project-form').style.display = 'none';
  document.getElementById('project-list').style.display = 'block';
  document.getElementById('btn-add-project').style.display = '';
  // Clean up preview URLs
  projectMediaItems.forEach(item => {
    if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
  });
  projectMediaItems = [];
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

  // Load existing media into the list
  projectMediaItems = [];
  if (p.media && Array.isArray(p.media)) {
    p.media.forEach(m => {
      projectMediaItems.push({
        file: null,
        url: m.url,
        type: m.type || detectMediaType(m.name || m.url),
        name: m.name || getFilenameFromURL(m.url),
        size: 0,
        uploaded: true,
        previewUrl: m.type === 'image' ? m.url : ''
      });
    });
  } else if (p.image) {
    projectMediaItems.push({
      file: null,
      url: p.image,
      type: 'image',
      name: getFilenameFromURL(p.image),
      size: 0,
      uploaded: true,
      previewUrl: p.image
    });
  }
  renderMediaItems();
}

function getFilenameFromURL(url) {
  if (!url) return 'File';
  const parts = url.split('/');
  return parts[parts.length - 1].split('?')[0] || 'File';
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

  const saveBtn = document.querySelector('#project-form .btn-primary');

  // Upload all pending media files to Cloudinary
  setButtonLoading(saveBtn, true, 'Uploading media...');

  try {
    for (let i = 0; i < projectMediaItems.length; i++) {
      const item = projectMediaItems[i];
      if (item.file && !item.uploaded) {
        setButtonLoading(saveBtn, true, `Uploading ${i + 1}/${projectMediaItems.length}...`);
        const uploadedUrl = await uploadToCloudinary(item.file, item.type);
        item.url = uploadedUrl;
        item.uploaded = true;
        // Clean up preview URL
        if (item.previewUrl && item.previewUrl.startsWith('blob:')) {
          URL.revokeObjectURL(item.previewUrl);
          item.previewUrl = uploadedUrl;
        }
        renderMediaItems();
      }
    }
  } catch (err) {
    setButtonLoading(saveBtn, false);
    showToast('Media upload failed: ' + err.message, 'error');
    return;
  }

  // Build media array
  const mediaArray = projectMediaItems
    .filter(item => item.url) // Only items with URLs
    .map(item => ({
      type: item.type,
      url: item.url,
      name: item.name
    }));

  // Set image field to first image for backward compatibility
  const firstImage = mediaArray.find(m => m.type === 'image');
  const imageField = firstImage ? firstImage.url : (mediaArray.length > 0 ? mediaArray[0].url : 'images/project-branding.png');

  const projectData = {
    title: { en: titleEn, ar: titleAr || titleEn },
    desc: { en: descEn, ar: descAr || descEn },
    category: category,
    categoryLabel: { en: catLabelEn || category, ar: catLabelAr || catLabelEn || category },
    image: imageField,
    media: mediaArray,
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

  const saveBtn = document.querySelector('#cert-form .btn-primary');
  const fileInput = document.getElementById('cert-image-input');
  let imageToUse = currentCertImage || 'images/certificate.png';

  if (fileInput && fileInput.files && fileInput.files[0]) {
    setButtonLoading(saveBtn, true);
    try {
      const uploadedUrl = await uploadToCloudinary(fileInput.files[0], 'image');
      imageToUse = uploadedUrl;
    } catch (err) {
      setButtonLoading(saveBtn, false);
      showToast('Image upload failed: ' + err.message, 'error');
      return;
    }
    setButtonLoading(saveBtn, false);
  }

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
//  CLOUDINARY UPLOAD (Multi-type support)
// ============================================
const CLOUDINARY_CLOUD_NAME = 'degbom2gj';
const CLOUDINARY_UPLOAD_PRESET = 'portofolio-images';

/**
 * Upload any file to Cloudinary (images, videos, raw files).
 * Automatically selects the correct resource_type endpoint.
 * @param {File} file - The file to upload.
 * @param {string} mediaType - 'image', 'video', or 'file'
 * @returns {Promise<string>} The secure URL of the uploaded file.
 */
async function uploadToCloudinary(file, mediaType) {
  // Determine Cloudinary resource type
  let resourceType = 'auto'; // Let Cloudinary auto-detect
  if (mediaType === 'image') resourceType = 'image';
  else if (mediaType === 'video') resourceType = 'video';
  else resourceType = 'auto'; // 'auto' handles raw/image/video

  const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/upload`;

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  formData.append('resource_type', resourceType);

  try {
    const response = await fetch(uploadUrl, {
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
 */
function setButtonLoading(btn, isLoading, loadingText) {
  if (!btn) return;
  if (isLoading) {
    btn._originalText = btn._originalText || btn.textContent;
    btn.textContent = loadingText || 'Uploading... Please wait';
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

// ---- Certificate file input preview ----
document.addEventListener('DOMContentLoaded', () => {
  const certInput = document.getElementById('cert-image-input');
  if (certInput) {
    certInput.addEventListener('change', (e) => {
      previewSelectedImage(e.target.files[0], 'cert-preview');
    });
  }
});

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

  document.querySelectorAll('.admin-lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
  });

  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';

  const t = adminTranslations[lang];

  const navLinks = document.querySelectorAll('#sidebar-nav a');
  const navKeys = ['dashboard', 'projects', 'certificates', 'about', 'contact'];
  navLinks.forEach((link, i) => {
    if (navKeys[i]) {
      const svg = link.querySelector('svg');
      link.textContent = '';
      if (svg) link.appendChild(svg);
      link.appendChild(document.createTextNode(' ' + t[navKeys[i]]));
    }
  });

  const adminLabel = document.querySelector('.admin-label');
  if (adminLabel) adminLabel.textContent = t.adminPanel;

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
