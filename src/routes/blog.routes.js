import { Router } from 'express';
import { getArticles, getArticleById, createComment, getEditorData, getEditArticle, createArticle, updateArticle, createCategory, deleteComment, deleteArticle } from '../controllers/blog.controller.js';
import { isEditor, isAuthenticated, isAdmin, hasPermission } from '../middleware/auth.js';

const router = Router();

router.get('/', getArticles);
router.get('/article/:id', getArticleById);
router.post('/article/:id/comment', hasPermission('Comentar'), createComment);
router.delete('/article/:id/comment/:commentId', hasPermission('Eliminar'), deleteComment);

// Rutas de Dashboard de Editor API
router.get('/editor', isEditor, getEditorData);
router.post('/editor/article', hasPermission('Escribir'), createArticle);
router.get('/editor/edit/:id', hasPermission('Editar'), getEditArticle);
router.post('/editor/edit/:id', hasPermission('Editar'), updateArticle);
router.delete('/editor/article/:id', hasPermission('Eliminar'), deleteArticle);
router.post('/category', hasPermission('Escribir'), createCategory);

export default router;
