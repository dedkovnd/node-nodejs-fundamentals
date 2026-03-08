import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const snapshot = async () => {
  try {
    const workspacePath = path.join(__dirname, '../../../node-nodejs-fundamentals');
    try {
      await fs.access(workspacePath);
    } catch {
      throw new Error('FS operation failed');
    }

    const rootPath = path.resolve(workspacePath);
    
    const entries = [];

    const scanDirectory = async (currentPath, relativePath = '') => {
      const files = await fs.readdir(currentPath);
      
      for (const file of files) {
        const fullPath = path.join(currentPath, file);
        const relative = path.join(relativePath, file);
        const stat = await fs.stat(fullPath);
        
        if (stat.isDirectory()) {
          entries.push({
            path: relative,
            type: 'directory'
          });
          
          await scanDirectory(fullPath, relative);
        } else {
          const content = await fs.readFile(fullPath);
          const base64Content = content.toString('base64');
          
          entries.push({
            path: relative,
            type: 'file',
            size: stat.size,
            content: base64Content
          });
        }
      }
    };

    await scanDirectory(workspacePath);

    entries.sort((a, b) => a.path.localeCompare(b.path));

    const snapshotData = {
      rootPath,
      entries
    };

    const snapshotPath = path.join(__dirname, '../../snapshot.json');
    await fs.writeFile(
      snapshotPath, 
      JSON.stringify(snapshotData, null, 2),
      'utf-8'
    );

    console.log('Snapshot created successfully at:', snapshotPath);
    
  } catch (error) {
    if (error.message === 'FS operation failed') {
      throw error;
    }
    console.error('Error creating snapshot:', error);
    throw new Error('FS operation failed');
  }
};

await snapshot();
