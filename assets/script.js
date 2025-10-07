// === CONFIGURASI DASAR ===
const API_BASE = window.location.origin; // otomatis sesuai domain kamu

// === CEK LOGIN OTOMATIS DI SETIAP HALAMAN ===
document.addEventListener("DOMContentLoaded", () => {
  const path = window.location.pathname;

  // Kalau user sudah login tapi masih di /login atau /register → langsung ke dashboard
  if ((path === "/login" || path === "/register") && localStorage.getItem("apikey")) {
    window.location.href = "/dashboard";
  }

  // Kalau user belum login tapi mencoba masuk ke dashboard → redirect ke /login
  if (path === "/dashboard" && !localStorage.getItem("apikey")) {
    window.location.href = "/login";
  }

  // Logout handler
  const logoutBtn = document.getElementById("logout");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.clear();
      window.location.href = "/login";
    });
  }

  // Tampilkan data user di dashboard
  if (path === "/dashboard" && localStorage.getItem("user")) {
    const user = JSON.parse(localStorage.getItem("user"));
    document.getElementById("username").textContent = user.username;
    document.getElementById("email").textContent = user.email;
    document.getElementById("apikey").textContent = localStorage.getItem("apikey");
  }
});

// === HANDLE LOGIN ===
async function handleLogin(e) {
  e.preventDefault();
  const username = document.getElementById("login-username").value.trim();
  const password = document.getElementById("login-password").value.trim();

  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  const data = await res.json();

  if (data.status) {
    localStorage.setItem("apikey", data.apikey);
    localStorage.setItem("user", JSON.stringify(data.user));
    localStorage.setItem("loginTime", Date.now());
    alert("Login berhasil!");
    window.location.href = "/dashboard";
  } else {
    alert(data.error || "Login gagal!");
  }
}

// === HANDLE REGISTER ===
async function handleRegister(e) {
  e.preventDefault();
  const username = document.getElementById("reg-username").value.trim();
  const email = document.getElementById("reg-email").value.trim();
  const password = document.getElementById("reg-password").value.trim();
  const repeat = document.getElementById("reg-repeat").value.trim();

  if (password !== repeat) {
    return alert("Password tidak sama!");
  }

  const res = await fetch(`${API_BASE}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, email, password }),
  });

  const data = await res.json();

  if (data.status) {
    alert("Registrasi berhasil! Silakan login.");
    window.location.href = "/login";
  } else {
    alert(data.error || "Gagal mendaftar!");
  }
}
