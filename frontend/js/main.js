// Utility functions for the entire application

// Show toast notification
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

// Show loading overlay
function showLoading() {
  const loadingOverlay = document.getElementById("loadingOverlay");
  if (loadingOverlay) {
    loadingOverlay.classList.remove("hidden");
  }
}

// Hide loading overlay
function hideLoading() {
  const loadingOverlay = document.getElementById("loadingOverlay");
  if (loadingOverlay) {
    loadingOverlay.classList.add("hidden");
  }
}

// Show error message
function showError(message) {
  const errorDiv = document.getElementById("error");
  const errorMessage = document.getElementById("errorMessage");

  if (errorDiv && errorMessage) {
    errorMessage.textContent = message;
    errorDiv.classList.remove("hidden");

    // Auto-hide after 5 seconds
    setTimeout(() => {
      errorDiv.classList.add("hidden");
    }, 5000);
  }
}

// Toggle password visibility
function togglePassword() {
  const passwordInput = document.getElementById("password");
  const passwordIcon = document.getElementById("passwordIcon");

  if (passwordInput && passwordIcon) {
    if (passwordInput.type === "password") {
      passwordInput.type = "text";
      passwordIcon.className = "fas fa-eye-slash";
    } else {
      passwordInput.type = "password";
      passwordIcon.className = "fas fa-eye";
    }
  }
}

// Update current time
function updateCurrentTime() {
  const timeElement = document.getElementById("currentTime");
  if (timeElement) {
    const now = new Date();
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

// Logout function
function logout() {
  localStorage.removeItem("user");
  window.location.href = "login.html";
}

// Check authentication
function checkAuth() {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user) {
    window.location.href = "login.html";
    return null;
  }
  return user;
}

// Format date for display
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("it-IT", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// Format time for display
function formatTime(timeString) {
  if (!timeString) return "Non registrata";
  return timeString;
}

// Calculate time difference
function calculateTimeDifference(startTime, endTime) {
  if (!startTime || !endTime) return "0h 0m";

  const start = new Date(`2000-01-01T${startTime}`);
  const end = new Date(`2000-01-01T${endTime}`);

  const diffMs = end - start;
  const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  return `${diffHrs}h ${diffMins}m`;
}

// Validate email format
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validate date range
function isValidDateRange(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return start <= end;
}

// Debounce function for search inputs
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Generate random ID
function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

// Copy to clipboard
function copyToClipboard(text) {
  if (navigator.clipboard) {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        showToast("Copiato negli appunti");
      })
      .catch(() => {
        showToast("Errore nella copia", "error");
      });
  } else {
    // Fallback for older browsers
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand("copy");
    document.body.removeChild(textArea);
    showToast("Copiato negli appunti");
  }
}

// Export data to CSV
function exportToCSV(data, filename) {
  const csvContent = "data:text/csv;charset=utf-8," + data;
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Format file size
function formatFileSize(bytes) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

// Check if user has permission
function hasPermission(user, requiredRole) {
  if (!user) return false;

  const roleHierarchy = {
    Dipendente: 1,
    Responsabile: 2,
    Admin: 3,
  };

  const userLevel = roleHierarchy[user.ruolo] || 0;
  const requiredLevel = roleHierarchy[requiredRole] || 0;

  return userLevel >= requiredLevel;
}

// Get user display name
function getUserDisplayName(user) {
  if (user.nome && user.cognome) {
    return `${user.nome} ${user.cognome}`;
  }
  return user.username || "Utente";
}

// Format status badge
function getStatusBadge(status) {
  const statusConfig = {
    "In attesa": "bg-yellow-100 text-yellow-800",
    Approvata: "bg-green-100 text-green-800",
    Rifiutata: "bg-red-100 text-red-800",
    Attivo: "bg-green-100 text-green-800",
    Inattivo: "bg-red-100 text-red-800",
  };

  return statusConfig[status] || "bg-gray-100 text-gray-800";
}

// Initialize common functionality
document.addEventListener("DOMContentLoaded", () => {
  // Update time every second
  setInterval(updateCurrentTime, 1000);
  updateCurrentTime();

  // Add keyboard shortcuts
  document.addEventListener("keydown", (e) => {
    // Ctrl/Cmd + L for logout
    if ((e.ctrlKey || e.metaKey) && e.key === "l") {
      e.preventDefault();
      logout();
    }

    // Escape key to close modals
    if (e.key === "Escape") {
      const modals = document.querySelectorAll(".fixed.inset-0");
      modals.forEach((modal) => {
        if (!modal.classList.contains("hidden")) {
          modal.classList.add("hidden");
        }
      });
    }
  });

  // Add click outside to close modals
  document.addEventListener("click", (e) => {
    if (
      e.target.classList.contains("fixed") &&
      e.target.classList.contains("inset-0")
    ) {
      e.target.classList.add("hidden");
    }
  });
});

// API helper functions
const API = {
  baseURL: "http://localhost:3000/api",

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Errore del server");
      }

      return data;
    } catch (error) {
      console.error("API Error:", error);
      throw error;
    }
  },

  async get(endpoint) {
    return this.request(endpoint);
  },

  async post(endpoint, data) {
    return this.request(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  async put(endpoint, data) {
    return this.request(endpoint, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  async delete(endpoint) {
    return this.request(endpoint, {
      method: "DELETE",
    });
  },
};

// Export functions for use in other modules
window.AppUtils = {
  showToast,
  showLoading,
  hideLoading,
  showError,
  togglePassword,
  updateCurrentTime,
  logout,
  checkAuth,
  formatDate,
  formatTime,
  calculateTimeDifference,
  isValidEmail,
  isValidDateRange,
  debounce,
  generateId,
  copyToClipboard,
  exportToCSV,
  formatFileSize,
  hasPermission,
  getUserDisplayName,
  getStatusBadge,
  API,
};
