const token = localStorage.getItem('token');

if (!token) {
  localStorage.setItem('redirectAfterLogin', window.location.href);
  window.location.href = '/pages/login.html';
}

let dashboardData = null;
let selectedService = null;
let pendingAction = null;

let editPriceMode = '';
let editPriceInCents = 0;
let editPriceMinInCents = 0;
let editPriceMaxInCents = 0;

/* ELEMENTS */

const editServiceId = document.getElementById('editServiceId');
const editTitle = document.getElementById('editTitle');
const editCategory = document.getElementById('editCategory');
const editCustomCategoryBox = document.getElementById('editCustomCategoryBox');
const editCustomCategory = document.getElementById('editCustomCategory');

const editPriceTypeButton = document.getElementById('editPriceTypeButton');
const editPriceTypeMenu = document.getElementById('editPriceTypeMenu');
const editPricePlaceholder = document.getElementById('editPricePlaceholder');
const editFixedPriceBox = document.getElementById('editFixedPriceBox');
const editVariablePriceBox = document.getElementById('editVariablePriceBox');
const editPrice = document.getElementById('editPrice');
const editPriceMin = document.getElementById('editPriceMin');
const editPriceMax = document.getElementById('editPriceMax');

const editCity = document.getElementById('editCity');
const editArea = document.getElementById('editArea');
const editDescription = document.getElementById('editDescription');

const editTitleCounter = document.getElementById('editTitleCounter');
const editDescriptionCounter = document.getElementById(
  'editDescriptionCounter'
);

/* LOAD DASHBOARD */

async function loadDashboard() {
  try {
    const response = await fetch(`${API_URL}/dashboard`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!data.success) {
      showToast(data.message || 'Erro ao carregar dashboard', 'error');
      window.location.href = '/pages/login.html';
      return;
    }

    dashboardData = data;

    renderUser(data.user);
    renderStats(data);
    renderServiceManager(data.services || []);
    renderOrders(data.orders || [], data.user);
  } catch (err) {
    console.error(err);
    showToast('Erro ao carregar dashboard', 'error');
  }
}

loadDashboard();

/* USER */

function renderUser(user) {
  document.getElementById('userName').innerText = user?.name || 'Usuário';

  document.getElementById('userEmail').innerText =
    user?.email || 'email não encontrado';

  const dashboardAvatar = document.getElementById('dashboardAvatar');

  if (user?.avatarUrl) {
    dashboardAvatar.style.backgroundImage = `url("${user.avatarUrl}")`;
  } else {
    dashboardAvatar.style.backgroundImage = '';
  }
}

/* STATS */

function renderStats(data) {
  const services = data.services || [];
  const orders = data.orders || [];
  const userEmail = data.user?.email;

  const receivedOrders = orders.filter((order) => {
    return order.providerEmail === userEmail;
  });

  const madeOrders = orders.filter((order) => {
    return order.clientEmail === userEmail;
  });

  document.getElementById('servicesCount').innerText = services.length;
  document.getElementById('receivedOrdersCount').innerText =
    receivedOrders.length;
  document.getElementById('madeOrdersCount').innerText = madeOrders.length;
}

/* SERVICE MANAGER */

function renderServiceManager(services) {
  const container = document.getElementById('serviceManagerList');
  const counter = document.getElementById('serviceListCount');

  counter.innerText = services.length;

  if (!services.length) {
    container.innerHTML = `
      <div class="empty-card">
        Você ainda não publicou nenhum serviço.
      </div>
    `;

    clearServiceEditor();
    return;
  }

  container.innerHTML = services
    .map((service, index) => {
      const title = escapeHtml(service.title || 'Serviço');
      const category = escapeHtml(service.category || 'Sem categoria');
      const price = escapeHtml(service.price || 'R$ 0,00');

      const activeClass =
        selectedService && selectedService._id === service._id ? 'active' : '';

      return `
        <button
          class="service-item ${activeClass}"
          onclick="selectService(${index})"
        >
          <strong>${title}</strong>
          <span>${category}</span>
          <small>${price}</small>
        </button>
      `;
    })
    .join('');

  if (selectedService) {
    const updatedSelected = services.find((service) => {
      return service._id === selectedService._id;
    });

    if (updatedSelected) {
      selectedService = updatedSelected;
      fillServiceEditor(updatedSelected);
    } else {
      clearServiceEditor();
    }
  }
}

function selectService(index) {
  const service = dashboardData.services[index];

  if (!service) return;

  selectedService = service;

  renderServiceManager(dashboardData.services || []);
  fillServiceEditor(service);
}

function fillServiceEditor(service) {
  document.getElementById('editorEmpty').style.display = 'none';
  document.getElementById('serviceEditor').classList.add('show');

  editServiceId.value = service._id || '';

  editTitle.value = service.title || '';
  editCity.value = service.city || '';
  editArea.value = service.area || '';
  editDescription.value = service.description || '';

  setEditCategoryValue(service.category || '');

  updateEditorCounters();

  if (service.priceType === 'variable') {
    setEditPriceMode('variable');

    editPriceMinInCents = Number(service.priceMinInCents) || 0;
    editPriceMaxInCents = Number(service.priceMaxInCents) || 0;

    editPriceMin.value = editPriceMinInCents
      ? formatPrice(editPriceMinInCents)
      : '';

    editPriceMax.value = editPriceMaxInCents
      ? formatPrice(editPriceMaxInCents)
      : '';
  } else {
    setEditPriceMode('fixed');

    editPriceInCents = Number(service.priceInCents) || 0;

    editPrice.value = editPriceInCents ? formatPrice(editPriceInCents) : '';
  }
}

function clearServiceEditor() {
  selectedService = null;

  document.getElementById('editorEmpty').style.display = 'flex';
  document.getElementById('serviceEditor').classList.remove('show');

  editServiceId.value = '';
}

/* EDIT COUNTERS */

editTitle.addEventListener('input', updateEditorCounters);
editDescription.addEventListener('input', updateEditorCounters);

function updateEditorCounters() {
  editTitleCounter.textContent = `${editTitle.value.length}/50`;
  editDescriptionCounter.textContent = `${editDescription.value.length}/1000`;
}

/* EDIT CATEGORY */

editCategory.addEventListener('change', () => {
  if (editCategory.value === 'Outros') {
    editCategory.style.display = 'none';
    editCustomCategoryBox.style.display = 'flex';
    editCustomCategory.focus();
  }
});

function backToEditCategoryList() {
  editCustomCategory.value = '';
  editCustomCategoryBox.style.display = 'none';
  editCategory.style.display = 'block';
  editCategory.value = '';
}

function setEditCategoryValue(category) {
  const options = [...editCategory.options].map((option) => option.value);

  if (options.includes(category)) {
    editCategory.style.display = 'block';
    editCustomCategoryBox.style.display = 'none';
    editCategory.value = category;
    editCustomCategory.value = '';
  } else {
    editCategory.style.display = 'none';
    editCustomCategoryBox.style.display = 'flex';
    editCategory.value = 'Outros';
    editCustomCategory.value = category;
  }
}

/* EDIT PRICE */

function toggleEditPriceTypeMenu() {
  const dropdown = document.querySelector('.price-type-dropdown');

  editPriceTypeMenu.classList.toggle('show');
  dropdown.classList.toggle('open');
}

document.addEventListener('click', (event) => {
  const dropdown = document.querySelector('.price-type-dropdown');

  if (dropdown && !dropdown.contains(event.target)) {
    editPriceTypeMenu.classList.remove('show');
    dropdown.classList.remove('open');
  }
});

function setEditPriceMode(mode) {
  editPriceMode = mode;

  editPricePlaceholder.style.display = 'none';
  editFixedPriceBox.style.display = 'none';
  editVariablePriceBox.style.display = 'none';

  editPriceTypeButton.classList.remove('fixed-selected', 'variable-selected');

  if (mode === 'fixed') {
    editFixedPriceBox.style.display = 'flex';
    editPriceTypeButton.textContent = 'Fixo';
    editPriceTypeButton.classList.add('fixed-selected');
  }

  if (mode === 'variable') {
    editVariablePriceBox.style.display = 'flex';
    editPriceTypeButton.textContent = 'Variável';
    editPriceTypeButton.classList.add('variable-selected');
  }

  editPriceTypeMenu.classList.remove('show');

  document.querySelector('.price-type-dropdown').classList.remove('open');
}

editPrice.addEventListener('input', () => {
  editPriceInCents = handlePriceInput(editPrice);
});

editPriceMin.addEventListener('input', () => {
  editPriceMinInCents = handlePriceInput(editPriceMin);
});

editPriceMax.addEventListener('input', () => {
  editPriceMaxInCents = handlePriceInput(editPriceMax);
});

function handlePriceInput(input) {
  let onlyNumbers = input.value.replace(/\D/g, '');

  if (!onlyNumbers) {
    input.value = '0,00';
    return 0;
  }

  let cents = Number(onlyNumbers);

  const maxInCents = 2500000;

  if (cents > maxInCents) {
    cents = maxInCents;
  }

  input.value = formatPrice(cents);

  return cents;
}

function formatPrice(cents) {
  const value = cents / 100;

  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/* SAVE SERVICE */

async function saveServiceChanges() {
  const serviceId = editServiceId.value;

  if (!serviceId) {
    showToast('Selecione um serviço para editar.', 'warning');
    return;
  }

  const title = editTitle.value.trim();

  let category = editCategory.value;

  if (editCategory.style.display === 'none') {
    category = editCustomCategory.value.trim();
  }

  const city = editCity.value.trim();
  const area = editArea.value.trim();
  const description = editDescription.value.trim();

  if (!title || !category || !city || !description) {
    showToast('Preencha todos os campos obrigatórios.', 'error');
    return;
  }

  let price = '';

  if (editPriceMode === 'fixed') {
    if (editPriceInCents <= 0) {
      showToast('Digite um preço válido.', 'error');
      return;
    }

    price = `R$ ${formatPrice(editPriceInCents)}`;
  }

  if (editPriceMode === 'variable') {
    if (editPriceMinInCents <= 0 || editPriceMaxInCents <= 0) {
      showToast('Digite o preço mínimo e o preço máximo.', 'error');
      return;
    }

    if (editPriceMinInCents > editPriceMaxInCents) {
      showToast(
        'O preço mínimo não pode ser maior que o preço máximo.',
        'error'
      );
      return;
    }

    price = `R$ ${formatPrice(editPriceMinInCents)} - R$ ${formatPrice(
      editPriceMaxInCents
    )}`;
  }

  const response = await fetch(`${API_URL}/services/${serviceId}`, {
    method: 'PUT',

    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },

    body: JSON.stringify({
      title,
      category,
      description,
      price,
      priceType: editPriceMode,
      priceInCents: editPriceMode === 'fixed' ? editPriceInCents : 0,
      priceMinInCents: editPriceMode === 'variable' ? editPriceMinInCents : 0,
      priceMaxInCents: editPriceMode === 'variable' ? editPriceMaxInCents : 0,
      city,
      area,
    }),
  });

  const data = await response.json();

  if (data.success) {
    showToast('Serviço atualizado com sucesso!', 'success');
    await loadDashboard();
  } else {
    showToast(data.message || 'Erro ao salvar alterações.', 'error');
  }
}

/* DELETE SERVICE */

function openDeleteServiceModal() {
  if (!selectedService) {
    showToast('Selecione um serviço para excluir.', 'warning');
    return;
  }

  pendingAction = {
    type: 'delete-service',
    serviceId: selectedService._id,
  };

  document.getElementById('confirmMessage').textContent =
    'Tem certeza que deseja excluir este serviço? Os pedidos ligados a ele serão cancelados.';

  document.getElementById('confirmModal').classList.add('show');
}

async function deleteSelectedService(serviceId) {
  const response = await fetch(`${API_URL}/services/${serviceId}`, {
    method: 'DELETE',

    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (data.success) {
    selectedService = null;
    await loadDashboard();
  } else {
    showToast(data.message || 'Erro ao excluir serviço.', 'error');
  }
}

/* ORDERS */

function renderOrders(orders, user) {
  const userEmail = user?.email;

  const receivedOrders = orders.filter((order) => {
    return order.providerEmail === userEmail;
  });

  const madeOrders = orders.filter((order) => {
    return order.clientEmail === userEmail;
  });

  renderReceivedOrders(receivedOrders);
  renderMadeOrders(madeOrders);
}

function renderReceivedOrders(orders) {
  const container = document.getElementById('receivedOrders');

  if (!orders.length) {
    container.innerHTML = `
      <div class="empty-card">
        Nenhum pedido recebido ainda.
      </div>
    `;

    return;
  }

  container.innerHTML = orders
    .map((order) => {
      const title = escapeHtml(order.serviceTitle || 'Serviço');
      const clientEmail = escapeHtml(order.clientEmail || 'Cliente');
      const status = order.status || 'pendente';

      return `
        <div class="card">
          <div class="card-top">
            <div>
              <h3>${title}</h3>
              <span>Cliente: ${clientEmail}</span>
            </div>

            <div class="status ${status}">
              ${formatStatus(status)}
            </div>
          </div>

          ${renderOrderActions(order)}
        </div>
      `;
    })
    .join('');
}

function renderMadeOrders(orders) {
  const container = document.getElementById('madeOrders');

  if (!orders.length) {
    container.innerHTML = `
      <div class="empty-card">
        Você ainda não contratou nenhum serviço.
      </div>
    `;

    return;
  }

  container.innerHTML = orders
    .map((order) => {
      const title = escapeHtml(order.serviceTitle || 'Serviço');
      const providerEmail = escapeHtml(order.providerEmail || 'Prestador');
      const status = order.status || 'pendente';

      return `
        <div class="card">
          <div class="card-top">
            <div>
              <h3>${title}</h3>
              <span>Prestador: ${providerEmail}</span>
            </div>

            <div class="status ${status}">
              ${formatStatus(status)}
            </div>
          </div>
        </div>
      `;
    })
    .join('');
}

/* ORDER ACTIONS */

function renderOrderActions(order) {
  const status = order.status || 'pendente';

  if (status === 'concluido' || status === 'cancelado') {
    return '';
  }

  if (status === 'pendente') {
    return `
      <div class="order-actions">
        <button
          class="action-btn accept"
          onclick="openStatusModal('${order._id}', 'aceito')"
        >
          Aceitar
        </button>

        <button
          class="action-btn cancel"
          onclick="openStatusModal('${order._id}', 'cancelado')"
        >
          Cancelar
        </button>
      </div>
    `;
  }

  if (status === 'aceito') {
    return `
      <div class="order-actions">
        <button
          class="action-btn finish"
          onclick="openStatusModal('${order._id}', 'concluido')"
        >
          Concluir
        </button>

        <button
          class="action-btn cancel"
          onclick="openStatusModal('${order._id}', 'cancelado')"
        >
          Cancelar
        </button>
      </div>
    `;
  }

  return '';
}

/* MODAL */

function openStatusModal(orderId, status) {
  pendingAction = {
    type: 'order-status',
    orderId,
    status,
  };

  document.getElementById('confirmMessage').textContent =
    getConfirmMessage(status);

  document.getElementById('confirmModal').classList.add('show');
}

function closeConfirmModal() {
  pendingAction = null;

  document.getElementById('confirmModal').classList.remove('show');
}

async function confirmModalAction() {
  if (!pendingAction) return;

  if (pendingAction.type === 'order-status') {
    await updateOrderStatus(pendingAction.orderId, pendingAction.status);
  }

  if (pendingAction.type === 'delete-service') {
    await deleteSelectedService(pendingAction.serviceId);
  }

  closeConfirmModal();
}

async function updateOrderStatus(orderId, status) {
  const response = await fetch(`${API_URL}/order/status`, {
    method: 'POST',

    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },

    body: JSON.stringify({
      orderId,
      status,
    }),
  });

  const data = await response.json();

  if (data.success) {
    await loadDashboard();
  } else {
    showToast(data.message || 'Erro ao atualizar pedido', 'error');
  }
}

function getConfirmMessage(status) {
  const messages = {
    aceito: 'Tem certeza que deseja aceitar este pedido?',
    concluido: 'Tem certeza que deseja concluir este pedido?',
    cancelado: 'Tem certeza que deseja cancelar este pedido?',
  };

  return messages[status] || 'Tem certeza que deseja alterar este pedido?';
}

/* HELPERS */

function formatStatus(status) {
  const statusNames = {
    pendente: 'Pendente',
    aceito: 'Aceito',
    concluido: 'Concluído',
    cancelado: 'Cancelado',
  };

  return statusNames[status] || status;
}

/* ABAS DASHBOARD */

function showDashboardTab(tabName) {
  const tabs = document.querySelectorAll('.dashboard-tab');
  const panels = document.querySelectorAll('.dashboard-tab-panel');

  tabs.forEach((tab) => {
    tab.classList.remove('active');
  });

  panels.forEach((panel) => {
    panel.classList.remove('active');
  });

  const selectedTab = document.querySelector(
    `.dashboard-tab[onclick="showDashboardTab('${tabName}')"]`
  );

  const selectedPanel = document.querySelector(
    `[data-dashboard-tab="${tabName}"]`
  );

  if (selectedTab) {
    selectedTab.classList.add('active');
  }

  if (selectedPanel) {
    selectedPanel.classList.add('active');
  }
}

window.showDashboardTab = showDashboardTab;

function escapeHtml(text) {
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
