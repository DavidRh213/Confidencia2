import { Router } from 'express';
import { pool } from '../config/db.js';
import bcrypt from 'bcryptjs';
import { isAuthenticated } from '../middleware/auth.js';
import { 
    getEditorRequest, 
    createEditorRequest, 
    getAllEditorRequests, 
    approveEditorRequest, 
    rejectEditorRequest 
} from '../controllers/editor-request.controller.js';

const router = Router();

export const getProfile = (req, res) => {
    return res.status(200).json({ success: true, user: req.session.user });
};

export const updateProfile = async (req, res) => {
    try {
        const { Nombre, Email, oldPassword, newPassword } = req.body;
        const Iduser = req.session.user.Iduser;

        // Verificar si el correo ya existe en otro usuario
        const [exists] = await pool.query('SELECT * FROM Usuarios WHERE Correo = ? AND Iduser != ?', [Email, Iduser]);
        if (exists.length > 0) {
            return res.status(400).json({ success: false, message: 'El correo ya está en uso por otra cuenta' });
        }

        let query = 'UPDATE Usuarios SET Nombre = ?, Correo = ?';
        let params = [Nombre, Email];

        if (newPassword) {
            if (!oldPassword) {
                return res.status(400).json({ success: false, message: 'Debes introducir tu contraseña actual para cambiarla' });
            }
            
            // Verificar Contraseña Anterior
            const [currentUserData] = await pool.query('SELECT Password FROM Usuarios WHERE Iduser = ?', [Iduser]);
            const isMatch = await bcrypt.compare(oldPassword, currentUserData[0].Password);
            
            if (!isMatch) {
                return res.status(401).json({ success: false, message: 'La contraseña actual es incorrecta' });
            }

            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash(newPassword, salt);
            query += ', Password = ?';
            params.push(hash);
        }

        query += ' WHERE Iduser = ?';
        params.push(Iduser);

        await pool.query(query, params);
        await pool.query("INSERT INTO Auditoria (Iduser, tabla, accion, detalles) VALUES (?, ?, ?, ?)", [Iduser, 'Usuarios', 'UPDATE', 'Actualizó su propio perfil']);

        // Actualizar datos en sesión
        req.session.user.Nombre = Nombre;
        req.session.user.Email = Email;

        return res.status(200).json({ success: true, message: 'Perfil actualizado' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Error al actualizar perfil' });
    }
};

router.get('/perfil', isAuthenticated, getProfile);
router.put('/perfil', isAuthenticated, updateProfile);

// Rutas para solicitudes de editor
router.get('/editor-request', isAuthenticated, getEditorRequest);
router.post('/editor-request', isAuthenticated, createEditorRequest);
router.get('/editor-requests', isAuthenticated, getAllEditorRequests);
router.put('/editor-request/approve', isAuthenticated, approveEditorRequest);
router.put('/editor-request/reject', isAuthenticated, rejectEditorRequest);

export default router;
