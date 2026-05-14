async function handleLogin(e) {
    e.preventDefault();
    const Email = document.getElementById('Email').value;
    const password = document.getElementById('password').value;

    try {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ Email, password })
        });
        const data = await res.json();
        
        if (data.success) {
            window.location.href = data.redirect;
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: data.message
            });
        }
    } catch (error) {
        Swal.fire({icon: 'error', title: 'Error de red'});
    }
}

async function forgotPassword() {
    const { value: email } = await Swal.fire({
        title: 'Recuperar Contraseña',
        input: 'email',
        inputLabel: 'Ingresa tu correo electrónico',
        inputPlaceholder: 'tu@correo.com',
        showCancelButton: true,
        confirmButtonText: 'Recuperar',
        cancelButtonText: 'Cancelar'
    });

    if (email) {
        Swal.fire({ title: 'Enviando...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
        
        try {
            const res = await fetch('/api/auth/recover', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({Correo: email})
            });
            const data = await res.json();
            
            Swal.fire({ icon: 'info', title: 'Solicitud Recibida', text: data.message });
        } catch (e) {
            Swal.fire({icon: 'error', title: 'Error', text: 'Imposible comunicar con el servidor.'});
        }
    }
}
