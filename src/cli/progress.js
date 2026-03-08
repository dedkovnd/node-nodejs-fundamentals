const progress = () => {
  const args = process.argv.slice(2);
  
  let duration = 5000;
  let interval = 100;
  let length = 30;
  let color = null; 
  
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--duration':
        if (args[i + 1] && !isNaN(parseInt(args[i + 1]))) {
          duration = parseInt(args[i + 1]);
          i++;
        }
        break;
      case '--interval':
        if (args[i + 1] && !isNaN(parseInt(args[i + 1]))) {
          interval = parseInt(args[i + 1]);
          i++;
        }
        break;
      case '--length':
        if (args[i + 1] && !isNaN(parseInt(args[i + 1]))) {
          length = parseInt(args[i + 1]);
          i++;
        }
        break;
      case '--color':
        if (args[i + 1] && /^#[0-9A-Fa-f]{6}$/.test(args[i + 1])) {
          color = args[i + 1];
          i++;
        }
        break;
    }
  }

  const hexToAnsiRgb = (hex) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `\x1b[38;2;${r};${g};${b}m`;
  };

  const colorCode = color ? hexToAnsiRgb(color) : '';
  const resetCode = '\x1b[0m';

  const steps = Math.floor(duration / interval);
  let currentStep = 0;

  const renderProgress = () => {
    const progress = (currentStep / steps) * 100;
    const filledLength = Math.floor((currentStep / steps) * length);
    const emptyLength = length - filledLength;
    
    const filledBar = '█'.repeat(filledLength);
    const emptyBar = ' '.repeat(emptyLength);
    
    let bar;
    if (colorCode) {
      bar = `${colorCode}${filledBar}${resetCode}${emptyBar}`;
    } else {
      bar = filledBar + emptyBar;
    }
    
    process.stdout.write(`\r[${bar}] ${Math.round(progress)}%`);
  };

  const timer = setInterval(() => {
    currentStep++;
    
    if (currentStep <= steps) {
      renderProgress();
    }
    
    if (currentStep >= steps) {
      clearInterval(timer);
      currentStep = steps;
      renderProgress();
      process.stdout.write('\nDone!\n');
    }
  }, interval);

  process.on('SIGINT', () => {
    clearInterval(timer);
    process.stdout.write('\nProgress interrupted\n');
    process.exit(0);
  });
};

progress();
