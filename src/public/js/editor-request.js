// Inicializar la sección de solicitud de editor
async function initEditorRequest() {
    try {
        const user = currentUser;
        
        if (!user) {
            console.log('Usuario no autenticado');
            return;
        }
        
        console.log('Usuario actual:', user, 'Rolid:', user.Rolid);
        
        // Solo mostrar a usuarios normales (Rolid 2)
        if (user.Rolid === 2) {
            const editorRequestSection = document.getElementById('editorRequestSection');
            const editorRequestForm = document.getElementById('editorRequestForm');
            const btnRequestEditor = document.getElementById('btnRequestEditor');
            
            if (!editorRequestSection || !editorRequestForm || !btnRequestEditor) {
                console.error('Elementos no encontrados');
                return;
            }
            
            editorRequestSection.style.display = 'block';
            
            const response = await fetch('/api/profile/editor-request', { cache: 'no-store' });
            const data = await response.json();
            
            if (data.success && data.solicitud) {
                mostrarEstadoSolicitud(data.solicitud);
            } else {
                prepararFormularioSolicitud();
            }
        } else {
            console.log('El usuario no es Normal (Rolid 2), es:', user.Rolid);
        }
    } catch (error) {
        console.error('Error inicializando solicitud de editor:', error);
    }
}

function prepararFormularioSolicitud() {
    const editorRequestForm = document.getElementById('editorRequestForm');
    const btnRequestEditor = document.getElementById('btnRequestEditor');

    if (!editorRequestForm || !btnRequestEditor) return;

    editorRequestForm.style.display = 'none';
    btnRequestEditor.style.display = 'block';

    const btnClone = btnRequestEditor.cloneNode(true);
    btnRequestEditor.parentNode.replaceChild(btnClone, btnRequestEditor);

    const formClone = editorRequestForm.cloneNode(true);
    editorRequestForm.parentNode.replaceChild(formClone, editorRequestForm);

    const newBtn = document.getElementById('btnRequestEditor');
    const newForm = document.getElementById('editorRequestForm');

    if (newBtn) {
        newBtn.addEventListener('click', function() {
            document.getElementById('editorRequestForm').style.display = 'block';
            document.getElementById('btnRequestEditor').style.display = 'none';
        });
    }

    if (newForm) {
        newForm.addEventListener('submit', enviarSolicitud);
    }
}

// Mostrar estado de la solicitud existente
function mostrarEstadoSolicitud(solicitud) {
    const statusDiv = document.getElementById('editorRequestStatus');
    const editorRequestForm = document.getElementById('editorRequestForm');
    const btnRequestEditor = document.getElementById('btnRequestEditor');
    
    // Si la solicitud fue aprobada pero el usuario actual es normal (no es editor),
    // significa que fue demotido. En ese caso mostrar opción de nueva solicitud
    if (solicitud.estado === 'aprobada' && currentUser && currentUser.Rolid === 2) {
        // Mostrar mensaje de democión
        const fechaAprobacion = new Date(solicitud.fecha_respuesta).toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        statusDiv.innerHTML = `
            <div style="margin-bottom: 1rem;">
                <span class="badge" style="display: inline-block; padding: 0.75rem 1.5rem; font-size: 1rem; background-color: #ff9800; color: white;">
                    ⚠️ Cambio de rol
                </span>
            </div>
            <p class="text-muted" style="margin-top: 1rem; font-size: 0.9rem;">
                <strong>Tu solicitud anterior fue aprobada el ${fechaAprobacion}</strong>, pero tu rol ha sido modificado.
            </p>
            <p class="text-muted" style="font-size: 0.9rem; margin-top: 1rem;">
                Si deseas ser editor nuevamente, puedes enviar una nueva solicitud a continuación.
            </p>
        `;
        
        prepararFormularioSolicitud();
        return;
    }
    
    if (editorRequestForm) editorRequestForm.style.display = 'none';
    if (btnRequestEditor) btnRequestEditor.style.display = 'none';
    
    let estadoClass = '';
    let estadoTexto = '';
    let detalles = '';
    
    const fechaSolicitud = new Date(solicitud.fecha_solicitud).toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    const tieneComentario = solicitud.comentario_admin && solicitud.comentario_admin.trim().length > 0;
    
    switch (solicitud.estado) {
        case 'pendiente':
            estadoClass = 'badge-pendiente';
            estadoTexto = 'Pendiente de revisión';
            detalles = `
                <p class="text-muted" style="margin-top: 1rem; font-size: 0.9rem;">
                    <strong>📋 Estado:</strong> Tu solicitud fue enviada el ${fechaSolicitud}. 
                </p>
                <p class="text-muted" style="font-size: 0.9rem;">
                    Un administrador la revisará pronto y te notificará de la decisión.
                </p>
                <hr style="border:1px solid var(--border); margin: 1rem 0;">
                <p class="text-muted" style="font-size: 0.85rem;">
                    <strong>Tu motivo:</strong><br>
                    ${solicitud.motivo}
                </p>
            `;
            break;
        case 'aprobada':
            estadoClass = 'badge-aprobada';
            estadoTexto = 'Aprobada ✓';
            const fechaAprobacion = new Date(solicitud.fecha_respuesta).toLocaleDateString('es-ES', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            detalles = `
                <p class="text-muted" style="margin-top: 1rem; font-size: 0.9rem;">
                    <strong>🎉 ¡Felicidades!</strong> Tu solicitud fue aprobada el ${fechaAprobacion}.
                </p>
                <p class="text-muted" style="font-size: 0.9rem;">
                    Ya puedes crear y publicar artículos en la plataforma. 
                    Accede al <strong><a href="/pages/editor.html" style="color:var(--primary); text-decoration:underline;">Panel del Editor</a></strong>.
                </p>
                ${tieneComentario ? `
                    <hr style="border:1px solid var(--border); margin: 1rem 0;">
                    <p style="margin: 1rem 0;">
                        <strong style="color:var(--primary);">💬 Comentario del administrador:</strong>
                    </p>
                    <div style="background:var(--bg-main); padding:1rem; border-left:3px solid var(--primary); border-radius:4px; font-size:0.9rem;">
                        ${solicitud.comentario_admin}
                    </div>
                ` : ''}
            `;
            break;
        case 'rechazada':
            estadoClass = 'badge-rechazada';
            estadoTexto = 'Rechazada ✗';
            const fechaRechazo = new Date(solicitud.fecha_respuesta).toLocaleDateString('es-ES', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            detalles = `
                <p class="text-muted" style="margin-top: 1rem; font-size: 0.9rem;">
                    <strong>❌ Tu solicitud fue rechazada</strong> el ${fechaRechazo}.
                </p>
                ${tieneComentario ? `
                    <p style="margin: 1rem 0;">
                        <strong style="color:var(--danger);">💬 Motivo del rechazo:</strong>
                    </p>
                    <div style="background:var(--bg-main); padding:1rem; border-left:3px solid var(--danger); border-radius:4px; font-size:0.9rem;">
                        ${solicitud.comentario_admin}
                    </div>
                ` : `
                    <p class="text-muted" style="font-size: 0.9rem; margin-top: 1rem;">
                        No se proporcionó un motivo específico.
                    </p>
                `}
                <p class="text-muted" style="font-size: 0.9rem; margin-top: 1rem;">
                    Puedes intentar enviar una nueva solicitud más adelante si lo deseas.
                </p>
            `;
            break;
    }
    
    statusDiv.innerHTML = `
        <div style="margin-bottom: 1rem;">
            <span class="badge ${estadoClass}" style="display: inline-block; padding: 0.75rem 1.5rem; font-size: 1rem;">
                ${estadoTexto}
            </span>
        </div>
        ${detalles}
    `;
}

// Enviar solicitud de editor
async function enviarSolicitud(event) {
    event.preventDefault();
    
    const motivo = document.getElementById('editorMotivo').value.trim();
    
    if (motivo.length < 10) {
        Swal.fire({
            icon: 'warning',
            title: 'Campo incompleto',
            text: 'Por favor, proporciona una descripción de al menos 10 caracteres.',
            confirmButtonText: 'Aceptar'
        });
        return;
    }
    
    try {
        const response = await fetch('/api/profile/editor-request', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ motivo })
        });
        
        const data = await response.json();
        
        if (data.success) {
            Swal.fire({
                icon: 'success',
                title: '¡Solicitud enviada!',
                text: 'Tu solicitud de editor ha sido enviada. Un administrador la revisará pronto.',
                confirmButtonText: 'Aceptar'
            }).then(() => {
                location.reload();
            });
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: data.message || 'Error al enviar la solicitud',
                confirmButtonText: 'Aceptar'
            });
        }
    } catch (error) {
        console.error('Error enviando solicitud:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Error al enviar la solicitud',
            confirmButtonText: 'Aceptar'
        });
    }
}
