const token = localStorage.getItem("token");

if (!token) {
  window.location.href = "login.html";
}

async function createService() {
  const title = document.getElementById("title").value;
  const category = document.getElementById("category").value;
  const price = document.getElementById("price").value;
  const description = document.getElementById("description").value;

  const response = await fetch("http://localhost:3000/services", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },

    body: JSON.stringify({
      title,
      category,
      price,
      description,
    }),
  });

  const data = await response.json();

  if (data.success) {
    alert("Serviço publicado!");

    window.location.href = "index.html";
  } else {
    alert(data.message);
  }
}

async function orderService(serviceId, providerEmail) {
  const token = localStorage.getItem("token");

  await fetch("http://localhost:3000/order", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
    body: JSON.stringify({
      serviceId,
      providerEmail,
    }),
  });

  alert("Pedido enviado!");
}
