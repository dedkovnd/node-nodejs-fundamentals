import readline from 'readline';
import process from 'process';

const interactive = () => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: '> ',
    removeHistoryDuplicates: true
  });

  rl.prompt();

  rl.on('line', (input) => {
    const command = input.trim().toLowerCase();

    switch (command) {
      case 'uptime':
        const uptimeSeconds = process.uptime();
        console.log(`Uptime: ${uptimeSeconds.toFixed(2)}s`);
        break;

      case 'cwd':
        console.log(`Current working directory: ${process.cwd()}`);
        break;

      case 'date':
        console.log(`Current date and time: ${new Date().toISOString()}`);
        break;

      case 'exit':
        console.log('Goodbye!');
        rl.close();
        process.exit(0);
        break;

      case '':
        break;

      default:
        console.log('Unknown command');
        break;
    }

    rl.prompt();
  });

  rl.on('SIGINT', () => {
    console.log('\nGoodbye!');
    rl.close();
    process.exit(0);
  });

  rl.on('error', (err) => {
    console.error('Readline error:', err);
    process.exit(1);
  });
};

interactive();
