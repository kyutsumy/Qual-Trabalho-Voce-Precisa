const token = localStorage.getItem('token');

const navButtons = document.querySelector('.nav-buttons');

let publicServices = [];
let filteredServices = [];
let currentUser = null;
let filterScrollTimer = null;
let alreadyScrolledByFilter = false;

/* ELEMENTOS FILTROS */

const searchInput = document.getElementById('searchInput');
const categoryFilter = document.getElementById('categoryFilter');
const cityFilter = document.getElementById('cityFilter');
const priceTypeFilter = document.getElementById('priceTypeFilter');
const sortFilter = document.getElementById('sortFilter');
const filterResultCount = document.getElementById('filterResultCount');

/* NAVBAR DINÂMICA */

async function setupNavbar() {
  if (!token) {
    navButtons.innerHTML = `
      <a href="/pages/login.html" class="login-link">
        Entrar
      </a>
    `;

    return;
  }

  let isAdmin = false;

  try {
    const profileResponse = await fetch(`${API_URL}/profile`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const profileData = await profileResponse.json();

    if (profileData.success) {
      currentUser = profileData.user;
    }

    const adminResponse = await fetch(`${API_URL}/admin/check`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const adminData = await adminResponse.json();

    isAdmin = adminData.success && adminData.isAdmin;
  } catch (err) {
    console.error('Erro ao carregar menu:', err);
  }

  const name = escapeHtml(currentUser?.name || 'Usuário');
  const email = escapeHtml(currentUser?.email || '');
  const profession = escapeHtml(currentUser?.profession || 'Sem profissão');
  const avatar = currentUser?.avatarUrl || '';
  const color = currentUser?.profileColor || '#ff6b6b';

  navButtons.innerHTML = `
    <div class="user-menu">
      <button class="user-menu-button" onclick="toggleUserMenu()">
        <div
          class="user-menu-avatar"
          style="${avatar ? `background-image: url('${avatar}')` : ''}"
        ></div>

        <span style="color: ${color};">
          ${name}
        </span>

        <span class="user-menu-arrow">▾</span>
      </button>

      <div id="userMenuDropdown" class="user-menu-dropdown">
        <div class="user-menu-preview">
          <div
            class="user-menu-preview-avatar"
            style="${avatar ? `background-image: url('${avatar}')` : ''}"
          ></div>

          <div>
            <strong style="color: ${color};">${name}</strong>
            <span>${profession}</span>
            <small>${email}</small>
          </div>
        </div>

        <a href="/pages/dashboard.html">
          Dashboard
        </a>

        <a href="/pages/create-service.html">
          Criar Serviço
        </a>

        <a href="/pages/profile.html">
          Editar Perfil
        </a>

        ${
          isAdmin
            ? `
              <a href="/pages/admin-demo.html">
                Painel Admin
              </a>
            `
            : ''
        }

        <button onclick="logout()">
          Sair
        </button>
      </div>
    </div>
  `;
}

setupNavbar();

/* MENU DO USUÁRIO */

function toggleUserMenu() {
  const menu = document.getElementById('userMenuDropdown');
  const wrapper = document.querySelector('.user-menu');

  if (!menu || !wrapper) return;

  menu.classList.toggle('show');
  wrapper.classList.toggle('open');
}

document.addEventListener('click', (event) => {
  const wrapper = document.querySelector('.user-menu');

  if (wrapper && !wrapper.contains(event.target)) {
    document.getElementById('userMenuDropdown')?.classList.remove('show');
    wrapper.classList.remove('open');
  }
});

/* LOGOUT */

function logout() {
  localStorage.removeItem('token');
  window.location.href = '/pages/home.html';
}

function renderServiceSkeletons(amount = 6) {
  const servicesGrid = document.getElementById('servicesGrid');

  if (!servicesGrid) return;

  servicesGrid.innerHTML = Array.from({ length: amount })
    .map(
      () => `
        <div class="skeleton-card">
          <div class="skeleton-top">
            <div class="skeleton-circle"></div>

            <div class="skeleton-info">
              <div class="skeleton-line name"></div>
              <div class="skeleton-line profession"></div>
            </div>
          </div>

          <div class="skeleton-line title"></div>

          <div class="skeleton-line text"></div>
          <div class="skeleton-line text"></div>
          <div class="skeleton-line text short"></div>

          <div class="skeleton-bottom">
            <div class="skeleton-line price"></div>
            <div class="skeleton-button"></div>
          </div>
        </div>
      `
    )
    .join('');
}

/* CARREGAR SERVIÇOS */

async function loadServices() {
  const grid = document.getElementById('servicesGrid');

  if (!grid) return;

  try {
    renderServiceSkeletons();

    const res = await fetch(`${API_URL}/services/public`);
    const data = await res.json();

    if (!data.success) {
      grid.innerHTML = `
        <div class="empty-services">
          Não foi possível carregar os serviços.
        </div>
      `;

      updateResultCount(0);

      if (typeof showToast === 'function') {
        showToast('Não foi possível carregar os serviços.', 'error');
      }

      return;
    }

    publicServices = data.services || [];

    setupFilters();

    applyFilters();
  } catch (err) {
    console.error(err);

    grid.innerHTML = `
      <div class="empty-services">
        Erro ao carregar serviços.
      </div>
    `;

    updateResultCount(0);

    if (typeof showToast === 'function') {
      showToast('Erro de conexão ao carregar serviços.', 'error');
    }
  }
}

loadServices();

/* RENDERIZAR SERVIÇOS */

function renderServices(services) {
  const grid = document.getElementById('servicesGrid');

  if (!grid) return;

  filteredServices = services;

  if (services.length === 0) {
    grid.innerHTML = `
      <div class="empty-services">
        Nenhum serviço encontrado.
      </div>
    `;

    updateResultCount(0);

    return;
  }

  grid.innerHTML = services
    .map((service, index) => {
      const title = escapeHtml(service.title || 'Serviço');
      const category = escapeHtml(service.category || 'Sem categoria');
      const fullDescription = String(service.description || 'Sem descrição');
      const price = escapeHtml(formatServicePrice(service));
      const city = escapeHtml(service.city || 'Cidade não informada');
      const area = escapeHtml(service.area || '');
      const ownerName = escapeHtml(service.ownerName || 'Prestador');
      const ownerAvatar = service.ownerAvatar || '';
      const ownerColor = service.ownerColor || '#ff6b6b';
      const encodedEmail = encodeURIComponent(service.userEmail || '');

      const previewData = getDescriptionPreview(fullDescription, 120);

      return `
        <div class="professional-card">
          <button
            type="button"
            class="card-owner"
            onclick="openProfileModal('${encodedEmail}')"
            style="
              --owner-color: ${ownerColor};
              --owner-color-bg: ${ownerColor}1f;
              --owner-color-border: ${ownerColor}55;
            "
          >
            ${ownerName}
          </button>

          <button
            type="button"
            class="avatar"
            onclick="openProfileModal('${encodedEmail}')"
            style="${ownerAvatar ? `background-image: url('${ownerAvatar}')` : ''}"
          ></button>

          <div class="card-content">
            <h3>${title}</h3>

            <span class="service-category">${category}</span>

            <div class="description-box">
              <p class="service-description">
                <span class="description-text">${escapeHtml(previewData.preview)}</span>${
                  previewData.needsMore
                    ? `<button
                        type="button"
                        class="see-more-btn inline"
                        onclick="openDescriptionModal(${index})"
                      >Ver mais</button>`
                    : ''
                }
              </p>
            </div>

            <div class="card-footer-area">
              <div class="service-info">
                <strong>${price}</strong>
                <small>${city}${area ? ' • ' + area : ''}</small>
              </div>

              <button
                class="hire-btn"
                onclick="hireService('${service._id}')"
              >
                Contratar
              </button>
            </div>
          </div>
        </div>
      `;
    })
    .join('');

  updateResultCount(services.length);
}

/* FILTROS */

function setupFilters() {
  const filterElements = [
    searchInput,
    categoryFilter,
    cityFilter,
    priceTypeFilter,
    sortFilter,
  ];

  filterElements.forEach((element) => {
    if (!element) return;

    element.removeEventListener('input', applyFilters);
    element.removeEventListener('change', applyFilters);

    element.addEventListener('input', applyFilters);
    element.addEventListener('change', applyFilters);
  });
}

function applyFilters() {
  const searchTerm = normalizeText(searchInput?.value || '');
  const selectedCategory = normalizeText(categoryFilter?.value || '');
  const selectedCity = normalizeText(cityFilter?.value || '');
  const selectedPriceType = priceTypeFilter?.value || '';
  const selectedSort = sortFilter?.value || 'recent';

  let services = publicServices.filter((service) => {
    const searchableText = normalizeText(
      [
        service.title,
        service.category,
        service.description,
        service.city,
        service.area,
        service.ownerName,
        service.profession,
      ]
        .filter(Boolean)
        .join(' ')
    );

    const serviceCategory = normalizeText(service.category || '');
    const serviceCity = normalizeText(service.city || '');
    const serviceArea = normalizeText(service.area || '');
    const servicePriceType = service.priceType || 'fixed';

    const matchesSearch = !searchTerm || searchableText.includes(searchTerm);

    const matchesCategory =
      !selectedCategory ||
      serviceCategory === selectedCategory ||
      serviceCategory.includes(selectedCategory);

    const matchesCity =
      !selectedCity ||
      serviceCity.includes(selectedCity) ||
      serviceArea.includes(selectedCity);

    const matchesPriceType =
      !selectedPriceType || servicePriceType === selectedPriceType;

    return matchesSearch && matchesCategory && matchesCity && matchesPriceType;
  });

  services = sortServices(services, selectedSort);

  renderServices(services);
  scrollToServicesByFilter();
}

/* PAINEL DE FILTROS */

function toggleFilterPanel() {
  const panel = document.getElementById('filterPanel');

  if (!panel) return;

  panel.classList.toggle('show');
}

function sortServices(services, sortType) {
  const sorted = [...services];

  if (sortType === 'recent') {
    sorted.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();

      return dateB - dateA;
    });
  }

  if (sortType === 'lowest') {
    sorted.sort((a, b) => getServiceSortPrice(a) - getServiceSortPrice(b));
  }

  if (sortType === 'highest') {
    sorted.sort((a, b) => getServiceSortPrice(b) - getServiceSortPrice(a));
  }

  if (sortType === 'az') {
    sorted.sort((a, b) => {
      const titleA = normalizeText(a.title || '');
      const titleB = normalizeText(b.title || '');

      return titleA.localeCompare(titleB);
    });
  }

  return sorted;
}

function clearFilters() {
  if (searchInput) searchInput.value = '';
  if (categoryFilter) categoryFilter.value = '';
  if (cityFilter) cityFilter.value = '';
  if (priceTypeFilter) priceTypeFilter.value = '';
  if (sortFilter) sortFilter.value = 'recent';

  alreadyScrolledByFilter = false;

  applyFilters();
}

function quickCategoryFilter(category) {
  if (categoryFilter) {
    categoryFilter.value = category;
  }

  alreadyScrolledByFilter = false;

  applyFilters();
}

function updateResultCount(total) {
  if (!filterResultCount) return;

  filterResultCount.textContent =
    total === 1 ? '1 serviço' : `${total} serviços`;
}

function normalizeText(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/* SCROLL AO FILTRAR */

function scrollToServicesByFilter() {
  clearTimeout(filterScrollTimer);

  filterScrollTimer = setTimeout(() => {
    const hasSearch = searchInput?.value.trim();
    const hasCategory = categoryFilter?.value;
    const hasCity = cityFilter?.value.trim();
    const hasPriceType = priceTypeFilter?.value;
    const hasSortChanged = sortFilter?.value && sortFilter.value !== 'recent';

    const hasAnyFilter =
      hasSearch || hasCategory || hasCity || hasPriceType || hasSortChanged;

    if (!hasAnyFilter) {
      alreadyScrolledByFilter = false;
      return;
    }

    if (alreadyScrolledByFilter) return;

    alreadyScrolledByFilter = true;

    scrollToServices();
  }, 250);
}

/* DESCRIÇÃO RESUMIDA */

function getDescriptionPreview(text, maxLength = 120) {
  const cleanText = String(text).trim().replace(/\s+/g, ' ');

  if (cleanText.length <= maxLength) {
    return {
      preview: cleanText,
      needsMore: false,
    };
  }

  return {
    preview: cleanText.slice(0, maxLength).trimEnd() + '...',
    needsMore: true,
  };
}

/* MODAL DESCRIÇÃO */

function openDescriptionModal(index) {
  const service = filteredServices[index];

  if (!service) return;

  const modal = document.getElementById('descriptionModal');
  const modalTitle = document.getElementById('modalTitle');
  const modalDescription = document.getElementById('modalDescription');

  if (!modal || !modalTitle || !modalDescription) return;

  modalTitle.textContent = service.title || 'Descrição do serviço';
  modalDescription.textContent =
    service.description || 'Sem descrição disponível.';

  modal.classList.add('show');
}

function closeDescriptionModal() {
  const modal = document.getElementById('descriptionModal');

  if (!modal) return;

  modal.classList.remove('show');
}

/* PERFIL PÚBLICO */

async function openProfileModal(encodedEmail) {
  const modal = document.getElementById('profileModal');

  const avatar = document.getElementById('profileModalAvatar');
  const name = document.getElementById('profileModalName');
  const profession = document.getElementById('profileModalProfession');
  const city = document.getElementById('profileModalCity');
  const bio = document.getElementById('profileModalBio');
  const servicesList = document.getElementById('profileModalServicesList');

  if (!modal) return;

  if (!encodedEmail) {
    modal.classList.add('show');

    name.textContent = 'Perfil indisponível';
    profession.textContent = '';
    city.textContent = '';
    bio.textContent = 'Esse serviço ainda não possui um perfil vinculado.';
    servicesList.innerHTML = '';

    return;
  }

  modal.classList.add('show');

  avatar.style.backgroundImage = '';
  avatar.style.backgroundColor = 'var(--surface-3)';

  name.textContent = 'Carregando...';
  profession.textContent = '';
  city.textContent = '';
  bio.textContent = '';
  servicesList.innerHTML =
    '<p class="profile-loading">Carregando serviços...</p>';

  try {
    const response = await fetch(`${API_URL}/public-profile/${encodedEmail}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Erro ao carregar perfil.');
    }

    const profile = data.profile;
    const profileServices = data.services || [];

    name.textContent = profile.name;
    profession.textContent = profile.profession;
    city.textContent = profile.city;
    bio.textContent = profile.bio;

    avatar.style.backgroundColor = profile.profileColor || '#5865f2';

    if (profile.avatarUrl) {
      avatar.style.backgroundImage = `url('${profile.avatarUrl}')`;
    }

    if (!profileServices.length) {
      servicesList.innerHTML = `
        <p class="profile-empty">
          Esse usuário ainda não publicou serviços.
        </p>
      `;

      return;
    }

    servicesList.innerHTML = profileServices
      .map((service) => {
        return `
          <div class="profile-service-item">
            <strong>${escapeHtml(service.title || 'Serviço')}</strong>
            <span>${escapeHtml(service.category || 'Categoria')}</span>
            <small>${escapeHtml(formatServicePrice(service))}</small>
          </div>
        `;
      })
      .join('');
  } catch (error) {
    name.textContent = 'Erro ao carregar perfil';
    profession.textContent = '';
    city.textContent = '';
    bio.textContent = error.message;

    servicesList.innerHTML = '';
  }
}

function closeProfileModal() {
  const modal = document.getElementById('profileModal');

  if (!modal) return;

  modal.classList.remove('show');
}

/* CONTRATAR SERVIÇO */

let selectedServiceToHire = null;

function hireService(serviceId) {
  const token = localStorage.getItem('token');

  if (!token) {
    localStorage.setItem('redirectAfterLogin', window.location.href);
    window.location.href = '/pages/login.html';
    return;
  }

  selectedServiceToHire = serviceId;

  const service = publicServices.find((item) => item._id === serviceId);
  const text = document.getElementById('hireConfirmText');

  if (text) {
    text.textContent = service
      ? `Deseja realmente contratar o serviço "${service.title}"?`
      : 'Deseja realmente contratar este serviço?';
  }

  document.getElementById('hireConfirmModal')?.classList.add('show');
}

function closeHireConfirmModal() {
  selectedServiceToHire = null;
  document.getElementById('hireConfirmModal')?.classList.remove('show');
}

async function confirmHireService() {
  if (!selectedServiceToHire) return;

  const token = localStorage.getItem('token');
  const confirmBtn = document.querySelector('.modal-confirm-btn');

  try {
    if (confirmBtn) {
      confirmBtn.disabled = true;
      confirmBtn.textContent = 'Enviando...';
    }

    const response = await fetch(`${API_URL}/order`, {
      method: 'POST',

      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },

      body: JSON.stringify({
        serviceId: selectedServiceToHire,
      }),
    });

    const data = await response.json();

    closeHireConfirmModal();

    if (data.success) {
      showFeedbackModal(
        '✅',
        'Pedido enviado!',
        data.message || 'Seu pedido foi enviado com sucesso.'
      );
    } else {
      showFeedbackModal(
        '⚠️',
        'Não foi possível contratar',
        data.message || 'Ocorreu um erro ao enviar o pedido.'
      );
    }
  } catch (err) {
    console.error(err);

    closeHireConfirmModal();

    showFeedbackModal(
      '⚠️',
      'Erro de conexão',
      'Não foi possível enviar o pedido agora.'
    );
  } finally {
    if (confirmBtn) {
      confirmBtn.disabled = false;
      confirmBtn.textContent = 'Sim, contratar';
    }

    selectedServiceToHire = null;
  }
}

function showFeedbackModal(icon, title, text) {
  const modal = document.getElementById('feedbackModal');
  const feedbackIcon = document.getElementById('feedbackIcon');
  const feedbackTitle = document.getElementById('feedbackTitle');
  const feedbackText = document.getElementById('feedbackText');

  if (feedbackIcon) feedbackIcon.textContent = icon;
  if (feedbackTitle) feedbackTitle.textContent = title;
  if (feedbackText) feedbackText.textContent = text;

  modal?.classList.add('show');
}

function closeFeedbackModal() {
  document.getElementById('feedbackModal')?.classList.remove('show');
}

/* PREÇO */

function formatServicePrice(service) {
  if (service.priceType === 'variable') {
    const min = formatMoneyFromCents(service.priceMinInCents || 0);
    const max = formatMoneyFromCents(service.priceMaxInCents || 0);

    return `${min} - ${max}`;
  }

  if (service.priceInCents) {
    return formatMoneyFromCents(service.priceInCents);
  }

  return service.price || 'Preço não informado';
}

function formatMoneyFromCents(cents) {
  return (Number(cents || 0) / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function getServiceSortPrice(service) {
  if (service.priceType === 'variable') {
    return Number(service.priceMinInCents || service.priceMaxInCents || 0);
  }

  return Number(service.priceInCents || 0);
}

/* SCROLL SERVIÇOS */

function scrollToServices() {
  const servicesSection = document.getElementById('servicesSection');

  if (!servicesSection) return;

  const navbarOffset = 60;

  const targetPosition =
    servicesSection.getBoundingClientRect().top +
    window.pageYOffset -
    navbarOffset;

  smoothScrollTo(targetPosition, 850);
}

function smoothScrollTo(targetPosition, duration) {
  const startPosition = window.pageYOffset;
  const distance = targetPosition - startPosition;
  let startTime = null;

  function animation(currentTime) {
    if (startTime === null) {
      startTime = currentTime;
    }

    const elapsedTime = currentTime - startTime;
    const progress = Math.min(elapsedTime / duration, 1);

    const ease = easeInOutCubic(progress);

    window.scrollTo(0, startPosition + distance * ease);

    if (elapsedTime < duration) {
      requestAnimationFrame(animation);
    }
  }

  requestAnimationFrame(animation);
}

function easeInOutCubic(t) {
  if (t < 0.5) {
    return 4 * t * t * t;
  }

  return 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/* FECHAR MODAIS */

document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;

  const descriptionModal = document.getElementById('descriptionModal');
  const profileModal = document.getElementById('profileModal');

  if (descriptionModal?.classList.contains('show')) {
    closeDescriptionModal();
  }

  if (profileModal?.classList.contains('show')) {
    closeProfileModal();
  }
});

document
  .getElementById('descriptionModal')
  ?.addEventListener('click', (event) => {
    if (event.target.id === 'descriptionModal') {
      closeDescriptionModal();
    }
  });

document.getElementById('profileModal')?.addEventListener('click', (event) => {
  if (event.target.id === 'profileModal') {
    closeProfileModal();
  }
});

document.addEventListener('click', (event) => {
  const navSearch = document.querySelector('.nav-search');
  const panel = document.getElementById('filterPanel');

  if (!navSearch || !panel) return;

  if (!navSearch.contains(event.target)) {
    panel.classList.remove('show');
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;

  closeHireConfirmModal();
  closeFeedbackModal();
});

document
  .getElementById('hireConfirmModal')
  ?.addEventListener('click', (event) => {
    if (event.target.id === 'hireConfirmModal') {
      closeHireConfirmModal();
    }
  });

document.getElementById('feedbackModal')?.addEventListener('click', (event) => {
  if (event.target.id === 'feedbackModal') {
    closeFeedbackModal();
  }
});

/* VOLTAR AO TOPO */

function scrollToTop() {
  window.scrollTo({
    top: 0,
    behavior: 'smooth',
  });
}

function handleBackToTopButton() {
  const button = document.getElementById('backToTopBtn');

  if (!button) return;

  if (window.scrollY > 450) {
    button.classList.add('show');
  } else {
    button.classList.remove('show');
  }
}

window.addEventListener('scroll', handleBackToTopButton);
window.addEventListener('load', handleBackToTopButton);

window.scrollToTop = scrollToTop;

/* SEGURANÇA */

function escapeHtml(text) {
  return String(text || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
