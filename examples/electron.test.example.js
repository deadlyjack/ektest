// Example Electron test using ektest with Puppeteer
// To use this, you need to install puppeteer-core:
// npm install --save-dev puppeteer-core

// Example test file: electron.test.js

test('Electron app launches and has correct title', async () => {
  // Setup Electron with your app
  const { page, cleanup } = await setupElectron({
    appPath: 'path/to/your/electron/app', // Path to your Electron executable
    puppeteerOptions: {
      // Additional Puppeteer options if needed
      headless: false,
      defaultViewport: null,
    }
  });

  try {
    // Query an element by selector
    const titleElement = await query('#app-title');

    // Get inner text
    const text = await titleElement.innerText;
    expect('title text', text).toBe('My Electron App');

    // Get inner HTML
    const html = await titleElement.innerHTML;
    expect('title html', html).toBeString();

    // Click an element
    const button = await query('#submit-button');
    await button.click();

    // Right-click to open context menu
    const menuItem = await query('#menu-item');
    await menuItem.contextMenu();

  } finally {
    // Always cleanup after tests
    await cleanup();
  }
});

test('Can interact with multiple elements', async () => {
  const { cleanup } = await setupElectron({
    appPath: 'path/to/your/electron/app',
  });

  try {
    // Query and interact with form elements
    const input = await query('input[type="text"]');
    await input.click();

    // You can also access the raw Puppeteer element for advanced operations
    const rawElement = input.element;
    await rawElement.type('Hello from ektest!');

    const submitBtn = await query('button[type="submit"]');
    await submitBtn.click();

    // Wait for result and verify
    await new Promise(resolve => setTimeout(resolve, 1000));

    const result = await query('#result');
    const resultText = await result.innerText;
    expect('result text', resultText).toBe('Success!');

  } finally {
    await cleanup();
  }
});

test('Advanced Puppeteer operations', async () => {
  const { page, cleanup } = await setupElectron({
    appPath: 'path/to/your/electron/app',
  });

  try {
    // Query an element
    const button = await query('#my-button');

    // Access the Puppeteer page instance for complex operations
    const puppeteerPage = button.puppeteer;

    // Take a screenshot
    await puppeteerPage.screenshot({ path: 'test-screenshot.png' });

    // Evaluate JavaScript in the page context
    const windowInfo = await puppeteerPage.evaluate(() => {
      return {
        width: window.innerWidth,
        height: window.innerHeight,
        title: document.title,
        url: window.location.href
      };
    });

    expect('window width', windowInfo.width).toBeGreaterThan(0);
    expect('window height', windowInfo.height).toBeGreaterThan(0);

    // Wait for navigation after clicking
    await Promise.all([
      puppeteerPage.waitForNavigation({ timeout: 5000 }),
      button.click()
    ]);

    // Get all console messages
    puppeteerPage.on('console', msg => {
      console.log('Browser console:', msg.text());
    });

  } finally {
    await cleanup();
  }
});
