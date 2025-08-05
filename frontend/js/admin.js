let rolesChart = null;

// Tab Management
function showTab(tabName) {
  // Hide all tab contents
  document.querySelectorAll(".tab-content").forEach((content) => {
    content.classList.remove("active");
  });

  // Remove active class from all tab buttons
  document.querySelectorAll(".tab-button").forEach((button) => {
    button.classList.remove("active", "border-blue-500", "text-blue-600");
    button.classList.add("border-transparent", "text-gray-500");
  });

  // Show selected tab content
  document.getElementById(tabName).classList.add("active");

  // Add active class to selected tab button
  const activeButton = document.querySelector(
    `[onclick="showTab('${tabName}')"]`,
  );
  activeButton.classList.add("active", "border-blue-500", "text-blue-600");
  activeButton.classList.remove("border-transparent", "text-gray-500");

  // Load data for the selected tab
  switch (tabName) {
    case "dashboard":
      loadDashboardData();
      break;
    case "users":
      loadUsers();
      break;
    case "employees":
      loadEmployees();
      break;
    case "requests":
      loadRequests();
      break;
    case "reports":
      loadStatistics();
      break;
  }
}

// Dashboard Functions
async function loadDashboardData() {
  try {
    // Load dashboard stats
    const statsResponse = await fetch(
      "http://localhost:3000/api/dashboard/stats",
    );
    const stats = await statsResponse.json();

    document.getElementById("totalUsers").textContent =
      stats.totaleDipendenti || 0;
    document.getElementById("activeEmployees").textContent =
      stats.totaleDipendenti || 0;
    document.getElementById("todayPresences").textContent =
      stats.presenzeOggi || 0;
    document.getElementById("pendingRequests").textContent =
      stats.richiesteInAttesa || 0;

    // Load today's presences
    const presenzeResponse = await fetch(
      "http://localhost:3000/api/presenze/oggi",
    );
    const presenze = await presenzeResponse.json();
    displayTodayPresences(presenze);

    // Load users for roles chart
    const usersResponse = await fetch("http://localhost:3000/api/users");
    const users = await usersResponse.json();
    updateRolesChart(users);
  } catch (error) {
    console.error("Errore nel caricamento dei dati dashboard:", error);
    showToast("Errore nel caricamento dei dati", "error");
  }
}

function displayTodayPresences(presenze) {
  const container = document.getElementById("todayPresencesList");

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
                <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <i class="fas fa-user text-blue-600 text-sm"></i>
                </div>
                <div class="ml-3">
                    <p class="font-medium text-gray-900">${presenza.Nome} ${presenza.Cognome}</p>
                    <p class="text-xs text-gray-600">${presenza.Matricola}</p>
                </div>
            </div>
            <div class="text-right text-sm">
                <p class="text-green-600">${presenza.OraEntrata || "Non registrata"}</p>
                <p class="text-red-600">${presenza.OraUscita || "Non registrata"}</p>
            </div>
        </div>
    `,
    )
    .join("");
}

function updateRolesChart(users) {
  const ctx = document.getElementById("rolesChart").getContext("2d");

  if (rolesChart) {
    rolesChart.destroy();
  }

  const roleCounts = {};
  users.forEach((user) => {
    roleCounts[user.LivelloAccesso] =
      (roleCounts[user.LivelloAccesso] || 0) + 1;
  });

  const labels = Object.keys(roleCounts);
  const data = Object.values(roleCounts);
  const colors = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444"];

  rolesChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: labels,
      datasets: [
        {
          data: data,
          backgroundColor: colors.slice(0, labels.length),
          borderWidth: 2,
          borderColor: "#ffffff",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
        },
      },
    },
  });
}

// User Management Functions
async function loadUsers() {
  try {
    const response = await fetch("http://localhost:3000/api/users");
    const users = await response.json();
    displayUsers(users);
  } catch (error) {
    console.error("Errore nel caricamento degli utenti:", error);
    showToast("Errore nel caricamento degli utenti", "error");
  }
}

function displayUsers(users) {
  const tbody = document.getElementById("usersTableBody");

  tbody.innerHTML = users
    .map(
      (user) => `
        <tr>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">${user.Username}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  user.LivelloAccesso === "Admin"
                    ? "bg-red-100 text-red-800"
                    : user.LivelloAccesso === "Responsabile"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-green-100 text-green-800"
                }">
                    ${user.LivelloAccesso}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                ${user.Nome && user.Cognome ? `${user.Nome} ${user.Cognome}` : "Non associato"}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${user.UltimoAccesso ? new Date(user.UltimoAccesso).toLocaleString("it-IT") : "Mai"}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button onclick="editUser(${user.ID})" class="text-blue-600 hover:text-blue-900 mr-3">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="deleteUser(${user.ID})" class="text-red-600 hover:text-red-900">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `,
    )
    .join("");
}

// Employee Management Functions
async function loadEmployees() {
  try {
    const response = await fetch("http://localhost:3000/api/dipendenti");
    const employees = await response.json();
    displayEmployees(employees);

    // Update employee dropdown in user creation modal
    updateEmployeeDropdown(employees);
  } catch (error) {
    console.error("Errore nel caricamento dei dipendenti:", error);
    showToast("Errore nel caricamento dei dipendenti", "error");
  }
}

function displayEmployees(employees) {
  const tbody = document.getElementById("employeesTableBody");

  tbody.innerHTML = employees
    .map(
      (employee) => `
        <tr>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">${employee.Nome} ${employee.Cognome}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${employee.Matricola}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${employee.Ruolo}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${employee.Reparto || "-"}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${employee.Email}</td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  employee.Attivo
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }">
                    ${employee.Attivo ? "Attivo" : "Inattivo"}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button onclick="editEmployee(${employee.ID})" class="text-blue-600 hover:text-blue-900 mr-3">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="deleteEmployee(${employee.ID})" class="text-red-600 hover:text-red-900">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `,
    )
    .join("");
}

// Request Management Functions
async function loadRequests() {
  try {
    const response = await fetch("http://localhost:3000/api/richieste");
    const requests = await response.json();
    displayRequests(requests);
  } catch (error) {
    console.error("Errore nel caricamento delle richieste:", error);
    showToast("Errore nel caricamento delle richieste", "error");
  }
}

function displayRequests(requests) {
  const container = document.getElementById("requestsList");

  if (requests.length === 0) {
    container.innerHTML = `
            <div class="text-center text-gray-500 py-8">
                <i class="fas fa-file-alt text-3xl mb-2"></i>
                <p>Nessuna richiesta trovata</p>
            </div>
        `;
    return;
  }

  container.innerHTML = requests
    .map(
      (request) => `
        <div class="bg-gray-50 rounded-lg p-4">
            <div class="flex justify-between items-start">
                <div>
                    <h3 class="font-semibold text-gray-900">${request.Nome} ${request.Cognome}</h3>
                    <p class="text-sm text-gray-600">Matricola: ${request.Matricola}</p>
                    <p class="text-sm text-gray-600">Tipo: ${request.TipoRichiesta}</p>
                    <p class="text-sm text-gray-600">Periodo: ${request.DataInizio} - ${request.DataFine}</p>
                    ${request.Motivo ? `<p class="text-sm text-gray-600">Motivo: ${request.Motivo}</p>` : ""}
                </div>
                <div class="text-right">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      request.Stato === "In attesa"
                        ? "bg-yellow-100 text-yellow-800"
                        : request.Stato === "Approvata"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                    }">
                        ${request.Stato}
                    </span>
                    <p class="text-xs text-gray-500 mt-1">${new Date(request.DataRichiesta).toLocaleDateString("it-IT")}</p>
                    ${
                      request.Stato === "In attesa"
                        ? `
                        <div class="mt-2 space-x-2">
                            <button onclick="updateRequestStatus(${request.ID}, 'Approvata')" class="bg-green-500 hover:bg-green-600 text-white px-2 py-1 rounded text-xs">
                                Approva
                            </button>
                            <button onclick="updateRequestStatus(${request.ID}, 'Rifiutata')" class="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs">
                                Rifiuta
                            </button>
                        </div>
                    `
                        : ""
                    }
                </div>
            </div>
        </div>
    `,
    )
    .join("");
}

async function updateRequestStatus(requestId, status) {
  try {
    const response = await fetch(
      `http://localhost:3000/api/richieste/${requestId}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stato: status }),
      },
    );

    if (response.ok) {
      showToast(`Richiesta ${status.toLowerCase()}`);
      loadRequests();
    } else {
      const data = await response.json();
      showToast(data.error, "error");
    }
  } catch (error) {
    showToast("Errore nell'aggiornamento della richiesta", "error");
  }
}

function filterRequests() {
  const filter = document.getElementById("requestFilter").value;
  // Implement filtering logic here
  loadRequests(); // For now, just reload all requests
}

// Modal Functions
function showCreateUserModal() {
  document.getElementById("createUserModal").classList.remove("hidden");
  loadEmployees(); // Load employees for dropdown
}

function hideCreateUserModal() {
  document.getElementById("createUserModal").classList.add("hidden");
  document.getElementById("createUserForm").reset();
}

function showCreateEmployeeModal() {
  document.getElementById("createEmployeeModal").classList.remove("hidden");
}

function hideCreateEmployeeModal() {
  document.getElementById("createEmployeeModal").classList.add("hidden");
  document.getElementById("createEmployeeForm").reset();
}

function updateEmployeeDropdown(employees) {
  const select = document.getElementById("newUserEmployee");
  select.innerHTML = '<option value="">Nessun dipendente associato</option>';

  employees.forEach((employee) => {
    const option = document.createElement("option");
    option.value = employee.ID;
    option.textContent = `${employee.Nome} ${employee.Cognome} (${employee.Matricola})`;
    select.appendChild(option);
  });
}

// Form Submissions
document
  .getElementById("createUserForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = {
      username: document.getElementById("newUsername").value,
      password: document.getElementById("newPassword").value,
      ruolo: document.getElementById("newUserRole").value,
      idDipendente: document.getElementById("newUserEmployee").value || null,
    };

    try {
      const response = await fetch("http://localhost:3000/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        showToast("Utente creato con successo");
        hideCreateUserModal();
        loadUsers();
      } else {
        const data = await response.json();
        showToast(data.error, "error");
      }
    } catch (error) {
      showToast("Errore nella creazione dell'utente", "error");
    }
  });

document
  .getElementById("createEmployeeForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = {
      nome: document.getElementById("newEmployeeName").value,
      cognome: document.getElementById("newEmployeeSurname").value,
      matricola: document.getElementById("newEmployeeMatricola").value,
      ruolo: document.getElementById("newEmployeeRole").value,
      email: document.getElementById("newEmployeeEmail").value,
      telefono: document.getElementById("newEmployeePhone").value,
      reparto: document.getElementById("newEmployeeDepartment").value,
      dataAssunzione: document.getElementById("newEmployeeHireDate").value,
    };

    try {
      const response = await fetch("http://localhost:3000/api/dipendenti", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        showToast("Dipendente creato con successo");
        hideCreateEmployeeModal();
        loadEmployees();
      } else {
        const data = await response.json();
        showToast(data.error, "error");
      }
    } catch (error) {
      showToast("Errore nella creazione del dipendente", "error");
    }
  });

// Delete Functions
async function deleteUser(userId) {
  if (!confirm("Sei sicuro di voler eliminare questo utente?")) return;

  try {
    const response = await fetch(`http://localhost:3000/api/users/${userId}`, {
      method: "DELETE",
    });

    if (response.ok) {
      showToast("Utente eliminato con successo");
      loadUsers();
    } else {
      const data = await response.json();
      showToast(data.error, "error");
    }
  } catch (error) {
    showToast("Errore nell'eliminazione dell'utente", "error");
  }
}

async function deleteEmployee(employeeId) {
  if (!confirm("Sei sicuro di voler eliminare questo dipendente?")) return;

  try {
    const response = await fetch(
      `http://localhost:3000/api/dipendenti/${employeeId}`,
      {
        method: "DELETE",
      },
    );

    if (response.ok) {
      showToast("Dipendente eliminato con successo");
      loadEmployees();
    } else {
      const data = await response.json();
      showToast(data.error, "error");
    }
  } catch (error) {
    showToast("Errore nell'eliminazione del dipendente", "error");
  }
}

// Statistics and Reports
async function loadStatistics() {
  const monthInput = document.getElementById("statsMonth");
  const month = monthInput.value;

  if (!month) {
    monthInput.value = new Date().toISOString().slice(0, 7);
    return;
  }

  try {
    const [year, monthNum] = month.split("-");
    const response = await fetch(
      `http://localhost:3000/api/presenze/statistiche?mese=${monthNum}&anno=${year}`,
    );
    const stats = await response.json();
    displayStatistics(stats);
  } catch (error) {
    console.error("Errore nel caricamento delle statistiche:", error);
    showToast("Errore nel caricamento delle statistiche", "error");
  }
}

function displayStatistics(stats) {
  const container = document.getElementById("statisticsResults");

  if (stats.length === 0) {
    container.innerHTML =
      '<p class="text-gray-500">Nessun dato disponibile per questo periodo</p>';
    return;
  }

  container.innerHTML = stats
    .map(
      (stat) => `
        <div class="bg-gray-50 rounded-lg p-3">
            <h4 class="font-semibold text-gray-900">${stat.Nome} ${stat.Cognome}</h4>
            <div class="grid grid-cols-3 gap-2 text-sm mt-2">
                <div>
                    <span class="text-gray-600">Presenze:</span>
                    <span class="font-medium text-green-600">${stat.giorni_presenza || 0}</span>
                </div>
                <div>
                    <span class="text-gray-600">Assenze:</span>
                    <span class="font-medium text-red-600">${stat.giorni_assenza || 0}</span>
                </div>
                <div>
                    <span class="text-gray-600">Media ore/giorno:</span>
                    <span class="font-medium text-blue-600">${(stat.media_ore_giorno || 0).toFixed(1)}h</span>
                </div>
            </div>
        </div>
    `,
    )
    .join("");
}

function exportReport() {
  const reportType = document.getElementById("reportType").value;
  const startDate = document.getElementById("reportStartDate").value;
  const endDate = document.getElementById("reportEndDate").value;

  if (!startDate || !endDate) {
    showToast("Seleziona le date per il report", "error");
    return;
  }

  // For now, just show a success message
  // In a real implementation, this would generate and download a file
  showToast(
    `Report ${reportType} esportato per il periodo ${startDate} - ${endDate}`,
  );
}

// Utility Functions
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

// Edit User Modal Logic
window.editUser = async function (userId) {
  try {
    const response = await fetch(`http://localhost:3000/api/users`);
    const users = await response.json();
    const user = users.find((u) => u.ID === userId);
    if (!user) return;
    document.getElementById("editUserId").value = user.ID;
    document.getElementById("editUsername").value = user.Username;
    document.getElementById("editPassword").value = "";
    document.getElementById("editUserRole").value = user.LivelloAccesso;
    // Carica dipendenti disponibili
    const empRes = await fetch("http://localhost:3000/api/dipendenti");
    const employees = await empRes.json();
    const select = document.getElementById("editUserEmployee");
    select.innerHTML = '<option value="">Nessun dipendente associato</option>';
    employees.forEach((emp) => {
      // Mostra solo dipendenti non già associati o quello attuale
      const alreadyLinked = users.some(
        (u) => u.ID_Dipendente === emp.ID && u.ID !== userId,
      );
      if (!alreadyLinked || user.ID_Dipendente === emp.ID) {
        const option = document.createElement("option");
        option.value = emp.ID;
        option.textContent = `${emp.Nome} ${emp.Cognome} (${emp.Matricola})`;
        if (user.ID_Dipendente === emp.ID) option.selected = true;
        select.appendChild(option);
      }
    });
    document.getElementById("editUserModal").classList.remove("hidden");
  } catch (error) {
    showToast("Errore nel caricamento dati utente", "error");
  }
};

window.hideEditUserModal = function () {
  document.getElementById("editUserModal").classList.add("hidden");
  document.getElementById("editUserForm").reset();
};

document
  .getElementById("editUserForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = document.getElementById("editUserId").value;
    const username = document.getElementById("editUsername").value;
    const password = document.getElementById("editPassword").value;
    const ruolo = document.getElementById("editUserRole").value;
    const idDipendente =
      document.getElementById("editUserEmployee").value || null;
    try {
      const body = { username, ruolo, idDipendente };
      if (password) body.password = password;
      const response = await fetch(`http://localhost:3000/api/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (response.ok) {
        showToast("Utente aggiornato con successo");
        hideEditUserModal();
        loadUsers();
      } else {
        const data = await response.json();
        showToast(data.error, "error");
      }
    } catch (error) {
      showToast("Errore nel salvataggio", "error");
    }
  });

// Edit Employee Modal Logic
window.editEmployee = async function (employeeId) {
  try {
    const response = await fetch("http://localhost:3000/api/dipendenti");
    const employees = await response.json();
    const emp = employees.find((e) => e.ID === employeeId);
    if (!emp) return;
    document.getElementById("editEmployeeId").value = emp.ID;
    document.getElementById("editEmployeeName").value = emp.Nome;
    document.getElementById("editEmployeeSurname").value = emp.Cognome;
    document.getElementById("editEmployeeMatricola").value = emp.Matricola;
    document.getElementById("editEmployeeRole").value = emp.Ruolo;
    document.getElementById("editEmployeeEmail").value = emp.Email;
    document.getElementById("editEmployeePhone").value = emp.Telefono || "";
    document.getElementById("editEmployeeDepartment").value = emp.Reparto || "";
    document.getElementById("editEmployeeHireDate").value = emp.DataAssunzione;
    document.getElementById("editEmployeeStatus").value = emp.Attivo;
    document.getElementById("editEmployeeModal").classList.remove("hidden");
  } catch (error) {
    showToast("Errore nel caricamento dati dipendente", "error");
  }
};

window.hideEditEmployeeModal = function () {
  document.getElementById("editEmployeeModal").classList.add("hidden");
  document.getElementById("editEmployeeForm").reset();
};

document
  .getElementById("editEmployeeForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = document.getElementById("editEmployeeId").value;
    const nome = document.getElementById("editEmployeeName").value;
    const cognome = document.getElementById("editEmployeeSurname").value;
    const matricola = document.getElementById("editEmployeeMatricola").value;
    const ruolo = document.getElementById("editEmployeeRole").value;
    const email = document.getElementById("editEmployeeEmail").value;
    const telefono = document.getElementById("editEmployeePhone").value;
    const reparto = document.getElementById("editEmployeeDepartment").value;
    const dataAssunzione = document.getElementById(
      "editEmployeeHireDate",
    ).value;
    const attivo = document.getElementById("editEmployeeStatus").value;
    try {
      const body = {
        nome,
        cognome,
        matricola,
        ruolo,
        email,
        telefono,
        reparto,
        dataAssunzione,
        attivo,
      };
      const response = await fetch(
        `http://localhost:3000/api/dipendenti/${id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      if (response.ok) {
        showToast("Dipendente aggiornato con successo");
        hideEditEmployeeModal();
        loadEmployees();
        loadUsers(); // aggiorna anche la tabella utenti se serve
      } else {
        const data = await response.json();
        showToast(data.error, "error");
      }
    } catch (error) {
      showToast("Errore nel salvataggio", "error");
    }
  });

// Initialize on page load
document.addEventListener("DOMContentLoaded", () => {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user || user.ruolo !== "Admin") {
    window.location.href = "login.html";
    return;
  }

  // Load initial data
  loadDashboardData();

  // Set current month for statistics
  const now = new Date();
  document.getElementById("statsMonth").value = now.toISOString().slice(0, 7);

  // Set default dates for reports
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  document.getElementById("reportStartDate").value = firstDay
    .toISOString()
    .slice(0, 10);
  document.getElementById("reportEndDate").value = lastDay
    .toISOString()
    .slice(0, 10);
});
