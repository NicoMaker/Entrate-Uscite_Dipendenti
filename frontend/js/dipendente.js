let currentUser = null;

// Tab Management
function showTab(tabName) {
    // Hide all tab contents
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // Remove active class from all tab buttons
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active', 'border-blue-500', 'text-blue-600');
        button.classList.add('border-transparent', 'text-gray-500');
    });
    
    // Show selected tab content
    document.getElementById(tabName).classList.add('active');
    
    // Add active class to selected tab button
    const activeButton = document.querySelector(`[onclick="showTab('${tabName}')"]`);
    activeButton.classList.add('active', 'border-blue-500', 'text-blue-600');
    activeButton.classList.remove('border-transparent', 'text-gray-500');
    
    // Load data for the selected tab
    switch(tabName) {
        case 'dashboard':
            loadDashboardData();
            break;
        case 'attendance':
            loadAttendanceHistory();
            break;
        case 'requests':
            loadRequests();
            break;
        case 'profile':
            loadProfile();
            break;
    }
}

// Dashboard Functions
async function loadDashboardData() {
    try {
        // Load user's attendance status for today
        await loadAttendanceStatus();
        
        // Load monthly statistics
        await loadMonthlyStats();
        
        // Load recent activity
        await loadRecentActivity();
        
    } catch (error) {
        console.error("Errore nel caricamento dei dati dashboard:", error);
        showToast("Errore nel caricamento dei dati", "error");
    }
}

async function loadAttendanceStatus() {
    try {
        const response = await fetch(`http://localhost:3000/api/presenze/dipendente/${currentUser.id}?mese=${new Date().getMonth() + 1}&anno=${new Date().getFullYear()}`);
        const presenze = await response.json();
        
        const today = new Date().toISOString().split('T')[0];
        const todayPresence = presenze.find(p => p.Data === today);
        
        const statusContainer = document.getElementById('attendanceStatus');
        
        if (todayPresence) {
            if (todayPresence.OraEntrata && todayPresence.OraUscita) {
                statusContainer.innerHTML = `
                    <div class="text-center">
                        <div class="text-2xl font-bold text-green-600 mb-2">
                            <i class="fas fa-check-circle"></i>
                        </div>
                        <p class="text-sm text-gray-600">Presenza completata</p>
                        <p class="text-xs text-gray-500">Entrata: ${todayPresence.OraEntrata}</p>
                        <p class="text-xs text-gray-500">Uscita: ${todayPresence.OraUscita}</p>
                    </div>
                `;
            } else if (todayPresence.OraEntrata) {
                statusContainer.innerHTML = `
                    <div class="text-center">
                        <div class="text-2xl font-bold text-yellow-600 mb-2">
                            <i class="fas fa-clock"></i>
                        </div>
                        <p class="text-sm text-gray-600">Presente in ufficio</p>
                        <p class="text-xs text-gray-500">Entrata: ${todayPresence.OraEntrata}</p>
                    </div>
                `;
            }
        } else {
            statusContainer.innerHTML = `
                <div class="text-center">
                    <div class="text-2xl font-bold text-gray-400 mb-2">
                        <i class="fas fa-user-clock"></i>
                    </div>
                    <p class="text-sm text-gray-600">Nessuna presenza registrata</p>
                    <p class="text-xs text-gray-500">Registra la tua entrata</p>
                </div>
            `;
        }
    } catch (error) {
        console.error("Errore nel caricamento dello stato presenza:", error);
    }
}

async function loadMonthlyStats() {
    try {
        const currentMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();
        
        const response = await fetch(`http://localhost:3000/api/presenze/statistiche?mese=${currentMonth}&anno=${currentYear}`);
        const stats = await response.json();
        
        const userStats = stats.find(s => s.ID === currentUser.id);
        
        if (userStats) {
            document.getElementById('presenceDays').textContent = userStats.giorni_presenza || 0;
            document.getElementById('totalHours').textContent = `${((userStats.media_ore_giorno || 0) * (userStats.giorni_presenza || 0)).toFixed(1)}h`;
            document.getElementById('avgHours').textContent = `${(userStats.media_ore_giorno || 0).toFixed(1)}h`;
        } else {
            document.getElementById('presenceDays').textContent = '0';
            document.getElementById('totalHours').textContent = '0h';
            document.getElementById('avgHours').textContent = '0h';
        }
    } catch (error) {
        console.error("Errore nel caricamento delle statistiche mensili:", error);
    }
}

async function loadRecentActivity() {
    try {
        const response = await fetch(`http://localhost:3000/api/presenze/dipendente/${currentUser.id}`);
        const presenze = await response.json();
        
        const recentPresenze = presenze.slice(0, 5); // Last 5 entries
        const container = document.getElementById('recentActivity');
        
        if (recentPresenze.length === 0) {
            container.innerHTML = `
                <div class="text-center text-gray-500 py-4">
                    <i class="fas fa-calendar-times text-2xl mb-2"></i>
                    <p>Nessuna attività recente</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = recentPresenze.map(presenza => `
            <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div class="flex items-center">
                    <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <i class="fas fa-calendar-day text-blue-600 text-sm"></i>
                    </div>
                    <div class="ml-3">
                        <p class="font-medium text-gray-900">${new Date(presenza.Data).toLocaleDateString('it-IT')}</p>
                        <p class="text-xs text-gray-600">${presenza.Tipologia}</p>
                    </div>
                </div>
                <div class="text-right text-sm">
                    ${presenza.OraEntrata ? `<p class="text-green-600">Entrata: ${presenza.OraEntrata}</p>` : ''}
                    ${presenza.OraUscita ? `<p class="text-red-600">Uscita: ${presenza.OraUscita}</p>` : ''}
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error("Errore nel caricamento delle attività recenti:", error);
    }
}

// Attendance Functions
async function loadAttendanceHistory() {
    const monthInput = document.getElementById('attendanceMonth');
    const month = monthInput.value;
    
    if (!month) {
        monthInput.value = new Date().toISOString().slice(0, 7);
        return;
    }
    
    try {
        const [year, monthNum] = month.split('-');
        const response = await fetch(`http://localhost:3000/api/presenze/dipendente/${currentUser.id}?mese=${monthNum}&anno=${year}`);
        const presenze = await response.json();
        
        displayAttendanceHistory(presenze);
    } catch (error) {
        console.error("Errore nel caricamento dello storico presenze:", error);
        showToast("Errore nel caricamento dello storico presenze", "error");
    }
}

function displayAttendanceHistory(presenze) {
    const container = document.getElementById('attendanceHistory');
    
    if (presenze.length === 0) {
        container.innerHTML = `
            <div class="text-center text-gray-500 py-8">
                <i class="fas fa-calendar-times text-3xl mb-2"></i>
                <p>Nessuna presenza registrata per questo mese</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = presenze.map(presenza => `
        <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div class="flex items-center">
                <div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <i class="fas fa-calendar-day text-blue-600"></i>
                </div>
                <div class="ml-4">
                    <p class="font-semibold text-gray-900">${new Date(presenza.Data).toLocaleDateString('it-IT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    <p class="text-sm text-gray-600">${presenza.Tipologia}</p>
                </div>
            </div>
            <div class="text-right">
                ${presenza.OraEntrata ? `<p class="text-sm font-medium text-green-600">Entrata: ${presenza.OraEntrata}</p>` : ''}
                ${presenza.OraUscita ? `<p class="text-sm font-medium text-red-600">Uscita: ${presenza.OraUscita}</p>` : ''}
                ${presenza.Note ? `<p class="text-xs text-gray-500 mt-1">${presenza.Note}</p>` : ''}
            </div>
        </div>
    `).join('');
}

// Request Functions
async function loadRequests() {
    try {
        const response = await fetch(`http://localhost:3000/api/richieste`);
        const requests = await response.json();
        
        // Filter requests for current user
        const userRequests = requests.filter(r => r.ID_Dipendente === currentUser.id);
        displayRequests(userRequests);
    } catch (error) {
        console.error("Errore nel caricamento delle richieste:", error);
        showToast("Errore nel caricamento delle richieste", "error");
    }
}

function displayRequests(requests) {
    const container = document.getElementById('requestsList');
    
    if (requests.length === 0) {
        container.innerHTML = `
            <div class="text-center text-gray-500 py-8">
                <i class="fas fa-file-alt text-3xl mb-2"></i>
                <p>Nessuna richiesta trovata</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = requests.map(request => `
        <div class="bg-gray-50 rounded-lg p-4">
            <div class="flex justify-between items-start">
                <div>
                    <h3 class="font-semibold text-gray-900">${request.TipoRichiesta}</h3>
                    <p class="text-sm text-gray-600">Periodo: ${request.DataInizio} - ${request.DataFine}</p>
                    ${request.Motivo ? `<p class="text-sm text-gray-600">Motivo: ${request.Motivo}</p>` : ''}
                    <p class="text-xs text-gray-500">Richiesta del: ${new Date(request.DataRichiesta).toLocaleDateString('it-IT')}</p>
                </div>
                <div class="text-right">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        request.Stato === 'In attesa' ? 'bg-yellow-100 text-yellow-800' :
                        request.Stato === 'Approvata' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                    }">
                        ${request.Stato}
                    </span>
                </div>
            </div>
        </div>
    `).join('');
}

// Profile Functions
async function loadProfile() {
    try {
        // For now, we'll use the user data from localStorage
        // In a real implementation, you might want to fetch additional profile data
        const container = document.getElementById('profileInfo');
        
        container.innerHTML = `
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700">Nome</label>
                    <p class="mt-1 text-sm text-gray-900">${currentUser.nome || 'Non disponibile'}</p>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">Cognome</label>
                    <p class="mt-1 text-sm text-gray-900">${currentUser.cognome || 'Non disponibile'}</p>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">Matricola</label>
                    <p class="mt-1 text-sm text-gray-900">${currentUser.matricola || 'Non disponibile'}</p>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">Ruolo</label>
                    <p class="mt-1 text-sm text-gray-900">${currentUser.ruoloDipendente || currentUser.ruolo || 'Non disponibile'}</p>
                </div>
            </div>
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700">Username</label>
                    <p class="mt-1 text-sm text-gray-900">${currentUser.username}</p>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">Livello Accesso</label>
                    <p class="mt-1 text-sm text-gray-900">${currentUser.ruolo}</p>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">ID Utente</label>
                    <p class="mt-1 text-sm text-gray-900">${currentUser.id}</p>
                </div>
            </div>
        `;
    } catch (error) {
        console.error("Errore nel caricamento del profilo:", error);
    }
}

// Attendance Actions
async function registraEntrata() {
    try {
        const response = await fetch("http://localhost:3000/api/presenze/entrata", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id_dipendente: currentUser.id }),
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
    try {
        const response = await fetch("http://localhost:3000/api/presenze/uscita", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id_dipendente: currentUser.id }),
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

// Modal Functions
function showCreateRequestModal() {
    document.getElementById("createRequestModal").classList.remove("hidden");
    
    // Set default dates
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    document.getElementById("requestStartDate").value = tomorrow.toISOString().slice(0, 10);
    document.getElementById("requestEndDate").value = tomorrow.toISOString().slice(0, 10);
}

function hideCreateRequestModal() {
    document.getElementById("createRequestModal").classList.add("hidden");
    document.getElementById("createRequestForm").reset();
}

// Form Submissions
document.getElementById("createRequestForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const formData = {
        id_dipendente: currentUser.id,
        tipoRichiesta: document.getElementById("requestType").value,
        dataInizio: document.getElementById("requestStartDate").value,
        dataFine: document.getElementById("requestEndDate").value,
        motivo: document.getElementById("requestReason").value
    };

    try {
        const response = await fetch("http://localhost:3000/api/richieste", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData),
        });

        if (response.ok) {
            showToast("Richiesta inviata con successo");
            hideCreateRequestModal();
            loadRequests();
        } else {
            const data = await response.json();
            showToast(data.error, "error");
        }
    } catch (error) {
        showToast("Errore nell'invio della richiesta", "error");
    }
});

// Utility Functions
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    
    if (!toast || !toastMessage) return;
    
    toast.className = `fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg transform translate-x-full transition-transform duration-300 z-50 ${
        type === 'success' ? 'bg-green-500' : 'bg-red-500'
    } text-white`;
    
    toastMessage.textContent = message;
    toast.classList.remove('translate-x-full');
    
    setTimeout(() => {
        toast.classList.add('translate-x-full');
    }, 3000);
}

// Initialize on page load
document.addEventListener("DOMContentLoaded", () => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) {
        window.location.href = "login.html";
        return;
    }

    currentUser = user;
    
    // Update welcome message
    const welcomeMessage = document.getElementById('welcomeMessage');
    if (welcomeMessage && user.nome && user.cognome) {
        welcomeMessage.textContent = `Benvenuto, ${user.nome} ${user.cognome}!`;
    }
    
    // Load initial data
    loadDashboardData();
    
    // Set current month for attendance history
    document.getElementById("attendanceMonth").value = new Date().toISOString().slice(0, 7);
}); 