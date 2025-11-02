import os from 'node:os';
import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import packageJson from './package.json' with { type: 'json' };

const TEST_DIR = resolve(os.tmpdir(), 'test-ektest-electron');

console.log('🧪 Testing Electron implementation for ektest...\n');

// Cleanup if exists
if (existsSync(TEST_DIR)) {
  console.log('🧹 Cleaning up existing test directory...');
  rmSync(TEST_DIR, { recursive: true, force: true });
}

console.log('📁 Creating test directory...');
mkdirSync(TEST_DIR, { recursive: true });

// Create Electron app package.json
console.log('📦 Creating Electron app package.json...');
writeFileSync(resolve(TEST_DIR, 'package.json'), `
{
  "name": "test-electron-app",
  "version": "1.0.0",
  "description": "Test Electron app for ektest",
  "main": "main.js",
  "scripts": {
    "start": "electron ."
  }
}
`);

// Create Electron main process file (using CommonJS)
console.log('📝 Creating Electron main.js...');
writeFileSync(resolve(TEST_DIR, 'main.js'), `
const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  win.loadFile('index.html');
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
`);

// Create HTML UI
console.log('🎨 Creating index.html...');
writeFileSync(resolve(TEST_DIR, 'index.html'), `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Test Electron App</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      padding: 20px;
      background-color: #f0f0f0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: white;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    h1 {
      color: #333;
      margin-top: 0;
    }
    #app-title {
      color: #0066cc;
      font-size: 24px;
      margin-bottom: 20px;
    }
    button {
      background-color: #0066cc;
      color: white;
      border: none;
      padding: 10px 20px;
      font-size: 16px;
      border-radius: 4px;
      cursor: pointer;
      margin: 5px;
    }
    button:hover {
      background-color: #0052a3;
    }
    input {
      width: 100%;
      padding: 10px;
      margin: 10px 0;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 16px;
    }
    #result, #message {
      margin-top: 20px;
      padding: 10px;
      border-radius: 4px;
      display: none;
    }
    .success {
      background-color: #d4edda;
      color: #155724;
      border: 1px solid #c3e6cb;
    }
    .info {
      background-color: #d1ecf1;
      color: #0c5460;
      border: 1px solid #bee5eb;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1 id="app-title">Test Electron App</h1>
    
    <div>
      <input type="text" id="username" name="username" placeholder="Enter username" />
      <input type="email" id="email" name="email" placeholder="Enter email" />
    </div>
    
    <div>
      <button id="submit-button" type="submit">Submit</button>
      <button id="reset-button">Reset</button>
      <button id="context-menu-button">Right Click Me</button>
    </div>
    
    <div id="result" class="success" style="display: none;">
      <strong>Success!</strong> Form submitted successfully.
    </div>
    
    <div id="message" class="info">
      Welcome to the test app!
    </div>
  </div>

  <script>
    const submitBtn = document.getElementById('submit-button');
    const resetBtn = document.getElementById('reset-button');
    const contextMenuBtn = document.getElementById('context-menu-button');
    const result = document.getElementById('result');
    const message = document.getElementById('message');
    const usernameInput = document.getElementById('username');
    const emailInput = document.getElementById('email');

    submitBtn.addEventListener('click', () => {
      result.style.display = 'block';
      message.style.display = 'none';
      console.log('Submit button clicked');
    });

    resetBtn.addEventListener('click', () => {
      usernameInput.value = '';
      emailInput.value = '';
      result.style.display = 'none';
      message.style.display = 'block';
      console.log('Reset button clicked');
    });

    contextMenuBtn.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      message.innerHTML = 'Context menu opened!';
      message.style.display = 'block';
      result.style.display = 'none';
      console.log('Context menu opened');
    });

    // Show welcome message on load
    message.style.display = 'block';
  </script>
</body>
</html>
`);

// Create test file
console.log('✅ Creating electron.test.js...');

// Create a tests subdirectory for ES module test files
const testsDir = resolve(TEST_DIR, 'tests');
mkdirSync(testsDir, { recursive: true });

// Create package.json for tests subdirectory (ES module)
writeFileSync(resolve(testsDir, 'package.json'), `
{
  "type": "module"
}
`);

// Create webpack config for tests
writeFileSync(resolve(testsDir, 'webpack.config.js'), `
export default {
  target: 'node',
  mode: 'development',
  entry: './index.js',
  output: {
    filename: 'bundle.js',
  },
  module: {
    rules: [
      {
        test: /\.js?$/,
        type: 'javascript/auto',
        exclude: /(node_modules)/,
        resolve: {
          fullySpecified: false,
        },
      },
    ]
  },
};
`);

writeFileSync(resolve(testsDir, 'electron.test.js'), `
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import os from 'node:os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Determine electron executable path based on platform
function getElectronPath() {
  const platform = os.platform();
  const electronModule = resolve(__dirname, '..', 'node_modules', 'electron');
  
  if (platform === 'win32') {
    return resolve(electronModule, 'dist', 'electron.exe');
  } else if (platform === 'darwin') {
    return resolve(electronModule, 'dist', 'Electron.app', 'Contents', 'MacOS', 'Electron');
  } else {
    return resolve(electronModule, 'dist', 'electron');
  }
}

test('Electron app launches and has correct title', async () => {
  const electronPath = getElectronPath();
  const appPath = resolve(__dirname, '..', 'main.js');

  const { page } = await setupElectron({
    appPath: electronPath,
    puppeteerOptions: {
      args: [appPath],
      headless: false,
      timeout: 30000,
    }
  });

  // Wait for app to load
  await page.waitForSelector('#app-title', { timeout: 10000 });

  // Query the title element
  const titleElement = await query('#app-title');
  
  // Get inner text
  const text = await titleElement.innerText;
  expect('title text', text).toBe('Test Electron App');
  
  // Get inner HTML
  const html = await titleElement.innerHTML;
  expect('title HTML', html).toBeString();
  expect('title HTML', html).toMatch(/Test Electron App/);
});

test('Can interact with buttons and get text', async () => {
  const electronPath = getElectronPath();
  const appPath = resolve(__dirname, '..', 'main.js');

  const { page } = await setupElectron({
    appPath: electronPath,
    puppeteerOptions: {
      args: [appPath],
      headless: false,
      timeout: 30000,
    }
  });

  // Use waitFor function to wait for element
  await waitFor('#submit-button', { timeout: 10000 });

  // Test submit button
  const submitButton = await query('#submit-button');
  const buttonText = await submitButton.innerText;
  expect('submit button text', buttonText).toBe('Submit');
  
  // Click submit button
  await submitButton.click();
  
  // Use waitFor function to wait for result to appear
  await waitFor('#result[style*="display: block"]', { timeout: 5000 });
  
  // Verify result is visible
  const result = await query('#result');
  const resultText = await result.innerText;
  expect('result message', resultText).toMatch(/Success/);
});

test('Can interact with input fields', async () => {
  const electronPath = getElectronPath();
  const appPath = resolve(__dirname, '..', 'main.js');

  const { page } = await setupElectron({
    appPath: electronPath,
    puppeteerOptions: {
      args: [appPath],
      headless: false,
      timeout: 30000,
    }
  });

  await page.waitForSelector('#username', { timeout: 10000 });

  // Interact with username input using the new type method
  const usernameInput = await query('#username');
  await usernameInput.click();
  await usernameInput.type('testuser');
  
  // Interact with email input using the new type method with custom delay
  const emailInput = await query('#email');
  await emailInput.click();
  await emailInput.type('test@example.com', { delay: 30 });
  
  // Get values through evaluation
  const username = await page.evaluate(() => document.getElementById('username').value);
  const email = await page.evaluate(() => document.getElementById('email').value);
  
  expect('username value', username).toBe('testuser');
  expect('email value', email).toBe('test@example.com');
});

test('Can trigger context menu', async () => {
  const electronPath = getElectronPath();
  const appPath = resolve(__dirname, '..', 'main.js');

  const { page } = await setupElectron({
    appPath: electronPath,
    puppeteerOptions: {
      args: [appPath],
      headless: false,
      timeout: 30000,
    }
  });

  await page.waitForSelector('#context-menu-button', { timeout: 10000 });

    // Right-click the context menu button
    const contextButton = await query('#context-menu-button');
    await contextButton.contextMenu();
    
    // Wait a moment for the event to process using setTimeout
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Check if message updated
    const message = await query('#message');
    const messageHTML = await message.innerHTML;
    expect('context menu message', messageHTML).toMatch(/Context menu opened/);
});

test('Can access puppeteer instance for advanced operations', async () => {
  const electronPath = getElectronPath();
  const appPath = resolve(__dirname, '..', 'main.js');

  const { page } = await setupElectron({
    appPath: electronPath,
    puppeteerOptions: {
      args: [appPath],
      headless: false,
      timeout: 30000,
    }
  });

  await page.waitForSelector('#app-title', { timeout: 10000 });

  // Query an element
  const title = await query('#app-title');
  
  // Access puppeteer page instance
  const puppeteerPage = title.puppeteer;
  
  // Use puppeteer to evaluate something
  const pageTitle = await puppeteerPage.evaluate(() => document.title);
  expect('page title', pageTitle).toBe('Test Electron App');
  
  // Use puppeteer to get all button elements
  const buttonCount = await puppeteerPage.evaluate(() => {
      return document.querySelectorAll('button').length;
    });
    expect('button count', buttonCount).toBe(3);
    
    // Verify puppeteer page is the same as the one from setupElectron
    expect('puppeteer instance', puppeteerPage === page).toBeTruthy();
});
`);

// Create webpack config
console.log('⚙️  Creating webpack.config.js...');
writeFileSync(resolve(TEST_DIR, 'webpack.config.js'), `
export default {
  target: 'node',
  mode: 'development',
  entry: './index.js',
  output: {
    filename: 'bundle.js',
  },
  module: {
    rules: [
      {
        test: /\.js?$/,
        type: 'javascript/auto',
        exclude: /(node_modules)/,
        resolve: {
          fullySpecified: false,
        },
      },
    ]
  },
};
`);

// Create ektest config to point to tests directory
console.log('⚙️  Creating ektest.config.json...');
writeFileSync(resolve(TEST_DIR, 'ektest.config.json'), `
{
  "testDir": "tests"
}
`);

try {
  // Install dependencies
  console.log('\n📥 Installing Electron...');
  execSync('npm install electron --save-dev', { cwd: TEST_DIR, stdio: 'inherit' });

  console.log('\n📥 Installing Puppeteer...');
  execSync('npm install puppeteer --save-dev', { cwd: TEST_DIR, stdio: 'inherit' });

  console.log('\n📥 Installing webpack...');
  execSync('npm install webpack webpack-cli --save-dev', { cwd: TEST_DIR, stdio: 'inherit' });

  console.log('\n📥 Installing ektest...');
  const tgzFile = resolve(process.cwd(), `ektest-${packageJson.version}.tgz`);
  execSync(`npm install --legacy-peer-deps --save-dev "${tgzFile}"`, { cwd: TEST_DIR, stdio: 'inherit' });

  // Run tests
  console.log('\n🧪 Running Electron tests...\n');
  execSync('npx ektest', { cwd: TEST_DIR, stdio: 'inherit' });

  console.log('\n✅ Electron tests completed successfully!');

} catch (error) {
  console.error('\n❌ Test failed:', error.message);
  process.exit(1);
} finally {
  // Cleanup with retry
  console.log('\n🧹 Cleaning up test directory...');
  if (existsSync(TEST_DIR)) {
    // Try multiple times as files may still be in use
    for (let i = 0; i < 3; i++) {
      try {
        rmSync(TEST_DIR, { recursive: true, force: true, maxRetries: 3, retryDelay: 1000 });
        break;
      } catch (e) {
        if (i === 2) {
          console.warn('⚠️  Could not cleanup directory, it may need manual removal');
        } else {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
  }
  console.log('✨ Cleanup complete!\n');
}
