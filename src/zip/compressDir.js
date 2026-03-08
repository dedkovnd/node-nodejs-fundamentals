import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';
import { createBrotliCompress } from 'zlib';
import { pipeline } from 'stream/promises';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compressDir = async () => {
  try {
    const rootPath = path.join(__dirname, '../../../node-nodejs-fundamentals');
    const toCompressPath = path.join(rootPath, 'toCompress');
    const compressedDirPath = path.join(rootPath, 'workspace', 'compressed');
    const archivePath = path.join(compressedDirPath, 'archive.br');

    try {
      await fsPromises.access(toCompressPath);
    } catch {
      throw new Error('FS operation failed');
    }

    await fsPromises.mkdir(compressedDirPath, { recursive: true });

    const tempFilePath = path.join(compressedDirPath, 'temp_archive.tar');
    const tempFileStream = fs.createWriteStream(tempFilePath);

    const writeDirectoryToStream = async (dirPath, basePath, writeStream) => {
      const entries = await fsPromises.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        const relativePath = path.relative(basePath, fullPath);
        
        if (entry.isDirectory()) {
          const header = JSON.stringify({
            type: 'directory',
            path: relativePath
          }) + '\n';
          
          if (!writeStream.write(header)) {
            await new Promise(resolve => writeStream.once('drain', resolve));
          }
          
          await writeDirectoryToStream(fullPath, basePath, writeStream);
        } else {
          const stats = await fsPromises.stat(fullPath);
          const header = JSON.stringify({
            type: 'file',
            path: relativePath,
            size: stats.size
          }) + '\n';
          
          if (!writeStream.write(header)) {
            await new Promise(resolve => writeStream.once('drain', resolve));
          }
          
          const fileStream = fs.createReadStream(fullPath);
          for await (const chunk of fileStream) {
            if (!writeStream.write(chunk)) {
              await new Promise(resolve => writeStream.once('drain', resolve));
            }
          }
        }
      }
    };

    console.error('Creating temporary archive...');
    await writeDirectoryToStream(toCompressPath, toCompressPath, tempFileStream);
    
    await new Promise((resolve, reject) => {
      tempFileStream.end();
      tempFileStream.on('finish', resolve);
      tempFileStream.on('error', reject);
    });

    console.error('Compressing to Brotli archive...');
    const readStream = fs.createReadStream(tempFilePath);
    const compressStream = createBrotliCompress();
    const writeStream = fs.createWriteStream(archivePath);

    await pipeline(readStream, compressStream, writeStream);

    await fsPromises.unlink(tempFilePath);

    console.error(`Successfully compressed to: ${archivePath}`);
    
    const stats = await fsPromises.stat(archivePath);
    console.error(`Archive size: ${stats.size} bytes`);

  } catch (error) {
    if (error.message === 'FS operation failed') {
      throw error;
    }
    console.error('Error during compression:', error);
    throw new Error('FS operation failed');
  }
};

await compressDir();
