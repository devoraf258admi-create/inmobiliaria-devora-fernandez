// App JavaScript - Dévora Fernández Propiedades

let propertiesData = [];
let activeFilters = {
  searchQuery: '',
  location: 'todos',
  address: '',
  propertyType: 'todos',
  operation: 'todos',
  rooms: 'todos',
  bedrooms: 'todos',
  bathrooms: 'todos',
  currency: 'todos',
  maxPrice: null,
  credit: false
};

const WHATSAPP_PHONE = '5491164108048'; // Número de WhatsApp oficial

// Initialize App
document.addEventListener('DOMContentLoaded', async () => {
  await loadProperties();
  setupEventListeners();
  setupMobileMenu();
  setupScrollEffects();
});

// Fetch Properties Data
async function loadProperties() {
  try {
    const response = await fetch('./data/properties.json');
    if (!response.ok) throw new Error('No se pudo cargar el catálogo');
    propertiesData = await response.json();
    renderProperties();
    populateLocationOptions();
  } catch (error) {
    console.error('Error cargando propiedades:', error);
    // Fallback if local fetch has CORS issue on file:// protocol
    if (window.EMBEDDED_PROPERTIES) {
      propertiesData = window.EMBEDDED_PROPERTIES;
      renderProperties();
      populateLocationOptions();
    }
  }
}

// Populate location filter dropdown dynamically
function populateLocationOptions() {
  const locationSelect = document.getElementById('filter-location');
  if (!locationSelect) return;

  locationSelect.innerHTML = '<option value="todos">Provincia, Localidad</option>';

  const locations = [...new Set(propertiesData.map(p => p.location))].filter(Boolean);
  locations.sort();

  locations.forEach(loc => {
    const option = document.createElement('option');
    option.value = loc;
    const prefix = (loc === 'Miramar' || loc === 'Las Toninas') ? 'Bs.As. Costa Atlántica, ' : (loc === 'Capital Federal' ? '' : 'Bs.As. G.B.A. Oeste, ');
    option.textContent = `${prefix}${loc}`;
    locationSelect.appendChild(option);
  });
}

// Trigger Search from button
function triggerSearch() {
  renderProperties();
  const target = document.getElementById('propiedades');
  if (target) {
    target.scrollIntoView({ behavior: 'smooth' });
  }
}

// Filter and Render Properties
function renderProperties() {
  const container = document.getElementById('properties-container');
  const countBadge = document.getElementById('properties-count');
  if (!container) return;

  const filtered = propertiesData.filter(prop => {
    // 1. Search Query (keywords in title, address, description, features)
    const q = (activeFilters.searchQuery || '').toLowerCase().trim();
    const matchesQuery = !q ||
      (prop.title && prop.title.toLowerCase().includes(q)) ||
      (prop.location && prop.location.toLowerCase().includes(q)) ||
      (prop.address && prop.address.toLowerCase().includes(q)) ||
      (prop.description && prop.description.toLowerCase().includes(q)) ||
      (prop.features && prop.features.some(f => f.toLowerCase().includes(q)));

    // 2. Location
    const matchesLocation = activeFilters.location === 'todos' ||
      (prop.location && prop.location.toLowerCase() === activeFilters.location.toLowerCase());

    // 3. Address
    const addrQ = (activeFilters.address || '').toLowerCase().trim();
    const matchesAddress = !addrQ ||
      (prop.address && prop.address.toLowerCase().includes(addrQ));

    // 4. Property Type
    const matchesType = activeFilters.propertyType === 'todos' ||
      (prop.propertyType && prop.propertyType.toLowerCase() === activeFilters.propertyType.toLowerCase());

    // 5. Operation
    const matchesOperation = activeFilters.operation === 'todos' ||
      (prop.operation && prop.operation.toLowerCase() === activeFilters.operation.toLowerCase());

    // 6. Environments (Ambientes)
    let matchesRooms = true;
    if (activeFilters.rooms !== 'todos') {
      const minRooms = parseInt(activeFilters.rooms);
      matchesRooms = (prop.environments || 0) >= minRooms;
    }

    // 7. Bedrooms (Dormitorios)
    let matchesBedrooms = true;
    if (activeFilters.bedrooms !== 'todos') {
      const minBeds = parseInt(activeFilters.bedrooms);
      matchesBedrooms = (prop.bedrooms || 0) >= minBeds;
    }

    // 8. Bathrooms (Baños)
    let matchesBathrooms = true;
    if (activeFilters.bathrooms !== 'todos') {
      const minBaths = parseInt(activeFilters.bathrooms);
      matchesBathrooms = (prop.bathrooms || 0) >= minBaths;
    }

    // 9. Currency (Moneda)
    let matchesCurrency = true;
    if (activeFilters.currency !== 'todos') {
      const pDisp = (prop.priceDisplay || '').toUpperCase();
      if (activeFilters.currency === 'USD') {
        matchesCurrency = pDisp.includes('USD');
      } else if (activeFilters.currency === 'ARS') {
        matchesCurrency = pDisp.includes('ARS');
      }
    }

    // 10. Max Price
    let matchesPrice = true;
    if (activeFilters.maxPrice !== null && !isNaN(activeFilters.maxPrice) && activeFilters.maxPrice > 0) {
      const pDisp = (prop.priceDisplay || '').toUpperCase();
      if (pDisp.includes('USD')) {
        matchesPrice = (prop.priceUsd || 0) <= activeFilters.maxPrice;
      } else if (pDisp.includes('ARS')) {
        const arsNum = parseInt(pDisp.replace(/[^\d]/g, '')) || 0;
        matchesPrice = arsNum <= activeFilters.maxPrice;
      }
    }

    // 11. Apto Crédito
    let matchesCredit = true;
    if (activeFilters.credit) {
      const combined = ((prop.title || '') + ' ' + (prop.description || '') + ' ' + (prop.features || []).join(' ')).toLowerCase();
      matchesCredit = combined.includes('crédito') || combined.includes('credito') || combined.includes('apto');
    }

    return matchesQuery && matchesLocation && matchesAddress && matchesType &&
           matchesOperation && matchesRooms && matchesBedrooms && matchesBathrooms &&
           matchesCurrency && matchesPrice && matchesCredit;
  });

  if (countBadge) {
    countBadge.textContent = `${filtered.length} Inmuebles Encontrados`;
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="col-span-full text-center py-16 bg-white rounded-3xl border border-slate-100 shadow-sm">
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 text-slate-400 mb-4">
          <i class="fas fa-search-minus text-2xl"></i>
        </div>
        <h3 class="text-xl font-bold text-slate-800 mb-2">No se encontraron propiedades</h3>
        <p class="text-slate-500 max-w-md mx-auto mb-6">Prueba ajustando los filtros de búsqueda o buscando en otra localidad.</p>
        <button onclick="resetFilters()" class="px-6 py-2.5 bg-slate-900 text-white font-medium rounded-xl hover:bg-slate-800 transition">
          Restablecer Filtros
        </button>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(prop => `
    <div class="property-card bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-md flex flex-col group">
      <!-- Image & Badges -->
      <div class="relative h-64 overflow-hidden bg-slate-100">
        <img src="${prop.image}" alt="${prop.title}" class="img-zoom w-full h-full object-cover">
        
        <div class="absolute top-4 left-4 flex flex-wrap gap-2">
          <span class="badge-operation px-3 py-1.5 rounded-lg text-white shadow-md ${prop.operation === 'Venta' ? 'bg-amber-600' : 'bg-emerald-600'}">
            ${prop.operation}
          </span>
          ${prop.featured ? `
            <span class="px-3 py-1.5 bg-slate-900/80 backdrop-blur-md text-amber-400 text-xs font-semibold rounded-lg shadow-md flex items-center gap-1">
              <i class="fas fa-star text-amber-400"></i> Destacado
            </span>
          ` : ''}
        </div>

        <div class="absolute bottom-4 right-4 bg-slate-900/90 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-lg border border-white/20">
          ${prop.propertyType}
        </div>
      </div>

      <!-- Card Body -->
      <div class="p-6 flex-1 flex flex-col justify-between">
        <div>
          <div class="flex items-center gap-1.5 text-slate-400 text-xs font-medium mb-2">
            <i class="fas fa-map-marker-alt text-amber-500"></i>
            <span>${prop.address}</span>
          </div>

          <h3 class="text-lg font-bold text-slate-900 group-hover:text-amber-600 transition mb-3 line-clamp-1" title="${prop.title}">
            ${prop.title}
          </h3>

          <p class="text-slate-500 text-xs line-clamp-2 mb-4 leading-relaxed">
            ${prop.description}
          </p>

          <!-- Key Amenities -->
          <div class="grid grid-cols-3 gap-2 py-3 border-y border-slate-100 text-slate-600 text-xs font-medium mb-4">
            <div class="flex items-center gap-1.5">
              <i class="fas fa-bed text-slate-400"></i>
              <span>${prop.bedrooms > 0 ? prop.bedrooms + ' Dorm.' : (prop.environments > 0 ? prop.environments + ' Amb.' : (prop.propertyType === 'Local Comercial' ? 'Comercial' : 'Inmueble'))}</span>
            </div>
            <div class="flex items-center gap-1.5">
              <i class="fas fa-bath text-slate-400"></i>
              <span>${prop.bathrooms > 0 ? prop.bathrooms + (prop.bathrooms > 1 ? ' Baños' : ' Baño') : '1 Baño'}</span>
            </div>
            <div class="flex items-center gap-1.5">
              <i class="fas fa-ruler-combined text-slate-400"></i>
              <span>${prop.surfaceTotal > 1 ? prop.surfaceTotal + ' m²' : (prop.surfaceCovered > 1 ? prop.surfaceCovered + ' m²' : 'Consultar')}</span>
            </div>
          </div>
        </div>

        <!-- Price & Action -->
        <div class="flex items-center justify-between pt-2">
          <div>
            <span class="text-xs text-slate-400 block font-medium">Valor de publicación</span>
            <span class="text-xl font-extrabold text-slate-900">${prop.priceDisplay}</span>
          </div>

          <button onclick="openPropertyModal(${prop.id})" class="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-amber-600 text-white text-xs font-semibold rounded-xl transition-colors shadow-sm">
            <span>Ver Detalle</span>
            <i class="fas fa-arrow-right text-xs"></i>
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

// Event Listeners setup
function setupEventListeners() {
  // 1. Palabras clave
  const filterQ = document.getElementById('filter-q');
  if (filterQ) {
    filterQ.addEventListener('input', (e) => {
      activeFilters.searchQuery = e.target.value;
      renderProperties();
    });
  }

  // 2. Localidad
  const filterLoc = document.getElementById('filter-location');
  if (filterLoc) {
    filterLoc.addEventListener('change', (e) => {
      activeFilters.location = e.target.value;
      renderProperties();
    });
  }

  // 3. Dirección
  const filterAddr = document.getElementById('filter-address');
  if (filterAddr) {
    filterAddr.addEventListener('input', (e) => {
      activeFilters.address = e.target.value;
      renderProperties();
    });
  }

  // 4. Tipo de Inmueble
  const filterType = document.getElementById('filter-type');
  if (filterType) {
    filterType.addEventListener('change', (e) => {
      activeFilters.propertyType = e.target.value;
      renderProperties();
    });
  }

  // 5. Operación
  const filterOp = document.getElementById('filter-operation');
  if (filterOp) {
    filterOp.addEventListener('change', (e) => {
      activeFilters.operation = e.target.value;
      renderProperties();
    });
  }

  // 6. Ambientes
  const filterRooms = document.getElementById('filter-rooms');
  if (filterRooms) {
    filterRooms.addEventListener('change', (e) => {
      activeFilters.rooms = e.target.value;
      renderProperties();
    });
  }

  // 7. Dormitorios
  const filterBeds = document.getElementById('filter-bedrooms');
  if (filterBeds) {
    filterBeds.addEventListener('change', (e) => {
      activeFilters.bedrooms = e.target.value;
      renderProperties();
    });
  }

  // 8. Baños
  const filterBaths = document.getElementById('filter-bathrooms');
  if (filterBaths) {
    filterBaths.addEventListener('change', (e) => {
      activeFilters.bathrooms = e.target.value;
      renderProperties();
    });
  }

  // 9. Moneda
  const filterCurr = document.getElementById('filter-currency');
  if (filterCurr) {
    filterCurr.addEventListener('change', (e) => {
      activeFilters.currency = e.target.value;
      renderProperties();
    });
  }

  // 10. Precio máximo
  const filterPrice = document.getElementById('filter-price-input');
  if (filterPrice) {
    filterPrice.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      activeFilters.maxPrice = isNaN(val) ? null : val;
      renderProperties();
    });
  }

  // 11. Apto Crédito
  const filterCredit = document.getElementById('filter-credit');
  if (filterCredit) {
    filterCredit.addEventListener('change', (e) => {
      activeFilters.credit = e.target.checked;
      renderProperties();
    });
  }

  // Tasación Form
  const tasacionForm = document.getElementById('tasacion-form');
  if (tasacionForm) {
    tasacionForm.addEventListener('submit', handleTasacionSubmit);
  }

  // Contact Form
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', handleContactSubmit);
  }
}

// Reset Filters
function resetFilters() {
  activeFilters = {
    searchQuery: '',
    location: 'todos',
    address: '',
    propertyType: 'todos',
    operation: 'todos',
    rooms: 'todos',
    bedrooms: 'todos',
    bathrooms: 'todos',
    currency: 'todos',
    maxPrice: null,
    credit: false
  };

  const q = document.getElementById('filter-q');
  if (q) q.value = '';
  const loc = document.getElementById('filter-location');
  if (loc) loc.value = 'todos';
  const addr = document.getElementById('filter-address');
  if (addr) addr.value = '';
  const type = document.getElementById('filter-type');
  if (type) type.value = 'todos';
  const op = document.getElementById('filter-operation');
  if (op) op.value = 'todos';
  const rooms = document.getElementById('filter-rooms');
  if (rooms) rooms.value = 'todos';
  const beds = document.getElementById('filter-bedrooms');
  if (beds) beds.value = 'todos';
  const baths = document.getElementById('filter-bathrooms');
  if (baths) baths.value = 'todos';
  const curr = document.getElementById('filter-currency');
  if (curr) curr.value = 'todos';
  const price = document.getElementById('filter-price-input');
  if (price) price.value = '';
  const credit = document.getElementById('filter-credit');
  if (credit) credit.checked = false;

  renderProperties();
}

// Open Property Details Modal
function openPropertyModal(id) {
  const prop = propertiesData.find(p => p.id === id);
  if (!prop) return;

  const modal = document.getElementById('property-modal');
  const modalBody = document.getElementById('modal-body');
  if (!modal || !modalBody) return;

  const encodedMsg = encodeURIComponent(
    `Hola Dévora Fernández Propiedades, me interesa la propiedad "${prop.title}" (${prop.operation} - ${prop.priceDisplay}). Quisiera recibir más detalles.`
  );
  const waUrl = `https://api.whatsapp.com/send?phone=${WHATSAPP_PHONE}&text=${encodedMsg}`;

  modalBody.innerHTML = `
    <!-- Modal Header Gallery -->
    <div class="relative bg-slate-900 h-80 rounded-t-3xl overflow-hidden group">
      <img id="modal-main-img" src="${prop.image}" alt="${prop.title}" class="w-full h-full object-cover">
      
      <button onclick="closeModal()" class="absolute top-4 right-4 bg-slate-900/80 hover:bg-slate-900 text-white w-10 h-10 rounded-full flex items-center justify-center transition backdrop-blur-md border border-white/20">
        <i class="fas fa-times text-lg"></i>
      </button>

      <div class="absolute bottom-4 left-4 flex gap-2 overflow-x-auto p-1 max-w-[80%] backdrop-blur-md bg-slate-900/60 rounded-xl border border-white/10">
        ${prop.gallery.map((img, idx) => `
          <img src="${img}" onclick="document.getElementById('modal-main-img').src='${img}'" class="w-14 h-14 object-cover rounded-lg cursor-pointer hover:opacity-100 opacity-70 transition border border-white/30">
        `).join('')}
      </div>
    </div>

    <!-- Modal Content -->
    <div class="p-8">
      <div class="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div>
          <span class="inline-block px-3 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-full mb-2">
            ${prop.operation} • ${prop.propertyType}
          </span>
          <h2 class="text-2xl font-extrabold text-slate-900">${prop.title}</h2>
          <p class="text-slate-500 text-sm flex items-center gap-1 mt-1">
            <i class="fas fa-map-marker-alt text-amber-500"></i> ${prop.address}
          </p>
        </div>

        <div class="text-right">
          <span class="text-xs text-slate-400 block font-medium">Precio de Publicación</span>
          <span class="text-3xl font-extrabold text-slate-900">${prop.priceDisplay}</span>
        </div>
      </div>

      <!-- Main Attributes -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 my-6">
        <div class="text-center">
          <span class="text-xs text-slate-400 block">Ambientes</span>
          <span class="text-lg font-bold text-slate-800">${prop.environments > 0 ? prop.environments + ' Amb.' : 'Consultar'}</span>
        </div>
        <div class="text-center">
          <span class="text-xs text-slate-400 block">Dormitorios</span>
          <span class="text-lg font-bold text-slate-800">${prop.bedrooms > 0 ? prop.bedrooms + ' Dorm.' : 'Consultar'}</span>
        </div>
        <div class="text-center">
          <span class="text-xs text-slate-400 block">Baños</span>
          <span class="text-lg font-bold text-slate-800">${prop.bathrooms > 0 ? prop.bathrooms + (prop.bathrooms > 1 ? ' Baños' : ' Baño') : 'Consultar'}</span>
        </div>
        <div class="text-center">
          <span class="text-xs text-slate-400 block">Superficie</span>
          <span class="text-lg font-bold text-slate-800">${prop.surfaceTotal > 1 ? prop.surfaceTotal + ' m²' : (prop.surfaceCovered > 1 ? prop.surfaceCovered + ' m²' : 'Consultar')}</span>
        </div>
      </div>

      <!-- Description -->
      <div class="mb-6">
        <h4 class="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2">Descripción</h4>
        <div class="text-slate-600 text-sm leading-relaxed whitespace-pre-line">${prop.description}</div>
      </div>

      <!-- Characteristics List -->
      <div class="mb-8">
        <h4 class="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Características Principales</h4>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
          ${prop.features.map(feat => `
            <div class="flex items-center gap-2 text-xs font-medium text-slate-700">
              <i class="fas fa-check-circle text-amber-500 text-sm"></i>
              <span>${feat}</span>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Modal Footer CTAs -->
      <div class="flex flex-col sm:flex-row items-center gap-3 pt-6 border-t border-slate-100">
        <a href="${waUrl}" target="_blank" class="w-full sm:flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition shadow-md">
          <i class="fab fa-whatsapp text-xl"></i>
          <span>Consultar por WhatsApp</span>
        </a>
        <a href="tel:1177080280" class="w-full sm:w-auto px-6 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition">
          <i class="fas fa-phone-alt"></i>
          <span>Llamar a la Inmobiliaria</span>
        </a>
      </div>
    </div>
  `;

  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  const modal = document.getElementById('property-modal');
  if (modal) modal.classList.add('hidden');
  document.body.style.overflow = 'auto';
}

// Handle Tasacion Request Form (All fields from old CRM site)
function handleTasacionSubmit(e) {
  e.preventDefault();
  const firstName = (document.getElementById('tasacion-firstname')?.value || '').trim();
  const lastName = (document.getElementById('tasacion-lastname')?.value || '').trim();
  const propType = document.getElementById('tasacion-type')?.value || '';
  const opType = document.getElementById('tasacion-optype')?.value || '';
  const phone = (document.getElementById('tasacion-phone')?.value || '').trim();
  const email = (document.getElementById('tasacion-email')?.value || '').trim();
  const location = (document.getElementById('tasacion-location')?.value || '').trim();
  const message = (document.getElementById('tasacion-message')?.value || '').trim();

  const text = encodeURIComponent(
    `*SOLICITUD DE TASACIÓN - DÉVORA FERNÁNDEZ PROPIEDADES*\n\n` +
    `• *Nombre y Apellido:* ${firstName} ${lastName}\n` +
    `• *Teléfono:* ${phone}\n` +
    `• *Email:* ${email}\n` +
    `• *Tipo de Propiedad:* ${propType}\n` +
    `• *Tipo de Operación:* ${opType}\n` +
    `• *Ubicación / Dirección:* ${location}\n` +
    `• *Mensaje / Detalles:* ${message}\n\n` +
    `_Enviado desde el formulario web de tasación oficial_`
  );

  window.open(`https://api.whatsapp.com/send?phone=${WHATSAPP_PHONE}&text=${text}`, '_blank');
  
  alert(`¡Muchas gracias ${firstName}! Tu solicitud de tasación fue preparada con éxito y se abrirá WhatsApp para enviarla a nuestro equipo martillero.`);
  e.target.reset();
}

// Handle General Contact Form
function handleContactSubmit(e) {
  e.preventDefault();
  alert('¡Gracias por tu mensaje! Nos pondremos en contacto a la brevedad.');
  e.target.reset();
}

// Mobile Menu Setup
function setupMobileMenu() {
  const btn = document.getElementById('mobile-menu-btn');
  const menu = document.getElementById('mobile-menu');
  if (!btn || !menu) return;

  btn.addEventListener('click', () => {
    menu.classList.toggle('hidden');
  });

  document.querySelectorAll('#mobile-menu a').forEach(link => {
    link.addEventListener('click', () => {
      menu.classList.add('hidden');
    });
  });
}

// Scroll Effects (Sticky Header backdrop)
function setupScrollEffects() {
  const navbar = document.getElementById('main-navbar');
  if (!navbar) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      navbar.classList.add('shadow-xl', 'bg-slate-900/95');
    } else {
      navbar.classList.remove('shadow-xl', 'bg-slate-900/95');
    }
  });
}

// Global fallback dataset for direct local file viewing
window.EMBEDDED_PROPERTIES = [
  {
    "id": 1,
    "code": "KP588719",
    "title": "Chalet en Venta | 5 amb. | Castelar Norte.",
    "location": "Castelar",
    "address": "Cardozo y Arrecife, Castelar",
    "operation": "Venta",
    "propertyType": "Casa",
    "priceUsd": 390000,
    "priceDisplay": "USD 390.000",
    "featured": true,
    "bedrooms": 3,
    "bathrooms": 4,
    "environments": 5,
    "surfaceTotal": 0,
    "surfaceCovered": 0,
    "description": "📍 Excelente ubicación, a pocos metros de Plaza de los Españoles, Av. Santa Rosa y Av. Arias.\r\n\r\nPropiedad de categoría, amplia y con excelentes espacios interiores y exteriores.\r\n\r\nPLANTA BAJA\r\n• Living.\r\n• Comedor.\r\n• Cocina totalmente amueblada, con bajo mesada y alacena.\r\n• Dormitorio.\r\n• Baño.\r\n• Amplio sótano con 3 habitaciones o espacios de usos múltiples.\r\n\r\nPLANTA ALTA\r\n• 3 dormitorios con placard.\r\n• Dormitorio principal en suite con vestidor.\r\n• Baño completo con bañera.\r\n• Hall distribuidor.\r\n• Amplio altillo.\r\n\r\nEXTERIOR Y ESPACIOS COMPLEMENTARIOS\r\n• Garage cubierto para 2 vehículos.\r\n• Entrada para un tercer auto.\r\n• Gran quincho con baño, sector de parrilla y horno.\r\n• Jardín y patio.\r\n• Piscina climatizada con caldera.\r\n• Sótano exterior o cuarto de depósito.\r\n\r\nUna propiedad que se destaca por sus dimensiones, comodidad y espacios ideales para disfrutar en familia y recibir invitados.\r\n\r\nConsultanos para más información y coordinar una visita.\r\n\r\nIMPORTANTE: La información y descripciones contenidas en la presente publicación tienen carácter meramente informativo y orientativo, no revisten naturaleza contractual.\r\n\r\nLas superficies y medidas indicadas son aproximadas. Las dimensiones definitivas surgirán del título de propiedad y de los planos correspondientes.\r\n\r\nLa inmobiliaria se reserva el derecho de modificar, actualizar o corregir en cualquier momento, y sin previo aviso, precios, medidas, características, especificaciones y/o disponibilidad de los inmuebles publicados.",
    "features": [
      "3 Dormitorios",
      "4 Baños",
      "5 Ambientes",
      "Cochera para 4 autos",
      "Living",
      "Comedor",
      "Dormitorio",
      "Baño"
    ],
    "image": "https://static.kiteprop.com/kp/properties/588719/96371f/lg/96371f46e01b1eb449bd53842cca9df1.jpg",
    "gallery": [
      "https://static.kiteprop.com/kp/properties/588719/96371f/lg/96371f46e01b1eb449bd53842cca9df1.jpg",
      "https://static.kiteprop.com/kp/properties/588719/e0b535/lg/e0b535bc20481eff92c8ad8abd5323fb.jpg",
      "https://static.kiteprop.com/kp/properties/588719/4c69c4/lg/4c69c4182fcf8e11938dee8d7b536989.jpg",
      "https://static.kiteprop.com/kp/properties/588719/05479b/lg/05479b7ee3356696dc568d97dad0e8dc.jpg",
      "https://static.kiteprop.com/kp/properties/588719/62600c/lg/62600c3d219dee97e410e575fde32f05.jpg",
      "https://static.kiteprop.com/kp/properties/588719/26554d/lg/26554d865e8dc1eef3984624957e9d3b.jpg",
      "https://static.kiteprop.com/kp/properties/588719/83fb8d/lg/83fb8d04ced33bf625f5570d59bf9da7.jpg",
      "https://static.kiteprop.com/kp/properties/588719/879c08/lg/879c0819f21bc060c52566b812ba369d.jpg",
      "https://static.kiteprop.com/kp/properties/588719/67a2d1/lg/67a2d19dbd543f0c2870f9df6e69b13c.jpg",
      "https://static.kiteprop.com/kp/properties/588719/490585/lg/4905859295c293a482cf02415a45dc58.jpg",
      "https://static.kiteprop.com/kp/properties/588719/890746/lg/890746061f82333f5ae5b2317aa92214.jpg",
      "https://static.kiteprop.com/kp/properties/588719/820246/lg/8202468505dd513c9fb1d8a2d79a5dc9.jpg",
      "https://static.kiteprop.com/kp/properties/588719/7998a6/lg/7998a67218eea2a02218c4bca9df1c06.jpg",
      "https://static.kiteprop.com/kp/properties/588719/9a57ce/lg/9a57ced297ba2edd9b1b72bf547c3879.jpg",
      "https://static.kiteprop.com/kp/properties/588719/f8a9d0/lg/f8a9d0af10dec2e5809b14fbe1b69311.jpg",
      "https://static.kiteprop.com/kp/properties/588719/f0746d/lg/f0746d99aee2ed49a42204b430da67a1.jpg",
      "https://static.kiteprop.com/kp/properties/588719/fa2eba/lg/fa2ebae5f52eb06b395e8e4cdbaff320.jpg",
      "https://static.kiteprop.com/kp/properties/588719/af1bfb/lg/af1bfb46266b28df37db4539188db31d.jpg",
      "https://static.kiteprop.com/kp/properties/588719/73d06a/lg/73d06aadf68be1eba527bf76862fdf4c.jpg",
      "https://static.kiteprop.com/kp/properties/588719/31dc37/lg/31dc377cab9e740855f693e2706bf760.jpg",
      "https://static.kiteprop.com/kp/properties/588719/581867/lg/581867a686da34febcc2891dbf4eb6fd.jpg",
      "https://static.kiteprop.com/kp/properties/588719/50be5e/lg/50be5e4737aef9abe6fead37728b8c13.jpg",
      "https://static.kiteprop.com/kp/properties/588719/4c9dfc/lg/4c9dfc90b3e8aff049a3e32814875064.jpg",
      "https://static.kiteprop.com/kp/properties/588719/f0427a/lg/f0427a10d0e5525ca627a85764bf37f2.jpg",
      "https://static.kiteprop.com/kp/properties/588719/583505/lg/583505341ee4c262546b2a2827245b81.jpg",
      "https://static.kiteprop.com/kp/properties/588719/293b4b/lg/293b4b82548419455b29c632a4fd6feb.jpg"
    ],
    "originalUrl": "https://devorafernandezpropiedades.kitepropcrm.com/site/properties/588719/chalet-en-venta-5-amb-castelar-norte"
  },
  {
    "id": 2,
    "code": "KP582316",
    "title": "OPORTUNIDAD ALQUILER Local Comercial | Castelar Morón| a Metros del Plaza Oeste Shopping",
    "location": "Castelar",
    "address": "Lobos 2490, Castelar",
    "operation": "Alquiler",
    "propertyType": "Local Comercial",
    "priceUsd": 423,
    "priceDisplay": "ARS 550.000",
    "featured": true,
    "bedrooms": 0,
    "bathrooms": 1,
    "environments": 0,
    "surfaceTotal": 50,
    "surfaceCovered": 50,
    "description": "📍 LOCAL COMERCIAL EN CASTELAR – A 1 CUADRA DEL PLAZA OESTE --VENTA--\r\n• Ubicación estratégica y comercial, a 1 cuadra del Shopping Plaza Oeste y de la autopista.\r\n• Unidad Funcional, Superficie de 50 m².\r\n• Cuenta con un salón amplio y baño.\r\n• Apto para oficina, parrilla, fábrica de muebles de oficina, entre otros usos.\r\n\r\nIdeal para múltiples rubros. Su consulta no molesta.\r\n\r\nIMPORTANTE: La información y descripciones contenidas en la presente publicación tienen carácter meramente informativo y orientativo, no revisten naturaleza contractual.\r\n\r\nLas superficies y medidas indicadas son aproximadas. Las dimensiones definitivas surgirán del título de propiedad y de los planos correspondientes.\r\n\r\nLa inmobiliaria se reserva el derecho de modificar, actualizar o corregir en cualquier momento, y sin previo aviso, precios, medidas, características, especificaciones y/o disponibilidad de los inmuebles publicados.",
    "features": [
      "1 Baño",
      "50 m² Superficie",
      "Cuenta con un salón amplio y baño"
    ],
    "image": "https://static.kiteprop.com/kp/properties/582316/2d2827/lg/2d2827af9497dead44ed92da049e2bad.jpg",
    "gallery": [
      "https://static.kiteprop.com/kp/properties/582316/2d2827/lg/2d2827af9497dead44ed92da049e2bad.jpg",
      "https://static.kiteprop.com/kp/properties/582316/2c406b/lg/2c406bdf7d180e03221de1241f0c2857.jpg",
      "https://static.kiteprop.com/kp/properties/582316/2d071a/lg/2d071ac683f1fb28c6c7a05acc8b08ea.jpg",
      "https://static.kiteprop.com/kp/properties/582316/4edcaf/lg/4edcaf39711053f52b71bea45c4251d6.jpg",
      "https://static.kiteprop.com/kp/properties/582316/2fe889/lg/2fe889a164e18b6900c04f3390ffa64a.jpg",
      "https://static.kiteprop.com/kp/properties/582316/256734/lg/2567341d0d5cecd744061077a4910759.jpg",
      "https://static.kiteprop.com/kp/properties/582316/676a11/lg/676a113460290eac8a80facabfef94f8.jpg",
      "https://static.kiteprop.com/kp/properties/582316/a3cc4b/lg/a3cc4bf38286084031c60c764610688b.jpg"
    ],
    "originalUrl": "https://devorafernandezpropiedades.kitepropcrm.com/site/properties/582316/oportunidad-alquiler-local-comercial-castelar-moron-a-metros-del-plaza-oeste-shopping"
  },
  {
    "id": 3,
    "code": "KP577961",
    "title": "Departamento 2 ambientes | Morón Centro |  Aceptan Mascota",
    "location": "Morón",
    "address": "ENTRE RIOS 1035, Morón",
    "operation": "Alquiler",
    "propertyType": "Departamento",
    "priceUsd": 384,
    "priceDisplay": "ARS 500.000",
    "featured": true,
    "bedrooms": 1,
    "bathrooms": 1,
    "environments": 2,
    "surfaceTotal": 40,
    "surfaceCovered": 40,
    "description": "📍 MORÓN – DEPARTAMENTO 2 AMBIENTES LUMINOSO\r\n📍 ALQUILER EN MORÓN – DEPARTAMENTO EN TERCER PISO  CONTRAFRENTE POR ESCALERA \r\n\r\n• Departamento cómodo en tercer piso por escalera\r\n• Dormitorio amplio, baño completo, y cocina-comedor integrada.\r\n• Balcón cerrado que ofrece un espacio extra para disfrutar.\r\n• Bajas expensas.\r\n• Se aceptan mascotas, brindando mayor comodidad para quienes las tienen.\r\n- Depto electrico con posibilidad de Gas natural, solo con previo aviso\r\n\r\n📞 ¡Consultanos para más información o para coordinar una visita!",
    "features": [
      "1 Dormitorio",
      "1 Baño",
      "2 Ambientes",
      "40 m² Superficie",
      "Bajas expensas"
    ],
    "image": "https://static.kiteprop.com/kp/properties/577961/d99c5b/lg/d99c5b595017ff4cbb489064e50e4316.jpg",
    "gallery": [
      "https://static.kiteprop.com/kp/properties/577961/d99c5b/lg/d99c5b595017ff4cbb489064e50e4316.jpg",
      "https://static.kiteprop.com/kp/properties/577961/84f4a4/lg/84f4a4847bf46e147566de78f999f8dc.jpg",
      "https://static.kiteprop.com/kp/properties/577961/64b529/lg/64b5294707f873374794d05106c203c1.jpg",
      "https://static.kiteprop.com/kp/properties/577961/df8de4/lg/df8de40bf91a1b86a918f4837dbae21b.jpg",
      "https://static.kiteprop.com/kp/properties/577961/ea9e14/lg/ea9e14070689480e54d345d0e85a46ef.jpg",
      "https://static.kiteprop.com/kp/properties/577961/da28d4/lg/da28d4bc32f374eef7b1fc2eeb984a0b.jpg",
      "https://static.kiteprop.com/kp/properties/577961/4dbf00/lg/4dbf0058c73a4d3add5527736d8b3790.jpg",
      "https://static.kiteprop.com/kp/properties/577961/444c9b/lg/444c9bc08b86a24d9d18320cda22cd37.jpg",
      "https://static.kiteprop.com/kp/properties/577961/de2ea8/lg/de2ea8b1508ea13f81ce4f680ddd35ad.jpg",
      "https://static.kiteprop.com/kp/properties/577961/6a675c/lg/6a675c3ff7c5a39c5d096a680d2daa81.jpg",
      "https://static.kiteprop.com/kp/properties/577961/e27c76/lg/e27c76324793e8db5fb10015c20ed23c.jpg",
      "https://static.kiteprop.com/kp/properties/577961/1f7c76/lg/1f7c76e6614223cdd3b5f2aeca8319b7.jpg"
    ],
    "originalUrl": "https://devorafernandezpropiedades.kitepropcrm.com/site/properties/577961/departamento-2-ambientes-moron-centro-aceptan-mascota"
  },
  {
    "id": 4,
    "code": "KP577928",
    "title": "Gran Local/Galpon ITUZAINGO",
    "location": "Ituzaingó",
    "address": "Peron 7130, Ituzaingó",
    "operation": "Alquiler",
    "propertyType": "Local Comercial",
    "priceUsd": 1015,
    "priceDisplay": "ARS 1.320.000",
    "featured": true,
    "bedrooms": 0,
    "bathrooms": 1,
    "environments": 0,
    "surfaceTotal": 86,
    "surfaceCovered": 86,
    "description": "GALPÓN / LOCAL EN ALQUILER\r\n\r\n• Superficie total: 86 m² cubiertos.\r\n• Acceso por pasillo lateral sobre Av. Perón 7130 o mediante persiana frontal automatizada.\r\n• Altura uniforme de aproximadamente 5,50 metros, con posibilidad de realizar entrepiso, según necesidad y proyecto.\r\n• Baño ubicado bajo la escalera.\r\n• Alquiler mensual: $1.320.000.\r\n• Con expensas.\r\n• Se requiere garantía propietaria y acreditar ingresos justificables.\r\n\r\nConsultanos para más información y coordinar una visita.\r\n\r\nIMPORTANTE: La información y descripciones contenidas en la presente publicación tienen carácter meramente informativo y orientativo, no revisten naturaleza contractual.\r\n\r\nLas superficies y medidas indicadas son aproximadas. Las dimensiones definitivas surgirán del título de propiedad y de los planos correspondientes.\r\n\r\nLa inmobiliaria se reserva el derecho de modificar, actualizar o corregir en cualquier momento, y sin previo aviso, precios, medidas, características, especificaciones y/o disponibilidad de los inmuebles publicados.",
    "features": [
      "1 Baño",
      "86 m² Superficie",
      "Baño ubicado bajo la escalera",
      "Alquiler mensual: $1.320.000",
      "Con expensas"
    ],
    "image": "https://static.kiteprop.com/kp/properties/577928/bc5b2a/lg/bc5b2ad89c0966addf1341ddc3b1a653.jpg",
    "gallery": [
      "https://static.kiteprop.com/kp/properties/577928/bc5b2a/lg/bc5b2ad89c0966addf1341ddc3b1a653.jpg",
      "https://static.kiteprop.com/kp/properties/577928/a3143d/lg/a3143d8869744b50548b95f9674826fb.jpg",
      "https://static.kiteprop.com/kp/properties/577928/c689e2/lg/c689e27b34dd67188ba576c5ebcc3612.jpg",
      "https://static.kiteprop.com/kp/properties/577928/b34850/lg/b3485084570286dfdae51a76626422b3.jpg"
    ],
    "originalUrl": "https://devorafernandezpropiedades.kitepropcrm.com/site/properties/577928/gran-localgalpon-ituzaingo"
  },
  {
    "id": 5,
    "code": "KP577716",
    "title": "CASA 4 AMB. prop. horiz. al frente/ Cochera/ Moron Sur  | Zona residencial a pocas cuadras del centro",
    "location": "Morón",
    "address": "Julian Perez 613, Morón",
    "operation": "Venta",
    "propertyType": "PH",
    "priceUsd": 140000,
    "priceDisplay": "USD 140.000",
    "featured": true,
    "bedrooms": 3,
    "bathrooms": 2,
    "environments": 4,
    "surfaceTotal": 0,
    "surfaceCovered": 0,
    "description": "🏡 **CASA EN VENTA – MORÓN**\r\n\r\n📍 JULIAN PEREZ 613 MORÓN.\r\nExcelente ubicación, a aproximadamente **10 cuadras del Municipio**.\r\n\r\n• 3 dormitorios en Planta alta\r\n• Cochera\r\n• Cocina Comedor Living y Lavadero\r\n• Todos los servicios\r\n• Agua mediante motobombeador\r\n• Propiedad cómoda y funcional\r\n\r\n\r\n📞 **Consultanos para más información o coordinar una visita.**\r\n\r\n**IMPORTANTE:** La información y descripciones contenidas en la presente publicación tienen carácter meramente informativo y orientativo, no revisten naturaleza contractual.\r\n\r\nLas superficies y medidas indicadas son aproximadas. Las dimensiones definitivas surgirán del título de propiedad y de los planos correspondientes.\r\n\r\nLa inmobiliaria se reserva el derecho de modificar, actualizar o corregir en cualquier momento, y sin previo aviso, precios, medidas, características, especificaciones y/o disponibilidad de los inmuebles publicados.",
    "features": [
      "3 Dormitorios",
      "2 Baños",
      "4 Ambientes",
      "Cochera para 1 auto",
      "Cochera",
      "Cocina Comedor Living y Lavadero",
      "Todos los servicios",
      "Agua mediante motobombeador"
    ],
    "image": "https://static.kiteprop.com/kp/properties/577716/cd89f6/lg/cd89f6283a078fb5cf36d4fdd94eb7cc.jpg",
    "gallery": [
      "https://static.kiteprop.com/kp/properties/577716/cd89f6/lg/cd89f6283a078fb5cf36d4fdd94eb7cc.jpg",
      "https://static.kiteprop.com/kp/properties/577716/a8bc96/lg/a8bc96eead476ea70d8347299dd7180b.jpg",
      "https://static.kiteprop.com/kp/properties/577716/0ecb5b/lg/0ecb5bf8e50ebf270e69bc72790f8443.jpg",
      "https://static.kiteprop.com/kp/properties/577716/0344ac/lg/0344ac3b6c37e5bf8621eceacfdb78fd.jpg",
      "https://static.kiteprop.com/kp/properties/577716/1d74d0/lg/1d74d046e9fa5f563246297230209bf5.jpg",
      "https://static.kiteprop.com/kp/properties/577716/511323/lg/511323bc9398219cbbb810db69750b65.jpg",
      "https://static.kiteprop.com/kp/properties/577716/e10228/lg/e1022888088f9ee501b01f140a9c7e45.jpg",
      "https://static.kiteprop.com/kp/properties/577716/78c83a/lg/78c83a9a8f02338a39f0a84b9837de0c.jpg",
      "https://static.kiteprop.com/kp/properties/577716/37d015/lg/37d0159d269f1fa2b71d973141201ffd.jpg",
      "https://static.kiteprop.com/kp/properties/577716/b31304/lg/b31304974284d74edbe650c2e3ec3e2f.jpg",
      "https://static.kiteprop.com/kp/properties/577716/62f973/lg/62f973d4eedf1508c4baa8c7bf198fd1.jpg",
      "https://static.kiteprop.com/kp/properties/577716/3918a5/lg/3918a566bfe794fad32bfafbe3db99fd.jpg",
      "https://static.kiteprop.com/kp/properties/577716/72fe6d/lg/72fe6df267a98c7f7c4afd37d4956708.jpg",
      "https://static.kiteprop.com/kp/properties/577716/afd5ed/lg/afd5ed422f911c1853842edf9d79e29e.jpg",
      "https://static.kiteprop.com/kp/properties/577716/0c1644/lg/0c1644506928babbe7549461230f8a06.jpg",
      "https://static.kiteprop.com/kp/properties/577716/6176a1/lg/6176a1f9bc9179493f898726e152ef04.jpg",
      "https://static.kiteprop.com/kp/properties/577716/89125e/lg/89125e550145b22303f2363e600d8ae6.jpg",
      "https://static.kiteprop.com/kp/properties/577716/15f6f1/lg/15f6f1b0b3ff0d8a40e1a058a1422bbd.jpg",
      "https://static.kiteprop.com/kp/properties/577716/64aed7/lg/64aed7f2304fef54c9b0483ab6d9b050.jpg",
      "https://static.kiteprop.com/kp/properties/577716/801a82/lg/801a82b4f031b910019b030c917a3a5e.jpg",
      "https://static.kiteprop.com/kp/properties/577716/2becd6/lg/2becd66215eaceab3e83f112dcf3a834.jpg",
      "https://static.kiteprop.com/kp/properties/577716/b5db67/lg/b5db67ab8192f9d8b63124b88bb11114.jpg",
      "https://static.kiteprop.com/kp/properties/577716/be982c/lg/be982c03597c6ecf7e3c0ae6579e9b92.jpg",
      "https://static.kiteprop.com/kp/properties/577716/bd9b4b/lg/bd9b4b0344a9c6979316ab5dd1dd63ff.jpg",
      "https://static.kiteprop.com/kp/properties/577716/c9d357/lg/c9d357e3904476ddf93f4b28ac2365b7.jpg",
      "https://static.kiteprop.com/kp/properties/577716/cd9df6/lg/cd9df62729e8596f61edc5aff6d16ea4.jpg",
      "https://static.kiteprop.com/kp/properties/577716/3cd9e5/lg/3cd9e5646d192457c1dafe28c62a3aea.jpg",
      "https://static.kiteprop.com/kp/properties/577716/02636c/lg/02636cb455e7bd21d9a3a41f53d6869e.jpg",
      "https://static.kiteprop.com/kp/properties/577716/b84b2a/lg/b84b2ac5ce9ee697ba32441e2c0b40d5.jpg",
      "https://static.kiteprop.com/kp/properties/577716/5a513e/lg/5a513e6e2369ab4e18b35eb37264b5ef.jpg",
      "https://static.kiteprop.com/kp/properties/577716/dec9cf/lg/dec9cf5ee276b8373e12b2612d60dd73.jpg",
      "https://static.kiteprop.com/kp/properties/577716/679642/lg/679642b709d15a9d3b8c961bea14518d.jpg"
    ],
    "originalUrl": "https://devorafernandezpropiedades.kitepropcrm.com/site/properties/577716/casa-4-amb-prop-horiz-al-frente-cochera-moron-sur-zona-residencial-a-pocas-cuadras-del-centro"
  },
  {
    "id": 6,
    "code": "KP575456",
    "title": "CASA 4 AMB. prop. horiz. al frente/ Cochera/ Moron Sur  | Zona residencial a pocas cuadras del centro",
    "location": "Morón",
    "address": "Julian Perez 613, Morón",
    "operation": "Alquiler",
    "propertyType": "PH",
    "priceUsd": 730,
    "priceDisplay": "ARS 950.000",
    "featured": true,
    "bedrooms": 3,
    "bathrooms": 2,
    "environments": 4,
    "surfaceTotal": 0,
    "surfaceCovered": 0,
    "description": "🏡 **CASA EN ALQUILER – MORÓN**\r\n\r\n📍 JULIAN PEREZ 613 MORÓN.\r\nExcelente ubicación, a aproximadamente **10 cuadras del Municipio**.\r\n\r\n• 3 dormitorios en Planta alta\r\n• Cochera\r\n• Cocina Comedor Living y Lavadero\r\n• Todos los servicios\r\n• Agua mediante motobombeador\r\n• Propiedad cómoda y funcional\r\n\r\n💰 **Alquiler: $ 950.000**\r\n\r\n📞 **Consultanos para más información o coordinar una visita.**\r\n\r\n**IMPORTANTE:** La información y descripciones contenidas en la presente publicación tienen carácter meramente informativo y orientativo, no revisten naturaleza contractual.\r\n\r\nLas superficies y medidas indicadas son aproximadas. Las dimensiones definitivas surgirán del título de propiedad y de los planos correspondientes.\r\n\r\nLa inmobiliaria se reserva el derecho de modificar, actualizar o corregir en cualquier momento, y sin previo aviso, precios, medidas, características, especificaciones y/o disponibilidad de los inmuebles publicados.",
    "features": [
      "3 Dormitorios",
      "2 Baños",
      "4 Ambientes",
      "Cochera para 1 auto",
      "Cochera",
      "Cocina Comedor Living y Lavadero",
      "Todos los servicios",
      "Agua mediante motobombeador"
    ],
    "image": "https://static.kiteprop.com/kp/properties/575456/afb590/lg/afb590a3af58b5506a5885444b1543fb.jpg",
    "gallery": [
      "https://static.kiteprop.com/kp/properties/575456/afb590/lg/afb590a3af58b5506a5885444b1543fb.jpg",
      "https://static.kiteprop.com/kp/properties/575456/656438/lg/65643888409e1fbac2fe778c7b303d0b.jpg",
      "https://static.kiteprop.com/kp/properties/575456/6d1407/lg/6d1407e822f62519851dd39a2cafc05f.jpg",
      "https://static.kiteprop.com/kp/properties/575456/245fac/lg/245facdbd1cd18feb782f2d5d20ef14a.jpg",
      "https://static.kiteprop.com/kp/properties/575456/f7856e/lg/f7856eb012f06dfd3a280928fde2aa87.jpg",
      "https://static.kiteprop.com/kp/properties/575456/344f43/lg/344f432c0e8bd4dca98233eba0249e06.jpg",
      "https://static.kiteprop.com/kp/properties/575456/74cb77/lg/74cb77016744a5695f865273b21668e7.jpg",
      "https://static.kiteprop.com/kp/properties/575456/e40a88/lg/e40a88dbb3c94cf3efbe707b1ee2bda3.jpg",
      "https://static.kiteprop.com/kp/properties/575456/30add5/lg/30add5267af7264e5c2ea4c1a82e8bf7.jpg",
      "https://static.kiteprop.com/kp/properties/575456/b1b823/lg/b1b823fe411d58e5bb85527284ecfa55.jpg",
      "https://static.kiteprop.com/kp/properties/575456/71be74/lg/71be746ba1c22cd448b1ee4fbda7c5ae.jpg",
      "https://static.kiteprop.com/kp/properties/575456/dfbf03/lg/dfbf0387da6eeacf40c48c5ad0e56dbc.jpg",
      "https://static.kiteprop.com/kp/properties/575456/731cc1/lg/731cc150ee499988adafc46b19bfb926.jpg",
      "https://static.kiteprop.com/kp/properties/575456/2e9724/lg/2e9724cf31634b9725c6513326630468.jpg",
      "https://static.kiteprop.com/kp/properties/575456/a12e7a/lg/a12e7a4cac34145bca694901bb5778ac.jpg",
      "https://static.kiteprop.com/kp/properties/575456/428fea/lg/428feabe6de614aa19fedde75e21d080.jpg",
      "https://static.kiteprop.com/kp/properties/575456/15d2b7/lg/15d2b7be019dc29838621c6b13293dec.jpg",
      "https://static.kiteprop.com/kp/properties/575456/0b978e/lg/0b978ee05923c784d82a65fa104d3c35.jpg",
      "https://static.kiteprop.com/kp/properties/575456/38be21/lg/38be21cd2ed74e1e9851592006c51fca.jpg",
      "https://static.kiteprop.com/kp/properties/575456/eea827/lg/eea827f0b7ee3007f5c4daaa3336d4ce.jpg",
      "https://static.kiteprop.com/kp/properties/575456/a2ad4d/lg/a2ad4d647a6d150bed9d128c65936c0b.jpg",
      "https://static.kiteprop.com/kp/properties/575456/00b8f5/lg/00b8f545875c671975072324d6aeae6a.jpg",
      "https://static.kiteprop.com/kp/properties/575456/4f9e34/lg/4f9e341e47ea56b2ba79faa4c63a5bca.jpg",
      "https://static.kiteprop.com/kp/properties/575456/ce5dab/lg/ce5dabbc6b4c00f7cfead3ef5699f4b7.jpg",
      "https://static.kiteprop.com/kp/properties/575456/0f0b5b/lg/0f0b5b0fba972d88b6a3a673854f09ef.jpg",
      "https://static.kiteprop.com/kp/properties/575456/acb2fb/lg/acb2fbc93fdd6e0020cdf3bc72ccc401.jpg",
      "https://static.kiteprop.com/kp/properties/575456/003cf3/lg/003cf313b1b81021c1349f2fe3c2b074.jpg",
      "https://static.kiteprop.com/kp/properties/575456/a6e53c/lg/a6e53cab2dd60c33600c3a8cf3bed8de.jpg"
    ],
    "originalUrl": "https://devorafernandezpropiedades.kitepropcrm.com/site/properties/575456/casa-4-amb-prop-horiz-al-frente-cochera-moron-sur-zona-residencial-a-pocas-cuadras-del-centro"
  },
  {
    "id": 7,
    "code": "KP564309",
    "title": "CASA 4 AMB. | HURLINGHAM/VILLA TESEI | A POCAS CUADRAS DE LA MUNICIPALIDAD",
    "location": "Hurlingham",
    "address": "Manuel Padilla 1126, esquina El Zorzal – Villa Tesei., Hurlingham",
    "operation": "Alquiler",
    "propertyType": "Casa",
    "priceUsd": 1038,
    "priceDisplay": "ARS 1.350.000",
    "featured": false,
    "bedrooms": 3,
    "bathrooms": 1,
    "environments": 4,
    "surfaceTotal": 32,
    "surfaceCovered": 32,
    "description": "🏡 **CASA EN ALQUILER – VILLA TESEI**\r\n\r\n📍 Manuel Padilla 1126, esquina El Zorzal – Villa Tesei.\r\nExcelente ubicación, a aproximadamente **4 cuadras del Municipio**.\r\n\r\n• 3 dormitorios\r\n• Cochera\r\n• Galería cubierta de aproximadamente **32 m²**\r\n• Lavadero\r\n• Todos los servicios\r\n• Pozo ciego nuevo\r\n• Agua mediante motobombeador\r\n• Propiedad cómoda y funcional\r\n\r\n💰 **Alquiler: $1.350.000**\r\n\r\n📞 **Consultanos para más información o coordinar una visita.**\r\n\r\n**IMPORTANTE:** La información y descripciones contenidas en la presente publicación tienen carácter meramente informativo y orientativo, no revisten naturaleza contractual.\r\n\r\nLas superficies y medidas indicadas son aproximadas. Las dimensiones definitivas surgirán del título de propiedad y de los planos correspondientes.\r\n\r\nLa inmobiliaria se reserva el derecho de modificar, actualizar o corregir en cualquier momento, y sin previo aviso, precios, medidas, características, especificaciones y/o disponibilidad de los inmuebles publicados.",
    "features": [
      "3 Dormitorios",
      "1 Baño",
      "4 Ambientes",
      "32 m² Superficie",
      "Cochera para 1 auto",
      "3 dormitorios",
      "Cochera",
      "Lavadero"
    ],
    "image": "https://static.kiteprop.com/kp/properties/564309/76c263/lg/76c263d122244f4e4891a441da18a487.jpg",
    "gallery": [
      "https://static.kiteprop.com/kp/properties/564309/76c263/lg/76c263d122244f4e4891a441da18a487.jpg",
      "https://static.kiteprop.com/kp/properties/564309/fdc504/lg/fdc50496b3d25d229fb22aa0a8dac200.jpg",
      "https://static.kiteprop.com/kp/properties/564309/474bdb/lg/474bdbd20a0b0c81d006bb5cafc26ce7.jpg",
      "https://static.kiteprop.com/kp/properties/564309/96d6a1/lg/96d6a18a198284f223a22cb7043a53a9.jpg",
      "https://static.kiteprop.com/kp/properties/564309/04c024/lg/04c024a79690e96a38c53e7db74ca804.jpg",
      "https://static.kiteprop.com/kp/properties/564309/e46e3a/lg/e46e3a56c0d82cdd84d9cbecb2b5e571.jpg",
      "https://static.kiteprop.com/kp/properties/564309/41c783/lg/41c7832785fe2aba88b75375bc54851b.jpg",
      "https://static.kiteprop.com/kp/properties/564309/dc74a1/lg/dc74a1eabafc9574fb8dd2df38c7bd78.jpg",
      "https://static.kiteprop.com/kp/properties/564309/d5e16e/lg/d5e16e5cf12a2db2595b1c5a056e1073.jpg",
      "https://static.kiteprop.com/kp/properties/564309/4f4eda/lg/4f4eda286f509c54bb5773f2e01c5c05.jpg",
      "https://static.kiteprop.com/kp/properties/564309/5fbaed/lg/5fbaed98e9e8e5a3e5a028ce71de3018.jpg",
      "https://static.kiteprop.com/kp/properties/564309/da61b1/lg/da61b1cd26da607464887634a76de066.jpg",
      "https://static.kiteprop.com/kp/properties/564309/2ba538/lg/2ba5384855a9905c02cffd2d36587f32.jpg",
      "https://static.kiteprop.com/kp/properties/564309/704d9f/lg/704d9f2f0148371dc79ded2557eab265.jpg",
      "https://static.kiteprop.com/kp/properties/564309/91e7a2/lg/91e7a223334844ea46b32247fd4af0f4.jpg",
      "https://static.kiteprop.com/kp/properties/564309/fc4f89/lg/fc4f8955ac010222572c5683e89e0d70.jpg",
      "https://static.kiteprop.com/kp/properties/564309/206c2e/lg/206c2e587242047c23dce54ac7494014.jpg",
      "https://static.kiteprop.com/kp/properties/564309/b34a55/lg/b34a55efaff96165c1fdfd649d36eb02.jpg",
      "https://static.kiteprop.com/kp/properties/564309/dbe92b/lg/dbe92b090939ef0d5de724813504b9da.jpg",
      "https://static.kiteprop.com/kp/properties/564309/a0feb9/lg/a0feb94f11e5b7d0148e2489dd6b1c45.jpg",
      "https://static.kiteprop.com/kp/properties/564309/7a99f2/lg/7a99f29aee728ff0dc13009a97aac53b.jpg",
      "https://static.kiteprop.com/kp/properties/564309/3d4e5e/lg/3d4e5e864a6bbbcc805a4bb266f7365f.jpg",
      "https://static.kiteprop.com/kp/properties/564309/8f546b/lg/8f546b641071da57b9f43bb12840233d.jpg",
      "https://static.kiteprop.com/kp/properties/564309/e109f1/lg/e109f1448af83cd72aa435a78ff67f0a.jpg"
    ],
    "originalUrl": "https://devorafernandezpropiedades.kitepropcrm.com/site/properties/564309/casa-4-amb-hurlinghamvilla-tesei-a-pocas-cuadras-de-la-municipalidad"
  },
  {
    "id": 8,
    "code": "KP550737",
    "title": "CASA  |MORON/HAEDO | A METROS DE LA ESTACÍON DE MORÓN",
    "location": "Morón",
    "address": "Jose ingenieros 782, Morón",
    "operation": "Venta",
    "propertyType": "Casa",
    "priceUsd": 68000,
    "priceDisplay": "USD 68.000",
    "featured": false,
    "bedrooms": 0,
    "bathrooms": 1,
    "environments": 0,
    "surfaceTotal": 220,
    "surfaceCovered": 150,
    "description": "Casa americana a reciclar – Excelente ubicación\r\n\r\nOportunidad para reciclar y diseñar la casa que siempre imaginaste.\r\n\r\nLa propiedad cuenta con:\r\n\r\nDos dormitorios.\r\n\r\nLiving-comedor.\r\n\r\nCocina.\r\n\r\nBaño.\r\n\r\nAmplio patio.\r\n\r\nEntrada para vehículo.\r\n\r\nTecho de losa, con potencial para futuras ampliaciones.\r\n\r\nUbicada a solo 2 cuadras de Av. Rivadavia y a 7 cuadras de Acceso oeste, en una zona de excelente acceso, con cercanía a comercios, transporte y servicios.\r\n\r\nIdeal para quienes buscan una propiedad con gran potencial de refacción o inversión.",
    "features": [
      "1 Baño",
      "220 m² Superficie",
      "Cochera para 2 autos",
      "La propiedad cuenta con",
      "Dos dormitorios",
      "Living-comedor",
      "Cocina",
      "Baño"
    ],
    "image": "https://static.kiteprop.com/kp/properties/550737/c29edf/lg/c29edfb533fd90c230c33be715ac366c.jpg",
    "gallery": [
      "https://static.kiteprop.com/kp/properties/550737/c29edf/lg/c29edfb533fd90c230c33be715ac366c.jpg",
      "https://static.kiteprop.com/kp/properties/550737/fcdf99/lg/fcdf99a0c5c1f66ad66afbdd385e52f8.jpg",
      "https://static.kiteprop.com/kp/properties/550737/680c54/lg/680c5491e934228114a01dda6a2e0d99.jpg",
      "https://static.kiteprop.com/kp/properties/550737/2aa17d/lg/2aa17d23d4c70cdde7a01430e4cb6c71.jpg",
      "https://static.kiteprop.com/kp/properties/550737/2ad2e2/lg/2ad2e22dd6a9b3d925d99efe18968ff8.jpg",
      "https://static.kiteprop.com/kp/properties/550737/dd6ae1/lg/dd6ae16c19bcd6f7639857c3bff2df47.jpg"
    ],
    "originalUrl": "https://devorafernandezpropiedades.kitepropcrm.com/site/properties/550737/casa-moronhaedo-a-metros-de-la-estacion-de-moron"
  },
  {
    "id": 9,
    "code": "KP548736",
    "title": "CASA AMERICANA | CASTELAR/MORON | A METROS DEL PLAZA OESTE",
    "location": "Castelar",
    "address": "PAUNERO 355, Morón",
    "operation": "Venta",
    "propertyType": "Casa",
    "priceUsd": 42000,
    "priceDisplay": "USD 42.000",
    "featured": false,
    "bedrooms": 0,
    "bathrooms": 1,
    "environments": 0,
    "surfaceTotal": 220,
    "surfaceCovered": 150,
    "description": "Casa americana a reciclar – Excelente ubicación\r\n\r\nOportunidad para reciclar y diseñar la casa que siempre imaginaste.\r\n\r\nLa propiedad cuenta con:\r\n\r\nDos dormitorios.\r\n\r\nLiving-comedor.\r\n\r\nCocina.\r\n\r\nBaño.\r\n\r\nAmplio patio.\r\n\r\nEntrada para dos vehículos.\r\n\r\nTecho de losa, con potencial para futuras ampliaciones.\r\n\r\nUbicada a solo 2 cuadras de Av. Juan Manuel de Rosas (ex Vergara) y a 3 cuadras de Plaza Oeste, en una zona de excelente acceso, con cercanía a comercios, transporte y servicios.\r\n\r\nIdeal para quienes buscan una propiedad con gran potencial de refacción o inversión.",
    "features": [
      "1 Baño",
      "220 m² Superficie",
      "Cochera para 2 autos",
      "La propiedad cuenta con",
      "Dos dormitorios",
      "Living-comedor",
      "Cocina",
      "Baño"
    ],
    "image": "https://static.kiteprop.com/kp/properties/548736/e1ae2b/lg/e1ae2b6ac8403ccd24bcdd516cb77b14.jpg",
    "gallery": [
      "https://static.kiteprop.com/kp/properties/548736/e1ae2b/lg/e1ae2b6ac8403ccd24bcdd516cb77b14.jpg",
      "https://static.kiteprop.com/kp/properties/548736/fa2a77/lg/fa2a77a86e4d8e8332f8c931611b9c6e.jpg",
      "https://static.kiteprop.com/kp/properties/548736/1218de/lg/1218de79d20d904c57dc50fa2d142548.jpg",
      "https://static.kiteprop.com/kp/properties/548736/934482/lg/9344829a4c042f4eda88650698eaa68e.jpg",
      "https://static.kiteprop.com/kp/properties/548736/8237bf/lg/8237bf0292a840110eaee027118c082e.jpg",
      "https://static.kiteprop.com/kp/properties/548736/2853e5/lg/2853e55c8fbdf8ee8ef77c75d30ce9f4.jpg",
      "https://static.kiteprop.com/kp/properties/548736/fd5bfa/lg/fd5bfae048ca12d8903f51a044a97a5e.jpg",
      "https://static.kiteprop.com/kp/properties/548736/5e2587/lg/5e2587d72b7f0030a3b82f8a07dcffb0.jpg"
    ],
    "originalUrl": "https://devorafernandezpropiedades.kitepropcrm.com/site/properties/548736/casa-americana-castelarmoron-a-metros-del-plaza-oeste"
  },
  {
    "id": 10,
    "code": "KP548203",
    "title": "LOCAL COMERCIAL | MORÓN SUR",
    "location": "Morón",
    "address": "CORDOBA 475, Morón",
    "operation": "Alquiler",
    "propertyType": "Local Comercial",
    "priceUsd": 423,
    "priceDisplay": "ARS 550.000",
    "featured": false,
    "bedrooms": 0,
    "bathrooms": 0,
    "environments": 0,
    "surfaceTotal": 28,
    "surfaceCovered": 28,
    "description": "LOCAL COMERCIAL EN MORÓN NORTE\r\n\r\n• Excelente ubicación, a pocas cuadras de la Estación Morón y del Hospital de Morón.\r\n• Amplia vidriera.\r\n• Puerta de acceso con ventanilla.\r\n• Persiana ciega.\r\n• Ideal para múltiples rubros comerciales.\r\n\r\n¡Consultanos para coordinar una visita!",
    "features": [
      "28 m² Superficie",
      "Amplia vidriera",
      "Puerta de acceso con ventanilla",
      "Persiana ciega",
      "Ideal para múltiples rubros comerciales",
      "¡Consultanos para coordinar una visita!"
    ],
    "image": "https://static.kiteprop.com/kp/properties/548203/8fdcac/lg/8fdcaceeb02bd2550b7a8adde25416a2.jpg",
    "gallery": [
      "https://static.kiteprop.com/kp/properties/548203/8fdcac/lg/8fdcaceeb02bd2550b7a8adde25416a2.jpg",
      "https://static.kiteprop.com/kp/properties/548203/a32b6f/lg/a32b6f0a04ba8d260277f5bf95c292be.jpg",
      "https://static.kiteprop.com/kp/properties/548203/e93eaf/lg/e93eafc3f976ee62598cb522a61b940f.jpg",
      "https://static.kiteprop.com/kp/properties/548203/c5855a/lg/c5855a2a9c878218afeabb0b6b15eb93.jpg",
      "https://static.kiteprop.com/kp/properties/548203/c1edca/lg/c1edcab08bbc7578d07a073e203eea39.jpg",
      "https://static.kiteprop.com/kp/properties/548203/06c810/lg/06c810b7fc4fedb3276424e36ac9ef08.jpg",
      "https://static.kiteprop.com/kp/properties/548203/103d62/lg/103d623347a9a3eed08e90acca19b0b9.jpg"
    ],
    "originalUrl": "https://devorafernandezpropiedades.kitepropcrm.com/site/properties/548203/local-comercial-moron-sur"
  },
  {
    "id": 11,
    "code": "KP536342",
    "title": "Departamento 2 amb. | Villa Sarmiento/Ramos Mejia | Con cochera",
    "location": "Morón",
    "address": "yapeyu y 3 de febrero, Morón",
    "operation": "Venta",
    "propertyType": "Departamento",
    "priceUsd": 48000,
    "priceDisplay": "USD 48.000",
    "featured": false,
    "bedrooms": 1,
    "bathrooms": 1,
    "environments": 2,
    "surfaceTotal": 29,
    "surfaceCovered": 29,
    "description": "Departamento tipo Dúplex de 2 Ambientes con Cochera – Excelente Ubicación\r\n\r\nOportunidad de adquirir un cómodo y luminoso departamento tipo dúplex, ubicado en primer piso, con cochera incluida y toda la documentación al día, listo para escriturar.\r\n\r\nEn la planta baja cuenta con un amplio salón comedor, cocina semi integrada mediante una práctica barra desayunadora y baño completo. Además, posee balcón que aporta una excelente ventilación e iluminación natural.\r\n\r\nEn la planta alta se encuentra el dormitorio, de generosas dimensiones, con placard empotrado y acceso mediante una cómoda escalera.\r\n\r\nLa propiedad se destaca por su gran luminosidad y su excelente ubicación, en una zona comercial con rápido acceso a avenidas principales y a la estación de transporte, ofreciendo comodidad y conectividad para la vida diaria.\r\n\r\nCaracterísticas principales:\r\n\r\nDepartamento tipo dúplex de 2 ambientes.\r\nPrimer piso.\r\nCochera incluida.\r\nCocina semi integrada con barra.\r\nAmplio living-comedor.\r\nBaño completo.\r\nDormitorio con placard.\r\nBalcón.\r\nMuy luminoso.\r\nExcelente ubicación comercial.\r\nFácil acceso a estación y avenidas.\r\nDocumentación al día. Apto para escriturar.\r\n\r\nConsultanos para coordinar una visita y conocer esta excelente oportunidad.",
    "features": [
      "1 Dormitorio",
      "1 Baño",
      "2 Ambientes",
      "29 m² Superficie",
      "Cochera",
      "Departamento tipo dúplex de 2 ambientes",
      "Primer piso",
      "Cochera incluida"
    ],
    "image": "https://static.kiteprop.com/kp/properties/536342/9c9bbb/lg/9c9bbb3e30823140b488fa9314b26171.jpg",
    "gallery": [
      "https://static.kiteprop.com/kp/properties/536342/9c9bbb/lg/9c9bbb3e30823140b488fa9314b26171.jpg",
      "https://static.kiteprop.com/kp/properties/536342/e87e86/lg/e87e86e44d13e705eccedc8c438f5fca.jpg",
      "https://static.kiteprop.com/kp/properties/536342/45364a/lg/45364a8d4c94cd206b9a39156ed85411.jpg",
      "https://static.kiteprop.com/kp/properties/536342/9c01fa/lg/9c01fad6fd4c51b46090eef2f573fb2f.jpg",
      "https://static.kiteprop.com/kp/properties/536342/941a1e/lg/941a1e9fd57e00e6ee5ae770d5ce53d3.jpg",
      "https://static.kiteprop.com/kp/properties/536342/d01186/lg/d011869a88da8fee6f214ce7d1eb4381.jpg",
      "https://static.kiteprop.com/kp/properties/536342/9cd754/lg/9cd75435f93c18bdaad30ebc3cd08c79.jpg",
      "https://static.kiteprop.com/kp/properties/536342/503e5b/lg/503e5bd1a98bfc4972aec061f7b8f2bd.jpg",
      "https://static.kiteprop.com/kp/properties/536342/75f65c/lg/75f65c189bb2858b049b3ceb3184fd2b.jpg",
      "https://static.kiteprop.com/kp/properties/536342/3eb9e8/lg/3eb9e8ca8a602383eaf58fea9cd442dd.jpg",
      "https://static.kiteprop.com/kp/properties/536342/75bcbf/lg/75bcbf8509bcab5423133cfe17e45e5f.jpg",
      "https://static.kiteprop.com/kp/properties/536342/901805/lg/90180583581b812b01faec83e10ed43e.jpg",
      "https://static.kiteprop.com/kp/properties/536342/9155cd/lg/9155cd274b025e7bc0ef01ee86253bc8.jpg",
      "https://static.kiteprop.com/kp/properties/536342/f0e5cd/lg/f0e5cd9d92c86b003480c86cd3fe6271.jpg",
      "https://static.kiteprop.com/kp/properties/536342/dfe949/lg/dfe9499f1b8964f50dbc6be440ca3681.jpg",
      "https://static.kiteprop.com/kp/properties/536342/7d2d55/lg/7d2d55d16fbbda9e24eab7e70ccdaf34.jpg"
    ],
    "originalUrl": "https://devorafernandezpropiedades.kitepropcrm.com/site/properties/536342/departamento-2-amb-villa-sarmientoramos-mejia-con-cochera"
  },
  {
    "id": 12,
    "code": "KP530942",
    "title": "PH. 2 AMBIENTES entrada individual  | Morón Sur | Sobre av. Irigoyen",
    "location": "Morón",
    "address": "Irigoyen y guido, Morón",
    "operation": "Alquiler",
    "propertyType": "Departamento",
    "priceUsd": 369,
    "priceDisplay": "ARS 480.000",
    "featured": false,
    "bedrooms": 0,
    "bathrooms": 1,
    "environments": 2,
    "surfaceTotal": 0,
    "surfaceCovered": 0,
    "description": "📍 DEPARTAMENTO DOS AMBIENTES EN MORÓN - EN AV. IRIGOYEN-\r\n\r\n\r\n• Ubicado en Planta baja\r\n• 2 Ambientes. con Cocina semi dividida. lo que genera un espacio más funcional.\r\nServicios Luz y Gas\r\n Consultanos para más información.",
    "features": [
      "1 Baño",
      "2 Ambientes",
      "Servicios Luz y Gas",
      "Consultanos para más información"
    ],
    "image": "https://static.kiteprop.com/kp/properties/530942/c93b5f/lg/c93b5f48f234759df39218fa1d92aaf9.jpg",
    "gallery": [
      "https://static.kiteprop.com/kp/properties/530942/c93b5f/lg/c93b5f48f234759df39218fa1d92aaf9.jpg",
      "https://static.kiteprop.com/kp/properties/530942/fdf293/lg/fdf2934a1332b62105edf4a3f7fed4b8.jpg",
      "https://static.kiteprop.com/kp/properties/530942/59f26a/lg/59f26a7611b54554fe62e5e39f1dda49.jpg",
      "https://static.kiteprop.com/kp/properties/530942/aaa22a/lg/aaa22a9420744c99ca0fb028dcd6a3c0.jpg",
      "https://static.kiteprop.com/kp/properties/530942/0d69fa/lg/0d69fa09dc4e439587efe992ed7811cd.jpg",
      "https://static.kiteprop.com/kp/properties/530942/d34f3e/lg/d34f3e8099b9f9fae7c07d5976b20fdf.jpg",
      "https://static.kiteprop.com/kp/properties/530942/bf750a/lg/bf750a83afc58570fb993b3c05d5cecd.jpg",
      "https://static.kiteprop.com/kp/properties/530942/cde870/lg/cde870a97f667c8f1906cbb461957dc9.jpg"
    ],
    "originalUrl": "https://devorafernandezpropiedades.kitepropcrm.com/site/properties/530942/ph-2-ambientes-entrada-individual-moron-sur-sobre-av-irigoyen"
  },
  {
    "id": 13,
    "code": "KP530934",
    "title": "Monoambiente entrada individual en PB | Morón Sur | Sobre av. Irigoyen",
    "location": "Morón",
    "address": "Irigoyen y guido, Morón",
    "operation": "Alquiler",
    "propertyType": "Departamento",
    "priceUsd": 292,
    "priceDisplay": "ARS 380.000",
    "featured": false,
    "bedrooms": 0,
    "bathrooms": 1,
    "environments": 1,
    "surfaceTotal": 0,
    "surfaceCovered": 0,
    "description": "📍 MONOAMBIENTE EN MORÓN\r\n\r\n\r\n• Ubicado en Planta baja\r\n• Ambiente con Cocina semi dividida. lo que genera un espacio más funcional.\r\nServicios Luz y Gas\r\n Consultanos para más información.",
    "features": [
      "1 Baño",
      "1 Ambiente",
      "Servicios Luz y Gas",
      "Consultanos para más información"
    ],
    "image": "https://static.kiteprop.com/kp/properties/530934/67470f/lg/67470fecd1fe0d3264a8269677911f2a.jpg",
    "gallery": [
      "https://static.kiteprop.com/kp/properties/530934/67470f/lg/67470fecd1fe0d3264a8269677911f2a.jpg",
      "https://static.kiteprop.com/kp/properties/530934/8edc02/lg/8edc02a5098e88fb35a129f5424709f1.jpg",
      "https://static.kiteprop.com/kp/properties/530934/2f5fe8/lg/2f5fe89080284518bc8643e51ec944ee.jpg",
      "https://static.kiteprop.com/kp/properties/530934/7d91d5/lg/7d91d5e33ce13cc70cd573aac269bfc3.jpg",
      "https://static.kiteprop.com/kp/properties/530934/ed4ff7/lg/ed4ff74ee730fb75a1784574e9c18b18.jpg"
    ],
    "originalUrl": "https://devorafernandezpropiedades.kitepropcrm.com/site/properties/530934/monoambiente-entrada-individual-en-pb-moron-sur-sobre-av-irigoyen"
  },
  {
    "id": 14,
    "code": "KP528717",
    "title": "Oportunidad | Dto. 3 amb. SOLO USO PROFESIONAL | Morón Centro a 2 cuadras de la estacíon",
    "location": "Morón",
    "address": "MACHADO 986, Morón",
    "operation": "Alquiler",
    "propertyType": "Departamento",
    "priceUsd": 376,
    "priceDisplay": "ARS 490.000",
    "featured": false,
    "bedrooms": 2,
    "bathrooms": 1,
    "environments": 3,
    "surfaceTotal": 0,
    "surfaceCovered": 0,
    "description": "🏢 ALQUILER | DEPARTAMENTO 3 AMBIENTES – MORÓN CENTRO SOLO USO PROFESIONAL. NO VIVIENDA\r\n\r\n📍 Excelente ubicación, a solo 2 cuadras de la estación de Morón.\r\n\r\n• Departamento de 3 ambientes en 1° piso por escalera.\r\n• Ubicado al contrafrente, brindando mayor tranquilidad.\r\n• 2 dormitorios con placard.\r\n• Balcón con vista al patio interno.\r\n• Living comedor amplio y luminoso.\r\n• Cocina independiente.\r\n• Servicios individuales de gas y electricidad.\r\n• Sin expensas (solo gastos compartidos del edificio).\r\n• Ideal para uso profesional.\r\n• Apto para estudios jurídicos, contables y otras actividades profesionales.\r\n\r\n📋 Requisitos de ingreso:\r\n• Mes adelantado.\r\n• Sin depósito.\r\n\r\n📞 Consultanos para más información o coordinar una visita.\r\n\r\nIMPORTANTE: La información y descripciones contenidas en la presente publicación tienen carácter meramente informativo y orientativo, no revisten naturaleza contractual.\r\n\r\nLas superficies y medidas indicadas son aproximadas. Las dimensiones definitivas surgirán del título de propiedad y de los planos correspondientes.\r\n\r\n\r\nLa inmobiliaria se reserva el derecho de modificar, actualizar o corregir en cualquier momento, y sin previo aviso, precios, medidas, características, especificaciones y/o disponibilidad de los inmuebles publicados.",
    "features": [
      "2 Dormitorios",
      "1 Baño",
      "3 Ambientes",
      "2 dormitorios con placard",
      "Balcón con vista al patio interno",
      "Living comedor amplio y luminoso",
      "Cocina independiente",
      "Ideal para uso profesional"
    ],
    "image": "https://static.kiteprop.com/kp/properties/528717/95061f/lg/95061f621c485d7e46663425e59eb0dc.jpg",
    "gallery": [
      "https://static.kiteprop.com/kp/properties/528717/95061f/lg/95061f621c485d7e46663425e59eb0dc.jpg",
      "https://static.kiteprop.com/kp/properties/528717/e111c1/lg/e111c14feb4de5e5a5139c27084f7669.jpg",
      "https://static.kiteprop.com/kp/properties/528717/9de64b/lg/9de64bd8af376be910bf61c30e47546b.jpg",
      "https://static.kiteprop.com/kp/properties/528717/303b3d/lg/303b3dfd85d5668d7219294579c42a45.jpg",
      "https://static.kiteprop.com/kp/properties/528717/66b960/lg/66b9603b02d795cc4d18e172a1a6c104.jpg",
      "https://static.kiteprop.com/kp/properties/528717/cf6376/lg/cf6376c7758f5b87773b6834b267d0e2.jpg",
      "https://static.kiteprop.com/kp/properties/528717/b0834e/lg/b0834ee639b38fea934896abe4b0b7dc.jpg",
      "https://static.kiteprop.com/kp/properties/528717/85c1db/lg/85c1dba514cad5c47b0466d9578a7def.jpg",
      "https://static.kiteprop.com/kp/properties/528717/cbb1c0/lg/cbb1c0eb73676d1595d814a4bf2985b7.jpg",
      "https://static.kiteprop.com/kp/properties/528717/2d47c4/lg/2d47c4b81542608be0dc83b20daaea31.jpg",
      "https://static.kiteprop.com/kp/properties/528717/24c526/lg/24c5268ac8f3642c31f319c851d5a5be.jpg",
      "https://static.kiteprop.com/kp/properties/528717/a1a4c4/lg/a1a4c4a96745cce81e8a94f106880c6a.jpg",
      "https://static.kiteprop.com/kp/properties/528717/7e88e2/lg/7e88e2d328c9fdaf7782f6c37e10297a.jpg",
      "https://static.kiteprop.com/kp/properties/528717/ea7aa9/lg/ea7aa9f66f957e125ddfec6308d8e275.jpg",
      "https://static.kiteprop.com/kp/properties/528717/0825f7/lg/0825f72667197bb48aa059c25b60e1b1.jpg",
      "https://static.kiteprop.com/kp/properties/528717/3a5964/lg/3a5964252f545816a110920f609d3d7b.jpg"
    ],
    "originalUrl": "https://devorafernandezpropiedades.kitepropcrm.com/site/properties/528717/oportunidad-dto-3-amb-solo-uso-profesional-moron-centro-a-2-cuadras-de-la-estacion"
  },
  {
    "id": 15,
    "code": "KP516546",
    "title": "Departamento  2 ambientes | con Cochera individual | Morón Centro",
    "location": "Morón",
    "address": "Poeta Forti, Morón",
    "operation": "Venta",
    "propertyType": "Departamento",
    "priceUsd": 50000,
    "priceDisplay": "USD 50.000",
    "featured": false,
    "bedrooms": 1,
    "bathrooms": 1,
    "environments": 2,
    "surfaceTotal": 0,
    "surfaceCovered": 0,
    "description": "🏢 DEPARTAMENTO EN TERCER PISO,  2 AMBIENTES – MORÓN CENTRO\r\n\r\n✨ Características:\r\n\r\n📍 Excelente ubicación.\r\n\r\n🚗 Cochera descubierta incluida.\r\n\r\n💡 Servicios Luz y Gas\r\n\r\n🏙️ 3° piso por escalera.\r\n\r\n🛏️ Habitación con placard empotrado.\r\n\r\n🚿 Baño completo.\r\n\r\n💰 Bajas Expensas aproximadas:\r\n\r\n📞 Consultanos para coordinar tu visita.",
    "features": [
      "1 Dormitorio",
      "1 Baño",
      "2 Ambientes",
      "Cochera para 1 auto",
      "Excelente ubicación",
      "Cochera descubierta incluida",
      "💡 Servicios Luz y Gas",
      "🏙️ 3° piso por escalera"
    ],
    "image": "https://static.kiteprop.com/kp/properties/516546/067545/lg/067545b2985bd304500d37dc509db1e7.jpg",
    "gallery": [
      "https://static.kiteprop.com/kp/properties/516546/067545/lg/067545b2985bd304500d37dc509db1e7.jpg",
      "https://static.kiteprop.com/kp/properties/516546/8f22b3/lg/8f22b37749001f82ef96b0d9805fb500.jpg",
      "https://static.kiteprop.com/kp/properties/516546/38bea3/lg/38bea38d7e2dc1a4746c24c1ec54c91d.jpg",
      "https://static.kiteprop.com/kp/properties/516546/5921ca/lg/5921cae887fd4bddd9ec36d1c0923283.jpg",
      "https://static.kiteprop.com/kp/properties/516546/02c4c9/lg/02c4c941935dce089c8879961cedbbc9.jpg",
      "https://static.kiteprop.com/kp/properties/516546/6b5878/lg/6b58787c4bac568433d09df5fa1d0c52.jpg",
      "https://static.kiteprop.com/kp/properties/516546/c7ab84/lg/c7ab840e65fecfb17bef6f2d420a5db6.jpg",
      "https://static.kiteprop.com/kp/properties/516546/b53b33/lg/b53b332ddbd55fd56596acc5ec331bd4.jpg",
      "https://static.kiteprop.com/kp/properties/516546/0084c8/lg/0084c8f0fec1a76d90e447c4b3d1e0b1.jpg",
      "https://static.kiteprop.com/kp/properties/516546/824f70/lg/824f70a74f8db95865531cd2c88fbefe.jpg",
      "https://static.kiteprop.com/kp/properties/516546/94a0a2/lg/94a0a2533ff68ea82e42d58032ce6bc0.jpg",
      "https://static.kiteprop.com/kp/properties/516546/d2b926/lg/d2b9261bc7d72384bdd8136fbe1f81a9.jpg",
      "https://static.kiteprop.com/kp/properties/516546/3a0dd1/lg/3a0dd1b59f523bd47f56a48acda57444.jpg",
      "https://static.kiteprop.com/kp/properties/516546/8fccea/lg/8fccea0e8be7e3e017dbbc97546a4855.jpg",
      "https://static.kiteprop.com/kp/properties/516546/236ba0/lg/236ba094c5e996884e1b0220a2ae6f81.jpg"
    ],
    "originalUrl": "https://devorafernandezpropiedades.kitepropcrm.com/site/properties/516546/departamento-2-ambientes-con-cochera-individual-moron-centro"
  },
  {
    "id": 16,
    "code": "KP516190",
    "title": "Casa americana 3 amb. | Morón Norte Residencial | con Patio y entrada de auto",
    "location": "Morón",
    "address": "Lamadrid 866, Morón",
    "operation": "Venta",
    "propertyType": "Casa",
    "priceUsd": 97000,
    "priceDisplay": "USD 97.000",
    "featured": false,
    "bedrooms": 2,
    "bathrooms": 1,
    "environments": 3,
    "surfaceTotal": 0,
    "surfaceCovered": 0,
    "description": "🏡 CASA EN VENTA – MORÓN NORTE RESIDENCIAL\r\n\r\nExcelente oportunidad en una zona residencial y tranquila de Morón Norte.\r\n\r\nCaracterísticas:\r\n\r\nPropiedad desarrollada en planta baja\r\nLiving amplio y luminoso\r\nCocina comedor\r\nPatio y terraza\r\nLavadero en planta superior\r\nEntrada de auto\r\nAmbientes muy luminosos\r\n\r\n💡 Propiedad cómoda y funcional, ideal para vivienda familiar.\r\n\r\n📞 Consultanos para más información o coordinar una visita.",
    "features": [
      "2 Dormitorios",
      "1 Baño",
      "3 Ambientes",
      "Cochera para 1 auto",
      "Living amplio y luminoso",
      "Cocina comedor",
      "Patio y terraza",
      "Entrada de auto"
    ],
    "image": "https://static.kiteprop.com/kp/properties/516190/6b7bc5/lg/6b7bc53c405e094526c3c22f7b5649c5.jpg",
    "gallery": [
      "https://static.kiteprop.com/kp/properties/516190/6b7bc5/lg/6b7bc53c405e094526c3c22f7b5649c5.jpg",
      "https://static.kiteprop.com/kp/properties/516190/650467/lg/650467dd43967698bb8e31355bd31678.jpg",
      "https://static.kiteprop.com/kp/properties/516190/b31517/lg/b31517ba6c0de230916673b64030f97c.jpg",
      "https://static.kiteprop.com/kp/properties/516190/f327d2/lg/f327d2d087ef66ca718238b63ff46399.jpg",
      "https://static.kiteprop.com/kp/properties/516190/022055/lg/02205546cadfbc3106a1b38a4a431783.jpg",
      "https://static.kiteprop.com/kp/properties/516190/3b5654/lg/3b5654c3fe63d545bae12c48d42be07d.jpg",
      "https://static.kiteprop.com/kp/properties/516190/06c4b2/lg/06c4b2650d3ce0897e85283bcd4b05e4.jpg",
      "https://static.kiteprop.com/kp/properties/516190/4cf670/lg/4cf67036a24076a52b08ca04006eddf6.jpg",
      "https://static.kiteprop.com/kp/properties/516190/75060e/lg/75060ec02e14ec1e141bb4d53c77a830.jpg",
      "https://static.kiteprop.com/kp/properties/516190/cdf832/lg/cdf832befde318e4f9d09b6a5ecefc30.jpg",
      "https://static.kiteprop.com/kp/properties/516190/b7e27e/lg/b7e27ead0b26b2e8bc10c06c80292297.jpg",
      "https://static.kiteprop.com/kp/properties/516190/9d70ff/lg/9d70ffe530a6b5cc967924163275bc62.jpg",
      "https://static.kiteprop.com/kp/properties/516190/16896c/lg/16896cd6f4a7f03349b09ec0a69f7a99.jpg",
      "https://static.kiteprop.com/kp/properties/516190/2709e6/lg/2709e6fcad584b59a09b92dd684be405.jpg",
      "https://static.kiteprop.com/kp/properties/516190/c2b975/lg/c2b97520d4aca4a184c02d867097bbfd.jpg",
      "https://static.kiteprop.com/kp/properties/516190/d3f521/lg/d3f52162559e2c20c26d46c77fe06f52.jpg",
      "https://static.kiteprop.com/kp/properties/516190/9eef87/lg/9eef87d5f3e4061afd03ccbf4dfda504.jpg",
      "https://static.kiteprop.com/kp/properties/516190/c168ce/lg/c168ce717a9aa9585538b1832aa950b6.jpg",
      "https://static.kiteprop.com/kp/properties/516190/b9da74/lg/b9da744188dab35a49e3025fd7049ff0.jpg"
    ],
    "originalUrl": "https://devorafernandezpropiedades.kitepropcrm.com/site/properties/516190/casa-americana-3-amb-moron-norte-residencial-con-patio-y-entrada-de-auto"
  },
  {
    "id": 17,
    "code": "KP506845",
    "title": "Monoambiente | Morón centro | a pocas cuadras de la estacíon",
    "location": "Morón",
    "address": "Larrea y Constituyentes, Morón",
    "operation": "Venta",
    "propertyType": "Departamento",
    "priceUsd": 42000,
    "priceDisplay": "USD 42.000",
    "featured": false,
    "bedrooms": 0,
    "bathrooms": 1,
    "environments": 1,
    "surfaceTotal": 0,
    "surfaceCovered": 0,
    "description": "📍 MONOAMBIENTE EN MORÓN – EXCELENTE UBICACIÓN - MUY LUMINOSO \r\n\r\n• A 4 cuadras de la estación y a 2 cuadras de la Universidad de Morón.\r\n• Ubicado en 1° piso con ascensor.\r\n• Posibilidad de armar un Ambiente dividido con Barra, lo que genera un espacio más funcional.\r\n• Pequeños balcónes al frente.\r\n\r\nServicios GAS Y LUZ\r\nConeccíon para Lavarropas \r\n\r\nIdeal para estudiantes o inversión ! Consultanos para más información.",
    "features": [
      "1 Baño",
      "1 Ambiente",
      "Ubicado en 1° piso con ascensor",
      "Pequeños balcónes al frente",
      "Servicios GAS Y LUZ",
      "Coneccíon para Lavarropas"
    ],
    "image": "https://static.kiteprop.com/kp/properties/506845/6c5057/lg/6c5057e2258b3ec01651986aa27abead.jpg",
    "gallery": [
      "https://static.kiteprop.com/kp/properties/506845/6c5057/lg/6c5057e2258b3ec01651986aa27abead.jpg",
      "https://static.kiteprop.com/kp/properties/506845/97acca/lg/97acca87b87eefd5245e798e2f3a4919.jpg",
      "https://static.kiteprop.com/kp/properties/506845/3acf7d/lg/3acf7d1aca05991601db5d1ed3ed4516.jpg",
      "https://static.kiteprop.com/kp/properties/506845/3f4ece/lg/3f4ecefaf6e916f1dc1c537a2b8d2c99.jpg",
      "https://static.kiteprop.com/kp/properties/506845/6b8314/lg/6b83140beef8c17476d32355a5a042eb.jpg",
      "https://static.kiteprop.com/kp/properties/506845/aeccff/lg/aeccff36512655272078a8009cc8106d.jpg",
      "https://static.kiteprop.com/kp/properties/506845/89f076/lg/89f076256c847caf9d0900b66236ca83.jpg",
      "https://static.kiteprop.com/kp/properties/506845/ff402f/lg/ff402f37a04e50bd7b6c9051b6d4cdbe.jpg",
      "https://static.kiteprop.com/kp/properties/506845/d199f0/lg/d199f01efb10f5bb797444fe06e96449.jpg",
      "https://static.kiteprop.com/kp/properties/506845/ed62d4/lg/ed62d468dd0fe69aa4427d8b87e63667.jpg",
      "https://static.kiteprop.com/kp/properties/506845/fa0071/lg/fa0071f37b7c359edee0a0a7f6e976c3.jpg"
    ],
    "originalUrl": "https://devorafernandezpropiedades.kitepropcrm.com/site/properties/506845/monoambiente-moron-centro-a-pocas-cuadras-de-la-estacion"
  },
  {
    "id": 18,
    "code": "KP503295",
    "title": "Monoambiente | Morón centro | a pocas cuadras de la estacíon",
    "location": "Morón",
    "address": "Cabildo 285, Morón",
    "operation": "Alquiler",
    "propertyType": "Departamento",
    "priceUsd": 269,
    "priceDisplay": "ARS 350.000",
    "featured": false,
    "bedrooms": 0,
    "bathrooms": 1,
    "environments": 1,
    "surfaceTotal": 0,
    "surfaceCovered": 0,
    "description": "📍 MONOAMBIENTE EN MORÓN – EXCELENTE UBICACIÓN\r\n\r\n• A 2 cuadras de la estación y a media cuadra de la Universidad de Morón.\r\n• Ubicado en 3° piso con ascensor.\r\n• Ambiente dividido con Barra, lo que genera un espacio más funcional.\r\n• Pequeño balcón al frente.\r\n\r\nIdeal para estudiantes o inversión ya que es apto profesional ! Consultanos para más información.",
    "features": [
      "1 Baño",
      "1 Ambiente",
      "Ubicado en 3° piso con ascensor",
      "Pequeño balcón al frente"
    ],
    "image": "https://static.kiteprop.com/kp/properties/503295/218a22/lg/218a2298c605c3b9883db84ec4c31fa9.jpg",
    "gallery": [
      "https://static.kiteprop.com/kp/properties/503295/218a22/lg/218a2298c605c3b9883db84ec4c31fa9.jpg",
      "https://static.kiteprop.com/kp/properties/503295/3095fd/lg/3095fd337d7ba625c97b04355632ed9d.jpg",
      "https://static.kiteprop.com/kp/properties/503295/de70fe/lg/de70fe6215131b7d2e83e44ca11c098f.jpg",
      "https://static.kiteprop.com/kp/properties/503295/9fd160/lg/9fd1603e9abe33592e8b8f5f93ac79bd.jpg",
      "https://static.kiteprop.com/kp/properties/503295/3e1a87/lg/3e1a8702912b962142655721061df77d.jpg",
      "https://static.kiteprop.com/kp/properties/503295/aa57c6/lg/aa57c66de2cce8a3ea26c1a752ee60ac.jpg",
      "https://static.kiteprop.com/kp/properties/503295/612ae2/lg/612ae23a4ce25db3efaa42e2c0bb563a.jpg"
    ],
    "originalUrl": "https://devorafernandezpropiedades.kitepropcrm.com/site/properties/503295/monoambiente-moron-centro-a-pocas-cuadras-de-la-estacion"
  },
  {
    "id": 19,
    "code": "KP498737",
    "title": "Gran Local Comerc, Morón/Castelar | Av. JM Rosas (ex. Vergara)",
    "location": "Castelar",
    "address": "Bragado y Hidalgo, Morón",
    "operation": "Alquiler",
    "propertyType": "Local Comercial",
    "priceUsd": 1923,
    "priceDisplay": "ARS 2.500.000",
    "featured": false,
    "bedrooms": 0,
    "bathrooms": 1,
    "environments": 0,
    "surfaceTotal": 170,
    "surfaceCovered": 170,
    "description": "📍 IMPORTANTE LOCAL COMERCIAL EN MORON CASTELAR ZONA COMERCIAL  A 3 CUADRAS DEL PLAZA OESTE\r\n• Ubicación estratégica y comercial\r\n• Cuenta con un salón amplio\r\n170 m2\r\nBaño\r\nTrifacica\r\n3 divisiones en el local.  (2 depositos)\r\n\r\nIdeal para múltiples rubros. Su consulta no molesta.\r\n\r\nServicios: Electricidad",
    "features": [
      "1 Baño",
      "170 m² Superficie",
      "Ubicación estratégica y comercial",
      "Cuenta con un salón amplio",
      "170 m2",
      "Baño",
      "Trifacica",
      "3 divisiones en el local. (2 depositos)"
    ],
    "image": "https://static.kiteprop.com/kp/properties/498737/58962b/lg/58962b22ddaa997b0eed851b1d89dd83.jpg",
    "gallery": [
      "https://static.kiteprop.com/kp/properties/498737/58962b/lg/58962b22ddaa997b0eed851b1d89dd83.jpg",
      "https://static.kiteprop.com/kp/properties/498737/35c118/lg/35c11872a01250b335e1b4c05be36724.jpg",
      "https://static.kiteprop.com/kp/properties/498737/617b3e/lg/617b3e2351795a4e4496caac5b93cbfe.jpg",
      "https://static.kiteprop.com/kp/properties/498737/9ed3c8/lg/9ed3c895c937cd03f2d50b88b04d020d.jpg",
      "https://static.kiteprop.com/kp/properties/498737/fe4da7/lg/fe4da744631fc10cfaaa5bc87551cfd4.jpg",
      "https://static.kiteprop.com/kp/properties/498737/0c70b7/lg/0c70b7dcdbbb49174306c3cd8e4e6ccd.jpg",
      "https://static.kiteprop.com/kp/properties/498737/21671b/lg/21671bd4e25073445cea34f01aca0275.jpg",
      "https://static.kiteprop.com/kp/properties/498737/2ae5c6/lg/2ae5c6ad39076e8ce4b092ec95485967.jpg",
      "https://static.kiteprop.com/kp/properties/498737/132fed/lg/132fed80b59270ae911c6587a2158d14.jpg",
      "https://static.kiteprop.com/kp/properties/498737/3493f0/lg/3493f0f1719b2568e36092ee72d2930c.jpg",
      "https://static.kiteprop.com/kp/properties/498737/9f3e03/lg/9f3e03d20f47b777fdf98a2cf8b01e94.jpg",
      "https://static.kiteprop.com/kp/properties/498737/2f575e/lg/2f575eb6056d4a179b6d8f3f656cc169.jpg",
      "https://static.kiteprop.com/kp/properties/498737/a66f58/lg/a66f58224d56c092d2125b16145dda6e.jpg",
      "https://static.kiteprop.com/kp/properties/498737/655297/lg/655297e813ab9597bcea242136106ae1.jpg",
      "https://static.kiteprop.com/kp/properties/498737/54bf9e/lg/54bf9e9a6910299af9c77adcaf34881a.jpg",
      "https://static.kiteprop.com/kp/properties/498737/3ff8fb/lg/3ff8fb0ea9ab5718018af140d95c7578.jpg",
      "https://static.kiteprop.com/kp/properties/498737/27394e/lg/27394e0c3d5650c4b6ad9a6adf057f40.jpg",
      "https://static.kiteprop.com/kp/properties/498737/3334c3/lg/3334c3c1fc7e46dce973a8730c9b22f7.jpg",
      "https://static.kiteprop.com/kp/properties/498737/d91fe8/lg/d91fe8dbc79abc447e83771e8729a84f.jpg",
      "https://static.kiteprop.com/kp/properties/498737/5098d6/lg/5098d62a51b79ab71ce79f74683b3e97.jpg",
      "https://static.kiteprop.com/kp/properties/498737/4cbf9b/lg/4cbf9ba0bf210b0a4e674bbdd297ffc0.jpg",
      "https://static.kiteprop.com/kp/properties/498737/8b0507/lg/8b0507e4210d8a246420170a627cb043.jpg"
    ],
    "originalUrl": "https://devorafernandezpropiedades.kitepropcrm.com/site/properties/498737/gran-local-comerc-moroncastelar-av-jm-rosas-ex-vergara"
  },
  {
    "id": 20,
    "code": "KP494205",
    "title": "Oportunidad | Departamento 3 ambientes | Morón Centro a 2 cuadras de la estacíon",
    "location": "Morón",
    "address": "MACHADO 986, Morón",
    "operation": "Venta",
    "propertyType": "Departamento",
    "priceUsd": 47000,
    "priceDisplay": "USD 47.000",
    "featured": false,
    "bedrooms": 2,
    "bathrooms": 1,
    "environments": 3,
    "surfaceTotal": 0,
    "surfaceCovered": 0,
    "description": "🏢 VENTA | DEPARTAMENTO 3 AMBIENTES – MORÓN CENTRO\r\n\r\n📍 Excelente ubicación, a solo 2 cuadras de la estación de Morón.\r\n\r\n• Departamento de 3 ambientes en 1° piso por escalera.\r\n• Ubicado al contrafrente, brindando mayor tranquilidad.\r\n• 2 dormitorios con placard.\r\n• Balcón con vista al patio interno.\r\n• Living comedor amplio y luminoso.\r\n• Cocina independiente.\r\n• Servicios individuales de gas y electricidad.\r\n• Sin expensas (solo gastos compartidos del edificio).\r\n• Ideal para vivienda o uso profesional.\r\n• Apto para estudios jurídicos, contables y otras actividades profesionales.\r\n\r\n📞 Consultanos para más información o coordinar una visita.\r\n\r\nIMPORTANTE: La información y descripciones contenidas en la presente publicación tienen carácter meramente informativo y orientativo, no revisten naturaleza contractual.\r\n\r\nLas superficies y medidas indicadas son aproximadas. Las dimensiones definitivas surgirán del título de propiedad y de los planos correspondientes.\r\n\r\n\r\nLa inmobiliaria se reserva el derecho de modificar, actualizar o corregir en cualquier momento, y sin previo aviso, precios, medidas, características, especificaciones y/o disponibilidad de los inmuebles publicados.",
    "features": [
      "2 Dormitorios",
      "1 Baño",
      "3 Ambientes",
      "2 dormitorios con placard",
      "Balcón con vista al patio interno",
      "Living comedor amplio y luminoso",
      "Cocina independiente",
      "Ideal para vivienda o uso profesional"
    ],
    "image": "https://static.kiteprop.com/kp/properties/494205/cbfb55/lg/cbfb5560180bb8157862190077896810.jpg",
    "gallery": [
      "https://static.kiteprop.com/kp/properties/494205/cbfb55/lg/cbfb5560180bb8157862190077896810.jpg",
      "https://static.kiteprop.com/kp/properties/494205/874f21/lg/874f21aed28f2ea40c5472d3c1b6eed8.jpg",
      "https://static.kiteprop.com/kp/properties/494205/327864/lg/3278641381c318623f7f1f9c222d76f7.jpg",
      "https://static.kiteprop.com/kp/properties/494205/942a36/lg/942a3696337582fd70648a31921abdb1.jpg",
      "https://static.kiteprop.com/kp/properties/494205/99010a/lg/99010ac2ee51497f4686a19a92e066c8.jpg",
      "https://static.kiteprop.com/kp/properties/494205/0f6fa6/lg/0f6fa694a709a8e4cad6606925ec313a.jpg",
      "https://static.kiteprop.com/kp/properties/494205/d69820/lg/d698208004a754d7d572c89b918a9c30.jpg",
      "https://static.kiteprop.com/kp/properties/494205/070199/lg/070199ff85eea472b3144e88e1c0e739.jpg",
      "https://static.kiteprop.com/kp/properties/494205/9c32db/lg/9c32dba3cc1efaa53ac28d4ee1271d98.jpg",
      "https://static.kiteprop.com/kp/properties/494205/8b12e6/lg/8b12e6396970146902181fc958f3d87e.jpg",
      "https://static.kiteprop.com/kp/properties/494205/4e461c/lg/4e461c5cee80a9731c8660f595676a94.jpg",
      "https://static.kiteprop.com/kp/properties/494205/9f182c/lg/9f182cc8b58784560f26e2116aa6e0fa.jpg",
      "https://static.kiteprop.com/kp/properties/494205/617dba/lg/617dba560f6b726625933e0b0695e8fd.jpg",
      "https://static.kiteprop.com/kp/properties/494205/fd3e8a/lg/fd3e8a5fc1e042c6335fadd9aa1f7cc1.jpg",
      "https://static.kiteprop.com/kp/properties/494205/67bafa/lg/67bafa4973af18066881a1c6a35a6c1f.jpg"
    ],
    "originalUrl": "https://devorafernandezpropiedades.kitepropcrm.com/site/properties/494205/oportunidad-departamento-3-ambientes-moron-centro-a-2-cuadras-de-la-estacion"
  },
  {
    "id": 21,
    "code": "KP479916",
    "title": "Morón Norte LOCAL AMPLIO EN ESQUINA UBICADO EN AVENIDA COMERCIAL",
    "location": "Morón",
    "address": "CAÑADA DE RUIZ Y CARCAMO, Morón",
    "operation": "Alquiler",
    "propertyType": "Local Comercial",
    "priceUsd": 5000,
    "priceDisplay": "USD 5.000",
    "featured": false,
    "bedrooms": 0,
    "bathrooms": 2,
    "environments": 0,
    "surfaceTotal": 0,
    "surfaceCovered": 0,
    "description": "LOCAL EN ALQUILER – ESQUINA VIDRIADA CON ENTRE PISO\r\n\r\n🔹 Planta Baja: \r\n🔹 Entre piso funcional y 5 oficinas distribuidas en 2 pisos superiores\r\n🔹 3 baños\r\n🔹 Todo vidriado – Excelente visibilidad\r\n🔹 Patio/fondo\r\n🔹 Ideal consecionarias, oficinas, coworking \r\n🔹 Excelente luminosidad natural y cordon de la vereda está preparado para estacìonar autos.\r\n\r\n📌 ¡Oportunidad en esquina! Consultanos por más info.\r\n\r\nIMPORTANTE: La información y descripciones contenidas en la presente publicación tienen carácter meramente informativo y orientativo, no revisten naturaleza contractual.\r\n\r\nLas superficies y medidas indicadas son aproximadas. Las dimensiones definitivas surgirán del título de propiedad y de los planos correspondientes.\r\n\r\nLa inmobiliaria se reserva el derecho de modificar, actualizar o corregir en cualquier momento, y sin previo aviso, precios, medidas, características, especificaciones y/o disponibilidad de los inmuebles publicados.",
    "features": [
      "2 Baños",
      "🔹 3 baños",
      "🔹 Todo vidriado – Excelente visibilidad",
      "🔹 Patio/fondo"
    ],
    "image": "https://static.kiteprop.com/kp/properties/479916/87d090/lg/87d090d3cf2e5c9ab9249ca85723ec8e.jpg",
    "gallery": [
      "https://static.kiteprop.com/kp/properties/479916/87d090/lg/87d090d3cf2e5c9ab9249ca85723ec8e.jpg",
      "https://static.kiteprop.com/kp/properties/479916/28460b/lg/28460b7ecb33fc23db6ee90ae60cb79f.jpg",
      "https://static.kiteprop.com/kp/properties/479916/a6c502/lg/a6c502df03b84f39e86f24e28e35a95b.jpg",
      "https://static.kiteprop.com/kp/properties/479916/ec0234/lg/ec0234f64ff52d10f0d3396dfe2f1321.jpg",
      "https://static.kiteprop.com/kp/properties/479916/d72d3f/lg/d72d3f5a37ccacf87576299d74872f9d.jpg",
      "https://static.kiteprop.com/kp/properties/479916/8623ab/lg/8623abe5db99aebb5b65bee1f7480712.jpg",
      "https://static.kiteprop.com/kp/properties/479916/54861f/lg/54861f25639dc5dd8eed951760fa9e27.jpg",
      "https://static.kiteprop.com/kp/properties/479916/8c66b4/lg/8c66b4fbbc2469210a580017adca6279.jpg",
      "https://static.kiteprop.com/kp/properties/479916/df048e/lg/df048ecde3a29671c27c0ce17c731b67.jpg",
      "https://static.kiteprop.com/kp/properties/479916/07ce48/lg/07ce48de196857255cc02e9a25b777fe.jpg",
      "https://static.kiteprop.com/kp/properties/479916/6ce205/lg/6ce2053468b12ffb5e15042b6b1ab7c2.jpg",
      "https://static.kiteprop.com/kp/properties/479916/c2c3f8/lg/c2c3f8c5eb8600fb7810891299e9701f.jpg",
      "https://static.kiteprop.com/kp/properties/479916/73e64e/lg/73e64e6ad810b41bcf1893abded8a2a1.jpg",
      "https://static.kiteprop.com/kp/properties/479916/e87a98/lg/e87a987c5b50a581b8a7c06ac99c18fc.jpg",
      "https://static.kiteprop.com/kp/properties/479916/502d6d/lg/502d6d0c6c179ffbc607c5121ae566af.jpg",
      "https://static.kiteprop.com/kp/properties/479916/36ca7d/lg/36ca7daf979da545238f9a2615c5f51c.jpg",
      "https://static.kiteprop.com/kp/properties/479916/802378/lg/802378b2c08a8d551cf031aefc892d8b.jpg",
      "https://static.kiteprop.com/kp/properties/479916/0ef20c/lg/0ef20cdd3a9072d3385b6ebfbec4fae1.jpg",
      "https://static.kiteprop.com/kp/properties/479916/73362d/lg/73362d4eb2df145260f8cdf104115480.jpg",
      "https://static.kiteprop.com/kp/properties/479916/ecf4af/lg/ecf4afe071b0eed4b84f1ae2565a4b13.jpg",
      "https://static.kiteprop.com/kp/properties/479916/4da978/lg/4da978bca4e334527547ed857ccd17eb.jpg",
      "https://static.kiteprop.com/kp/properties/479916/a2b551/lg/a2b551bd4ec12ffca8a5a455b2c143bd.jpg",
      "https://static.kiteprop.com/kp/properties/479916/a3e24d/lg/a3e24de4f8c24f982b436b3f4c3d24b8.jpg",
      "https://static.kiteprop.com/kp/properties/479916/f616cd/lg/f616cdfa141c85839c6216fe8af52dbb.jpg"
    ],
    "originalUrl": "https://devorafernandezpropiedades.kitepropcrm.com/site/properties/479916/moron-norte-local-amplio-en-esquina-ubicado-en-avenida-comercial"
  },
  {
    "id": 22,
    "code": "KP478719",
    "title": "Oportunidad | Departamentos 3 ambientes | Las toninas",
    "location": "Las Toninas",
    "address": "3 y 46, Las Toninas",
    "operation": "Venta",
    "propertyType": "Departamento",
    "priceUsd": 30000,
    "priceDisplay": "USD 30.000",
    "featured": false,
    "bedrooms": 1,
    "bathrooms": 1,
    "environments": 2,
    "surfaceTotal": 0,
    "surfaceCovered": 0,
    "description": "📍 Las toninas \r\n\r\n\r\nDepartamento en planta baja muy cómodo y funcional.\r\n\r\nIdeal para descanso o inversión turística.\r\n\r\nBajas expensas.\r\n\r\nParrilla y Pätio privado\r\n\r\nExcelente entorno y ubicación tranquila.\r\n\r\nConsultanos para más información.\r\n\r\nIMPORTANTE: La información y descripciones contenidas en la presente publicación tienen carácter meramente informativo y orientativo, no revisten naturaleza contractual.\r\n\r\nLas superficies y medidas indicadas son aproximadas. Las dimensiones definitivas surgirán del título de propiedad y de los planos correspondientes.\r\n\r\nLa inmobiliaria se reserva el derecho de modificar, actualizar o corregir en cualquier momento, y sin previo aviso, precios, medidas, características, especificaciones y/o disponibilidad de los inmuebles publicados.",
    "features": [
      "1 Dormitorio",
      "1 Baño",
      "2 Ambientes",
      "Las toninas",
      "Bajas expensas",
      "Parrilla y Pätio privado",
      "Excelente entorno y ubicación tranquila",
      "Consultanos para más información"
    ],
    "image": "https://static.kiteprop.com/kp/properties/478719/24ce09/lg/24ce09ce1b596f283ff39c561e131140.jpg",
    "gallery": [
      "https://static.kiteprop.com/kp/properties/478719/24ce09/lg/24ce09ce1b596f283ff39c561e131140.jpg",
      "https://static.kiteprop.com/kp/properties/478719/8a84d7/lg/8a84d7de03a5f3378412eccda18a5fc8.jpg",
      "https://static.kiteprop.com/kp/properties/478719/7b923e/lg/7b923efe9144318ba414c5163eeed2e1.jpg",
      "https://static.kiteprop.com/kp/properties/478719/3b776d/lg/3b776de83c8f2364e3bd1056333477b7.jpg",
      "https://static.kiteprop.com/kp/properties/478719/10e040/lg/10e0403f4536c4e3d84122ffce4d19d1.jpg",
      "https://static.kiteprop.com/kp/properties/478719/f6039d/lg/f6039d12005d25407c1ce8a6875eff71.jpg",
      "https://static.kiteprop.com/kp/properties/478719/77eec4/lg/77eec4747a799f0d4b996582fcf7bb81.jpg"
    ],
    "originalUrl": "https://devorafernandezpropiedades.kitepropcrm.com/site/properties/478719/oportunidad-departamentos-3-ambientes-las-toninas"
  },
  {
    "id": 23,
    "code": "KP475025",
    "title": "Depto 2 amb. Amueblado | Morón Centro |",
    "location": "Morón",
    "address": "Boatti 195, Morón",
    "operation": "Alquiler",
    "propertyType": "Departamento",
    "priceUsd": 550,
    "priceDisplay": "USD 550",
    "featured": false,
    "bedrooms": 1,
    "bathrooms": 1,
    "environments": 2,
    "surfaceTotal": 0,
    "surfaceCovered": 0,
    "description": "🏢 Departamento 2 Ambientes en Alquiler – Morón\r\n\r\n📍 Sexto piso\r\n✨ Excelente estado🚶‍♂️ A pocas cuadras de la estación de Morón\r\n🛁 Baño completo\r\n* Balcon \r\nFrente\r\nTOTALMENTE EQUIPADO\r\n\r\nIdeal para quienes buscan comodidad, buena ubicación y un departamento listo para ingresar.\r\n\r\n📩 Consultá para coordinar visita\r\n\r\nIMPORTANTE: La información y descripciones contenidas en la presente publicación tienen carácter meramente informativo y orientativo, no revisten naturaleza contractual.\r\n\r\nLas superficies y medidas indicadas son aproximadas. Las dimensiones definitivas surgirán del título de propiedad y de los planos correspondientes.\r\n\r\nLa inmobiliaria se reserva el derecho de modificar, actualizar o corregir en cualquier momento, y sin previo aviso, precios, medidas, características, especificaciones y/o disponibilidad de los inmuebles publicados.",
    "features": [
      "1 Dormitorio",
      "1 Baño",
      "2 Ambientes",
      "Sexto piso",
      "🛁 Baño completo",
      "Balcon",
      "Frente",
      "📩 Consultá para coordinar visita"
    ],
    "image": "https://static.kiteprop.com/kp/properties/475025/605ca3/lg/605ca3a931ebf2c90d0765094130dffc.jpg",
    "gallery": [
      "https://static.kiteprop.com/kp/properties/475025/605ca3/lg/605ca3a931ebf2c90d0765094130dffc.jpg",
      "https://static.kiteprop.com/kp/properties/475025/7e3731/lg/7e3731a1be850d14eb369215a7bc625b.jpg",
      "https://static.kiteprop.com/kp/properties/475025/de1d52/lg/de1d521493c554a762ab681cd26c9f53.jpg",
      "https://static.kiteprop.com/kp/properties/475025/4ca07e/lg/4ca07e303c7dbfdb8caa07575ec130cd.jpg",
      "https://static.kiteprop.com/kp/properties/475025/4d3af0/lg/4d3af0cf815013df558d3b10d29f48c4.jpg",
      "https://static.kiteprop.com/kp/properties/475025/7482e3/lg/7482e31e7f06ff277808045ca99ab899.jpg",
      "https://static.kiteprop.com/kp/properties/475025/7cfde2/lg/7cfde27bf225d7567629f48b127700b7.jpg",
      "https://static.kiteprop.com/kp/properties/475025/cec14f/lg/cec14f8ee8ab69ff49e1a55264bbbe50.jpg",
      "https://static.kiteprop.com/kp/properties/475025/546cc6/lg/546cc661e36172a5b5aa3db1f8e53fd7.jpg",
      "https://static.kiteprop.com/kp/properties/475025/7ad6df/lg/7ad6df2e30dd1878a3dfbec989de175a.jpg",
      "https://static.kiteprop.com/kp/properties/475025/6b7dc7/lg/6b7dc7e4a475b9a7154ba0ea9fc8de45.jpg",
      "https://static.kiteprop.com/kp/properties/475025/5c80a7/lg/5c80a7cf60a02d25b3ff9dd8ee9b3d64.jpg"
    ],
    "originalUrl": "https://devorafernandezpropiedades.kitepropcrm.com/site/properties/475025/depto-2-amb-amueblado-moron-centro"
  },
  {
    "id": 24,
    "code": "KP470097",
    "title": "Depto 2 ambientes | Morón Centro | Edificio con Amenities (Pileta)",
    "location": "Morón",
    "address": "Brown 269, Morón",
    "operation": "Venta",
    "propertyType": "Departamento",
    "priceUsd": 65000,
    "priceDisplay": "USD 65.000",
    "featured": false,
    "bedrooms": 1,
    "bathrooms": 1,
    "environments": 2,
    "surfaceTotal": 0,
    "surfaceCovered": 0,
    "description": "🏢 Departamento 2 Ambientes en Alquiler – Morón\r\n\r\n📍 Segundo piso\r\n✨ Excelente estado🚶‍♂️ A pocas cuadras de la estación de Morón\r\n🛁 Baño completo\r\n* Balcon \r\nFrente\r\nExpensas 95 mil\r\n\r\nIdeal para quienes buscan comodidad, buena ubicación y un departamento listo para ingresar.\r\n\r\n📩 Consultá para coordinar visita",
    "features": [
      "1 Dormitorio",
      "1 Baño",
      "2 Ambientes",
      "Segundo piso",
      "🛁 Baño completo",
      "Balcon",
      "Frente",
      "Expensas 95 mil"
    ],
    "image": "https://static.kiteprop.com/kp/properties/470097/1283a6/lg/1283a60e9650976ad8652e81494e9026.jpg",
    "gallery": [
      "https://static.kiteprop.com/kp/properties/470097/1283a6/lg/1283a60e9650976ad8652e81494e9026.jpg",
      "https://static.kiteprop.com/kp/properties/470097/e0fd7a/lg/e0fd7aaa4f9d9aa7518c3b7751e89809.jpg",
      "https://static.kiteprop.com/kp/properties/470097/a54cfd/lg/a54cfd5ff497bf8e1f2cbd6852090b8b.jpg",
      "https://static.kiteprop.com/kp/properties/470097/cdd8ff/lg/cdd8ff9d65a67c89852735c5d3c2c949.jpg",
      "https://static.kiteprop.com/kp/properties/470097/4bdba2/lg/4bdba28205bf141473d6d80adc349b72.jpg",
      "https://static.kiteprop.com/kp/properties/470097/891f76/lg/891f76a0e928281a7dddc082b1233b42.jpg",
      "https://static.kiteprop.com/kp/properties/470097/787ae2/lg/787ae2afed650f38a184c758f5052d46.jpg",
      "https://static.kiteprop.com/kp/properties/470097/c034d2/lg/c034d22550a55cabb380c525eeea5361.jpg",
      "https://static.kiteprop.com/kp/properties/470097/8c7946/lg/8c7946fe813ec4b07a32ba8cd06cc649.jpg",
      "https://static.kiteprop.com/kp/properties/470097/e71e50/lg/e71e502cefbe68d1c96851b9d08b99d5.jpg",
      "https://static.kiteprop.com/kp/properties/470097/e7df8b/lg/e7df8bb3af7fce803c9820ba46a04f1f.jpg",
      "https://static.kiteprop.com/kp/properties/470097/b7710b/lg/b7710b82d91b70a91f981b081e85ac83.jpg",
      "https://static.kiteprop.com/kp/properties/470097/cc95b7/lg/cc95b7413ee2b7beba18dc4fab2b7a07.jpg",
      "https://static.kiteprop.com/kp/properties/470097/c6d88e/lg/c6d88ee9b443b19ee38fcc299a125749.jpg",
      "https://static.kiteprop.com/kp/properties/470097/7d59bf/lg/7d59bff78626a3c01fcd165fd89ed547.jpg",
      "https://static.kiteprop.com/kp/properties/470097/747250/lg/747250ecc25969f23fd77be4fbdb2800.jpg",
      "https://static.kiteprop.com/kp/properties/470097/eec7c3/lg/eec7c37873f4cc0f01f8ff4e26ee8c48.jpg",
      "https://static.kiteprop.com/kp/properties/470097/726d32/lg/726d320a7129b2e6fa75f8565ef9e4ba.jpg",
      "https://static.kiteprop.com/kp/properties/470097/d8bf50/lg/d8bf50e9a6c47fc3e2a077c6a4dc39e6.jpg",
      "https://static.kiteprop.com/kp/properties/470097/cfe450/lg/cfe450432f76f605d23c3273928a2482.jpg",
      "https://static.kiteprop.com/kp/properties/470097/b50f6f/lg/b50f6f228d793f2bb07301955ff4db63.jpg",
      "https://static.kiteprop.com/kp/properties/470097/f0b736/lg/f0b736a9baf4c6b4c4ad599cd5b6cf46.jpg",
      "https://static.kiteprop.com/kp/properties/470097/381417/lg/3814175d7ea8bb3135892b7a092e25f0.jpg",
      "https://static.kiteprop.com/kp/properties/470097/f8e676/lg/f8e6765752988bb633d8b8c89e38774a.jpg",
      "https://static.kiteprop.com/kp/properties/470097/af82c9/lg/af82c9d56a6f3898f73d29cfcb6c102d.jpg",
      "https://static.kiteprop.com/kp/properties/470097/4af967/lg/4af96788d90a9befcb678846ac153b16.jpg",
      "https://static.kiteprop.com/kp/properties/470097/dce273/lg/dce2734b9bf6150a22b5145a6279652e.jpg",
      "https://static.kiteprop.com/kp/properties/470097/9777c9/lg/9777c9700a358c5e3165db0767fe5061.jpg",
      "https://static.kiteprop.com/kp/properties/470097/6bf8ba/lg/6bf8baea5aa26e19ba6d261624dafb93.jpg",
      "https://static.kiteprop.com/kp/properties/470097/5021af/lg/5021af634cf55219a8a911e5727c5c86.jpg",
      "https://static.kiteprop.com/kp/properties/470097/ea5bbc/lg/ea5bbcc60749e5163c56093345d99877.jpg",
      "https://static.kiteprop.com/kp/properties/470097/26e5b2/lg/26e5b2a40d60c942471a45724a0de586.jpg",
      "https://static.kiteprop.com/kp/properties/470097/d45c75/lg/d45c75e7e477a21387ed8cf023d21435.jpg",
      "https://static.kiteprop.com/kp/properties/470097/976713/lg/976713ba4697a47f69b671bc26644f6e.jpg"
    ],
    "originalUrl": "https://devorafernandezpropiedades.kitepropcrm.com/site/properties/470097/depto-2-ambientes-moron-centro-edificio-con-amenities-pileta"
  },
  {
    "id": 25,
    "code": "KP463998",
    "title": "Duplex 3 ambientes | Morón Norte | a 5 cuadras de la Estacion de Moron",
    "location": "Morón",
    "address": "Munilla 1022, Morón",
    "operation": "Alquiler",
    "propertyType": "Casa",
    "priceUsd": 653,
    "priceDisplay": "ARS 850.000",
    "featured": false,
    "bedrooms": 2,
    "bathrooms": 2,
    "environments": 3,
    "surfaceTotal": 0,
    "surfaceCovered": 0,
    "description": "📍 Morón Norte – Zona Universidad | Dúplex 3 Ambientes con Patio y Entrada de Auto\r\n\r\nDúplex muy luminoso, funcional y bien distribuido, ideal para vivienda familiar.\r\n\r\nEntrada de auto.\r\n\r\nPequeño patio.\r\n\r\nCocina comedor.\r\n\r\n2 baños (uno en planta baja y otro en planta alta).\r\n\r\n2 dormitorios con placard en planta alta.\r\n\r\n\r\nMuy luminoso y en excelente zona.\r\n\r\nLista para ingresar! Pintada y Reciclada\r\n\r\nConsultanos para más información o visita.\r\n\r\nSERVICIOS LUZ- GAS NATURAL\r\n\r\nIMPORTANTE: La información y descripciones contenidas en la presente publicación tienen carácter meramente informativo y orientativo, no revisten naturaleza contractual.\r\n\r\nLas superficies y medidas indicadas son aproximadas. Las dimensiones definitivas surgirán del título de propiedad y de los planos correspondientes.\r\n\r\nLa inmobiliaria se reserva el derecho de modificar, actualizar o corregir en cualquier momento, y sin previo aviso, precios, medidas, características, especificaciones y/o disponibilidad de los inmuebles publicados.",
    "features": [
      "2 Dormitorios",
      "2 Baños",
      "3 Ambientes",
      "Cochera para 1 auto",
      "Entrada de auto",
      "Pequeño patio",
      "Cocina comedor",
      "Muy luminoso y en excelente zona"
    ],
    "image": "https://static.kiteprop.com/kp/properties/463998/d23a08/lg/d23a0850ab8088958186256e832bf463.jpg",
    "gallery": [
      "https://static.kiteprop.com/kp/properties/463998/d23a08/lg/d23a0850ab8088958186256e832bf463.jpg",
      "https://static.kiteprop.com/kp/properties/463998/931403/lg/931403752f2542b4f55dcbdeaa036ac0.jpg",
      "https://static.kiteprop.com/kp/properties/463998/1d08ff/lg/1d08ffdedd187cc8e31cf237b2c69d10.jpg",
      "https://static.kiteprop.com/kp/properties/463998/ad49cd/lg/ad49cd50c84fe75671624fcfecc3a97d.jpg",
      "https://static.kiteprop.com/kp/properties/463998/0680e6/lg/0680e6d79e9c38f944886b6361010d88.jpg",
      "https://static.kiteprop.com/kp/properties/463998/6e5c84/lg/6e5c84a30e26d835e45184b86867ff8b.jpg",
      "https://static.kiteprop.com/kp/properties/463998/dca772/lg/dca7727429f83b045adc21a4ec167a5e.jpg",
      "https://static.kiteprop.com/kp/properties/463998/68fd1b/lg/68fd1baa10b5c7c4e4a7116047130959.jpg",
      "https://static.kiteprop.com/kp/properties/463998/0f52b2/lg/0f52b2b8040d65143ad4c26b864751d0.jpg",
      "https://static.kiteprop.com/kp/properties/463998/06b67c/lg/06b67cbff57d0204fac517f6a431eb89.jpg",
      "https://static.kiteprop.com/kp/properties/463998/58886b/lg/58886b9ddc9631e8eadfa840bd8528aa.jpg",
      "https://static.kiteprop.com/kp/properties/463998/c8469c/lg/c8469cb2d673487f8a17c090b58641ab.jpg",
      "https://static.kiteprop.com/kp/properties/463998/e4954b/lg/e4954b1d882f936083e9f58bd6210846.jpg",
      "https://static.kiteprop.com/kp/properties/463998/0a6f93/lg/0a6f93b3b58239c2c09d036b00e35750.jpg",
      "https://static.kiteprop.com/kp/properties/463998/aea45d/lg/aea45d462e664ab466a8495c97bbd100.jpg",
      "https://static.kiteprop.com/kp/properties/463998/b86a02/lg/b86a02aa6df4dad23a1196dbffec2c3b.jpg",
      "https://static.kiteprop.com/kp/properties/463998/fb46de/lg/fb46dea971b9ea3ed0041b9411b84034.jpg"
    ],
    "originalUrl": "https://devorafernandezpropiedades.kitepropcrm.com/site/properties/463998/duplex-3-ambientes-moron-norte-a-5-cuadras-de-la-estacion-de-moron"
  },
  {
    "id": 26,
    "code": "KP455646",
    "title": "PH estilo casa | Castelar Sur | A pocas cuadras de la estacíon",
    "location": "Castelar",
    "address": "Zuviria y Bvld Juan Manuel Rosas, Morón",
    "operation": "Venta",
    "propertyType": "PH",
    "priceUsd": 90000,
    "priceDisplay": "USD 90.000",
    "featured": false,
    "bedrooms": 3,
    "bathrooms": 2,
    "environments": 4,
    "surfaceTotal": 200,
    "surfaceCovered": 200,
    "description": "🏡 Casa a Reciclar en Lote Propio – Morón Norte, a metros de la estacíon de Castelar\r\n\r\nExcelente oportunidad en una de las zonas más buscadas de Castelar Sur-Zona residencial\r\n\r\nLa propiedad es unidad funcional A RECICLAR que cuenta con:\r\n\r\n🏠 3 ambientes amplios con placard y uno con amplio vestidor\r\n\r\n🪜 Terraza amplia.\r\n\r\n🌿 Patio pequeño y quincho\r\n\r\n🚗 Posibilidad de hacer una Entrada de Auto para 2 \r\n\r\nLiving y Cocina Separada\r\n\r\n📐 Superficie total: 150 m²\r\n\r\nUbicada a pasos de la estacíon de Castelar, con fácil acceso a arterias principales y gran potencial de crecimiento.\r\n\r\n📍 Excelente ubicación Castelar Sur\r\n📩 ¡Consultanos para más información!",
    "features": [
      "3 Dormitorios",
      "2 Baños",
      "4 Ambientes",
      "200 m² Superficie",
      "Cochera para 1 auto",
      "🪜 Terraza amplia",
      "🌿 Patio pequeño y quincho",
      "Living y Cocina Separada"
    ],
    "image": "https://static.kiteprop.com/kp/properties/455646/78c66a/lg/78c66a2a5d5b6e107e4f56ea5dfefc16.jpg",
    "gallery": [
      "https://static.kiteprop.com/kp/properties/455646/78c66a/lg/78c66a2a5d5b6e107e4f56ea5dfefc16.jpg",
      "https://static.kiteprop.com/kp/properties/455646/71752b/lg/71752b96d6b57ed27320df33d66dbdef.jpg",
      "https://static.kiteprop.com/kp/properties/455646/5bec86/lg/5bec863f62603b31fd75c6e66f1f5126.jpg",
      "https://static.kiteprop.com/kp/properties/455646/b1a097/lg/b1a097991cc02f0d8a5fcc85f3e11aba.jpg",
      "https://static.kiteprop.com/kp/properties/455646/602848/lg/6028489da17d3e00f4712f6dd6a2cef7.jpg",
      "https://static.kiteprop.com/kp/properties/455646/7c8e54/lg/7c8e545e7c71bf1b17135b42aaea46f7.jpg",
      "https://static.kiteprop.com/kp/properties/455646/d20567/lg/d20567df62a6669c7e2cb654caaec9a1.jpg",
      "https://static.kiteprop.com/kp/properties/455646/fb9073/lg/fb9073aa511133dd1fb16918c1aba618.jpg",
      "https://static.kiteprop.com/kp/properties/455646/1a5790/lg/1a5790073ff0000441cef97082fb10e5.jpg",
      "https://static.kiteprop.com/kp/properties/455646/395a46/lg/395a46edbb87c2ae77c2846c7a956467.jpg",
      "https://static.kiteprop.com/kp/properties/455646/df284a/lg/df284a7eefeac7ceeda4b6cab5c9845f.jpg",
      "https://static.kiteprop.com/kp/properties/455646/fa346a/lg/fa346a93a1abc932dcf1cd3bfc82f04f.jpg",
      "https://static.kiteprop.com/kp/properties/455646/754a56/lg/754a560df8b4ef819354a0420d44905e.jpg",
      "https://static.kiteprop.com/kp/properties/455646/470bee/lg/470beedcfc738d46683288d776b1683e.jpg",
      "https://static.kiteprop.com/kp/properties/455646/690fcb/lg/690fcb6f93fb41062c2fcd7b47f282ea.jpg"
    ],
    "originalUrl": "https://devorafernandezpropiedades.kitepropcrm.com/site/properties/455646/ph-estilo-casa-castelar-sur-a-pocas-cuadras-de-la-estacion"
  },
  {
    "id": 27,
    "code": "KP445156",
    "title": "Departamento 2 ambientes |  A estrenar con Cochera | Morón Centro",
    "location": "Morón",
    "address": "RIO PIEDRAS 372, Morón",
    "operation": "Venta",
    "propertyType": "Departamento",
    "priceUsd": 65000,
    "priceDisplay": "USD 65.000",
    "featured": false,
    "bedrooms": 1,
    "bathrooms": 1,
    "environments": 2,
    "surfaceTotal": 0,
    "surfaceCovered": 0,
    "description": "🏢 DEPARTAMENTO A ESTRENAR – 2 AMBIENTES – MORÓN CENTRO\r\n\r\n✨ Características:\r\n\r\n📍 Excelente ubicación en el centro de Morón.\r\n\r\n🚗 Cochera descubierta incluida.\r\n\r\n💡 Totalmente eléctrico (sin gas).\r\n\r\n🏙️ 4° piso con ascensor.\r\n\r\n🛏️ Habitación con placard empotrado.\r\n\r\n🚿 Baño completo.\r\n\r\n🏢 Edificio moderno con cámaras de seguridad.\r\n\r\n💰 Expensas aproximadas: $100.000.\r\n\r\n🆕 Departamento de categoría, a estrenar.\r\n\r\n📞 Consultanos para coordinar tu visita.",
    "features": [
      "1 Dormitorio",
      "1 Baño",
      "2 Ambientes",
      "Cochera para 1 auto",
      "Cochera descubierta incluida",
      "💡 Totalmente eléctrico (sin gas)",
      "🏙️ 4° piso con ascensor",
      "🛏️ Habitación con placard empotrado"
    ],
    "image": "https://static.kiteprop.com/kp/properties/445156/f92440/lg/f92440e290f0d82cbf13a7eafc8ab7a6.jpg",
    "gallery": [
      "https://static.kiteprop.com/kp/properties/445156/f92440/lg/f92440e290f0d82cbf13a7eafc8ab7a6.jpg",
      "https://static.kiteprop.com/kp/properties/445156/a86da8/lg/a86da8f2f1a0e08298160e017608a895.jpg",
      "https://static.kiteprop.com/kp/properties/445156/27984c/lg/27984c88d408c37e8f997f08fdbc8039.jpg",
      "https://static.kiteprop.com/kp/properties/445156/886b76/lg/886b76759889605217bf7f45d3fb2f82.jpg",
      "https://static.kiteprop.com/kp/properties/445156/e5778c/lg/e5778cd28bf54e089d388b00006712eb.jpg",
      "https://static.kiteprop.com/kp/properties/445156/dbdc20/lg/dbdc20fc0b934bb068df3c204657e45d.jpg",
      "https://static.kiteprop.com/kp/properties/445156/2e6fc9/lg/2e6fc910d9ba673d76010db700f795bd.jpg",
      "https://static.kiteprop.com/kp/properties/445156/d58543/lg/d5854397d3c4c0b8ef17fe9fe5f7115e.jpg",
      "https://static.kiteprop.com/kp/properties/445156/da723f/lg/da723f17396b6a29d2f4613fdebee97c.jpg",
      "https://static.kiteprop.com/kp/properties/445156/793caf/lg/793caf7837f3ae866d10bd9f7d98258a.jpg",
      "https://static.kiteprop.com/kp/properties/445156/159862/lg/159862557002da1870b9da26936b55e8.jpg",
      "https://static.kiteprop.com/kp/properties/445156/ff0234/lg/ff023437b72c95c3e64814989249b8fd.jpg",
      "https://static.kiteprop.com/kp/properties/445156/d80a14/lg/d80a1452516b2e707ecdd8201695e489.jpg",
      "https://static.kiteprop.com/kp/properties/445156/e3eaec/lg/e3eaecf62be823e7b1967f0e979363be.jpg",
      "https://static.kiteprop.com/kp/properties/445156/b57bff/lg/b57bff06fb8ac3cb071c7cf0e6b869ae.jpg",
      "https://static.kiteprop.com/kp/properties/445156/b4860d/lg/b4860d93d84a337017718574b4feabb0.jpg"
    ],
    "originalUrl": "https://devorafernandezpropiedades.kitepropcrm.com/site/properties/445156/departamento-2-ambientes-a-estrenar-con-cochera-moron-centro"
  },
  {
    "id": 28,
    "code": "KP442315",
    "title": "OPORTUNIDAD  | Cocheras descubiertas | Zona Morón Centro | A 4 cuadras de la estacíon",
    "location": "Morón",
    "address": "Cabildo y alem, Morón",
    "operation": "Venta",
    "propertyType": "Cochera",
    "priceUsd": 8000,
    "priceDisplay": "USD 8.000",
    "featured": false,
    "bedrooms": 0,
    "bathrooms": 0,
    "environments": 0,
    "surfaceTotal": 0,
    "surfaceCovered": 0,
    "description": "🚗 Cocheras descubiertas en Venta – Morón\r\n\r\n✨ Características:\r\n\r\n📍 Ubicación: a 4 cuadras de la estación y 1 de la UM\r\n\r\n🔒 Portón automático\r\n\r\n🚘 Cochera cubierta\r\n\r\n💲 Bajas expensas\r\n\r\n📏 Espacio amplio y cómodo, apto para camionetas Pick Up\r\n\r\n✅ Oportunidad de inversión en zona estratégica.\r\n\r\n🚗 Cochera con ingreso general: acceso compartido por portón automatico principal, práctico y seguro.\r\n\r\nVENTA LIBRE DE GASTOS\r\nAcepta financíacion.",
    "features": [
      "Cochera",
      "Cocheras descubiertas en Venta – Morón",
      "Portón automático",
      "Cochera cubierta",
      "💲 Bajas expensas",
      "Acepta financíacion"
    ],
    "image": "https://static.kiteprop.com/kp/properties/442315/f1fb07/lg/f1fb07c196c04a194ea154e86cf9d058.jpg",
    "gallery": [
      "https://static.kiteprop.com/kp/properties/442315/f1fb07/lg/f1fb07c196c04a194ea154e86cf9d058.jpg",
      "https://static.kiteprop.com/kp/properties/442315/9c5181/lg/9c518164937a220267363beb954b6a27.jpg",
      "https://static.kiteprop.com/kp/properties/442315/060f65/lg/060f6598d4cbe5b854c9c424cc19c3f6.jpg",
      "https://static.kiteprop.com/kp/properties/442315/c790c0/lg/c790c053401a5340f15653f0e4115b02.jpg",
      "https://static.kiteprop.com/kp/properties/442315/364ce5/lg/364ce523d023a56ff1890f4f3f9ae86e.jpg",
      "https://static.kiteprop.com/kp/properties/442315/a652c7/lg/a652c70d15cec1a70c29db01a5910253.jpg",
      "https://static.kiteprop.com/kp/properties/442315/118a8c/lg/118a8c77cc9ed97259103a92881fae95.jpg"
    ],
    "originalUrl": "https://devorafernandezpropiedades.kitepropcrm.com/site/properties/442315/oportunidad-cocheras-descubiertas-zona-moron-centro-a-4-cuadras-de-la-estacion"
  },
  {
    "id": 29,
    "code": "KP442314",
    "title": "Cocheras Cubiertas | Zona Morón Centro | A 4 cuadras de la estacíon",
    "location": "Morón",
    "address": "Cabildo y alem, Morón",
    "operation": "Venta",
    "propertyType": "Cochera",
    "priceUsd": 10000,
    "priceDisplay": "USD 10.000",
    "featured": false,
    "bedrooms": 0,
    "bathrooms": 0,
    "environments": 0,
    "surfaceTotal": 0,
    "surfaceCovered": 0,
    "description": "🚗 Cocheras Cubiertas en Venta – Morón\r\n\r\n✨ Características:\r\n\r\n📍 Ubicación: a 4 cuadras de la estación y 1 de la UM\r\n\r\n🔒 Portón automático\r\n\r\n🚘 Cochera cubierta\r\n\r\n💲 Bajas expensas\r\n\r\n📏 Espacio amplio y cómodo, apto para camionetas Pick Up\r\n\r\n✅ Oportunidad de inversión en zona estratégica.\r\n\r\nDos opcíones:\r\n\r\n🚗 Cochera con ingreso privado: acceso exclusivo e independiente.\r\n\r\n🚗 Cochera con ingreso general: acceso compartido por portón principal, práctico y seguro.\r\n\r\nVENTA LIBRE DE GASTOS",
    "features": [
      "Cochera",
      "Cocheras Cubiertas en Venta – Morón",
      "Portón automático",
      "Cochera cubierta",
      "💲 Bajas expensas",
      "Dos opcíones"
    ],
    "image": "https://static.kiteprop.com/kp/properties/442314/04b880/lg/04b880d14a404c84ac9af8f8d0d7ec95.jpg",
    "gallery": [
      "https://static.kiteprop.com/kp/properties/442314/04b880/lg/04b880d14a404c84ac9af8f8d0d7ec95.jpg",
      "https://static.kiteprop.com/kp/properties/442314/73e659/lg/73e6592b8fbbef28f9c070fcfb497c7e.jpg",
      "https://static.kiteprop.com/kp/properties/442314/a89b1f/lg/a89b1f18d9b19ce1747965dac7bee108.jpg",
      "https://static.kiteprop.com/kp/properties/442314/71aa15/lg/71aa15eea3e9471cf203fa2adac061e7.jpg",
      "https://static.kiteprop.com/kp/properties/442314/f93908/lg/f9390837a6f2cf369324e696d29c34b2.jpg",
      "https://static.kiteprop.com/kp/properties/442314/f41fe9/lg/f41fe9a5fa6a2aefd7355cf3586122eb.jpg",
      "https://static.kiteprop.com/kp/properties/442314/1f0b64/lg/1f0b6448b6684f6964ee91a668b628bd.jpg",
      "https://static.kiteprop.com/kp/properties/442314/5b6097/lg/5b609704a40b16f03ef3ac40c00e1fde.jpg",
      "https://static.kiteprop.com/kp/properties/442314/3c4f44/lg/3c4f440f4b907715623967b0f535abf7.jpg"
    ],
    "originalUrl": "https://devorafernandezpropiedades.kitepropcrm.com/site/properties/442314/cocheras-cubiertas-zona-moron-centro-a-4-cuadras-de-la-estacion"
  },
  {
    "id": 30,
    "code": "KP437467",
    "title": "Departamento  2 amb. PB.  | con Cochera y PATIO  | Morón Centro",
    "location": "Morón",
    "address": "9 DE JULIO 1069, Morón",
    "operation": "Alquiler",
    "propertyType": "Departamento",
    "priceUsd": 461,
    "priceDisplay": "ARS 600.000",
    "featured": false,
    "bedrooms": 1,
    "bathrooms": 1,
    "environments": 2,
    "surfaceTotal": 0,
    "surfaceCovered": 0,
    "description": "🔑 Departamento 2 ambientes – en Planta Baja\r\n\r\nDepartamento 2 ambientes ubicado en Planta baja, con placard, cocina integrada, baño completo, Cochera individual y PATIO\r\nIdeal para vivir \r\n💰 Expensas bajas\r\n📩 ¡Consultá sin compromiso! Gracias.\r\n\r\nIMPORTANTE: La información y descripciones contenidas en la presente publicación tienen carácter meramente informativo y orientativo, no revisten naturaleza contractual.\r\n\r\nLas superficies y medidas indicadas son aproximadas. Las dimensiones definitivas surgirán del título de propiedad y de los planos correspondientes.\r\n\r\nLa inmobiliaria se reserva el derecho de modificar, actualizar o corregir en cualquier momento, y sin previo aviso, precios, medidas, características, especificaciones y/o disponibilidad de los inmuebles publicados.",
    "features": [
      "1 Dormitorio",
      "1 Baño",
      "2 Ambientes",
      "Cochera para 1 auto",
      "Ideal para vivir",
      "💰 Expensas bajas",
      "📩 ¡Consultá sin compromiso! Gracias"
    ],
    "image": "https://static.kiteprop.com/kp/properties/437467/58a495/lg/58a4950803e03fedd1043fe83c1ae4a7.jpg",
    "gallery": [
      "https://static.kiteprop.com/kp/properties/437467/58a495/lg/58a4950803e03fedd1043fe83c1ae4a7.jpg",
      "https://static.kiteprop.com/kp/properties/437467/75a528/lg/75a528772413dd07a4c5d31c2cde853d.jpg",
      "https://static.kiteprop.com/kp/properties/437467/d25e35/lg/d25e35dcb8d57bac95d30b69b9626d6c.jpg",
      "https://static.kiteprop.com/kp/properties/437467/91ef85/lg/91ef8584c9f79acecc92716cc8d9cbd9.jpg",
      "https://static.kiteprop.com/kp/properties/437467/4c9c69/lg/4c9c6910742255cf3c88902ece32eb86.jpg",
      "https://static.kiteprop.com/kp/properties/437467/bfa1b6/lg/bfa1b6148d32f0bc9f26113ba7d8bcbf.jpg",
      "https://static.kiteprop.com/kp/properties/437467/5aae96/lg/5aae96f3292857db0c8609b64c29935d.jpg",
      "https://static.kiteprop.com/kp/properties/437467/62e6cb/lg/62e6cbbe590fca14f7557b6cdb723b00.jpg"
    ],
    "originalUrl": "https://devorafernandezpropiedades.kitepropcrm.com/site/properties/437467/departamento-2-amb-pb-con-cochera-y-patio-moron-centro"
  },
  {
    "id": 31,
    "code": "KP431793",
    "title": "Departamento 2 ambientes  | Morón Centro |  A 2 cuadras de la UM",
    "location": "Morón",
    "address": "LEANDRO M ALEM 1047, Morón",
    "operation": "Venta",
    "propertyType": "Departamento",
    "priceUsd": 46000,
    "priceDisplay": "USD 46.000",
    "featured": false,
    "bedrooms": 1,
    "bathrooms": 1,
    "environments": 2,
    "surfaceTotal": 40,
    "surfaceCovered": 40,
    "description": "📍 Morón Departamento  2 ambientes en Venta \r\n✨ Características:\r\n\r\nBaño completo\r\n\r\nCocina comedor \r\nMuy luminoso\r\n\r\nBajas expensas\r\n\r\nBalcon Cubierto\r\n\r\n🚉 Excelente ubicación: a 4 cuadras de la estación y 2 de la UM.\r\n\r\n📞 Consultá sin compromiso.",
    "features": [
      "1 Dormitorio",
      "1 Baño",
      "2 Ambientes",
      "40 m² Superficie",
      "Morón Departamento 2 ambientes en Venta",
      "Baño completo",
      "Cocina comedor",
      "Muy luminoso"
    ],
    "image": "https://static.kiteprop.com/kp/properties/431793/69ebf0/lg/69ebf06093b8b3d1c8a21515c0f58f49.jpg",
    "gallery": [
      "https://static.kiteprop.com/kp/properties/431793/69ebf0/lg/69ebf06093b8b3d1c8a21515c0f58f49.jpg",
      "https://static.kiteprop.com/kp/properties/431793/88f112/lg/88f112ff2d69b2d0afef3f28bc49ab46.jpg",
      "https://static.kiteprop.com/kp/properties/431793/2a3221/lg/2a322184de2d6d5a98e176e194d2987e.jpg",
      "https://static.kiteprop.com/kp/properties/431793/954785/lg/95478517098a750d6a0732595ab708b7.jpg",
      "https://static.kiteprop.com/kp/properties/431793/e847fa/lg/e847faa1ef73fda3b1635ff80f6d84c2.jpg",
      "https://static.kiteprop.com/kp/properties/431793/9a8780/lg/9a87809ceaaae58bbc3bf5ce731ed576.jpg",
      "https://static.kiteprop.com/kp/properties/431793/5c14b2/lg/5c14b2be0d8e9c9ae3178fb35c80899f.jpg",
      "https://static.kiteprop.com/kp/properties/431793/b878b4/lg/b878b410e525e59dda5b4851acbe5849.jpg",
      "https://static.kiteprop.com/kp/properties/431793/102371/lg/102371503c335291c4bc0aae8b2ab316.jpg",
      "https://static.kiteprop.com/kp/properties/431793/acae32/lg/acae325711a1ccb296c084bb56536d74.jpg",
      "https://static.kiteprop.com/kp/properties/431793/461ae5/lg/461ae5ad8352b4cf35446b7d349dfe59.jpg",
      "https://static.kiteprop.com/kp/properties/431793/11291f/lg/11291fa1385e754a1e4aabf0b564a078.jpg"
    ],
    "originalUrl": "https://devorafernandezpropiedades.kitepropcrm.com/site/properties/431793/departamento-2-ambientes-moron-centro-a-2-cuadras-de-la-um"
  },
  {
    "id": 32,
    "code": "KP423655",
    "title": "Departamento con cohera En Venta.| Morón | Excelente valor y estado",
    "location": "Morón",
    "address": "Grito de Alcorta 1870, Morón",
    "operation": "Venta",
    "propertyType": "Departamento",
    "priceUsd": 40000,
    "priceDisplay": "USD 40.000",
    "featured": false,
    "bedrooms": 1,
    "bathrooms": 1,
    "environments": 2,
    "surfaceTotal": 0,
    "surfaceCovered": 0,
    "description": "📍 DEPARTAMENTO EN  VENTA 2 AMBIENTES**\r\n📍 Cochera Lado Sur*\r\n\r\n\r\n🅿️ **Con cochera incluida**\r\n💡 **Expensas:** \\$80.000  aprox.\r\n\r\n🔹 2 ambientes cómodos\r\n🔹 Muy luminoso\r\n🔹 Excelente ubicación\r\n\r\nConsultanos para más info o coordinar una visita.",
    "features": [
      "1 Dormitorio",
      "1 Baño",
      "2 Ambientes",
      "Cochera para 1 auto",
      "Cochera Lado Sur*",
      "🅿️ **Con cochera incluida**",
      "💡 **Expensas:** \\$80.000 aprox",
      "🔹 2 ambientes cómodos"
    ],
    "image": "https://static.kiteprop.com/kp/properties/423655/8dd40c/lg/8dd40c2de74bc1e6cbead33fe47a8fe6.jpg",
    "gallery": [
      "https://static.kiteprop.com/kp/properties/423655/8dd40c/lg/8dd40c2de74bc1e6cbead33fe47a8fe6.jpg",
      "https://static.kiteprop.com/kp/properties/423655/b8054c/lg/b8054c78ee8df94bb192a8994f0c0694.jpg",
      "https://static.kiteprop.com/kp/properties/423655/177d7a/lg/177d7a88e86f7f725707722043fb4c03.jpg",
      "https://static.kiteprop.com/kp/properties/423655/a6cea7/lg/a6cea77fd13f5c8f7bb9975f4cf675e3.jpg",
      "https://static.kiteprop.com/kp/properties/423655/79d0b8/lg/79d0b8d37133f561e46d5682a0e53a69.jpg",
      "https://static.kiteprop.com/kp/properties/423655/1820e0/lg/1820e0cb371a7310086da63e98b2297e.jpg",
      "https://static.kiteprop.com/kp/properties/423655/5dc428/lg/5dc428feebe9c56399cb6ac327158b51.jpg",
      "https://static.kiteprop.com/kp/properties/423655/b8a08d/lg/b8a08d3311f4c75664f17b1aaf8b5943.jpg"
    ],
    "originalUrl": "https://devorafernandezpropiedades.kitepropcrm.com/site/properties/423655/departamento-con-cohera-en-venta-moron-excelente-valor-y-estado"
  },
  {
    "id": 33,
    "code": "KP421590",
    "title": "Departamento 2 ambientes | Morón Centro | Planta baja con Cochera y patio",
    "location": "Morón",
    "address": "ENTRE RIOS 1035, Morón",
    "operation": "Alquiler",
    "propertyType": "Departamento",
    "priceUsd": 461,
    "priceDisplay": "ARS 600.000",
    "featured": false,
    "bedrooms": 1,
    "bathrooms": 1,
    "environments": 2,
    "surfaceTotal": 40,
    "surfaceCovered": 40,
    "description": "📍 MORÓN – DEPARTAMENTO 2 AMBIENTES LUMINOSO\r\n📍 ALQUILER EN MORÓN – DEPARTAMENTO PLANTA BAJA CON PATIO\r\n\r\n\r\n• Dormitorio amplio, baño completo, y cocina-comedor integrada.\r\n• Patio, que ofrece un espacio extra para disfrutar.\r\n• Bajas expensas.\r\n• Se aceptan mascotas, brindando mayor comodidad para quienes las tienen.\r\n- Depto electrico con posibilidad de Gas natural, solo con previo aviso\r\n\r\n📞 ¡Consultanos para más información o para coordinar una visita!",
    "features": [
      "1 Dormitorio",
      "1 Baño",
      "2 Ambientes",
      "40 m² Superficie",
      "Cochera",
      "Bajas expensas"
    ],
    "image": "https://static.kiteprop.com/kp/properties/421590/ac2436/lg/ac2436420dd0d8941a1081115a339ad0.jpg",
    "gallery": [
      "https://static.kiteprop.com/kp/properties/421590/ac2436/lg/ac2436420dd0d8941a1081115a339ad0.jpg",
      "https://static.kiteprop.com/kp/properties/421590/b73011/lg/b730114b8cef386a16d42e2907eb3351.jpg",
      "https://static.kiteprop.com/kp/properties/421590/83aca7/lg/83aca7f6b834c36e67dbca69b5f122b5.jpg",
      "https://static.kiteprop.com/kp/properties/421590/faa3e3/lg/faa3e3a3adfb46b545333d3ba5f0c672.jpg",
      "https://static.kiteprop.com/kp/properties/421590/682acd/lg/682acddafe0436a83729137cf5e71199.jpg",
      "https://static.kiteprop.com/kp/properties/421590/fd824b/lg/fd824b8cefaf5fc7fe0d16e96f7f421a.jpg",
      "https://static.kiteprop.com/kp/properties/421590/0dc405/lg/0dc40583e87ccbfc6a23bb513c6ab7fd.jpg",
      "https://static.kiteprop.com/kp/properties/421590/6bfc39/lg/6bfc39d0f8c9aced25bf48308c88c620.jpg",
      "https://static.kiteprop.com/kp/properties/421590/14ecbd/lg/14ecbddcd3f1efc1c0b89d854b9f1808.jpg",
      "https://static.kiteprop.com/kp/properties/421590/704ddb/lg/704ddb0d674efe5c2210ed77f029cad3.jpg",
      "https://static.kiteprop.com/kp/properties/421590/476b5d/lg/476b5da842af553254e67feedb2fec02.jpg"
    ],
    "originalUrl": "https://devorafernandezpropiedades.kitepropcrm.com/site/properties/421590/departamento-2-ambientes-moron-centro-planta-baja-con-cochera-y-patio"
  },
  {
    "id": 34,
    "code": "KP407779",
    "title": "OPORTUNIDAD Local Comercial | Castelar Norte | a Metros del Plaza Oeste Shopping",
    "location": "Castelar",
    "address": "Lobos 2490, Castelar",
    "operation": "Venta",
    "propertyType": "Local Comercial",
    "priceUsd": 45000,
    "priceDisplay": "USD 45.000",
    "featured": false,
    "bedrooms": 0,
    "bathrooms": 1,
    "environments": 0,
    "surfaceTotal": 50,
    "surfaceCovered": 50,
    "description": "📍 LOCAL COMERCIAL EN CASTELAR – A 1 CUADRA DEL PLAZA OESTE --VENTA--\r\n\r\n• Ubicación estratégica y comercial, a 1 cuadra del Shopping Plaza Oeste y de la autopista.\r\n• Unidad Funcional, Superficie de 50 m².\r\n• Cuenta con un salón amplio y baño.\r\n• Apto para oficina, parrilla, fábrica de muebles de oficina, entre otros usos.\r\n• DOCUMENTACION, EN REGLA. AL DIA (Los gastos de escrituracion son a cargo del comprador)\r\n\r\nIdeal para múltiples rubros. Su consulta no molesta.\r\n\r\nVENTA LIBRE DE GASTOS\r\n\r\nIMPORTANTE: La información y descripciones contenidas en la presente publicación tienen carácter meramente informativo y orientativo, no revisten naturaleza contractual.\r\n\r\nLas superficies y medidas indicadas son aproximadas. Las dimensiones definitivas surgirán del título de propiedad y de los planos correspondientes.\r\n\r\nLa inmobiliaria se reserva el derecho de modificar, actualizar o corregir en cualquier momento, y sin previo aviso, precios, medidas, características, especificaciones y/o disponibilidad de los inmuebles publicados.",
    "features": [
      "1 Baño",
      "50 m² Superficie",
      "Cuenta con un salón amplio y baño"
    ],
    "image": "https://static.kiteprop.com/kp/properties/407779/6e3842/lg/6e3842126aca395a3e82d6c2c861275d.jpg",
    "gallery": [
      "https://static.kiteprop.com/kp/properties/407779/6e3842/lg/6e3842126aca395a3e82d6c2c861275d.jpg",
      "https://static.kiteprop.com/kp/properties/407779/aed7fe/lg/aed7fe8c10a5ae325f54d81f6fda4d8c.jpg",
      "https://static.kiteprop.com/kp/properties/407779/cb0bf0/lg/cb0bf0978a1f597faea57af7ddc9c9db.jpg",
      "https://static.kiteprop.com/kp/properties/407779/2c7185/lg/2c7185c12839dbad03e0790233568476.jpg",
      "https://static.kiteprop.com/kp/properties/407779/206013/lg/206013e2638a5ae6842fdd653e96a5b3.jpg",
      "https://static.kiteprop.com/kp/properties/407779/a4361e/lg/a4361eb2a793bd205a1857a4fd5dd2cf.jpg",
      "https://static.kiteprop.com/kp/properties/407779/99fc5d/lg/99fc5ddb6c6d31431c539a87fdd901e3.jpg",
      "https://static.kiteprop.com/kp/properties/407779/9e9827/lg/9e9827bd6d3589a7257ca96129e6f4d0.jpg"
    ],
    "originalUrl": "https://devorafernandezpropiedades.kitepropcrm.com/site/properties/407779/oportunidad-local-comercial-castelar-norte-a-metros-del-plaza-oeste-shopping"
  },
  {
    "id": 35,
    "code": "KP407579",
    "title": "Cocheras amplias | Zona Santa Rita | Descubiertas",
    "location": "Capital Federal",
    "address": "camarones 3250, Capital Federal",
    "operation": "Alquiler",
    "propertyType": "Cochera",
    "priceUsd": 73,
    "priceDisplay": "ARS 95.000",
    "featured": false,
    "bedrooms": 0,
    "bathrooms": 1,
    "environments": 0,
    "surfaceTotal": 0,
    "surfaceCovered": 0,
    "description": "📍 ZONA SANTA RITA – CABA – COCHERAS A LA VENTA y en ALQUILER\r\n\r\n\r\n• Cocheras descubiertas en planta baja también disponibles.\r\n• Lugar muy cómodo y seguro.\r\n\r\nEl precio es por cada unidad.\r\n\r\nConsultanos para más información o para coordinar una visita.",
    "features": [
      "1 Baño",
      "Cochera",
      "Lugar muy cómodo y seguro",
      "El precio es por cada unidad"
    ],
    "image": "https://static.kiteprop.com/kp/properties/407579/c6c550/lg/c6c55009acb3b3c232e058c4bee54426.jpg",
    "gallery": [
      "https://static.kiteprop.com/kp/properties/407579/c6c550/lg/c6c55009acb3b3c232e058c4bee54426.jpg",
      "https://static.kiteprop.com/kp/properties/407579/8a8e22/lg/8a8e2203b9c055da8551f895ff1e5023.jpg",
      "https://static.kiteprop.com/kp/properties/407579/e9eecc/lg/e9eecca739fc1b2405b5a28fecd6ec6c.jpg",
      "https://static.kiteprop.com/kp/properties/407579/01915a/lg/01915a36f091f14d5228f551d09c411a.jpg",
      "https://static.kiteprop.com/kp/properties/407579/40c083/lg/40c083dedad87dc46977d777714b0b01.jpg",
      "https://static.kiteprop.com/kp/properties/407579/335072/lg/335072efb4971afe77e77f32704328d9.jpg",
      "https://static.kiteprop.com/kp/properties/407579/0b735d/lg/0b735da57aa62f030b96f95e4cf6ddf0.jpg",
      "https://static.kiteprop.com/kp/properties/407579/302aab/lg/302aabd645e411ac9b333d4f31122042.jpg"
    ],
    "originalUrl": "https://devorafernandezpropiedades.kitepropcrm.com/site/properties/407579/cocheras-amplias-zona-santa-rita-descubiertas"
  },
  {
    "id": 36,
    "code": "KP406184",
    "title": "Local Comercial | Morón Centro | a Pocas cuadras de la estacíon",
    "location": "Morón",
    "address": "Cabildo 285, Morón",
    "operation": "Venta",
    "propertyType": "Local Comercial",
    "priceUsd": 35000,
    "priceDisplay": "USD 35.000",
    "featured": false,
    "bedrooms": 0,
    "bathrooms": 1,
    "environments": 0,
    "surfaceTotal": 30,
    "surfaceCovered": 30,
    "description": "📍 Local Comercial en Morón – A 3 cuadras de la estación\r\n\r\nOportunidad en excelente ubicación, ideal para múltiples rubros.\r\n\r\nLocal con baño propio.\r\n\r\nPosibilidad de uso del espacio exterior del edificio (zona común).\r\n\r\nBuena visibilidad y circulación.\r\n\r\nUbicación estratégica, a pocas cuadras de la estación.\r\n\r\nConsultanos para más información.",
    "features": [
      "1 Baño",
      "30 m² Superficie",
      "Local con baño propio",
      "Buena visibilidad y circulación",
      "Consultanos para más información"
    ],
    "image": "https://static.kiteprop.com/kp/properties/406184/744a25/lg/744a25b762b527f97eea72d62e275d42.jpg",
    "gallery": [
      "https://static.kiteprop.com/kp/properties/406184/744a25/lg/744a25b762b527f97eea72d62e275d42.jpg",
      "https://static.kiteprop.com/kp/properties/406184/40f82e/lg/40f82e089ad00c084ed09e2770ad32dc.jpg",
      "https://static.kiteprop.com/kp/properties/406184/e4ba07/lg/e4ba078fa14a291e523f42ae7586d6c6.jpg",
      "https://static.kiteprop.com/kp/properties/406184/f74d38/lg/f74d383f010750addce31f0cd2e42aa9.jpg",
      "https://static.kiteprop.com/kp/properties/406184/dd027b/lg/dd027bee553b4fe2f8855f0cd9bd2fcf.jpg",
      "https://static.kiteprop.com/kp/properties/406184/85477f/lg/85477f3dae0f2766d97910193b871e28.jpg",
      "https://static.kiteprop.com/kp/properties/406184/f3315f/lg/f3315fef2ca1255acb3aab0af45c45c6.jpg"
    ],
    "originalUrl": "https://devorafernandezpropiedades.kitepropcrm.com/site/properties/406184/local-comercial-moron-centro-a-pocas-cuadras-de-la-estacion"
  },
  {
    "id": 37,
    "code": "KP405197",
    "title": "PH 3 ambientes | Morón Norte | Excelente Ubicacíon",
    "location": "Morón",
    "address": "cacique CALFUCURA 949, Morón",
    "operation": "Venta",
    "propertyType": "PH",
    "priceUsd": 67000,
    "priceDisplay": "USD 67.000",
    "featured": false,
    "bedrooms": 2,
    "bathrooms": 1,
    "environments": 3,
    "surfaceTotal": 80,
    "surfaceCovered": 80,
    "description": "📍 Morón | PH 3 Ambientes al Frente –| Alquiler Sin Expensas\r\n\r\nUbicado cerca de la estación, ideal para quienes buscan comodidad y buena ubicación.\r\n\r\n2 dormitorios amplios.\r\n\r\nBaño completo.\r\n\r\nCocina comedor.\r\n\r\nTodo eléctrico.\r\n\r\nPatio con parrilla.\r\n\r\nOpcion de alquiler : Entrada de auto compartida.\r\n\r\nMuy cómodo y en excelente estado.\r\n\r\nSin expensas.\r\n\r\nConsultanos para coordinar una visita.",
    "features": [
      "2 Dormitorios",
      "1 Baño",
      "3 Ambientes",
      "80 m² Superficie",
      "Cochera para 1 auto",
      "2 dormitorios amplios",
      "Baño completo",
      "Cocina comedor"
    ],
    "image": "https://static.kiteprop.com/kp/properties/405197/7effb0/lg/7effb027668d88a8df7944730e03806f.jpg",
    "gallery": [
      "https://static.kiteprop.com/kp/properties/405197/7effb0/lg/7effb027668d88a8df7944730e03806f.jpg",
      "https://static.kiteprop.com/kp/properties/405197/1b4e86/lg/1b4e86e57f394718ea3daa397a7a0f83.jpg",
      "https://static.kiteprop.com/kp/properties/405197/174c5d/lg/174c5d5ed1bb6cea0bcfb4a3990dd597.jpg",
      "https://static.kiteprop.com/kp/properties/405197/270507/lg/2705070e4db7ef38075d06b69e9416de.jpg",
      "https://static.kiteprop.com/kp/properties/405197/e567e0/lg/e567e04b28bc576d32f6f6bc73638f32.jpg",
      "https://static.kiteprop.com/kp/properties/405197/7e9b6c/lg/7e9b6cd2fcebbe4d9a9ad5d99033714e.jpg",
      "https://static.kiteprop.com/kp/properties/405197/9c84d1/lg/9c84d1d62081fa52dea4af70f8309511.jpg",
      "https://static.kiteprop.com/kp/properties/405197/674098/lg/67409865d6ce167cef183825851af0d3.jpg",
      "https://static.kiteprop.com/kp/properties/405197/cdcdfd/lg/cdcdfd715a66b510d29dc74d61edad98.jpg",
      "https://static.kiteprop.com/kp/properties/405197/6cf98d/lg/6cf98d3f2a985b29f2241099086df7f2.jpg",
      "https://static.kiteprop.com/kp/properties/405197/ce7d57/lg/ce7d57410ac56f37003668b84733cf54.jpg",
      "https://static.kiteprop.com/kp/properties/405197/ed6e85/lg/ed6e851688b0d333fad77d48510712a7.jpg",
      "https://static.kiteprop.com/kp/properties/405197/02ccb9/lg/02ccb9dd977f0747049406eb897b8de6.jpg",
      "https://static.kiteprop.com/kp/properties/405197/cbd82d/lg/cbd82df134a4442d2e7ff47f8658e812.jpg",
      "https://static.kiteprop.com/kp/properties/405197/4c6331/lg/4c633161a00664241eb901a3293e3226.jpg",
      "https://static.kiteprop.com/kp/properties/405197/694d73/lg/694d737d47b0d789a0121cc950b84a31.jpg",
      "https://static.kiteprop.com/kp/properties/405197/7b4387/lg/7b4387a3a3a0f52ea67e0616eac5e1d0.jpg",
      "https://static.kiteprop.com/kp/properties/405197/19ff4c/lg/19ff4c90def9a1f9eaf06e3a2f932de7.jpg",
      "https://static.kiteprop.com/kp/properties/405197/a9f7a3/lg/a9f7a38155eadd2851a2125ff71e275f.jpg",
      "https://static.kiteprop.com/kp/properties/405197/01eb19/lg/01eb19d81c6997d48f2b428e50752995.jpg",
      "https://static.kiteprop.com/kp/properties/405197/8bfbc2/lg/8bfbc2198d01eb7635c9ca5588fb5b4d.jpg",
      "https://static.kiteprop.com/kp/properties/405197/4a2b2d/lg/4a2b2d2a37975705ac28571268820001.jpg"
    ],
    "originalUrl": "https://devorafernandezpropiedades.kitepropcrm.com/site/properties/405197/ph-3-ambientes-moron-norte-excelente-ubicacion"
  },
  {
    "id": 38,
    "code": "KP405103",
    "title": "Duplex 3 ambientes | Morón | Como Nuevo",
    "location": "Morón",
    "address": "Larrea 815, Morón",
    "operation": "Venta",
    "propertyType": "Casa",
    "priceUsd": 80000,
    "priceDisplay": "USD 80.000",
    "featured": false,
    "bedrooms": 2,
    "bathrooms": 1,
    "environments": 3,
    "surfaceTotal": 100,
    "surfaceCovered": 100,
    "description": "📍 DÚPLEX REFACCIONADO A NUEVO – CÓMODO Y FUNCIONAL\r\n\r\n• Cocina-comedor renovada, con instalaciones modernas.\r\n• Cañerías y sistema eléctrico a nuevo, garantizando seguridad y eficiencia.\r\n• 2 dormitorios amplios y luminosos.\r\n• Baño completo en excelente estado.\r\n• Patio compartido | entrada de auto\r\n• Entrada de auto, brindando comodidad y seguridad.\r\n• Lavadero cubierto en la terraza, optimizando el espacio.\r\n\r\n📞 ¡Consultanos para más información o para coordinar una visita!\r\n\r\nIMPORTANTE: La información y descripciones contenidas en la presente publicación tienen carácter meramente informativo y orientativo, no revisten naturaleza contractual.\r\n\r\nLas superficies y medidas indicadas son aproximadas. Las dimensiones definitivas surgirán del título de propiedad y de los planos correspondientes.\r\n\r\nLa inmobiliaria se reserva el derecho de modificar, actualizar o corregir en cualquier momento, y sin previo aviso, precios, medidas, características, especificaciones y/o disponibilidad de los inmuebles publicados.",
    "features": [
      "2 Dormitorios",
      "1 Baño",
      "3 Ambientes",
      "100 m² Superficie",
      "Cochera para 1 auto",
      "2 dormitorios amplios y luminosos",
      "Baño completo en excelente estado",
      "Patio compartido | entrada de auto"
    ],
    "image": "https://static.kiteprop.com/kp/properties/405103/c77901/lg/c7790139e6f4d194c7dce4f7859e0ce1.jpg",
    "gallery": [
      "https://static.kiteprop.com/kp/properties/405103/c77901/lg/c7790139e6f4d194c7dce4f7859e0ce1.jpg",
      "https://static.kiteprop.com/kp/properties/405103/833ce9/lg/833ce989873ad57ca1f6a6480e37bd8e.jpg",
      "https://static.kiteprop.com/kp/properties/405103/f5a82f/lg/f5a82f03736f02517ecb2d39671d3e61.jpg",
      "https://static.kiteprop.com/kp/properties/405103/1318ab/lg/1318ab80e1337ad1eb8e0ce9ba803b33.jpg",
      "https://static.kiteprop.com/kp/properties/405103/28337c/lg/28337c4ec1af7192c8cfb30c67519bf8.jpg",
      "https://static.kiteprop.com/kp/properties/405103/bea72d/lg/bea72d54dd513dbd54e0aaec39f7cff3.jpg",
      "https://static.kiteprop.com/kp/properties/405103/d16526/lg/d16526223403fe83eb19bd8be31ffa85.jpg",
      "https://static.kiteprop.com/kp/properties/405103/813635/lg/813635b228e8638a502a51e590563263.jpg",
      "https://static.kiteprop.com/kp/properties/405103/114ac1/lg/114ac18815464df03988f7ce947a3571.jpg",
      "https://static.kiteprop.com/kp/properties/405103/48dc11/lg/48dc114105e82b024858bddaddba0743.jpg",
      "https://static.kiteprop.com/kp/properties/405103/f81e23/lg/f81e23bee7f4a3e54b1fd704c4493f50.jpg",
      "https://static.kiteprop.com/kp/properties/405103/f53751/lg/f53751e3dab7e01e3562dd36fb9a90af.jpg",
      "https://static.kiteprop.com/kp/properties/405103/20385c/lg/20385c36dd44c2a2d8b84439de518410.jpg",
      "https://static.kiteprop.com/kp/properties/405103/45ab1e/lg/45ab1e53ce1f41d451958aba9ca05943.jpg",
      "https://static.kiteprop.com/kp/properties/405103/dfc7ad/lg/dfc7ad5a0f21fab3a6eb8d23a179d33a.jpg",
      "https://static.kiteprop.com/kp/properties/405103/e55f69/lg/e55f69ef5753da69ca5b02ff2e082896.jpg",
      "https://static.kiteprop.com/kp/properties/405103/f5b5c5/lg/f5b5c534fe955ba4eacbf0615964afe8.jpg",
      "https://static.kiteprop.com/kp/properties/405103/2adb45/lg/2adb45d4399bedf5d219b977b931b596.jpg",
      "https://static.kiteprop.com/kp/properties/405103/d49995/lg/d49995768b0d589c8c2f543c0d007273.jpg",
      "https://static.kiteprop.com/kp/properties/405103/401148/lg/401148a070a0b2f81bdae2f10244ee9c.jpg",
      "https://static.kiteprop.com/kp/properties/405103/94e09e/lg/94e09e27ea329eb67dbcde13abb52941.jpg",
      "https://static.kiteprop.com/kp/properties/405103/ebfa54/lg/ebfa54519f96291bd4d39a1ba377e9d1.jpg"
    ],
    "originalUrl": "https://devorafernandezpropiedades.kitepropcrm.com/site/properties/405103/duplex-3-ambientes-moron-como-nuevo"
  },
  {
    "id": 39,
    "code": "KP403329",
    "title": "Departamento en Condominio | Morón Centro | a pocas cuadras de la plaza San Martin",
    "location": "Morón",
    "address": "Entre Ríos 747 Morón",
    "operation": "Venta",
    "propertyType": "Casa",
    "priceUsd": 68000,
    "priceDisplay": "USD 68.000",
    "featured": false,
    "bedrooms": 1,
    "bathrooms": 1,
    "environments": 2,
    "surfaceTotal": 45,
    "surfaceCovered": 35,
    "description": "📍 Morón | Departamento en Condominio con Entrada Independiente\r\n\r\nMuy buen estado general, en excelente ubicación.\r\n\r\nEntrada independiente con garage.\r\n\r\nAcceso también por el condominio.\r\n\r\nCocina separada.\r\n\r\nBaño completo.\r\n\r\nLiving comedor amplio y luminoso.\r\n\r\nConsultanos, tu consulta no molesta.",
    "features": [
      "1 Dormitorio",
      "1 Baño",
      "2 Ambientes",
      "45 m² Superficie",
      "Cochera para 1 auto",
      "Entrada independiente con garage",
      "Acceso también por el condominio",
      "Cocina separada"
    ],
    "image": "https://static.kiteprop.com/kp/properties/403329/b3f856/lg/b3f8568cf40d069e01aacea7e7cd3009.jpg",
    "gallery": [
      "https://static.kiteprop.com/kp/properties/403329/b3f856/lg/b3f8568cf40d069e01aacea7e7cd3009.jpg",
      "https://static.kiteprop.com/kp/properties/403329/f5f203/lg/f5f203ae3d6c07e011a29896cc6913c7.jpg",
      "https://static.kiteprop.com/kp/properties/403329/87de7e/lg/87de7ea1ba7d2c5770e436ca9d5e9de4.jpg",
      "https://static.kiteprop.com/kp/properties/403329/b850da/lg/b850dad0d9bc5b4f024d9cee8ee2c9da.jpg",
      "https://static.kiteprop.com/kp/properties/403329/f428a2/lg/f428a2f1fbbdaa54c43a56c235c1f324.jpg",
      "https://static.kiteprop.com/kp/properties/403329/e9c855/lg/e9c855bc02bb9e1eba14548ab05649fb.jpg",
      "https://static.kiteprop.com/kp/properties/403329/05fab7/lg/05fab748302cfee9c8f3b70fd0429f1e.jpg",
      "https://static.kiteprop.com/kp/properties/403329/9f8ba9/lg/9f8ba935c39114c420143cdabf8303f3.jpg",
      "https://static.kiteprop.com/kp/properties/403329/b922d8/lg/b922d87f9e82882307b545a82bae738f.jpg"
    ],
    "originalUrl": "https://devorafernandezpropiedades.kitepropcrm.com/site/properties/403329/departamento-en-condominio-moron-centro-a-pocas-cuadras-de-la-plaza-san-martin"
  },
  {
    "id": 40,
    "code": "KP397075",
    "title": "LOTE/GALPON | EXCELENTE ZONA INDUSTRIAL | IDEAL PARA CONSTRUCCION",
    "location": "Morón",
    "address": "Blvd. Juan Manuel de Rosas 256, Morón",
    "operation": "Venta",
    "propertyType": "Galpón",
    "priceUsd": 220000,
    "priceDisplay": "USD 220.000",
    "featured": false,
    "bedrooms": 0,
    "bathrooms": 0,
    "environments": 0,
    "surfaceTotal": 220,
    "surfaceCovered": 220,
    "description": "📍 LOTE/GALPÓN PARA RECICLAR O CONSTRUIR  ZONA INDUSTRIAL/COMERCIAL\r\n\r\n• Ubicación estratégica en  Juan Manuel de Rosas (Ex Avenida Vergara), zona de alto tránsito.\r\n• 230 m² aproximados.\r\n• Ideal para desarrollo industrial, comercial o logístico.\r\n• A 3 cuadras del Shopping Plaza Oeste.\r\n\r\nGran oportunidad en el Oeste! Consultanos para más información.",
    "features": [
      "220 m² Superficie",
      "230 m² aproximados",
      "A 3 cuadras del Shopping Plaza Oeste"
    ],
    "image": "https://static.kiteprop.com/kp/properties/397075/910822/lg/9108225d127aa7619c30eb80d4752811.jpg",
    "gallery": [
      "https://static.kiteprop.com/kp/properties/397075/910822/lg/9108225d127aa7619c30eb80d4752811.jpg",
      "https://static.kiteprop.com/kp/properties/397075/f58f0a/lg/f58f0a630aff1accbb139f70c7425ada.jpg",
      "https://static.kiteprop.com/kp/properties/397075/c8e8f1/lg/c8e8f157af03ed92da5529516bb3a4f5.jpg",
      "https://static.kiteprop.com/kp/properties/397075/45e3ee/lg/45e3eec5f0d70758926009834e1b62ba.jpg",
      "https://static.kiteprop.com/kp/properties/397075/c71e67/lg/c71e67a36752cbbc0a0359e602242ba2.jpg"
    ],
    "originalUrl": "https://devorafernandezpropiedades.kitepropcrm.com/site/properties/397075/lotegalpon-excelente-zona-industrial-ideal-para-construccion"
  },
  {
    "id": 41,
    "code": "KP375159",
    "title": "Departamentos 3 ambientes | Moron | Luminoso",
    "location": "Morón",
    "address": "boatti 122, Morón",
    "operation": "Venta",
    "propertyType": "Departamento",
    "priceUsd": 78000,
    "priceDisplay": "USD 78.000",
    "featured": false,
    "bedrooms": 2,
    "bathrooms": 1,
    "environments": 3,
    "surfaceTotal": 70,
    "surfaceCovered": 70,
    "description": "¡Oportunidad única en Morón!\r\n\r\nDepartamento hecho a nuevo, con detalles de categoría y estado impecable. Cuenta con:\r\n\r\n• Amplio living-comedor, ideal para disfrutar en familia.\r\n\r\n• Cocina separada, moderna y funcional.\r\n\r\n• Dos dormitorios con excelente iluminación.\r\n\r\n• Baño totalmente renovado, con terminaciones de primera calidad.\r\n\r\nUbicado en una zona estratégica de Morón, con acceso a comercios, transporte y todos los servicios.\r\n\r\n¡Consulte y coordine su visita hoy mismo!",
    "features": [
      "2 Dormitorios",
      "1 Baño",
      "3 Ambientes",
      "70 m² Superficie",
      "¡Oportunidad única en Morón!",
      "Cocina separada, moderna y funcional"
    ],
    "image": "https://static.kiteprop.com/kp/properties/375159/1fe01a/lg/1fe01a459cce24a13cafb69d131282b7.jpg",
    "gallery": [
      "https://static.kiteprop.com/kp/properties/375159/1fe01a/lg/1fe01a459cce24a13cafb69d131282b7.jpg",
      "https://static.kiteprop.com/kp/properties/375159/e3fed4/lg/e3fed4465a705392663a039668f71934.jpg",
      "https://static.kiteprop.com/kp/properties/375159/fc840c/lg/fc840ca8d64bf5943ad8cb295cd2755f.jpg",
      "https://static.kiteprop.com/kp/properties/375159/e89469/lg/e894695acc0d2a1cbedf9d208bc1f0d1.jpg",
      "https://static.kiteprop.com/kp/properties/375159/2f9caa/lg/2f9caa39e82194f342d603708a9e8d07.jpg",
      "https://static.kiteprop.com/kp/properties/375159/24bdbc/lg/24bdbc18b040a1df58619b10d8bd2a4f.jpg",
      "https://static.kiteprop.com/kp/properties/375159/0c6a54/lg/0c6a546755bf833e653f29832b1a495e.jpg",
      "https://static.kiteprop.com/kp/properties/375159/dd4eea/lg/dd4eea4ee7e2df55a674dc27a4416076.jpg",
      "https://static.kiteprop.com/kp/properties/375159/a86306/lg/a86306c07f5a6dc7b9c2dd8abd9aa7c2.jpg",
      "https://static.kiteprop.com/kp/properties/375159/d6e001/lg/d6e00185c80dfb80ccd8771b7d818db8.jpg",
      "https://static.kiteprop.com/kp/properties/375159/b95d75/lg/b95d75593f62241839118c37fb506c82.jpg",
      "https://static.kiteprop.com/kp/properties/375159/95c0d8/lg/95c0d89ecf9abdc8fe8b0f99c0e5b18c.jpg"
    ],
    "originalUrl": "https://devorafernandezpropiedades.kitepropcrm.com/site/properties/375159/departamentos-3-ambientes-moron-luminoso"
  },
  {
    "id": 42,
    "code": "KP366042",
    "title": "Ph 3 ambientes | Morón | Entrada de auto",
    "location": "Morón",
    "address": "CALFULCURA 949, Morón",
    "operation": "Venta",
    "propertyType": "PH",
    "priceUsd": 68000,
    "priceDisplay": "USD 68.000",
    "featured": false,
    "bedrooms": 2,
    "bathrooms": 1,
    "environments": 3,
    "surfaceTotal": 68,
    "surfaceCovered": 68,
    "description": "PH en Planta Baja en Morón – ¡Sin Expensas!\r\n\r\nExcelente oportunidad de inversión a solo 6 cuadras del centro de Morón y cerca de la facultad.\r\n\r\n• 2 dormitorios cómodos y luminosos.\r\n• Baño, cocina y comedor en buen estado.\r\n• Patio con parrilla, ideal para disfrutar al aire libre.\r\n• Todos los servicios independientes.\r\n• Sin expensas, mayor comodidad y ahorro.\r\n\r\nUbicación estratégica, con acceso a transporte, comercios y centros educativos. ¡Consulte y coordine su visita!",
    "features": [
      "2 Dormitorios",
      "1 Baño",
      "3 Ambientes",
      "68 m² Superficie",
      "Cochera para 1 auto",
      "2 dormitorios cómodos y luminosos",
      "Baño, cocina y comedor en buen estado",
      "Todos los servicios independientes"
    ],
    "image": "https://static.kiteprop.com/kp/properties/366042/ed5dcb/lg/ed5dcba1c3cb964f6834c62fffe754e7.jpg",
    "gallery": [
      "https://static.kiteprop.com/kp/properties/366042/ed5dcb/lg/ed5dcba1c3cb964f6834c62fffe754e7.jpg",
      "https://static.kiteprop.com/kp/properties/366042/f41f9c/lg/f41f9c15c0d39f48c141692baeb8f6e8.jpg",
      "https://static.kiteprop.com/kp/properties/366042/d95992/lg/d9599260ff3c3643f72dbb9b5d9d5b6c.jpg",
      "https://static.kiteprop.com/kp/properties/366042/be0fa0/lg/be0fa0c669c94444d6ee6d889315eeb9.jpg",
      "https://static.kiteprop.com/kp/properties/366042/bd147e/lg/bd147eb54144b2c13e231167b779d6fd.jpg",
      "https://static.kiteprop.com/kp/properties/366042/0f1f83/lg/0f1f83eaeb7f68baf250df69a165b683.jpg",
      "https://static.kiteprop.com/kp/properties/366042/199656/lg/1996561a03d2191f90409c4b014184fa.jpg",
      "https://static.kiteprop.com/kp/properties/366042/c5eaf5/lg/c5eaf586747557c44cc058166356e337.jpg",
      "https://static.kiteprop.com/kp/properties/366042/21d84b/lg/21d84b7b6fe53117d5849d868d6538e4.jpg",
      "https://static.kiteprop.com/kp/properties/366042/94c836/lg/94c83685a683bdffd36ee6748d7021d4.jpg"
    ],
    "originalUrl": "https://devorafernandezpropiedades.kitepropcrm.com/site/properties/366042/ph-3-ambientes-moron-entrada-de-auto"
  },
  {
    "id": 43,
    "code": "KP361847",
    "title": "Departamenro 3 Amb | MORON | A 1 cuadra de la estacíon",
    "location": "Morón",
    "address": "SARMIENTO 917, Morón",
    "operation": "Venta",
    "propertyType": "Departamento",
    "priceUsd": 78000,
    "priceDisplay": "USD 78.000",
    "featured": false,
    "bedrooms": 2,
    "bathrooms": 1,
    "environments": 3,
    "surfaceTotal": 78,
    "surfaceCovered": 78,
    "description": "Departamento en Morón – A 1 cuadra de la estación\r\n\r\nUbicado sobre calle Sarmiento, en una zona estratégica con excelente conectividad.\r\n\r\n• 2 dormitorios amplios y luminosos.\r\n• Baño, cocina-comedor y living-comedor.\r\n• Balcón y pisos de madera, detalles de calidad.\r\n• Excelente estado de conservación.\r\n• Ideal para profesionales: contadores, abogados u oficina comercial.\r\n\r\n¡Una oportunidad única en el centro de Morón! Consulte para más información.",
    "features": [
      "2 Dormitorios",
      "1 Baño",
      "3 Ambientes",
      "78 m² Superficie",
      "2 dormitorios amplios y luminosos",
      "Baño, cocina-comedor y living-comedor",
      "Excelente estado de conservación"
    ],
    "image": "https://static.kiteprop.com/kp/properties/361847/ccb124/lg/ccb1246bf0f9929b77b2ff358a8245ea.jpg",
    "gallery": [
      "https://static.kiteprop.com/kp/properties/361847/ccb124/lg/ccb1246bf0f9929b77b2ff358a8245ea.jpg",
      "https://static.kiteprop.com/kp/properties/361847/46ef33/lg/46ef3366c80e6c3ee333dfbaabfecf8c.jpg",
      "https://static.kiteprop.com/kp/properties/361847/808938/lg/808938c4b7875e77c384285e8359c21a.jpg",
      "https://static.kiteprop.com/kp/properties/361847/576854/lg/5768546721c4bf77aed13ef920877df9.jpg",
      "https://static.kiteprop.com/kp/properties/361847/0f0279/lg/0f0279bcf846e259f845ab28296614f9.jpg",
      "https://static.kiteprop.com/kp/properties/361847/7ab1db/lg/7ab1db4fb282b2f5b09170214071759b.jpg",
      "https://static.kiteprop.com/kp/properties/361847/d48fc9/lg/d48fc91718c18d467302edb180e6ec96.jpg",
      "https://static.kiteprop.com/kp/properties/361847/15e765/lg/15e76577d71126310e379a0d4cb8757c.jpg",
      "https://static.kiteprop.com/kp/properties/361847/ba37cc/lg/ba37cc0706b8e7c856894eeffc5b8ab9.jpg",
      "https://static.kiteprop.com/kp/properties/361847/065da7/lg/065da7e6e34ec7250f2095f3e06baae4.jpg",
      "https://static.kiteprop.com/kp/properties/361847/096831/lg/09683136905ae4729539b35174467d7a.jpg",
      "https://static.kiteprop.com/kp/properties/361847/f414e2/lg/f414e22b943e91478da8d930b3259a87.jpg"
    ],
    "originalUrl": "https://devorafernandezpropiedades.kitepropcrm.com/site/properties/361847/departamenro-3-amb-moron-a-1-cuadra-de-la-estacion"
  },
  {
    "id": 44,
    "code": "KP354726",
    "title": "Monoambiente | Morón Centro | Muy Luminoso",
    "location": "Morón",
    "address": "SALTA 319, Morón",
    "operation": "Alquiler",
    "propertyType": "Departamento",
    "priceUsd": 269,
    "priceDisplay": "ARS 350.000",
    "featured": false,
    "bedrooms": 0,
    "bathrooms": 1,
    "environments": 1,
    "surfaceTotal": 0,
    "surfaceCovered": 0,
    "description": "📍 DEPARTAMENTO MONOAMBIENTE EN ALQUILER – MORÓN CENTRO\r\n\r\nExcelente oportunidad en una ubicación estratégica, a pocos minutos de la estación y del centro comercial.\r\n\r\n• Monoambiente amplio y funcional.\r\n• Muy luminoso.\r\n• Ubicado en 5° piso con ascensor.\r\n• Baño completo.\r\n• Totalmente eléctrico.\r\n• Puerta blindada para mayor seguridad.\r\n• Ideal para vivienda o uso profesional.\r\n\r\n📞 Consultanos para más información o coordinar una visita.\r\n\r\nIMPORTANTE: La información y descripciones contenidas en la presente publicación tienen carácter meramente informativo y orientativo, no revisten naturaleza contractual.\r\n\r\nLas superficies y medidas indicadas son aproximadas. Las dimensiones definitivas surgirán del título de propiedad y de los planos correspondientes.\r\n\r\nLa inmobiliaria se reserva el derecho de modificar, actualizar o corregir en cualquier momento, y sin previo aviso, precios, medidas, características, especificaciones y/o disponibilidad de los inmuebles publicados.",
    "features": [
      "1 Baño",
      "1 Ambiente",
      "Monoambiente amplio y funcional",
      "Muy luminoso",
      "Ubicado en 5° piso con ascensor",
      "Baño completo",
      "Totalmente eléctrico",
      "Puerta blindada para mayor seguridad"
    ],
    "image": "https://static.kiteprop.com/kp/properties/354726/3976fb/lg/3976fb06365f14422eefb6ce2b0432c0.jpg",
    "gallery": [
      "https://static.kiteprop.com/kp/properties/354726/3976fb/lg/3976fb06365f14422eefb6ce2b0432c0.jpg",
      "https://static.kiteprop.com/kp/properties/354726/dd1ffc/lg/dd1ffc008ec2f116a102c85b689dffe0.jpg",
      "https://static.kiteprop.com/kp/properties/354726/faa9df/lg/faa9df1066355df8627ca3871a54b8ab.jpg",
      "https://static.kiteprop.com/kp/properties/354726/6511a0/lg/6511a0907a71bdb437714f8adaf472eb.jpg",
      "https://static.kiteprop.com/kp/properties/354726/eda31e/lg/eda31e271358a80920b310588c5e2d31.jpg",
      "https://static.kiteprop.com/kp/properties/354726/d7ebe3/lg/d7ebe3f738f4d048f5c9665c33279ea7.jpg",
      "https://static.kiteprop.com/kp/properties/354726/09ad17/lg/09ad17dfbd65cc3af0d2a02d103c4e2a.jpg",
      "https://static.kiteprop.com/kp/properties/354726/e5974c/lg/e5974cc182af4cb55cce043b1cf994c9.jpg",
      "https://static.kiteprop.com/kp/properties/354726/887f30/lg/887f30d7eeb6ee14229fa3bb9d8fb3a6.jpg",
      "https://static.kiteprop.com/kp/properties/354726/c65a63/lg/c65a630c7d7f3443124bc6b2d3ac87ba.jpg",
      "https://static.kiteprop.com/kp/properties/354726/b2a919/lg/b2a9199fb4c124ffcfdce1f5d5e24243.jpg",
      "https://static.kiteprop.com/kp/properties/354726/f3519e/lg/f3519e29c66377d06e256116045983f1.jpg"
    ],
    "originalUrl": "https://devorafernandezpropiedades.kitepropcrm.com/site/properties/354726/monoambiente-moron-centro-muy-luminoso"
  },
  {
    "id": 45,
    "code": "KP353432",
    "title": "Casa 3 ambientes | Morón | A refaccionar",
    "location": "Morón",
    "address": "bartolome Mitre 278, Morón",
    "operation": "Venta",
    "propertyType": "Casa",
    "priceUsd": 100000,
    "priceDisplay": "USD 100.000",
    "featured": false,
    "bedrooms": 3,
    "bathrooms": 2,
    "environments": 4,
    "surfaceTotal": 204,
    "surfaceCovered": 204,
    "description": "📍 CASA EN VENTA – IDEAL INVERSIÓN O REFACCIÓN\r\n\r\n• Propiedad de 3 ambientes con excelente potencial.\r\n• 2 dormitorios amplios y luminosos.\r\n• Baño completo.\r\n• Living-comedor de buen tamaño.\r\n• Jardín y espacio libre, ideal para ampliaciones o esparcimiento.\r\n• Habitación de servicio para múltiples usos.\r\n• A refaccionar o con posibilidad de construcción de edificio.\r\n\r\n📞 ¡Consultanos para más información o para coordinar una visita!",
    "features": [
      "3 Dormitorios",
      "2 Baños",
      "4 Ambientes",
      "204 m² Superficie",
      "Cochera para 2 autos",
      "2 dormitorios amplios y luminosos",
      "Baño completo",
      "Living-comedor de buen tamaño"
    ],
    "image": "https://static.kiteprop.com/kp/properties/353432/01f8f7/lg/01f8f78f2b9878244fcebb8298741998.jpg",
    "gallery": [
      "https://static.kiteprop.com/kp/properties/353432/01f8f7/lg/01f8f78f2b9878244fcebb8298741998.jpg",
      "https://static.kiteprop.com/kp/properties/353432/df1900/lg/df19006d5bbba0acb2483338c8978622.jpg",
      "https://static.kiteprop.com/kp/properties/353432/f2b1b9/lg/f2b1b9467a2364aae9e57c08744473ff.jpg",
      "https://static.kiteprop.com/kp/properties/353432/280c7e/lg/280c7e8d0aa729d69334fce888edf4ab.jpg",
      "https://static.kiteprop.com/kp/properties/353432/bc50ec/lg/bc50ec1888ef58f904bc25c886946e35.jpg",
      "https://static.kiteprop.com/kp/properties/353432/56cd96/lg/56cd96a990186f6d3afefa5ca4d8daf6.jpg"
    ],
    "originalUrl": "https://devorafernandezpropiedades.kitepropcrm.com/site/properties/353432/casa-3-ambientes-moron-a-refaccionar"
  },
  {
    "id": 46,
    "code": "KP347656",
    "title": "IMPORTANTE PROPIEDAD COMERCIAL EN VENTA | ESQUINA ESTRATÉGICA | RAFAEL CASTILLO",
    "location": "Rafael Castillo",
    "address": "Don bosco 7708, La Matanza",
    "operation": "Venta",
    "propertyType": "Local Comercial",
    "priceUsd": 125000,
    "priceDisplay": "USD 125.000",
    "featured": false,
    "bedrooms": 0,
    "bathrooms": 0,
    "environments": 0,
    "surfaceTotal": 202,
    "surfaceCovered": 202,
    "description": "📍 IMPORTANTE PROPIEDAD COMERCIAL EN VENTA – ESQUINA ESTRATÉGICA\r\n\r\nExcelente oportunidad para inversión, ubicada sobre importantes arterias comerciales con múltiples posibilidades de desarrollo.\r\n\r\nCaracterísticas:\r\n\r\n• Local en esquina de aproximadamente 60 m² sobre Av. Don Bosco. con Baño.\r\n• Segundo local de aproximadamente 24 m² con Baño\r\n• Galpón de aproximadamente 100 m² con acceso por Donato Álvarez. con Baño\r\n• Departamento de 1 ambiente por escalera de aproximadamente 23 m². con Baño\r\n• Zona de alto tránsito vehicular y comercial.\r\n• Ideal para renta, emprendimientos comerciales o desarrollo inmobiliario.\r\n• Posibilidad de proyectar hasta 4 departamentos de un ambiente.\r\n• Se evalúa la venta por separado de los locales y el galpón.\r\n\r\n💡 Excelente oportunidad para inversores y desarrolladores.\r\n\r\n📞 Consultanos para más información y coordinar una visita.\r\n\r\nIMPORTANTE: La información y descripciones contenidas en la presente publicación tienen carácter meramente informativo y orientativo, no revisten naturaleza contractual.\r\n\r\nLas superficies y medidas indicadas son aproximadas. Las dimensiones definitivas surgirán del título de propiedad y de los planos correspondientes.\r\n\r\nLa inmobiliaria se reserva el derecho de modificar, actualizar o corregir en cualquier momento, y sin previo aviso, precios, medidas, características, especificaciones y/o disponibilidad de los inmuebles publicados.",
    "features": [
      "202 m² Superficie"
    ],
    "image": "https://static.kiteprop.com/kp/properties/347656/446101/lg/44610186a76743fb743026f883d59788.jpg",
    "gallery": [
      "https://static.kiteprop.com/kp/properties/347656/446101/lg/44610186a76743fb743026f883d59788.jpg",
      "https://static.kiteprop.com/kp/properties/347656/9cb8fc/lg/9cb8fc22e70772cb3a5e6ad8215ebc19.jpg",
      "https://static.kiteprop.com/kp/properties/347656/f85daa/lg/f85daa7c0efd979b27b1fc8052a0c794.jpg",
      "https://static.kiteprop.com/kp/properties/347656/d105ae/lg/d105aec2792180eb90d50c9a610ce225.jpg",
      "https://static.kiteprop.com/kp/properties/347656/679a16/lg/679a16acdba4cc55b7110f99a7dbda1c.jpg",
      "https://static.kiteprop.com/kp/properties/347656/66a683/lg/66a683d6d334ae21fadc232468429cb0.jpg",
      "https://static.kiteprop.com/kp/properties/347656/d2e7e7/lg/d2e7e79f1a8440c339f304eb8d8dbd2a.jpg",
      "https://static.kiteprop.com/kp/properties/347656/64eb8f/lg/64eb8fea1dd5e43c4844dab05b55a522.jpg",
      "https://static.kiteprop.com/kp/properties/347656/864867/lg/864867d97e3270d6d0c15372832ece35.jpg",
      "https://static.kiteprop.com/kp/properties/347656/b01f46/lg/b01f46376559703b4a77bbadcae90b80.jpg"
    ],
    "originalUrl": "https://devorafernandezpropiedades.kitepropcrm.com/site/properties/347656/importante-propiedad-comercial-en-venta-esquina-estrategica-rafael-castillo"
  },
  {
    "id": 47,
    "code": "KP342791",
    "title": "Duplex 3 ambientes | Morón | Como Nuevo",
    "location": "Morón",
    "address": "Larrea 815, Morón",
    "operation": "Venta",
    "propertyType": "Casa",
    "priceUsd": 78000,
    "priceDisplay": "USD 78.000",
    "featured": false,
    "bedrooms": 2,
    "bathrooms": 1,
    "environments": 3,
    "surfaceTotal": 100,
    "surfaceCovered": 100,
    "description": "📍 DÚPLEX REFACCIONADO A NUEVO – CÓMODO Y FUNCIONAL\r\n\r\n• Cocina-comedor renovada, con instalaciones modernas.\r\n• Cañerías y sistema eléctrico a nuevo, garantizando seguridad y eficiencia.\r\n• 2 dormitorios amplios y luminosos.\r\n• Baño completo en excelente estado.\r\n• Patio compartido | entrada de auto\r\n• Entrada de auto, brindando comodidad y seguridad.\r\n• Lavadero cubierto en la terraza, optimizando el espacio.\r\n\r\n📞 ¡Consultanos para más información o para coordinar una visita!",
    "features": [
      "2 Dormitorios",
      "1 Baño",
      "3 Ambientes",
      "100 m² Superficie",
      "Cochera para 1 auto",
      "2 dormitorios amplios y luminosos",
      "Baño completo en excelente estado",
      "Patio compartido | entrada de auto"
    ],
    "image": "https://static.kiteprop.com/kp/properties/342791/974604/lg/974604bd2ff99b92890212aa6b5060c5.jpg",
    "gallery": [
      "https://static.kiteprop.com/kp/properties/342791/974604/lg/974604bd2ff99b92890212aa6b5060c5.jpg",
      "https://static.kiteprop.com/kp/properties/342791/6df146/lg/6df1460a3648901da2c8eb05e64e5e3b.jpg",
      "https://static.kiteprop.com/kp/properties/342791/e34bec/lg/e34becc856f4e47be0fb6a2b1df2d7b6.jpg",
      "https://static.kiteprop.com/kp/properties/342791/d7daa1/lg/d7daa1493e375e4f1935e1a80acfc5e1.jpg",
      "https://static.kiteprop.com/kp/properties/342791/62dbc1/lg/62dbc10f5c262363c315271a02e507a2.jpg",
      "https://static.kiteprop.com/kp/properties/342791/5a84a8/lg/5a84a8a07a23d57d07dfaaa7d5f54c52.jpg",
      "https://static.kiteprop.com/kp/properties/342791/b40efe/lg/b40efe61a505a0fba0e1a95556d1f47c.jpg",
      "https://static.kiteprop.com/kp/properties/342791/c77bba/lg/c77bba35ec25dc91b1d99b63900045cf.jpg",
      "https://static.kiteprop.com/kp/properties/342791/0d5260/lg/0d5260cb07f4977f771474b3a1e96eea.jpg",
      "https://static.kiteprop.com/kp/properties/342791/a0c7db/lg/a0c7dbce8927b0a73f7acba16385f5e2.jpg",
      "https://static.kiteprop.com/kp/properties/342791/928470/lg/9284705e063d8ca7019eea17b767d631.jpg",
      "https://static.kiteprop.com/kp/properties/342791/346859/lg/3468598be481d8628deb9d7e7dd6ab5d.jpg",
      "https://static.kiteprop.com/kp/properties/342791/d13099/lg/d130994ac1199b070c727d587e0dc24c.jpg",
      "https://static.kiteprop.com/kp/properties/342791/670c84/lg/670c8403b5d3c0d0ea2e9c6129791a3a.jpg",
      "https://static.kiteprop.com/kp/properties/342791/562a4a/lg/562a4a731092b84f6755d49556a3356e.jpg",
      "https://static.kiteprop.com/kp/properties/342791/772e62/lg/772e62a7603b7a9b2108fed4acdeb47d.jpg",
      "https://static.kiteprop.com/kp/properties/342791/1973c7/lg/1973c7e9b17335fce220ae258b852ea6.jpg",
      "https://static.kiteprop.com/kp/properties/342791/21aada/lg/21aadad12052c3092888131c22779f7d.jpg",
      "https://static.kiteprop.com/kp/properties/342791/e69c9a/lg/e69c9a741cfea5cc3b615c018122cc1a.jpg",
      "https://static.kiteprop.com/kp/properties/342791/ff0ad1/lg/ff0ad1566fab8d700e4edcffbe798973.jpg",
      "https://static.kiteprop.com/kp/properties/342791/465645/lg/4656450969758d18111e8edf338dbe14.jpg",
      "https://static.kiteprop.com/kp/properties/342791/9b00dc/lg/9b00dc946d3de738b9510d1976ae1935.jpg"
    ],
    "originalUrl": "https://devorafernandezpropiedades.kitepropcrm.com/site/properties/342791/duplex-3-ambientes-moron-como-nuevo"
  },
  {
    "id": 48,
    "code": "KP341069",
    "title": "Duplex |  Morón  | A 3 cuadras de la estacíon",
    "location": "Morón",
    "address": "MUNILLA 890, Morón",
    "operation": "Alquiler",
    "propertyType": "Departamento",
    "priceUsd": 461,
    "priceDisplay": "ARS 600.000",
    "featured": false,
    "bedrooms": 1,
    "bathrooms": 1,
    "environments": 2,
    "surfaceTotal": 35,
    "surfaceCovered": 35,
    "description": "Dúplex de 2 Ambientes en Morón – A 3 Cuadras de la Estación\r\n\r\nUbicación estratégica, a pasos de la facultad y con excelente conectividad.\r\n\r\n• 1 dormitorio amplio y luminoso.\r\n• Baño completo.\r\n• Cocina-comedor funcional.\r\n• Patio cómodo, ideal para disfrutar al aire libre.\r\n\r\n¡Gran oportunidad! Consulte para más información.",
    "features": [
      "1 Dormitorio",
      "1 Baño",
      "2 Ambientes",
      "35 m² Superficie",
      "1 dormitorio amplio y luminoso",
      "Baño completo",
      "Cocina-comedor funcional"
    ],
    "image": "https://static.kiteprop.com/kp/properties/341069/965517/lg/96551700eb65da5ba802f8e201380b14.jpg",
    "gallery": [
      "https://static.kiteprop.com/kp/properties/341069/965517/lg/96551700eb65da5ba802f8e201380b14.jpg",
      "https://static.kiteprop.com/kp/properties/341069/1efd56/lg/1efd56f826aaa15e894a1138ade1c814.jpg",
      "https://static.kiteprop.com/kp/properties/341069/a5fd21/lg/a5fd216be6d6d8483127fc6ea1b3e2bf.jpg",
      "https://static.kiteprop.com/kp/properties/341069/9d0520/lg/9d052026329d97ed2d70457da1f5b271.jpg",
      "https://static.kiteprop.com/kp/properties/341069/9f074c/lg/9f074cd359c43c33b7b448db6de1332e.jpg",
      "https://static.kiteprop.com/kp/properties/341069/684fec/lg/684fec32fd0605016c2445564bf3b6c3.jpg",
      "https://static.kiteprop.com/kp/properties/341069/d5fd2c/lg/d5fd2cc2c81fe1e105d611dca11b4219.jpg",
      "https://static.kiteprop.com/kp/properties/341069/c4381d/lg/c4381dd19f75d64104fe502f5f4dbb82.jpg",
      "https://static.kiteprop.com/kp/properties/341069/564a79/lg/564a79c54f8e9ac82c242c4a0308f092.jpg"
    ],
    "originalUrl": "https://devorafernandezpropiedades.kitepropcrm.com/site/properties/341069/duplex-moron-a-3-cuadras-de-la-estacion"
  },
  {
    "id": 49,
    "code": "KP324493",
    "title": "CASA A REFACCIONAR | CASTELAR NORTE | A CUADRAS DEL ACCESO OESTE",
    "location": "Castelar",
    "address": "San Nicolas 2152, Castelar",
    "operation": "Venta",
    "propertyType": "Casa",
    "priceUsd": 70000,
    "priceDisplay": "USD 70.000",
    "featured": false,
    "bedrooms": 2,
    "bathrooms": 1,
    "environments": 3,
    "surfaceTotal": 216,
    "surfaceCovered": 100,
    "description": "🏡 CASA AMERICANA 3 AMBIENTES EN VENTA\r\n\r\nPropiedad sobre lote propio, con buen potencial y todos los servicios instalados y funcionando.\r\n\r\nCaracterísticas:\r\n\r\n2 dormitorios\r\nBaño completo\r\nCocina comedor\r\nEntrada para 2 autos\r\nCuarto de herramientas\r\nDependencia al fondo (a reciclar)\r\nCasa premoldeada en el fondo (removible, posibilidad de generar fondo libre)\r\n\r\nLote irregular:\r\n\r\nMedidas: 12 x 18,20 x 16,80 x 12,08\r\nSuperficie total: 210 m²\r\n\r\n📌 Condiciones de venta:\r\n\r\nVenta por tracto abreviado\r\n\r\n💡 Ideal para refaccionar o desarrollar según necesidad.\r\n\r\n📞 Consultanos para más información.",
    "features": [
      "2 Dormitorios",
      "1 Baño",
      "3 Ambientes",
      "216 m² Superficie",
      "Cochera para 2 autos",
      "2 dormitorios",
      "Baño completo",
      "Cocina comedor"
    ],
    "image": "https://static.kiteprop.com/kp/properties/324493/e94e81/lg/e94e81b9c0149833d5e67365814a343e.jpg",
    "gallery": [
      "https://static.kiteprop.com/kp/properties/324493/e94e81/lg/e94e81b9c0149833d5e67365814a343e.jpg",
      "https://static.kiteprop.com/kp/properties/324493/00c679/lg/00c6792103a38941bc22d1fb9d37bec6.jpg",
      "https://static.kiteprop.com/kp/properties/324493/e7eb04/lg/e7eb0427b5aff1eddd2d2516b9d20082.jpg",
      "https://static.kiteprop.com/kp/properties/324493/c54790/lg/c547902a53dfaabf71f7ffaa68330507.jpg",
      "https://static.kiteprop.com/kp/properties/324493/ea7d3e/lg/ea7d3e6135da1ed3df2eaecb1037f7d1.jpg",
      "https://static.kiteprop.com/kp/properties/324493/a88b32/lg/a88b328127d022ed6f85a7880106e8ba.jpg",
      "https://static.kiteprop.com/kp/properties/324493/8d1879/lg/8d18799502dad74b1ec49db57dc47fa7.jpg",
      "https://static.kiteprop.com/kp/properties/324493/8cd1d0/lg/8cd1d013f3fa5be3ff9f6387b9e26e6b.jpg",
      "https://static.kiteprop.com/kp/properties/324493/542ab9/lg/542ab9e444bc25f5688d850126b49538.jpg",
      "https://static.kiteprop.com/kp/properties/324493/58f2fd/lg/58f2fd0f04a5deffaec42ed1195d0367.jpg",
      "https://static.kiteprop.com/kp/properties/324493/d67aae/lg/d67aaed6db89925b2be09971b6958b2a.jpg",
      "https://static.kiteprop.com/kp/properties/324493/7aa26f/lg/7aa26f0c60290bf401e42787aa446e71.jpg",
      "https://static.kiteprop.com/kp/properties/324493/083a9a/lg/083a9a452dbe9a96f52be2b3bcbcd43e.jpg",
      "https://static.kiteprop.com/kp/properties/324493/dcb410/lg/dcb410b9361355ed4ed26696e9b18ef2.jpg",
      "https://static.kiteprop.com/kp/properties/324493/15516b/lg/15516b3be11073599fc9c78affccfb60.jpg",
      "https://static.kiteprop.com/kp/properties/324493/9d5039/lg/9d5039be9c4c142a08237fbfbc842d8c.jpg"
    ],
    "originalUrl": "https://devorafernandezpropiedades.kitepropcrm.com/site/properties/324493/casa-a-refaccionar-castelar-norte-a-cuadras-del-acceso-oeste"
  },
  {
    "id": 50,
    "code": "KP291321",
    "title": "Lote apto para edificar | en Hurlingham | oportunidad para desarrollo de edificio",
    "location": "Hurlingham",
    "address": "DR  ALFREDO L  PALACIOS  2062, Hurlingham",
    "operation": "Venta",
    "propertyType": "Terreno",
    "priceUsd": 120000,
    "priceDisplay": "USD 120.000",
    "featured": false,
    "bedrooms": 0,
    "bathrooms": 0,
    "environments": 0,
    "surfaceTotal": 3850,
    "surfaceCovered": 3850,
    "description": "📍 LOTE IDEAL PARA CONSTRUCCIÓN | GRAN TAMAÑO\r\n\r\n• Superficie: 8-66 mx 43 m de fondo.\r\n• Excelente oportunidad para desarrollo de edificio o emprendimiento multifamiliar.\r\n• Ubicado en zona con potencial de crecimiento y buena conectividad.\r\n\r\nIdeal inversores o desarrolladores! Consultanos para más información.",
    "features": [
      "3850 m² Superficie"
    ],
    "image": "https://static.kiteprop.com/kp/properties/291321/9d045d/lg/9d045de0ea553393b93606007797f897.jpg",
    "gallery": [
      "https://static.kiteprop.com/kp/properties/291321/9d045d/lg/9d045de0ea553393b93606007797f897.jpg",
      "https://static.kiteprop.com/kp/properties/291321/b5df22/lg/b5df222be66c7bb6cb0ebeccb620c544.jpg",
      "https://static.kiteprop.com/kp/properties/291321/55fca0/lg/55fca0a077187f03ebd9e6ba4e5e4320.jpg",
      "https://static.kiteprop.com/kp/properties/291321/f4d795/lg/f4d7955317cbb54d4c7aab9cfc575811.jpg",
      "https://static.kiteprop.com/kp/properties/291321/92796b/lg/92796baab5987f7c5104e57ac9538e38.jpg",
      "https://static.kiteprop.com/kp/properties/291321/935eec/lg/935eec4abd9f73cdd03e9da06672a194.jpg",
      "https://static.kiteprop.com/kp/properties/291321/80e815/lg/80e815a991ecc9c6cf151d6c7286fd2f.jpg"
    ],
    "originalUrl": "https://devorafernandezpropiedades.kitepropcrm.com/site/properties/291321/lote-apto-para-edificar-en-hurlingham-oportunidad-para-desarrollo-de-edificio"
  },
  {
    "id": 51,
    "code": "KP248341",
    "title": "Departamento 2 amb Planta Baja en Edificio a 3 cuadras estación Morón  (Idel para oficina o consultorios,)",
    "location": "Morón",
    "address": "ALEM 818, Morón",
    "operation": "Venta",
    "propertyType": "Departamento",
    "priceUsd": 65000,
    "priceDisplay": "USD 65.000",
    "featured": false,
    "bedrooms": 1,
    "bathrooms": 1,
    "environments": 2,
    "surfaceTotal": 60,
    "surfaceCovered": 60,
    "description": "Gran departamento con bajas expensas es una oficina de 60 mt ideal consultorio planta baja \r\nno paga asensor ,",
    "features": [
      "1 Dormitorio",
      "1 Baño",
      "2 Ambientes",
      "60 m² Superficie",
      "no paga asensor "
    ],
    "image": "https://static.kiteprop.com/kp/properties/248341/1c825c/lg/1c825c8984fb7ade7fd5521cf986c646.jpg",
    "gallery": [
      "https://static.kiteprop.com/kp/properties/248341/1c825c/lg/1c825c8984fb7ade7fd5521cf986c646.jpg",
      "https://static.kiteprop.com/kp/properties/248341/cec69b/lg/cec69b4670ede301c1063d02552e7fa8.jpg",
      "https://static.kiteprop.com/kp/properties/248341/dd32fe/lg/dd32fe9652c69e729cc9c2797f2a0920.jpg",
      "https://static.kiteprop.com/kp/properties/248341/dbf712/lg/dbf712f57c88e556a37b8d3321119caa.jpg",
      "https://static.kiteprop.com/kp/properties/248341/11c91d/lg/11c91dd76b1c44bca4773994ccb090d5.jpg",
      "https://static.kiteprop.com/kp/properties/248341/5889cb/lg/5889cbd0213e93e3218adede56787e94.jpg",
      "https://static.kiteprop.com/kp/properties/248341/5834e1/lg/5834e1f6df074a1999e0f3c88f4a4a4c.jpg"
    ],
    "originalUrl": "https://devorafernandezpropiedades.kitepropcrm.com/site/properties/248341/departamento-2-amb-planta-baja-en-edificio-a-3-cuadras-estacion-moron-idel-para-oficina-o-consultorios"
  },
  {
    "id": 52,
    "code": "KP247840",
    "title": "LOTE  DE GRAN TAMAÑO | HURLINGHAM | OPORTUNIDAD PARA CONSTRUIR",
    "location": "Hurlingham",
    "address": "JUAN DE GARAY  2065, Hurlingham",
    "operation": "Venta",
    "propertyType": "Terreno",
    "priceUsd": 110000,
    "priceDisplay": "USD 110.000",
    "featured": false,
    "bedrooms": 0,
    "bathrooms": 0,
    "environments": 0,
    "surfaceTotal": 520,
    "surfaceCovered": 520,
    "description": "📍 LOTE DE GRAN TAMAÑO – OPORTUNIDAD PARA CONSTRUIR\r\n\r\n• Medidas: 13 x 43 metros.\r\n• Ideal para departamentos, casas o PH.\r\n• Nueva zonificación que permite construcción en altura.\r\n• Se escuchan ofertas o permutas por PH o departamento.\r\n\r\nExcelente oportunidad para desarrolladores o inversores! Consultanos.",
    "features": [
      "520 m² Superficie",
      "Medidas: 13 x 43 metros",
      "Ideal para departamentos, casas o PH"
    ],
    "image": "https://static.kiteprop.com/kp/properties/247840/c21c0a/lg/c21c0aac4ae785635efa17e3eafc0a62.jpg",
    "gallery": [
      "https://static.kiteprop.com/kp/properties/247840/c21c0a/lg/c21c0aac4ae785635efa17e3eafc0a62.jpg",
      "https://static.kiteprop.com/kp/properties/247840/0e7a59/lg/0e7a59d33c1f713ee596e17b0cd2f7b6.jpg",
      "https://static.kiteprop.com/kp/properties/247840/d93700/lg/d93700d05f62d1a06beea354efc10962.jpg",
      "https://static.kiteprop.com/kp/properties/247840/5ffa8d/lg/5ffa8df38b7baf137c81747334dcc6e4.jpg",
      "https://static.kiteprop.com/kp/properties/247840/c7db22/lg/c7db2243bc84d45218a80d42d9f1cc1e.jpg",
      "https://static.kiteprop.com/kp/properties/247840/00d7e3/lg/00d7e3862ada99051b25a4f25a1ad400.jpg",
      "https://static.kiteprop.com/kp/properties/247840/63f67d/lg/63f67d724e2137fc851dc47379117148.jpg",
      "https://static.kiteprop.com/kp/properties/247840/6f85bd/lg/6f85bd7019e97f8f4e905c378a3c7f48.jpg",
      "https://static.kiteprop.com/kp/properties/247840/3d3f70/lg/3d3f7040824fa1b4ffdd02b824d11455.jpg"
    ],
    "originalUrl": "https://devorafernandezpropiedades.kitepropcrm.com/site/properties/247840/lote-de-gran-tamano-hurlingham-oportunidad-para-construir"
  },
  {
    "id": 53,
    "code": "KP201700",
    "title": "CASA, CON LOTE DE 50m DE FONDO 4 AMB, EN BUEN ESTADO",
    "location": "Morón",
    "address": "Isabel  de Pardo 3053, Morón",
    "operation": "Venta",
    "propertyType": "Casa",
    "priceUsd": 95000,
    "priceDisplay": "USD 95.000",
    "featured": false,
    "bedrooms": 3,
    "bathrooms": 2,
    "environments": 4,
    "surfaceTotal": 500,
    "surfaceCovered": 100,
    "description": "Casa con lote de 10x50m , construccion en muy buen estado, con Living , cocina comedor , 3 dormitorios con placard, lavadero, galerìa o jardín de invierno, Con departamento con baño cocina  en el fondo del lote de terreno,",
    "features": [
      "3 Dormitorios",
      "2 Baños",
      "4 Ambientes",
      "500 m² Superficie",
      "Cochera para 3 autos"
    ],
    "image": "https://static.kiteprop.com/kp/properties/201700/217584/lg/2175843b7d9d768675e2944944dbaa14.jpg",
    "gallery": [
      "https://static.kiteprop.com/kp/properties/201700/217584/lg/2175843b7d9d768675e2944944dbaa14.jpg",
      "https://static.kiteprop.com/kp/properties/201700/9236c0/lg/9236c052faf2891078ce794a048bdd32.jpg",
      "https://static.kiteprop.com/kp/properties/201700/475c4c/lg/475c4c381c2c8636ebfa01dcdb103d27.jpg",
      "https://static.kiteprop.com/kp/properties/201700/951ec0/lg/951ec07f97cb63f8e6e2a737a10c0377.jpg",
      "https://static.kiteprop.com/kp/properties/201700/22a89e/lg/22a89ec4f60ef6508cc903d9b0266eba.jpg",
      "https://static.kiteprop.com/kp/properties/201700/15840c/lg/15840c03272fd1188de29c619ef7e105.jpg",
      "https://static.kiteprop.com/kp/properties/201700/cc6668/lg/cc66683eaa3cf26a5cde38208b0b2d48.jpg",
      "https://static.kiteprop.com/kp/properties/201700/3ec635/lg/3ec63572690efdae30c6b935c2c6eb97.jpg",
      "https://static.kiteprop.com/kp/properties/201700/4122ab/lg/4122abdbc9deef42523fe9e880419ba6.jpg"
    ],
    "originalUrl": "https://devorafernandezpropiedades.kitepropcrm.com/site/properties/201700/casa-con-lote-de-50m-de-fondo-4-amb-en-buen-estado"
  },
  {
    "id": 54,
    "code": "KP166592",
    "title": "CASA | RAPIDO ACCESO A LA ESTACÍON | MORON SUR",
    "location": "Morón",
    "address": "burgos 731, Morón",
    "operation": "Venta",
    "propertyType": "Casa",
    "priceUsd": 65000,
    "priceDisplay": "USD 65.000",
    "featured": false,
    "bedrooms": 2,
    "bathrooms": 1,
    "environments": 4,
    "surfaceTotal": 100,
    "surfaceCovered": 100,
    "description": "📍 CASA EN VENTA – MORÓN SUR\r\n\r\nCasa muy cómoda, ubicada en una zona de fácil acceso y con excelente conexión hacia la estación y diferentes medios de transporte.\r\n\r\n• 2 dormitorios\r\n• Baño completo\r\n• Cocina\r\n• Living comedor\r\n• Fondo libre\r\n• Muy cómoda y funcional\r\n• Fácil acceso a la estación y a todos los transportes\r\n\r\nExcelente oportunidad de venta. Consultanos para más información o coordinar una visita.\r\n\r\nIMPORTANTE: La información y descripciones contenidas en la presente publicación tienen carácter meramente informativo y orientativo, no revisten naturaleza contractual.\r\n\r\nLas superficies y medidas indicadas son aproximadas. Las dimensiones definitivas surgirán del título de propiedad y de los planos correspondientes.\r\n\r\nLa inmobiliaria se reserva el derecho de modificar, actualizar o corregir en cualquier momento, y sin previo aviso, precios, medidas, características, especificaciones y/o disponibilidad de los inmuebles publicados.",
    "features": [
      "2 Dormitorios",
      "1 Baño",
      "4 Ambientes",
      "100 m² Superficie",
      "Cochera para 1 auto",
      "2 dormitorios",
      "Baño completo",
      "Cocina"
    ],
    "image": "https://static.kiteprop.com/kp/properties/166592/4a9e36/lg/4a9e368ba7b4c973633a5ca92ce3285f.jpg",
    "gallery": [
      "https://static.kiteprop.com/kp/properties/166592/4a9e36/lg/4a9e368ba7b4c973633a5ca92ce3285f.jpg",
      "https://static.kiteprop.com/kp/properties/166592/6830e1/lg/6830e1980fb1fb8701d4498f0251c6c3.jpg",
      "https://static.kiteprop.com/kp/properties/166592/431e1a/lg/431e1a600bd59d7ef436f33b40f0c737.jpg",
      "https://static.kiteprop.com/kp/properties/166592/a8541c/lg/a8541c204c8d051a5ce2e3e1b635fecf.jpg",
      "https://static.kiteprop.com/kp/properties/166592/1cdcf4/lg/1cdcf4e541ec189f2e3dc21c20893003.jpg",
      "https://static.kiteprop.com/kp/properties/166592/3616ef/lg/3616ef64fa654ac84057c16c577493e4.jpg",
      "https://static.kiteprop.com/kp/properties/166592/ed0d4a/lg/ed0d4a963695ff4f7591f0f8675bf259.jpg",
      "https://static.kiteprop.com/kp/properties/166592/d56e9c/lg/d56e9c5ed3d7a17b4d0868be3ac16428.jpg",
      "https://static.kiteprop.com/kp/properties/166592/0fb800/lg/0fb800981cff5af5b91cad9f2aa8006a.jpg",
      "https://static.kiteprop.com/kp/properties/166592/f5c4ca/lg/f5c4caab4c32d3cb87dfa7e51a6319ab.jpg",
      "https://static.kiteprop.com/kp/properties/166592/77460b/lg/77460bf121e9b54fc299e5c30221bded.jpg",
      "https://static.kiteprop.com/kp/properties/166592/fe389c/lg/fe389c0361ea07b8185a8743f8cd2b92.jpg"
    ],
    "originalUrl": "https://devorafernandezpropiedades.kitepropcrm.com/site/properties/166592/casa-rapido-acceso-a-la-estacion-moron-sur"
  },
  {
    "id": 55,
    "code": "KP121409",
    "title": "Depart, 2 amb | Miramar, edificio Stela Maris II  Calle C14 , 547",
    "location": "Miramar",
    "address": "CALLE 14 537, Miramar",
    "operation": "Venta",
    "propertyType": "Departamento",
    "priceUsd": 45000,
    "priceDisplay": "USD 45.000",
    "featured": false,
    "bedrooms": 1,
    "bathrooms": 1,
    "environments": 2,
    "surfaceTotal": 38,
    "surfaceCovered": 38,
    "description": "📍 Miramar | Departamento Frente al Mar – Ideal Inversión\r\n\r\nUbicado a pocas cuadras de la entrada a la ciudad, frente a la Plaza Los Miños con vista al mar.\r\n\r\nDepartamento muy cómodo y funcional.\r\n\r\nIdeal para descanso o inversión turística.\r\n\r\nBajas expensas.\r\n\r\nExcelente entorno y ubicación tranquila.\r\n\r\nConsultanos para más información.\r\n\r\nIMPORTANTE: La información y descripciones contenidas en la presente publicación tienen carácter meramente informativo y orientativo, no revisten naturaleza contractual.\r\n\r\nLas superficies y medidas indicadas son aproximadas. Las dimensiones definitivas surgirán del título de propiedad y de los planos correspondientes.\r\n\r\nLa inmobiliaria se reserva el derecho de modificar, actualizar o corregir en cualquier momento, y sin previo aviso, precios, medidas, características, especificaciones y/o disponibilidad de los inmuebles publicados.",
    "features": [
      "1 Dormitorio",
      "1 Baño",
      "2 Ambientes",
      "38 m² Superficie",
      "Departamento muy cómodo y funcional",
      "Bajas expensas",
      "Excelente entorno y ubicación tranquila",
      "Consultanos para más información"
    ],
    "image": "https://static.kiteprop.com/kp/properties/121409/2766f7/lg/2766f7f9bcc409132fd6dadc4cf6f518.jpg",
    "gallery": [
      "https://static.kiteprop.com/kp/properties/121409/2766f7/lg/2766f7f9bcc409132fd6dadc4cf6f518.jpg",
      "https://static.kiteprop.com/kp/properties/121409/0ad7d0/lg/0ad7d06be4eb0ca8beab5becdb2df0b7.jpg",
      "https://static.kiteprop.com/kp/properties/121409/3ab69a/lg/3ab69aea66f7960da6dbe25ad9c12458.jpg",
      "https://static.kiteprop.com/kp/properties/121409/5c9dae/lg/5c9dae1983e65729370077c93b9337d8.jpg",
      "https://static.kiteprop.com/kp/properties/121409/251d58/lg/251d5849b0cc194ce0ad5db67d8601b3.jpg",
      "https://static.kiteprop.com/kp/properties/121409/86d5b4/lg/86d5b430436b8da31c082cfbf751d289.jpg",
      "https://static.kiteprop.com/kp/properties/121409/ebef79/lg/ebef7943c3c0fdf0edcd3072ac298041.jpg",
      "https://static.kiteprop.com/kp/properties/121409/cb8487/lg/cb84871473ad6ebad46c30ab5bf70c14.jpg",
      "https://static.kiteprop.com/kp/properties/121409/3ced08/lg/3ced088b3c9b146d87c1080d73bd9b01.jpg",
      "https://static.kiteprop.com/kp/properties/121409/e63db2/lg/e63db24a4c50d8491f074273596f1105.jpg",
      "https://static.kiteprop.com/kp/properties/121409/8be751/lg/8be7514aaddf084b25eae60e9587c586.jpg",
      "https://static.kiteprop.com/kp/properties/121409/43dcc1/lg/43dcc18b4bc9129b45740369963f57ae.jpg"
    ],
    "originalUrl": "https://devorafernandezpropiedades.kitepropcrm.com/site/properties/121409/depart-2-amb-miramar-edificio-stela-maris-ii-calle-c14-547"
  },
  {
    "id": 56,
    "code": "KP118047",
    "title": "- OPORTUNIDAD - DOS PROPIEDADES AL FRENTE ESTILO PH | HURLINGHAM",
    "location": "Hurlingham",
    "address": "CORACERO 3115, Hurlingham",
    "operation": "Venta",
    "propertyType": "PH",
    "priceUsd": 65000,
    "priceDisplay": "USD 65.000",
    "featured": false,
    "bedrooms": 2,
    "bathrooms": 1,
    "environments": 3,
    "surfaceTotal": 200,
    "surfaceCovered": 180,
    "description": "📍 DOS PROPIEDADES ESTILO PH | HURLINGHAM\r\n\r\nUnidad 1 PROPIEDAD PRINCIPAL\r\n• 3 Ambientes.\r\n• 2 Dormitorios con placard.\r\n• Hall de entrada.\r\n• Living-comedor amplio.\r\n• Cocina completa.\r\n• Baño.\r\n• Terraza.\r\n• Parrilla.\r\n• Ubicada a 10 cuadras de la Municipalidad de Hurlingham.\r\n\r\n\r\nUnidad 2 PROPIEDAD SECUNDARIA ESTILO DEPARTAMENTO 2 AMBIENTES\r\n• 1 Dormitorio.\r\n• Cocina.\r\n• Hall de entrada.\r\n\r\nEscuchan posibles ofertas.\r\n\r\n¡Consultanos para más detalles o para coordinar una visita!",
    "features": [
      "2 Dormitorios",
      "1 Baño",
      "3 Ambientes",
      "200 m² Superficie",
      "Unidad 1 PROPIEDAD PRINCIPAL",
      "2 Dormitorios con placard",
      "Hall de entrada",
      "Living-comedor amplio"
    ],
    "image": "https://static.kiteprop.com/kp/properties/118047/cb1bc0/lg/cb1bc09fbba23640a858de7709a94a57.jpg",
    "gallery": [
      "https://static.kiteprop.com/kp/properties/118047/cb1bc0/lg/cb1bc09fbba23640a858de7709a94a57.jpg",
      "https://static.kiteprop.com/kp/properties/118047/7a38a8/lg/7a38a8595cdf9fbbeceecaa818d341cb.jpg",
      "https://static.kiteprop.com/kp/properties/118047/817cd2/lg/817cd27306d3431f916d8536f67610f1.jpg",
      "https://static.kiteprop.com/kp/properties/118047/716377/lg/716377cad3371c224f4696402bc88307.jpg",
      "https://static.kiteprop.com/kp/properties/118047/550c3d/lg/550c3df21624a78e5941f300c8c2f991.jpg",
      "https://static.kiteprop.com/kp/properties/118047/c2d0a5/lg/c2d0a569a3f42fe3ce1d79fddcf8e269.jpg",
      "https://static.kiteprop.com/kp/properties/118047/ddbc47/lg/ddbc4713fe776a8181ec61e76972b32a.jpg",
      "https://static.kiteprop.com/kp/properties/118047/08aabd/lg/08aabdb7cef075fe31a3e10a8b5171cc.jpg",
      "https://static.kiteprop.com/kp/properties/118047/7bc3c7/lg/7bc3c77b563d0c3f105a845aebaf5230.jpg",
      "https://static.kiteprop.com/kp/properties/118047/f790cb/lg/f790cbe2aac2647d987f24dbe9638d20.jpg",
      "https://static.kiteprop.com/kp/properties/118047/866349/lg/866349692ec3c16a1b2bffce0a5c6448.jpg",
      "https://static.kiteprop.com/kp/properties/118047/eaacb4/lg/eaacb4475646f6bf18f71823bf415212.jpg",
      "https://static.kiteprop.com/kp/properties/118047/724fd3/lg/724fd3b4cdca9619c65baf17b12fd44e.jpg",
      "https://static.kiteprop.com/kp/properties/118047/f90893/lg/f9089388946b4dfdc8a3748b70e58aa7.jpg",
      "https://static.kiteprop.com/kp/properties/118047/d19331/lg/d19331e311b1068f49f44c8ce3e65bc3.jpg",
      "https://static.kiteprop.com/kp/properties/118047/f59b06/lg/f59b06083f370dfcd4dafeebd8ee5293.jpg",
      "https://static.kiteprop.com/kp/properties/118047/7f9e74/lg/7f9e746312d7b4a2a82faa452fd5f97c.jpg",
      "https://static.kiteprop.com/kp/properties/118047/c5060e/lg/c5060eb6cb1187b3e56855448195093f.jpg",
      "https://static.kiteprop.com/kp/properties/118047/77001c/lg/77001c43a57d349234ece0654eaa16b3.jpg",
      "https://static.kiteprop.com/kp/properties/118047/41b4d6/lg/41b4d671bb5ee2316123349099bff1b8.jpg",
      "https://static.kiteprop.com/kp/properties/118047/ce8eb5/lg/ce8eb5b1e41d3fec0fcd09eb0c2cd14b.jpg",
      "https://static.kiteprop.com/kp/properties/118047/20c732/lg/20c7321964cf28f824d8fad7cfa7eca4.jpg",
      "https://static.kiteprop.com/kp/properties/118047/78ff8e/lg/78ff8e6788a4feb60638cc0560e45daf.jpg",
      "https://static.kiteprop.com/kp/properties/118047/f26ca8/lg/f26ca8edb4b357280064948134b088ad.jpg",
      "https://static.kiteprop.com/kp/properties/118047/7a747c/lg/7a747cbe42391d1f8c3d426c91de06ce.jpg",
      "https://static.kiteprop.com/kp/properties/118047/22293d/lg/22293d1e4d656cf50445c952465f7369.jpg"
    ],
    "originalUrl": "https://devorafernandezpropiedades.kitepropcrm.com/site/properties/118047/oportunidad-dos-propiedades-al-frente-estilo-ph-hurlingham"
  },
  {
    "id": 57,
    "code": "KP117897",
    "title": "Amplia Casa Americana | Planta Baja y Alta para Dos Familias | Morón",
    "location": "Morón",
    "address": "SAN LUIS 986 - CP, Morón",
    "operation": "Venta",
    "propertyType": "Casa",
    "priceUsd": 90000,
    "priceDisplay": "USD 90.000",
    "featured": false,
    "bedrooms": 2,
    "bathrooms": 2,
    "environments": 3,
    "surfaceTotal": 300,
    "surfaceCovered": 180,
    "description": "📍  MORON | CASA AMERICANA DE GRAN TAMAÑO \r\nSon dos propiedades independientes: planta baja y planta alta, muy cómodas y en estado.\r\n\r\n\r\nPlanta Baja\r\n• 2 dormitorios amplios.\r\n• Baño completo, cocina-comedor.\r\n• Living-comedor espacioso.\r\n• Patio grande para disfrutar al aire libre.\r\n\r\nPlanta Alta al fondo\r\n• Baño completo.\r\n• Cocina grande y comedor.\r\n• Dormitorios amplios.\r\n• Patio terraza para relajarse o disfrutar del exterior.\r\n\r\n• Garage para un auto.\r\n\r\n\r\n¡Una excelente oportunidad para dos familias! Consultanos para más información.\r\n\r\nIMPORTANTE: La información y descripciones contenidas en la presente publicación tienen carácter meramente informativo y orientativo, no revisten naturaleza contractual.\r\n\r\nLas superficies y medidas indicadas son aproximadas. Las dimensiones definitivas surgirán del título de propiedad y de los planos correspondientes.\r\n\r\nLa inmobiliaria se reserva el derecho de modificar, actualizar o corregir en cualquier momento, y sin previo aviso, precios, medidas, características, especificaciones y/o disponibilidad de los inmuebles publicados.",
    "features": [
      "2 Dormitorios",
      "2 Baños",
      "3 Ambientes",
      "300 m² Superficie",
      "Cochera para 2 autos",
      "2 dormitorios amplios",
      "Baño completo, cocina-comedor",
      "Living-comedor espacioso"
    ],
    "image": "https://static.kiteprop.com/kp/properties/117897/3fbe52/lg/3fbe522661017119d3d33ac7803ffd08.jpg",
    "gallery": [
      "https://static.kiteprop.com/kp/properties/117897/3fbe52/lg/3fbe522661017119d3d33ac7803ffd08.jpg",
      "https://static.kiteprop.com/kp/properties/117897/9a39c7/lg/9a39c77380cf91de1772282b53b98b4c.jpg",
      "https://static.kiteprop.com/kp/properties/117897/032c85/lg/032c8586b8b4efa9b5b280b47ba8ad2d.jpg",
      "https://static.kiteprop.com/kp/properties/117897/23fa2a/lg/23fa2ab2fdc715f064e5c235ead648ad.jpg",
      "https://static.kiteprop.com/kp/properties/117897/e79a6f/lg/e79a6fc0ef424400ac6561ed11519418.jpg",
      "https://static.kiteprop.com/kp/properties/117897/1ace1b/lg/1ace1b441397c481b26ebbbec6dfb4f9.jpg",
      "https://static.kiteprop.com/kp/properties/117897/cb1f17/lg/cb1f175322c27ace32fb20e881594d5e.jpg",
      "https://static.kiteprop.com/kp/properties/117897/33a7a2/lg/33a7a2bda3597f988e2296c179fc6796.jpg",
      "https://static.kiteprop.com/kp/properties/117897/12523d/lg/12523d85007c6346bb55a46f8c042301.jpg",
      "https://static.kiteprop.com/kp/properties/117897/0c8d52/lg/0c8d52b465109668a2827105950acf4b.jpg",
      "https://static.kiteprop.com/kp/properties/117897/cb1835/lg/cb18359f8aa7b9ae02d877ce6528210d.jpg",
      "https://static.kiteprop.com/kp/properties/117897/74ada2/lg/74ada2209812fbd8c1f97a9d16d18218.jpg",
      "https://static.kiteprop.com/kp/properties/117897/b5ac03/lg/b5ac03be7052a2579202853cd2773898.jpg",
      "https://static.kiteprop.com/kp/properties/117897/4779f4/lg/4779f4caa3ae966d931b1ab76340f46b.jpg",
      "https://static.kiteprop.com/kp/properties/117897/e57126/lg/e571260416bbdeddbf641efb2a8e5578.jpg",
      "https://static.kiteprop.com/kp/properties/117897/37749c/lg/37749c566f84a82f2d0b8806cfdad969.jpg",
      "https://static.kiteprop.com/kp/properties/117897/a65894/lg/a6589411230ea66b6e3954fc6ea466df.jpg",
      "https://static.kiteprop.com/kp/properties/117897/2af303/lg/2af30387518936a2d167913f7525fe80.jpg",
      "https://static.kiteprop.com/kp/properties/117897/4ec4ea/lg/4ec4eaa174ad9e308bbff74035f3f8ca.jpg",
      "https://static.kiteprop.com/kp/properties/117897/22c1f3/lg/22c1f3f6d9cab291fe1561102ab93445.jpg",
      "https://static.kiteprop.com/kp/properties/117897/531a49/lg/531a498dc7cab2d05dc2e120301070f2.jpg",
      "https://static.kiteprop.com/kp/properties/117897/5f92a4/lg/5f92a4813da78cf291192f514199e401.jpg",
      "https://static.kiteprop.com/kp/properties/117897/9dc4fb/lg/9dc4fb56cade0a5be9830cab2522d21e.jpg",
      "https://static.kiteprop.com/kp/properties/117897/f9adca/lg/f9adca81fc28b72a9fe0f4fbca0fa73a.jpg",
      "https://static.kiteprop.com/kp/properties/117897/f4d327/lg/f4d327bb3925038a0fc63423c97bd381.jpg"
    ],
    "originalUrl": "https://devorafernandezpropiedades.kitepropcrm.com/site/properties/117897/amplia-casa-americana-planta-baja-y-alta-para-dos-familias-moron"
  },
  {
    "id": 58,
    "code": "KP117123",
    "title": "Dos casas estilo PH | Morón | a 5 cuadras de la estacion",
    "location": "Morón",
    "address": "LUGONES 992, Morón",
    "operation": "Venta",
    "propertyType": "PH",
    "priceUsd": 135000,
    "priceDisplay": "USD 135.000",
    "featured": false,
    "bedrooms": 2,
    "bathrooms": 1,
    "environments": 3,
    "surfaceTotal": 200,
    "surfaceCovered": 160,
    "description": "📍 DOS CASAS ESTILO PH | A 5 CUADRAS DE LA ESTACIÓN MORON\r\n\r\n• Planta Baja:\r\n• 2 dormitorios amplios.\r\n• Baño completo, cocina-comedor.\r\n• Living-comedor espacioso.\r\n• Patio grande para disfrutar.\r\n\r\n• Planta Alta:\r\n• Baño completo.\r\n• Cocina grande y comedor.\r\n• Dormitorios amplios.\r\n• Patio terraza para aprovechar al aire libre.\r\n\r\n• Garage para un auto.\r\n\r\nDos propiedades independientes: Planta Baja y Planta Alta, ambas muy cómodas y en impecable estado.\r\n\r\n¡Ideal para dos familias! Consultanos para más información.",
    "features": [
      "2 Dormitorios",
      "1 Baño",
      "3 Ambientes",
      "200 m² Superficie",
      "2 dormitorios amplios",
      "Baño completo, cocina-comedor",
      "Living-comedor espacioso",
      "Patio grande para disfrutar"
    ],
    "image": "https://static.kiteprop.com/kp/properties/117123/7927b3/lg/7927b3df35e5a79b6e9be70da742dc8d.jpg",
    "gallery": [
      "https://static.kiteprop.com/kp/properties/117123/7927b3/lg/7927b3df35e5a79b6e9be70da742dc8d.jpg",
      "https://static.kiteprop.com/kp/properties/117123/2132cc/lg/2132cc8dcdf904cb8a75d660561fb7e2.jpg",
      "https://static.kiteprop.com/kp/properties/117123/8cb476/lg/8cb476371f263dfb7a9dd8ffe3b0ff53.jpg",
      "https://static.kiteprop.com/kp/properties/117123/efa594/lg/efa594376a9ff658fd1406fa8c6ecab1.jpg",
      "https://static.kiteprop.com/kp/properties/117123/072d1f/lg/072d1fd7c2e2e7e39887ff50d08286a0.jpg",
      "https://static.kiteprop.com/kp/properties/117123/96a50d/lg/96a50d7fd83bc399678d17a866c8536f.jpg",
      "https://static.kiteprop.com/kp/properties/117123/621079/lg/6210798eea73bdabbeb0220dfd270e48.jpg",
      "https://static.kiteprop.com/kp/properties/117123/abb0dc/lg/abb0dc55130776514e5031564b6e7ff0.jpg",
      "https://static.kiteprop.com/kp/properties/117123/1bd324/lg/1bd324d29a10603d83c7ac7abecff44b.jpg",
      "https://static.kiteprop.com/kp/properties/117123/fe2c99/lg/fe2c995d6c8704905826eea3bc845208.jpg",
      "https://static.kiteprop.com/kp/properties/117123/e8eee4/lg/e8eee40097e83197f8760924882e2dc4.jpg",
      "https://static.kiteprop.com/kp/properties/117123/d074bf/lg/d074bf860b37c3cf97cba764658f0c82.jpg",
      "https://static.kiteprop.com/kp/properties/117123/a86b99/lg/a86b997104f2a78f3694b4cb934a0e64.jpg",
      "https://static.kiteprop.com/kp/properties/117123/efe4ab/lg/efe4ab0b5d55db86406e0e2b1a6f9107.jpg"
    ],
    "originalUrl": "https://devorafernandezpropiedades.kitepropcrm.com/site/properties/117123/dos-casas-estilo-ph-moron-a-5-cuadras-de-la-estacion"
  }
];
