import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dynamic = async () => {
  try {
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
      console.error('Plugin name is required');
      console.error('Usage: node src/modules/dynamic.js <plugin-name>');
      process.exit(1);
    }

    const pluginName = args[0];
    const pluginPath = path.join(__dirname, 'plugins', `${pluginName}.js`);
    
    try {
      const pluginUrl = new URL(`file://${pluginPath}`);
      const plugin = await import(pluginUrl);
      
      if (typeof plugin.run !== 'function') {
        console.error(`Plugin ${pluginName} does not export a run() function`);
        process.exit(1);
      }
      
      const result = plugin.run();
      
      console.log(result);
      
    } catch (importError) {
      if (importError.code === 'ERR_MODULE_NOT_FOUND' || 
          importError.message.includes('Cannot find module')) {
        console.error('Plugin not found');
        process.exit(1);
      } else {
        console.error(`Error loading plugin: ${importError.message}`);
        process.exit(1);
      }
    }
    
  } catch (error) {
    console.error('Unexpected error:', error.message);
    process.exit(1);
  }
};

await dynamic();
