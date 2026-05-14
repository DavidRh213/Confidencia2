import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const ALGORITHM = 'aes-256-cbc';
const KEY = Buffer.from(process.env.BACKUP_ENCRYPTION_KEY || '00000000000000000000000000000000', 'utf-8');
const IV_LENGTH = 16;

/**
 * Realiza un respaldo de la base de datos, lo encripta y lo guarda en el USB.
 */
export const runBackup = async () => {
    return new Promise((resolve, reject) => {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupDir = process.env.BACKUP_PATH || './backups';
        const fileName = `backup-${timestamp}.sql`;
        const encryptedFileName = `${fileName}.enc`;
        const tempFilePath = path.join('/tmp', fileName);
        const finalPath = path.join(backupDir, encryptedFileName);

        // 1. Asegurar que el directorio de respaldo existe
        if (!fs.existsSync(backupDir)) {
            try {
                fs.mkdirSync(backupDir, { recursive: true });
            } catch (err) {
                return reject(new Error(`No se pudo acceder al USB o crear la carpeta: ${err.message}`));
            }
        }

        // 2. Ejecutar mysqldump
        const dumpCommand = `mysqldump -h ${process.env.DB_HOST} -u ${process.env.DB_USER} -p${process.env.DB_PASSWORD} ${process.env.DB_NAME} > ${tempFilePath}`;

        exec(dumpCommand, (error, stdout, stderr) => {
            if (error) {
                if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
                return reject(new Error(`Error en mysqldump: ${stderr || error.message}`));
            }

            try {
                // 3. Encriptar el archivo
                const iv = crypto.randomBytes(IV_LENGTH);
                const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
                
                const input = fs.createReadStream(tempFilePath);
                const output = fs.createWriteStream(finalPath);

                // Escribir el IV al principio del archivo para poder desencriptar después
                output.write(iv);

                input.pipe(cipher).pipe(output);

                output.on('finish', () => {
                    // 4. Limpiar archivo temporal
                    fs.unlinkSync(tempFilePath);
                    console.log(`Respaldo completado y encriptado en: ${finalPath}`);
                    resolve({ success: true, path: finalPath });
                });

                output.on('error', (err) => {
                    if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
                    reject(err);
                });

            } catch (err) {
                if (fs.existsSync(tempFilePath)) fs.unlinkSync(tempFilePath);
                reject(err);
            }
        });
    });
};
