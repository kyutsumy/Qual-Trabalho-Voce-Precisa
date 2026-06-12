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

let originalProfileData = null;
let profileSavedTimer = null;
let profileWatchStarted = false;

/* CARREGAR PERFIL */

async function loadProfile() {
  try {
    setSaveButtonLoading('Carregando...');

    const response = await fetch(`${API_URL}/profile`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!data.success) {
      showProfileMessage(data.message || 'Erro ao carregar perfil.', 'error');
      setSaveButtonDisabled('Nenhuma alteração');
      return;
    }

    const user = data.user;

    nameInput.value = user.name || '';
    professionInput.value = user.profession || '';
    cityInput.value = user.city || '';
    bioInput.value = user.bio || '';
    avatarUrlInput.value = user.avatarUrl || '';

    const color = user.profileColor || '#ff6b6b';

    setProfileColor(color, getColorLabel(color), false);

    updateCounters();
    updatePreview();
    updateAvatarPreview();

    setOriginalProfileData(getProfileFormData());
    watchProfileChanges();
    updateSaveButtonState();
  } catch (err) {
    console.error(err);

    showProfileMessage('Erro de conexão ao carregar perfil.', 'error');
    setSaveButtonDisabled('Nenhuma alteração');
  }
}

loadProfile();

/* CONTADORES E PREVIEW */

nameInput.addEventListener('input', () => {
  updateCounters();
  updatePreview();
  updateSaveButtonState();
});

professionInput.addEventListener('input', () => {
  updatePreview();
  updateSaveButtonState();
});

cityInput.addEventListener('input', updateSaveButtonState);

bioInput.addEventListener('input', () => {
  updateCounters();
  updateSaveButtonState();
});

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

function setProfileColor(color, label, shouldUpdateState = true) {
  profileColorInput.value = color;

  profileColorButton.textContent = label;
  profileColorButton.style.color = color;

  profileColorMenu.classList.remove('show');

  const dropdown = document.querySelector('.profile-color-dropdown');

  if (dropdown) {
    dropdown.classList.remove('open');
  }

  updatePreview();

  if (shouldUpdateState) {
    updateSaveButtonState();
  }
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

/* AVATAR */

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
    showProfileMessage('Use apenas imagens PNG, JPG, JPEG ou WEBP.', 'error');
    return;
  }

  const maxSize = 2 * 1024 * 1024;

  if (file.size > maxSize) {
    showProfileMessage(
      'A imagem é muito grande. Use uma imagem de até 2MB.',
      'error'
    );
    return;
  }

  const reader = new FileReader();

  reader.onload = () => {
    avatarUrlInput.value = reader.result;

    updateAvatarPreview();
    updateSaveButtonState();
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

/* ESTADO DO FORMULÁRIO */

function getProfileFormData() {
  return {
    name: nameInput?.value.trim() || '',
    profession: professionInput?.value.trim() || '',
    city: cityInput?.value.trim() || '',
    bio: bioInput?.value.trim() || '',
    avatarUrl: avatarUrlInput?.value || '',
    profileColor: profileColorInput?.value || '#ff6b6b',
  };
}

function normalizeProfileData(data) {
  return JSON.stringify({
    name: data.name || '',
    profession: data.profession || '',
    city: data.city || '',
    bio: data.bio || '',
    avatarUrl: data.avatarUrl || '',
    profileColor: data.profileColor || '#ff6b6b',
  });
}

function hasProfileChanges() {
  if (!originalProfileData) return false;

  return (
    normalizeProfileData(getProfileFormData()) !==
    normalizeProfileData(originalProfileData)
  );
}

function setOriginalProfileData(data) {
  originalProfileData = {
    name: data.name || '',
    profession: data.profession || '',
    city: data.city || '',
    bio: data.bio || '',
    avatarUrl: data.avatarUrl || '',
    profileColor: data.profileColor || '#ff6b6b',
  };

  updateSaveButtonState();
}

function watchProfileChanges() {
  if (profileWatchStarted) return;

  profileWatchStarted = true;

  const fields = [
    nameInput,
    professionInput,
    cityInput,
    bioInput,
    avatarUrlInput,
    profileColorInput,
  ];

  fields.forEach((field) => {
    if (!field) return;

    field.addEventListener('input', updateSaveButtonState);
    field.addEventListener('change', updateSaveButtonState);
  });
}

function updateSaveButtonState() {
  if (!saveProfileBtn) return;

  const changed = hasProfileChanges();

  saveProfileBtn.disabled = !changed;
  saveProfileBtn.textContent = changed
    ? 'Salvar alterações'
    : 'Nenhuma alteração';
}

function setSaveButtonLoading(text = 'Salvando...') {
  if (!saveProfileBtn) return;

  saveProfileBtn.disabled = true;
  saveProfileBtn.textContent = text;
}

function setSaveButtonDisabled(text = 'Nenhuma alteração') {
  if (!saveProfileBtn) return;

  saveProfileBtn.disabled = true;
  saveProfileBtn.textContent = text;
}

/* MENSAGEM PERFIL */

function showProfileMessage(message, type = 'success') {
  let box = document.getElementById('profileMessage');

  if (!box) {
    box = document.createElement('div');
    box.id = 'profileMessage';
    box.className = 'profile-message';

    const profileBox = document.querySelector('.profile-box');
    const profileHeader = document.querySelector('.profile-header');

    if (profileBox && profileHeader) {
      profileBox.insertBefore(box, profileHeader.nextSibling);
    }
  }

  box.className = `profile-message ${type}`;
  box.textContent = message;
  box.classList.add('show');

  clearTimeout(profileSavedTimer);

  profileSavedTimer = setTimeout(() => {
    box.classList.remove('show');
  }, 3500);
}

/* SALVAR PERFIL */

async function saveProfile() {
  const name = nameInput.value.trim();

  if (!name) {
    showProfileMessage('Digite seu nome.', 'error');
    nameInput.focus();
    return;
  }

  if (!hasProfileChanges()) {
    showProfileMessage('Nenhuma alteração para salvar.', 'info');
    updateSaveButtonState();
    return;
  }

  try {
    setSaveButtonLoading('Salvando...');

    const response = await fetch(`${API_URL}/profile`, {
      method: 'POST',

      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },

      body: JSON.stringify(getProfileFormData()),
    });

    const data = await response.json();

    if (!data.success) {
      showProfileMessage(data.message || 'Erro ao salvar perfil.', 'error');
      updateSaveButtonState();
      return;
    }

    setOriginalProfileData(getProfileFormData());

    updateCounters();
    updatePreview();
    updateAvatarPreview();

    showProfileMessage('Perfil salvo com sucesso!', 'success');
    setSaveButtonDisabled('Nenhuma alteração');
  } catch (err) {
    console.error(err);

    showProfileMessage('Erro de conexão ao salvar perfil.', 'error');
    updateSaveButtonState();
  }
}

/* FUNÇÕES GLOBAIS */

window.saveProfile = saveProfile;
window.toggleProfileColorMenu = toggleProfileColorMenu;
window.setProfileColor = setProfileColor;
