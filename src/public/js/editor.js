async function loadEditorData() {
    try {
        const res = await fetch('/api/blog/editor');
        const data = await res.json();
        if(!data.success) return console.error(data.message);

        // Ocultar formulario de creación si no tiene permiso 'Escribir'
        if (currentUser && !currentUser.permissions.includes('Escribir')) {
            document.getElementById('article-form').style.display = 'none';
            // También el botón que lo abre si existe
            const openBtn = document.querySelector('button[onclick*="article-form"]');
            if(openBtn) openBtn.style.display = 'none';
        }

        // Populate Categories Select
        const catSelect = document.getElementById('id_categoria');
        catSelect.innerHTML = data.categories.map(c => `<option value="${c.idcategoria}">${c.Nombre}</option>`).join('');

        // Populate Articles Table
        const tbody = document.getElementById('articles-tableBody');
        tbody.innerHTML = data.articles.map(art => {
            const canEdit = currentUser && currentUser.permissions.includes('Editar') && (currentUser.Rolid === 1 || art.Iduser === currentUser.Iduser);
            const canDelete = currentUser && currentUser.permissions.includes('Eliminar') && (currentUser.Rolid === 1 || art.Iduser === currentUser.Iduser);
            
            return `
                <tr>
                    <td>${art.titulo}</td>
                    <td>${art.Categoria}</td>
                    <td>${new Date(art.fecha).toLocaleDateString()}</td>
                    <td>
                        <a href="/pages/articulo.html?id=${art.idarticulo}" class="btn" style="padding:0.25rem 0.5rem; display:inline-block;">Ver</a>
                        ${canEdit ? `<a href="/pages/edit.html?id=${art.idarticulo}" class="btn btn-primary" style="padding:0.25rem 0.5rem; display:inline-block;">Editar</a>` : ''}
                        ${canDelete ? `<button onclick="deleteArticleEditor(${art.idarticulo})" class="btn btn-danger" style="padding:0.25rem 0.5rem; display:inline-block;">Borrar</button>` : ''}
                    </td>
                </tr>
            `;
        }).join('');

    } catch (e) {
        console.error(e);
        Swal.fire({icon: 'error', title: 'Error obteniendo datos'});
    }
}

async function createArticle(e) {
    e.preventDefault();
    const payload = {
        titulo: document.getElementById('titulo').value,
        id_categoria: document.getElementById('id_categoria').value,
        imagen: document.getElementById('imagen').value,
        introduccion: document.getElementById('introduccion').value,
        contenido: document.getElementById('contenido').value
    };

    try {
        const res = await fetch('/api/blog/editor/article', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        
        if (data.success) {
            document.getElementById('createArticleForm').reset();
            document.getElementById('article-form').style.display = 'none';
            loadEditorData();
            Swal.fire({icon: 'success', title: 'Artículo Creado'});
        } else {
            Swal.fire({icon: 'error', title: 'Error', text: data.message});
        }
    } catch (error) {
        Swal.fire({icon: 'error', title: 'Error de red'});
    }
}

async function createCategoryAPI(e) {
    e.preventDefault();
    const Nombre = document.getElementById('newCategoryName').value;
    try {
        const res = await fetch('/api/blog/category', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({Nombre})
        });
        const data = await res.json();
        
        if (data.success) {
            document.getElementById('newCategoryName').value = '';
            document.getElementById('category-form').style.display = 'none';
            loadEditorData();
            Swal.fire({icon: 'success', title: 'Categoría Creada'});
        } else {
            Swal.fire({icon: 'error', title: 'Error', text: data.message});
        }
    } catch (error) {
        Swal.fire({icon: 'error', title: 'Error de red'});
    }
}

async function deleteArticleEditor(id) {
    const result = await Swal.fire({
        title: '¿Borrar artículo?',
        text: '¿Estás seguro de eliminar este artículo?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: 'var(--danger)',
        confirmButtonText: 'Sí, borrar',
        cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
        try {
            const res = await fetch(`/api/blog/editor/article/${id}`, { method: 'DELETE' });
            const data = await res.json();
            if(data.success) {
                loadEditorData();
                Swal.fire({icon:'success', title:'Artículo Eliminado', timer:1500});
            } else {
                Swal.fire({icon:'error', text:data.message});
            }
        } catch(err) {
            Swal.fire({icon:'error', title:'Error eliminando artículo'});
        }
    }
}
