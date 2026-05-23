const codeInput = document.getElementById("code");
const emailInput = document.getElementById("email");
const loginBtn = document.getElementById("loginBtn");
const sendBtn = document.getElementById("sendBtn");

const emailMsg = document.getElementById("emailMsg");
const codeMsg = document.getElementById("codeMsg");

const emailIcon = document.getElementById("emailIcon");
const codeIcon = document.getElementById("codeIcon");

let codeSent = false;

/* isso aqui valida o emaiil: */

function validateEmail(email) {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

emailInput.addEventListener("input", () => {
	const email = emailInput.value.trim();

	if (!email) {
		emailMsg.textContent = "";
		emailIcon.textContent = "";
		sendBtn.disabled = true;
		return;
	}

	if (validateEmail(email)) {
		emailInput.style.borderColor = "#3ba55c";

		emailMsg.textContent = "E-mail válido";
		emailMsg.style.color = "#3ba55c";

		emailIcon.textContent = "✔";

		sendBtn.disabled = false;
	} else {
		emailInput.style.borderColor = "#ff4d4d";

		emailMsg.textContent = "E-mail inválido";
		emailMsg.style.color = "#ff4d4d";

		emailIcon.textContent = "⚠";

		sendBtn.disabled = true;
	}
});

/* =========================
CÓDIGO INPUT
========================= */

codeInput.addEventListener("input", () => {
	codeInput.value = codeInput.value
		.toUpperCase()
		.replace(/[^A-Z0-9]/g, "")
		.slice(0, 5);

	updateLoginButton();
});

/* =========================
ATIVAR BOTÃO LOGIN
========================= */

function updateLoginButton() {
	const hasCode = codeInput.value.trim().length === 5;
	const emailOk = validateEmail(emailInput.value.trim());

	loginBtn.disabled = !(codeSent && hasCode && emailOk);
}

/* =========================
SHAKE ERROR
========================= */

function shake(element) {
	element.classList.remove("shake");
	void element.offsetWidth;
	element.classList.add("shake");
}

/* =========================
ENVIAR CÓDIGO
========================= */

async function sendCode() {
	const email = emailInput.value.trim();

	if (!validateEmail(email)) {
		emailMsg.textContent = "Digite um e-mail válido";
		emailMsg.style.color = "#ff4d4d";

		shake(emailInput);

		return;
	}

	const response = await fetch("http://localhost:3000/send-code", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ email }),
	});

	const data = await response.json();

	if (data.success) {
		codeSent = true;

		codeMsg.textContent = "Código enviado!";
		codeMsg.style.color = "#3ba55c";

		updateLoginButton();
	} else {
		codeMsg.textContent = data.message;
		codeMsg.style.color = "#ff4d4d";
	}
}

/* =========================
LOGIN
========================= */

async function verify() {
	const email = emailInput.value.trim();
	const code = codeInput.value.trim();

	if (!validateEmail(email)) {
		shake(emailInput);
		return;
	}

	if (code.length !== 5) {
		shake(codeInput);
		codeMsg.textContent = "Código inválido";
		codeMsg.style.color = "#ff4d4d";
		return;
	}

	const res = await fetch("http://localhost:3000/verify-code", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ email, code }),
	});

	const data = await res.json();

	if (data.success) {
		localStorage.setItem("token", data.token);

		window.location.href = "index.html";
	} else {
		codeMsg.textContent = data.message;
		codeMsg.style.color = "#ff4d4d";

		shake(codeInput);
	}
}
