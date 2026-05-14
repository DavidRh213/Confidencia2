async function loadProfileData() {
    try {
        const res = await fetch('/api/profile/perfil');
        const data = await res.json();
        
        if (data.success && data.user) {
            let rolStr = 'Usuario Normal';
            if (data.user.Rolid === 1) rolStr = 'Administrador';
            if (data.user.Rolid === 3) rolStr = 'Editor';

            document.getElementById('rolInput').value = rolStr;
            document.getElementById('nombreInput').value = data.user.Nombre;
            document.getElementById('emailInput').value = data.user.Email;

            document.getElementById('loadingMsg').style.display = 'none';
            document.getElementById('profileForm').style.display = 'block';
        }
    } catch(e) {
        console.error('Error loading profile');
        Swal.fire({icon: 'error', title: 'Error cargando datos'});
    }
}

async function updateProfileForm(e) {
    e.preventDefault();
    
    const Nombre = document.getElementById('nombreInput').value;
    const Email = document.getElementById('emailInput').value;
    const oldPassword = document.getElementById('oldPasswordInput').value;
    const newPassword = document.getElementById('passwordInput').value;

    try {
        const res = await fetch('/api/profile/perfil', {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ Nombre, Email, oldPassword, newPassword })
        });
        
        const data = await res.json();
        
        if (data.success) {
            Swal.fire({icon: 'success', title: 'Perfil Actualizado'}).then(() => {
                checkAuth(); 
                document.getElementById('oldPasswordInput').value = '';
                document.getElementById('passwordInput').value = '';
            });
        } else {
            Swal.fire({icon: 'error', title: 'Error', text: data.message});
        }
    } catch(err) {
        Swal.fire({icon: 'error', title: 'Error guardando perfil'});
    }
}
