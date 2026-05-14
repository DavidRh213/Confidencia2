# Documentación Complementaria del Proyecto

Este documento detalla los aspectos teóricos y técnicos adicionales del **Sistema de Gestión de Confidencialidad y Auditoría (AAA)**.

---

## 4. BENEFICIARIOS

Los principales beneficiarios de esta implementación son:

1. **Administradores de TI y Seguridad**: Obtienen una herramienta centralizada para gestionar permisos y monitorear el comportamiento de los usuarios mediante el sistema de auditoría.
2. **Organizaciones con Requerimientos de Cumplimiento**: Entidades que necesitan demostrar trazabilidad de datos (quién modificó qué y cuándo) para cumplir con normativas de protección de datos.
3. **Editores de Contenido**: Disponen de una plataforma segura donde sus contribuciones están protegidas y su rango es validado mediante un proceso formal.
4. **Usuarios Finales**: Se benefician de una plataforma íntegra donde la información es veraz y los comentarios están moderados y auditados.
5. **Desarrolladores**: El proyecto sirve como una arquitectura base sólida para implementar principios de seguridad AAA en aplicaciones empresariales.

---

## 5. TECNOLOGÍA DE DESARROLLO

El sistema utiliza un stack tecnológico moderno y robusto enfocado en la seguridad y el rendimiento:

*   **Runtime**: [Node.js](https://nodejs.org/) (Motor de ejecución asíncrono basado en V8).
*   **Framework Web**: [Express.js](https://expressjs.com/) (Estructura minimalista para la gestión de rutas y middlewares).
*   **Gestión de Base de Datos**: [MySQL 8.0+](https://www.mysql.com/) (Sistema relacional para garantizar la integridad referencial y el uso de Triggers de auditoría).
*   **Seguridad y Cifrado**: 
    *   **Bcryptjs**: Para el hashing robusto de contraseñas con sal (salts).
    *   **Express-session**: Gestión de sesiones de usuario en el servidor.
*   **Automatización**: [Node-cron](https://www.npmjs.com/package/node-cron) para la programación de respaldos automáticos.
*   **Frontend**: 
    *   HTML5 (Estructura semántica).
    *   CSS3 (Diseño responsivo y moderno).
    *   JavaScript Vanilla (Interactividad sin dependencias pesadas).
    *   [SweetAlert2](https://sweetalert2.github.io/) (Interfaz estética para notificaciones).

---

## 7. ANEXOS

Para una comprensión profunda del sistema, se adjuntan las siguientes referencias:

1. **Modelo Entidad-Relación (MER)**: La estructura de la base de datos optimizada para RBAC (Roles, Permisos, Usuarios, Auditoría).
2. **Diccionario de Datos**: Definición de cada campo en las tablas de la base de datos (ver archivo `script.sql`).
3. **Flujo de Auditoría**: Diagrama de cómo los triggers de MySQL capturan eventos de `INSERT` y `UPDATE` de forma transparente a la aplicación.
4. **Manual de Usuario**: Guía paso a paso para la solicitud de rango de editor y gestión administrativa.

---

## 9. REFERENCIAS BIBLIOGRÁFICAS

*   **OWASP Foundation**. (2023). *Broken Access Control*. Recuperado de [owasp.org](https://owasp.org/www-project-top-ten/2021/A01_2021-Broken_Access_Control/).
*   **MySQL Reference Manual**. (2024). *Using Triggers for Auditing*. Oracle Corporation.
*   **Node.js Documentation**. (2024). *Security Best Practices*. Recuperado de [nodejs.org](https://nodejs.org/en/docs/guides/security-best-practices/).
*   **Fielding, R. T.** (2000). *Architectural Styles and the Design of Network-based Software Architectures* (REST principles).
*   **Bcrypt.js**. (2023). *Library Documentation for Secure Hashing*.
