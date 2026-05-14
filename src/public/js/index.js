async function loadArticles(searchQuery = '') {
    try {
        const url = searchQuery ? `/api/blog?search=${encodeURIComponent(searchQuery)}` : '/api/blog';
        const res = await fetch(url);
        const data = await res.json();
        
        const grid = document.getElementById('articles-grid');
        
        if (!data.success || data.articles.length === 0) {
            grid.innerHTML = '<p class="text-muted text-center" style="grid-column: 1/-1;">No se encontraron artículos.</p>';
            return;
        }

        grid.innerHTML = data.articles.map(art => `
            <article class="card p-0" style="overflow:hidden; display:flex; flex-direction:column;">
                ${art.imagen ? `<img src="${art.imagen}" style="width:100%; height:200px; object-fit:cover;">` : `<div style="width:100%; height:200px; background:var(--surface);"></div>`}
                <div class="p-2" style="flex:1; display:flex; flex-direction:column;">
                    <span class="badge" style="align-self:flex-start; margin-bottom:0.5rem;">${art.Categoria}</span>
                    <h3 style="margin-bottom:0.5rem;">${art.titulo}</h3>
                    <p class="text-muted mb-1 flex-1" style="font-size:0.9rem;">${art.introduccion || art.contenido.substring(0, 100) + '...'}</p>
                    <div class="d-flex justify-between align-center mt-2 pt-1" style="border-top:1px solid var(--border);">
                        <small class="text-muted">Por: ${art.Autor}</small>
                        <a href="/pages/articulo.html?id=${art.idarticulo}" class="btn btn-primary" style="padding: 0.3rem 0.6rem; font-size: 0.9rem;">Leer más</a>
                    </div>
                </div>
            </article>
        `).join('');
    } catch (error) {
        console.error('Error loading articles:', error);
    }
}
