import { pool } from '../config/db.js';

// Obtener solicitud de editor del usuario actual
export const getEditorRequest = async (req, res) => {
    try {
        const Iduser = req.session.user.Iduser;
        
        const [solicitud] = await pool.query(
            `SELECT * FROM SolicitudesEditor 
             WHERE Iduser = ? 
             ORDER BY fecha_solicitud DESC 
             LIMIT 1`,
            [Iduser]
        );

        if (solicitud.length === 0) {
            return res.status(200).json({ success: true, solicitud: null });
        }

        return res.status(200).json({ success: true, solicitud: solicitud[0] });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Error cargando solicitud de editor' });
    }
};

// Crear nueva solicitud de editor
export const createEditorRequest = async (req, res) => {
    try {
        const { motivo } = req.body;
        const Iduser = req.session.user.Iduser;

        if (!motivo || motivo.trim().length < 10) {
            return res.status(400).json({ success: false, message: 'El motivo debe tener al menos 10 caracteres' });
        }

        // Verificar si el usuario ya tiene una solicitud pendiente
        const [existing] = await pool.query(
            'SELECT * FROM SolicitudesEditor WHERE Iduser = ? AND estado = ?',
            [Iduser, 'pendiente']
        );

        if (existing.length > 0) {
            return res.status(400).json({ success: false, message: 'Ya tienes una solicitud pendiente' });
        }

        // Crear la solicitud
        await pool.query(
            'INSERT INTO SolicitudesEditor (Iduser, motivo) VALUES (?, ?)',
            [Iduser, motivo]
        );

        await pool.query(
            "INSERT INTO Auditoria (Iduser, tabla, accion, detalles) VALUES (?, ?, ?, ?)",
            [Iduser, 'SolicitudesEditor', 'INSERT', 'Solicitó acceso de editor']
        );

        return res.status(200).json({ success: true, message: 'Solicitud enviada correctamente' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Error creando solicitud' });
    }
};

// Obtener todas las solicitudes de editor (solo admin)
export const getAllEditorRequests = async (req, res) => {
    try {
        const [solicitudes] = await pool.query(`
            SELECT 
                se.idsolicitud, 
                se.Iduser, 
                u.Nombre, 
                u.Correo, 
                se.motivo, 
                se.estado, 
                se.fecha_solicitud,
                se.fecha_respuesta,
                ua.Nombre as admin_respuesta,
                se.comentario_admin
            FROM SolicitudesEditor se
            JOIN Usuarios u ON se.Iduser = u.Iduser
            LEFT JOIN Usuarios ua ON se.respuesta_admin = ua.Iduser
            ORDER BY se.estado = 'pendiente' DESC, se.fecha_solicitud DESC
        `);

        return res.status(200).json({ success: true, solicitudes });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Error cargando solicitudes' });
    }
};

// Aprobar solicitud de editor
export const approveEditorRequest = async (req, res) => {
    try {
        const { idsolicitud, comentario } = req.body;
        const adminId = req.session.user.Iduser;

        // Obtener la solicitud
        const [solicitud] = await pool.query(
            'SELECT Iduser FROM SolicitudesEditor WHERE idsolicitud = ?',
            [idsolicitud]
        );

        if (solicitud.length === 0) {
            return res.status(404).json({ success: false, message: 'Solicitud no encontrada' });
        }

        const Iduser = solicitud[0].Iduser;

        // Actualizar estado de solicitud
        await pool.query(
            'UPDATE SolicitudesEditor SET estado = ?, fecha_respuesta = NOW(), respuesta_admin = ?, comentario_admin = ? WHERE idsolicitud = ?',
            ['aprobada', adminId, comentario || '', idsolicitud]
        );

        // Cambiar rol a Editor (Rolid = 3)
        await pool.query(
            'UPDATE Usuarios SET Rolid = 3 WHERE Iduser = ?',
            [Iduser]
        );

        await pool.query(
            "INSERT INTO Auditoria (Iduser, tabla, accion, detalles) VALUES (?, ?, ?, ?)",
            [adminId, 'SolicitudesEditor', 'UPDATE', `Aprobó solicitud de editor para Iduser ${Iduser}`]
        );

        return res.status(200).json({ success: true, message: 'Solicitud aprobada' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Error aprobando solicitud' });
    }
};

// Rechazar solicitud de editor
export const rejectEditorRequest = async (req, res) => {
    try {
        const { idsolicitud, comentario } = req.body;
        const adminId = req.session.user.Iduser;

        // Obtener la solicitud
        const [solicitud] = await pool.query(
            'SELECT Iduser FROM SolicitudesEditor WHERE idsolicitud = ?',
            [idsolicitud]
        );

        if (solicitud.length === 0) {
            return res.status(404).json({ success: false, message: 'Solicitud no encontrada' });
        }

        const Iduser = solicitud[0].Iduser;

        // Actualizar estado de solicitud
        await pool.query(
            'UPDATE SolicitudesEditor SET estado = ?, fecha_respuesta = NOW(), respuesta_admin = ?, comentario_admin = ? WHERE idsolicitud = ?',
            ['rechazada', adminId, comentario || '', idsolicitud]
        );

        await pool.query(
            "INSERT INTO Auditoria (Iduser, tabla, accion, detalles) VALUES (?, ?, ?, ?)",
            [adminId, 'SolicitudesEditor', 'UPDATE', `Rechazó solicitud de editor para Iduser ${Iduser}`]
        );

        return res.status(200).json({ success: true, message: 'Solicitud rechazada' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Error rechazando solicitud' });
    }
};
