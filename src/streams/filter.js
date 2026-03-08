import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const split = () => {
  const args = process.argv.slice(2);
  let linesPerChunk = 10; 
  
  const linesIndex = args.indexOf('--lines');
  if (linesIndex !== -1 && args[linesIndex + 1]) {
    const parsed = parseInt(args[linesIndex + 1]);
    if (!isNaN(parsed) && parsed > 0) {
      linesPerChunk = parsed;
    }
  }

  const sourcePath = path.join(__dirname, '../../../node-nodejs-fundamentals/source.txt');
  
  if (!fs.existsSync(sourcePath)) {
    console.error('source.txt not found');
    process.exit(1);
  }

  let chunkNumber = 1;
  let lineCount = 0;
  let currentChunkStream = null;
  let leftover = '';

  const readStream = fs.createReadStream(sourcePath, {
    encoding: 'utf8',
    highWaterMark: 64 * 1024 
  });

  const createNewChunk = () => {
    if (currentChunkStream) {
      currentChunkStream.end();
    }
    
    const chunkPath = path.join(
      __dirname, 
      '../../../node-nodejs-fundamentals', 
      `chunk_${chunkNumber}.txt`
    );
    
    currentChunkStream = fs.createWriteStream(chunkPath, { encoding: 'utf8' });
    
    currentChunkStream.on('error', (error) => {
      console.error(`Error writing chunk ${chunkNumber}:`, error);
      process.exit(1);
    });
    
    console.error(`Creating chunk_${chunkNumber}.txt`);
    chunkNumber++;
    lineCount = 0;
    
    return currentChunkStream;
  };

  createNewChunk();

  readStream.on('data', (chunk) => {
    const data = leftover + chunk;
    const lines = data.split('\n');
    
    leftover = lines.pop() || '';
    
    for (const line of lines) {
      if (lineCount >= linesPerChunk) {
        createNewChunk();
      }
      
      currentChunkStream.write(line + '\n');
      lineCount++;
    }
  });

  readStream.on('end', () => {
    if (leftover.length > 0) {
      if (lineCount >= linesPerChunk) {
        createNewChunk();
      }
      currentChunkStream.write(leftover + '\n');
    }
    
    if (currentChunkStream) {
      currentChunkStream.end();
    }
    
    console.error(`\nSplit complete! Created ${chunkNumber - 1} chunk files.`);
  });

  readStream.on('error', (error) => {
    console.error('Error reading source.txt:', error);
    process.exit(1);
  });

  process.on('SIGINT', () => {
    if (currentChunkStream) {
      currentChunkStream.end();
    }
    readStream.destroy();
    console.error('\nOperation interrupted');
    process.exit(0);
  });
};

split();
