import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';
import { createBrotliDecompress } from 'zlib';
import { pipeline } from 'stream/promises';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const decompressDir = async () => {
  try {
    const rootPath = path.join(__dirname, '../../../node-nodejs-fundamentals');
    const compressedDirPath = path.join(rootPath, 'workspace', 'compressed');
    const archivePath = path.join(compressedDirPath, 'archive.br');
    const decompressedPath = path.join(rootPath, 'workspace', 'decompressed');

    try {
      await fsPromises.access(compressedDirPath);
      await fsPromises.access(archivePath);
    } catch {
      throw new Error('FS operation failed');
    }

    await fsPromises.mkdir(decompressedPath, { recursive: true });

    const tempFilePath = path.join(decompressedPath, 'temp_decompressed.tar');
    
    console.error('Decompressing Brotli archive...');
    const readStream = fs.createReadStream(archivePath);
    const decompressStream = createBrotliDecompress();
    const tempWriteStream = fs.createWriteStream(tempFilePath);

    await pipeline(readStream, decompressStream, tempWriteStream);

    console.error('Restoring directory structure...');
    
    const fileStream = fs.createReadStream(tempFilePath, { encoding: 'utf8' });
    const rl = require('readline').createInterface({
      input: fileStream,
      crlfDelay: Infinity
    });

    let currentFile = null;
    let currentFilePath = null;
    let bytesWritten = 0;
    let expectedSize = 0;

    for await (const line of rl) {
      try {
        const header = JSON.parse(line);

        if (currentFile) {
          currentFile.end();
          currentFile = null;
          currentFilePath = null;
        }

        if (header.type === 'directory') {
          const dirPath = path.join(decompressedPath, header.path);
          await fsPromises.mkdir(dirPath, { recursive: true });
          console.error(`Created directory: ${header.path}`);
        } else if (header.type === 'file') {
          currentFilePath = path.join(decompressedPath, header.path);
          
          await fsPromises.mkdir(path.dirname(currentFilePath), { recursive: true });
          
          currentFile = fs.createWriteStream(currentFilePath);
          expectedSize = header.size;
          bytesWritten = 0;
          
          console.error(`Creating file: ${header.path} (${expectedSize} bytes)`);
        }
        
        continue;
      } catch {
        if (currentFile) {
          const buffer = Buffer.from(line, 'utf8');
          currentFile.write(buffer);
          bytesWritten += buffer.length;
          
          if (bytesWritten >= expectedSize) {
            currentFile.end();
            currentFile = null;
            console.error(`Completed file: ${path.relative(decompressedPath, currentFilePath)}`);
          }
        }
      }
    }

    if (currentFile) {
      currentFile.end();
    }

    await fsPromises.unlink(tempFilePath);

    console.error('\nDecompression completed successfully!');
    console.error(`Files restored to: ${decompressedPath}`);

  } catch (error) {
    if (error.message === 'FS operation failed') {
      throw error;
    }
    console.error('Error during decompression:', error);
    throw new Error('FS operation failed');
  }
};

await decompressDir();
