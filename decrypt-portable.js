// decrypt-portable.js (No requiere NINGUNA instalación)
const fs = require('fs');
const crypto = require('crypto');

const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;

const [,, filePath, keyString] = process.argv;

if (!filePath || !keyString) {
    console.log('\x1b[33m%s\x1b[0m', 'Uso: node decrypt-portable.js <archivo.enc> <llave_de_32_caracteres>');
    console.log('Ejemplo: node decrypt-portable.js backup.sql.enc d7a8b9c0e1f2g3h4i5j6k7l8m9n0o1p2');
    process.exit(1);
}

try {
    if (!fs.existsSync(filePath)) {
        throw new Error(`El archivo ${filePath} no existe.`);
    }

    const KEY = Buffer.from(keyString, 'utf-8');
    if (KEY.length !== 32) {
        throw new Error(`La llave debe tener exactamente 32 caracteres. (La tuya tiene ${KEY.length})`);
    }

    const outputFilePath = filePath.replace('.enc', '');
    
    // Leer el IV (primeros 16 bytes)
    const ivBuffer = Buffer.alloc(IV_LENGTH);
    const fd = fs.openSync(filePath, 'r');
    fs.readSync(fd, ivBuffer, 0, IV_LENGTH, 0);
    fs.closeSync(fd);

    const decipher = crypto.createDecipheriv(ALGORITHM, KEY, ivBuffer);
    
    // Crear streams para procesar el archivo
    const input = fs.createReadStream(filePath, { start: IV_LENGTH });
    const output = fs.createWriteStream(outputFilePath);

    input.pipe(decipher).pipe(output);

    output.on('finish', () => {
        console.log('\x1b[32m%s\x1b[0m', `✅ ¡Éxito! Archivo desencriptado en: ${outputFilePath}`);
    });

    output.on('error', (err) => {
        console.error('\x1b[31m%s\x1b[0m', `❌ Error al escribir el archivo: ${err.message}`);
    });

} catch (err) {
    console.error('\x1b[31m%s\x1b[0m', `❌ Error: ${err.message}`);
}
