import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const restore = async () => {
  try {
    const snapshotPath = path.join(__dirname, '../../snapshot.json');
    
    const restoredPath = path.join(__dirname, '../../workspace_restored');

    try {
      await fs.access(snapshotPath);
    } catch {
      throw new Error('FS operation failed');
    }

    try {
      await fs.access(restoredPath);
      throw new Error('FS operation failed');
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw new Error('FS operation failed');
      }
    }

    let snapshotData;
    try {
      const snapshotContent = await fs.readFile(snapshotPath, 'utf-8');
      snapshotData = JSON.parse(snapshotContent);
    } catch {
      throw new Error('FS operation failed');
    }

    if (!snapshotData.entries || !Array.isArray(snapshotData.entries)) {
      throw new Error('FS operation failed');
    }

    await fs.mkdir(restoredPath, { recursive: true });

    for (const entry of snapshotData.entries) {
      const entryPath = path.join(restoredPath, entry.path);
      
      if (entry.type === 'directory') {
        await fs.mkdir(entryPath, { recursive: true });
        console.log(`Created directory: ${entry.path}`);
      } 
      else if (entry.type === 'file') {
        const parentDir = path.dirname(entryPath);
        await fs.mkdir(parentDir, { recursive: true });
        
        if (entry.content) {
          const fileContent = Buffer.from(entry.content, 'base64');
          await fs.writeFile(entryPath, fileContent);
          console.log(`Created file: ${entry.path} (${entry.size} bytes)`);
        } else {
          await fs.writeFile(entryPath, '');
          console.log(`Created empty file: ${entry.path}`);
        }
      }
    }

    console.log('\nRestore completed successfully!');
    console.log(`Files and directories restored to: ${restoredPath}`);
    
    const dirCount = snapshotData.entries.filter(e => e.type === 'directory').length;
    const fileCount = snapshotData.entries.filter(e => e.type === 'file').length;
    console.log(`Restored: ${dirCount} directories, ${fileCount} files`);

  } catch (error) {
    if (error.message === 'FS operation failed') {
      throw error;
    }
    console.error('Error during restore:', error);
    throw new Error('FS operation failed');
  }
};

await restore();
