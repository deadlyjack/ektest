/**
 * Query selector for Electron and web app testing using Puppeteer
 * @param {string} selector - CSS selector to query
 * @returns {Promise<QueryElement>} - Element wrapper with testing utilities
 */

// Cache for setup instances keyed by url or appPath
const setupCache = new Map();

/**
 * Perform cleanup for all browser instances
 * @internal
 */
export async function cleanup() {
  if (globalThis.browser) {
    await globalThis.browser.close();
    delete globalThis.browserPage;
    delete globalThis.browser;
  }
  setupCache.clear();
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
  if (typeof globalThis.browserPage === 'undefined') {
    throw new Error(
      'Page not initialized. Please call setup() first:\n' +
      '  await setup({ url: "http://localhost:3000" });'
    );
  }

  const page = globalThis.browserPage;
  try {
    return await page.waitForSelector(selector, options);
  } catch (error) {
    const timeout = options.timeout || 30_000;
    let condition = 'present';
    if (options.visible) {
      condition = 'visible';
    } else if (options.hidden) {
      condition = 'hidden';
    }
    throw new Error(
      `Timeout waiting for selector "${selector}" to be ${condition} (waited ${timeout}ms).\n` +
      `Original error: ${error.message}`
    );
  }
}

/**
 * Send keyboard shortcuts with modifiers to the page
 * Supports combinations like 'Enter', 'Shift+Enter', 'Ctrl+A', 'Shift+Ctrl+A', etc.
 * @param {string} keys - Key combination string (e.g., 'Enter', 'Shift+A', 'Ctrl+Shift+K')
 * @returns {Promise<void>}
 */
export async function keyPress(keys, providedPage = null) {
  const page = providedPage || globalThis.browserPage;

  if (typeof page === 'undefined') {
    throw new Error(
      'Page not initialized. Please call setup() first or pass page as second argument:\n' +
      '  await setup({ url: "http://localhost:3000" });\n' +
      '  await keyPress("Enter"); // Uses global page\n' +
      '  // OR\n' +
      '  const { page } = await setup({ url: "http://localhost:3000" });\n' +
      '  await keyPress("Enter", page); // Pass page explicitly'
    );
  }

  // Normalize separators: replace '-' or '+' with '+'
  const normalizedKeys = keys.replace(/[-+]/g, '+');

  // Split into parts
  const parts = normalizedKeys.split('+').map(k => k.trim());

  if (parts.length === 0) {
    throw new Error('Invalid key combination: empty string');
  }

  // Build modifiers object and find the main key
  const modifiers = {
    control: false,
    shift: false,
    alt: false,
    meta: false
  };

  let mainKey = null;

  const modifierMap = {
    'ctrl': 'control',
    'control': 'control',
    'shift': 'shift',
    'alt': 'alt',
    'meta': 'meta',
    'cmd': 'meta',
    'command': 'meta'
  };

  for (const part of parts) {
    const lowerPart = part.toLowerCase();

    if (modifierMap[lowerPart]) {
      modifiers[modifierMap[lowerPart]] = true;
    } else {
      // This is the main key
      if (mainKey !== null) {
        throw new Error(`Invalid key combination: multiple non-modifier keys found (${mainKey}, ${part})`);
      }
      mainKey = part;
    }
  }

  if (mainKey === null) {
    throw new Error('Invalid key combination: no main key specified');
  }

  // Normalize key names: single letters should be 'KeyX' format for modifier combinations
  // But NOT for standalone keys
  if (/^[a-zA-Z]$/.test(mainKey) && (modifiers.control || modifiers.shift || modifiers.alt || modifiers.meta)) {
    mainKey = `Key${mainKey.toUpperCase()}`;
  }

  // Press modifiers down
  const modifierNames = [];
  if (modifiers.control) {
    await page.keyboard.down('Control');
    modifierNames.push('Control');
  }
  if (modifiers.shift) {
    await page.keyboard.down('Shift');
    modifierNames.push('Shift');
  }
  if (modifiers.alt) {
    await page.keyboard.down('Alt');
    modifierNames.push('Alt');
  }
  if (modifiers.meta) {
    await page.keyboard.down('Meta');
    modifierNames.push('Meta');
  }

  // Press the main key
  await page.keyboard.down(mainKey);
  await page.keyboard.up(mainKey);

  // Release modifiers in reverse order
  for (let i = modifierNames.length - 1; i >= 0; i--) {
    await page.keyboard.up(modifierNames[i]);
  }
}

/**
 * Create an element wrapper with testing utilities
 * @private
 * @param {ElementHandle} element - Puppeteer element handle
 * @param {Page} page - Puppeteer page instance
 * @returns {QueryElement} - Element wrapper with testing utilities
 */
function createElementWrapper(element, page) {
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

export async function query(selector) {
  if (typeof globalThis.browserPage === 'undefined') {
    throw new Error(
      'Page not initialized. Please call setup() first:\n' +
      '  await setup({ url: "http://localhost:3000" });'
    );
  }

  const page = globalThis.browserPage;
  const element = await page.$(selector);

  if (!element) {
    throw new Error(`Element not found: ${selector}`);
  }

  return createElementWrapper(element, page);
}

/**
 * Click an element matching the selector
 * @param {string} selector - CSS selector to click
 * @returns {Promise<void>}
 */
export async function click(selector) {
  if (typeof globalThis.browserPage === 'undefined') {
    throw new Error(
      'Page not initialized. Please call setup() first:\n' +
      '  await setup({ url: "http://localhost:3000" });'
    );
  }

  const page = globalThis.browserPage;
  const element = await page.$(selector);

  if (!element) {
    throw new Error(`Element not found: ${selector}`);
  }

  await element.click();
}

/**
 * Query all elements matching the selector
 * @param {string} selector - CSS selector to query
 * @returns {Promise<Array<QueryElement>>} - Array of element wrappers with testing utilities
 */
export async function queryAll(selector) {
  if (typeof globalThis.browserPage === 'undefined') {
    throw new Error(
      'Page not initialized. Please call setup() first:\n' +
      '  await setup({ url: "http://localhost:3000" });'
    );
  }

  const page = globalThis.browserPage;
  const elements = await page.$$(selector);

  return elements.map(element => createElementWrapper(element, page));
}

/**
 * Setup testing environment with Puppeteer for Electron apps or web apps
 * This function can launch Electron or a regular browser depending on options
 * Cleanup is handled automatically after tests complete in summary.js
 * Results are cached - calling with the same url or appPath returns the cached instance
 * @param {Object} options - Configuration options
 * @param {string} options.appPath - Path to the Electron app executable (optional if electron package is installed)
 * @param {string} options.url - URL to navigate to for web app testing (if provided, launches a regular browser instead of Electron)
 * @param {Object} options.puppeteerOptions - Additional Puppeteer launch options
 * @returns {Promise<{browser: any, page: any}>}
 */
export async function setup(options = {}) {
  const { appPath: providedAppPath, url, puppeteerOptions = {} } = options;

  // Create cache key based on url or appPath
  const cacheKey = url || providedAppPath || 'auto-detect';

  // Return cached instance if available
  if (setupCache.has(cacheKey)) {
    return setupCache.get(cacheKey);
  }

  let puppeteer;

  try {
    const puppeteerModule = await import("puppeteer");
    puppeteer = puppeteerModule.default || puppeteerModule;
  } catch {
    throw new Error(
      "puppeteer is required for testing. Install it with: npm install --save-dev puppeteer",
    );
  }

  let appPath = providedAppPath;
  let browser;

  try {
    if (url) {
      // Launch regular browser for web app testing
      browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null, // Use the browser's default viewport (full window)
        ...puppeteerOptions,
      });
    } else {
      // Launch Electron app
      // Auto-detect Electron if appPath not provided
      if (!appPath) {
        try {
          const path = await import("node:path");
          const os = await import("node:os");
          const { fileURLToPath } = await import("node:url");

          const platform = os.platform();
          const electronModule = path.dirname(
            fileURLToPath(import.meta.url),
          );
          const electronRoot = path.resolve(
            electronModule,
            "..",
            "..",
            "electron",
          );

          if (platform === "win32") {
            appPath = path.resolve(electronRoot, "dist", "electron.exe");
          } else if (platform === "darwin") {
            appPath = path.resolve(
              electronRoot,
              "dist",
              "Electron.app",
              "Contents",
              "MacOS",
              "Electron",
            );
          } else {
            appPath = path.resolve(electronRoot, "dist", "electron");
          }
        } catch {
          throw new Error(
            "Could not auto-detect Electron. Please provide appPath in options.",
          );
        }
      }

      // Verify the app file exists before attempting to launch
      try {
        const fs = await import("node:fs/promises");
        const path = await import("node:path");
        const resolvedPath = path.resolve(appPath);

        try {
          await fs.access(resolvedPath);
        } catch {
          throw new Error(
            `Electron app file not found: ${resolvedPath}\n` +
            "Please ensure:\n" +
            "  1. The file path is correct\n" +
            "  2. Your Electron app is built (run your build command)\n" +
            "  3. The file exists at the specified location",
          );
        }
      } catch (error) {
        if (error.message.includes("not found")) {
          throw error;
        }
        // If it's an import error, continue (fs/promises might not be available)
      }

      // Launch Electron
      browser = await puppeteer.launch({
        executablePath: appPath,
        defaultViewport: null, // Use the app's default viewport
        ...puppeteerOptions,
      });
    }

    // Get or create page
    const pages = await browser.pages();
    const page = pages[0] || (await browser.newPage());

    // Navigate to URL if provided
    if (url) {
      await page.goto(url, { waitUntil: "networkidle2" });
    }

    // Store the page globally for query function to access
    globalThis.browserPage = page;
    globalThis.browser = browser;

    const result = {
      browser,
      page,
    };

    // Cache the setup result
    setupCache.set(cacheKey, result);

    return result;
  } catch (error) {
    // Provide better error messages for common issues
    if (url) {
      throw new Error(
        "Failed to launch browser for web app testing.\n" +
        "Original error: " +
        error.message,
      );
    }
    if (error.message?.includes("Failed to launch")) {
      throw new Error(
        "Failed to launch Electron. Common causes:\n" +
        "  1. The Electron app file does not exist or is not built yet\n" +
        "  2. The app path in puppeteerOptions.args is incorrect\n" +
        "  3. The Electron executable path (executablePath) is wrong\n" +
        "\nOriginal error: " +
        error.message,
      );
    }
    console.error("Failed to launch with Puppeteer:", error);
    throw error;
  }
}

// Backward compatibility aliases
export const setupElectron = setup;
export const cleanupElectron = cleanup;
