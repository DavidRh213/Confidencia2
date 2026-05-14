const urlParams = new URLSearchParams(window.location.search);
const articleId = urlParams.get('id');

async function loadArticleData(user) {
    if (!articleId) return window.location.href = '/pages/index.html';

    try {
        const res = await fetch(`/api/blog/article/${articleId}`);
        const data = await res.json();
        
        if (!data.success) {
            return document.getElementById('article-content').innerHTML = `<h2>Artículo no encontrado</h2>`;
        }

        const art = data.article;
        let htmlArticle = `<article class="card p-0" style="max-width:800px; margin: 0 auto; overflow:hidden;">`;
        
        let extraButtons = '';
        if (user && (user.Rolid === 1 || user.Iduser === art.Iduser)) {
            extraButtons = `<button onclick="deleteArticleAPI(${art.idarticulo})" class="btn btn-danger" style="position:absolute; top:1rem; right:1rem; z-index:10;">Eliminar Artículo</button>`;
        }

        if (art.imagen) {
            htmlArticle += `
                <div style="width:100%; height:400px; background:url('${art.imagen}') center/cover; position:relative;">
                    <div style="position:absolute; top:1rem; right:1rem; z-index:10; display:flex; gap:0.5rem;">
                        ${user && user.permissions.includes('Editar') && (user.Rolid === 1 || user.Iduser === art.Iduser) ? `<a href="/pages/edit.html?id=${art.idarticulo}" class="btn btn-primary">Editar</a>` : ''}
                        ${extraButtons}
                    </div>
                    <div style="position:absolute; bottom:0; padding:2rem; width:100%; background:linear-gradient(transparent, rgba(0,0,0,0.8));">
                        <span class="badge" style="background:var(--accent); color:black;">${art.Categoria}</span>
                        <h1 style="color:white; margin:0.5rem 0;">${art.titulo}</h1>
                        <p style="color:#ddd; margin:0;">${new Date(art.fecha).toLocaleDateString()} • Por ${art.Autor}</p>
                    </div>
                </div>`;
        } else {
            htmlArticle += `
                <div class="p-2" style="border-bottom:1px solid var(--border); position:relative;">
                    <div style="position:absolute; top:1rem; right:1rem; z-index:10; display:flex; gap:0.5rem;">
                        ${user && user.permissions.includes('Editar') && (user.Rolid === 1 || user.Iduser === art.Iduser) ? `<a href="/pages/edit.html?id=${art.idarticulo}" class="btn btn-primary">Editar</a>` : ''}
                        ${extraButtons}
                    </div>
                    <span class="badge">${art.Categoria}</span>
                    <h1 class="mt-1 mb-1">${art.titulo}</h1>
                    <p class="text-muted">${new Date(art.fecha).toLocaleDateString()} • Por ${art.Autor}</p>
                </div>`;
        }

        htmlArticle += `
            <div class="p-2" style="line-height:1.8; font-size:1.1rem; color:var(--text-secondary);">
                ${art.contenido}
            </div>
        </article>`;

        document.getElementById('article-content').innerHTML = htmlArticle;

        // Comentarios form
        const commentFormContainer = document.getElementById('comment-form-container');
        if (user) {
            commentFormContainer.innerHTML = `
                <form id="commentForm" onsubmit="postComment(event)" class="mt-1 mb-2">
                    <div class="form-group">
                        <textarea id="comentarioText" rows="3" placeholder="Escribe un comentario..." required style="width:100%;"></textarea>
                    </div>
                    <button type="submit" class="btn btn-primary">Comentar</button>
                </form>
            `;
        } else {
            commentFormContainer.innerHTML = `
                <div class="p-2 mb-2 text-center" style="background:var(--surface); border-radius:5px;">
                    <p style="margin-bottom:1rem;">Debes iniciar sesión para comentar.</p>
                    <a href="/pages/login.html" class="btn">Inicia Sesión</a>
                </div>
            `;
        }

        // Render Comments List
        document.getElementById('comments-count').innerText = `Comentarios (${data.comentarios.length})`;
        const commentsList = document.getElementById('comments-list');
        
        if (data.comentarios.length === 0) {
            commentsList.innerHTML = '<p class="text-muted text-center pt-2 pb-2">Aún no hay comentarios. ¡Sé el primero!</p>';
        } else {
            commentsList.innerHTML = data.comentarios.map(c => `
                <div class="comment p-2 mb-1" style="background:var(--bg-main); border-radius:8px; border:1px solid var(--border);">
                    <div class="d-flex justify-between align-center mb-1">
                        <div>
                            <strong>${c.Autor}</strong>
                            <small class="text-muted" style="margin-left:0.5rem;">${new Date(c.fecha).toLocaleString()}</small>
                        </div>
                        ${user && user.Rolid === 1 ? `<button onclick="deleteCommentAPI(${c.idcomentario})" class="btn btn-danger" style="padding:0.2rem 0.5rem; font-size:0.8rem;">Eliminar</button>` : ''}
                    </div>
                    <p style="margin:0;">${c.comentario}</p>
                </div>
            `).join('');
        }

    } catch(e) {
        console.error(e);
    }
}

async function postComment(e) {
    e.preventDefault();
    const comentario = document.getElementById('comentarioText').value;
    try {
        const res = await fetch(`/api/blog/article/${articleId}/comment`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({comentario})
        });
        const data = await res.json();
        if(data.success) {
            loadArticleData(currentUser);
        } else {
            Swal.fire({icon:'error', text:data.message});
        }
    } catch(err) {
        Swal.fire({icon:'error', title:'Error enviando comentario'});
    }
}

async function deleteCommentAPI(commentId) {
    const result = await Swal.fire({
        title: '¿Eliminar comentario?',
        text: 'Esta acción no se puede deshacer',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: 'var(--danger)',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
        try {
            const res = await fetch(`/api/blog/article/${articleId}/comment/${commentId}`, { method: 'DELETE' });
            const data = await res.json();
            if(data.success) {
                loadArticleData(currentUser);
            } else {
                Swal.fire({icon:'error', text:data.message});
            }
        } catch(err) {
            Swal.fire({icon:'error', title:'Error eliminando comentario'});
        }
    }
}

async function deleteArticleAPI(id) {
    const result = await Swal.fire({
        title: '¿Eliminar artículo?',
        text: '¿Estás SEGURO de eliminar TODO este artículo? Esta acción es irreversible.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: 'var(--danger)',
        confirmButtonText: 'Sí, borrar todo',
        cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
        try {
            const res = await fetch(`/api/blog/editor/article/${id}`, { method: 'DELETE' });
            const data = await res.json();
            if(data.success) {
                Swal.fire({icon:'success', title:'Artículo Eliminado'}).then(()=> window.location.href = '/pages/index.html');
            } else {
                Swal.fire({icon:'error', text:data.message});
            }
        } catch(err) {
            Swal.fire({icon:'error', title:'Error eliminando artículo'});
        }
    }
}

