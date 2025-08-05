let statsChart = null;

// Carica i dati della dashboard
async function loadDashboardData() {
  try {
    // Carica statistiche generali
    const statsResponse = await fetch(
      "http://localhost:3000/api/dashboard/stats",
    );
    const stats = await statsResponse.json();

    document.getElementById("presenzeOggi").textContent =
      stats.presenzeOggi || 0;
    document.getElementById("totaleDipendenti").textContent =
      stats.totaleDipendenti || 0;
    document.getElementById("ancoraPresenti").textContent =
      stats.ancoraPresenti || 0;
    document.getElementById("richiesteInAttesa").textContent =
      stats.richiesteInAttesa || 0;

    // Carica presenze di oggi
    const presenzeResponse = await fetch(
      "http://localhost:3000/api/presenze/oggi",
    );
    const presenze = await presenzeResponse.json();
    displayPresenzeOggi(presenze);

    // Carica statistiche mensili per il grafico
    const statsMensiliResponse = await fetch(
      "http://localhost:3000/api/presenze/statistiche",
    );
    const statsMensili = await statsMensiliResponse.json();
    updateChart(statsMensili);
  } catch (error) {
    console.error("Errore nel caricamento dei dati:", error);
    showToast("Errore nel caricamento dei dati", "error");
  }
}

// Mostra le presenze di oggi
function displayPresenzeOggi(presenze) {
  const container = document.getElementById("presenzeOggiList");

  if (presenze.length === 0) {
    container.innerHTML = `
            <div class="text-center text-gray-500 py-4">
                <i class="fas fa-calendar-times text-2xl mb-2"></i>
                <p>Nessuna presenza registrata oggi</p>
            </div>
        `;
    return;
  }

  container.innerHTML = presenze
    .map(
      (presenza) => `
        <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div class="flex items-center">
                <div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <i class="fas fa-user text-blue-600"></i>
                </div>
                <div class="ml-3">
                    <p class="font-semibold text-gray-900">${presenza.Nome} ${presenza.Cognome}</p>
                    <p class="text-sm text-gray-600">Matricola: ${presenza.Matricola}</p>
                </div>
            </div>
            <div class="text-right">
                <p class="text-sm font-medium text-green-600">Entrata: ${presenza.OraEntrata || "Non registrata"}</p>
                <p class="text-sm font-medium text-red-600">Uscita: ${presenza.OraUscita || "Non registrata"}</p>
            </div>
        </div>
    `,
    )
    .join("");
}

// Aggiorna il grafico delle statistiche
function updateChart(stats) {
  const ctx = document.getElementById("statsChart").getContext("2d");

  if (statsChart) {
    statsChart.destroy();
  }

  const labels = stats.map((s) => `${s.Nome} ${s.Cognome}`);
  const presenzeData = stats.map((s) => s.giorni_presenza || 0);
  const assenzeData = stats.map((s) => s.giorni_assenza || 0);

  statsChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Giorni Presenza",
          data: presenzeData,
          backgroundColor: "rgba(59, 130, 246, 0.8)",
          borderColor: "rgba(59, 130, 246, 1)",
          borderWidth: 1,
        },
        {
          label: "Giorni Assenza",
          data: assenzeData,
          backgroundColor: "rgba(239, 68, 68, 0.8)",
          borderColor: "rgba(239, 68, 68, 1)",
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            stepSize: 1,
          },
        },
      },
      plugins: {
        legend: {
          position: "top",
        },
        title: {
          display: true,
          text: "Statistiche Presenze Mensili",
        },
      },
    },
  });
}

// Funzione per mostrare toast notifications
function showToast(message, type = "success") {
  const toast = document.getElementById("toast");
  const toastMessage = document.getElementById("toastMessage");

  if (!toast || !toastMessage) return;

  toast.className = `fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg transform translate-x-full transition-transform duration-300 z-50 ${
    type === "success" ? "bg-green-500" : "bg-red-500"
  } text-white`;

  toastMessage.textContent = message;
  toast.classList.remove("translate-x-full");

  setTimeout(() => {
    toast.classList.add("translate-x-full");
  }, 3000);
}

// Verifica autenticazione e carica dati all'avvio
document.addEventListener("DOMContentLoaded", () => {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  // Mostra informazioni utente nel header se necessario
  if (user.nome && user.cognome) {
    const header = document.querySelector("header");
    const userInfo = document.createElement("div");
    userInfo.className = "text-sm opacity-90";
    userInfo.innerHTML = `
            <i class="fas fa-user mr-1"></i>
            ${user.nome} ${user.cognome} (${user.ruolo})
        `;
    header
      .querySelector(".flex.items-center.space-x-4")
      .insertBefore(userInfo, header.querySelector("button"));
  }

  // Carica dati iniziali
  loadDashboardData();

  // Aggiorna dati ogni 30 secondi
  setInterval(loadDashboardData, 30000);
});

// Funzioni per le azioni rapide
async function registraEntrata() {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user) {
    showToast("Utente non autenticato", "error");
    return;
  }

  try {
    const response = await fetch("http://localhost:3000/api/presenze/entrata", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id_dipendente: user.id }),
    });

    const data = await response.json();

    if (response.ok) {
      showToast(`Entrata registrata alle ${data.oraEntrata}`);
      loadDashboardData();
    } else {
      showToast(data.error, "error");
    }
  } catch (error) {
    showToast("Errore di rete", "error");
  }
}

async function registraUscita() {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user) {
    showToast("Utente non autenticato", "error");
    return;
  }

  try {
    const response = await fetch("http://localhost:3000/api/presenze/uscita", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id_dipendente: user.id }),
    });

    const data = await response.json();

    if (response.ok) {
      showToast(`Uscita registrata alle ${data.oraUscita}`);
      loadDashboardData();
    } else {
      showToast(data.error, "error");
    }
  } catch (error) {
    showToast("Errore di rete", "error");
  }
}

// Funzione per aggiornare il tempo corrente
function updateCurrentTime() {
  const now = new Date();
  const timeElement = document.getElementById("currentTime");
  if (timeElement) {
    timeElement.textContent = now.toLocaleString("it-IT", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }
}

// Aggiorna il tempo ogni secondo
setInterval(updateCurrentTime, 1000);
updateCurrentTime();
