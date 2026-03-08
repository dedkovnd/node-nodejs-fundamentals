import { spawn } from 'child_process';
import process from 'process';

const execCommand = () => {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('Usage: node src/cp/execCommand.js "<command>"');
    process.exit(1);
  }

  const commandString = args[0];
  
  const commandParts = commandString.split(' ');
  const cmd = commandParts[0];
  const cmdArgs = commandParts.slice(1);

  console.error(`Executing command: ${cmd} ${cmdArgs.join(' ')}`);

  const childProcess = spawn(cmd, cmdArgs, {
    stdio: 'pipe',
    env: process.env, 
    shell: false 
  });

  childProcess.stdout.on('data', (data) => {
    process.stdout.write(data);
  });


  childProcess.stderr.on('data', (data) => {
    process.stderr.write(data);
  });

  childProcess.on('error', (error) => {
    console.error(`Failed to start process: ${error.message}`);
    process.exit(1);
  });

  childProcess.on('exit', (code, signal) => {
    if (signal) {
      console.error(`Process was terminated by signal: ${signal}`);
      process.exit(1);
    } else {
      console.error(`Process exited with code: ${code}`);
      process.exit(code);
    }
  });

  process.on('SIGINT', () => {
    console.error('\nReceived SIGINT, terminating child process...');
    childProcess.kill('SIGINT');
  });

  process.on('exit', () => {
    if (!childProcess.killed) {
      childProcess.kill();
    }
  });
};

execCommand();
