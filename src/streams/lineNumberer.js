import { Transform } from 'stream';

const lineNumberer = () => {
  let lineNumber = 1;
  let leftover = '';

  const transformStream = new Transform({
    transform(chunk, encoding, callback) {
      const data = leftover + chunk.toString();
      const lines = data.split('\n');
      
      leftover = lines.pop() || '';
      
      for (const line of lines) {
        if (line.length > 0 || lines.length > 1) { 
          this.push(`${lineNumber} | ${line}\n`);
          lineNumber++;
        }
      }
      
      callback();
    },
    
    flush(callback) {
      if (leftover.length > 0) {
        this.push(`${lineNumber} | ${leftover}\n`);
      }
      callback();
    }
  });

  process.stdin.pipe(transformStream).pipe(process.stdout);
  
  process.stdin.on('error', (error) => {
    console.error('Input stream error:', error);
    process.exit(1);
  });
  
  transformStream.on('error', (error) => {
    console.error('Transform stream error:', error);
    process.exit(1);
  });
  
  process.stdout.on('error', (error) => {
    console.error('Output stream error:', error);
    process.exit(1);
  });
};

lineNumberer();
