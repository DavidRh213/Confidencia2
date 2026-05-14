import express from 'express';
import session from 'express-session';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Rutas API
import authRoutes from './routes/auth.routes.js';
import adminRoutes from './routes/admin.routes.js';
import blogRoutes from './routes/blog.routes.js';
import profileRoutes from './routes/profile.routes.js';
import cron from 'node-cron';
import { runBackup } from './services/backup.service.js';

// Setup paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });
const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
import { refreshUserSession } from './middleware/auth.js';
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(morgan('dev'));
app.use(session({
    secret: 'dmalkmoanfianfpanfpawnf',
    resave: false,
    saveUninitialized: false,
}));
app.use(refreshUserSession);

// Servir la vista principal HTML index por default //
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/pages/index.html'));
});

// Usar Rutas API
app.use('/api/auth', authRoutes);
app.use('/api/blog', blogRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/admin', adminRoutes);

app.listen(PORT, () => {
    console.log(`Servidor API REST + HTML Estático corriendo en puerto ${PORT}`);
    
    // Tarea programada: Respaldo cada 24 horas a las 8 PM (20:00)
    cron.schedule('0 20 * * *', async () => {
        console.log('Iniciando respaldo programado de las 20:00...');
        try {
            await runBackup();
            console.log('Respaldo programado exitoso');
        } catch (error) {
            console.error('Error en el respaldo programado:', error.message);
        }
    });
});
