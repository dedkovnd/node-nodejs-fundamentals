import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const findByExt = async () => {
  try {
    const workspacePath = path.join(__dirname, '../../../node-nodejs-fundamentals');
    
    try {
      await fs.access(workspacePath);
    } catch {
      throw new Error('FS operation failed');
    }

    const args = process.argv.slice(2);
    let extension = '.txt';
    
    const extIndex = args.indexOf('--ext');
    if (extIndex !== -1 && args[extIndex + 1]) {
      let extArg = args[extIndex + 1];
      extension = extArg.startsWith('.') ? extArg : `.${extArg}`;
    }

    console.error(`Searching for files with extension: ${extension} in ${workspacePath}`); // Диагностическое сообщение в stderr

    const foundFiles = [];

    const findFiles = async (currentPath, relativePath = '') => {
      const items = await fs.readdir(currentPath);
      
      for (const item of items) {
        const fullPath = path.join(currentPath, item);
        const relative = path.join(relativePath, item);
        const stat = await fs.stat(fullPath);
        
        if (stat.isDirectory()) {
          await findFiles(fullPath, relative);
        } else {
          if (path.extname(item).toLowerCase() === extension.toLowerCase()) {
            foundFiles.push(relative);
          }
        }
      }
    };

    await findFiles(workspacePath);

    foundFiles.sort((a, b) => a.localeCompare(b));

    if (foundFiles.length > 0) {
      console.log(foundFiles.join('\n'));
    } else {
      console.error(`No files with extension ${extension} found in ${workspacePath}`); 
    }

  } catch (error) {
    if (error.message === 'FS operation failed') {
      throw error;
    }
    console.error('Error finding files:', error);
    throw new Error('FS operation failed');
  }
};

await findByExt();
