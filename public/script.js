const token = localStorage.getItem("token");

/* =========================
   LOGIN UI
   ========================= */

   const navButtons = document.querySelector(".nav-buttons");

   if (token) {
    navButtons.innerHTML = `
    <a href="dashboard.html" class="login-link">Dashboard</a>
    <button class="start-btn" onclick="logout()">Sair</button>
    `;
  }

  function logout() {
    localStorage.removeItem("token");
    window.location.reload();
  }

/* =========================
   CARREGAR SERVIÇOS
   ========================= */

   async function loadServices() {

    const res = await fetch("http://localhost:3000/services");
    const data = await res.json();

    const grid = document.getElementById("servicesGrid");

    if (!data.success) return;

    grid.innerHTML = data.services.map(service => `

      <div class="professional-card">

      <div class="avatar"></div>

      <h3>${service.title}</h3>

      <span>${service.category}</span>

      <p>${service.description}</p>

      <strong>R$ ${service.price}</strong>

      <button onclick="hireService('${service._id}')">
      Contratar
      </button>

      </div>

      `).join("");

  }

  loadServices();

  async function hireService(serviceId) {

    const token = localStorage.getItem("token");

    if (!token) {
      window.location.href = "login.html";
      return;
    }

    const response = await fetch(
      "http://localhost:3000/hire-service",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },

        body: JSON.stringify({
          serviceId
        })
      }
      );

    const data = await response.json();

    alert(data.message);
  }