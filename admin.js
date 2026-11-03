
let currentGalleryImages = [];

// Compress and optimize image to Web-ready JPEG Base64
async function compressImageFile(file, maxWidth = 1600, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxWidth) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxWidth) / height);
            height = maxWidth;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Handle Main Image from PC
async function handleMainImageUpload(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  try {
    showToast('Procesando foto principal...', 'info');
    const optimized = await compressImageFile(file);
    const input = document.getElementById('prop-image');
    if (input) input.value = optimized;
    setMainImagePreview(optimized);
    showToast('Foto principal cargada correctamente', 'success');
  } catch (err) {
    console.error('Error procesando foto:', err);
    showToast('Error al cargar la foto', 'error');
  } finally {
    event.target.value = '';
  }
}

// Set Main Image Preview
function setMainImagePreview(url) {
  const imgEl = document.getElementById('main-image-preview');
  const phEl = document.getElementById('main-image-placeholder');
  const btnRemove = document.getElementById('btn-remove-main-img');

  if (url) {
    if (imgEl) {
      imgEl.src = url;
      imgEl.classList.remove('hidden');
    }
    if (phEl) phEl.classList.add('hidden');
    if (btnRemove) btnRemove.classList.remove('hidden');
  } else {
    if (imgEl) {
      imgEl.src = '';
      imgEl.classList.add('hidden');
    }
    if (phEl) phEl.classList.remove('hidden');
    if (btnRemove) btnRemove.classList.add('hidden');
  }
}

// Clear Main Image
function clearMainImage() {
  const input = document.getElementById('prop-image');
  if (input) input.value = '';
  setMainImagePreview('');
}

// Handle Manual URL for Main Image
function handleMainImageUrlInput(url) {
  setMainImagePreview(url.trim());
}

// Handle Gallery Files from PC (Multiple)
async function handleGalleryFilesUpload(event) {
  const files = Array.from(event.target.files || []);
  if (files.length === 0) return;

  try {
    showToast(`Cargando y optimizando ${files.length} foto(s)...`, 'info');
    for (const file of files) {
      const optimized = await compressImageFile(file);
      currentGalleryImages.push(optimized);
    }
    renderGalleryPreviews();
    showToast(`Se agregaron ${files.length} foto(s) a la galería`, 'success');
  } catch (err) {
    console.error('Error procesando fotos de galería:', err);
    showToast('Error al procesar fotos', 'error');
  } finally {
    event.target.value = '';
  }
}

// Render Gallery Previews
function renderGalleryPreviews() {
  const grid = document.getElementById('gallery-previews-grid');
  const countEl = document.getElementById('gallery-count');
  if (!grid) return;

  if (countEl) {
    countEl.textContent = `${currentGalleryImages.length} fotos cargadas`;
  }

  if (currentGalleryImages.length === 0) {
    grid.innerHTML = '<div class="col-span-full py-4 text-center text-xs text-slate-500">No hay fotos en la galería todavía. Seleccioná fotos desde tu PC con el botón de arriba.</div>';
    return;
  }

  grid.innerHTML = currentGalleryImages.map((src, index) => `
    <div class="relative h-20 rounded-xl overflow-hidden bg-slate-800 border border-slate-700 group shadow-sm">
      <img src="${src}" alt="" class="w-full h-full object-cover">
      <button type="button" onclick="removeGalleryImage(${index})" class="absolute top-1 right-1 w-5 h-5 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-[10px] flex items-center justify-center shadow transition" title="Eliminar foto">
        <i class="fas fa-times"></i>
      </button>
    </div>
  `).join('');
}

// Remove Single Image from Gallery
function removeGalleryImage(index) {
  currentGalleryImages.splice(index, 1);
  renderGalleryPreviews();
}

// Toggle manual URL input for gallery
function toggleUrlGalleryInput() {
  const box = document.getElementById('gallery-url-container');
  if (box) box.classList.toggle('hidden');
}

// Sync gallery from text URLs if typed
function syncGalleryFromUrls() {
  const text = document.getElementById('prop-gallery-urls')?.value || '';
  const urls = text.split('\n').map(s => s.trim()).filter(Boolean);
  urls.forEach(u => {
    if (!currentGalleryImages.includes(u)) {
      currentGalleryImages.push(u);
    }
  });
  renderGalleryPreviews();
}

let currentTab = 'properties';
let siteContent = null;

// Switch Navigation Tabs
function switchTab(tab) {
  currentTab = tab;
  const propView = document.getElementById('tab-properties-view');
  const carouselView = document.getElementById('tab-carousel-view');
  const contentView = document.getElementById('tab-content-view');

  const btnProp = document.getElementById('tab-btn-properties');
  const btnCarousel = document.getElementById('tab-btn-carousel');
  const btnContent = document.getElementById('tab-btn-content');

  const activeCls = 'px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 bg-gradient-gold text-slate-950 shadow-md whitespace-nowrap';
  const inactiveCls = 'px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 whitespace-nowrap border border-slate-700';

  if (propView) propView.classList.add('hidden');
  if (carouselView) carouselView.classList.add('hidden');
  if (contentView) contentView.classList.add('hidden');

  if (btnProp) btnProp.className = inactiveCls;
  if (btnCarousel) btnCarousel.className = inactiveCls;
  if (btnContent) btnContent.className = inactiveCls;

  if (tab === 'properties') {
    if (propView) propView.classList.remove('hidden');
    if (btnProp) btnProp.className = activeCls;
  } else if (tab === 'carousel') {
    if (carouselView) carouselView.classList.remove('hidden');
    if (btnCarousel) btnCarousel.className = activeCls;
    renderCarouselAdminList();
  } else if (tab === 'content') {
    if (contentView) contentView.classList.remove('hidden');
    if (btnContent) btnContent.className = activeCls;
    loadSiteContentData();
    setupAutoSaveContent();
  }
}

// Auto-save site content on input
let autoSaveContentTimer = null;
function setupAutoSaveContent() {
  const form = document.getElementById('site-content-form');
  if (!form || form.dataset.autosaveBound) return;
  form.dataset.autosaveBound = 'true';
  form.addEventListener('input', () => {
    clearTimeout(autoSaveContentTimer);
    autoSaveContentTimer = setTimeout(() => {
      handleSaveSiteContent(null, true);
    }, 400);
  });
}

// Load Site Content for Editor
async function loadSiteContentData() {
  const local = localStorage.getItem('devora_site_content');
  if (local) {
    try {
      siteContent = JSON.parse(local);
      populateContentForm();
      return;
    } catch(e) {}
  }

  try {
    const res = await fetch('./data/site-content.json');
    if (res.ok) {
      siteContent = await res.json();
      populateContentForm();
    }
  } catch(err) {
    console.error('Error cargando site-content.json:', err);
  }
}

// Populate Editor Form
function populateContentForm() {
  if (!siteContent) return;

  // Hero
  setVal('edit-hero-badge', siteContent.hero?.badge);
  setVal('edit-hero-title', siteContent.hero?.title);
  setVal('edit-hero-subtitle', siteContent.hero?.subtitle);

  // Stats
  setVal('edit-stat1-num', siteContent.stats?.stat1_number);
  setVal('edit-stat1-lbl', siteContent.stats?.stat1_label);
  setVal('edit-stat2-num', siteContent.stats?.stat2_number);
  setVal('edit-stat2-lbl', siteContent.stats?.stat2_label);
  setVal('edit-stat3-num', siteContent.stats?.stat3_number);
  setVal('edit-stat3-lbl', siteContent.stats?.stat3_label);
  setVal('edit-stat4-num', siteContent.stats?.stat4_number);
  setVal('edit-stat4-lbl', siteContent.stats?.stat4_label);

  // Services
  setVal('edit-svc1-title', siteContent.services?.service1_title);
  setVal('edit-svc1-desc', siteContent.services?.service1_desc);
  setVal('edit-svc2-title', siteContent.services?.service2_title);
  setVal('edit-svc2-desc', siteContent.services?.service2_desc);
  setVal('edit-svc3-title', siteContent.services?.service3_title);
  setVal('edit-svc3-desc', siteContent.services?.service3_desc);

  // Nosotros
  setVal('edit-nos-quote-title', siteContent.nosotros?.quote_title);
  setVal('edit-nos-quote-desc', siteContent.nosotros?.quote_desc);
  setVal('edit-nos-title', siteContent.nosotros?.title);
  setVal('edit-nos-p1', siteContent.nosotros?.p1);
  setVal('edit-nos-p2', siteContent.nosotros?.p2);
  setVal('edit-nos-p3', siteContent.nosotros?.p3);
  setVal('edit-nos-p4', siteContent.nosotros?.p4);
  setVal('edit-nos-feat1-title', siteContent.nosotros?.feature1_title);
  setVal('edit-nos-feat1-desc', siteContent.nosotros?.feature1_desc);
  setVal('edit-nos-feat2-title', siteContent.nosotros?.feature2_title);
  setVal('edit-nos-feat2-desc', siteContent.nosotros?.feature2_desc);

  // Tasaciones
  setVal('edit-tas-badge', siteContent.tasaciones?.badge);
  setVal('edit-tas-title', siteContent.tasaciones?.title);
  setVal('edit-tas-desc', siteContent.tasaciones?.desc);
  setVal('edit-tas-bullet1', siteContent.tasaciones?.bullet1);
  setVal('edit-tas-bullet2', siteContent.tasaciones?.bullet2);
  setVal('edit-tas-bullet3', siteContent.tasaciones?.bullet3);
  setVal('edit-tas-cred-title', siteContent.tasaciones?.cred_title);
  setVal('edit-tas-cred-mat', siteContent.tasaciones?.cred_mat);
  setVal('edit-tas-cred-addr', siteContent.tasaciones?.cred_addr);
  setVal('edit-tas-cred-phone', siteContent.tasaciones?.cred_phone);

  // Coverage zones
  setVal('edit-coverage-zones', (siteContent.coverage_zones || []).join('\n'));

  // Contact
  setVal('edit-cnt-address', siteContent.contact?.office_address || siteContent.topbar?.address);
  setVal('edit-cnt-phone', siteContent.contact?.phone || siteContent.topbar?.phone);
  setVal('edit-cnt-whatsapp', siteContent.contact?.whatsapp || siteContent.topbar?.whatsapp);
  setVal('edit-cnt-email', siteContent.contact?.email || siteContent.topbar?.email);
  setVal('edit-cnt-hours', siteContent.contact?.hours || siteContent.topbar?.hours);
  setVal('edit-cnt-license', siteContent.contact?.license);

  // FAQs
  if (typeof renderAdminFaqs === 'function') {
    renderAdminFaqs();
  }
}

function setVal(id, val) {
  const el = document.getElementById(id);
  if (el && typeof val !== 'undefined') el.value = val;
}

function getVal(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : '';
}

// Save Site Content
function handleSaveSiteContent(e, silent = false) {
  if (e) e.preventDefault();

  // If the content form hasn't been rendered or inputs don't exist yet, preserve existing
  const heroBadge = document.getElementById('edit-hero-badge');
  if (!heroBadge && siteContent) {
    return;
  }

  siteContent = {
    topbar: {
      address: getVal('edit-cnt-address'),
      phone: getVal('edit-cnt-phone'),
      whatsapp: getVal('edit-cnt-whatsapp'),
      hours: getVal('edit-cnt-hours'),
      email: getVal('edit-cnt-email')
    },
    hero: {
      badge: getVal('edit-hero-badge'),
      title: getVal('edit-hero-title'),
      subtitle: getVal('edit-hero-subtitle')
    },
    stats: {
      stat1_number: getVal('edit-stat1-num'),
      stat1_label: getVal('edit-stat1-lbl'),
      stat2_number: getVal('edit-stat2-num'),
      stat2_label: getVal('edit-stat2-lbl'),
      stat3_number: getVal('edit-stat3-num'),
      stat3_label: getVal('edit-stat3-lbl'),
      stat4_number: getVal('edit-stat4-num'),
      stat4_label: getVal('edit-stat4-lbl')
    },
    services: {
      service1_title: getVal('edit-svc1-title'),
      service1_desc: getVal('edit-svc1-desc'),
      service2_title: getVal('edit-svc2-title'),
      service2_desc: getVal('edit-svc2-desc'),
      service3_title: getVal('edit-svc3-title'),
      service3_desc: getVal('edit-svc3-desc')
    },
    nosotros: {
      quote_title: getVal('edit-nos-quote-title'),
      quote_desc: getVal('edit-nos-quote-desc'),
      title: getVal('edit-nos-title'),
      p1: getVal('edit-nos-p1'),
      p2: getVal('edit-nos-p2'),
      p3: getVal('edit-nos-p3'),
      p4: getVal('edit-nos-p4'),
      feature1_title: getVal('edit-nos-feat1-title'),
      feature1_desc: getVal('edit-nos-feat1-desc'),
      feature2_title: getVal('edit-nos-feat2-title'),
      feature2_desc: getVal('edit-nos-feat2-desc')
    },
    tasaciones: {
      badge: getVal('edit-tas-badge'),
      title: getVal('edit-tas-title'),
      desc: getVal('edit-tas-desc'),
      bullet1: getVal('edit-tas-bullet1'),
      bullet2: getVal('edit-tas-bullet2'),
      bullet3: getVal('edit-tas-bullet3'),
      cred_title: getVal('edit-tas-cred-title'),
      cred_mat: getVal('edit-tas-cred-mat'),
      cred_addr: getVal('edit-tas-cred-addr'),
      cred_phone: getVal('edit-tas-cred-phone')
    },
    coverage_zones: getVal('edit-coverage-zones').split('\n').map(s => s.trim()).filter(Boolean),
    contact: {
      office_address: getVal('edit-cnt-address'),
      phone: getVal('edit-cnt-phone'),
      whatsapp: getVal('edit-cnt-whatsapp'),
      email: getVal('edit-cnt-email'),
      hours: getVal('edit-cnt-hours'),
      license: getVal('edit-cnt-license')
    },
    carousel: (siteContent && siteContent.carousel) || getCarouselSlides(),
    faqs: getFaqsFromAdminForm()
  };

  localStorage.setItem('devora_site_content', JSON.stringify(siteContent));
  if (!silent) {
    showToast('Textos del sitio guardados con éxito', 'success');
  }
}
// admin.js - Panel de Administración Dévora Fernández Propiedades

const ADMIN_CREDENTIALS = {
  users: ['admin', 'devora', 'devoraf258admi'],
  pass: 'devora2026'
};

const GITHUB_CONFIG = {
  owner: 'devoraf258admi-create',
  repo: 'inmobiliaria-devora-fernandez',
  path: 'data/properties.json'
};

let properties = [];
let filteredProperties = [];

// Init on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
});

// Check Session Authentication
function checkAuth() {
  const isAuth = sessionStorage.getItem('devora_admin_auth') === 'true';
  const authContainer = document.getElementById('auth-container');
  const dashboardContainer = document.getElementById('dashboard-container');

  if (isAuth) {
    if (authContainer) authContainer.classList.add('hidden');
    if (dashboardContainer) dashboardContainer.classList.remove('hidden');
    loadPropertiesData();
    loadSiteContentData();
  } else {
    if (authContainer) authContainer.classList.remove('hidden');
    if (dashboardContainer) dashboardContainer.classList.add('hidden');
  }
}

// Handle Login
function handleLogin(e) {
  e.preventDefault();
  const user = document.getElementById('login-user').value.trim().toLowerCase();
  const pass = document.getElementById('login-pass').value.trim();
  const errorBox = document.getElementById('login-error');

  if (ADMIN_CREDENTIALS.users.includes(user) && pass === ADMIN_CREDENTIALS.pass) {
    sessionStorage.setItem('devora_admin_auth', 'true');
    if (errorBox) errorBox.classList.add('hidden');
    checkAuth();
    showToast('Bienvenido al Panel de Administración', 'success');
  } else {
    if (errorBox) {
      errorBox.classList.remove('hidden');
      document.getElementById('login-error-text').textContent = 'Usuario o contraseña incorrectos.';
    }
  }
}

// Handle Logout
function handleLogout() {
  if (confirm('¿Deseas cerrar la sesión de administración?')) {
    sessionStorage.removeItem('devora_admin_auth');
    checkAuth();
  }
}

// Load Properties Data
async function loadPropertiesData() {
  const localData = localStorage.getItem('devora_properties');
  if (localData) {
    try {
      properties = JSON.parse(localData);
      normalizeProperties();
      saveToLocal();
      renderAdminDashboard();
      return;
    } catch (err) {
      console.warn('Error parseando localStorage:', err);
    }
  }

  // Fallback to fetching properties.json
  try {
    const res = await fetch('./data/properties.json');
    if (res.ok) {
      properties = await res.json();
      normalizeProperties();
      saveToLocal();
      renderAdminDashboard();
    }
  } catch (err) {
    console.error('Error cargando properties.json:', err);
    showToast('No se pudieron cargar las propiedades', 'error');
  }
}

// Normalize each property to guarantee default fields like status
function normalizeProperties() {
  properties = properties.filter(p => p.id !== 6 && p.id !== 12);
  properties.forEach(p => {
    if (!p.status) {
      p.status = 'Disponible';
    }
    if (!p.gallery) {
      p.gallery = [];
    }
    if (typeof p.featured === 'undefined') {
      p.featured = false;
    }
  });
}

// Save to LocalStorage
function saveToLocal() {
  localStorage.setItem('devora_properties', JSON.stringify(properties));
}

// Render Dashboard (Stats + Featured + Table)
function renderAdminDashboard() {
  updateStats();
  renderAdminFeaturedPanel();
  renderAdminLast6();
  filterAdminProperties();
}

// Render last 6 published properties
function renderAdminLast6() {
  const grid = document.getElementById('admin-last6-grid');
  if (!grid) return;

  const nonFeatured = properties.filter(p => !p.featured);
  const last6 = nonFeatured.slice(0, 6);

  if (last6.length === 0) {
    grid.innerHTML = '<p class="text-slate-500 text-sm col-span-3 text-center py-4">No hay propiedades publicadas.</p>';
    return;
  }

  grid.innerHTML = last6.map(p => {
    const opColor = p.operation === 'Venta' ? 'bg-amber-500' : 'bg-emerald-500';
    return `
      <div class="bg-slate-800/60 border border-slate-700 rounded-xl overflow-hidden flex flex-col hover:border-teal-500/50 transition">
        <div class="relative h-32 bg-slate-700">
          <img src="${p.image || 'assets/img/logo.png'}" alt="" class="w-full h-full object-cover">
          <span class="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold text-white ${opColor}">${p.operation}</span>
        </div>
        <div class="p-3 flex flex-col gap-1 flex-1">
          <span class="text-[10px] text-slate-400 font-mono">#${p.id}</span>
          <h4 class="text-xs font-bold text-white line-clamp-2 leading-tight">${p.title}</h4>
          <p class="text-[11px] text-slate-400 line-clamp-1"><i class="fas fa-map-marker-alt text-teal-400 mr-1"></i>${p.address || ''}</p>
          <p class="text-xs font-bold text-teal-300 mt-1">${p.priceDisplay || 'Consultar'}</p>
          <button onclick="openModalEdit(${p.id})" class="mt-2 w-full py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-[11px] font-bold transition flex items-center justify-center gap-1">
            <i class="fas fa-pen"></i> Editar
          </button>
        </div>
      </div>
    `;
  }).join('');
}

// Update Top KPI Cards
function updateStats() {
  const total = properties.length;
  const available = properties.filter(p => p.status === 'Disponible').length;
  const sold = properties.filter(p => p.status === 'Vendido').length;
  const rented = properties.filter(p => p.status === 'Alquilado').length;
  const reserved = properties.filter(p => p.status === 'Reservado').length;

  document.getElementById('stat-total').textContent = total;
  document.getElementById('stat-available').textContent = available;
  document.getElementById('stat-sold').textContent = sold;
  document.getElementById('stat-rented').textContent = rented;
  document.getElementById('stat-reserved').textContent = reserved;
}

// Filter Properties Table
function filterAdminProperties() {
  const q = (document.getElementById('admin-search')?.value || '').toLowerCase().trim();
  const status = document.getElementById('admin-filter-status')?.value || 'todos';
  const op = document.getElementById('admin-filter-op')?.value || 'todos';
  const type = document.getElementById('admin-filter-type')?.value || 'todos';

  filteredProperties = properties.filter(p => {
    const matchesQ = !q ||
      (p.title && p.title.toLowerCase().includes(q)) ||
      (p.address && p.address.toLowerCase().includes(q)) ||
      (p.location && p.location.toLowerCase().includes(q)) ||
      String(p.id).includes(q);

    let matchesStatus = true;
    if (status === 'destacadas') {
      matchesStatus = !!p.featured;
    } else if (status !== 'todos') {
      matchesStatus = (p.status || 'Disponible') === status;
    }
    const matchesOp = op === 'todos' || p.operation === op;
    const matchesType = type === 'todos' || p.propertyType === type;

    return matchesQ && matchesStatus && matchesOp && matchesType;
  });

  renderTableRows();
}

// Render Table Rows
function renderTableRows() {
  const tbody = document.getElementById('admin-properties-list');
  const emptyState = document.getElementById('admin-empty-state');
  if (!tbody) return;

  if (filteredProperties.length === 0) {
    tbody.innerHTML = '';
    if (emptyState) emptyState.classList.remove('hidden');
    return;
  }

  if (emptyState) emptyState.classList.add('hidden');

  tbody.innerHTML = filteredProperties.map(p => {
    const status = p.status || 'Disponible';
    
    // Status Badge Styling
    let statusBadge = '';
    if (status === 'Vendido') {
      statusBadge = '<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-950/80 text-rose-400 border border-rose-800/80"><i class="fas fa-tag"></i> Vendido</span>';
    } else if (status === 'Alquilado') {
      statusBadge = '<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-sky-950/80 text-sky-400 border border-sky-800/80"><i class="fas fa-key"></i> Alquilado</span>';
    } else if (status === 'Reservado') {
      statusBadge = '<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-950/80 text-amber-400 border border-amber-800/80"><i class="fas fa-clock"></i> Reservado</span>';
    } else {
      statusBadge = '<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-800/80"><i class="fas fa-check-circle"></i> Disponible</span>';
    }

    return `
      <tr class="hover:bg-slate-800/40 transition">
        <!-- Propiedad (Foto + Título + Dirección) -->
        <td class="py-3 px-4">
          <div class="flex items-center gap-3">
            <img src="${p.image || 'assets/img/logo.png'}" alt="" class="w-12 h-12 object-cover rounded-xl bg-slate-800 border border-slate-700 shrink-0">
            <div class="max-w-xs sm:max-w-sm">
              <span class="text-xs text-slate-400 font-mono">#${p.id}</span>
              <h4 class="font-bold text-white text-xs line-clamp-1 hover:text-amber-400 transition" title="${p.title}">${p.title}</h4>
              <p class="text-[11px] text-slate-400 line-clamp-1"><i class="fas fa-map-marker-alt text-amber-500 mr-1"></i>${p.address || ''}, ${p.location || ''}</p>
            </div>
          </div>
        </td>

        <!-- Tipo / Operación -->
        <td class="py-3 px-4">
          <span class="text-slate-200 font-semibold block">${p.propertyType}</span>
          <span class="text-[11px] ${p.operation === 'Venta' ? 'text-amber-400' : 'text-emerald-400'} font-bold uppercase tracking-wider">${p.operation}</span>
        </td>

        <!-- Precio -->
        <td class="py-3 px-4 font-bold text-white whitespace-nowrap">
          ${p.priceDisplay || 'Consultar'}
        </td>

        <!-- Estado Actual -->
        <td class="py-3 px-4">
          ${statusBadge}
        </td>

        <!-- Cambiar Estado Rápido -->
        <td class="py-3 px-4 text-center">
          <div class="inline-flex items-center gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700">
            <button onclick="changeStatus(${p.id}, 'Disponible')" title="Marcar Disponible" class="px-2 py-1 rounded-lg text-[11px] font-bold ${status === 'Disponible' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'} transition">Disp.</button>
            <button onclick="changeStatus(${p.id}, 'Vendido')" title="Marcar Vendido" class="px-2 py-1 rounded-lg text-[11px] font-bold ${status === 'Vendido' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'} transition">Vendido</button>
            <button onclick="changeStatus(${p.id}, 'Alquilado')" title="Marcar Alquilado" class="px-2 py-1 rounded-lg text-[11px] font-bold ${status === 'Alquilado' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'} transition">Alquilado</button>
            <button onclick="changeStatus(${p.id}, 'Reservado')" title="Marcar Reservado" class="px-2 py-1 rounded-lg text-[11px] font-bold ${status === 'Reservado' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'} transition">Reservado</button>
          </div>
        </td>

        <!-- Acciones -->
        <td class="py-3 px-4 text-right whitespace-nowrap">
          <div class="flex items-center justify-end gap-2">
            <button onclick="toggleFeaturedProperty(${p.id})" class="p-2 bg-slate-800 ${p.featured ? 'text-amber-400 bg-amber-500/10 border border-amber-500/40 shadow-sm shadow-amber-500/10' : 'text-slate-500 hover:text-amber-400'} rounded-lg transition" title="${p.featured ? 'Inmueble Destacado (Quitar)' : 'Marcar como Destacada'}">
              <i class="fas fa-star text-xs"></i>
            </button>
            <button onclick="openModalEdit(${p.id})" class="p-2 bg-slate-800 hover:bg-amber-600/20 hover:text-amber-400 text-slate-300 rounded-lg transition" title="Editar Propiedad">
              <i class="fas fa-edit"></i>
            </button>
            <button onclick="deleteProperty(${p.id})" class="p-2 bg-slate-800 hover:bg-rose-600/20 hover:text-rose-400 text-slate-300 rounded-lg transition" title="Eliminar Propiedad">
              <i class="fas fa-trash-alt"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// Quick Change Status
function changeStatus(id, newStatus) {
  const prop = properties.find(p => p.id === id);
  if (!prop) return;

  prop.status = newStatus;
  saveToLocal();
  renderAdminDashboard();
  showToast(`Propiedad #${id} marcada como ${newStatus}`, 'success');
}

// Delete Property
function deleteProperty(id) {
  const prop = properties.find(p => p.id === id);
  if (!prop) return;

  if (confirm(`¿Estás seguro de que deseas eliminar permanentemente la propiedad "${prop.title}" (#${id})?`)) {
    properties = properties.filter(p => p.id !== id);
    saveToLocal();
    renderAdminDashboard();
    showToast(`Propiedad #${id} eliminada`, 'info');
  }
}

// Open Modal: Create
function openModalCreate() {
  document.getElementById('property-form').reset();
  document.getElementById('prop-id').value = '';
  document.getElementById('form-modal-title').textContent = 'Nueva Propiedad';
  currentGalleryImages = [];
  setMainImagePreview('');
  renderGalleryPreviews();
  document.getElementById('property-form-modal').classList.remove('hidden');
}

// Open Modal: Edit
function openModalEdit(id) {
  const prop = properties.find(p => p.id === id);
  if (!prop) return;

  document.getElementById('prop-id').value = prop.id;
  document.getElementById('form-modal-title').textContent = `Editar Propiedad #${prop.id}`;
  
  document.getElementById('prop-title').value = prop.title || '';
  document.getElementById('prop-operation').value = prop.operation || 'Venta';
  document.getElementById('prop-type').value = prop.propertyType || 'Casa';
  document.getElementById('prop-status').value = prop.status || 'Disponible';
  
  // Parse currency and price
  const pDisp = (prop.priceDisplay || '').toUpperCase();
  if (pDisp.includes('ARS') || pDisp.includes('$')) {
    document.getElementById('prop-currency').value = 'ARS';
  } else {
    document.getElementById('prop-currency').value = 'USD';
  }

  document.getElementById('prop-price').value = prop.priceUsd > 0 ? prop.priceUsd : (prop.priceDisplay || '');
  document.getElementById('prop-location').value = prop.location || '';
  document.getElementById('prop-address').value = prop.address || '';
  document.getElementById('prop-rooms').value = prop.environments || 0;
  document.getElementById('prop-beds').value = prop.bedrooms || 0;
  document.getElementById('prop-baths').value = prop.bathrooms || 1;
  document.getElementById('prop-surface-total').value = prop.surfaceTotal || 0;
  document.getElementById('prop-surface-covered').value = prop.surfaceCovered || 0;
  document.getElementById('prop-image').value = prop.image || '';
  setMainImagePreview(prop.image || '');
  currentGalleryImages = Array.isArray(prop.gallery) ? [...prop.gallery] : [];
  renderGalleryPreviews();
  document.getElementById('prop-desc').value = prop.description || '';
  document.getElementById('prop-featured').checked = !!prop.featured;
  
  const combined = ((prop.title || '') + ' ' + (prop.description || '') + ' ' + (prop.features || []).join(' ')).toLowerCase();
  document.getElementById('prop-credit').checked = combined.includes('crédito') || combined.includes('credito') || combined.includes('apto');

  document.getElementById('property-form-modal').classList.remove('hidden');
}

// Close Modal
function closeFormModal() {
  document.getElementById('property-form-modal').classList.add('hidden');
}

// Handle Save Property (Create / Update)
function handleSaveProperty(e) {
  e.preventDefault();
  
  const idVal = document.getElementById('prop-id').value;
  const isEdit = !!idVal;
  const id = isEdit ? parseInt(idVal) : Date.now();

  const title = document.getElementById('prop-title').value.trim();
  const operation = document.getElementById('prop-operation').value;
  const propertyType = document.getElementById('prop-type').value;
  const status = document.getElementById('prop-status').value;
  const currency = document.getElementById('prop-currency').value;
  const rawPrice = document.getElementById('prop-price').value.trim();
  const location = document.getElementById('prop-location').value.trim();
  const address = document.getElementById('prop-address').value.trim();
  const environments = parseInt(document.getElementById('prop-rooms').value) || 0;
  const bedrooms = parseInt(document.getElementById('prop-beds').value) || 0;
  const bathrooms = parseInt(document.getElementById('prop-baths').value) || 1;
  const surfaceTotal = parseInt(document.getElementById('prop-surface-total').value) || 0;
  const surfaceCovered = parseInt(document.getElementById('prop-surface-covered').value) || 0;
  const image = document.getElementById('prop-image').value.trim();
  const gallery = [...currentGalleryImages];
  const description = document.getElementById('prop-desc').value.trim();
  const featured = document.getElementById('prop-featured').checked;
  const isCredit = document.getElementById('prop-credit').checked;

  // Format price
  let priceUsd = 0;
  let priceDisplay = rawPrice;
  const numOnly = parseInt(rawPrice.replace(/[^\d]/g, ''));
  if (!isNaN(numOnly) && numOnly > 0) {
    if (currency === 'USD') {
      priceUsd = numOnly;
      priceDisplay = `USD ${numOnly.toLocaleString('es-AR')}`;
    } else {
      priceDisplay = `ARS ${numOnly.toLocaleString('es-AR')}`;
    }
  }

  const features = [];
  if (isCredit) features.push('Apto Crédito');
  if (environments > 0) features.push(`${environments} Ambientes`);
  if (bedrooms > 0) features.push(`${bedrooms} Dormitorios`);
  if (bathrooms > 0) features.push(`${bathrooms} Baños`);

  const propData = {
    id,
    code: `PROP-${id}`,
    title,
    location,
    address,
    operation,
    propertyType,
    status,
    priceUsd,
    priceDisplay,
    featured,
    bedrooms,
    bathrooms,
    environments,
    surfaceTotal,
    surfaceCovered,
    description,
    features,
    image,
    gallery,
    originalUrl: ''
  };

  if (isEdit) {
    const idx = properties.findIndex(p => p.id === id);
    if (idx !== -1) {
      properties[idx] = { ...properties[idx], ...propData };
    }
  } else {
    properties.unshift(propData);
  }

  saveToLocal();
  renderAdminDashboard();
  closeFormModal();
  showToast(isEdit ? 'Propiedad actualizada con éxito' : 'Nueva propiedad creada con éxito', 'success');
}

// Cloud Sync to GitHub -> Triggers Vercel Auto Deploy
async function syncToCloud() {
  // 0. Auto-save current site content if form is present so no changes are lost
  try {
    handleSaveSiteContent(null, true);
  } catch (err) {
    console.warn('Auto-save site content before sync:', err);
  }

  // Ensure siteContent is in memory from localStorage if available
  if (!siteContent) {
    const localContent = localStorage.getItem('devora_site_content');
    if (localContent) {
      try {
        siteContent = JSON.parse(localContent);
      } catch(e) {}
    }
  }

  let token = (localStorage.getItem('devora_gh_token') || '').trim();
  if (!token) {
    const inputToken = prompt('Para publicar en la web automáticamente, ingresá tu Token de GitHub (solo se pide la primera vez en este navegador):');
    if (!inputToken) {
      showToast('Publicación cancelada: se necesita el Token de GitHub', 'info');
      return;
    }
    token = inputToken.trim();
    localStorage.setItem('devora_gh_token', token);
  }

  const btn = document.getElementById('btn-sync');
  const originalHtml = btn.innerHTML;

  try {
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>Publicando catálogo...</span>';

    // 1. Get current SHA from GitHub for properties.json
    const getUrl = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${GITHUB_CONFIG.path}?ref=main&t=${Date.now()}`;
    const getRes = await fetch(getUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (!getRes.ok) {
      if (getRes.status === 401 || getRes.status === 403) {
        localStorage.removeItem('devora_gh_token');
        throw new Error('Token de GitHub no válido o vencido. Por favor volvé a ingresarlo.');
      }
      throw new Error(`Error conectando con GitHub (${getRes.status})`);
    }

    const fileInfo = await getRes.json();
    const currentSha = fileInfo.sha;

    // 2. Encode properties to base64 (UTF-8 safe)
    const jsonStr = JSON.stringify(properties, null, 2);
    const utf8Bytes = new TextEncoder().encode(jsonStr);
    let binary = '';
    utf8Bytes.forEach(b => binary += String.fromCharCode(b));
    const base64Content = btoa(binary);

    // 3. PUT updated properties to GitHub
    const putRes = await fetch(getUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: 'Actualización de catálogo desde Panel de Administración Dévora',
        content: base64Content,
        sha: currentSha,
        branch: 'main'
      })
    });

    if (!putRes.ok) {
      const errData = await putRes.json();
      throw new Error(errData.message || 'Error guardando catálogo en GitHub');
    }

    // 4. Sync site-content.json if present
    if (siteContent) {
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>Publicando textos...</span>';
      const contentPath = 'data/site-content.json';
      const getContentUrl = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${contentPath}?ref=main&t=${Date.now()}`;
      const getContentRes = await fetch(getContentUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      let contentSha = null;
      if (getContentRes.ok) {
        const cInfo = await getContentRes.json();
        contentSha = cInfo.sha;
      }

      const contentJson = JSON.stringify(siteContent, null, 2);
      const cUtf8 = new TextEncoder().encode(contentJson);
      let cBin = '';
      cUtf8.forEach(b => cBin += String.fromCharCode(b));
      const cB64 = btoa(cBin);

      const putContentRes = await fetch(getContentUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: 'Actualización de textos desde Panel de Administración',
          content: cB64,
          sha: contentSha || undefined,
          branch: 'main'
        })
      });

      if (!putContentRes.ok) {
        const cErrData = await putContentRes.json();
        throw new Error(cErrData.message || 'Error guardando textos del sitio en GitHub');
      }
    }

    showToast('¡Publicado con éxito! Vercel actualizará la web en unos 30-45 segundos (recargá con Ctrl+F5)', 'success');
  } catch (err) {
    console.error('Error en syncToCloud:', err);
    showToast(`Error de publicación: ${err.message}`, 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = originalHtml;
  }
}

// Export Backup JSON
function exportBackupJSON() {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(properties, null, 2));
  const dlAnchor = document.createElement('a');
  dlAnchor.setAttribute('href', dataStr);
  dlAnchor.setAttribute('download', `propiedades-devora-${new Date().toISOString().slice(0, 10)}.json`);
  dlAnchor.click();
  showToast('Copia de seguridad descargada', 'info');
}

// Show Toast
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  const toastText = document.getElementById('toast-text');
  const toastIcon = document.getElementById('toast-icon');

  if (!toast) return;

  toastText.textContent = message;
  
  if (type === 'error') {
    toastIcon.className = 'fas fa-exclamation-circle text-rose-400 text-lg';
  } else if (type === 'info') {
    toastIcon.className = 'fas fa-info-circle text-sky-400 text-lg';
  } else {
    toastIcon.className = 'fas fa-check-circle text-emerald-400 text-lg';
  }

  toast.classList.remove('translate-y-24', 'opacity-0');
  setTimeout(() => {
    toast.classList.add('translate-y-24', 'opacity-0');
  }, 4000);
}


// ==========================================
// CAROUSEL MANAGEMENT (ADMIN)
// ==========================================
const DEFAULT_CAROUSEL_SLIDES = [
  {
    image: 'https://static.kiteprop.com/kp/properties/588719/96371f/lg/96371f46e01b1eb449bd53842cca9df1.jpg',
    tag: 'Chalet de Categoría',
    location: 'Castelar Norte'
  },
  {
    image: 'https://static.kiteprop.com/kp/properties/564309/76c263/lg/76c263d122244f4e4891a441da18a487.jpg',
    tag: 'Residencia Familiar',
    location: 'Hurlingham / Villa Tesei'
  },
  {
    image: 'https://static.kiteprop.com/kp/properties/405103/c77901/lg/c7790139e6f4d194c7dce4f7859e0ce1.jpg',
    tag: 'Dúplex Moderno',
    location: 'Morón Sur'
  },
  {
    image: 'https://static.kiteprop.com/kp/properties/577961/d99c5b/lg/d99c5b595017ff4cbb489064e50e4316.jpg',
    tag: 'Departamento Céntrico',
    location: 'Morón Centro'
  },
  {
    image: 'https://static.kiteprop.com/kp/properties/548736/e1ae2b/lg/e1ae2b6ac8403ccd24bcdd516cb77b14.jpg',
    tag: 'Casa Americana',
    location: 'Castelar / Morón'
  },
  {
    image: 'https://static.kiteprop.com/kp/properties/536342/9c9bbb/lg/9c9bbb3e30823140b488fa9314b26171.jpg',
    tag: 'Edificio Residencial',
    location: 'Villa Sarmiento / Ramos Mejía'
  }
];

function getCarouselSlides() {
  if (siteContent && Array.isArray(siteContent.carousel) && siteContent.carousel.length > 0) {
    return siteContent.carousel;
  }
  return DEFAULT_CAROUSEL_SLIDES;
}

async function ensureSiteContentLoaded() {
  if (siteContent && Array.isArray(siteContent.carousel)) return siteContent;
  const local = localStorage.getItem('devora_site_content');
  if (local) {
    try {
      siteContent = JSON.parse(local);
      if (Array.isArray(siteContent.carousel)) return siteContent;
    } catch(e) {}
  }
  try {
    const res = await fetch('./data/site-content.json');
    if (res.ok) {
      siteContent = await res.json();
    }
  } catch(e) {}
  return siteContent;
}

async function renderCarouselAdminList() {
  await ensureSiteContentLoaded();
  const container = document.getElementById('carousel-admin-grid');
  const countBadge = document.getElementById('carousel-count-badge');
  if (!container) return;

  const slides = getCarouselSlides();
  if (countBadge) {
    countBadge.textContent = `${slides.length} foto(s) configurada(s)`;
  }

  if (slides.length === 0) {
    container.innerHTML = `<div class="col-span-full py-8 text-center text-xs text-slate-500">
      No hay fotos en el carrusel. Subí fotos desde tu PC o ingresá un enlace arriba.
    </div>`;
    return;
  }

  container.innerHTML = slides.map((slide, index) => `
    <div class="bg-slate-950/80 border border-slate-800 rounded-2xl overflow-hidden shadow-lg flex flex-col group hover:border-slate-700 transition cursor-grab active:cursor-grabbing select-none"
         draggable="true"
         data-carousel-index="${index}"
         ondragstart="handleCarouselDragStart(event, ${index})"
         ondragover="handleCarouselDragOver(event)"
         ondragenter="handleCarouselDragEnter(event, ${index})"
         ondragleave="handleCarouselDragLeave(event)"
         ondrop="handleCarouselDrop(event, ${index})"
         ondragend="handleCarouselDragEnd(event)">
      
      <div class="relative h-44 bg-slate-900 overflow-hidden cursor-pointer group/img" onclick="openCarouselRepositionModal(${index})" title="Hacé clic para encuadrar y reposicionar la foto">
        <img src="${slide.image}" alt="${slide.tag || ''}" class="w-full h-full object-cover transition-transform group-hover/img:scale-105" style="object-position: ${slide.position || 'center 50%'};">
        
        <div class="absolute top-2 inset-x-2 flex items-center justify-between pointer-events-none">
          <span class="px-2.5 py-1 bg-slate-900/85 backdrop-blur-md text-cyan-300 text-[11px] font-extrabold rounded-lg border border-white/10 shadow">
            #${index + 1}
          </span>
          <span class="px-2 py-1 bg-teal-950/90 backdrop-blur-md text-teal-300 text-[10px] font-bold rounded-lg border border-teal-500/40 flex items-center gap-1 shadow">
            <i class="fas fa-crop-alt"></i> Encuadrar
          </span>
        </div>

        <div class="absolute bottom-2 right-2 pointer-events-none bg-slate-950/80 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-mono text-slate-300 border border-white/10">
          ${slide.position || 'center'}
        </div>
      </div>

      <div class="p-4 flex-1 flex flex-col justify-between gap-3">
        <div>
          <h5 class="text-xs font-bold text-white truncate">${slide.tag || 'Foto ' + (index + 1)}</h5>
          <p class="text-[11px] text-slate-400 truncate">${slide.location || 'Dévora Fernández Propiedades'}</p>
        </div>
        <div class="flex items-center justify-between border-t border-slate-800/80 pt-3">
          <div class="flex items-center gap-1.5">
            <button type="button" onclick="openCarouselRepositionModal(${index})" class="px-2.5 py-1 rounded-lg bg-teal-950/80 hover:bg-teal-900 text-teal-300 hover:text-white border border-teal-700/60 text-xs font-bold flex items-center gap-1 transition" title="Arrastrar para encuadrar">
              <i class="fas fa-crop-alt"></i>
              <span>Encuadrar</span>
            </button>
            <button type="button" onclick="moveCarouselSlide(${index}, -1)" class="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs flex items-center justify-center transition" title="Mover arriba / izquierda" ${index === 0 ? 'disabled class="opacity-40 cursor-not-allowed"' : ''}>
              <i class="fas fa-arrow-up"></i>
            </button>
            <button type="button" onclick="moveCarouselSlide(${index}, 1)" class="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs flex items-center justify-center transition" title="Mover abajo / derecha" ${index === slides.length - 1 ? 'disabled class="opacity-40 cursor-not-allowed"' : ''}>
              <i class="fas fa-arrow-down"></i>
            </button>
          </div>
          <button type="button" onclick="deleteCarouselSlide(${index})" class="px-2.5 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/50 text-rose-300 text-xs font-semibold flex items-center gap-1 transition">
            <i class="fas fa-trash-alt text-[10px]"></i>
            <span>Eliminar</span>
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

async function handleCarouselUpload(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  try {
    showToast('Procesando foto de tu PC...', 'info');
    const optimized = await compressImageFile(file, 1920, 0.85);

    if (!siteContent) siteContent = {};
    if (!Array.isArray(siteContent.carousel)) {
      siteContent.carousel = [...DEFAULT_CAROUSEL_SLIDES];
    }

    const tagInput = document.getElementById('carousel-new-tag');
    const locInput = document.getElementById('carousel-new-loc');

    const newSlide = {
      image: optimized,
      tag: (tagInput && tagInput.value.trim()) || 'Propiedad Destacada',
      location: (locInput && locInput.value.trim()) || 'Morón y Zona Oeste'
    };

    siteContent.carousel.push(newSlide);
    localStorage.setItem('devora_site_content', JSON.stringify(siteContent));

    if (tagInput) tagInput.value = '';
    if (locInput) locInput.value = '';

    renderCarouselAdminList();
    showToast('¡Foto cargada exitosamente al carrusel!', 'success');
  } catch(err) {
    console.error('Error al subir foto:', err);
    showToast('Error procesando la imagen', 'error');
  } finally {
    event.target.value = '';
  }
}

function addCarouselSlideFromInputs() {
  const urlInput = document.getElementById('carousel-new-url');
  const tagInput = document.getElementById('carousel-new-tag');
  const locInput = document.getElementById('carousel-new-loc');

  const url = urlInput ? urlInput.value.trim() : '';
  if (!url) {
    showToast('Ingresá una URL de imagen o subí una foto desde tu PC', 'error');
    return;
  }

  if (!siteContent) siteContent = {};
  if (!Array.isArray(siteContent.carousel)) {
    siteContent.carousel = [...DEFAULT_CAROUSEL_SLIDES];
  }

  siteContent.carousel.push({
    image: url,
    tag: (tagInput && tagInput.value.trim()) || 'Propiedad Destacada',
    location: (locInput && locInput.value.trim()) || 'Morón y Zona Oeste'
  });

  localStorage.setItem('devora_site_content', JSON.stringify(siteContent));

  if (urlInput) urlInput.value = '';
  if (tagInput) tagInput.value = '';
  if (locInput) locInput.value = '';

  renderCarouselAdminList();
  showToast('Foto agregada al carrusel', 'success');
}

function previewUrlSlide() {
  const url = document.getElementById('carousel-new-url')?.value.trim();
  if (!url) {
    showToast('Ingresá una URL primero', 'info');
    return;
  }
  const img = new Image();
  img.onload = () => showToast('¡Enlace de imagen válido!', 'success');
  img.onerror = () => showToast('No se pudo cargar la imagen desde ese enlace', 'error');
  img.src = url;
}

function moveCarouselSlide(index, direction) {
  if (!siteContent) siteContent = {};
  if (!Array.isArray(siteContent.carousel)) {
    siteContent.carousel = [...DEFAULT_CAROUSEL_SLIDES];
  }

  const slides = siteContent.carousel;
  const targetIndex = index + direction;
  if (targetIndex < 0 || targetIndex >= slides.length) return;

  const item = slides.splice(index, 1)[0];
  slides.splice(targetIndex, 0, item);

  localStorage.setItem('devora_site_content', JSON.stringify(siteContent));
  renderCarouselAdminList();
  showToast('Orden actualizado', 'info');
}

function deleteCarouselSlide(index) {
  if (!confirm('¿Deseás eliminar esta foto del carrusel?')) return;

  if (!siteContent) siteContent = {};
  if (!Array.isArray(siteContent.carousel)) {
    siteContent.carousel = [...DEFAULT_CAROUSEL_SLIDES];
  }

  siteContent.carousel.splice(index, 1);
  localStorage.setItem('devora_site_content', JSON.stringify(siteContent));
  renderCarouselAdminList();
  showToast('Foto eliminada del carrusel', 'info');
}

function resetDefaultCarousel() {
  if (!confirm('¿Restablecer el carrusel a las 6 fotos originales?')) return;
  if (!siteContent) siteContent = {};
  siteContent.carousel = [...DEFAULT_CAROUSEL_SLIDES];
  localStorage.setItem('devora_site_content', JSON.stringify(siteContent));
  renderCarouselAdminList();
  showToast('Carrusel restablecido a valores por defecto', 'info');
}

function saveCarouselChanges() {
  if (!siteContent) siteContent = {};
  if (!Array.isArray(siteContent.carousel)) {
    siteContent.carousel = [...DEFAULT_CAROUSEL_SLIDES];
  }
  localStorage.setItem('devora_site_content', JSON.stringify(siteContent));
  showToast('¡Cambios del carrusel guardados! Hacé clic en "Publicar en Web" para aplicarlos en internet.', 'success');
}


// ==========================================
// FAQ MANAGEMENT (ADMIN)
// ==========================================
const DEFAULT_FAQS = [
  {
    id: 1,
    question: "¿Qué documentación necesito para poder alquilar?",
    answer: "Hay tres opciones:\n\n– Garantía propietaria: Fotocopia de la Escritura se presenta con un servicio de la misma (gas, luz o agua). Requerimientos: NO tiene que estar como bien de familia y NO tiene que estar hipotecada.\n\n– Dos recibos de Sueldo: Recibos de sueldo con antigüedad mínima de tres años.\n\n– Garantía Finaer: Aceptamos garantía de fianza digital Finaer con gestión rápida y aprobación online."
  },
  {
    id: 2,
    question: "¿Cuál es el plazo de tiempo para alquilar?",
    answer: "El mínimo es 2 años en contratos de vivienda y 3 años en contratos comerciales. Para el contrato comercial se puede convenir el plazo de común acuerdo entre las partes."
  },
  {
    id: 3,
    question: "¿Qué gastos voy a tener para iniciar un contrato de alquiler?",
    answer: "Para ingresar se abona:\n– Dos meses adelantado de Alquiler.\n– Mes de Depósito (este dinero será devuelto cuando termina el contrato si deja la vivienda en buen estado).\n– Gastos de escribanía por certificar tu firma y la de tu garante en el contrato."
  },
  {
    id: 4,
    question: "¿Quién tiene que pagar los arreglos de la casa en alquiler?",
    answer: "– El dueño (propietario): Debe pagar los gastos de reparación que sean necesarios para que la vivienda pueda ser usada como se acordó (roturas estructurales, cañerías maestras, humedad previa, filtraciones, etc.).\n\n– El inquilino: Sólo debe pagar los arreglos de mero mantenimiento del inmueble (cueritos de canillas, luminarias, etc.) y los que surjan de su responsabilidad por uso diario."
  }
];

function getAdminFaqs() {
  if (siteContent && Array.isArray(siteContent.faqs) && siteContent.faqs.length > 0) {
    return siteContent.faqs;
  }
  return DEFAULT_FAQS;
}

function renderAdminFaqs() {
  const container = document.getElementById('admin-faq-list');
  if (!container) return;

  const faqs = getAdminFaqs();

  container.innerHTML = faqs.map((faq, index) => `
    <div class="admin-faq-card bg-slate-800/80 border border-slate-700 rounded-xl p-4 space-y-3 relative group">
      <div class="flex items-center justify-between border-b border-slate-700/60 pb-2">
        <span class="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
          <i class="fas fa-question-circle"></i> Pregunta #${index + 1}
        </span>
        <button type="button" onclick="deleteFaqAdmin(${index})" class="text-xs text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1 transition">
          <i class="fas fa-trash-alt text-[10px]"></i> Eliminar
        </button>
      </div>
      <div>
        <label class="block text-[11px] font-semibold text-slate-300 mb-1">Título de la Pregunta</label>
        <input type="text" class="faq-q-input w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-teal-500" value="${faq.question.replace(/"/g, '&quot;')}" placeholder="Ej: ¿Qué documentación necesito para poder alquilar?">
      </div>
      <div>
        <label class="block text-[11px] font-semibold text-slate-300 mb-1">Respuesta Detallada</label>
        <textarea rows="4" class="faq-a-input w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-teal-500" placeholder="Escribí la respuesta aquí...">${faq.answer || ''}</textarea>
      </div>
    </div>
  `).join('');
}

function addNewFaqAdmin() {
  if (!siteContent) siteContent = {};
  if (!Array.isArray(siteContent.faqs)) {
    siteContent.faqs = [...getAdminFaqs()];
  }

  siteContent.faqs.push({
    id: siteContent.faqs.length + 1,
    question: "Nueva Pregunta Frecuente",
    answer: "Escribí aquí la respuesta..."
  });

  renderAdminFaqs();
  showToast('Nueva pregunta agregada al formulario. Editá el texto y guardá los cambios.', 'info');
}

function deleteFaqAdmin(index) {
  if (!confirm('¿Eliminar esta pregunta frecuente?')) return;
  if (!siteContent) siteContent = {};
  if (!Array.isArray(siteContent.faqs)) {
    siteContent.faqs = [...getAdminFaqs()];
  }

  siteContent.faqs.splice(index, 1);
  renderAdminFaqs();
  showToast('Pregunta eliminada', 'info');
}

function getFaqsFromAdminForm() {
  const cards = document.querySelectorAll('.admin-faq-card');
  const faqs = [];
  cards.forEach((card, i) => {
    const q = card.querySelector('.faq-q-input')?.value.trim();
    const a = card.querySelector('.faq-a-input')?.value.trim();
    if (q) {
      faqs.push({ id: i + 1, question: q, answer: a || '' });
    }
  });
  return faqs.length > 0 ? faqs : DEFAULT_FAQS;
}


// ==========================================
// FEATURED PROPERTIES MANAGEMENT (ADMIN)
// ==========================================

// Render Featured Properties Section in Admin
function renderAdminFeaturedPanel() {
  const grid = document.getElementById('admin-featured-grid');
  if (!grid) return;

  // Get current featured properties
  const featured = properties.filter(p => p.featured);
  
  // We manage 3 slots for the home page
  const slots = [0, 1, 2];

  grid.innerHTML = slots.map(index => {
    const prop = featured[index];

    if (!prop) {
      return `
        <div class="bg-slate-950/70 border border-dashed border-slate-700/80 rounded-2xl p-5 flex flex-col items-center justify-center text-center min-h-[310px] group hover:border-amber-400/50 transition">
          <div class="w-12 h-12 rounded-full bg-slate-800 text-amber-400 flex items-center justify-center text-lg mb-3 shadow-inner">
            <i class="fas fa-star"></i>
          </div>
          <span class="text-xs font-bold text-slate-300 mb-1">Puesto #${index + 1} de Portada Libre</span>
          <p class="text-[11px] text-slate-500 mb-4 max-w-xs">Elegí una propiedad del catálogo para asignarla a este puesto destacado de la página web.</p>
          <select onchange="assignFeaturedSlot(${index}, this.value)" class="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none cursor-pointer focus:border-amber-400">
            <option value="">+ Seleccionar inmueble para destacar</option>
            ${properties.map(p => `<option value="${p.id}">#${p.id} - ${(p.title || '').slice(0, 38)}...</option>`).join('')}
          </select>
        </div>
      `;
    }

    return `
      <div class="bg-slate-950 border border-slate-800 hover:border-amber-500/40 rounded-2xl overflow-hidden shadow-lg flex flex-col justify-between transition group">
        <!-- Photo with Badge -->
        <div class="relative h-44 bg-slate-900 overflow-hidden">
          <img id="featured-img-preview-${prop.id}" src="${prop.image || 'assets/img/logo.png'}" alt="${prop.title}" class="w-full h-full object-cover">
          <span class="absolute top-2 left-2 px-2.5 py-1 bg-slate-900/90 backdrop-blur-md text-amber-400 text-[11px] font-extrabold rounded-lg border border-amber-400/40 flex items-center gap-1 shadow-md">
            <i class="fas fa-star text-amber-400"></i> Puesto #${index + 1} Destacada
          </span>
          <span class="absolute top-2 right-2 px-2 py-0.5 bg-slate-900/80 backdrop-blur-md text-slate-300 text-[10px] font-mono rounded">
            #${prop.id}
          </span>
        </div>

        <!-- Info Body -->
        <div class="p-4 flex-1 flex flex-col justify-between gap-3">
          <div>
            <h4 class="text-xs font-bold text-white line-clamp-1 group-hover:text-amber-400 transition" title="${prop.title}">${prop.title}</h4>
            <p class="text-[11px] text-slate-400 line-clamp-1 mt-0.5"><i class="fas fa-map-marker-alt text-amber-500 mr-1"></i>${prop.address || ''}, ${prop.location || ''}</p>
            <div class="flex items-center justify-between mt-2 pt-2 border-t border-slate-800/80">
              <span class="text-[11px] text-slate-300 font-semibold">${prop.operation} &bull; ${prop.propertyType}</span>
              <span class="text-xs font-extrabold text-amber-400">${prop.priceDisplay || 'Consultar'}</span>
            </div>
          </div>

          <!-- Direct Photo Change & Property Assign Controls -->
          <div class="space-y-2 border-t border-slate-800 pt-3">
            <label class="block text-[11px] font-semibold text-cyan-300 flex items-center gap-1">
              <i class="fas fa-camera"></i> Modificar foto de esta destacada:
            </label>
            
            <div class="grid grid-cols-2 gap-2">
              <!-- Upload from PC -->
              <label class="px-2.5 py-2 rounded-xl bg-teal-600/20 hover:bg-teal-600/30 border border-teal-500/40 text-teal-300 text-[11px] font-bold flex items-center justify-center gap-1.5 cursor-pointer transition text-center shadow-sm">
                <i class="fas fa-upload text-xs"></i>
                <span>Subir de PC</span>
                <input type="file" accept="image/*" onchange="handleFeaturedImageUpload(${prop.id}, event)" class="hidden">
              </label>

              <!-- Edit URL -->
              <button type="button" onclick="promptChangeFeaturedUrl(${prop.id})" class="px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition text-center">
                <i class="fas fa-link text-xs"></i>
                <span>Por URL</span>
              </button>
            </div>

            <!-- Swap which property is in this slot -->
            <div class="pt-1 flex items-center justify-between gap-2">
              <select onchange="assignFeaturedSlot(${index}, this.value)" class="flex-1 px-2.5 py-1.5 bg-slate-800/90 border border-slate-700 rounded-lg text-[11px] text-slate-200 outline-none cursor-pointer">
                <option value="${prop.id}">Cambiar inmueble asignado...</option>
                ${properties.map(p => `<option value="${p.id}" ${p.id === prop.id ? 'selected' : ''}>#${p.id} - ${(p.title || '').slice(0, 30)}...</option>`).join('')}
              </select>

              <button type="button" onclick="removeFeaturedProperty(${prop.id})" title="Quitar de destacadas" class="p-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/40 text-[11px] transition">
                <i class="fas fa-times"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Upload and compress image from PC for a featured property
async function handleFeaturedImageUpload(propId, event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  const prop = properties.find(p => p.id === propId);
  if (!prop) return;

  try {
    showToast('Procesando y optimizando foto...', 'info');
    const optimized = await compressImageFile(file, 1600, 0.85);

    prop.image = optimized;
    saveToLocal();
    renderAdminDashboard();
    showToast('¡Foto de la propiedad destacada actualizada con éxito! Hacé clic en "Publicar Web" para reflejarla.', 'success');
  } catch (err) {
    console.error('Error procesando foto destacada:', err);
    showToast('Error al procesar la foto', 'error');
  } finally {
    event.target.value = '';
  }
}

// Change featured property photo via URL
function promptChangeFeaturedUrl(propId) {
  const prop = properties.find(p => p.id === propId);
  if (!prop) return;

  const inputUrl = prompt('Ingresá el enlace directo de la nueva foto para esta propiedad destacada:', prop.image || '');
  if (inputUrl === null) return;
  const trimmed = inputUrl.trim();
  if (!trimmed) return;

  prop.image = trimmed;
  saveToLocal();
  renderAdminDashboard();
  showToast('Foto actualizada correctamente. Hacé clic en "Publicar Web" para guardarla.', 'success');
}

// Assign a property to a featured slot
function assignFeaturedSlot(slotIndex, newPropIdStr) {
  const newPropId = parseInt(newPropIdStr);
  if (isNaN(newPropId) || !newPropId) return;

  const newProp = properties.find(p => p.id === newPropId);
  if (!newProp) return;

  const currentFeatured = properties.filter(p => p.featured);
  const oldPropInSlot = currentFeatured[slotIndex];

  if (oldPropInSlot && oldPropInSlot.id !== newPropId) {
    oldPropInSlot.featured = false;
  }

  newProp.featured = true;

  saveToLocal();
  renderAdminDashboard();
  showToast(`Propiedad #${newProp.id} asignada como Destacada de portada`, 'success');
}

// Remove property from featured
function removeFeaturedProperty(propId) {
  const prop = properties.find(p => p.id === propId);
  if (!prop) return;

  prop.featured = false;
  saveToLocal();
  renderAdminDashboard();
  showToast(`Propiedad #${propId} quitada de destacadas`, 'info');
}

// Toggle featured status from properties table
function toggleFeaturedProperty(propId) {
  const prop = properties.find(p => p.id === propId);
  if (!prop) return;

  prop.featured = !prop.featured;
  saveToLocal();
  renderAdminDashboard();
  showToast(prop.featured ? `Propiedad #${propId} marcada como Destacada` : `Propiedad #${propId} quitada de destacadas`, 'success');
}


// Download latest properties from GitHub/Cloud to this computer
async function reloadFromCloud() {
  if (!confirm('¿Deseás descargar la versión más reciente del catálogo publicada en la nube? Esto actualizará esta computadora con los datos de internet.')) return;
  const btn = document.getElementById('btn-reload-cloud');
  const origHtml = btn ? btn.innerHTML : '';
  if (btn) btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>Descargando...</span>';

  try {
    const res = await fetch('./data/properties.json?v=' + Date.now(), { cache: 'no-store' });
    if (!res.ok) throw new Error('No se pudo descargar el archivo del servidor');
    properties = await res.json();
    normalizeProperties();
    saveToLocal();
    renderAdminDashboard();
    showToast('¡Catálogo descargado y sincronizado desde la nube con éxito!', 'success');
  } catch (err) {
    console.error('Error recargando desde la nube:', err);
    showToast('Error al descargar desde la nube: ' + err.message, 'error');
  } finally {
    if (btn) btn.innerHTML = origHtml;
  }
}


// ==========================================
// CAROUSEL DRAG & DROP REORDERING
// ==========================================
let draggedCarouselIndex = null;

function handleCarouselDragStart(event, index) {
  draggedCarouselIndex = index;
  event.dataTransfer.effectAllowed = 'move';
  event.dataTransfer.setData('text/plain', String(index));
  setTimeout(() => {
    if (event.target) {
      event.target.classList.add('opacity-40', 'scale-95', 'border-teal-500');
    }
  }, 0);
}

function handleCarouselDragOver(event) {
  event.preventDefault();
  event.dataTransfer.dropEffect = 'move';
}

function handleCarouselDragEnter(event, index) {
  event.preventDefault();
  const card = event.currentTarget;
  if (card && draggedCarouselIndex !== null && draggedCarouselIndex !== index) {
    card.classList.add('ring-2', 'ring-teal-400', 'border-teal-400', 'scale-[1.02]');
  }
}

function handleCarouselDragLeave(event) {
  const card = event.currentTarget;
  if (card) {
    card.classList.remove('ring-2', 'ring-teal-400', 'border-teal-400', 'scale-[1.02]');
  }
}

function handleCarouselDrop(event, targetIndex) {
  event.preventDefault();
  const card = event.currentTarget;
  if (card) {
    card.classList.remove('ring-2', 'ring-teal-400', 'border-teal-400', 'scale-[1.02]');
  }

  if (draggedCarouselIndex === null || draggedCarouselIndex === targetIndex) return;

  if (!siteContent) siteContent = {};
  if (!Array.isArray(siteContent.carousel)) {
    siteContent.carousel = [...DEFAULT_CAROUSEL_SLIDES];
  }

  const slides = siteContent.carousel;
  const item = slides.splice(draggedCarouselIndex, 1)[0];
  slides.splice(targetIndex, 0, item);

  localStorage.setItem('devora_site_content', JSON.stringify(siteContent));
  renderCarouselAdminList();
  showToast(`Foto movida a la posición #${targetIndex + 1}. Guardá o publicá para reflejarla.`, 'success');
}

function handleCarouselDragEnd(event) {
  draggedCarouselIndex = null;
  if (event.target) {
    event.target.classList.remove('opacity-40', 'scale-95', 'border-teal-500');
  }
  document.querySelectorAll('#carousel-admin-grid > div').forEach(el => {
    el.classList.remove('ring-2', 'ring-teal-400', 'border-teal-400', 'scale-[1.02]', 'opacity-40', 'scale-95');
  });
}


// ==========================================
// DRAG TO REPOSITION 2D (ENCUADRE HORIZONTAL Y VERTICAL)
// ==========================================
let repositionSlideIndex = null;
let currentRepositionX = 50;
let currentRepositionY = 50;
let isRepositionDragging = false;
let repositionStartX = 0;
let repositionStartY = 0;
let repositionStartPercentX = 50;
let repositionStartPercentY = 50;

function openCarouselRepositionModal(index) {
  repositionSlideIndex = index;
  const slides = getCarouselSlides();
  const slide = slides[index];
  if (!slide) return;

  const modal = document.getElementById('modal-reposition-carousel');
  const img = document.getElementById('reposition-img');

  let initX = 50;
  let initY = 50;

  if (slide.position) {
    const parts = slide.position.trim().split(/\s+/);
    if (parts.length === 2) {
      if (parts[0] === 'left') initX = 0;
      else if (parts[0] === 'right') initX = 100;
      else if (parts[0] === 'center') initX = 50;
      else {
        const mx = parts[0].match(/(\d+)%/);
        if (mx) initX = parseInt(mx[1]);
      }

      if (parts[1] === 'top') initY = 0;
      else if (parts[1] === 'bottom') initY = 100;
      else if (parts[1] === 'center') initY = 50;
      else {
        const my = parts[1].match(/(\d+)%/);
        if (my) initY = parseInt(my[1]);
      }
    } else {
      const matches = slide.position.match(/(\d+)%/g);
      if (matches && matches.length >= 2) {
        initX = parseInt(matches[0]);
        initY = parseInt(matches[1]);
      } else if (matches && matches.length === 1) {
        initY = parseInt(matches[0]);
      }
    }
  }

  if (typeof slide.positionX === 'number') initX = slide.positionX;
  if (typeof slide.positionY === 'number') initY = slide.positionY;

  currentRepositionX = initX;
  currentRepositionY = initY;

  if (img) {
    img.src = slide.image;
  }
  setReposition2D(currentRepositionX, currentRepositionY);

  if (modal) modal.classList.remove('hidden');

  setupRepositionDragHandlers();
}

function closeCarouselRepositionModal() {
  const modal = document.getElementById('modal-reposition-carousel');
  if (modal) modal.classList.add('hidden');
  repositionSlideIndex = null;
}

function setReposition2D(x, y) {
  currentRepositionX = Math.max(0, Math.min(100, Math.round(x)));
  currentRepositionY = Math.max(0, Math.min(100, Math.round(y)));

  const img = document.getElementById('reposition-img');
  const sliderX = document.getElementById('reposition-slider-x');
  const sliderY = document.getElementById('reposition-slider-y');
  const labelX = document.getElementById('label-slider-x');
  const labelY = document.getElementById('label-slider-y');
  const label = document.getElementById('reposition-percent-label');

  if (img) img.style.objectPosition = `${currentRepositionX}% ${currentRepositionY}%`;
  if (sliderX) sliderX.value = currentRepositionX;
  if (sliderY) sliderY.value = currentRepositionY;
  if (labelX) labelX.textContent = `${currentRepositionX}%`;
  if (labelY) labelY.textContent = `${currentRepositionY}%`;
  if (label) label.textContent = `X: ${currentRepositionX}% | Y: ${currentRepositionY}%`;
}

function onRepositionSliderX(val) {
  setReposition2D(val, currentRepositionY);
}

function onRepositionSliderY(val) {
  setReposition2D(currentRepositionX, val);
}

function setupRepositionDragHandlers() {
  const box = document.getElementById('reposition-box');
  if (!box || box.dataset.dragInitialized) return;
  box.dataset.dragInitialized = 'true';

  const onStart = (clientX, clientY) => {
    isRepositionDragging = true;
    repositionStartX = clientX;
    repositionStartY = clientY;
    repositionStartPercentX = currentRepositionX;
    repositionStartPercentY = currentRepositionY;
    box.classList.add('cursor-grabbing');
  };

  const onMove = (clientX, clientY) => {
    if (!isRepositionDragging) return;
    const deltaX = clientX - repositionStartX;
    const deltaY = clientY - repositionStartY;
    const boxWidth = box.clientWidth || 800;
    const boxHeight = box.clientHeight || 400;

    const deltaPercentX = (deltaX / boxWidth) * 100;
    const deltaPercentY = (deltaY / boxHeight) * 100;

    setReposition2D(
      repositionStartPercentX - deltaPercentX,
      repositionStartPercentY - deltaPercentY
    );
  };

  const onEnd = () => {
    isRepositionDragging = false;
    box.classList.remove('cursor-grabbing');
  };

  box.addEventListener('mousedown', (e) => {
    e.preventDefault();
    onStart(e.clientX, e.clientY);
  });
  window.addEventListener('mousemove', (e) => onMove(e.clientX, e.clientY));
  window.addEventListener('mouseup', onEnd);

  box.addEventListener('touchstart', (e) => {
    if (e.touches && e.touches[0]) onStart(e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: true });
  window.addEventListener('touchmove', (e) => {
    if (isRepositionDragging && e.touches && e.touches[0]) onMove(e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: true });
  window.addEventListener('touchend', onEnd);
}

function saveCarouselReposition() {
  if (repositionSlideIndex === null) return;
  if (!siteContent) siteContent = {};
  if (!Array.isArray(siteContent.carousel)) {
    siteContent.carousel = [...DEFAULT_CAROUSEL_SLIDES];
  }

  const slide = siteContent.carousel[repositionSlideIndex];
  if (slide) {
    slide.position = `${currentRepositionX}% ${currentRepositionY}%`;
    slide.positionX = currentRepositionX;
    slide.positionY = currentRepositionY;
    localStorage.setItem('devora_site_content', JSON.stringify(siteContent));
    renderCarouselAdminList();
    showToast(`¡Encuadre guardado (X: ${currentRepositionX}%, Y: ${currentRepositionY}%)! Hacé clic en "Publicar en Web".`, 'success');
  }
  closeCarouselRepositionModal();
}
