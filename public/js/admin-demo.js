const token = localStorage.getItem('token');

if (!token) {
  localStorage.setItem('redirectAfterLogin', window.location.href);
  window.location.href = '/pages/login.html';
}

const adminStatus = document.getElementById('adminStatus');
const saveDemoBtn = document.getElementById('saveDemoBtn');
const profilesList = document.getElementById('profilesList');

const categorySelect = document.getElementById('category');
const customCategoryBox = document.getElementById('customCategoryBox');
const customCategoryInput = document.getElementById('customCategory');

const priceTypeButton = document.getElementById('priceTypeButton');
const priceTypeMenu = document.getElementById('priceTypeMenu');

const pricePlaceholder = document.getElementById('pricePlaceholder');
const fixedPriceBox = document.getElementById('fixedPriceBox');
const variablePriceBox = document.getElementById('variablePriceBox');

const priceInput = document.getElementById('price');
const priceMinInput = document.getElementById('priceMin');
const priceMaxInput = document.getElementById('priceMax');

const avatarUrlInput = document.getElementById('avatarUrl');
const avatarFileInput = document.getElementById('avatarFile');
const avatarDropArea = document.getElementById('avatarDropArea');
const avatarPreview = document.getElementById('avatarPreview');

const profileColorInput = document.getElementById('profileColor');
const profileColorButton = document.getElementById('profileColorButton');
const profileColorMenu = document.getElementById('profileColorMenu');

let demoProfiles = [];

let priceMode = '';
let priceInCents = 0;
let priceMinInCents = 0;
let priceMaxInCents = 0;

/* ADMIN */

async function checkAdmin() {
  try {
    const response = await fetch(`${API_URL}/admin/check`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!data.success || !data.isAdmin) {
      adminStatus.textContent =
        'Você não tem permissão para acessar este painel.';
      adminStatus.classList.add('error');
      saveDemoBtn.disabled = true;
      return;
    }

    adminStatus.textContent = `Acesso liberado para ${data.email}`;
    adminStatus.classList.add('success');

    loadDemoProfiles();
  } catch (err) {
    console.error(err);

    adminStatus.textContent = 'Erro ao verificar acesso.';
    adminStatus.classList.add('error');
    saveDemoBtn.disabled = true;
  }
}

checkAdmin();

/* LISTAR PERFIS */

async function loadDemoProfiles() {
  try {
    const response = await fetch(`${API_URL}/admin/demo-profiles`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!data.success) {
      profilesList.innerHTML = 'Erro ao carregar perfis.';
      return;
    }

    demoProfiles = data.profiles || [];

    renderProfiles();
  } catch (err) {
    console.error(err);
    profilesList.innerHTML = 'Erro ao carregar perfis.';
  }
}

function renderProfiles() {
  if (demoProfiles.length === 0) {
    profilesList.innerHTML = `
      <div class="empty-profile">
        Nenhum perfil demo criado ainda.
      </div>
    `;
    return;
  }

  profilesList.innerHTML = demoProfiles
    .map(
      (profile, index) => `
      <button class="profile-item" onclick="selectProfile(${index})">
        <div
          class="profile-avatar"
          style="${
            profile.avatarUrl
              ? `background-image: url('${profile.avatarUrl}')`
              : ''
          }"
        ></div>

        <div>
          <strong>${profile.name || 'Sem nome'}</strong>
          <span>${profile.profession || 'Sem profissão'}</span>
        </div>
      </button>
    `
    )
    .join('');
}

/* COR DO PERFIL */

function toggleProfileColorMenu() {
  const dropdown = document.querySelector('.profile-color-dropdown');

  profileColorMenu.classList.toggle('show');
  dropdown.classList.toggle('open');
}

function setProfileColor(color, label) {
  profileColorInput.value = color;

  profileColorButton.textContent = label;
  profileColorButton.style.color = color;

  profileColorMenu.classList.remove('show');

  document.querySelector('.profile-color-dropdown').classList.remove('open');
}

function getColorLabel(color) {
  const colors = {
    '#5865f2': 'Azul',
    '#ff6b6b': 'Vermelho',
    '#3ba55c': 'Verde',
    '#faa61a': 'Amarelo',
    '#a78bfa': 'Roxo',
    '#ff7ac8': 'Rosa',
    '#ffffff': 'Branco',
    '#8b5e3c': 'Marrom',
    '#f97316': 'Laranja',
    '#22d3ee': 'Ciano',
    '#9ca3af': 'Cinza',
    '#111827': 'Preto',
    '#facc15': 'Dourado',
    '#10b981': 'Esmeralda',
    '#6366f1': 'Índigo',
    '#7f1d1d': 'Vinho',
    '#84cc16': 'Lima',
    '#14b8a6': 'Turquesa',
    '#fb7185': 'Pêssego',
  };

  return colors[color] || 'Cor';
}

/* SELECIONAR PERFIL */

function selectProfile(index) {
  const profile = demoProfiles[index];
  if (!profile) return;

  const service = profile.service || {};

  document.getElementById('originalEmail').value = profile.email || '';
  document.getElementById('serviceId').value = service._id || '';

  document.getElementById('name').value = profile.name || '';
  document.getElementById('email').value = profile.email || '';
  document.getElementById('profession').value = profile.profession || '';
  document.getElementById('city').value = profile.city || '';
  document.getElementById('rating').value = profile.rating || '';
  document.getElementById('reviews').value = profile.reviews || '';
  document.getElementById('bio').value = profile.bio || '';

  document.getElementById('avatarUrl').value = profile.avatarUrl || '';
  updateAvatarPreview();

  const savedColor = profile.profileColor || service.ownerColor || '#ff6b6b';

  setProfileColor(savedColor, getColorLabel(savedColor));

  document.getElementById('serviceTitle').value = service.title || '';
  document.getElementById('area').value = service.area || '';
  document.getElementById('description').value = service.description || '';

  setCategoryValue(service.category || '');

  if (service.priceType === 'variable') {
    setPriceMode('variable');

    priceMinInCents = Number(service.priceMinInCents) || 0;
    priceMaxInCents = Number(service.priceMaxInCents) || 0;

    priceMinInput.value = priceMinInCents ? formatPrice(priceMinInCents) : '';
    priceMaxInput.value = priceMaxInCents ? formatPrice(priceMaxInCents) : '';
  } else if (service.priceType === 'fixed') {
    setPriceMode('fixed');

    priceInCents = Number(service.priceInCents) || 0;

    priceInput.value = priceInCents ? formatPrice(priceInCents) : '';
  } else {
    resetPriceMode();
  }
}

function clearForm() {
  document.getElementById('originalEmail').value = '';
  document.getElementById('serviceId').value = '';

  document.getElementById('name').value = '';
  document.getElementById('email').value = '';
  document.getElementById('profession').value = '';
  document.getElementById('city').value = '';
  document.getElementById('rating').value = '';
  document.getElementById('reviews').value = '';
  document.getElementById('bio').value = '';
  document.getElementById('avatarUrl').value = '';

  document.getElementById('serviceTitle').value = '';
  document.getElementById('area').value = '';
  document.getElementById('description').value = '';

  categorySelect.style.display = 'block';
  categorySelect.value = '';
  customCategoryBox.style.display = 'none';
  customCategoryInput.value = '';
  avatarFileInput.value = '';

  setProfileColor('#ff6b6b', 'Vermelho');
  updateAvatarPreview();
  resetPriceMode();
  updateAvatarPreview();
}

/* AVATAR / UPLOAD */

avatarDropArea.addEventListener('click', () => {
  avatarFileInput.click();
});

avatarFileInput.addEventListener('change', () => {
  const file = avatarFileInput.files[0];

  if (file) {
    handleAvatarFile(file);
  }
});

avatarDropArea.addEventListener('dragover', (event) => {
  event.preventDefault();
  avatarDropArea.classList.add('drag-over');
});

avatarDropArea.addEventListener('dragleave', () => {
  avatarDropArea.classList.remove('drag-over');
});

avatarDropArea.addEventListener('drop', (event) => {
  event.preventDefault();

  avatarDropArea.classList.remove('drag-over');

  const file = event.dataTransfer.files[0];

  if (file) {
    handleAvatarFile(file);
  }
});

function handleAvatarFile(file) {
  const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

  if (!allowedTypes.includes(file.type)) {
    alert('Use apenas imagens PNG, JPG, JPEG ou WEBP.');
    return;
  }

  const maxSize = 2 * 1024 * 1024;

  if (file.size > maxSize) {
    alert('A imagem é muito grande. Use uma imagem de até 2MB.');
    return;
  }

  const reader = new FileReader();

  reader.onload = () => {
    const imageBase64 = reader.result;

    avatarUrlInput.value = imageBase64;

    updateAvatarPreview();

    avatarDropArea.innerHTML = `
      <strong>Imagem selecionada</strong>
      <span>${file.name}</span>
    `;
  };

  reader.readAsDataURL(file);
}

function updateAvatarPreview() {
  const url = avatarUrlInput.value.trim();

  if (!url) {
    avatarPreview.style.backgroundImage = '';
    avatarDropArea.innerHTML = `
      <strong>Clique aqui ou arraste o arquivo</strong>
      <span>PNG, JPG, JPEG ou WEBP</span>
    `;
    return;
  }

  avatarPreview.style.backgroundImage = `url("${url}")`;
}

/* CATEGORIA */

categorySelect.addEventListener('change', () => {
  if (categorySelect.value === 'Outros') {
    categorySelect.style.display = 'none';
    customCategoryBox.style.display = 'flex';
    customCategoryInput.focus();
  }
});

function backToCategoryList() {
  customCategoryInput.value = '';
  customCategoryBox.style.display = 'none';
  categorySelect.style.display = 'block';
  categorySelect.value = '';
}

function setCategoryValue(category) {
  const options = [...categorySelect.options].map((option) => option.value);

  if (options.includes(category)) {
    categorySelect.style.display = 'block';
    customCategoryBox.style.display = 'none';
    categorySelect.value = category;
    customCategoryInput.value = '';
  } else {
    categorySelect.style.display = 'none';
    customCategoryBox.style.display = 'flex';
    categorySelect.value = 'Outros';
    customCategoryInput.value = category;
  }
}

/* PREÇO */

function togglePriceTypeMenu() {
  const dropdown = document.querySelector('.price-type-dropdown');

  priceTypeMenu.classList.toggle('show');
  dropdown.classList.toggle('open');
}

document.addEventListener('click', (event) => {
  const dropdown = document.querySelector('.price-type-dropdown');

  if (!dropdown.contains(event.target)) {
    priceTypeMenu.classList.remove('show');
    dropdown.classList.remove('open');
  }
});

function resetPriceMode() {
  priceMode = '';

  priceInCents = 0;
  priceMinInCents = 0;
  priceMaxInCents = 0;

  priceInput.value = '';
  priceMinInput.value = '';
  priceMaxInput.value = '';

  priceTypeButton.textContent = 'Tipo';
  priceTypeButton.classList.remove('fixed-selected', 'variable-selected');

  pricePlaceholder.style.display = 'flex';
  fixedPriceBox.style.display = 'none';
  variablePriceBox.style.display = 'none';

  priceTypeMenu.classList.remove('show');

  document.querySelector('.price-type-dropdown').classList.remove('open');
}

function setPriceMode(mode) {
  priceMode = mode;

  pricePlaceholder.style.display = 'none';
  fixedPriceBox.style.display = 'none';
  variablePriceBox.style.display = 'none';

  priceTypeButton.classList.remove('fixed-selected', 'variable-selected');

  if (mode === 'fixed') {
    fixedPriceBox.style.display = 'flex';

    priceTypeButton.textContent = 'Fixo';
    priceTypeButton.classList.add('fixed-selected');
  }

  if (mode === 'variable') {
    variablePriceBox.style.display = 'flex';

    priceTypeButton.textContent = 'Variável';
    priceTypeButton.classList.add('variable-selected');
  }

  priceTypeMenu.classList.remove('show');

  document.querySelector('.price-type-dropdown').classList.remove('open');
}

resetPriceMode();

priceInput.addEventListener('input', () => {
  priceInCents = handlePriceInput(priceInput);
});

priceMinInput.addEventListener('input', () => {
  priceMinInCents = handlePriceInput(priceMinInput);
});

priceMaxInput.addEventListener('input', () => {
  priceMaxInCents = handlePriceInput(priceMaxInput);
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

/* SALVAR  */

async function saveDemoProfile() {
  const originalEmail = document.getElementById('originalEmail').value.trim();
  const serviceId = document.getElementById('serviceId').value.trim();

  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  const profession = document.getElementById('profession').value.trim();
  const city = document.getElementById('city').value.trim();
  const rating = document.getElementById('rating').value;
  const reviews = document.getElementById('reviews').value;
  const bio = document.getElementById('bio').value.trim();
  const avatarUrl = document.getElementById('avatarUrl').value.trim();

  const serviceTitle = document.getElementById('serviceTitle').value.trim();
  const area = document.getElementById('area').value.trim();
  const description = document.getElementById('description').value.trim();
  const profileColor = document.getElementById('profileColor').value;

  let category = categorySelect.value;

  if (categorySelect.style.display === 'none') {
    category = customCategoryInput.value.trim();
  }

  if (
    !name ||
    !email ||
    !profession ||
    !city ||
    !serviceTitle ||
    !category ||
    !description
  ) {
    alert('Preencha os campos obrigatórios!');
    return;
  }

  if (!priceMode) {
    alert('Selecione se o preço é fixo ou variável.');
    return;
  }

  let price = '';

  if (priceMode === 'fixed') {
    if (priceInCents <= 0) {
      alert('Digite um preço válido.');
      return;
    }

    price = `R$ ${formatPrice(priceInCents)}`;
  }

  if (priceMode === 'variable') {
    if (priceMinInCents <= 0 || priceMaxInCents <= 0) {
      alert('Digite o preço mínimo e o preço máximo.');
      return;
    }

    if (priceMinInCents > priceMaxInCents) {
      alert('O preço mínimo não pode ser maior que o preço máximo.');
      return;
    }

    price = `R$ ${formatPrice(priceMinInCents)} - R$ ${formatPrice(
      priceMaxInCents
    )}`;
  }

  saveDemoBtn.disabled = true;
  saveDemoBtn.textContent = 'Salvando...';

  const response = await fetch(`${API_URL}/admin/demo-profile`, {
    method: 'POST',

    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },

    body: JSON.stringify({
      originalEmail,
      serviceId,

      name,
      email,
      profession,
      bio,
      city,
      rating,
      reviews,
      avatarUrl,
      profileColor,

      serviceTitle,
      category,

      price,
      priceType: priceMode,
      priceInCents: priceMode === 'fixed' ? priceInCents : 0,
      priceMinInCents: priceMode === 'variable' ? priceMinInCents : 0,
      priceMaxInCents: priceMode === 'variable' ? priceMaxInCents : 0,

      area,
      description,
    }),
  });

  const data = await response.json();

  saveDemoBtn.disabled = false;
  saveDemoBtn.textContent = 'Salvar perfil demonstrativo';

  if (data.success) {
    alert('Perfil salvo com sucesso!');
    await loadDemoProfiles();
  } else {
    alert(data.message || 'Erro ao salvar perfil');
  }
}

setProfileColor('#ff6b6b', 'Vermelho');
