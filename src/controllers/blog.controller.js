import { pool } from '../config/db.js';

export const getArticles = async (req, res) => {
    try {
        const { search } = req.query;
        let query = `
            SELECT a.*, u.Nombre as Autor, c.Nombre as Categoria
            FROM Articulos a
            JOIN Usuarios u ON a.Iduser = u.Iduser
            JOIN Categorias c ON a.id_categoria = c.idcategoria
        `;
        let params = [];

        if (search) {
            query += ' WHERE a.titulo LIKE ? OR a.introduccion LIKE ?';
            params.push(`%${search}%`, `%${search}%`);
        }
        
        query += ' ORDER BY a.fecha DESC';

        const [articles] = await pool.query(query, params);
        return res.status(200).json({ success: true, articles });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Error fetching articles' });
    }
};

export const getArticleById = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await pool.query(`
            SELECT a.*, u.Nombre as Autor, c.Nombre as Categoria
            FROM Articulos a
            JOIN Usuarios u ON a.Iduser = u.Iduser
            JOIN Categorias c ON a.id_categoria = c.idcategoria
            WHERE a.idarticulo = ?
        `, [id]);
        
        if (rows.length === 0) return res.status(404).json({ success: false, message: 'Artículo no encontrado' });
        
        const [comentarios] = await pool.query(`
            SELECT c.*, u.Nombre as Autor 
            FROM Comentarios c 
            JOIN Usuarios u ON c.Iduser = u.Iduser 
            WHERE c.id_articulo = ?
            ORDER BY c.fecha DESC
        `, [id]);

        return res.status(200).json({ success: true, article: rows[0], comentarios });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Error fetching article Details' });
    }
};

export const createComment = async (req, res) => {
    try {
        const { id } = req.params;
        const { comentario } = req.body;
        const authUser = req.session.user;

        // Requerimiento: Los editores solo comentan sus propios artículos
        if (authUser.Rolid === 3) {
            const [art] = await pool.query('SELECT Iduser FROM Articulos WHERE idarticulo = ?', [id]);
            if (art.length > 0 && art[0].Iduser !== authUser.Iduser) {
                return res.status(403).json({ success: false, message: 'Como Editor, solo puedes comentar en tus propios artículos.' });
            }
        }

        await pool.query('INSERT INTO Comentarios (id_articulo, Iduser, comentario) VALUES (?, ?, ?)', [id, authUser.Iduser, comentario]);
        return res.status(200).json({ success: true, message: 'Comentario agregado' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Error creating comment' });
    }
};

export const getEditorData = async (req, res) => {
    try {
        const [categories] = await pool.query('SELECT * FROM Categorias');
        const [articles] = await pool.query(`
            SELECT a.*, c.Nombre as Categoria 
            FROM Articulos a
            JOIN Categorias c ON a.id_categoria = c.idcategoria
            ORDER BY a.fecha DESC
        `);
        return res.status(200).json({ success: true, articles, categories });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Error fetching editor dashboard' });
    }
};

export const createArticle = async (req, res) => {
    try {
        const { titulo, id_categoria, imagen, introduccion, contenido } = req.body;
        const Iduser = req.session.user.Iduser;

        await pool.query(`
            INSERT INTO Articulos (titulo, imagen, introduccion, contenido, Iduser, id_categoria)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [titulo, imagen, introduccion, contenido, Iduser, id_categoria]);

        return res.status(200).json({ success: true, message: 'Artículo creado' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Error creating article' });
    }
};

export const getEditArticle = async (req, res) => {
    try {
        const { id } = req.params;
        const Iduser = req.session.user.Iduser;
        const isAdmin = req.session.user.Rolid === 1;

        const [article] = await pool.query('SELECT * FROM Articulos WHERE idarticulo = ?', [id]);
        if (article.length === 0) return res.status(404).json({ success: false, message: 'Artículo no encontrado' });
        
        // El Admin (1) edita todo. El Editor (3) solo lo suyo.
        if (req.session.user.Rolid !== 1 && article[0].Iduser !== Iduser) {
            return res.status(403).json({ success: false, message: 'No puedes editar artículos que no te pertenecen.'});
        }

        const [categories] = await pool.query('SELECT * FROM Categorias');
        return res.status(200).json({ success: true, article: article[0], categories });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error fetching details for edition' });
    }
};

export const updateArticle = async (req, res) => {
    try {
        const { id } = req.params;
        const { titulo, id_categoria, imagen, introduccion, contenido } = req.body;
        const Iduser = req.session.user.Iduser;
        const isAdmin = req.session.user.Rolid === 1;

        const [article] = await pool.query('SELECT Iduser FROM Articulos WHERE idarticulo = ?', [id]);
        if (article.length === 0) return res.status(404).json({ success: false, message: 'Artículo No Encontrado' });
        
        // El Admin (1) edita todo. El resto (o Editores específicamente) solo lo suyo.
        if (req.session.user.Rolid !== 1 && article[0].Iduser !== Iduser) {
            return res.status(403).json({ success: false, message: 'Sin autorización para editar este artículo.' });
        }

        await pool.query(`
            UPDATE Articulos 
            SET titulo=?, imagen=?, introduccion=?, contenido=?, id_categoria=?
            WHERE idarticulo = ?
        `, [titulo, imagen, introduccion, contenido, id_categoria, id]);

        return res.status(200).json({ success: true, message: 'Artículo actualizado' });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const createCategory = async (req, res) => {
    try {
        const { Nombre } = req.body;
        if (!Nombre) return res.status(400).json({ success: false, message: 'Nombre requerido' });
        
        await pool.query('INSERT INTO Categorias (Nombre) VALUES (?)', [Nombre]);
        return res.status(200).json({ success: true, message: 'Categoría creada exitosamente' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Error al crear categoría' });
    }
};

export const deleteComment = async (req, res) => {
    try {
        const { id, commentId } = req.params;
        const authUser = req.session.user;

        if (authUser.Rolid !== 1) {
            return res.status(403).json({ success: false, message: 'Permiso denegado' });
        }

        await pool.query('DELETE FROM Comentarios WHERE idcomentario = ? AND id_articulo = ?', [commentId, id]);
        await pool.query("INSERT INTO Auditoria (Iduser, tabla, accion, detalles) VALUES (?, ?, ?, ?)", [authUser.Iduser, 'Comentarios', 'DELETE', `Eliminó un comentario del artículo ID: ${id}`]);
        
        return res.status(200).json({ success: true, message: 'Comentario eliminado' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Error al eliminar el comentario' });
    }
};

export const deleteArticle = async (req, res) => {
    try {
        const { id } = req.params;
        const authUser = req.session.user;

        const [article] = await pool.query('SELECT Iduser, titulo FROM Articulos WHERE idarticulo = ?', [id]);
        if (article.length === 0) return res.status(404).json({ success: false, message: 'No Found' });
        
        if (authUser.Rolid !== 1 && article[0].Iduser !== authUser.Iduser) {
            return res.status(403).json({ success: false, message: 'No puedes borrar un artículo que no es tuyo.' });
        }

        await pool.query('DELETE FROM Articulos WHERE idarticulo = ?', [id]);
        await pool.query("INSERT INTO Auditoria (Iduser, tabla, accion, detalles) VALUES (?, ?, ?, ?)", [authUser.Iduser, 'Articulos', 'DELETE', `Eliminó el artículo: ${article[0].titulo}`]);
        
        return res.status(200).json({ success: true, message: 'Artículo eliminado' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Error al eliminar el artículo' });
    }
};
