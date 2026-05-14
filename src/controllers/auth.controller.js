import bcrypt from 'bcryptjs';
import { pool } from '../config/db.js';
import nodemailer from 'nodemailer';

export const login = async (req, res) => {
    try {
        const { Email, password } = req.body;
        const [rows] = await pool.query('SELECT * FROM Usuarios WHERE Correo = ?', [Email]);
        
        if (rows.length === 0) {
            return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
        }

        const user = rows[0];
        const isMatch = await bcrypt.compare(password, user.Password);

        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
        }

        // Obtener permisos del rol
        const [perms] = await pool.query(`
            SELECT p.Nombre 
            FROM RolPermisos rp
            JOIN Permisos p ON rp.Permisosid = p.Permisosid
            WHERE rp.Rolid = ?
        `, [user.Rolid]);

        const permissions = perms.map(p => p.Nombre);

        req.session.user = {
            Iduser: user.Iduser,
            Nombre: user.Nombre,
            Email: user.Correo,
            Rolid: user.Rolid,
            permissions: permissions
        };

        await pool.query("INSERT INTO Auditoria (Iduser, tabla, accion, detalles) VALUES (?, ?, ?, ?)",
            [user.Iduser, 'Usuarios', 'LOGIN', 'Inicio de sesión']);

        return res.status(200).json({ success: true, message: 'Bienvenido', redirect: '/pages/index.html' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
};

export const register = async (req, res) => {
    try {
        const { Nombre, Email, password, passwordConfirm } = req.body;
        
        if (password !== passwordConfirm) {
            return res.status(400).json({ success: false, message: 'Las contraseñas no coinciden' });
        }

        const [exists] = await pool.query('SELECT * FROM Usuarios WHERE Correo = ?', [Email]);
        if (exists.length > 0) {
            return res.status(400).json({ success: false, message: 'El correo ya está registrado' });
        }

        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        await pool.query('INSERT INTO Usuarios (Nombre, Correo, Password, Rolid) VALUES (?, ?, ?, 2)', [Nombre, Email, hash]);
        
        return res.status(200).json({ success: true, message: 'Registrado correctamente', redirect: '/pages/login.html' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

export const recoverPassword = async (req, res) => {
    try {
        const { Correo } = req.body;
        const [users] = await pool.query('SELECT Iduser FROM Usuarios WHERE Correo = ?', [Correo]);
        
        if (users.length === 0) {
            // Se responde success para no revelar si el correo existe o no a atacantes
            return res.status(200).json({ success: true, message: 'Si el correo existe, recibirás instrucciones enviadas a tu buzón.' });
        }

        const Iduser = users[0].Iduser;
        const tempPassword = Math.random().toString(36).slice(-8); // 8 character random string
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(tempPassword, salt);

        await pool.query('UPDATE Usuarios SET Password = ? WHERE Iduser = ?', [hash, Iduser]);
        await pool.query("INSERT INTO Auditoria (Iduser, tabla, accion, detalles) VALUES (?, ?, ?, ?)", [Iduser, 'Usuarios', 'UPDATE', 'Recuperó su contraseña vía Email']);

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'akape.ent@gmail.com',
                pass: 'rikj pfxi cfor lttz'
            }
        });

        const mailOptions = {
            from: '"Confidencialidad Auth" <akape.ent@gmail.com>',
            to: Correo,
            subject: 'Recuperación de Contraseña',
            text: `Hola.\n\nHas solicitado recuperar tu contraseña.\nTu contraseña temporal es: ${tempPassword}\n\nIngresa al sistema y cambiala desde tu Perfil lo antes posible.\n\nSaludos.`
        };

        await transporter.sendMail(mailOptions);
        return res.status(200).json({ success: true, message: 'Si el correo existe, recibirás instrucciones enviadas a tu buzón.' });

    } catch (error) {
        console.error("Nodemailer Error:", error);
        return res.status(500).json({ success: false, message: 'Error enviando correo de recuperación' });
    }
};

export const logout = (req, res) => {
    req.session.destroy();
    res.clearCookie('connect.sid');
    return res.status(200).json({ success: true, message: 'Sesión cerrada', redirect: '/pages/login.html' });
};

export const getSessionUser = (req, res) => {
    if (req.session && req.session.user) {
        return res.status(200).json({ loggedIn: true, user: req.session.user });
    }
    return res.status(200).json({ loggedIn: false });
};
