import fs from 'fs/promises';
import { createReadStream } from 'fs';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const verify = async () => {
  try {
    const checksumsPath = path.join(__dirname, '../../../node-nodejs-fundamentals/checksums.json');
    
    try {
      await fs.access(checksumsPath);
    } catch {
      throw new Error('FS operation failed');
    }

    let checksums;
    try {
      const content = await fs.readFile(checksumsPath, 'utf-8');
      checksums = JSON.parse(content);
    } catch {
      throw new Error('FS operation failed');
    }

    if (typeof checksums !== 'object' || checksums === null || Array.isArray(checksums)) {
      throw new Error('FS operation failed');
    }

    const calculateHash = (filePath) => {
      return new Promise((resolve, reject) => {
        const hash = crypto.createHash('sha256');
        const stream = createReadStream(filePath);
        
        stream.on('error', (error) => {
          reject(error);
        });
        
        stream.on('data', (chunk) => {
          hash.update(chunk);
        });
        
        stream.on('end', () => {
          resolve(hash.digest('hex'));
        });
      });
    };

    const basePath = path.dirname(checksumsPath);

    const results = [];
    
    for (const [filename, expectedHash] of Object.entries(checksums)) {
      const filePath = path.join(basePath, filename);
      
      try {
        await fs.access(filePath);
        
        const actualHash = await calculateHash(filePath);
        
        const status = actualHash.toLowerCase() === expectedHash.toLowerCase() ? 'OK' : 'FAIL';
        results.push(`${filename} — ${status}`);
        
      } catch (error) {
        results.push(`${filename} — FAIL (file not found or unreadable)`);
      }
    }

    console.log(results.join('\n'));

  } catch (error) {
    if (error.message === 'FS operation failed') {
      throw error;
    }
    console.error('Error during verification:', error);
    throw new Error('FS operation failed');
  }
};

await verify();
