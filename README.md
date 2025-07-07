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
  expect(2 + 2).toBe(4);
});

test('subtraction should work', () => {
  expect(5 - 3).toBe(2);
});

test('arrays should be equal', () => {
  expect([1, 2, 3]).toEqual([1, 2, 3]);
});
```

1. **Run your tests**:

```bash
npx ektest
```

That's it! 🎉

## Available Matchers

ektest provides a comprehensive set of matchers for your assertions:

```javascript
// Equality
expect(value).toBe(4);
expect(value).toEqual([1, 2, 3]);
expect(value).not.toBe(5);

// Truthiness
expect(value).toBeTruthy();
expect(value).toBeFalsy();
expect(value).toBeNull();
expect(value).toBeUndefined();
expect(value).toBeDefined();

// Numbers
expect(value).toBeGreaterThan(3);
expect(value).toBeGreaterThanOrEqual(4);
expect(value).toBeLessThan(5);
expect(value).toBeLessThanOrEqual(4);
expect(value).toBeCloseTo(4.2, 1);

// Strings
expect(string).toMatch(/pattern/);
expect(string).toContain('substring');

// Arrays and Objects
expect(array).toContain(item);
expect(array).toHaveLength(3);
expect(object).toHaveProperty('key');
expect(object).toHaveProperty('key', 'value');

// Functions
expect(fn).toThrow();
expect(fn).toThrow('error message');
expect(fn).toThrow(ErrorClass);

// Promises
await expect(promise).resolves.toBe(value);
await expect(promise).rejects.toThrow();
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
  expect(result).toBe(5);
});
```

### Async Tests

```javascript
// async.test.js
test('async operation works', async () => {
  const result = await fetchData();
  expect(result).toBeDefined();
});

test('promise resolves correctly', async () => {
  await expect(fetchUser(1)).resolves.toHaveProperty('name');
});
```

### Error Testing

```javascript
// errors.test.js
test('function throws error', () => {
  expect(() => {
    throw new Error('Something went wrong');
  }).toThrow('Something went wrong');
});
```

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
      useESM: true
    }
  },
  moduleNameMapping: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  }
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
