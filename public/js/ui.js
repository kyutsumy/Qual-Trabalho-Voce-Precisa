/* UI GLOBAL */

function createToastContainer() {
  let container = document.getElementById('toastContainer');

  if (container) return container;

  container = document.createElement('div');
  container.id = 'toastContainer';
  container.className = 'toast-container';

  document.body.appendChild(container);

  return container;
}

function showToast(message, type = 'success') {
  const container = createToastContainer();

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  const icons = {
    success: '✅',
    error: '⚠️',
    info: 'ℹ️',
    warning: '⚠️',
  };

  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || icons.info}</span>
    <span class="toast-message">${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('show');
  }, 20);

  setTimeout(() => {
    toast.classList.remove('show');

    setTimeout(() => {
      toast.remove();
    }, 250);
  }, 3500);
}

function createPageLoader() {
  let loader = document.getElementById('pageLoader');

  if (loader) return loader;

  loader = document.createElement('div');
  loader.id = 'pageLoader';
  loader.className = 'page-loader';

  loader.innerHTML = `
    <div class="page-loader-card">
      <div class="page-loader-spinner"></div>

      <h2>Preparando o sistema...</h2>

      <p>
        Isso pode levar alguns segundos.
      </p>
    </div>
  `;

  document.body.appendChild(loader);

  return loader;
}

function showPageLoader(text = 'Preparando o sistema...') {
  const loader = createPageLoader();

  const title = loader.querySelector('h2');

  if (title) {
    title.textContent = text;
  }

  loader.classList.add('show');
}

function hidePageLoader() {
  const loader = document.getElementById('pageLoader');

  if (!loader) return;

  loader.classList.remove('show');
}

function setButtonLoading(button, loadingText = 'Carregando...') {
  if (!button) return;

  button.dataset.originalText = button.textContent;
  button.disabled = true;
  button.textContent = loadingText;
}

function removeButtonLoading(button) {
  if (!button) return;

  button.disabled = false;
  button.textContent = button.dataset.originalText || button.textContent;
}

window.showToast = showToast;
window.showPageLoader = showPageLoader;
window.hidePageLoader = hidePageLoader;
window.setButtonLoading = setButtonLoading;
window.removeButtonLoading = removeButtonLoading;

/* COR DO BOTÃO VOLTAR */

async function applyUserColorToBackButton() {
  const backBtn = document.querySelector('.back-btn');
  const token = localStorage.getItem('token');

  if (!backBtn || !token || typeof API_URL === 'undefined') return;

  try {
    const response = await fetch(`${API_URL}/profile`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!data.success || !data.user?.profileColor) return;

    const color = data.user.profileColor;

    backBtn.style.background = color;
    backBtn.style.color = getContrastColor(color);
    backBtn.style.boxShadow = `0 10px 26px ${hexToRgba(color, 0.35)}`;
  } catch (err) {
    console.error('Erro ao aplicar cor do botão voltar:', err);
  }
}

function getContrastColor(hex) {
  const cleanHex = hex.replace('#', '');

  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);

  const brightness = (r * 299 + g * 587 + b * 114) / 1000;

  return brightness > 160 ? '#111111' : '#ffffff';
}

function hexToRgba(hex, alpha = 1) {
  const cleanHex = hex.replace('#', '');

  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

window.addEventListener('load', applyUserColorToBackButton);
window.applyUserColorToBackButton = applyUserColorToBackButton;
