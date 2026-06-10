const token = localStorage.getItem('token');

if (!token) {
  localStorage.setItem('redirectAfterLogin', window.location.href);
  window.location.href = '/pages/login.html';
}

const nameInput = document.getElementById('name');
const professionInput = document.getElementById('profession');
const cityInput = document.getElementById('city');
const bioInput = document.getElementById('bio');

const nameCounter = document.getElementById('nameCounter');
const bioCounter = document.getElementById('bioCounter');

const profileColorInput = document.getElementById('profileColor');
const profileColorButton = document.getElementById('profileColorButton');
const profileColorMenu = document.getElementById('profileColorMenu');

const avatarUrlInput = document.getElementById('avatarUrl');
const avatarFileInput = document.getElementById('avatarFile');
const avatarUploadButton = document.getElementById('avatarUploadButton');
const avatarPreview = document.getElementById('avatarPreview');

const previewName = document.getElementById('previewName');
const previewProfession = document.getElementById('previewProfession');

const saveProfileBtn = document.getElementById('saveProfileBtn');

/* CARREGAR PERFIL */

async function loadProfile() {
  try {
    const response = await fetch(`${API_URL}/profile`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!data.success) {
      alert(data.message || 'Erro ao carregar perfil');
      return;
    }

    const user = data.user;

    nameInput.value = user.name || '';
    professionInput.value = user.profession || '';
    cityInput.value = user.city || '';
    bioInput.value = user.bio || '';

    avatarUrlInput.value = user.avatarUrl || '';

    const color = user.profileColor || '#ff6b6b';

    setProfileColor(color, getColorLabel(color));

    updateCounters();
    updatePreview();
    updateAvatarPreview();
  } catch (err) {
    console.error(err);
    alert('Erro ao carregar perfil');
  }
}

loadProfile();

/* CONTADORES / PREVIEW */

nameInput.addEventListener('input', () => {
  updateCounters();
  updatePreview();
});

professionInput.addEventListener('input', updatePreview);
bioInput.addEventListener('input', updateCounters);

function updateCounters() {
  nameCounter.textContent = `${nameInput.value.length}/20`;
  bioCounter.textContent = `${bioInput.value.length}/300`;
}

function updatePreview() {
  previewName.textContent = nameInput.value.trim() || 'Seu nome';
  previewProfession.textContent =
    professionInput.value.trim() || 'Sua profissão';

  previewName.style.color = profileColorInput.value;
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

  updatePreview();
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

document.addEventListener('click', (event) => {
  const colorDropdown = document.querySelector('.profile-color-dropdown');

  if (colorDropdown && !colorDropdown.contains(event.target)) {
    profileColorMenu.classList.remove('show');
    colorDropdown.classList.remove('open');
  }
});

setProfileColor('#ff6b6b', 'Vermelho');

/* AVATAR NO CÍRCULO */

avatarUploadButton.addEventListener('click', () => {
  avatarFileInput.click();
});

avatarFileInput.addEventListener('change', () => {
  const file = avatarFileInput.files[0];

  if (file) {
    handleAvatarFile(file);
  }
});

avatarUploadButton.addEventListener('dragover', (event) => {
  event.preventDefault();
  avatarUploadButton.classList.add('drag-over');
});

avatarUploadButton.addEventListener('dragleave', () => {
  avatarUploadButton.classList.remove('drag-over');
});

avatarUploadButton.addEventListener('drop', (event) => {
  event.preventDefault();

  avatarUploadButton.classList.remove('drag-over');

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
    avatarUrlInput.value = reader.result;
    updateAvatarPreview();
  };

  reader.readAsDataURL(file);
}

function updateAvatarPreview() {
  const url = avatarUrlInput.value.trim();

  if (!url) {
    avatarPreview.style.backgroundImage = '';
    return;
  }

  avatarPreview.style.backgroundImage = `url("${url}")`;
}

/* SALVAR PERFIL */

async function saveProfile() {
  const name = nameInput.value.trim();
  const profession = professionInput.value.trim();
  const city = cityInput.value.trim();
  const bio = bioInput.value.trim();
  const avatarUrl = avatarUrlInput.value.trim();
  const profileColor = profileColorInput.value;

  if (!name) {
    alert('Digite seu nome.');
    return;
  }

  saveProfileBtn.disabled = true;
  saveProfileBtn.textContent = 'Salvando...';

  const response = await fetch(`${API_URL}/profile`, {
    method: 'POST',

    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },

    body: JSON.stringify({
      name,
      profession,
      city,
      bio,
      avatarUrl,
      profileColor,
    }),
  });

  const data = await response.json();

  saveProfileBtn.disabled = false;
  saveProfileBtn.textContent = 'Salvar Perfil';

  if (data.success) {
    alert('Perfil salvo com sucesso!');
    window.location.href = '/pages/dashboard.html';
  } else {
    alert(data.message || 'Erro ao salvar perfil');
  }
}
