# 🛡️ Sistema de Gestión de Confidencialidad y Auditoría (AAA)

Este proyecto es una plataforma de gestión de contenido robusta construida con **Node.js**, **Express** y **MySQL**. Está diseñada bajo los principios de **AAA (Authentication, Authorization, and Accounting)**, garantizando un control de acceso estricto, integridad de datos y trazabilidad completa de las acciones del usuario.

---

## 🚀 Características Principales

### 🔐 1. Control de Acceso Basado en Roles (RBAC)
- **Roles Definidos**: Admin, Editor y Usuario Normal.
- **Permisos Granulares**: Sistema de permisos dinámicos (Leer, Escribir, Eliminar, Comentar, Editar).
- **Solicitudes de Rango**: Los usuarios pueden solicitar el ascenso a "Editor", con un flujo de aprobación gestionado por administradores.

### 📊 2. Auditoría y Trazabilidad (Accounting)
- **Triggers de Base de Datos**: Registro automático de inserciones y actualizaciones en artículos y comentarios.
- **Logs de Aplicación**: Auditoría detallada de inicios de sesión, eliminaciones de contenido y cambios administrativos.
- **Panel de Auditoría**: Visualización en tiempo real para administradores sobre quién hizo qué, cuándo y en qué tabla.

### 🔄 3. Sistema de Backup de Alta Disponibilidad
- **Respaldos Automatizados**: Programados diariamente a las 20:00 (8 PM) mediante `node-cron`.
- **Respaldos Manuales**: Gatillo instantáneo desde el panel de administración.
- **Seguridad Física**: Diseñado para almacenar respaldos en volúmenes externos encriptados.

### 📝 4. Gestión de Contenido (CMS)
- **Artículos**: Soporte para contenido fragmentado, categorías y metadatos.
- **Comentarios**: Sistema de interacción social con moderación y auditoría.
- **Perfil de Usuario**: Gestión de información personal y estado de cuenta.

---

## 🛠️ Stack Tecnológico

- **Backend**: Node.js (Runtime) & Express (Framework)
- **Base de Datos**: MySQL 8.0+
- **Frontend**: HTML5, CSS3 (Vanilla), JavaScript (ES6+)
- **Seguridad**: Bcryptjs (Hashing), Express-session (Gestión de sesiones)
- **Utilidades**: Node-cron (Tareas programadas), Nodemailer (Notificaciones), Morgan (Logging)

---

## 📂 Estructura del Proyecto

```text
Confidencialidad/
├── src/
│   ├── config/          # Configuración de DB y entorno
│   ├── controllers/     # Lógica de negocio por entidad
│   ├── middleware/      # Verificación de roles y sesiones
│   ├── public/          # Assets estáticos y vistas HTML
│   │   ├── css/         # Estilos globales y componentes
│   │   ├── js/          # Lógica frontend (Auth, Admin, Blog)
│   │   └── pages/       # Vistas (index, admin, profile, etc.)
│   ├── routes/          # Definición de endpoints API
│   ├── services/        # Servicios externos (Backup, Email)
│   └── index.js         # Punto de entrada de la aplicación
├── .env                 # Variables de entorno (No incluido en Git)
├── package.json         # Dependencias y scripts
├── script.sql           # Esquema inicial de base de datos
└── README.md            # Documentación del proyecto
```

---

## ⚙️ Instalación y Configuración

### 1. Requisitos Previos
- Node.js v18.x o superior.
- MySQL Server.
- (Opcional) Un punto de montaje para backups (ej. `/mnt/usb/backups/`).

### 2. Clonar e Instalar
```bash
git clone https://github.com/DavidRh213/Confidencia2.git
cd Confidencialidad
npm install
```

### 3. Configuración del Entorno
Crea un archivo `.env` en la raíz con los siguientes parámetros:
```env
# Servidor
PORT=3000

# Base de Datos
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=tu_password
DB_DATABASE=confidencialidad

# Backups
BACKUP_PATH=/ruta/a/tus/backups
```

### 4. Inicializar Base de Datos
Importa el archivo `script.sql` en tu instancia de MySQL:
```bash
mysql -u root -p < script.sql
```

### 5. Iniciar Aplicación
```bash
# Modo Desarrollo
npm run dev

# Modo Producción
npm start
```

---

## 👥 Credenciales de Prueba (Default)

| Rol | Usuario | Contraseña |
| :--- | :--- | :--- |
| **Administrador** | admin@sistema.com | `admin123` |
| **Editor** | editor@sistema.com | `editor123` |
| **Usuario Normal** | usuario@sistema.com | `usuario123` |

---

## 🛡️ Seguridad y Buenas Prácticas

- **Hashing**: Todas las contraseñas se almacenan usando `bcrypt` con un factor de costo adecuado.
- **Validación**: Middlewares de servidor interceptan cada petición a la API para verificar permisos de rol.
- **Protección SQL**: Uso de consultas preparadas para prevenir ataques de Inyección SQL.
- **Sesiones**: Implementación de `express-session` con configuraciones de seguridad para mitigar ataques de sesión.

---