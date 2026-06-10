const body = document.body;
const themeBtn = document.getElementById('themeToggle');

/* CARREGAR TEMA SALVO */

const savedTheme = localStorage.getItem('theme');

if (savedTheme === 'light') {
   body.classList.add('light');
   if (themeBtn) themeBtn.textContent = '☀️';
}

/* TOGGLE THEME */

function toggleTheme() {
   body.classList.toggle('light');

   const isLight = body.classList.contains('light');

   if (themeBtn) {
      themeBtn.textContent = isLight ? '☀️' : '🌙';
   }

   localStorage.setItem('theme', isLight ? 'light' : 'dark');
}
