// const merge = async () => {
//   // Write your code here
//   // Default: read all .txt files from workspace/parts in alphabetical order
//   // Optional: support --files filename1,filename2,... to merge specific files in provided order
//   // Concatenate content and write to workspace/merged.txt
// };

// await merge();
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const merge = async () => {
  try {
    const workspacePath = path.join(__dirname, '../../../node-nodejs-fundamentals/workspace');
    const partsPath = path.join(workspacePath, 'parts');
    const mergedFilePath = path.join(workspacePath, 'merged.txt');

    try {
      await fs.access(partsPath);
    } catch {
      throw new Error('FS operation failed');
    }

    const args = process.argv.slice(2);
    let filesToMerge = [];

    const filesIndex = args.indexOf('--files');
    if (filesIndex !== -1 && args[filesIndex + 1]) {
      const filesArg = args[filesIndex + 1];
      filesToMerge = filesArg.split(',').map(f => f.trim());
      
      const invalidFiles = filesToMerge.filter(f => !f.toLowerCase().endsWith('.txt'));
      if (invalidFiles.length > 0) {
        console.error(`Invalid file extensions (only .txt allowed): ${invalidFiles.join(', ')}`);
        throw new Error('FS operation failed');
      }
      
      console.error(`Merging specified files: ${filesToMerge.join(', ')}`);
    } else {
      const allFiles = await fs.readdir(partsPath);
      filesToMerge = allFiles
        .filter(file => file.toLowerCase().endsWith('.txt'))
        .sort((a, b) => a.localeCompare(b)); 
      if (filesToMerge.length === 0) {
        console.error('No .txt files found in workspace/parts');
        throw new Error('FS operation failed');
      }
      
      console.error(`Merging all .txt files in alphabetical order: ${filesToMerge.join(', ')}`);
    }

    const missingFiles = [];
    for (const file of filesToMerge) {
      const filePath = path.join(partsPath, file);
      try {
        await fs.access(filePath);
      } catch {
        missingFiles.push(file);
      }
    }

    if (missingFiles.length > 0) {
      console.error(`Missing files: ${missingFiles.join(', ')}`);
      throw new Error('FS operation failed');
    }

    let mergedContent = '';
    
    for (const file of filesToMerge) {
      const filePath = path.join(partsPath, file);
      try {
        const content = await fs.readFile(filePath, 'utf-8');
        mergedContent += content;
        
        if (content.length > 0 && !content.endsWith('\n')) {
          mergedContent += '\n';
        }
      } catch (error) {
        console.error(`Error reading file ${file}:`, error);
        throw new Error('FS operation failed');
      }
    }

    await fs.writeFile(mergedFilePath, mergedContent, 'utf-8');
    
    console.error(`Successfully merged ${filesToMerge.length} files into workspace/merged.txt`);
    console.error(`Total size: ${mergedContent.length} bytes`);

  } catch (error) {
    if (error.message === 'FS operation failed') {
      throw error;
    }
    console.error('Error during merge operation:', error);
    throw new Error('FS operation failed');
  }
};

await merge();
