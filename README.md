# ektest 🚀

A lightweight, zero-configuration testing library for modern JavaScript applications with ES modules and bundler support.

## Why ektest?

Tired of complex configuration setups with Jest, Mocha, and other testing frameworks when working with ES modules and bundlers? ektest is designed to work out of the box with minimal to zero configuration, especially for projects using:

- ✅ ES Modules (`type: "module"`)
- ✅ Webpack bundling
- ✅ Modern JavaScript features
- ✅ Node.js testing

## Features

- 🎯 **Zero Configuration** - Works out of the box
- 📦 **Bundler Integration** - Built-in Webpack support
- 🔄 **ES Modules** - Native support for modern JavaScript
- 🎨 **Beautiful Output** - Clean, readable test results
- 🚀 **Lightweight** - Minimal dependencies
- 🔧 **Configurable** - Optional configuration when needed

## Installation

```bash
npm install ektest
```

## Quick Start

1. **Create a test file** (e.g., `math.test.js`):

```javascript
// math.test.js
test('addition should work', () => {
  expect('2 + 2', 2 + 2).toBe(4);
});

test('subtraction should work', () => {
  expect('5 - 3', 5 - 3).toBe(2);
});

test('arrays should contain elements', () => {
  expect('[1, 2, 3]', [1, 2, 3]).toHave([1, 2]);
});
```

1. **Run your tests**:

```bash
npx ektest
```

That's it! 🎉

## Available Matchers

ektest provides a comprehensive set of matchers for your assertions:

**Note:** The `expect` function takes two parameters: `expect(name, value)` where `name` is a descriptive string and `value` is the actual value to test.

```javascript
// Equality
expect('value', value).toBe(4);
expect('value', value).not.toBe(5);

// Truthiness
expect('value', value).toBeTruthy();
expect('value', value).toBeFalsy();
expect('value', value).toBeNull();
expect('value', value).toBeDefined();

// Numbers
expect('value', value).toBeGreaterThan(3);
expect('value', value).toBeLessThan(5);
expect('value', value).toBeNumber();

// Strings
expect('string', string).toMatch(/pattern/);
expect('string', string).toBeString();

// Arrays and Objects
expect('array', array).toHave(item);
expect('array', array).toHave([item1, item2]); // Multiple items
expect('array', array).toBeArray();
expect('object', object).toHave('property');
expect('object', object).toBeObject();
expect('value', value).toBeEmpty();

// Type checking
expect('value', value).toBeInstanceOf(Array);
expect('value', value).toBeBoolean();

// Inclusion
expect('value', value).toBeIn([1, 2, 3, 4]);
```

## CLI Options

```bash
# Basic usage
npx ektest

# Detailed output
npx ektest --detailed
npx ektest -d

# Summary only
npx ektest --summary
npx ektest -s
```

## Configuration

ektest works with zero configuration, but you can customize it by creating a `ektest.config.json` file:

```json
{
  "testDir": "tests",
  "bundler": "webpack",
  "bundlerConfig": "custom-webpack.config.js"
}
```

### Configuration Options

- **`testDir`** (string): Directory to search for test files (default: current directory)
- **`bundler`** (string): Bundler to use (default: "webpack")
- **`bundlerConfig`** (string): Path to custom bundler configuration

## Test File Discovery

ektest automatically finds test files with the pattern `*.test.js` in your project directory, excluding:

- `node_modules`
- `dist`
- `build`
- `coverage`
- `tools`
- `docs`
- `examples`
- `scripts`
- `vendor`
- `public`
- `assets`
- `static`
- `bin`
- `fixtures`
- `data`
- `temp`

## Examples

### Basic Test

```javascript
// calculator.test.js
test('calculator adds numbers correctly', () => {
  const result = 2 + 3;
  expect('result', result).toBe(5);
});
```

### Array and Object Tests

```javascript
// collections.test.js
test('array contains elements', () => {
  const numbers = [1, 2, 3, 4, 5];
  expect('numbers', numbers).toHave(3);
  expect('numbers', numbers).toHave([1, 2]);
});

test('object has properties', () => {
  const user = { name: 'John', age: 30 };
  expect('user', user).toHave('name');
  expect('user', user).toHave(['name', 'age']);
});
```

### Type Checking Tests

```javascript
// types.test.js
test('type checking works', () => {
  expect('hello', 'hello').toBeString();
  expect('number', 42).toBeNumber();
  expect('boolean', true).toBeBoolean();
  expect('array', [1, 2, 3]).toBeArray();
  expect('object', {}).toBeObject();
});
```

### Async Tests

```javascript
// async.test.js
test('async operation works', async () => {
  const data = await fetchData();
  expect('data', data).toBeDefined();
  expect('data', data).toBeObject();
});

test('async calculation', async () => {
  const result = await new Promise((resolve) => {
    setTimeout(() => resolve(10 + 5), 100);
  });
  expect('result', result).toBe(15);
});

test('async array processing', async () => {
  const numbers = [1, 2, 3, 4, 5];
  const doubled = await Promise.all(numbers.map(async (n) => n * 2));
  expect('doubled', doubled).toHave([2, 4, 6, 8, 10]);
  expect('doubled', doubled).toBeArray();
});
```

## Electron Testing with Puppeteer

ektest supports testing Electron applications using Puppeteer. This allows you to interact with your Electron app's UI and test user interactions.

### Installation

First, install the required dependency:

```bash
npm install --save-dev puppeteer-core
```

### Setup

Use the `setupElectron()` function to launch your Electron app and get a Puppeteer page instance. **Cleanup is handled automatically** after all tests complete - you don't need to call cleanup manually!

**Auto-detection:** If you have the `electron` package installed, `setupElectron()` will automatically detect and use it. You only need to specify `appPath` if you're testing a different Electron executable.

```javascript
test('Electron app launches', async () => {
  // Option 1: Auto-detect Electron (if electron package is installed)
  const { page } = await setupElectron({
    puppeteerOptions: {
      headless: false,
      args: ['path/to/your/main.js'], // Your app's main file
    },
  });

  // Option 2: Specify custom Electron executable
  const { page } = await setupElectron({
    appPath: 'path/to/electron.exe', // Custom Electron path
    puppeteerOptions: {
      headless: false,
      args: ['path/to/your/main.js'],
    },
  });

  // Your tests here - cleanup happens automatically!
});
```

### Query API

The `query(selector)` function allows you to find and interact with DOM elements in your Electron app.

The `waitFor(selector, options?)` function waits for an element to appear in the page before continuing.

```javascript
test('can interact with UI elements', async () => {
  await setupElectron({
    appPath: 'path/to/your/electron/app',
  });

  // Wait for an element to appear
  await waitFor('#submit-button', { timeout: 5000 });

  // Query an element
  const button = await query('#submit-button');

  // Get inner text
  const text = await button.innerText;
  expect('button text', text).toBe('Submit');

  // Get inner HTML
  const html = await button.innerHTML;
  expect('button html', html).toBeString();

  // Type into an input field
  const input = await query('#username');
  await input.type('myusername'); // Types with random human-like delays

  // Type with custom delay
  const email = await query('#email');
  await email.type('user@example.com', { delay: 50 }); // 50ms between each key

  // Click the button
  await button.click();

  // Wait for a success message to appear
  await waitFor('#success-message', { timeout: 5000, visible: true });

  // Right-click for context menu
  await button.contextMenu();
});
```

### waitFor Function

The `waitFor(selector, options?)` function waits for an element to appear in the page:

```javascript
// Wait for element to exist (default timeout: 30000ms)
await waitFor('#my-element');

// Wait with custom timeout
await waitFor('#my-element', { timeout: 5000 });

// Wait for element to be visible
await waitFor('#my-element', { visible: true });

// Wait for element to be hidden
await waitFor('#my-element', { hidden: true });
```

**Options:**

- `timeout` (number, optional): Maximum time to wait in milliseconds (default: 30000)
- `visible` (boolean, optional): Wait for element to be visible (default: false)
- `hidden` (boolean, optional): Wait for element to be hidden (default: false)

### Query Element Methods

The object returned by `query()` provides the following methods and properties:

- **`innerText`** (Promise<string>): Get the inner text content of the element
- **`innerHTML`** (Promise<string>): Get the inner HTML of the element
- **`click()`** (Promise<void>): Click the element
- **`contextMenu()`** (Promise<void>): Right-click the element to open context menu
- **`type(text, options?)`** (Promise<void>): Type text into the element with human-like delays
  - `text` (string): The text to type
  - `options.delay` (number, optional): Delay between keystrokes in milliseconds. If not specified, uses random delays between 50-150ms to mimic human typing
- **`element`** (ElementHandle): Access the raw Puppeteer element for advanced operations
- **`puppeteer`** (Page): Access the Puppeteer page instance for complex testing scenarios

### Complete Example

```javascript
// electron-app.test.js
test('Electron app full workflow', async () => {
  const { page } = await setupElectron({
    appPath: './dist/electron/MyApp.exe',
    puppeteerOptions: {
      headless: false,
    },
  });

  // Verify app title
  const title = await query('#app-title');
  const titleText = await title.innerText;
  expect('app title', titleText).toBe('My Awesome App');

  // Fill in a form with human-like typing
  const nameInput = await query('input[name="username"]');
  await nameInput.click();
  await nameInput.type('testuser'); // Types with random delays (50-150ms)

  const emailInput = await query('input[name="email"]');
  await emailInput.click();
  await emailInput.type('test@example.com', { delay: 30 }); // Types with 30ms delay

  // Submit the form
  const submitButton = await query('button[type="submit"]');
  await submitButton.click();

  // Wait for result
  await page.waitForSelector('#success-message');

  // Verify success message
  const successMsg = await query('#success-message');
  const msgText = await successMsg.innerText;
  expect('success message', msgText).toMatch(/success/i);
});
```

### Advanced Testing with Puppeteer

For complex testing scenarios, you can access the Puppeteer page instance directly:

```javascript
test('Advanced Puppeteer operations', async () => {
  const { page } = await setupElectron({
    appPath: './dist/electron/MyApp.exe',
  });

  // Query an element
  const button = await query('#my-button');

  // Access Puppeteer page for advanced operations
  const puppeteerPage = button.puppeteer;

  // Take a screenshot
  await puppeteerPage.screenshot({ path: 'screenshot.png' });

  // Evaluate JavaScript in the page context
  const result = await puppeteerPage.evaluate(() => {
    return window.someGlobalVariable;
  });

  // Wait for navigation
  await Promise.all([puppeteerPage.waitForNavigation(), button.click()]);

  // Emulate network conditions
  const client = await puppeteerPage.target().createCDPSession();
  await client.send('Network.emulateNetworkConditions', {
    offline: false,
    downloadThroughput: (200 * 1024) / 8,
    uploadThroughput: (200 * 1024) / 8,
    latency: 20,
  });
});
```

### Best Practices

1. **Automatic cleanup**: Cleanup is handled automatically after tests complete - no need for manual cleanup calls!
2. **Wait for elements**: Use `page.waitForSelector()` when waiting for dynamic content
3. **Access raw Puppeteer**: Use `.element` property to access the raw Puppeteer ElementHandle for advanced operations
4. **Use puppeteer getter**: Access `.puppeteer` to get the full Puppeteer page instance for complex scenarios like screenshots, network emulation, or CDP sessions

## Project Structure

```text
your-project/
├── src/
│   ├── math.js
│   └── utils.js
├── tests/
│   ├── math.test.js
│   └── utils.test.js
├── package.json
└── ektest.config.json (optional)
```

## Roadmap

- 🎯 **More Matchers** - Add toEqual, toThrow, toContain, and promise matchers
- 🌐 **Browser Testing** - Run tests in real browsers
- 📊 **Code Coverage** - Built-in coverage reporting
- 🔄 **More Bundlers** - Support for Vite, Rollup, esbuild
- 🎯 **Test Runners** - Parallel test execution
- 📸 **Snapshot Testing** - Visual regression testing
- 🔍 **Test Debugging** - Better debugging experience

## Why Choose ektest?

### Before (with other frameworks)

```javascript
// Complex configuration required
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  globals: {
    'ts-jest': {
      useESM: true,
    },
  },
  moduleNameMapping: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
};
```

### After (with ektest)

```bash
npm install ektest
npx ektest
```

## Contributing

We welcome contributions! Please feel free to submit issues and pull requests.

## License

MIT © Ajit Kumar

---

**Made with ❤️ for developers who want to focus on writing tests, not configuring them.**
