const { spawn } = require('child_process');
const { exec } = require('child_process');
const path = require('path');

console.log('==================================================');
console.log('Broker ERP - Application Starter');
console.log('==================================================');
console.log();

// Function to open browser
function openBrowser() {
  const url = 'http://localhost:5173';
  console.log(`Opening browser at ${url}...`);
  
  // Try different methods to open browser
  if (process.platform === 'win32') {
    exec(`start ${url}`, { shell: true });
  } else if (process.platform === 'darwin') {
    exec('open ' + url);
  } else {
    exec('xdg-open ' + url);
  }
}

// Start backend server
console.log('Starting Backend Server...');
const backend = spawn('npm', ['run', 'dev'], {
  cwd: path.join(__dirname, 'backend'),
  stdio: 'inherit',
  shell: true
});

// Start frontend server
console.log('Starting Frontend Server...');
const frontend = spawn('npm', ['run', 'dev'], {
  cwd: __dirname,
  stdio: ['inherit', 'pipe', 'inherit'],
  shell: true
});

let frontendReady = false;

// Listen for frontend output to detect when it's ready
frontend.stdout.on('data', (data) => {
  const output = data.toString();
  process.stdout.write(output);
  
  // Check if frontend is ready
  if (!frontendReady && (output.includes('Local:') || output.includes('http://localhost:5173'))) {
    frontendReady = true;
    console.log('\nFrontend is ready!');
    openBrowser();
  }
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n\nShutting down servers...');
  backend.kill();
  frontend.kill();
  process.exit(0);
});

console.log('\nBoth servers are starting...');
console.log('Backend API: http://localhost:3001/api');
console.log('Frontend will open automatically when ready...\n');