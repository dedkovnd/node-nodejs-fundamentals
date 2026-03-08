import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { Worker } from 'worker_threads';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const splitArrayIntoChunks = (array, numChunks) => {
  const chunks = [];
  const chunkSize = Math.ceil(array.length / numChunks);
  
  for (let i = 0; i < numChunks; i++) {
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, array.length);
    if (start < array.length) {
      chunks.push(array.slice(start, end));
    }
  }
  
  return chunks;
};

const kWayMerge = (sortedChunks) => {
  const result = [];
  const indices = new Array(sortedChunks.length).fill(0);
  
  while (true) {
    let minValue = Infinity;
    let minIndex = -1;
    
    for (let i = 0; i < sortedChunks.length; i++) {
      if (indices[i] < sortedChunks[i].length) {
        const currentValue = sortedChunks[i][indices[i]];
        if (currentValue < minValue) {
          minValue = currentValue;
          minIndex = i;
        }
      }
    }
    
    if (minIndex === -1) {
      break;
    }
    
    result.push(minValue);
    indices[minIndex]++;
  }
  
  return result;
};

const main = async () => {
  try {
    const dataPath = path.join(__dirname, '../../../node-nodejs-fundamentals/data.json');
    
    let numbers;
    try {
      const data = await fs.readFile(dataPath, 'utf-8');
      numbers = JSON.parse(data);
      
      if (!Array.isArray(numbers)) {
        throw new Error('data.json must contain an array');
      }
      
      if (!numbers.every(item => typeof item === 'number')) {
        throw new Error('Array must contain only numbers');
      }
      
    } catch (error) {
      console.error('Error reading data.json:', error.message);
      process.exit(1);
    }

    console.error(`Original array (length: ${numbers.length}):`, numbers);

    const numCores = os.cpus().length;
    console.error(`Number of CPU cores: ${numCores}`);

    const chunks = splitArrayIntoChunks(numbers, numCores);
    console.error(`Split into ${chunks.length} chunks`);

    const results = new Array(chunks.length).fill(null);
    let completedWorkers = 0;

    const workers = chunks.map((chunk, index) => {
      return new Promise((resolve, reject) => {
        const workerPath = path.join(__dirname, 'worker.js');
        const worker = new Worker(workerPath);
        
        worker.on('message', (message) => {
          if (message.error) {
            reject(new Error(`Worker ${index + 1} error: ${message.error}`));
          } else {
            results[index] = message;
            completedWorkers++;
            console.error(`Worker ${index + 1} completed (${chunk.length} numbers -> ${message.length} numbers)`);
            resolve();
          }
        });
        
        worker.on('error', (error) => {
          reject(new Error(`Worker ${index + 1} error: ${error.message}`));
        });
        
        worker.on('exit', (code) => {
          if (code !== 0) {
            reject(new Error(`Worker ${index + 1} stopped with exit code ${code}`));
          }
        });
        
        worker.postMessage(chunk);
      });
    });

    await Promise.all(workers);

    if (results.some(r => r === null)) {
      throw new Error('Not all workers completed successfully');
    }

    console.error('\nAll workers completed. Performing K-way merge...');

    const sortedArray = kWayMerge(results);
    
    console.error('Merge completed!');
    console.log('\nSorted array:', sortedArray);
    
    const isSorted = sortedArray.every((val, i, arr) => i === 0 || arr[i - 1] <= val);
    console.error(`\nArray is properly sorted: ${isSorted ? '✓' : '✗'}`);

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

await main();
