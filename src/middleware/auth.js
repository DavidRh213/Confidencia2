import { pool } from '../config/db.js';

export const refreshUserSession = async (req, res, next) => {
    if (!req.session || !req.session.user) return next();

    try {
        // Refrescar datos básicos y Rolid
        const [rows] = await pool.query('SELECT Nombre, Correo, Rolid FROM Usuarios WHERE Iduser = ?', [req.session.user.Iduser]);
        
        if (rows.length === 0) {
            req.session.destroy();
            return res.status(401).json({ success: false, message: 'Usuario no encontrado, sesión cerrada' });
        }

        const user = rows[0];

        // Refrescar permisos
        const [perms] = await pool.query(`
            SELECT p.Nombre 
            FROM RolPermisos rp
            JOIN Permisos p ON rp.Permisosid = p.Permisosid
            WHERE rp.Rolid = ?
        `, [user.Rolid]);

        const permissions = perms.map(p => p.Nombre);

        // Actualizar sesión en caliente
        req.session.user.Nombre = user.Nombre;
        req.session.user.Email = user.Correo;
        req.session.user.Rolid = user.Rolid;
        req.session.user.permissions = permissions;

        next();
    } catch (error) {
        console.error('Error refrescando sesión:', error);
        next(); // Permitir que siga con datos viejos si falla la DB
    }
};

export const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.user) {
        return next();
    }
    return res.status(401).json({ success: false, message: 'No autenticado' });
};

export const isAdmin = (req, res, next) => {
    if (req.session && req.session.user && req.session.user.Rolid === 1) {
        return next();
    }
    return res.status(403).json({ success: false, message: 'Acceso denegado: Se requiere rol de Administrador.' });
};

export const isEditor = (req, res, next) => {
    if (req.session && req.session.user && (req.session.user.Rolid === 3 || req.session.user.Rolid === 1)) {
        return next();
    }
    return res.status(403).json({ success: false, message: 'Acceso denegado: Se requiere rol de Editor.' });
};

export const hasPermission = (permissionName) => {
    return (req, res, next) => {
        if (!req.session || !req.session.user) {
            return res.status(401).json({ success: false, message: 'No autenticado' });
        }

        // Ya no necesitamos consultar la DB aquí porque refreshUserSession ya actualizó req.session.user.permissions
        if (req.session.user.permissions && req.session.user.permissions.includes(permissionName)) {
            return next();
        }

        // Registrar intento fallido
        pool.query("INSERT INTO Auditoria (Iduser, tabla, accion, detalles) VALUES (?, ?, ?, ?)",
            [req.session.user.Iduser, 'Seguridad', 'FORBIDDEN', `Intento fallido de usar permiso: ${permissionName}`]);

        return res.status(403).json({ success: false, message: `Acceso denegado: Se requiere permiso de ${permissionName}.` });
    };
};
