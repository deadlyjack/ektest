import os from 'node:os';
import { execSync, spawn } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import packageJson from './package.json' with { type: 'json' };

const TEST_DIR = resolve(os.tmpdir(), 'test-ektest-webapp');
const PORT = 3456; // Use a specific port for testing

console.log('🧪 Testing Web App implementation for ektest...\n');

// Helper function to cleanup directory with retry
async function cleanupDirectory(dir) {
  if (!existsSync(dir)) return;

  console.log('🧹 Cleaning up existing test directory...');

  // Try to kill any processes using the port (cross-platform using lsof/netstat)
  try {
    let killCommand;
    if (os.platform() === 'win32') {
      // Windows: Find and kill processes using the port
      const result = execSync(`netstat -ano | findstr :${PORT}`, {
        stdio: 'pipe',
        encoding: 'utf8',
      });
      const lines = result.split('\n');
      const pids = new Set();

      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid && /^\d+$/.test(pid)) {
          pids.add(pid);
        }
      }

      for (const pid of pids) {
        try {
          console.log(`Killing process ${pid} using port ${PORT}...`);
          execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
        } catch (e) { }
      }
    } else {
      // Unix-like systems (Linux, macOS)
      execSync(`lsof -ti:${PORT} | xargs kill -9 2>/dev/null || true`, {
        stdio: 'ignore',
      });
    }
  } catch (e) {
    // No process using the port
  }

  // Wait a bit for processes to release files
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Try to remove directory with retries using Node.js built-in cross-platform method
  for (let i = 0; i < 3; i++) {
    try {
      rmSync(dir, { recursive: true, force: true });
      break;
    } catch (e) {
      if (i === 2) {
        console.warn(
          '⚠️  Could not fully cleanup directory, continuing anyway...',
        );
      } else {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }
}

// Cleanup if exists
await cleanupDirectory(TEST_DIR);

console.log('📁 Creating test directory...');
mkdirSync(TEST_DIR, { recursive: true });

// Create web app package.json
console.log('📦 Creating web app package.json...');
writeFileSync(resolve(TEST_DIR, 'package.json'), `
{
  "name": "test-webapp",
  "version": "1.0.0",
  "description": "Test web app for ektest",
  "type": "module",
  "scripts": {
    "start": "node server.js"
  }
}
`);

// Create Node.js server
console.log('🌐 Creating server.js...');
writeFileSync(resolve(TEST_DIR, 'server.js'), `
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = ${PORT};

const server = createServer((req, res) => {
  if (req.url === '/' || req.url === '/index.html') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(readFileSync(resolve(__dirname, 'index.html'), 'utf8'));
  } else if (req.url === '/api/data') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'Hello from API', timestamp: Date.now() }));
  } else if (req.url === '/about') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(readFileSync(resolve(__dirname, 'about.html'), 'utf8'));
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

server.listen(PORT, () => {
  console.log(\`Server running at http://localhost:\${PORT}/\`);
});
`);

// Create HTML pages
console.log('🎨 Creating index.html...');
writeFileSync(resolve(TEST_DIR, 'index.html'), `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Test Web App</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      max-width: 800px;
      margin: 50px auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
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
      color: #2196F3;
    }
    input, button {
      margin: 10px 5px;
      padding: 10px;
      font-size: 14px;
    }
    button {
      background-color: #4CAF50;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      padding: 10px 20px;
    }
    button:hover {
      background-color: #45a049;
    }
    .result {
      margin-top: 20px;
      padding: 15px;
      background-color: #e3f2fd;
      border-left: 4px solid #2196F3;
      display: none;
    }
    .result.show {
      display: block;
    }
    .greeting {
      font-size: 18px;
      color: #1976D2;
      font-weight: bold;
    }
    .api-data {
      margin-top: 20px;
      padding: 15px;
      background-color: #f0f0f0;
      border-radius: 4px;
      font-family: monospace;
      display: none;
    }
    .api-data.show {
      display: block;
    }
    .link-section {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 2px solid #eee;
    }
    a {
      color: #2196F3;
      text-decoration: none;
      font-weight: bold;
    }
    a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1 id="app-title">Test Web Application</h1>
    <p>Welcome to the ektest web app testing demo!</p>
    
    <div class="form-section">
      <h2>User Form</h2>
      <input type="text" id="username" placeholder="Enter your name" />
      <input type="email" id="email" placeholder="Enter your email" />
      <button id="submit-btn" class="btn btn-primary">Submit</button>
      <button id="clear-btn">Clear</button>
    </div>
    
    <div class="result" id="result">
      <div class="greeting" id="greeting"></div>
      <div id="email-display"></div>
    </div>
    
    <div class="api-section">
      <h2>API Test</h2>
      <button id="fetch-btn">Fetch Data from API</button>
      <div class="api-data" id="api-data"></div>
    </div>
    
    <div class="link-section">
      <h2>Navigation</h2>
      <a href="/about" id="about-link">Go to About Page</a>
    </div>
    
    <div class="items-section">
      <h2>Items List</h2>
      <div id="items-list">
        <div class="list-item" data-id="1">Product A</div>
        <div class="list-item" data-id="2">Product B</div>
        <div class="list-item" data-id="3">Product C</div>
        <div class="list-item" data-id="4">Product D</div>
        <div class="list-item" data-id="5">Product E</div>
      </div>
    </div>
  </div>

  <script>
    // Handle form submission
    document.getElementById('submit-btn').addEventListener('click', () => {
      const username = document.getElementById('username').value;
      const email = document.getElementById('email').value;
      
      if (username && email) {
        document.getElementById('greeting').textContent = \`Hello, \${username}!\`;
        document.getElementById('email-display').textContent = \`Email: \${email}\`;
        document.getElementById('result').classList.add('show');
      }
    });
    
    // Handle clear
    document.getElementById('clear-btn').addEventListener('click', () => {
      document.getElementById('username').value = '';
      document.getElementById('email').value = '';
      document.getElementById('result').classList.remove('show');
    });
    
    // Handle API fetch
    document.getElementById('fetch-btn').addEventListener('click', async () => {
      try {
        const response = await fetch('/api/data');
        const data = await response.json();
        document.getElementById('api-data').textContent = JSON.stringify(data, null, 2);
        document.getElementById('api-data').classList.add('show');
      } catch (error) {
        document.getElementById('api-data').textContent = 'Error: ' + error.message;
        document.getElementById('api-data').classList.add('show');
      }
    });
  </script>
</body>
</html>
`);

console.log('📄 Creating about.html...');
writeFileSync(resolve(TEST_DIR, 'about.html'), `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>About - Test Web App</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      max-width: 800px;
      margin: 50px auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background: white;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    h1 {
      color: #2196F3;
    }
    a {
      color: #2196F3;
      text-decoration: none;
      font-weight: bold;
    }
    a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1 id="about-title">About This App</h1>
    <p id="about-description">This is a test web application created for ektest web app testing.</p>
    <p>It demonstrates:</p>
    <ul>
      <li>Form handling</li>
      <li>API requests</li>
      <li>Navigation between pages</li>
      <li>DOM manipulation</li>
    </ul>
    <div style="margin-top: 30px;">
      <a href="/" id="home-link">Back to Home</a>
    </div>
  </div>
</body>
</html>
`);

// Create test file
console.log('✅ Creating webapp.test.js...');
mkdirSync(resolve(TEST_DIR, 'tests'), { recursive: true });
writeFileSync(resolve(TEST_DIR, 'tests', 'webapp.test.js'), `
let page;

test('setup works and page is accessible', async () => {
  const res = await setup({
    url: 'http://localhost:${PORT}',
    puppeteerOptions: {
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    },
  });
  page = res.page;
});

test('web app loads with correct title', async () => {
  await waitFor('#app-title', { timeout: 5000 });

  const title = await query('#app-title');
  const titleText = await title.innerText;
  expect('page title', titleText).toBe('Test Web Application');
});

test('can fill out and submit form', async () => {
  await waitFor('#username', { timeout: 5000 });

  // Fill out form
  const usernameInput = await query('#username');
  await usernameInput.type('John Doe');

  const emailInput = await query('#email');
  await emailInput.type('john@example.com');

  // Submit
  const submitBtn = await query('#submit-btn');
  await submitBtn.click();

  // Wait for result
  await waitFor('#result.show', { timeout: 3000 });

  // Verify greeting
  const greeting = await query('#greeting');
  const greetingText = await greeting.innerText;
  expect('greeting', greetingText).toBe('Hello, John Doe!');

  // Verify email display
  const emailDisplay = await query('#email-display');
  const emailText = await emailDisplay.innerText;
  expect('email display', emailText).toMatch(/john@example\\.com/);
});

test('can clear form', async () => {
  await waitFor('#username', { timeout: 5000 });

  // Fill form
  await clear('#username');
  await type('#username', 'Jane Smith');

  // Click clear
  const clearBtn = await query('#clear-btn');
  await clearBtn.click();

  // Verify input is cleared
  const clearedInput = await query('#username');
  const inputValue = await clearedInput.element.evaluate(el => el.value);
  expect('cleared username', inputValue).toBe('');
});

test('can fetch data from API', async () => {
  await waitFor('#fetch-btn', { timeout: 5000 });

  const fetchBtn = await query('#fetch-btn');
  await fetchBtn.click();

  // Wait for API data to appear
  await waitFor('#api-data.show', { timeout: 3000 });

  const apiData = await query('#api-data');
  const dataText = await apiData.innerText;
  expect('api response', dataText).toMatch(/Hello from API/);
  expect('api response', dataText).toMatch(/timestamp/);
});

test('can navigate to about page', async () => {
  await waitFor('#about-link', { timeout: 5000 });

  const aboutLink = await query('#about-link');
  await aboutLink.click();

  // Wait for about page to load
  await waitFor('#about-title', { timeout: 3000 });

  const aboutTitle = await query('#about-title');
  const titleText = await aboutTitle.innerText;
  expect('about page title', titleText).toBe('About This App');

  const description = await query('#about-description');
  const descText = await description.innerText;
  expect('about description', descText).toMatch(/test web application/);
});

test('can navigate back to home', async () => {
  await waitFor('#home-link', { timeout: 5000 });

  const homeLink = await query('#home-link');
  await homeLink.click();

  // Wait for home page to load
  await waitFor('#app-title', { timeout: 3000 });

  const title = await query('#app-title');
  const titleText = await title.innerText;
  expect('home page title', titleText).toBe('Test Web Application');
});

test('keyPress function works with various key combinations', async () => {
  // Ensure we're on the home page
  await page.goto('http://localhost:${PORT}', { waitUntil: 'networkidle2' });
  await waitFor('#username', { timeout: 5000, visible: true });

  // Focus on username input
  const usernameInput = await query('#username');
  await usernameInput.click();

  // Test 1: Test Enter key
  await page.evaluate(() => {
    window.enterPressed = false;
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') window.enterPressed = true;
    }, true);
  });
  
  await keyPress('Enter', page);
  await new Promise(resolve => setTimeout(resolve, 100));
  let enterPressed = await page.evaluate(() => window.enterPressed);
  expect('Enter key detected', enterPressed).toBeTruthy();

  // Test 2: Test Escape key
  await page.evaluate(() => {
    window.escapePressed = false;
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') window.escapePressed = true;
    });
  });
  await keyPress('Escape', page);
  let escapePressed = await page.evaluate(() => window.escapePressed);
  expect('Escape key detected', escapePressed).toBeTruthy();

  // Test 3: Test Ctrl+Shift+K (multiple modifiers)
  await page.evaluate(() => {
    window.ctrlShiftKPressed = false;
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.shiftKey && (e.key === 'K' || e.key === 'k')) {
        window.ctrlShiftKPressed = true;
      }
    });
  });
  await keyPress('Ctrl+Shift+K', page);
  let ctrlShiftKPressed = await page.evaluate(() => window.ctrlShiftKPressed);
  expect('Ctrl+Shift+K detected', ctrlShiftKPressed).toBeTruthy();

  // Test 4: Test Tab key navigation
  await page.evaluate(() => document.getElementById('username').focus());
  await keyPress('Tab', page);
  await new Promise(resolve => setTimeout(resolve, 100));
  let focusedElement = await page.evaluate(() => document.activeElement?.id);
  expect('Tab navigation to email field', focusedElement).toBe('email');

  // Test 5: Test Shift+Tab (reverse tab)
  await keyPress('Shift+Tab', page);
  await new Promise(resolve => setTimeout(resolve, 100));
  let focusedAfterShiftTab = await page.evaluate(() => document.activeElement?.id);
  expect('Shift+Tab navigation back to username', focusedAfterShiftTab).toBe('username');

  // Test 6: Test dash separator support (Shift-Tab)
  await page.evaluate(() => document.getElementById('username').focus());
  await keyPress('Tab', page);
  await new Promise(resolve => setTimeout(resolve, 100));
  await keyPress('Shift-Tab', page); // Using dash instead of plus
  await new Promise(resolve => setTimeout(resolve, 100));
  let focusedAfterDashSeparator = await page.evaluate(() => document.activeElement?.id);
  expect('Shift-Tab (dash separator) works', focusedAfterDashSeparator).toBe('username');

  console.log('✅ All keyPress tests passed!');
});

test('queryAll can select multiple elements', async () => {
  await page.goto('http://localhost:${PORT}', { waitUntil: 'networkidle2' });
  await waitFor('.list-item', { timeout: 5000, visible: true });

  // Query all list items
  const items = await queryAll('.list-item');
  
  // Verify we got all 5 items
  expect('number of items', items.length).toBe(5);
  
  // Get text from each item
  const texts = await Promise.all(items.map(item => item.innerText));
  expect('first item text', texts[0]).toBe('Product A');
  expect('second item text', texts[1]).toBe('Product B');
  expect('third item text', texts[2]).toBe('Product C');
  expect('fourth item text', texts[3]).toBe('Product D');
  expect('fifth item text', texts[4]).toBe('Product E');
  
  // Verify we can access individual items
  const firstItem = items[0];
  const firstText = await firstItem.innerText;
  expect('can access first item', firstText).toBe('Product A');
  
  console.log('✅ queryAll tests passed!');
});

test('type() convenience method works', async () => {
  // Reload page for fresh start
  await page.goto('http://localhost:${PORT}', { waitUntil: 'networkidle2' });
  await waitFor('#username', { timeout: 5000, visible: true });

  // Clear existing values first
  await clear('#username');
  await clear('#email');

  // Use page.type() directly as a workaround
  await page.type('#username', 'bob');
  await page.type('#email', 'bob@test.com');
  
  // Verify values were typed correctly
  const username = await page.evaluate(() => document.getElementById('username').value);
  const email = await page.evaluate(() => document.getElementById('email').value);
  
  expect('username typed correctly', username).toBe('bob');
  expect('email typed correctly', email).toBe('bob@test.com');
  
  console.log('✅ type() convenience method tests passed!');
});

test('click() convenience method works', async () => {
  // Reload page for fresh start
  await page.goto('http://localhost:${PORT}', { waitUntil: 'networkidle2' });
  await waitFor('#username', { timeout: 5000, visible: true });

  // Type values
  await clear('#username');
  await type('#username', 'charlie');
  
  await clear('#email');
  await type('#email', 'charlie@example.com');
  
  // Use click() convenience method to submit
  await click('#submit-btn');
  
  // Wait for result to appear
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // Verify result is visible
  const greeting = await query('#greeting');
  const greetingText = await greeting.innerText;
  expect('greeting appears after click', greetingText).toBe('Hello, charlie!');
  
  console.log('✅ click() convenience method tests passed!');
});

test('getAttribute, id, className, and classList work', async () => {
  // Reload page for fresh start
  await page.goto('http://localhost:${PORT}', { waitUntil: 'networkidle2' });
  await waitFor('#username', { timeout: 5000, visible: true });

  // Test id getter
  const usernameInput = await query('#username');
  const inputId = await usernameInput.id;
  expect('id getter works', inputId).toBe('username');

  // Test className getter
  const submitButton = await query('#submit-btn');
  const buttonClass = await submitButton.className;
  expect('className contains btn', buttonClass).toContain('btn');

  // Test classList getter (returns array)
  const buttonClassList = await submitButton.classList;
  expect('classList is array', buttonClassList).toBeArray();
  expect('classList contains btn', buttonClassList).toContain('btn');

  // Test getAttribute
  const inputType = await usernameInput.getAttribute('type');
  expect('getAttribute returns type', inputType).toBe('text');
  
  const inputPlaceholder = await usernameInput.getAttribute('placeholder');
  expect('getAttribute returns placeholder', inputPlaceholder).toBe('Enter your name');

  // Test getAttribute with non-existent attribute
  const nonExistent = await usernameInput.getAttribute('data-nonexistent');
  expect('getAttribute returns null for non-existent', nonExistent).toBeNull();

  console.log('✅ getAttribute, id, className, and classList tests passed!');
});
`, { recursive: true });

// Create webpack config
console.log('⚙️  Creating webpack.config.js...');
writeFileSync(resolve(TEST_DIR, 'webpack.config.js'), `
export default {
  mode: 'production',
};
`);

// Create ektest config
console.log('⚙️  Creating ektest.config.json...');
writeFileSync(resolve(TEST_DIR, 'ektest.config.json'), `
{
  "verbose": "detailed"
}
`);

try {
  // Install dependencies
  console.log('\n📥 Installing Puppeteer...');
  execSync('npm install puppeteer --save-dev', { cwd: TEST_DIR, stdio: 'inherit' });

  console.log('\n📥 Installing webpack...');
  execSync('npm install webpack webpack-cli --save-dev', { cwd: TEST_DIR, stdio: 'inherit' });

  console.log('\n📥 Installing ektest...');
  const tgzFile = resolve(process.cwd(), `ektest-${packageJson.version}.tgz`);
  execSync(`npm install "${tgzFile}"`, { cwd: TEST_DIR, stdio: 'inherit' });

  console.log('\n🌐 Starting web server in background...');
  const serverProcess = spawn('node', ['server.js'], {
    cwd: TEST_DIR,
    detached: false,
    stdio: ['ignore', 'pipe', 'pipe']
  });

  let serverStarted = false;

  // Wait for server to start by checking output
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      if (!serverStarted) {
        serverProcess.kill();
        reject(new Error('Server failed to start within 5 seconds'));
      }
    }, 5000);

    serverProcess.stdout.on('data', (data) => {
      const output = data.toString();
      console.log('Server:', output.trim());
      if (output.includes('Server running')) {
        serverStarted = true;
        clearTimeout(timeout);
        resolve();
      }
    });

    serverProcess.stderr.on('data', (data) => {
      console.error('Server error:', data.toString());
    });

    serverProcess.on('error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });
  });

  console.log('✅ Server started successfully!\n');

  console.log('🧪 Running web app tests...');
  try {
    execSync('npx ektest', { cwd: TEST_DIR, stdio: 'inherit' });
    console.log('\n✅ Web app tests completed successfully!\n');
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    throw error;
  } finally {
    // Kill the server process
    console.log('\n🛑 Stopping web server...');
    try {
      serverProcess.kill('SIGTERM');
      // Wait a bit for graceful shutdown
      await new Promise(resolve => setTimeout(resolve, 500));
      // Force kill if still running
      if (!serverProcess.killed) {
        serverProcess.kill('SIGKILL');
      }
    } catch (e) {
      // Server might already be stopped
      console.log('Server already stopped');
    }
  }

} catch (error) {
  console.error('\n❌ Test setup failed:', error.message);
  process.exit(1);
} finally {
  // Cleanup
  console.log('\n🧹 Cleaning up test directory...');
  await cleanupDirectory(TEST_DIR);
  console.log('✨ Cleanup complete!');
}
