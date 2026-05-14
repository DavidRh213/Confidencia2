async function handleRegister(e) {
    e.preventDefault();
    const Nombre = document.getElementById('Nombre').value;
    const Email = document.getElementById('Email').value;
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('passwordConfirm').value;

    if (password !== passwordConfirm) {
        return Swal.fire({ icon: 'error', text: 'Las contraseñas no coinciden' });
    }

    try {
        const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ Nombre, Email, password, passwordConfirm })
        });
        const data = await res.json();
        
        if (data.success) {
            Swal.fire({ icon: 'success', title: 'Éxito', text: 'Usuario creado' }).then(() => {
                window.location.href = data.redirect;
            });
        } else {
            Swal.fire({ icon: 'error', title: 'Error', text: data.message });
        }
    } catch (error) {
        Swal.fire({ icon: 'error', title: 'Error interno' });
    }
}
