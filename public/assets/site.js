function applySiteConfig() {
  const siteNameElements = document.querySelectorAll('[data-site-name]');
  const shortNameElements = document.querySelectorAll('[data-site-short-name]');
  const sloganElements = document.querySelectorAll('[data-site-slogan]');

  siteNameElements.forEach((element) => {
    element.textContent = SITE_CONFIG.name;
  });

  shortNameElements.forEach((element) => {
    element.textContent = SITE_CONFIG.shortName;
  });

  sloganElements.forEach((element) => {
    element.textContent = SITE_CONFIG.slogan;
  });

  if (document.title.includes('WishWork')) {
    document.title = document.title.replace('WishWork', SITE_CONFIG.name);
  }
}

applySiteConfig();

/* RODAPÉ GLOBAL */

function createGlobalFooter() {
  if (document.querySelector('.global-footer')) return;

  const footer = document.createElement('footer');

  footer.className = 'global-footer';

  footer.innerHTML = `
    <div class="global-footer-content">
      <div class="global-footer-left">
        <strong data-site-name></strong>
        <span>Projeto desenvolvido por Guilherme Matos e Anna Carolina Reis.</span>
      </div>

      <div class="global-footer-links">
        <button type="button" onclick="openLegalModal('terms')">
          Termos de Uso
        </button>

        <button type="button" onclick="openLegalModal('privacy')">
          Política de Privacidade
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(footer);

  const modal = document.createElement('div');

  modal.id = 'legalModal';
  modal.className = 'legal-modal';

  modal.innerHTML = `
    <div class="legal-modal-card custom-scroll">
      <button class="legal-modal-close" onclick="closeLegalModal()">×</button>

      <h2 id="legalModalTitle">Termos</h2>

      <div id="legalModalText" class="legal-modal-text"></div>
    </div>
  `;

  document.body.appendChild(modal);

  if (typeof applySiteConfig === 'function') {
    applySiteConfig();
  }
}

function openLegalModal(type) {
  const modal = document.getElementById('legalModal');
  const title = document.getElementById('legalModalTitle');
  const text = document.getElementById('legalModalText');

  if (!modal || !title || !text) return;

  if (type === 'terms') {
    title.textContent = 'Termos de Uso';

    text.innerHTML = `
      <p>
        Este site foi desenvolvido como um projeto acadêmico com o objetivo de
        simular um marketplace de contratação e divulgação de serviços.
      </p>

      <p>
        Ao utilizar a plataforma, o usuário concorda em fornecer informações
        verdadeiras e utilizar os recursos do sistema de forma responsável.
      </p>

      <p>
        Os serviços cadastrados na plataforma são de responsabilidade dos
        próprios usuários que os publicam. O projeto não realiza pagamentos,
        intermediações financeiras reais ou garantias comerciais.
      </p>

      <p>
        O uso indevido da plataforma, como cadastro de informações falsas,
        linguagem ofensiva ou tentativa de prejudicar outros usuários, poderá
        resultar na remoção de dados ou restrição de acesso.
      </p>
    `;
  }

  if (type === 'privacy') {
    title.textContent = 'Política de Privacidade';

    text.innerHTML = `
      <p>
        Este projeto coleta apenas informações necessárias para o funcionamento
        da plataforma, como nome de usuário, e-mail, foto de perfil, cidade,
        profissão, bio e serviços cadastrados.
      </p>

      <p>
        Os dados são utilizados para identificar usuários, exibir perfis
        públicos, permitir a criação de serviços e organizar pedidos dentro do
        sistema.
      </p>

      <p>
        As informações públicas, como nome, foto, profissão, cidade, bio e
        serviços publicados, podem ser exibidas para outros usuários da
        plataforma.
      </p>

      <p>
        Dados sensíveis, como códigos de acesso e configurações internas, não
        são exibidos publicamente. O projeto não vende, compartilha ou utiliza
        dados para fins comerciais externos.
      </p>
    `;
  }

  modal.classList.add('show');
}

function closeLegalModal() {
  const modal = document.getElementById('legalModal');

  if (!modal) return;

  modal.classList.remove('show');
}

document.addEventListener('click', (event) => {
  const modal = document.getElementById('legalModal');

  if (event.target === modal) {
    closeLegalModal();
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;

  const modal = document.getElementById('legalModal');

  if (modal?.classList.contains('show')) {
    closeLegalModal();
  }
});

document.addEventListener('DOMContentLoaded', createGlobalFooter);
