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
