DROP DATABASE IF EXISTS confidencialidad;
CREATE DATABASE confidencialidad;
USE confidencialidad;

-- 1. GESTIÓN DE SEGURIDAD (Roles y Permisos)
CREATE TABLE Permisos (
    Permisosid INT AUTO_INCREMENT PRIMARY KEY,
    Nombre VARCHAR(20) NOT NULL
);

INSERT INTO Permisos (Nombre) VALUES ('Leer'), ('Escribir'), ('Eliminar'), ('Comentar'), ('Editar');

CREATE TABLE Roles (
    Rolid INT AUTO_INCREMENT PRIMARY KEY,
    Nombre VARCHAR(20) NOT NULL
);

INSERT INTO Roles (Nombre) VALUES ('Admin'), ('Normal'), ('Editor');

CREATE TABLE RolPermisos (
    Rolid INT,
    Permisosid INT,
    PRIMARY KEY (Rolid, Permisosid),
    FOREIGN KEY (Rolid) REFERENCES Roles(Rolid),
    FOREIGN KEY (Permisosid) REFERENCES Permisos(Permisosid)
);

-- Permisos por defecto
-- Admin: Todo
INSERT INTO RolPermisos (Rolid, Permisosid) VALUES (1, 1), (1, 2), (1, 3), (1, 4), (1, 5);
-- Normal: Leer y Comentar
INSERT INTO RolPermisos (Rolid, Permisosid) VALUES (2, 1), (2, 4);
-- Editor: Leer, Escribir, Eliminar, Comentar, Editar
INSERT INTO RolPermisos (Rolid, Permisosid) VALUES (3, 1), (3, 2), (3, 3), (3, 4), (3, 5);

-- 2. GESTIÓN DE USUARIOS
CREATE TABLE Usuarios (
    Iduser INT AUTO_INCREMENT PRIMARY KEY,
    Nombre VARCHAR(30) NOT NULL,
    Correo VARCHAR(50) NOT NULL UNIQUE,
    Password VARCHAR(255) NOT NULL, -- Para el requerimiento de encriptación
    Rolid INT NOT NULL,
    FOREIGN KEY (Rolid) REFERENCES Roles(Rolid)
);

-- 2.5. SOLICITUDES DE EDITOR (Usuarios normales solicitando ser editores)
CREATE TABLE SolicitudesEditor (
    idsolicitud INT AUTO_INCREMENT PRIMARY KEY,
    Iduser INT NOT NULL,
    motivo TEXT NOT NULL,
    estado VARCHAR(20) DEFAULT 'pendiente', -- pendiente, aprobada, rechazada
    fecha_solicitud DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_respuesta DATETIME,
    respuesta_admin INT,
    comentario_admin TEXT,
    FOREIGN KEY (Iduser) REFERENCES Usuarios(Iduser),
    FOREIGN KEY (respuesta_admin) REFERENCES Usuarios(Iduser)
);

-- 3. ESTRUCTURA DEL BLOG (Artículos y Categorías)
CREATE TABLE Categorias (
    idcategoria INT AUTO_INCREMENT PRIMARY KEY,
    Nombre VARCHAR(50) NOT NULL
);

CREATE TABLE Articulos (
    idarticulo INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(70) NOT NULL,       -- Elemento de Identidad (H1)
    imagen VARCHAR(255),        -- URL de la imagen de cabecera
    introduccion TEXT,               -- Párrafo de enganche (2-3 líneas)
    contenido LONGTEXT NOT NULL,   -- El contenido fragmentado (HTML/Markdown)
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    Iduser INT NOT NULL,                -- Relación con tabla Usuarios
    id_categoria INT NOT NULL,            -- Metadato de categoría
    FOREIGN KEY (Iduser) REFERENCES Usuarios(Iduser),
    FOREIGN KEY (id_categoria) REFERENCES Categorias(idcategoria)
);

-- 4. GESTIÓN DE COMENTARIOS (Requerimiento de Cierre y Conversión)
CREATE TABLE Comentarios (
    idcomentario INT AUTO_INCREMENT PRIMARY KEY,
    id_articulo INT NOT NULL,
    Iduser INT NOT NULL,
    comentario TEXT NOT NULL,
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_articulo) REFERENCES Articulos(idarticulo) ON DELETE CASCADE,
    FOREIGN KEY (Iduser) REFERENCES Usuarios(Iduser)
);

-- 5. CONTROL DE ACCESO (Auditoría)
CREATE TABLE Auditoria (
    id INT AUTO_INCREMENT PRIMARY KEY,
    Iduser INT,
    tabla VARCHAR(50),
    accion VARCHAR(20), -- LOGIN, INSERT, UPDATE, DELETE
    detalles TEXT,
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (Iduser) REFERENCES Usuarios(Iduser)
);

DELIMITER $$

-- 1. CUANDO SE CREA UN ARTÍCULO
CREATE TRIGGER auditoria_insert_articulo
AFTER INSERT ON Articulos
FOR EACH ROW
BEGIN
INSERT INTO Auditoria (Iduser, tabla, accion, detalles)
VALUES (
    NEW.Iduser,
    'Articulos',
    'INSERT',
    CONCAT('Se creó el artículo: ', NEW.titulo)
);
END$$


-- 2. CUANDO SE EDITA UN ARTÍCULO
CREATE TRIGGER auditoria_update_articulo
AFTER UPDATE ON Articulos
FOR EACH ROW
BEGIN
INSERT INTO Auditoria (Iduser, tabla, accion, detalles)
VALUES (
    NEW.Iduser,
    'Articulos',
    'UPDATE',
    CONCAT('Se editó el artículo: ', NEW.titulo)
);
END$$


-- 3. CUANDO SE ELIMINA UN ARTÍCULO
-- Se gestiona explícitamente desde Node.js (blog.controller.js) para registrar al usuario ejecutor


-- 4. CUANDO SE CREA UN COMENTARIO
CREATE TRIGGER auditoria_insert_comentario
AFTER INSERT ON Comentarios
FOR EACH ROW
BEGIN
INSERT INTO Auditoria (Iduser, tabla, accion, detalles)
VALUES (
    NEW.Iduser,
    'Comentarios',
    'INSERT',
    CONCAT('Se agregó un comentario al artículo ID: ', NEW.id_articulo)
);
END$$


-- 5. CUANDO SE ELIMINA UN COMENTARIO
-- Se gestiona explícitamente desde Node.js (blog.controller.js) para registrar al usuario ejecutor

DELIMITER ;
