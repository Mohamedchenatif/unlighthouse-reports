const { execSync } = require('child_process');
const fs = require('fs');

console.log('Setting up Chrome for Render...');

// Check if we're on Render (Linux environment)
if (process.platform === 'linux') {
  try {
    // Check if chromium is already installed
    execSync('which chromium || which chromium-browser', { stdio: 'ignore' });
    console.log('✓ Chrome/Chromium found');
  } catch (error) {
    console.log('Chrome not found, but should be installed via render.yaml');
  }
}

console.log('Setup complete!');
