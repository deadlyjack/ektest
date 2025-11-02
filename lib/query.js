/**
 * Query selector for Electron testing using Puppeteer
 * @param {string} selector - CSS selector to query
 * @returns {Promise<QueryElement>} - Element wrapper with testing utilities
 */

// Internal array to store cleanup functions
const cleanupFunctions = [];

/**
 * Perform cleanup for all Electron instances
 * @internal
 */
export async function cleanupElectron() {
  for (const cleanup of cleanupFunctions) {
    await cleanup();
  }
  cleanupFunctions.length = 0;
}

/**
 * Wait for a selector to appear in the Electron page
 * @param {string} selector - CSS selector to wait for
 * @param {Object} options - Wait options
 * @param {number} options.timeout - Maximum time to wait in milliseconds (default: 30000)
 * @param {boolean} options.visible - Wait for element to be visible (default: false)
 * @param {boolean} options.hidden - Wait for element to be hidden (default: false)
 * @returns {Promise<ElementHandle>}
 */
export async function waitFor(selector, options = {}) {
  if (typeof globalThis.electronPage === 'undefined') {
    throw new Error(
      'Electron page not initialized. Please call setupElectron() first:\n' +
      '  await setupElectron({ puppeteerOptions: { args: ["./main.js"] } });'
    );
  }

  const page = globalThis.electronPage;
  return await page.waitForSelector(selector, options);
}

export default async function query(selector) {
  if (typeof globalThis.electronPage === 'undefined') {
    throw new Error(
      'Electron page not initialized. Please call setupElectron() first:\n' +
      '  await setupElectron({ puppeteerOptions: { args: ["./main.js"] } });'
    );
  }

  const page = globalThis.electronPage;
  const element = await page.$(selector);

  if (!element) {
    throw new Error(`Element not found: ${selector}`);
  }

  return {
    /**
     * Get the inner text of the element
     * @returns {Promise<string>}
     */
    get innerText() {
      return element.evaluate(el => el.innerText);
    },

    /**
     * Get the inner HTML of the element
     * @returns {Promise<string>}
     */
    get innerHTML() {
      return element.evaluate(el => el.innerHTML);
    },

    /**
     * Click the element
     * @returns {Promise<void>}
     */
    async click() {
      await element.click();
    },

    /**
     * Right-click (context menu) on the element
     * @returns {Promise<void>}
     */
    async contextMenu() {
      await element.click({ button: 'right' });
    },

    /**
     * Type text into the element with human-like delays between keystrokes
     * @param {string} text - The text to type
     * @param {Object} options - Typing options
     * @param {number} options.delay - Delay between keystrokes in milliseconds (default: random 50-150ms)
     * @returns {Promise<void>}
     */
    async type(text, options = {}) {
      const delay = options.delay;

      for (let i = 0; i < text.length; i++) {
        const char = text[i];
        await element.type(char);

        // Add human-like delay between keystrokes
        if (i < text.length - 1) {
          const waitTime = delay !== undefined ? delay : Math.random() * 100 + 50; // Random delay between 50-150ms
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    },

    /**
     * Get the raw Puppeteer element handle for advanced operations
     * @returns {ElementHandle}
     */
    get element() {
      return element;
    },

    /**
     * Get the Puppeteer page instance for complex testing scenarios
     * @returns {Page}
     */
    get puppeteer() {
      return page;
    },
  };
}

/**
 * Setup Electron testing environment with Puppeteer
 * This function automatically detects if Electron is available and launches it
 * Cleanup is handled automatically after tests complete
 * @param {Object} options - Configuration options
 * @param {string} options.appPath - Path to the Electron app executable (optional if electron package is installed)
 * @param {Object} options.puppeteerOptions - Additional Puppeteer launch options
 * @returns {Promise<{browser: any, page: any}>}
 */
export async function setupElectron(options = {}) {
  let puppeteer;

  try {
    const puppeteerModule = await import('puppeteer-core');
    puppeteer = puppeteerModule.default || puppeteerModule;
  } catch {
    throw new Error('puppeteer-core is required for Electron testing. Install it with: npm install --save-dev puppeteer-core');
  }

  let { appPath, puppeteerOptions = {} } = options;

  // Auto-detect Electron if appPath not provided
  if (!appPath) {
    try {
      const path = await import('node:path');
      const os = await import('node:os');
      const { fileURLToPath } = await import('node:url');

      const platform = os.platform();
      const electronModule = path.dirname(fileURLToPath(import.meta.url));
      const electronRoot = path.resolve(electronModule, '..', '..', 'electron');

      if (platform === 'win32') {
        appPath = path.resolve(electronRoot, 'dist', 'electron.exe');
      } else if (platform === 'darwin') {
        appPath = path.resolve(electronRoot, 'dist', 'Electron.app', 'Contents', 'MacOS', 'Electron');
      } else {
        appPath = path.resolve(electronRoot, 'dist', 'electron');
      }
    } catch {
      throw new Error('Could not auto-detect Electron. Please provide appPath in options.');
    }
  }

  // Verify the app file exists before attempting to launch
  try {
    const fs = await import('node:fs/promises');
    const path = await import('node:path');
    const resolvedPath = path.resolve(appPath);

    try {
      await fs.access(resolvedPath);
    } catch {
      throw new Error(
        `Electron app file not found: ${resolvedPath}\n` +
        'Please ensure:\n' +
        '  1. The file path is correct\n' +
        '  2. Your Electron app is built (run your build command)\n' +
        '  3. The file exists at the specified location'
      );
    }
  } catch (error) {
    if (error.message.includes('not found')) {
      throw error;
    }
    // If it's an import error, continue (fs/promises might not be available)
  }

  try {
    const browser = await puppeteer.launch({
      executablePath: appPath,
      ...puppeteerOptions,
    });

    const pages = await browser.pages();
    const page = pages[0] || await browser.newPage();

    // Store the page globally for query function to access
    globalThis.electronPage = page;
    globalThis.electronBrowser = browser;

    /**
     * Cleanup function to close the browser and clear global references
     */
    const cleanup = async () => {
      if (globalThis.electronBrowser) {
        await globalThis.electronBrowser.close();
        delete globalThis.electronPage;
        delete globalThis.electronBrowser;
      }
    };

    // Store cleanup function for automatic cleanup after tests
    cleanupFunctions.push(cleanup);

    return {
      browser,
      page,
    };
  } catch (error) {
    // Provide better error messages for common issues
    if (error.message?.includes('Failed to launch')) {
      throw new Error(
        'Failed to launch Electron. Common causes:\n' +
        '  1. The Electron app file does not exist or is not built yet\n' +
        '  2. The app path in puppeteerOptions.args is incorrect\n' +
        '  3. The Electron executable path (executablePath) is wrong\n' +
        '\nOriginal error: ' + error.message
      );
    }
    console.error('Failed to launch Electron with Puppeteer:', error);
    throw error;
  }
}
