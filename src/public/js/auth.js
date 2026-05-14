// Global Auth Script - Loaded on all pages
let currentUser = null;

async function checkAuth() {
    try {
        const response = await fetch('/api/auth/session-user');
        const data = await response.json();
        
        currentUser = data.loggedIn ? data.user : null;
        renderHeader();
        return currentUser;
    } catch (e) {
        console.error('Error authenticating:', e);
        return null;
    }
}

function renderHeader() {
    const nav = document.getElementById('main-nav');
    const userArea = document.getElementById('user-area');
    
    if (!nav || !userArea) return;

    // Reset
    nav.innerHTML = '<a href="/">Artículos</a>';
    userArea.innerHTML = '';

    if (currentUser) {
        // Mostrar Panel Editor si tiene permisos de Escribir o Eliminar (común en editores/admins)
        if (currentUser.permissions.includes('Escribir') || currentUser.permissions.includes('Eliminar')) {
            nav.innerHTML += '<a href="/pages/editor.html">Panel Editor</a>';
        }
        
        // Mostrar Admin Dashboard solo si es Admin (Rolid 1)
        if (currentUser.Rolid === 1) {
            nav.innerHTML += '<a href="/pages/admin.html">Admin Dashboard</a>';
        }

        userArea.innerHTML = `
            <span><a href="/pages/perfil.html" style="color:var(--text-main); font-weight:bold; text-decoration:none;">${currentUser.Nombre}</a></span>
            <button id="logoutBtn" onclick="logout()" class="btn btn-danger">Salir</button>
        `;
    } else {
        userArea.innerHTML = `
            <a href="/pages/login.html" class="btn">Iniciar Sesión</a>
            <a href="/pages/register.html" class="btn btn-primary">Registrarse</a>
        `;
    }

    // Mobile Menu Toggle Logic
    const toggleBtn = document.getElementById('menuToggle');
    const menu = document.getElementById('main-nav');
    
    if (toggleBtn && menu) {
        toggleBtn.addEventListener('click', () => {
            const isExpanded = toggleBtn.getAttribute('aria-expanded') === 'true';
            toggleBtn.setAttribute('aria-expanded', !isExpanded);
            menu.classList.toggle('show');
            toggleBtn.innerHTML = isExpanded ? '☰' : '✕';
        });
    }
}

async function logout() {
    await fetch('/api/auth/logout', { method: 'GET' });
    window.location.href = '/pages/login.html';
}

function requireAuth() {
    if (!currentUser) window.location.href = '/pages/login.html';
}

function requireRole(roles) {
    if (!currentUser || !roles.includes(currentUser.Rolid)) {
        window.location.href = '/';
    }
}
