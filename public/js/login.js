const usernameInput = document.getElementById('username');
const codeInput = document.getElementById('code');
const emailInput = document.getElementById('email');

const loginBtn = document.getElementById('loginBtn');
const sendBtn = document.getElementById('sendBtn');

const usernameMsg = document.getElementById('usernameMsg');
const emailMsg = document.getElementById('emailMsg');
const codeMsg = document.getElementById('codeMsg');
const timerMsg = document.getElementById('timerMsg');

const usernameIcon = document.getElementById('usernameIcon');
const emailIcon = document.getElementById('emailIcon');
const codeIcon = document.getElementById('codeIcon');

let codeSent = false;
let cooldownActive = false;
let cooldownInterval = null;

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validateUsername(username) {
  return username.trim().length > 0 && username.trim().length <= 20;
}

usernameInput.addEventListener('input', () => {
  const username = usernameInput.value.trim();

  usernameMsg.textContent = `${usernameInput.value.length}/20`;

  if (!username) {
    usernameInput.style.borderColor = '#2a2a2a';
    usernameIcon.textContent = '';
    usernameMsg.style.color = '#9f9f9f';
  } else if (validateUsername(username)) {
    usernameInput.style.borderColor = '#3ba55c';
    usernameIcon.textContent = '✔';
    usernameMsg.style.color = '#3ba55c';
  } else {
    usernameInput.style.borderColor = '#ff4d4d';
    usernameIcon.textContent = '⚠';
    usernameMsg.style.color = '#ff4d4d';
  }

  updateSendButton();
  updateLoginButton();
});

/* EMAIL INPUT */

emailInput.addEventListener('input', () => {
  const email = emailInput.value.trim();

  if (!email) {
    emailMsg.textContent = '';
    emailIcon.textContent = '';
    emailInput.style.borderColor = '#2a2a2a';
  } else if (validateEmail(email)) {
    emailInput.style.borderColor = '#3ba55c';

    emailMsg.textContent = 'E-mail válido';
    emailMsg.style.color = '#3ba55c';

    emailIcon.textContent = '✔';
  } else {
    emailInput.style.borderColor = '#ff4d4d';

    emailMsg.textContent = 'E-mail inválido';
    emailMsg.style.color = '#ff4d4d';

    emailIcon.textContent = '⚠';
  }

  updateSendButton();
  updateLoginButton();
});

/* CÓDIGO INPUT */

codeInput.addEventListener('input', () => {
  codeInput.value = codeInput.value
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 5);

  if (codeInput.value.length === 5) {
    codeInput.style.borderColor = '#3ba55c';
    codeIcon.textContent = '✔';
  } else {
    codeInput.style.borderColor = '#2a2a2a';
    codeIcon.textContent = '';
  }

  updateLoginButton();
});

/* BOTÃO ENVIAR CÓDIGO */

function updateSendButton() {
  const usernameOk = validateUsername(usernameInput.value);
  const emailOk = validateEmail(emailInput.value.trim());

  sendBtn.disabled = !(usernameOk && emailOk) || cooldownActive;
}

/* BOTÃO LOGIN */

function updateLoginButton() {
  const usernameOk = validateUsername(usernameInput.value);
  const emailOk = validateEmail(emailInput.value.trim());
  const hasCode = codeInput.value.trim().length === 5;

  loginBtn.disabled = !(codeSent && usernameOk && emailOk && hasCode);
}

/* TIMER DE REENVIO */

function startCooldown(seconds = 20) {
  cooldownActive = true;
  sendBtn.disabled = true;

  let timeLeft = seconds;

  timerMsg.textContent = `Aguarde ${timeLeft}s`;
  timerMsg.style.color = '#3ba55c';

  clearInterval(cooldownInterval);

  cooldownInterval = setInterval(() => {
    timeLeft--;

    if (timeLeft > 0) {
      timerMsg.textContent = `Aguarde ${timeLeft}s`;
    } else {
      clearInterval(cooldownInterval);

      cooldownActive = false;
      timerMsg.textContent = 'Você já pode reenviar o código';
      timerMsg.style.color = '#3ba55c';

      updateSendButton();
    }
  }, 1000);
}

/* SHAKE ERROR */

function shake(element) {
  element.classList.remove('shake');
  void element.offsetWidth;
  element.classList.add('shake');
}

/* ENVIAR CÓDIGO */

async function sendCode() {
  const username = usernameInput.value.trim();
  const email = emailInput.value.trim();

  if (cooldownActive) {
    return;
  }

  if (!validateUsername(username)) {
    usernameMsg.textContent = 'Digite um nome de usuário';
    usernameMsg.style.color = '#ff4d4d';
    shake(usernameInput);
    return;
  }

  if (!validateEmail(email)) {
    emailMsg.textContent = 'Digite um e-mail válido';
    emailMsg.style.color = '#ff4d4d';
    shake(emailInput);
    return;
  }

  sendBtn.disabled = true;
  sendBtn.textContent = 'Enviando...';

  const response = await fetch(`${API_URL}/send-code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });

  const data = await response.json();

  sendBtn.textContent = 'Enviar código';

  if (data.success) {
    codeSent = true;

    codeMsg.textContent = 'Código enviado!';
    codeMsg.style.color = '#3ba55c';

    startCooldown(20);

    updateLoginButton();
  } else {
    codeMsg.textContent = data.message || 'Erro ao enviar código';
    codeMsg.style.color = '#ff4d4d';

    updateSendButton();
  }
}

/* LOGIN */

async function verify() {
  const username = usernameInput.value.trim();
  const email = emailInput.value.trim();
  const code = codeInput.value.trim();

  if (!validateUsername(username)) {
    usernameMsg.textContent = 'Digite um nome de usuário';
    usernameMsg.style.color = '#ff4d4d';
    shake(usernameInput);
    return;
  }

  if (!validateEmail(email)) {
    shake(emailInput);
    return;
  }

  if (code.length !== 5) {
    shake(codeInput);
    codeMsg.textContent = 'Código inválido';
    codeMsg.style.color = '#ff4d4d';
    return;
  }

  const res = await fetch(`${API_URL}/verify-code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username,
      email,
      code,
    }),
  });

  const data = await res.json();

  if (data.success) {
    localStorage.setItem('token', data.token);

    const redirect = localStorage.getItem('redirectAfterLogin');

    if (redirect) {
      localStorage.removeItem('redirectAfterLogin');
      window.location.href = redirect;
    } else {
      window.location.href = '/pages/home.html';
    }
  } else {
    codeMsg.textContent = data.message || 'Erro ao fazer login';
    codeMsg.style.color = '#ff4d4d';

    shake(codeInput);
  }
}

/* ENTER LOGIN */

document.addEventListener('keydown', (event) => {
  if (event.key !== 'Enter') return;

  const activeElement = document.activeElement;

  const isTyping =
    activeElement === usernameInput ||
    activeElement === emailInput ||
    activeElement === codeInput;

  if (!isTyping) return;

  if (!loginBtn.disabled) {
    verify();
  }
});
