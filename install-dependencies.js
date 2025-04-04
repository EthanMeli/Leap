const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

console.log(`${colors.cyan}==== Leap Dating App Dependency Installation ====${colors.reset}`);

// Check if package.json exists
try {
  // Install server dependencies
  console.log(`\n${colors.yellow}Installing server dependencies...${colors.reset}`);
  execSync('npm install', { stdio: 'inherit' });
  console.log(`${colors.green}✓ Server dependencies installed successfully${colors.reset}`);

  // Install client dependencies
  console.log(`\n${colors.yellow}Installing client dependencies...${colors.reset}`);
  process.chdir('./client');
  execSync('npm install', { stdio: 'inherit' });
  console.log(`${colors.green}✓ Client dependencies installed successfully${colors.reset}`);
  
  // Install specific packages needed for the date card feature
  console.log(`\n${colors.yellow}Installing date-fns package...${colors.reset}`);
  execSync('npm install date-fns', { stdio: 'inherit' });
  console.log(`${colors.green}✓ date-fns installed successfully${colors.reset}`);

  console.log(`\n${colors.green}All dependencies installed successfully!${colors.reset}`);
  console.log(`\n${colors.cyan}You can now run the app:${colors.reset}`);
  console.log(`${colors.magenta}1. Start the server: npm run dev${colors.reset}`);
  console.log(`${colors.magenta}2. In another terminal, start the client: cd client && npm run dev${colors.reset}`);
  
} catch (error) {
  console.error(`${colors.red}Error installing dependencies:${colors.reset}`, error.message);
  process.exit(1);
}
