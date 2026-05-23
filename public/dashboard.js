const token = localStorage.getItem("token");

if (!token) {
  window.location.href = "login.html";
}

async function loadDashboard() {
  const res = await fetch("http://localhost:3000/dashboard", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json();

  if (!data.success) return;

  document.getElementById("userEmail").innerText =
    data.user?.email || "Usuário";

  document.getElementById("myServices").innerHTML = (data.services || [])
    .map(
      (s) => `
      <div class="card">
        <h3>${s.title}</h3>
        <p>${s.description}</p>
        <strong>R$ ${s.price}</strong>
      </div>
    `,
    )
    .join("");

  document.getElementById("myOrders").innerHTML = (data.orders || [])
    .map(
      (o) => `
      <div class="card">
        <p>Pedido: ${o.serviceId}</p>
        <span>Status: ${o.status}</span>
      </div>
    `,
    )
    .join("");
}

loadDashboard();
