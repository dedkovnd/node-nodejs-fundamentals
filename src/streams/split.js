import { Transform } from 'stream';

const filter = () => {
  const args = process.argv.slice(2);
  let pattern = '';
  
  const patternIndex = args.indexOf('--pattern');
  if (patternIndex !== -1 && args[patternIndex + 1]) {
    pattern = args[patternIndex + 1];
  } else {
    console.error('Pattern is required. Usage: node src/streams/filter.js --pattern <string>');
    process.exit(1);
  }

  let leftover = '';

  const transformStream = new Transform({
    transform(chunk, encoding, callback) {
      const data = leftover + chunk.toString();
      const lines = data.split('\n');
      
      leftover = lines.pop() || '';
      
      for (const line of lines) {
        if (line.includes(pattern)) {
          this.push(line + '\n');
        }
      }
      
      callback();
    },
    
    flush(callback) {
      if (leftover.length > 0 && leftover.includes(pattern)) {
        this.push(leftover + '\n');
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

filter();
