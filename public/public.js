async function loadServices() {
  const res = await fetch("http://localhost:3000/services/public");
  const data = await res.json();

  if (!data.success) return;

  document.getElementById("servicesGrid").innerHTML = data.services
    .map(
      (s) => `
      <div class="service-card">
        <h3>${s.title}</h3>
        <p>${s.description}</p>
        <strong>R$ ${s.price}</strong>

        <button onclick="alert('Faça login para contratar')">
          Contratar
        </button>
      </div>
    `,
    )
    .join("");
}

loadServices();

function goHome() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}
