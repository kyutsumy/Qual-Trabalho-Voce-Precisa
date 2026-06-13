const token = localStorage.getItem('token');

if (!token) {
  localStorage.setItem('redirectAfterLogin', window.location.href);
  window.location.href = '/pages/login.html';
}

const titleInput = document.getElementById('title');

const categorySelect = document.getElementById('category');
const customCategoryBox = document.getElementById('customCategoryBox');
const customCategoryInput = document.getElementById('customCategory');

const priceTypeButton = document.getElementById('priceTypeButton');
const priceTypeMenu = document.getElementById('priceTypeMenu');
const pricePlaceholder = document.getElementById('pricePlaceholder');

const priceInput = document.getElementById('price');
const priceMinInput = document.getElementById('priceMin');
const priceMaxInput = document.getElementById('priceMax');

const fixedPriceBox = document.getElementById('fixedPriceBox');
const variablePriceBox = document.getElementById('variablePriceBox');

const descriptionInput = document.getElementById('description');

const titleCounter = document.getElementById('titleCounter');
const categoryCounter = document.getElementById('categoryCounter');
const descriptionCounter = document.getElementById('descriptionCounter');

let priceMode = '';

let priceInCents = 0;
let priceMinInCents = 0;
let priceMaxInCents = 0;

/* CONTADORES */

titleInput.addEventListener('input', () => {
  titleCounter.textContent = `${titleInput.value.length}/50`;
});

descriptionInput.addEventListener('input', () => {
  descriptionCounter.textContent = `${descriptionInput.value.length}/1000`;
});

/* CATEGORIA PERSONALIZADA */

categorySelect.addEventListener('change', () => {
  if (categorySelect.value === 'Outros') {
    categorySelect.style.display = 'none';
    customCategoryBox.style.display = 'flex';
    customCategoryInput.focus();
    categoryCounter.textContent = '0/25';
  }
});

customCategoryInput.addEventListener('input', () => {
  categoryCounter.textContent = `${customCategoryInput.value.length}/25`;
});

function backToCategoryList() {
  customCategoryInput.value = '';
  categoryCounter.textContent = '';

  customCategoryBox.style.display = 'none';
  categorySelect.style.display = 'block';
  categorySelect.value = '';
}

/* TIPO DO PREÇO */

function togglePriceTypeMenu() {
  const dropdown = document.querySelector('.price-type-dropdown');

  priceTypeMenu.classList.toggle('show');
  dropdown.classList.toggle('open');
}

document.addEventListener('click', (event) => {
  const dropdown = document.querySelector('.price-type-dropdown');

  if (!dropdown || dropdown.contains(event.target)) return;

  priceTypeMenu.classList.remove('show');
  dropdown.classList.remove('open');
});

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

pricePlaceholder.style.display = 'flex';
fixedPriceBox.style.display = 'none';
variablePriceBox.style.display = 'none';

/* PREÇOS */

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

/* CRIAR SERVIÇO */

async function createService() {
  const title = titleInput.value.trim();

  let category = categorySelect.value;

  if (categorySelect.style.display === 'none') {
    category = customCategoryInput.value.trim();
  }

  const city = document.getElementById('city').value.trim();
  const area = document.getElementById('area').value.trim();
  const description = descriptionInput.value.trim();

  if (!title || !category || !city || !area || !description) {
    showToast('Preencha todos os campos!', 'error');
    return;
  }

  if (!priceMode) {
    showToast('Selecione se o preço é fixo ou variável.', 'error');
    return;
  }

  if (title.length > 50) {
    showToast('O título deve ter no máximo 50 caracteres.', 'error');
    return;
  }

  if (category.length > 25) {
    showToast('A categoria deve ter no máximo 25 caracteres.', 'error');
    return;
  }

  if (description.length > 1000) {
    showToast('A descrição deve ter no máximo 1000 caracteres.', 'error');
    return;
  }

  let price = '';

  if (priceMode === 'fixed') {
    if (priceInCents <= 0) {
      showToast('Digite um preço válido.', 'error');
      return;
    }

    price = `R$ ${formatPrice(priceInCents)}`;
  }

  if (priceMode === 'variable') {
    if (priceMinInCents <= 0 || priceMaxInCents <= 0) {
      showToast('Digite o preço mínimo e o preço máximo.', 'error');
      return;
    }

    if (priceMinInCents > priceMaxInCents) {
      showToast(
        'O preço mínimo não pode ser maior que o preço máximo.',
        'error'
      );
      return;
    }

    price = `R$ ${formatPrice(priceMinInCents)} - R$ ${formatPrice(
      priceMaxInCents
    )}`;
  }

  const submitBtn =
    document.querySelector('.publish-btn') ||
    document.querySelector('[onclick="createService()"]');

  try {
    setButtonLoading(submitBtn, 'Publicando...');

    const response = await fetch(`${API_URL}/services`, {
      method: 'POST',

      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },

      body: JSON.stringify({
        title,
        category,
        description,

        price,
        priceType: priceMode,

        priceInCents: priceMode === 'fixed' ? priceInCents : 0,

        priceMinInCents: priceMode === 'variable' ? priceMinInCents : 0,

        priceMaxInCents: priceMode === 'variable' ? priceMaxInCents : 0,

        city,
        area,
      }),
    });

    const data = await response.json();

    if (data.success) {
      showToast('Serviço publicado!', 'success');

      setTimeout(() => {
        window.location.replace('/pages/dashboard.html');
      }, 900);

      return;
    }

    showToast(data.message || 'Erro ao publicar', 'error');
  } catch (err) {
    console.error(err);
    showToast('Erro de conexão ao publicar serviço.', 'error');
  } finally {
    removeButtonLoading(submitBtn);
  }
}

window.backToCategoryList = backToCategoryList;
window.togglePriceTypeMenu = togglePriceTypeMenu;
window.setPriceMode = setPriceMode;
window.createService = createService;
