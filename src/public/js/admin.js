async function loadAdminData() {
    try {
        const res = await fetch('/api/admin', { cache: 'no-store' });
        const data = await res.json();
        if(!data.success) return console.error(data.message);

        // Render Users
        const tbodyUsers = document.querySelector('#users-table tbody');
        tbodyUsers.innerHTML = data.users.map(u => `
            <tr>
                <td>${u.Iduser}</td>
                <td>${u.Nombre}</td>
                <td>${u.Correo}</td>
                <td><span class="badge" style="background:var(--accent); color:black;">${u.Rol}</span></td>
                <td>
                    <form onsubmit="changeUserRole(event, ${u.Iduser})" style="display:flex; gap:0.5rem;">
                        <select id="roleSelect_${u.Iduser}" style="padding:0.25rem; width:120px;">
                            ${data.roles.map(r => `<option value="${r.Rolid}" ${r.Rolid === u.Rolid ? 'selected' : ''}>${r.Nombre}</option>`).join('')}
                        </select>
                        <button type="submit" class="btn btn-primary" style="padding:0.25rem 0.5rem;">Guardar</button>
                    </form>
                </td>
            </tr>
        `).join('');

        // Render Roles & Permissions
        const rolesContainer = document.getElementById('roles-container');
        rolesContainer.innerHTML = data.roles.map(rol => `
            <div style="margin-bottom: 2rem; border-bottom: 1px solid var(--border); padding-bottom: 1rem;">
                <h3>${rol.Nombre}</h3>
                <div class="mt-1 mb-1">
                    Permisos: 
                    ${rol.permisos.length > 0 ? rol.permisos.map(p => `
                        <span class="badge">
                            ${p.Nombre}
                            <button onclick="revokePermission(${rol.Rolid}, ${p.Permisosid})" style="background:none; border:none; color:var(--danger); cursor:pointer;">✖</button>
                        </span>
                    `).join('') : '<span class="text-muted">Ninguno</span>'}
                </div>
                <div class="d-flex align-center" style="gap:1rem;">
                    <form onsubmit="addPermission(event, ${rol.Rolid})" style="display:flex; gap:0.5rem;">
                        <select id="permSelect_${rol.Rolid}" style="width:200px; padding:0.25rem;">
                            ${data.permisos.map(pe => `<option value="${pe.Permisosid}">${pe.Nombre}</option>`).join('')}
                        </select>
                        <button type="submit" class="btn btn-primary" style="padding:0.25rem 0.5rem;">Añadir Permiso</button>
                    </form>
                </div>
            </div>
        `).join('');

        // Render Audit
        const tbodyAudit = document.querySelector('#audit-table tbody');
        tbodyAudit.innerHTML = data.auditLogs.map(log => `
            <tr>
                <td>${log.id}</td>
                <td style="white-space:nowrap">${new Date(log.fecha).toLocaleString()}</td>
                <td>${log.Usuario || 'N/A'}</td>
                <td>${log.tabla}</td>
                <td><span class="badge ${log.accion === 'DELETE' ? 'btn-danger' : 'btn-primary'}">${log.accion}</span></td>
                <td>${log.detalles}</td>
            </tr>
        `).join('');

    } catch (e) {
        console.error(e);
        Swal.fire({icon: 'error', title: 'Error obteniendo datos'});
    }
}

async function refreshAdminViews() {
    await Promise.all([
        loadAdminData(),
        loadEditorRequests()
    ]);
}

// Admin Actions
window.changeUserRole = async (e, Iduser) => {
    e.preventDefault();
    const Rolid = document.getElementById(`roleSelect_${Iduser}`).value;
    await fetch('/api/admin/user-role', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({Iduser, Rolid})
    });
    loadAdminData();
}

window.addPermission = async (e, Rolid) => {
    e.preventDefault();
    const Permisosid = document.getElementById(`permSelect_${Rolid}`).value;
    await fetch('/api/admin/permission-assign', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({Rolid, Permisosid})
    });
    loadAdminData();
}

window.revokePermission = async (Rolid, Permisosid) => {
    await fetch('/api/admin/permission-revoke', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({Rolid, Permisosid})
    });
    loadAdminData();
}

document.getElementById('createRoleForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const Nombre = document.getElementById('newRoleName').value;
    await fetch('/api/admin/role', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({Nombre})
    });
    document.getElementById('newRoleName').value = '';
    loadAdminData();
});

// Cargar solicitudes de editor
let currentEditorRequestFilter = 'todos';

async function loadEditorRequests() {
    try {
        const res = await fetch('/api/profile/editor-requests', { cache: 'no-store' });
        const data = await res.json();
        if(!data.success) return console.error(data.message);

        const tbody = document.querySelector('#editor-requests-table tbody');
        tbody.innerHTML = data.solicitudes.map(s => {
            let estadoColor = 'badge-pendiente';
            if (s.estado === 'aprobada') estadoColor = 'badge-aprobada';
            if (s.estado === 'rechazada') estadoColor = 'badge-rechazada';
            
            return `
                <tr>
                    <td>${s.idsolicitud}</td>
                    <td>${s.Nombre}</td>
                    <td>${s.Correo}</td>
                    <td style="max-width: 300px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${s.motivo}">${s.motivo}</td>
                    <td><span class="badge ${estadoColor}">${s.estado.toUpperCase()}</span></td>
                    <td style="white-space:nowrap">${new Date(s.fecha_solicitud).toLocaleString()}</td>
                    <td>
                        ${s.estado === 'pendiente' ? `
                            <button class="btn btn-primary" style="padding:0.25rem 0.5rem; margin-right:0.25rem;" onclick="approveEditorRequest(${s.idsolicitud})">Aprobar</button>
                            <button class="btn btn-danger" style="padding:0.25rem 0.5rem;" onclick="rejectEditorRequest(${s.idsolicitud})">Rechazar</button>
                        ` : ''}
                    </td>
                </tr>
            `;
        }).join('');

        applyRequestFilter(currentEditorRequestFilter);

    } catch (e) {
        console.error(e);
        Swal.fire({icon: 'error', title: 'Error cargando solicitudes de editor'});
    }
}

function applyRequestFilter(status) {
    const tbody = document.querySelector('#editor-requests-table tbody');
    if (!tbody) return;

    const rows = tbody.querySelectorAll('tr');
    rows.forEach(row => {
        const estadoCell = row.querySelector('td:nth-child(5)');
        const estadoText = estadoCell ? estadoCell.textContent.toLowerCase() : '';

        if (status === 'todos' || estadoText.includes(status)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

// Filtrar solicitudes por estado
window.filterRequestsByStatus = async (status) => {
    const tabs = document.querySelectorAll('.tab-btn');
    currentEditorRequestFilter = status;

    tabs.forEach(tab => {
        tab.classList.remove('active');
        tab.setAttribute('aria-selected', 'false');
    });
    event.target.classList.add('active');
    event.target.setAttribute('aria-selected', 'true');

    applyRequestFilter(status);
}

// Aprobar solicitud de editor
window.approveEditorRequest = async (idsolicitud) => {
    const { value: comentario } = await Swal.fire({
        title: '¿Aprobar solicitud?',
        input: 'textarea',
        inputPlaceholder: 'Comentario opcional (p.ej., "Bienvenido al equipo de editores")...',
        showCancelButton: true,
        confirmButtonText: 'Aprobar',
        cancelButtonText: 'Cancelar'
    });
    
    if (comentario !== undefined) {
        try {
            const res = await fetch('/api/profile/editor-request/approve', {
                method: 'PUT',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({idsolicitud, comentario: comentario || ''})
            });
            
            const data = await res.json();
            if (data.success) {
                Swal.fire('¡Hecho!', 'Solicitud aprobada correctamente', 'success');
                // Actualizar ambas tablas
                loadEditorRequests();
                loadAdminData();
            } else {
                Swal.fire('Error', data.message, 'error');
            }
        } catch (e) {
            console.error(e);
            Swal.fire('Error', 'Error al aprobar solicitud', 'error');
        }
    }
}

// Rechazar solicitud de editor
window.rejectEditorRequest = async (idsolicitud) => {
    const { value: comentario } = await Swal.fire({
        title: '¿Rechazar solicitud?',
        input: 'textarea',
        inputPlaceholder: 'Motivo del rechazo (opcional)...',
        showCancelButton: true,
        confirmButtonText: 'Rechazar',
        cancelButtonText: 'Cancelar'
    });
    
    if (comentario !== undefined) {
        try {
            const res = await fetch('/api/profile/editor-request/reject', {
                method: 'PUT',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({idsolicitud, comentario: comentario || ''})
            });
            
            const data = await res.json();
            if (data.success) {
                Swal.fire('¡Hecho!', 'Solicitud rechazada', 'success');
                // Actualizar ambas tablas
                loadEditorRequests();
                loadAdminData();
            } else {
                Swal.fire('Error', data.message, 'error');
            }
        } catch (e) {
            console.error(e);
            Swal.fire('Error', 'Error al rechazar solicitud', 'error');
        }
    }
}

let editorRequestsAutoRefreshStarted = false;

function startEditorRequestsAutoRefresh() {
    if (editorRequestsAutoRefreshStarted) return;
    editorRequestsAutoRefreshStarted = true;

    setInterval(() => {
        if (document.visibilityState === 'visible') {
            refreshAdminViews();
        }
    }, 15000);

    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            refreshAdminViews();
        }
    });
}

startEditorRequestsAutoRefresh();


async function performBackup() {
    const btn = document.getElementById('btn-backup');
    const text = document.getElementById('backup-text');
    
    try {
        btn.disabled = true;
        text.innerText = 'Realizando respaldo...';
        
        const response = await fetch('/api/admin/backup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        
        const data = await response.json();
        
        if (data.success) {
            Swal.fire({
                title: '¡Éxito!',
                text: 'El respaldo se ha realizado correctamente y está encriptado en el USB.',
                icon: 'success',
                confirmButtonColor: '#007bff'
            });
            loadAdminData(); // Recargar para ver el log de auditoría
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        Swal.fire({
            title: 'Error',
            text: error.message || 'No se pudo realizar el respaldo.',
            icon: 'error',
            confirmButtonColor: '#dc3545'
        });
    } finally {
        btn.disabled = false;
        text.innerText = 'Realizar Respaldo Ahora';
    }
}
