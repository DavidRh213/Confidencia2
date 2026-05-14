import { pool } from '../config/db.js';
import { runBackup } from '../services/backup.service.js';

export const getAdminData = async (req, res) => {
    try {
        const [users] = await pool.query(`
            SELECT u.Iduser, u.Nombre, u.Correo, r.Nombre as Rol, r.Rolid
            FROM Usuarios u
            JOIN Roles r ON u.Rolid = r.Rolid
        `);

        const [roles] = await pool.query('SELECT * FROM Roles');
        const [permisos] = await pool.query('SELECT * FROM Permisos');
        
        for (let i = 0; i < roles.length; i++) {
            const [rolPermisos] = await pool.query(`
                SELECT p.Permisosid, p.Nombre 
                FROM Permisos p
                JOIN RolPermisos rp ON p.Permisosid = rp.Permisosid
                WHERE rp.Rolid = ?
            `, [roles[i].Rolid]);
            roles[i].permisos = rolPermisos;
        }

        const [auditLogs] = await pool.query(`
            SELECT a.id, a.tabla, a.accion, a.detalles, a.fecha, u.Nombre as Usuario
            FROM Auditoria a
            LEFT JOIN Usuarios u ON a.Iduser = u.Iduser
            ORDER BY a.fecha DESC
            LIMIT 50
        `);

        return res.status(200).json({ success: true, users, roles, permisos, auditLogs });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Error cargando datos de admin' });
    }
};

export const getUsers = async (req, res) => {
    try {
        const [users] = await pool.query(`
            SELECT u.Iduser, u.Nombre, u.Correo, r.Nombre as Rol, r.Rolid
            FROM Usuarios u
            JOIN Roles r ON u.Rolid = r.Rolid
        `);
        return res.status(200).json({ success: true, users });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Error cargando usuarios' });
    }
};

export const getRolesAndPermissions = async (req, res) => {
    try {
        const [roles] = await pool.query('SELECT * FROM Roles');
        const [permisos] = await pool.query('SELECT * FROM Permisos');
        
        for (let i = 0; i < roles.length; i++) {
            const [rolPermisos] = await pool.query(`
                SELECT p.Permisosid, p.Nombre 
                FROM Permisos p
                JOIN RolPermisos rp ON p.Permisosid = rp.Permisosid
                WHERE rp.Rolid = ?
            `, [roles[i].Rolid]);
            roles[i].permisos = rolPermisos;
        }
        return res.status(200).json({ success: true, roles, permisos });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Error cargando roles y permisos' });
    }
};

export const getAuditoria = async (req, res) => {
    try {
        const [auditLogs] = await pool.query(`
            SELECT a.id, a.tabla, a.accion, a.detalles, a.fecha, u.Nombre as Usuario
            FROM Auditoria a
            LEFT JOIN Usuarios u ON a.Iduser = u.Iduser
            ORDER BY a.fecha DESC
            LIMIT 50
        `);
        return res.status(200).json({ success: true, auditLogs });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Error cargando auditoría' });
    }
};

export const updateUserRole = async (req, res) => {
    try {
        const { Iduser, Rolid } = req.body;
        const AdminId = req.session.user.Iduser;
        
        await pool.query('UPDATE Usuarios SET Rolid = ? WHERE Iduser = ?', [Rolid, Iduser]);
        await pool.query("INSERT INTO Auditoria (Iduser, tabla, accion, detalles) VALUES (?, ?, ?, ?)", [AdminId, 'Usuarios', 'UPDATE', `Cambió el Rolid de Iduser ${Iduser} a ${Rolid}`]);
        
        return res.status(200).json({ success: true, message: 'Rol de usuario actualizado' });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error actualizando rol' });
    }
};

export const createRole = async (req, res) => {
    try {
        const { Nombre } = req.body;
        const AdminId = req.session.user.Iduser;
        
        const [result] = await pool.query('INSERT INTO Roles (Nombre) VALUES (?)', [Nombre]);
        await pool.query("INSERT INTO Auditoria (Iduser, tabla, accion, detalles) VALUES (?, ?, ?, ?)", [AdminId, 'Roles', 'INSERT', `Creó el rol ${Nombre}`]);

        return res.status(200).json({ success: true, message: 'Rol creado' });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error creando rol' });
    }
};

export const assignPermission = async (req, res) => {
    try {
        const { Rolid, Permisosid } = req.body;
        const AdminId = req.session.user.Iduser;
        
        await pool.query('INSERT IGNORE INTO RolPermisos (Rolid, Permisosid) VALUES (?, ?)', [Rolid, Permisosid]);
        await pool.query("INSERT INTO Auditoria (Iduser, tabla, accion, detalles) VALUES (?, ?, ?, ?)", [AdminId, 'RolPermisos', 'INSERT', `Asignó permiso ${Permisosid} al Rolid ${Rolid}`]);

        return res.status(200).json({ success: true, message: 'Permiso asignado' });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error asignando permiso' });
    }
};

export const revokePermission = async (req, res) => {
    try {
        const { Rolid, Permisosid } = req.body;
        const AdminId = req.session.user.Iduser;
        
        await pool.query('DELETE FROM RolPermisos WHERE Rolid = ? AND Permisosid = ?', [Rolid, Permisosid]);
        await pool.query("INSERT INTO Auditoria (Iduser, tabla, accion, detalles) VALUES (?, ?, ?, ?)", [AdminId, 'RolPermisos', 'DELETE', `Revocó permiso ${Permisosid} del Rolid ${Rolid}`]);

        return res.status(200).json({ success: true, message: 'Permiso revocado' });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error revocando permiso' });
    }
};

export const triggerBackup = async (req, res) => {
    try {
        const AdminId = req.session.user.Iduser;
        const result = await runBackup();
        
        await pool.query("INSERT INTO Auditoria (Iduser, tabla, accion, detalles) VALUES (?, ?, ?, ?)", [AdminId, 'Sistema', 'BACKUP', `Realizó un respaldo manual en ${result.path}`]);
        
        return res.status(200).json({ success: true, message: 'Respaldo manual completado exitosamente', path: result.path });
    } catch (error) {
        console.error('Error en el respaldo manual:', error);
        return res.status(500).json({ success: false, message: `Error en el respaldo: ${error.message}` });
    }
};
