import { parentPort } from 'worker_threads';

parentPort.on('message', (data) => {
  try {
    if (!Array.isArray(data)) {
      throw new Error('Expected an array of numbers');
    }

    const sortedArray = data.sort((a, b) => a - b);
    
    parentPort.postMessage(sortedArray);
  } catch (error) {
    parentPort.postMessage({ error: error.message });
  }
});
