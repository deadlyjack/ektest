# Electron Testing

This directory contains the Electron test implementation for ektest.

## Running the Electron Test

To test the Electron functionality:

```bash
npm run test:electron
```

This will:

1. Create a temporary Electron project with a simple UI
2. Install Electron, Puppeteer, and ektest
3. Run tests that interact with the Electron app UI
4. Clean up the temporary directory after completion

## What Gets Tested

The test script validates:

- ✅ Launching an Electron app using Puppeteer
- ✅ Querying DOM elements with `query(selector)`
- ✅ Getting `innerText` and `innerHTML` from elements
- ✅ Clicking buttons with `.click()`
- ✅ Right-clicking with `.contextMenu()`
- ✅ Typing into input fields
- ✅ Proper cleanup after tests

## Test Structure

The test creates:

- A basic Electron app with `main.js` (main process)
- An `index.html` file with interactive UI elements
- Test file (`electron.test.js`) using ektest's query API

## Requirements

The test requires these packages (installed automatically):

- `electron` - For the Electron runtime
- `puppeteer` - For browser automation
- `webpack` & `webpack-cli` - For bundling tests
