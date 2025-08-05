async function login() {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;
  const errorElement = document.getElementById("error");

  try {
    const response = await fetch("http://localhost:3000/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();

    if (response.ok) {
      localStorage.setItem("user", JSON.stringify(data.user));
      if (data.user.ruolo === "Admin") {
        window.location.href = "admin.html";
      } else if (data.user.ruolo === "Responsabile") {
        window.location.href = "responsabile.html";
      } else {
        window.location.href = "dipendente.html";
      }
    } else {
      errorElement.textContent = data.error;
      errorElement.classList.remove("hidden");
    }
  } catch (error) {
    errorElement.textContent = "Errore di rete. Riprova più tardi.";
    errorElement.classList.remove("hidden");
  }
}

async function creaUtente() {
  const username = document.getElementById("newUser").value;
  const password = document.getElementById("newPass").value;
  const ruolo = document.getElementById("newRole").value;

  try {
    const response = await fetch("http://localhost:3000/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, ruolo }),
    });

    if (response.ok) {
      alert("Utente creato con successo!");
      await caricaUtenti(); // Refresh user list
    } else {
      const data = await response.json();
      alert("Errore: " + data.error);
    }
  } catch (error) {
    alert("Errore di rete. Riprova più tardi.");
  }
}

async function caricaUtenti() {
  const listaUtenti = document.getElementById("listaUtenti");
  if (!listaUtenti) return;
  listaUtenti.innerHTML = "";

  try {
    const response = await fetch("http://localhost:3000/api/users");
    const users = await response.json();

    users.forEach(user => {
      const li = document.createElement("li");
      li.className = "border-b py-2 flex justify-between items-center";
      li.textContent = `${user.Username} (${user.LivelloAccesso})`;
      listaUtenti.appendChild(li);
    });
  } catch (error) {
    console.error("Errore nel caricamento degli utenti:", error);
  }
}

async function registraEntrata() {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user) {
    alert("Utente non autenticato.");
    return;
  }

  try {
    const response = await fetch("http://localhost:3000/api/presenze/entrata", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id_dipendente: user.id }),
    });

    if (response.ok) {
      alert("Entrata registrata con successo!");
    } else {
      const data = await response.json();
      alert("Errore: " + data.error);
    }
  } catch (error) {
    alert("Errore di rete. Riprova più tardi.");
  }
}

async function registraUscita() {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user) {
    alert("Utente non autenticato.");
    return;
  }

  try {
    const response = await fetch("http://localhost:3000/api/presenze/uscita", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id_dipendente: user.id }),
    });

    if (response.ok) {
      alert("Uscita registrata con successo!");
    } else {
      const data = await response.json();
      alert("Errore: " + data.error);
    }
  } catch (error) {
    alert("Errore di rete. Riprova più tardi.");
  }
}

async function richiediAssenza() {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user) {
    alert("Utente non autenticato.");
    return;
  }

  const tipoRichiesta = document.getElementById("tipoRichiesta").value;
  try {
    const response = await fetch("http://localhost:3000/api/richieste", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id_dipendente: user.id, tipoRichiesta }),
    });

    if (response.ok) {
      alert("Richiesta inviata con successo!");
    } else {
      const data = await response.json();
      alert("Errore: " + data.error);
    }
  } catch (error) {
    alert("Errore di rete. Riprova più tardi.");
  }
}

async function creaTurno() {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user || user.ruolo !== "Responsabile") {
    alert("Accesso negato.");
    return;
  }

  const dataTurno = document.getElementById("dataTurno").value;
  const oraInizio = document.getElementById("oraInizio").value;
  const oraFine = document.getElementById("oraFine").value;
  const tipoTurno = "Standard"; // Aggiungere un campo per il tipo di turno se necessario

  try {
    const response = await fetch("http://localhost:3000/api/turni", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id_dipendente: user.id, data: dataTurno, oraInizio, oraFine, tipoTurno }),
    });

    if (response.ok) {
      alert("Turno creato con successo!");
    } else {
      const data = await response.json();
      alert("Errore: " + data.error);
    }
  } catch (error) {
    alert("Errore di rete. Riprova più tardi.");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("listaUtenti")) {
    caricaUtenti();
  }
});